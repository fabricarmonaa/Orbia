import { tenantService } from '../../application/tenantService.js';

export async function requireTenantContext(context, { allowSuperAdminOverride = true } = {}) {
  if (!context.auth || !context.auth.userId) {
    const error = new Error('Unauthorized');
    error.statusCode = 401;
    throw error;
  }

  const overrideTenant = context.headers['x-tenant-id'] || context.query.get('tenant_id') || null;
  let resolvedTenant = context.tenantId || null;

  if (allowSuperAdminOverride && context.auth.role === 'SUPER_ADMIN' && overrideTenant) {
    resolvedTenant = overrideTenant;
  }

  if (!resolvedTenant) {
    const error = new Error('tenant_id is required');
    error.statusCode = 400;
    throw error;
  }

  if (context.auth.role !== 'SUPER_ADMIN' && overrideTenant && overrideTenant !== context.auth.tenantId) {
    const error = new Error('Cross-tenant access forbidden');
    error.statusCode = 403;
    throw error;
  }

  await tenantService.ensureActiveTenant(resolvedTenant);

  context.tenantId = resolvedTenant;
  context.context = {
    tenantId: resolvedTenant,
    userId: context.auth.userId,
    role: context.auth.role,
    roles: context.auth.roles
  };

  return resolvedTenant;
}
