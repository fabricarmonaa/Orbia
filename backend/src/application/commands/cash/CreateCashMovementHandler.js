import { cashMovementsRepository } from '../../../domain/repositories/cashMovementsRepository.js';
import { cashboxReadRepository } from '../../../domain/repositories/cashboxReadRepository.js';
import { auditEventsRepository } from '../../../domain/repositories/auditEventsRepository.js';
import { withTransaction } from '../../../infrastructure/db/mysqlPool.js';
import { paymentMethodsRepository } from '../../../domain/repositories/paymentMethodsRepository.js';
import { cashCategoriesRepository } from '../../../domain/repositories/cashCategoriesRepository.js';
import { CashMovement } from '../../../domain/entities/CashMovement.js';

export class CreateCashMovementHandler {
    async handle(command) {
        const { tenant_id, payload } = command;
        if (!tenant_id) {
            const error = new Error('tenant_id is required');
            error.statusCode = 400;
            throw error;
        }

        const { type, category, method_code, amount, user_id = null, note = '' } = payload || {};
        const movement = CashMovement.create({ tenantId: tenant_id, type, category, methodCode: method_code, amount, userId: user_id, note });
        const signedAmount = movement.type === 'EXPENSE' ? -Math.abs(movement.amount) : Math.abs(movement.amount);

        return withTransaction(async conn => {
            const method = await paymentMethodsRepository.findByCode(tenant_id, movement.methodCode, { conn });
            if (!method) {
                const error = new Error('Payment method not found');
                error.statusCode = 400;
                throw error;
            }

            const categoryRecord = await cashCategoriesRepository.ensureCategory({
                tenant_id,
                name: movement.category,
                type: movement.type
            }, { conn });

            const created = await cashMovementsRepository.create({
                tenant_id,
                category_id: categoryRecord.id,
                method_id: method.id,
                amount: signedAmount,
                note: movement.note
            }, { conn });

            await auditEventsRepository.append({
                tenant_id,
                aggregate_id: created.id,
                type: 'CASH_MOVEMENT_CREATED',
                payload: { type: movement.type, category: movement.category, amount: signedAmount, method_code: movement.methodCode, note: movement.note }
            }, { conn });

            await cashboxReadRepository.refreshFromSources(tenant_id, created.id, { conn });

            return { movement_id: created.id };
        });
    }
}
