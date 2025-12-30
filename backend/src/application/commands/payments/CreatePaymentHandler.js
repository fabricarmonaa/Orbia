import { paymentsRepository } from '../../../domain/repositories/paymentsRepository.js';
import { paymentMethodsRepository } from '../../../domain/repositories/paymentMethodsRepository.js';
import { auditEventsRepository } from '../../../domain/repositories/auditEventsRepository.js';
import { ordersRepository } from '../../../domain/repositories/ordersRepository.js';
import { getPool } from '../../../infrastructure/db/mysqlPool.js';

export class CreatePaymentHandler {
    async handle(command) {
        const { tenant_id, payload } = command;

        // payload: { user_id, method_code (or method_id), amount, order_id (optional to link) }

        // 1. Resolve Payment Method
        let methodId = payload.method_id;
        if (!methodId && payload.method_code) {
            const method = await paymentMethodsRepository.findByCode(tenant_id, payload.method_code);
            if (!method) {
                throw Object.assign(new Error(`Invalid payment method code: ${payload.method_code}`), { statusCode: 400 });
            }
            methodId = method.id;
        }

        if (!methodId) {
            throw Object.assign(new Error('Payment method is required'), { statusCode: 400 });
        }

        // 2. Create Payment
        const payment = await paymentsRepository.create({
            tenant_id,
            user_id: payload.user_id,
            method_id: methodId,
            amount: payload.amount
        });

        // 3. Link to Order if provided
        if (payload.order_id) {
            // Check order existence - simple check
            const order = await ordersRepository.findById(payload.order_id, tenant_id);
            if (order) {
                await getPool().execute(
                    'INSERT INTO payment_orders (payment_id, order_id) VALUES (?, ?)',
                    [payment.id, payload.order_id]
                );
            }
        }

        // 4. Audit
        await auditEventsRepository.append({
            tenant_id,
            aggregate_id: payment.id,
            type: 'PAYMENT_CREATED',
            payload: { ...payload, payment_id: payment.id }
        });

        // TODO: Update Cash Session here if implementing that level of integration

        return { id: payment.id };
    }
}
