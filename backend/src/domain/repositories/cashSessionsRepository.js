import { getPool } from '../../infrastructure/db/mysqlPool.js';
import { generateId } from '../utils/id.js';

class CashSessionsRepository {
    async create({ tenant_id, opening_amount }) {
        const id = generateId();
        await getPool().execute(
            'INSERT INTO cash_sessions (id, tenant_id, opening_amount, status) VALUES (?, ?, ?, ?)',
            [id, tenant_id, opening_amount, 'OPEN']
        );
        return id;
    }

    async findActive(tenant_id) {
        const [rows] = await getPool().execute(
            'SELECT * FROM cash_sessions WHERE tenant_id = ? AND status = "OPEN" LIMIT 1',
            [tenant_id]
        );
        return rows[0] || null;
    }

    async close(id, tenant_id, closing_amount) {
        await getPool().execute(
            'UPDATE cash_sessions SET status = "CLOSED", closed_at = NOW(), closing_amount = ? WHERE id = ? AND tenant_id = ?',
            [closing_amount, id, tenant_id]
        );
    }

    async list(tenant_id, limit = 10) {
        const [rows] = await getPool().execute(
            'SELECT * FROM cash_sessions WHERE tenant_id = ? ORDER BY opened_at DESC LIMIT ?',
            [tenant_id, limit]
        );
        return rows;
    }
}

export const cashSessionsRepository = new CashSessionsRepository();
