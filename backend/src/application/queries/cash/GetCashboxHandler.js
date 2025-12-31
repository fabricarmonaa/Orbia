import { cashboxReadRepository } from '../../../domain/repositories/cashboxReadRepository.js';

export class GetCashboxHandler {
  async handle(query) {
    const { tenant_id, payload } = query;
    if (!tenant_id) {
      const error = new Error('tenant_id is required');
      error.statusCode = 400;
      throw error;
    }
    const { filters = {}, page = 1, limit = 20 } = payload || {};
    return cashboxReadRepository.list({ tenant_id, filters, page, limit });
  }
}
