import { usersRepository } from '../../../domain/repositories/usersRepository.js';
import { userProfilesRepository } from '../../../domain/repositories/userProfilesRepository.js';
import { userExtraFieldsRepository } from '../../../domain/repositories/userExtraFieldsRepository.js';
import { usersReadRepository } from '../../../domain/repositories/usersReadRepository.js';
import { auditRepository } from '../../../domain/repositories/auditRepository.js';
import { getPool } from '../../../infrastructure/db/mysqlPool.js';

export class UpdateUserHandler {
    async handle(command) {
        const pool = getPool();
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const { tenant_id, user_id, payload } = command;

            // Verify user exists and belongs to tenant
            const user = await usersRepository.findById(user_id);
            if (!user || user.tenant_id !== tenant_id) {
                throw new Error('User not found or access denied');
            }

            // Update user basic info
            if (payload.first_name || payload.last_name || payload.email || payload.phone) {
                const profile = await userProfilesRepository.findByUserId(user_id);
                if (profile) {
                    await userProfilesRepository.update({
                        user_id,
                        first_name: payload.first_name || profile.first_name,
                        last_name: payload.last_name || profile.last_name,
                        email: payload.email || profile.email,
                        phone: payload.phone || profile.phone
                    });
                }
            }

            // Update extra fields if provided
            if (payload.extra_fields) {
                for (const [field_name, field_value] of Object.entries(payload.extra_fields)) {
                    await userExtraFieldsRepository.upsert({
                        user_id,
                        field_name,
                        field_value
                    });
                }
            }

            // Audit event
            await auditRepository.log({
                tenant_id,
                entity_type: 'USER',
                entity_id: user_id,
                action: 'UPDATE',
                performed_by: user_id, // In real scenario, should be current admin user
                details: JSON.stringify(payload)
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
