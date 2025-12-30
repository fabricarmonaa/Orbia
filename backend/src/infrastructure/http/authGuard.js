import { tenantService } from '../../application/tenantService.js';

export async function requireAuth(context, roles = []) {
  if (!context.user) {
    const error = new Error('Unauthorized');
    error.statusCode = 401;
    throw error;
  }
  if (roles.length) {
    if (!roles.includes(context.user.role)) {
      console.log(`Auth Fail: Role ${context.user.role} not in ${roles}`);
      console.trace('Auth Fail Trace');
      throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
    }
  }
  if (context.user.role !== 'SUPER_ADMIN') {
    await tenantService.ensureActiveTenant(context.user.tenant_id);
  }
}
