import { getPool } from '../../infrastructure/db/mysqlPool.js';

class PaymentMethodsRepository {
  async findByCode(tenant_id, code) {
    // Enforce uppercase for code matching to be safe
    const safeCode = (code || '').toUpperCase();

    const [rows] = await getPool().execute(
      'SELECT * FROM payment_methods WHERE tenant_id = ? AND code = ? LIMIT 1',
      [tenant_id, safeCode]
    );
    return rows[0] || null;
  }

  async findAll(tenant_id) {
    const [rows] = await getPool().execute(
      'SELECT * FROM payment_methods WHERE tenant_id = ? ORDER BY name ASC',
      [tenant_id]
    );
    return rows;
  }
}

export const paymentMethodsRepository = new PaymentMethodsRepository();
