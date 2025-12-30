import { getPool } from '../../infrastructure/db/mysqlPool.js';
import { generateId } from '../utils/id.js';

class TrackingRepository {
    async create({ tenant_id, order_id, token_hash, expires_at }) {
        const id = generateId();
        const pool = getPool();
        await pool.execute(
            'INSERT INTO public_tracking_links (id, tenant_id, order_id, token_hash, expires_at) VALUES (?, ?, ?, ?, ?)',
            [id, tenant_id, order_id, token_hash, expires_at]
        );
        return id;
    }

    async findByTokenHash(token_hash) {
        const pool = getPool();
        // Join with order and tenant to get logic context if needed
        const [rows] = await pool.execute(
            `SELECT l.*, o.id as order_id, o.status_id, o.user_notes, o.updated_at as order_updated_at, os.name as status_name 
       FROM public_tracking_links l 
       JOIN orders o ON l.order_id = o.id 
       JOIN order_statuses os ON o.status_id = os.id
       WHERE l.token_hash = ? 
       AND (l.expires_at IS NULL OR l.expires_at > NOW()) 
       AND l.revoked_at IS NULL 
       LIMIT 1`,
            [token_hash]
        );
        return rows[0] || null;
    }
}

export const trackingRepository = new TrackingRepository();
