import { paymentsReadRepository } from '../../../domain/repositories/paymentsReadRepository.js';

export class GetPaymentsHandler {
  async handle(query) {
    const { tenant_id, payload } = query;
    if (!tenant_id) {
      const error = new Error('tenant_id is required');
      error.statusCode = 400;
      throw error;
    }
    const { user_id, page = 1, limit = 20 } = payload || {};
    return paymentsReadRepository.list({ tenant_id, user_id, page, limit });
  }
}
