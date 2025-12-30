import { getPool } from '../../infrastructure/db/mysqlPool.js';

class InvoiceTemplateFieldsRepository {
  async findByTemplate(template_id) {
    const [rows] = await getPool().execute(
      'SELECT * FROM invoice_template_fields WHERE template_id = ? ORDER BY position ASC',
      [template_id]
    );
    return rows;
  }
}

export const invoiceTemplateFieldsRepository = new InvoiceTemplateFieldsRepository();
