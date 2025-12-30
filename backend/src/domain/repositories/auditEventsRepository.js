import { getPool } from '../../infrastructure/db/mysqlPool.js';
import { generateId } from '../utils/id.js';

class AuditEventsRepository {
  async append({ tenant_id, aggregate_id, type, payload }, connection = null) {
    const executor = connection || getPool();
    const id = generateId();
    await executor.execute(
      'INSERT INTO audit_events (id, tenant_id, aggregate_id, type, payload) VALUES (?, ?, ?, ?, ?)',
      [id, tenant_id, aggregate_id, type, JSON.stringify(payload)]
    );
    return { id, tenant_id, aggregate_id, type };
  }
}

export const auditEventsRepository = new AuditEventsRepository();
