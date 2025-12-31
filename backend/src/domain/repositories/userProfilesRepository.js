import { getPool } from '../../infrastructure/db/mysqlPool.js';

class UserProfilesRepository {

  #resolveDb(db) {
    const executor = db ?? getPool();

    if (!executor || typeof executor.execute !== 'function') {
      throw new Error('Invalid DB executor: missing execute()');
    }

    return executor;
  }

  async create({ user_id, first_name, last_name, email, phone }, db = null) {
    const executor = this.#resolveDb(db);

    await executor.execute(
      `INSERT INTO user_profiles 
       (user_id, first_name, last_name, email, phone) 
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, first_name, last_name, email, phone]
    );

    return { user_id, first_name, last_name, email, phone };
  }

  async update({ user_id, first_name, last_name, email, phone }, db = null) {
    const executor = this.#resolveDb(db);

    await executor.execute(
      `UPDATE user_profiles 
       SET first_name = ?, last_name = ?, email = ?, phone = ? 
       WHERE user_id = ?`,
      [first_name, last_name, email, phone, user_id]
    );
  }

  async findByUserId(user_id, db = null) {
    const executor = this.#resolveDb(db);

    const [rows] = await executor.execute(
      'SELECT * FROM user_profiles WHERE user_id = ?',
      [user_id]
    );

    return rows[0] || null;
  }
}

export const userProfilesRepository = new UserProfilesRepository();
