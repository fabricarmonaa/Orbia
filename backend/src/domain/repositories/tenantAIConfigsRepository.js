import { getPool } from '../../infrastructure/db/mysqlPool.js';

class TenantAIConfigsRepository {
  async findByTenantId(tenant_id) {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM tenant_ai_configs WHERE tenant_id = ?', [tenant_id]);
    return rows[0] || null;
  }

  async upsert({ tenant_id, provider, model, vector_store_ref }) {
    const pool = getPool();
    await pool.execute(
      `REPLACE INTO tenant_ai_configs (tenant_id, provider, model, vector_store_ref) VALUES (?, ?, ?, ?)`,
      [tenant_id, provider, model, vector_store_ref]
    );
    return { tenant_id, provider, model, vector_store_ref };
  }
}

export const tenantAIConfigsRepository = new TenantAIConfigsRepository();
