import * as usersRepository from '../../../domain/repositories/usersRepository.js';
import { userProfilesRepository } from '../../../domain/repositories/userProfilesRepository.js';
import { userExtraFieldsRepository } from '../../../domain/repositories/userExtraFieldsRepository.js';
import { userExtraValuesRepository } from '../../../domain/repositories/userExtraValuesRepository.js';
import { usersReadRepository } from '../../../domain/repositories/usersReadRepository.js';
import { auditEventsRepository } from '../../../domain/repositories/auditEventsRepository.js';
import { hashPassword } from '../../../infrastructure/security/password.js';
import { withTransaction } from '../../../infrastructure/db/mysqlPool.js';
export class CreateUserHandler {
  async handle(command) {
    const { tenant_id, payload } = command;

    return withTransaction(async (connection) => {
      const existing = await usersRepository.usersRepository.findByDniWithinTenant(
        tenant_id,
        payload.dni,
        connection
      );

      if (existing) {
        const error = new Error('User already exists');
        error.statusCode = 409;
        throw error;
      }

      const password_hash = await hashPassword(payload.password);

      const user = await usersRepository.usersRepository.create(
        {
          tenant_id,
          dni: payload.dni,
          role: payload.role,
          password_hash,
          active: 1
        },
        connection
      );

      await userProfilesRepository.create(
        {
          user_id: user.id,
          first_name: payload.first_name,
          last_name: payload.last_name,
          email: payload.email,
          phone: payload.phone
        },
        connection
      );

      const extraFieldsEntries = await userExtraFieldsRepository.findByNames(
        tenant_id,
        Object.keys(payload.extra_fields || {}),
        connection
      );

      if (extraFieldsEntries.length > 0) {
        const extraValues = extraFieldsEntries.map(field => ({
          field_id: field.field_id,
          value: payload.extra_fields[field.name]
        }));

        await userExtraValuesRepository.upsertMany(
          user.id,
          extraValues,
          connection
        );
      }

      await auditEventsRepository.append(
        {
          tenant_id,
          aggregate_id: user.id,
          type: 'USER_CREATED',
          payload: {
            dni: payload.dni,
            role: payload.role,
            profile: {
              first_name: payload.first_name,
              last_name: payload.last_name,
              email: payload.email,
              phone: payload.phone
            },
            extra_fields: payload.extra_fields || {}
          }
        },
        connection
      );

      await usersReadRepository.refreshFromSources(
        tenant_id,
        user.id,
        connection
      );

      return { user_id: user.id };
    });
  }
}
