import { ordersRepository } from '../../../domain/repositories/ordersRepository.js';
import { orderStatusesRepository } from '../../../domain/repositories/orderStatusesRepository.js';
import { orderStatusTransitionsRepository } from '../../../domain/repositories/orderStatusTransitionsRepository.js';
import { orderStatusHistoryRepository } from '../../../domain/repositories/orderStatusHistoryRepository.js';
import { auditEventsRepository } from '../../../domain/repositories/auditEventsRepository.js';
import { ordersReadRepository } from '../../../domain/repositories/ordersReadRepository.js';
import { withTransaction } from '../../../infrastructure/db/mysqlPool.js';
import { Order } from '../../../domain/entities/Order.js';

export class UpdateOrderStatusHandler {
  async handle(command) {
    const { tenant_id, payload } = command;
    const { order_id, status_code } = payload;

    if (!tenant_id) {
      const error = new Error('tenant_id is required');
      error.statusCode = 400;
      throw error;
    }

    return withTransaction(async connection => {
      const existing = await ordersRepository.findById(order_id, tenant_id, { conn: connection });
      if (!existing) {
        const error = new Error('Order not found');
        error.statusCode = 404;
        throw error;
      }

      const order = Order.hydrate(existing);
      order.ensureTenant(tenant_id);

      const targetStatus = await orderStatusesRepository.findByCode(tenant_id, status_code, { conn: connection });
      if (!targetStatus) {
        const error = new Error('Invalid status');
        error.statusCode = 400;
        throw error;
      }

      const canTransition = await orderStatusTransitionsRepository.canTransition(
        tenant_id,
        order.statusId,
        targetStatus.id,
        { conn: connection }
      );

      order.changeStatus(targetStatus.id, () => canTransition);

      await orderStatusHistoryRepository.create({
        tenant_id,
        order_id,
        status_id: targetStatus.id,
        note_visible: ''
      }, { conn: connection });

      await ordersRepository.updateStatus({ id: order_id, tenant_id, status_id: targetStatus.id }, { conn: connection });

      await auditEventsRepository.append({
        tenant_id,
        aggregate_id: order_id,
        type: 'ORDER_STATUS_CHANGED',
        payload: { status_code }
      }, { conn: connection });

      await ordersReadRepository.refreshFromSources(tenant_id, order_id, { conn: connection });

      return { updated: true, status: status_code };
    });
  }
}
