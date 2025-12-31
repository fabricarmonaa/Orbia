import { getPool } from '../../infrastructure/db/mysqlPool.js';

export class UsersReadRepository {
  async list({ tenant_id, filters = {}, page = 1, limit = 20 }) {
    const where = ['tenant_id = ?'];
    const params = [tenant_id];

    if (filters.dni) {
      where.push('dni LIKE ?');
      params.push(`%${filters.dni}%`);
    }

    if (filters.name) {
      where.push('name LIKE ?');
      params.push(`%${filters.name}%`);
    }

    const offset = (page - 1) * limit;

    const sql = `
      SELECT *
      FROM users_read
      WHERE ${where.join(' AND ')}
      ORDER BY name
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);

    const [rows] = await getPool().execute(sql, params);
    return rows;
  }
}


export const usersReadRepository = new UsersReadRepository();
