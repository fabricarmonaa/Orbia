import { getPool } from '../../infrastructure/db/mysqlPool.js';

class UserExtraValuesRepository {
  async upsertMany(user_id, values, connection = null) {
    const executor = connection || getPool();
    if (!values.length) return;
    const inserts = values.map(v => [user_id, v.field_id, v.value]);
    await executor.query('REPLACE INTO user_extra_values (user_id, field_id, value) VALUES ?', [inserts]);
  }

  async listByUser(user_id) {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM user_extra_values WHERE user_id = ?', [user_id]);
    return rows;
  }
}

export const userExtraValuesRepository = new UserExtraValuesRepository();
