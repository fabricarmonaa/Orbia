import { getPool } from '../../infrastructure/db/mysqlPool.js';
import { generateId } from '../utils/id.js';

class CashMovementsRepository {
  async create({ tenant_id, category_id, method_id, amount, note }, { conn } = {}) {
    const executor = conn || getPool();
    const id = generateId();
    await executor.execute(
      'INSERT INTO cash_movements (id, tenant_id, category_id, method_id, amount, note) VALUES (?, ?, ?, ?, ?, ?)',
      [id, tenant_id, category_id, method_id, amount, note]
    );
    return { id };
  }
}

export const cashMovementsRepository = new CashMovementsRepository();
