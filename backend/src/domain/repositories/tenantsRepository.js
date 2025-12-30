import { getPool } from '../../infrastructure/db/mysqlPool.js';
import { generateId } from '../utils/id.js';

class TenantsRepository {
  async create({ id = generateId(), name, status = 'ACTIVE' }) {
    const pool = getPool();
    await pool.execute('INSERT INTO tenants (id, name, status) VALUES (?, ?, ?)', [id, name, status]);
    return { id, name, status };
  }

  async findById(id) {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM tenants WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async list({ page = 1, limit = 20, status }) {
    const offset = (page - 1) * limit;
    const pool = getPool();
    const clauses = [];
    const params = [];
    if (status) {
      clauses.push('status = ?');
      params.push(status);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const [rows] = await pool.execute(
      `SELECT id, name, status, created_at FROM tenants ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    return rows;
  }

  async updateStatus(id, status) {
    const pool = getPool();
    await pool.execute('UPDATE tenants SET status = ? WHERE id = ?', [status, id]);
  }
}

export const tenantsRepository = new TenantsRepository();
