import { getPool } from '../../infrastructure/db/mysqlPool.js';
import { generateId } from '../utils/id.js';

class AuditRepository {
    async log({ tenant_id, entity_type, entity_id, action, performed_by, details = '' }) {
        const pool = getPool();
        const id = generateId();
        await pool.execute(
            `INSERT INTO audit_events (id, tenant_id, entity_type, entity_id, action, performed_by, details, occurred_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [id, tenant_id, entity_type, entity_id, action, performed_by, details]
        );
        return id;
    }

    async findByEntity({ tenant_id, entity_type, entity_id, limit = 50 }) {
        const pool = getPool();
        const [rows] = await pool.execute(
            `SELECT * FROM audit_events 
       WHERE tenant_id = ? AND entity_type = ? AND entity_id = ? 
       ORDER BY occurred_at DESC LIMIT ?`,
            [tenant_id, entity_type, entity_id, limit]
        );
        return rows;
    }

    async findByTenant({ tenant_id, limit = 100 }) {
        const pool = getPool();
        const [rows] = await pool.execute(
            `SELECT * FROM audit_events 
       WHERE tenant_id = ? 
       ORDER BY occurred_at DESC LIMIT ?`,
            [tenant_id, limit]
        );
        return rows;
    }
}

export const auditRepository = new AuditRepository();
