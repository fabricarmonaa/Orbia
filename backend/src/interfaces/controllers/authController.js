import { z } from 'zod';
import { tenantsRepository } from '../../domain/repositories/tenantsRepository.js';
import { usersRepository } from '../../domain/repositories/usersRepository.js';
import { signToken } from '../../infrastructure/security/jwt.js';
import { verifyPassword } from '../../infrastructure/security/password.js';
import { tenantService } from '../../application/tenantService.js';
import { generateId } from '../../domain/utils/id.js';

const loginSchema = z.object({
  tenant_id: z.string().optional(),
  dni: z.string(),
  password: z.string()
});

export const authController = {
  login: async ({ res, body }) => {
    const parsed = loginSchema.parse(body || {});
    const tenantId = parsed.tenant_id || process.env.SUPER_ADMIN_TENANT_ID || 'root-tenant';
    const tenant = await tenantService.ensureActiveTenant(tenantId);
    const user = await usersRepository.findByDniWithinTenant(tenantId, parsed.dni);
    if (!user || !user.active) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }
    const match = await verifyPassword(parsed.password, user.password_hash);
    if (!match) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }
    const tokenPayload = {
      tenant_id: tenantId,
      user_id: user.id,
      role: user.role,
      session_id: generateId(18)
    };
    const token = signToken(tokenPayload, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      access_token: token,
      expires_in: process.env.JWT_EXPIRES_IN || '3600',
      user: {
        id: user.id,
        tenant_id: parsed.tenant_id,
        role: user.role
      },
      tenant: { id: tenant.id, status: tenant.status }
    }));
  },

  refresh: async ({ res, user }) => {
    if (!user) {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }
    const tenant = await tenantsRepository.findById(user.tenant_id);
    if (!tenant || tenant.status === 'SUSPENDED') {
      const error = new Error('Tenant suspended');
      error.statusCode = 403;
      throw error;
    }
    const token = signToken({ ...user, session_id: generateId(18) }, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ access_token: token, expires_in: process.env.JWT_EXPIRES_IN || '3600' }));
  }
};
