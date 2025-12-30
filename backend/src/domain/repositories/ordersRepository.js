import { getPool } from '../../infrastructure/db/mysqlPool.js';
import { generateId } from '../utils/id.js';

class OrdersRepository {
  async create({ tenant_id, user_id, status_id, internal_notes, user_notes, branch_id = null }, { conn } = {}) {
    const executor = conn || getPool();
    const id = generateId();
    await executor.execute(
      'INSERT INTO orders (id, tenant_id, user_id, status_id, internal_notes, user_notes, branch_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, tenant_id, user_id, status_id, internal_notes, user_notes, branch_id]
    );
    return { id };
  }

  async findById(id, tenant_id, { conn } = {}) {
    const executor = conn || getPool();
    const [rows] = await executor.execute(
      'SELECT * FROM orders WHERE id = ? AND tenant_id = ? LIMIT 1',
      [id, tenant_id]
    );
    return rows[0] || null;
  }

  async updateStatus({ id, tenant_id, status_id }, { conn } = {}) {
    const executor = conn || getPool();
    await executor.execute(
      'UPDATE orders SET status_id = ? WHERE id = ? AND tenant_id = ?',
      [status_id, id, tenant_id]
    );
  }
}

export const ordersRepository = new OrdersRepository();
