import { requireAuth } from '../../infrastructure/http/authGuard.js';
import { requireTenantContext } from '../../infrastructure/http/tenantGuard.js';
import { sendOk } from '../../infrastructure/http/responses.js';
import { usersRepository } from '../../domain/repositories/usersRepository.js';
import { userProfilesRepository } from '../../domain/repositories/userProfilesRepository.js';
import { hashPassword } from '../../infrastructure/security/password.js';
import { queryBus } from '../../infrastructure/cqrs/QueryBus.js';
import { GetOrdersQuery } from '../../application/queries/orders/GetOrdersQuery.js';
import { GetPaymentsQuery } from '../../application/queries/payments/GetPaymentsQuery.js';

export const userController = {
  profile: async context => {
    await requireAuth(context, ['USER', 'ADMIN', 'SUPER_ADMIN']);
    const tenant_id = await requireTenantContext(context, { allowSuperAdminOverride: false });
    const user = await usersRepository.findById(context.auth.userId, tenant_id);
    const profile = await userProfilesRepository.findByUserId(context.auth.userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    const { password_hash, ...safeUser } = user;
    sendOk(context.res, { user: safeUser, profile });
  },
  changePassword: async context => {
    await requireAuth(context, ['USER', 'ADMIN', 'SUPER_ADMIN']);
    const tenant_id = await requireTenantContext(context, { allowSuperAdminOverride: false });
    const newPassword = context.body?.password;
    if (!newPassword) {
      const error = new Error('Password required');
      error.statusCode = 400;
      throw error;
    }
    const password_hash = await hashPassword(newPassword);
    await usersRepository.updatePassword({
      id: context.auth.userId,
      tenant_id,
      password_hash
    });
    sendOk(context.res, { changed: true });
  },
  myOrders: async context => {
    await requireAuth(context, ['USER', 'ADMIN', 'SUPER_ADMIN']);
    const tenant_id = await requireTenantContext(context, { allowSuperAdminOverride: false });
    const page = Number(context.query.get('page') || '1');
    const limit = Number(context.query.get('limit') || '20');
    const query = new GetOrdersQuery({
      tenant_id,
      filters: { user_id: context.auth.userId },
      page,
      limit
    });
    const orders = await queryBus.execute(query);
    sendOk(context.res, { orders });
  },
  myPayments: async context => {
    await requireAuth(context, ['USER', 'ADMIN', 'SUPER_ADMIN']);
    const tenant_id = await requireTenantContext(context, { allowSuperAdminOverride: false });
    const page = Number(context.query.get('page') || '1');
    const limit = Number(context.query.get('limit') || '20');
    const payments = await queryBus.execute(new GetPaymentsQuery({
      tenant_id,
      payload: { user_id: context.auth.userId, page, limit }
    }));
    sendOk(context.res, { payments });
  }
};
