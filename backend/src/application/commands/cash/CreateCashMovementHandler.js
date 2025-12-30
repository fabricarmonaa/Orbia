import { cashMovementsRepository } from '../../../domain/repositories/cashMovementsRepository.js';
import { cashboxReadRepository } from '../../../domain/repositories/cashboxReadRepository.js';
import { auditRepository } from '../../../domain/repositories/auditRepository.js';
import { generateId } from '../../../domain/utils/id.js';
import { getPool } from '../../../infrastructure/db/mysqlPool.js';

export class CreateCashMovementHandler {
    async handle(command) {
        const pool = getPool();
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const { tenant_id, type, category, method_code, amount, user_id, note } = command;

            const movement_id = generateId();

            // Create cash movement
            await cashMovementsRepository.create({
                id: movement_id,
                tenant_id,
                type,
                category,
                method: method_code,
                amount,
                user_id,
                note,
                occurred_at: new Date()
            });

            // Audit event
            await auditRepository.log({
                tenant_id,
                entity_type: 'CASH_MOVEMENT',
                entity_id: movement_id,
                action: 'CREATE',
                performed_by: user_id || 'SYSTEM',
                details: JSON.stringify({ type, category, amount, method: method_code })
            });

            // Refresh cash read model
            await cashboxReadRepository.refresh(tenant_id);

            await connection.commit();

            return { success: true, movement_id };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}
