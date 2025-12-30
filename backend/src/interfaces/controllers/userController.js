import { requireAuth } from '../../infrastructure/http/authGuard.js';
import { usersRepository } from '../../domain/repositories/usersRepository.js';
import { userProfilesRepository } from '../../domain/repositories/userProfilesRepository.js';
import { hashPassword } from '../../infrastructure/security/password.js';
import { ordersReadRepository } from '../../domain/repositories/ordersReadRepository.js';
import { paymentsReadRepository } from '../../domain/repositories/paymentsReadRepository.js';

export const userController = {
  profile: async context => {
    await requireAuth(context, ['USER', 'ADMIN', 'SUPER_ADMIN']);
    const user = await usersRepository.findById(context.user.user_id, context.user.tenant_id);
    const profile = await userProfilesRepository.findByUserId(context.user.user_id);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    const { password_hash, ...safeUser } = user;
    context.res.writeHead(200, { 'Content-Type': 'application/json' });
    context.res.end(JSON.stringify({ user: safeUser, profile }));
  },
  changePassword: async context => {
    await requireAuth(context, ['USER', 'ADMIN', 'SUPER_ADMIN']);
    const newPassword = context.body?.password;
    if (!newPassword) {
      const error = new Error('Password required');
      error.statusCode = 400;
      throw error;
    }
    const password_hash = await hashPassword(newPassword);
    await usersRepository.updatePassword({
      id: context.user.user_id,
      tenant_id: context.user.tenant_id,
      password_hash
    });
    context.res.writeHead(200, { 'Content-Type': 'application/json' });
    context.res.end(JSON.stringify({ changed: true }));
  },
  myOrders: async context => {
    await requireAuth(context, ['USER', 'ADMIN', 'SUPER_ADMIN']);
    const page = Number(context.query.get('page') || '1');
    const limit = Number(context.query.get('limit') || '20');
    const orders = await ordersReadRepository.list({
      tenant_id: context.user.tenant_id,
      filters: { user_id: context.user.user_id },
      page,
      limit
    });
    context.res.writeHead(200, { 'Content-Type': 'application/json' });
    context.res.end(JSON.stringify({ orders }));
  },
  myPayments: async context => {
    await requireAuth(context, ['USER', 'ADMIN', 'SUPER_ADMIN']);
    const page = Number(context.query.get('page') || '1');
    const limit = Number(context.query.get('limit') || '20');
    const payments = await paymentsReadRepository.list({
      tenant_id: context.user.tenant_id,
      user_id: context.user.user_id,
      page,
      limit
    });
    context.res.writeHead(200, { 'Content-Type': 'application/json' });
    context.res.end(JSON.stringify({ payments }));
  }
};
