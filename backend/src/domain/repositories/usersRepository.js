import { getPool } from '../../infrastructure/db/mysqlPool.js';
import { generateId } from '../utils/id.js';

class UsersRepository {
  async create({ tenant_id, dni, role, password_hash, active = 1 }, connection = null) {
    const id = generateId();
    const executor = connection || getPool();
    await executor.execute(
      'INSERT INTO users (id, tenant_id, dni, role, password_hash, active) VALUES (?, ?, ?, ?, ?, ?)',
      [id, tenant_id, dni, role, password_hash, active]
    );
    return { id, tenant_id, dni, role, active };
  }

  async findByDniWithinTenant(tenant_id, dni) {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM users WHERE tenant_id = ? AND dni = ?', [tenant_id, dni]);
    return rows[0] || null;
  }

  async findById(id, tenant_id) {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ? AND tenant_id = ?', [id, tenant_id]);
    return rows[0] || null;
  }

  async update({ id, tenant_id, role, active }, connection = null) {
    const executor = connection || getPool();
    await executor.execute('UPDATE users SET role = ?, active = ? WHERE id = ? AND tenant_id = ?', [role, active, id, tenant_id]);
  }

  async updatePassword({ id, tenant_id, password_hash }, connection = null) {
    const executor = connection || getPool();
    await executor.execute('UPDATE users SET password_hash = ? WHERE id = ? AND tenant_id = ?', [password_hash, id, tenant_id]);
  }

  async countByRole(role) {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM users WHERE role = ?', [role]);
    return Number(rows[0]?.count || 0);
  }
}

export const usersRepository = new UsersRepository();
