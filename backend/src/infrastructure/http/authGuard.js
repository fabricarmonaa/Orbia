import { tenantService } from '../../application/tenantService.js';

export async function requireAuth(context, roles = []) {
  if (!context.auth || !context.auth.userId) {
    const error = new Error('Unauthorized');
    error.statusCode = 401;
    throw error;
  }
  if (roles.length) {
    if (!roles.includes(context.auth.role)) {
      throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
    }
  }
  if (context.auth.role !== 'SUPER_ADMIN' && context.tenantId) {
    await tenantService.ensureActiveTenant(context.tenantId);
  }
}
