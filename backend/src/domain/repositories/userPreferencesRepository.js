import { getPool } from '../../infrastructure/db/mysqlPool.js';
import { generateId } from '../utils/id.js';

// Default preferences for new users
const DEFAULT_PREFERENCES = {
    theme: 'light',
    language: 'es',
    notifications_email: 'true',
    notifications_push: 'true',
    notifications_sms: 'false',
    dashboard_layout: 'default'
};

class UserPreferencesRepository {
    async get(user_id, key) {
        const [rows] = await getPool().execute(
            'SELECT pref_value FROM user_preferences WHERE user_id = ? AND pref_key = ?',
            [user_id, key]
        );

        if (rows.length === 0) {
            return DEFAULT_PREFERENCES[key] || null;
        }

        return rows[0].pref_value;
    }

    async getAll(user_id) {
        const [rows] = await getPool().execute(
            'SELECT pref_key, pref_value FROM user_preferences WHERE user_id = ?',
            [user_id]
        );

        // Start with defaults
        const preferences = { ...DEFAULT_PREFERENCES };

        // Override with stored values
        for (const row of rows) {
            preferences[row.pref_key] = row.pref_value;
        }

        return preferences;
    }

    async set(user_id, key, value) {
        const id = generateId();
        await getPool().execute(
            `INSERT INTO user_preferences (id, user_id, pref_key, pref_value) 
       VALUES (?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE pref_value = VALUES(pref_value)`,
            [id, user_id, key, String(value)]
        );
    }

    async setMultiple(user_id, preferences) {
        const pool = getPool();
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            for (const [key, value] of Object.entries(preferences)) {
                const id = generateId();
                await connection.execute(
                    `INSERT INTO user_preferences (id, user_id, pref_key, pref_value) 
           VALUES (?, ?, ?, ?) 
           ON DUPLICATE KEY UPDATE pref_value = VALUES(pref_value)`,
                    [id, user_id, key, String(value)]
                );
            }

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async initializeDefaults(user_id) {
        await this.setMultiple(user_id, DEFAULT_PREFERENCES);
    }
}

export const userPreferencesRepository = new UserPreferencesRepository();
