import { usersRepository } from '../../../domain/repositories/usersRepository.js';
import { usersReadRepository } from '../../../domain/repositories/usersReadRepository.js';
import { auditRepository } from '../../../domain/repositories/auditRepository.js';
import { getPool } from '../../../infrastructure/db/mysqlPool.js';

export class DeactivateUserHandler {
    async handle(command) {
        const pool = getPool();
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const { tenant_id, user_id } = command;

            // Verify user exists and belongs to tenant
            const user = await usersRepository.findById(user_id);
            if (!user || user.tenant_id !== tenant_id) {
                throw new Error('User not found or access denied');
            }

            // Deactivate user
            await usersRepository.updateActive(user_id, false);

            // Audit event
            await auditRepository.log({
                tenant_id,
                entity_type: 'USER',
                entity_id: user_id,
                action: 'DEACTIVATE',
                performed_by: user_id,
                details: JSON.stringify({ deactivated: true })
            });

            // Refresh read model
            await usersReadRepository.refreshOne(user_id);

            await connection.commit();

            return { success: true, user_id };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}
