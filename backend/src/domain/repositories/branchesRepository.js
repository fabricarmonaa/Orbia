import { getPool } from '../../infrastructure/db/mysqlPool.js';
import { generateId } from '../utils/id.js';

class BranchesRepository {
    async create({ tenant_id, name, address, phone }) {
        const id = generateId();
        await getPool().execute(
            'INSERT INTO branches (id, tenant_id, name, address, phone) VALUES (?, ?, ?, ?, ?)',
            [id, tenant_id, name, address, phone]
        );
        return id;
    }

    async list(tenant_id) {
        const [rows] = await getPool().execute(
            'SELECT * FROM branches WHERE tenant_id = ? AND active = 1',
            [tenant_id]
        );
        return rows;
    }

    async findById(id, tenant_id) {
        const [rows] = await getPool().execute(
            'SELECT * FROM branches WHERE id = ? AND tenant_id = ? AND active = 1',
            [id, tenant_id]
        );
        return rows[0] || null;
    }

    async update(id, tenant_id, { name, address, phone }) {
        await getPool().execute(
            'UPDATE branches SET name = ?, address = ?, phone = ? WHERE id = ? AND tenant_id = ?',
            [name, address, phone, id, tenant_id]
        );
    }
}

export const branchesRepository = new BranchesRepository();
