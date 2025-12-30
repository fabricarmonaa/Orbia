import { getPool } from '../../infrastructure/db/mysqlPool.js';
import { generateId } from '../utils/id.js';

class PaymentsRepository {
  async create({ tenant_id, user_id, method_id, amount, note = null }, { conn } = {}) {
    const executor = conn || getPool();
    const id = generateId();
    await executor.execute(
      'INSERT INTO payments (id, tenant_id, user_id, method_id, amount, note) VALUES (?, ?, ?, ?, ?, ?)',
      [id, tenant_id, user_id, method_id, amount, note]
    );
    return { id };
  }

  async findById(id, tenant_id, { conn } = {}) {
    const executor = conn || getPool();
    const [rows] = await executor.execute(
      'SELECT * FROM payments WHERE id = ? AND tenant_id = ? LIMIT 1',
      [id, tenant_id]
    );
    return rows[0] || null;
  }
}

export const paymentsRepository = new PaymentsRepository();
