import { getPool } from '../../infrastructure/db/mysqlPool.js';

class UsersReadRepository {
  async upsert({ id, tenant_id, dni, name, last_payment, balance }, connection = null) {
    const executor = connection || getPool();
    await executor.execute(
      'REPLACE INTO users_read (id, tenant_id, dni, name, last_payment, balance) VALUES (?, ?, ?, ?, ?, ?)',
      [id, tenant_id, dni, name, last_payment, balance]
    );
  }

  async refreshFromSources(tenant_id, user_id, connection = null) {
    const executor = connection || getPool();
    const [rows] = await executor.execute(
      `SELECT u.id, u.dni, p.first_name, p.last_name
       FROM users u
       JOIN user_profiles p ON p.user_id = u.id
       WHERE u.tenant_id = ? AND u.id = ?`,
      [tenant_id, user_id]
    );
    if (!rows.length) return;
    const row = rows[0];
    const name = `${row.first_name} ${row.last_name}`.trim();
    const [paymentRows] = await executor.execute(
      'SELECT COALESCE(SUM(amount), 0) AS total, MAX(paid_at) AS last_payment FROM payments WHERE tenant_id = ? AND user_id = ?',
      [tenant_id, user_id]
    );
    const lastPayment = paymentRows[0]?.last_payment || '1970-01-01 00:00:00';
    const balance = 0 - (paymentRows[0]?.total || 0);
    await this.upsert({
      id: row.id,
      tenant_id,
      dni: row.dni,
      name,
      last_payment: lastPayment,
      balance
    }, executor);
  }

  async list({ tenant_id, filters = {}, page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    const pool = getPool();
    const conditions = ['ur.tenant_id = ?'];
    const params = [tenant_id];
    if (filters.dni) {
      conditions.push('ur.dni = ?');
      params.push(filters.dni);
    }
    if (filters.name) {
      conditions.push('ur.name LIKE ?');
      params.push(`%${filters.name}%`);
    }
    if (typeof filters.active !== 'undefined') {
      conditions.push('u.active = ?');
      params.push(filters.active ? 1 : 0);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await pool.execute(
      `SELECT ur.id, ur.dni, ur.name, ur.last_payment, ur.balance, u.active
       FROM users_read ur
       JOIN users u ON u.id = ur.id
       ${where}
       ORDER BY ur.name ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    return rows;
  }
}

export const usersReadRepository = new UsersReadRepository();
