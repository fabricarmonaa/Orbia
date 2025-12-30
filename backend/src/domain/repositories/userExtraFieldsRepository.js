import { getPool } from '../../infrastructure/db/mysqlPool.js';

class UserExtraFieldsRepository {
  async listByTenant(tenant_id) {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM extra_fields WHERE tenant_id = ?', [tenant_id]);
    return rows;
  }

  async findByNames(tenant_id, names = []) {
    if (!names.length) return [];
    const pool = getPool();
    const placeholders = names.map(() => '?').join(',');
    const [rows] = await pool.execute(
      `SELECT * FROM extra_fields WHERE tenant_id = ? AND name IN (${placeholders})`,
      [tenant_id, ...names]
    );
    return rows;
  }
}

export const userExtraFieldsRepository = new UserExtraFieldsRepository();
