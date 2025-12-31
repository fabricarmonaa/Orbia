import { paymentsRepository } from '../../../domain/repositories/paymentsRepository.js';
import { paymentMethodsRepository } from '../../../domain/repositories/paymentMethodsRepository.js';
import { auditEventsRepository } from '../../../domain/repositories/auditEventsRepository.js';
import { ordersRepository } from '../../../domain/repositories/ordersRepository.js';
import { paymentOrdersRepository } from '../../../domain/repositories/paymentOrdersRepository.js';
import { paymentsReadRepository } from '../../../domain/repositories/paymentsReadRepository.js';
import { usersRepository } from '../../../domain/repositories/usersRepository.js';
import { usersReadRepository } from '../../../domain/repositories/usersReadRepository.js';
import { withTransaction } from '../../../infrastructure/db/mysqlPool.js';
import { Payment } from '../../../domain/entities/Payment.js';

export class CreatePaymentHandler {
    async handle(command) {
        const { tenant_id, payload } = command;
        if (!tenant_id) {
            const error = new Error('tenant_id is required');
            error.statusCode = 400;
            throw error;
        }

        const { user_id, method_code, amount, order_id = null, note = '' } = payload || {};
        const payment = Payment.create({ tenantId: tenant_id, userId: user_id, methodCode: method_code, amount, note });

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

            if (order_id) {
                const order = await ordersRepository.findById(order_id, tenant_id, { conn });
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

            if (order_id) {
                await paymentOrdersRepository.link(created.id, [order_id], { conn });
            }

            await auditEventsRepository.append({
                tenant_id,
                aggregate_id: created.id,
                type: 'PAYMENT_CREATED',
                payload: { user_id: payment.userId, method_code: payment.methodCode, amount: payment.amount, order_id, note: payment.note }
            }, { conn });

            await paymentsReadRepository.refreshFromSources(tenant_id, created.id, { conn });
            await usersReadRepository.refreshFromSources(tenant_id, payment.userId, { conn });

            return { id: created.id };
        });
    }
}
