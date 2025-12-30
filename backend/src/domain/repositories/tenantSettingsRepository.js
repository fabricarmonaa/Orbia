import { getPool } from '../../infrastructure/db/mysqlPool.js';
import { generateId } from '../utils/id.js';

// Default settings for new tenants
const DEFAULT_SETTINGS = {
    business_name: '',
    business_email: '',
    business_phone: '',
    business_address: '',
    currency: 'ARS',
    currency_symbol: '$',
    timezone: 'America/Argentina/Buenos_Aires',
    date_format: 'DD/MM/YYYY',
    tax_rate: '21.00',
    tax_included: 'false',
    invoice_prefix: 'INV-',
    invoice_next_number: '1',
    default_order_status: 'PENDING',
    business_hours_monday: '09:00-18:00',
    business_hours_tuesday: '09:00-18:00',
    business_hours_wednesday: '09:00-18:00',
    business_hours_thursday: '09:00-18:00',
    business_hours_friday: '09:00-18:00',
    business_hours_saturday: 'CLOSED',
    business_hours_sunday: 'CLOSED'
};

class TenantSettingsRepository {
    async get(tenant_id, key) {
        const [rows] = await getPool().execute(
            'SELECT setting_value FROM tenant_settings WHERE tenant_id = ? AND setting_key = ?',
            [tenant_id, key]
        );

        if (rows.length === 0) {
            // Return default if not set
            return DEFAULT_SETTINGS[key] || null;
        }

        return rows[0].setting_value;
    }

    async getAll(tenant_id) {
        const [rows] = await getPool().execute(
            'SELECT setting_key, setting_value FROM tenant_settings WHERE tenant_id = ?',
            [tenant_id]
        );

        // Start with defaults
        const settings = { ...DEFAULT_SETTINGS };

        // Override with stored values
        for (const row of rows) {
            settings[row.setting_key] = row.setting_value;
        }

        return settings;
    }

    async set(tenant_id, key, value) {
        const id = generateId();
        await getPool().execute(
            `INSERT INTO tenant_settings (id, tenant_id, setting_key, setting_value) 
       VALUES (?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
            [id, tenant_id, key, String(value)]
        );
    }

    async setMultiple(tenant_id, settings) {
        const pool = getPool();
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            for (const [key, value] of Object.entries(settings)) {
                const id = generateId();
                await connection.execute(
                    `INSERT INTO tenant_settings (id, tenant_id, setting_key, setting_value) 
           VALUES (?, ?, ?, ?) 
           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
                    [id, tenant_id, key, String(value)]
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

    async initializeDefaults(tenant_id) {
        await this.setMultiple(tenant_id, DEFAULT_SETTINGS);
    }
}

export const tenantSettingsRepository = new TenantSettingsRepository();
