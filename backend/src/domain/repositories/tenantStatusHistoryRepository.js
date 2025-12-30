import { getPool } from '../../infrastructure/db/mysqlPool.js';
import { generateId } from '../utils/id.js';

class TenantStatusHistoryRepository {
  async addEntry({ tenant_id, status, changed_at = null }) {
    const pool = getPool();
    const id = generateId();
    await pool.execute(
      'INSERT INTO tenant_status_history (id, tenant_id, status, changed_at) VALUES (?, ?, ?, ?)',
      [id, tenant_id, status, changed_at || new Date()]
    );
    return { id, tenant_id, status };
  }
}

export const tenantStatusHistoryRepository = new TenantStatusHistoryRepository();
