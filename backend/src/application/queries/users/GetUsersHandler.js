
import { usersReadRepository } from '../../../domain/repositories/usersReadRepository.js';

export class GetUsersHandler {
    async handle(query) {
        const { tenant_id, payload } = query;
        const { filters, page, limit } = payload;

        return usersReadRepository.list({ tenant_id, filters, page, limit });
    }
}
