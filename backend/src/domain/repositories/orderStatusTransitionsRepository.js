import { getPool } from '../../infrastructure/db/mysqlPool.js';
import { generateId } from '../utils/id.js';

class OrderStatusTransitionsRepository {
    async create({ tenant_id, from_status_id, to_status_id }) {
        const id = generateId();
        await getPool().execute(
            'INSERT INTO order_status_transitions (id, tenant_id, from_status_id, to_status_id) VALUES (?, ?, ?, ?)',
            [id, tenant_id, from_status_id, to_status_id]
        );
        return id;
    }

    async list(tenant_id) {
        const [rows] = await getPool().execute(
            'SELECT * FROM order_status_transitions WHERE tenant_id = ?',
            [tenant_id]
        );
        return rows;
    }

    async canTransition(tenant_id, from_status_id, to_status_id) {
        const [rows] = await getPool().execute(
            'SELECT * FROM order_status_transitions WHERE tenant_id = ? AND from_status_id = ? AND to_status_id = ?',
            [tenant_id, from_status_id, to_status_id]
        );
        if (rows.length > 0) return true;

        // Check if ANY transitions exist for this tenant. If NONE exist, allow EVERYTHING (per requirements).
        const [all] = await getPool().execute(
            'SELECT id FROM order_status_transitions WHERE tenant_id = ? LIMIT 1',
            [tenant_id]
        );
        return all.length === 0;
    }

    async delete(tenant_id, from_status_id, to_status_id) {
        await getPool().execute(
            'DELETE FROM order_status_transitions WHERE tenant_id = ? AND from_status_id = ? AND to_status_id = ?',
            [tenant_id, from_status_id, to_status_id]
        );
    }
}

export const orderStatusTransitionsRepository = new OrderStatusTransitionsRepository();
