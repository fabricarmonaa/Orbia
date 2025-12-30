import { getPool } from '../../infrastructure/db/mysqlPool.js';

class UserProfilesRepository {
  async create({ user_id, first_name, last_name, email, phone }, connection = null) {
    const executor = connection || getPool();
    await executor.execute(
      'INSERT INTO user_profiles (user_id, first_name, last_name, email, phone) VALUES (?, ?, ?, ?, ?)',
      [user_id, first_name, last_name, email, phone]
    );
    return { user_id, first_name, last_name, email, phone };
  }

  async update({ user_id, first_name, last_name, email, phone }, connection = null) {
    const executor = connection || getPool();
    await executor.execute(
      'UPDATE user_profiles SET first_name = ?, last_name = ?, email = ?, phone = ? WHERE user_id = ?',
      [first_name, last_name, email, phone, user_id]
    );
  }

  async findByUserId(user_id) {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM user_profiles WHERE user_id = ?', [user_id]);
    return rows[0] || null;
  }
}

export const userProfilesRepository = new UserProfilesRepository();
