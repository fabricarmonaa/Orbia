
import { ordersRepository } from '../../../domain/repositories/ordersRepository.js';
import { orderItemsRepository } from '../../../domain/repositories/orderItemsRepository.js';
import { ordersReadRepository } from '../../../domain/repositories/ordersReadRepository.js';
import { auditEventsRepository } from '../../../domain/repositories/auditEventsRepository.js';
import { orderStatusesRepository } from '../../../domain/repositories/orderStatusesRepository.js';
import { withTransaction } from '../../../infrastructure/db/mysqlPool.js';
import { Order } from '../../../domain/entities/Order.js';

export class CreateOrderHandler {
    async handle(command) {
        const { tenant_id, payload } = command;

        if (!tenant_id) {
            const error = new Error('tenant_id is required');
            error.statusCode = 400;
            throw error;
        }

        return withTransaction(async connection => {
            const status = await orderStatusesRepository.findByCode(tenant_id, payload.status_code, { conn: connection });
            if (!status) {
                throw Object.assign(new Error('Invalid status code'), { statusCode: 400 });
            }

            const order = Order.create({
                tenantId: tenant_id,
                userId: payload.user_id,
                statusId: status.id,
                internalNotes: payload.internal_notes || '',
                userNotes: payload.user_notes || '',
                branchId: payload.branch_id || null,
                items: payload.items || []
            });

            const created = await ordersRepository.create({
                tenant_id: order.tenantId,
                user_id: order.userId,
                status_id: order.statusId,
                internal_notes: order.internalNotes,
                user_notes: order.userNotes,
                branch_id: order.branchId
            }, { conn: connection });

            await orderItemsRepository.insertMany(created.id, order.items, { conn: connection });

            await auditEventsRepository.append({
                tenant_id,
                aggregate_id: created.id,
                type: 'ORDER_CREATED',
                payload: {
                    status_code: payload.status_code,
                    user_id: order.userId,
                    items: order.items
                }
            }, { conn: connection });

            await ordersReadRepository.refreshFromSources(tenant_id, created.id, { conn: connection });

            return { order_id: created.id };
        });
    }
}
