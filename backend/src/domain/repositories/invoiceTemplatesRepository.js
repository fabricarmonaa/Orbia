import { getPool } from '../../infrastructure/db/mysqlPool.js';

class InvoiceTemplatesRepository {
  async findById(id, tenant_id) {
    const [rows] = await getPool().execute(
      'SELECT * FROM invoice_templates WHERE id = ? AND tenant_id = ? LIMIT 1',
      [id, tenant_id]
    );
    return rows[0] || null;
  }
}

export const invoiceTemplatesRepository = new InvoiceTemplatesRepository();
