import { getPool } from '../../infrastructure/db/mysqlPool.js';
import { generateId } from '../utils/id.js';

class OrderStatusHistoryRepository {
    async create({ tenant_id, order_id, status_id, note_visible }, connection = null) {
        const executor = connection || getPool();
        const id = generateId();
        await executor.execute(
            'INSERT INTO order_status_history (id, tenant_id, order_id, status_id, note_visible) VALUES (?, ?, ?, ?, ?)',
            [id, tenant_id, order_id, status_id, note_visible || null]
        );
    }

    async findByOrderId(order_id) {
        const pool = getPool();
        const [rows] = await pool.execute(
            `SELECT h.*, s.name as status_name, s.code as status_code 
       FROM order_status_history h 
       JOIN order_statuses s ON h.status_id = s.id 
       WHERE h.order_id = ? 
       ORDER BY h.changed_at DESC`,
            [order_id]
        );
        return rows;
    }
}

export const orderStatusHistoryRepository = new OrderStatusHistoryRepository();
