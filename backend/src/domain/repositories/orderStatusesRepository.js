import { getPool } from '../../infrastructure/db/mysqlPool.js';
import { generateId } from '../utils/id.js';

const DEFAULT_STATUSES = [
  { code: 'PENDING', name: 'Pendiente', sort_order: 1 },
  { code: 'IN_PROGRESS', name: 'En progreso', sort_order: 2 },
  { code: 'COMPLETED', name: 'Completado', sort_order: 3 },
  { code: 'DELIVERED', name: 'Entregado', sort_order: 4 },
  { code: 'CANCELLED', name: 'Cancelado', sort_order: 5 }
];

class OrderStatusesRepository {
  async seedDefaults(tenant_id) {
    const pool = getPool();
    for (const status of DEFAULT_STATUSES) {
      await pool.execute(
        `INSERT IGNORE INTO order_statuses (id, tenant_id, name, code, sort_order) VALUES (?, ?, ?, ?, ?)`
        , [generateId(), tenant_id, status.name, status.code, status.sort_order]
      );
    }
  }

  async findByCode(tenant_id, code) {
    const [rows] = await getPool().execute(
      'SELECT * FROM order_statuses WHERE tenant_id = ? AND code = ? LIMIT 1',
      [tenant_id, code]
    );
    return rows[0] || null;
  }

  async list(tenant_id) {
    const [rows] = await getPool().execute(
      'SELECT * FROM order_statuses WHERE tenant_id = ? ORDER BY sort_order ASC',
      [tenant_id]
    );
    return rows;
  }

  async create({ tenant_id, name, code, sort_order }) {
    const id = generateId();
    await getPool().execute(
      'INSERT INTO order_statuses (id, tenant_id, name, code, sort_order) VALUES (?, ?, ?, ?, ?)',
      [id, tenant_id, name, code, sort_order]
    );
    return id;
  }

  async update(id, tenant_id, { name, code, sort_order }) {
    await getPool().execute(
      'UPDATE order_statuses SET name = ?, code = ?, sort_order = ? WHERE id = ? AND tenant_id = ?',
      [name, code, sort_order, id, tenant_id]
    );
  }

  async delete(id, tenant_id) {
    await getPool().execute('DELETE FROM order_statuses WHERE id = ? AND tenant_id = ?', [id, tenant_id]);
  }
}

export const orderStatusesRepository = new OrderStatusesRepository();
