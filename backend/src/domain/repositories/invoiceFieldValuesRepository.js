import { getPool } from '../../infrastructure/db/mysqlPool.js';
import { generateId } from '../utils/id.js';

class InvoiceFieldValuesRepository {
  async insertMany(invoice_id, values, connection = null) {
    if (!values.length) return;
    const executor = connection || getPool();
    const records = values.map(v => [generateId(), invoice_id, v.field_id, v.value]);
    await executor.query(
      'INSERT INTO invoice_field_values (id, invoice_id, field_id, value) VALUES ?',
      [records]
    );
  }
}

export const invoiceFieldValuesRepository = new InvoiceFieldValuesRepository();
