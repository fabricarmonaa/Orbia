import { cashCategoriesRepository } from '../domain/repositories/cashCategoriesRepository.js';
import { cashMovementsRepository } from '../domain/repositories/cashMovementsRepository.js';
import { paymentMethodsRepository } from '../domain/repositories/paymentMethodsRepository.js';
import { cashboxReadRepository } from '../domain/repositories/cashboxReadRepository.js';
import { auditEventsRepository } from '../domain/repositories/auditEventsRepository.js';
import { withTransaction } from '../infrastructure/db/mysqlPool.js';

export const cashService = {
  async createMovement({ tenant_id, category_id, category_name, type, method_code, amount, note }) {
    return withTransaction(async connection => {
      let category;
      if (category_id) {
        category = await cashCategoriesRepository.findById(category_id, tenant_id);
      } else if (category_name && type) {
        category = await cashCategoriesRepository.ensureCategory({ tenant_id, name: category_name, type });
      }
      if (!category) {
        const error = new Error('Category not found');
        error.statusCode = 404;
        throw error;
      }
      const method = await paymentMethodsRepository.findByCode(tenant_id, method_code);
      if (!method) {
        const error = new Error('Payment method not found');
        error.statusCode = 400;
        throw error;
      }
      const movement = await cashMovementsRepository.create(
        { tenant_id, category_id: category.id, method_id: method.id, amount, note },
        connection
      );
      await auditEventsRepository.append(
        {
          tenant_id,
          aggregate_id: movement.id,
          type: 'CASH_MOVEMENT_CREATED',
          payload: { category_id: category.id, method_code, amount, note }
        },
        connection
      );
      await cashboxReadRepository.refreshFromSources(tenant_id, movement.id, connection);
      return movement;
    });
  }
};
