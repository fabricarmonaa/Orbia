import { z } from 'zod';
import { requireAuth } from '../../infrastructure/http/authGuard.js';
import { tenantService } from '../../application/tenantService.js';
import { tenantsRepository } from '../../domain/repositories/tenantsRepository.js';

const createTenantSchema = z.object({
  name: z.string(),
  ai_config: z
    .object({
      provider: z.string(),
      model: z.string(),
      vector_store_ref: z.string()
    })
    .optional()
});

const updateStatusSchema = z.object({
  tenant_id: z.string(),
  status: z.enum(['ACTIVE', 'SUSPENDED'])
});

export const superAdminController = {
  listTenants: async context => {
    await requireAuth(context, ['SUPER_ADMIN']);
    const page = Number(context.query.get('page') || '1');
    const limit = Number(context.query.get('limit') || '20');
    const status = context.query.get('status') || undefined;
    const tenants = await tenantsRepository.list({ page, limit, status });
    context.res.writeHead(200, { 'Content-Type': 'application/json' });
    context.res.end(JSON.stringify({ tenants }));
  },
  createTenant: async context => {
    await requireAuth(context, ['SUPER_ADMIN']);
    const payload = createTenantSchema.parse(context.body || {});
    const tenant = await tenantService.createTenant(payload);
    context.res.writeHead(201, { 'Content-Type': 'application/json' });
    context.res.end(JSON.stringify({ tenant }));
  },
  updateTenantStatus: async context => {
    await requireAuth(context, ['SUPER_ADMIN']);
    const payload = updateStatusSchema.parse(context.body || {});
    const tenant = await tenantsRepository.findById(payload.tenant_id);
    if (!tenant) {
      const error = new Error('Tenant not found');
      error.statusCode = 404;
      throw error;
    }
    await tenantService.updateStatus(payload);
    context.res.writeHead(200, { 'Content-Type': 'application/json' });
    context.res.end(JSON.stringify({ updated: true }));
  }
};
