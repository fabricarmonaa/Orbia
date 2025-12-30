import { getPool } from '../../infrastructure/db/mysqlPool.js';
import { generateId } from '../utils/id.js';

class FixedExpensesRepository {
    async create({ tenant_id, category_id, name, amount, due_day }) {
        const id = generateId();
        await getPool().execute(
            'INSERT INTO fixed_expenses (id, tenant_id, category_id, name, amount, due_day) VALUES (?, ?, ?, ?, ?, ?)',
            [id, tenant_id, category_id, name, amount, due_day]
        );
        return id;
    }

    async list(tenant_id) {
        const [rows] = await getPool().execute(
            `SELECT fe.*, cc.name as category_name 
             FROM fixed_expenses fe 
             LEFT JOIN cash_categories cc ON fe.category_id = cc.id 
             WHERE fe.tenant_id = ? AND fe.active = 1`,
            [tenant_id]
        );
        return rows;
    }

    async delete(id, tenant_id) {
        await getPool().execute(
            'UPDATE fixed_expenses SET active = 0 WHERE id = ? AND tenant_id = ?',
            [id, tenant_id]
        );
    }
}

export const fixedExpensesRepository = new FixedExpensesRepository();
