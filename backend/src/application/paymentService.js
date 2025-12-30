import { paymentsRepository } from '../domain/repositories/paymentsRepository.js';
import { paymentOrdersRepository } from '../domain/repositories/paymentOrdersRepository.js';
import { paymentMethodsRepository } from '../domain/repositories/paymentMethodsRepository.js';
import { paymentsReadRepository } from '../domain/repositories/paymentsReadRepository.js';
import { ordersRepository } from '../domain/repositories/ordersRepository.js';
import { usersRepository } from '../domain/repositories/usersRepository.js';
import { usersReadRepository } from '../domain/repositories/usersReadRepository.js';
import { auditEventsRepository } from '../domain/repositories/auditEventsRepository.js';
import { withTransaction } from '../infrastructure/db/mysqlPool.js';

export const paymentService = {
  async registerPayment({ tenant_id, user_id, method_code, amount, order_ids = [] }) {
    return withTransaction(async connection => {
      const user = await usersRepository.findById(user_id, tenant_id);
      if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
      }
      const method = await paymentMethodsRepository.findByCode(tenant_id, method_code);
      if (!method) {
        const error = new Error('Payment method not found');
        error.statusCode = 400;
        throw error;
      }
      for (const orderId of order_ids) {
        const order = await ordersRepository.findById(orderId, tenant_id);
        if (!order) {
          const error = new Error('Order not found in tenant');
          error.statusCode = 404;
          throw error;
        }
      }
      const payment = await paymentsRepository.create(
        { tenant_id, user_id, method_id: method.id, amount },
        connection
      );
      await paymentOrdersRepository.link(payment.id, order_ids, connection);
      await auditEventsRepository.append(
        {
          tenant_id,
          aggregate_id: payment.id,
          type: 'PAYMENT_REGISTERED',
          payload: { user_id, method_code, amount, order_ids }
        },
        connection
      );
      await paymentsReadRepository.refreshFromSources(tenant_id, payment.id, connection);
      await usersReadRepository.refreshFromSources(tenant_id, user_id, connection);
      return payment;
    });
  }
};
