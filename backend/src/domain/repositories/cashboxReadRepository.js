import { getPool } from '../../infrastructure/db/mysqlPool.js';

class CashboxReadRepository {
  async refreshFromSources(tenant_id, movement_id, { conn } = {}) {
    const executor = conn || getPool();
    const [rows] = await executor.execute(
      `SELECT c.id, c.tenant_id, cat.name AS category, pm.name AS method, c.amount, c.occurred_at
       FROM cash_movements c
       JOIN cash_categories cat ON cat.id = c.category_id
       JOIN payment_methods pm ON pm.id = c.method_id
       WHERE c.tenant_id = ? AND c.id = ?`,
      [tenant_id, movement_id]
    );
    if (!rows.length) return;
    const row = rows[0];
    await executor.execute(
      `REPLACE INTO cashbox_read (id, tenant_id, category, method, amount, occurred_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [row.id, tenant_id, row.category, row.method, row.amount, row.occurred_at]
    );
  }

  async list({ tenant_id, filters = {}, page = 1, limit = 20 }, { conn } = {}) {
    const offset = (page - 1) * limit;
    const conditions = ['tenant_id = ?'];
    const params = [tenant_id];
    if (filters.category) {
      conditions.push('category = ?');
      params.push(filters.category);
    }
    if (filters.method) {
      conditions.push('method = ?');
      params.push(filters.method);
    }
    if (filters.from) {
      conditions.push('occurred_at >= ?');
      params.push(filters.from);
    }
    if (filters.to) {
      conditions.push('occurred_at <= ?');
      params.push(filters.to);
    }
    const where = `WHERE ${conditions.join(' AND ')}`;
    const executor = conn || getPool();
    const [rows] = await executor.execute(
      `SELECT id, category, method, amount, occurred_at FROM cashbox_read
       ${where}
       ORDER BY occurred_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    return rows;
  }
}

export const cashboxReadRepository = new CashboxReadRepository();
