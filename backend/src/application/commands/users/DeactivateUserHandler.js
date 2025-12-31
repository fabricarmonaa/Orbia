import { usersRepository } from '../../../domain/repositories/usersRepository.js';
import { usersReadRepository } from '../../../domain/repositories/usersReadRepository.js';
import { auditEventsRepository } from '../../../domain/repositories/auditEventsRepository.js';
import { withTransaction } from '../../../infrastructure/db/mysqlPool.js';

export class DeactivateUserHandler {
    async handle(command) {
        const { tenant_id, user_id } = command;

        return withTransaction(async connection => {
            const user = await usersRepository.findById(user_id, tenant_id, { conn: connection });
            if (!user) {
                const error = new Error('User not found');
                error.statusCode = 404;
                throw error;
            }

            await usersRepository.update({ id: user_id, tenant_id, active: 0, role: user.role }, { conn: connection });

            await auditEventsRepository.append({
                tenant_id,
                aggregate_id: user_id,
                type: 'USER_DEACTIVATED',
                payload: { active: false }
            }, { conn: connection });

            await usersReadRepository.refreshFromSources(tenant_id, user_id, { conn: connection });

            return { success: true, user_id };
        });
    }
}
