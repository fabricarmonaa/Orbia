import { getPool } from '../../infrastructure/db/mysqlPool.js';
import { generateId } from '../utils/id.js';

class CashCategoriesRepository {
  async findByNameAndType(tenant_id, name, type, { conn } = {}) {
    const executor = conn || getPool();
    const [rows] = await executor.execute(
      'SELECT * FROM cash_categories WHERE tenant_id = ? AND name = ? AND type = ? LIMIT 1',
      [tenant_id, name, type]
    );
    return rows[0] || null;
  }

  async findById(id, tenant_id, { conn } = {}) {
    const executor = conn || getPool();
    const [rows] = await executor.execute(
      'SELECT * FROM cash_categories WHERE id = ? AND tenant_id = ? LIMIT 1',
      [id, tenant_id]
    );
    return rows[0] || null;
  }

  async ensureCategory({ tenant_id, name, type }, { conn } = {}) {
    const existing = await this.findByNameAndType(tenant_id, name, type, { conn });
    if (existing) return existing;
    const id = generateId();
    const executor = conn || getPool();
    await executor.execute(
      'INSERT INTO cash_categories (id, tenant_id, name, type) VALUES (?, ?, ?, ?)',
      [id, tenant_id, name, type]
    );
    return { id, tenant_id, name, type };
  }
}

export const cashCategoriesRepository = new CashCategoriesRepository();
