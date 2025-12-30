import { getPool } from '../../infrastructure/db/mysqlPool.js';

class PaymentOrdersRepository {
  async link(payment_id, order_ids, { conn } = {}) {
    if (!order_ids || !order_ids.length) return;
    const executor = conn || getPool();
    const values = order_ids.map(order_id => [payment_id, order_id]);
    await executor.query(
      'INSERT INTO payment_orders (payment_id, order_id) VALUES ?',
      [values]
    );
  }
}

export const paymentOrdersRepository = new PaymentOrdersRepository();
