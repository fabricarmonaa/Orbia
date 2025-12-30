import { getPool } from '../../infrastructure/db/mysqlPool.js';

class OrdersReadRepository {
  async refreshFromSources(tenant_id, order_id, connection = null) {
    const executor = connection || getPool();
    const [rows] = await executor.execute(
      `SELECT o.id, o.user_id, os.name AS status, MAX(o.updated_at) AS last_update,
              COALESCE(SUM(oi.quantity * oi.price), 0) AS total
       FROM orders o
       JOIN order_statuses os ON os.id = o.status_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.tenant_id = ? AND o.id = ?
       GROUP BY o.id, o.user_id, os.name`,
      [tenant_id, order_id]
    );
    if (!rows.length) return;
    const row = rows[0];
    await executor.execute(
      `REPLACE INTO orders_read (id, tenant_id, user_id, status, total, last_update)
       VALUES (?, ?, ?, ?, ?, ? )`,
      [row.id, tenant_id, row.user_id, row.status, row.total, row.last_update]
    );
  }

  async list({ tenant_id, filters = {}, page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    const conditions = ['tenant_id = ?'];
    const params = [tenant_id];
    if (filters.user_id) {
      conditions.push('user_id = ?');
      params.push(filters.user_id);
    }
    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }
    if (filters.from) {
      conditions.push('last_update >= ?');
      params.push(filters.from);
    }
    if (filters.to) {
      conditions.push('last_update <= ?');
      params.push(filters.to);
    }
    const where = `WHERE ${conditions.join(' AND ')}`;
    const [rows] = await getPool().execute(
      `SELECT id, user_id, status, total, last_update FROM orders_read
       ${where}
       ORDER BY last_update DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    return rows;
  }
}

export const ordersReadRepository = new OrdersReadRepository();
