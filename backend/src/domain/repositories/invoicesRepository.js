import { getPool } from '../../infrastructure/db/mysqlPool.js';
import { generateId } from '../utils/id.js';

class InvoicesRepository {
  async create({ tenant_id, user_id, template_id, total }, connection = null) {
    const executor = connection || getPool();
    const id = generateId();
    await executor.execute(
      'INSERT INTO invoices (id, tenant_id, user_id, template_id, total) VALUES (?, ?, ?, ?, ?)',
      [id, tenant_id, user_id, template_id, total]
    );
    return { id };
  }

  async findById(id, tenant_id) {
    const [rows] = await getPool().execute(
      'SELECT * FROM invoices WHERE id = ? AND tenant_id = ? LIMIT 1',
      [id, tenant_id]
    );
    return rows[0] || null;
  }

  async listByTenant(tenant_id, { page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    const [rows] = await getPool().execute(
      `SELECT id, user_id, template_id, issued_at, total
       FROM invoices
       WHERE tenant_id = ?
       ORDER BY issued_at DESC
       LIMIT ? OFFSET ?`,
      [tenant_id, limit, offset]
    );
    return rows;
  }
}

export const invoicesRepository = new InvoicesRepository();
