import { invoicesRepository } from '../domain/repositories/invoicesRepository.js';
import { invoiceTemplatesRepository } from '../domain/repositories/invoiceTemplatesRepository.js';
import { invoiceTemplateFieldsRepository } from '../domain/repositories/invoiceTemplateFieldsRepository.js';
import { invoiceOrdersRepository } from '../domain/repositories/invoiceOrdersRepository.js';
import { invoiceFieldValuesRepository } from '../domain/repositories/invoiceFieldValuesRepository.js';
import { ordersRepository } from '../domain/repositories/ordersRepository.js';
import { auditEventsRepository } from '../domain/repositories/auditEventsRepository.js';
import { withTransaction } from '../infrastructure/db/mysqlPool.js';

export const invoiceService = {
  async createInvoice({ tenant_id, user_id, template_id, order_ids = [], field_values = {} }) {
    return withTransaction(async connection => {
      const template = await invoiceTemplatesRepository.findById(template_id, tenant_id);
      if (!template) {
        const error = new Error('Template not found');
        error.statusCode = 404;
        throw error;
      }
      for (const orderId of order_ids) {
        const order = await ordersRepository.findById(orderId, tenant_id);
        if (!order) {
          const error = new Error('Order not found for tenant');
          error.statusCode = 404;
          throw error;
        }
      }
      const fields = await invoiceTemplateFieldsRepository.findByTemplate(template_id);
      const valuesToInsert = fields.map(field => {
        const hasValue = typeof field_values[field.id] !== 'undefined';
        if (field.required && !hasValue) {
          const error = new Error('Missing required field');
          error.statusCode = 400;
          throw error;
        }
        return { field_id: field.id, value: field_values[field.id] || '' };
      });
      let total = 0;
      if (order_ids.length) {
        const placeholders = order_ids.map(() => '?').join(',');
        const [sumRows] = await connection.execute(
          `SELECT COALESCE(SUM(oi.quantity * oi.price), 0) AS total
           FROM order_items oi
           JOIN orders o ON o.id = oi.order_id
           WHERE o.tenant_id = ? AND oi.order_id IN (${placeholders})`,
          [tenant_id, ...order_ids]
        );
        total = sumRows[0]?.total || 0;
      }
      const invoice = await invoicesRepository.create({ tenant_id, user_id, template_id, total }, connection);
      await invoiceOrdersRepository.link(invoice.id, order_ids, connection);
      await invoiceFieldValuesRepository.insertMany(invoice.id, valuesToInsert, connection);
      await auditEventsRepository.append(
        {
          tenant_id,
          aggregate_id: invoice.id,
          type: 'INVOICE_CREATED',
          payload: { user_id, template_id, order_ids, field_values }
        },
        connection
      );
      return invoice;
    });
  }
};
