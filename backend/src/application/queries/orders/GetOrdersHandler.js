
import { ordersReadRepository } from '../../../domain/repositories/ordersReadRepository.js';

export class GetOrdersHandler {
    async handle(query) {
        const { tenant_id, payload } = query;
        const { filters, page, limit } = payload;
        if (!tenant_id) {
            const error = new Error('tenant_id is required');
            error.statusCode = 400;
            throw error;
        }
        return ordersReadRepository.list({ tenant_id, filters, page, limit });
    }
}
