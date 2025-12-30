import { getPool } from '../../infrastructure/db/mysqlPool.js';
import { generateId } from '../utils/id.js';

class ProductsRepository {
    async create({ tenant_id, sku, name, description, price, cost, stock, category }) {
        const id = generateId();
        await getPool().execute(
            'INSERT INTO products (id, tenant_id, sku, name, description, price, cost, stock, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, tenant_id, sku, name, description || '', price, cost || 0, stock || 0, category || '']
        );
        return id;
    }

    async list(tenant_id, { category = null, active = true, search = null } = {}) {
        let query = 'SELECT * FROM products WHERE tenant_id = ?';
        const params = [tenant_id];

        if (active !== null) {
            query += ' AND active = ?';
            params.push(active ? 1 : 0);
        }

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        if (search) {
            query += ' AND (sku LIKE ? OR name LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY name ASC';

        const [rows] = await getPool().execute(query, params);
        return rows;
    }

    async findById(id, tenant_id) {
        const [rows] = await getPool().execute(
            'SELECT * FROM products WHERE id = ? AND tenant_id = ?',
            [id, tenant_id]
        );
        return rows[0] || null;
    }

    async findBySku(sku, tenant_id) {
        const [rows] = await getPool().execute(
            'SELECT * FROM products WHERE sku = ? AND tenant_id = ?',
            [sku, tenant_id]
        );
        return rows[0] || null;
    }

    async update(id, tenant_id, { name, description, price, cost, stock, category }) {
        await getPool().execute(
            'UPDATE products SET name = ?, description = ?, price = ?, cost = ?, stock = ?, category = ? WHERE id = ? AND tenant_id = ?',
            [name, description, price, cost, stock, category, id, tenant_id]
        );
    }

    async delete(id, tenant_id) {
        await getPool().execute(
            'UPDATE products SET active = 0 WHERE id = ? AND tenant_id = ?',
            [id, tenant_id]
        );
    }

    async listForExport(tenant_id) {
        const [rows] = await getPool().execute(
            'SELECT sku, name, price, category FROM products WHERE tenant_id = ? AND active = 1 ORDER BY category, name',
            [tenant_id]
        );
        return rows;
    }
}

export const productsRepository = new ProductsRepository();
