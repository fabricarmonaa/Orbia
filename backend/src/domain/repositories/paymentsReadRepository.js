import { getPool } from '../../infrastructure/db/mysqlPool.js';

class PaymentsReadRepository {
  async refreshFromSources(tenant_id, payment_id, { conn } = {}) {
    const executor = conn || getPool();
    const [rows] = await executor.execute(
      `SELECT p.id, p.user_id, pm.name AS method, p.amount, p.paid_at
       FROM payments p
       JOIN payment_methods pm ON pm.id = p.method_id
       WHERE p.tenant_id = ? AND p.id = ?`,
      [tenant_id, payment_id]
    );
    if (!rows.length) return;
    const row = rows[0];
    await executor.execute(
      `REPLACE INTO payments_read (id, tenant_id, user_id, amount, method, paid_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [row.id, tenant_id, row.user_id, row.amount, row.method, row.paid_at]
    );
  }

  async list({ tenant_id, user_id, page = 1, limit = 20 }, { conn } = {}) {
    const offset = (page - 1) * limit;
    const conditions = ['tenant_id = ?'];
    const params = [tenant_id];
    if (user_id) {
      conditions.push('user_id = ?');
      params.push(user_id);
    }
    const where = `WHERE ${conditions.join(' AND ')}`;
    const executor = conn || getPool();
    const [rows] = await executor.execute(
      `SELECT id, user_id, amount, method, paid_at FROM payments_read
       ${where}
       ORDER BY paid_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    return rows;
  }
}

export const paymentsReadRepository = new PaymentsReadRepository();
