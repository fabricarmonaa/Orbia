
import { ordersRepository } from '../../../domain/repositories/ordersRepository.js';
import { orderItemsRepository } from '../../../domain/repositories/orderItemsRepository.js';
import { ordersReadRepository } from '../../../domain/repositories/ordersReadRepository.js';
import { auditEventsRepository } from '../../../domain/repositories/auditEventsRepository.js';
import { orderStatusesRepository } from '../../../domain/repositories/orderStatusesRepository.js';
import { withTransaction } from '../../../infrastructure/db/mysqlPool.js';

export class CreateOrderHandler {
    async handle(command) {
        const { tenant_id, payload } = command;

        return withTransaction(async connection => {
            // Validate Status
            const status = await orderStatusesRepository.findByCode(tenant_id, payload.status_code);
            if (!status) {
                throw Object.assign(new Error('Invalid status code'), { statusCode: 400 });
            }

            const order = await ordersRepository.create({
                tenant_id,
                user_id: payload.user_id,
                status_id: status.id,
                internal_notes: payload.internal_notes || '',
                user_notes: payload.user_notes || '',
                branch_id: payload.branch_id || null
            }, connection);

            if (payload.items && payload.items.length) {
                await orderItemsRepository.insertMany(order.id, payload.items, connection);
            }

            await auditEventsRepository.append({
                tenant_id,
                aggregate_id: order.id,
                type: 'ORDER_CREATED',
                payload
            }, connection);

            await ordersReadRepository.refreshFromSources(tenant_id, order.id, connection);

            return { order_id: order.id };
        });
    }
}
