import { paymentsRepository } from '../../../domain/repositories/paymentsRepository.js';
import { paymentOrdersRepository } from '../../../domain/repositories/paymentOrdersRepository.js';
import { paymentMethodsRepository } from '../../../domain/repositories/paymentMethodsRepository.js';
import { paymentsReadRepository } from '../../../domain/repositories/paymentsReadRepository.js';
import { ordersRepository } from '../../../domain/repositories/ordersRepository.js';
import { usersRepository } from '../../../domain/repositories/usersRepository.js';
import { usersReadRepository } from '../../../domain/repositories/usersReadRepository.js';
import { auditEventsRepository } from '../../../domain/repositories/auditEventsRepository.js';
import { withTransaction } from '../../../infrastructure/db/mysqlPool.js';
import { Payment } from '../../../domain/entities/Payment.js';

export class RegisterPaymentHandler {
  async handle(command) {
    const { tenant_id, payload } = command;
    if (!tenant_id) {
      const error = new Error('tenant_id is required');
      error.statusCode = 400;
      throw error;
    }

    const { user_id, amount, method_code, order_ids = [], note = '' } = payload || {};
    const payment = Payment.create({
      tenantId: tenant_id,
      userId: user_id,
      methodCode: method_code,
      amount,
      note
    });

    return withTransaction(async conn => {
      const user = await usersRepository.findById(payment.userId, tenant_id, { conn });
      if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
      }

      const method = await paymentMethodsRepository.findByCode(tenant_id, payment.methodCode, { conn });
      if (!method) {
        const error = new Error('Payment method not found');
        error.statusCode = 400;
        throw error;
      }

      for (const orderId of order_ids) {
        const order = await ordersRepository.findById(orderId, tenant_id, { conn });
        if (!order) {
          const error = new Error('Order not found for tenant');
          error.statusCode = 404;
          throw error;
        }
      }

      const created = await paymentsRepository.create({
        tenant_id,
        user_id: payment.userId,
        method_id: method.id,
        amount: payment.amount,
        note: payment.note
      }, { conn });

      await paymentOrdersRepository.link(created.id, order_ids, { conn });

      await auditEventsRepository.append({
        tenant_id,
        aggregate_id: created.id,
        type: 'PAYMENT_REGISTERED',
        payload: { user_id: payment.userId, amount: payment.amount, method_code: payment.methodCode, order_ids, note: payment.note }
      }, { conn });

      await paymentsReadRepository.refreshFromSources(tenant_id, created.id, { conn });
      await usersReadRepository.refreshFromSources(tenant_id, payment.userId, { conn });

      return { payment_id: created.id };
    });
  }
}
