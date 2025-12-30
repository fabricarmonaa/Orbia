
import { ordersReadRepository } from '../../../domain/repositories/ordersReadRepository.js';

export class GetOrdersHandler {
    async handle(query) {
        const { tenant_id, payload } = query;
        const { filters, page, limit } = payload;
        return ordersReadRepository.list({ tenant_id, filters, page, limit });
    }
}
