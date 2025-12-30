import { paymentsRepository } from '../../../domain/repositories/paymentsRepository.js';
import { cashMovementsRepository } from '../../../domain/repositories/cashMovementsRepository.js';
import { paymentsReadRepository } from '../../../domain/repositories/paymentsReadRepository.js';
import { cashboxReadRepository } from '../../../domain/repositories/cashboxReadRepository.js';
import { auditRepository } from '../../../domain/repositories/auditRepository.js';
import { generateId } from '../../../domain/utils/id.js';
import { getPool } from '../../../infrastructure/db/mysqlPool.js';

export class RegisterPaymentHandler {
    async handle(command) {
        const pool = getPool();
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const { tenant_id, user_id, amount, method_code, order_ids, note } = command;

            const payment_id = generateId();

            // Create payment
            await paymentsRepository.create({
                id: payment_id,
                tenant_id,
                user_id,
                amount,
                method: method_code,
                paid_at: new Date(),
                status: 'COMPLETED',
                note
            });

            // Link to orders if provided
            if (order_ids && order_ids.length > 0) {
                for (const order_id of order_ids) {
                    await connection.execute(
                        'INSERT INTO payment_order_links (payment_id, order_id) VALUES (?, ?)',
                        [payment_id, order_id]
                    );
                }
            }

            // Create cash movement (INCOME from payment)
            await cashMovementsRepository.create({
                id: generateId(),
                tenant_id,
                type: 'INCOME',
                category: 'PAYMENT',
                method: method_code,
                amount,
                user_id,
                payment_id,
                note: `Pago de cliente: ${note}`,
                occurred_at: new Date()
            });

            // Audit event
            await auditRepository.log({
                tenant_id,
                entity_type: 'PAYMENT',
                entity_id: payment_id,
                action: 'REGISTER',
                performed_by: user_id,
                details: JSON.stringify({ amount, method: method_code, order_ids })
            });

            // Refresh read models
            await paymentsReadRepository.refreshOne(payment_id);
            await cashboxReadRepository.refresh(tenant_id);

            await connection.commit();

            return { success: true, payment_id };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}
