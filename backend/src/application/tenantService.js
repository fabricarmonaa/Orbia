import { tenantsRepository } from '../domain/repositories/tenantsRepository.js';
import { tenantStatusHistoryRepository } from '../domain/repositories/tenantStatusHistoryRepository.js';
import { tenantAIConfigsRepository } from '../domain/repositories/tenantAIConfigsRepository.js';
import { orderStatusesRepository } from '../domain/repositories/orderStatusesRepository.js';

export const tenantService = {
  async ensureActiveTenant(tenant_id) {
    const tenant = await tenantsRepository.findById(tenant_id);
    if (!tenant) {
      const error = new Error('Tenant not found');
      error.statusCode = 404;
      throw error;
    }
    if (tenant.status === 'SUSPENDED') {
      const error = new Error('Tenant suspended');
      error.statusCode = 403;
      throw error;
    }
    return tenant;
  },

  async createTenant({ name, ai_config }) {
    const tenant = await tenantsRepository.create({ name, status: 'ACTIVE' });
    await tenantStatusHistoryRepository.addEntry({ tenant_id: tenant.id, status: 'ACTIVE' });
    await orderStatusesRepository.seedDefaults(tenant.id);
    if (ai_config) {
      await tenantAIConfigsRepository.upsert({
        tenant_id: tenant.id,
        provider: ai_config.provider,
        model: ai_config.model,
        vector_store_ref: ai_config.vector_store_ref
      });
    }
    return tenant;
  },

  async updateStatus({ tenant_id, status }) {
    await tenantsRepository.updateStatus(tenant_id, status);
    await tenantStatusHistoryRepository.addEntry({ tenant_id, status });
  }
};
