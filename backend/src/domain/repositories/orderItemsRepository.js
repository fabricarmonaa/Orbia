import { getPool } from '../../infrastructure/db/mysqlPool.js';
import { generateId } from '../utils/id.js';

class OrderItemsRepository {
  async insertMany(order_id, items, connection = null) {
    if (!items.length) return;
    const executor = connection || getPool();
    const values = items.map(item => [
      generateId(),
      order_id,
      item.sku,
      item.description,
      item.quantity,
      item.price
    ]);
    await executor.query(
      'INSERT INTO order_items (id, order_id, sku, description, quantity, price) VALUES ?',[values]
    );
  }

  async findByOrder(order_id) {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM order_items WHERE order_id = ?', [order_id]);
    return rows;
  }
}

export const orderItemsRepository = new OrderItemsRepository();
