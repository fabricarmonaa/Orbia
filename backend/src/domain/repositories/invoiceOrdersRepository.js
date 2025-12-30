import { getPool } from '../../infrastructure/db/mysqlPool.js';

class InvoiceOrdersRepository {
  async link(invoice_id, order_ids, connection = null) {
    if (!order_ids || !order_ids.length) return;
    const executor = connection || getPool();
    const values = order_ids.map(order_id => [invoice_id, order_id]);
    await executor.query('INSERT INTO invoice_orders (invoice_id, order_id) VALUES ?', [values]);
  }
}

export const invoiceOrdersRepository = new InvoiceOrdersRepository();
