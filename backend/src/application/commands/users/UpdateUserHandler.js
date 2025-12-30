import { usersRepository } from '../../../domain/repositories/usersRepository.js';
import { userProfilesRepository } from '../../../domain/repositories/userProfilesRepository.js';
import { usersReadRepository } from '../../../domain/repositories/usersReadRepository.js';
import { auditEventsRepository } from '../../../domain/repositories/auditEventsRepository.js';
import { withTransaction } from '../../../infrastructure/db/mysqlPool.js';

export class UpdateUserHandler {
    async handle(command) {
        const { tenant_id, user_id, payload } = command;

        return withTransaction(async connection => {
            const user = await usersRepository.findById(user_id, tenant_id, { conn: connection });
            if (!user) {
                const error = new Error('User not found');
                error.statusCode = 404;
                throw error;
            }

            await usersRepository.update({ id: user_id, tenant_id, role: payload.role, active: payload.active ? 1 : 0 }, { conn: connection });

            await userProfilesRepository.update({
                user_id,
                first_name: payload.first_name,
                last_name: payload.last_name,
                email: payload.email,
                phone: payload.phone
            }, connection);

            await auditEventsRepository.append({
                tenant_id,
                aggregate_id: user_id,
                type: 'USER_UPDATED',
                payload: {
                    role: payload.role,
                    active: payload.active,
                    profile: {
                        first_name: payload.first_name,
                        last_name: payload.last_name,
                        email: payload.email,
                        phone: payload.phone
                    }
                }
            }, { conn: connection });

            await usersReadRepository.refreshFromSources(tenant_id, user_id, { conn: connection });

            return { updated: true };
        });
    }
}
