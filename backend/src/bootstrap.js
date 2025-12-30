import { hashPassword } from './infrastructure/security/password.js';
import { tenantsRepository } from './domain/repositories/tenantsRepository.js';
import { tenantStatusHistoryRepository } from './domain/repositories/tenantStatusHistoryRepository.js';
import { orderStatusesRepository } from './domain/repositories/orderStatusesRepository.js';
import { usersRepository } from './domain/repositories/usersRepository.js';
import { userProfilesRepository } from './domain/repositories/userProfilesRepository.js';
import { auditEventsRepository } from './domain/repositories/auditEventsRepository.js';
import { usersReadRepository } from './domain/repositories/usersReadRepository.js';

export async function ensureBootstrapAdmin() {
  const tenantId = process.env.SUPER_ADMIN_TENANT_ID || 'root-tenant';
  const tenantName = process.env.SUPER_ADMIN_TENANT_NAME || 'Root Tenant';

  let tenant = await tenantsRepository.findById(tenantId);
  if (!tenant) {
    tenant = await tenantsRepository.create({ id: tenantId, name: tenantName, status: 'ACTIVE' });
    await tenantStatusHistoryRepository.addEntry({ tenant_id: tenant.id, status: 'ACTIVE' });
    await orderStatusesRepository.seedDefaults(tenant.id);
  }

  const dni = process.env.SUPER_ADMIN_DNI || '00000000';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'admin123';
  const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@example.com';
  const phone = process.env.SUPER_ADMIN_PHONE || '0000';
  const first_name = process.env.SUPER_ADMIN_FIRST_NAME || 'Super';
  const last_name = process.env.SUPER_ADMIN_LAST_NAME || 'Admin';

  const password_hash = await hashPassword(password);
  const existingUser = await usersRepository.findByDniWithinTenant(tenant.id, dni);
  const user =
    existingUser ||
    (await usersRepository.create({ tenant_id: tenant.id, dni, role: 'SUPER_ADMIN', password_hash, active: 1 }));

  if (!existingUser) {
    await userProfilesRepository.create({ user_id: user.id, first_name, last_name, email, phone });

    await auditEventsRepository.append({
      tenant_id: tenant.id,
      aggregate_id: user.id,
      type: 'USER_CREATED',
      payload: { role: 'SUPER_ADMIN', dni, profile: { first_name, last_name, email, phone } }
    });

    await usersReadRepository.refreshFromSources(tenant.id, user.id);
  }
  console.log(`Bootstrapped SUPER_ADMIN dni=${dni} password=${password} tenant=${tenant.id}`);
}
