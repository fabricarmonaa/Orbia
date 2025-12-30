import { ordersRepository } from '../domain/repositories/ordersRepository.js';
import { orderItemsRepository } from '../domain/repositories/orderItemsRepository.js';
import { orderStatusesRepository } from '../domain/repositories/orderStatusesRepository.js';
import { ordersReadRepository } from '../domain/repositories/ordersReadRepository.js';
import { auditEventsRepository } from '../domain/repositories/auditEventsRepository.js';
import { orderStatusTransitionsRepository } from '../domain/repositories/orderStatusTransitionsRepository.js';
import { orderStatusHistoryRepository } from '../domain/repositories/orderStatusHistoryRepository.js';
import { withTransaction } from '../infrastructure/db/mysqlPool.js';

export const orderService = {
  async createOrder({ tenant_id, user_id, status_code, items = [], internal_notes = '', user_notes = '' }) {
    return withTransaction(async connection => {
      const status = await orderStatusesRepository.findByCode(tenant_id, status_code);
      if (!status) {
        const error = new Error('Invalid status');
        error.statusCode = 400;
        throw error;
      }
      const order = await ordersRepository.create({ tenant_id, user_id, status_id: status.id, internal_notes, user_notes }, connection);
      const normalizedItems = items.map(i => ({
        sku: i.sku,
        description: i.description,
        quantity: i.quantity,
        price: i.price
      }));
      await orderItemsRepository.insertMany(order.id, normalizedItems, connection);
      await auditEventsRepository.append(
        {
          tenant_id,
          aggregate_id: order.id,
          type: 'ORDER_CREATED',
          payload: { user_id, status_code, items: normalizedItems }
        },
        connection
      );
      await ordersReadRepository.refreshFromSources(tenant_id, order.id, connection);
      return order;
    });
  },

  async updateStatus({ tenant_id, order_id, status_code }) {
    return withTransaction(async connection => {
      const order = await ordersRepository.findById(order_id, tenant_id);
      if (!order) {
        const error = new Error('Order not found');
        error.statusCode = 404;
        throw error;
      }
      const status = await orderStatusesRepository.findByCode(tenant_id, status_code);
      if (!status) {
        const error = new Error('Invalid status');
        error.statusCode = 400;
        throw error;
      }

      // Validate Transition
      const canTransition = await orderStatusTransitionsRepository.canTransition(tenant_id, order.status_id, status.id);
      if (!canTransition) {
        throw Object.assign(new Error(`Invalid status transition from current status to ${status.name}`), { statusCode: 400 });
      }

      // Add History
      await orderStatusHistoryRepository.create({
        tenant_id,
        order_id,
        status_id: status.id,
        note_visible: ''
      }, connection);
      await ordersRepository.updateStatus({ id: order_id, tenant_id, status_id: status.id }, connection);
      await auditEventsRepository.append(
        { tenant_id, aggregate_id: order_id, type: 'ORDER_STATUS_CHANGED', payload: { status_code } },
        connection
      );
      await ordersReadRepository.refreshFromSources(tenant_id, order_id, connection);
    });
  }
};
