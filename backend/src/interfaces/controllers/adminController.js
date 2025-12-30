import { z } from 'zod';
import { requireAuth } from '../../infrastructure/http/authGuard.js';
import { requireTenantContext } from '../../infrastructure/http/tenantGuard.js';
import { sendOk } from '../../infrastructure/http/responses.js';
import { invoiceService } from '../../application/invoiceService.js';
import { invoicesRepository } from '../../domain/repositories/invoicesRepository.js';

import { commandBus } from '../../infrastructure/cqrs/CommandBus.js';
import { queryBus } from '../../infrastructure/cqrs/QueryBus.js';
import { CreateUserCommand } from '../../application/commands/users/CreateUserCommand.js';
import { UpdateUserCommand } from '../../application/commands/users/UpdateUserCommand.js';
import { DeactivateUserCommand } from '../../application/commands/users/DeactivateUserCommand.js';
import { GetUsersQuery } from '../../application/queries/users/GetUsersQuery.js';
import { GetUserDetailsQuery } from '../../application/queries/users/GetUserDetailsQuery.js';
import { CreateOrderCommand } from '../../application/commands/orders/CreateOrderCommand.js';
import { GetOrdersQuery } from '../../application/queries/orders/GetOrdersQuery.js';
import { UpdateOrderStatusCommand } from '../../application/commands/orders/UpdateOrderStatusCommand.js';
import { RegisterPaymentCommand } from '../../application/commands/payments/RegisterPaymentCommand.js';
import { CreateCashMovementCommand } from '../../application/commands/cash/CreateCashMovementCommand.js';
import { GenerateTrackingLinkCommand } from '../../application/commands/tracking/GenerateTrackingLinkCommand.js';
import { GetPaymentsQuery } from '../../application/queries/payments/GetPaymentsQuery.js';
import { GetCashboxQuery } from '../../application/queries/cash/GetCashboxQuery.js';

const createUserSchema = z.object({
  dni: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string(),
  phone: z.string(),
  role: z.enum(['USER', 'ADMIN']),
  password: z.string(),
  extra_fields: z.record(z.string()).optional()
});

const updateUserSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  email: z.string(),
  phone: z.string(),
  role: z.enum(['USER', 'ADMIN']),
  active: z.boolean(),
  extra_fields: z.record(z.string()).optional()
});

const createOrderSchema = z.object({
  user_id: z.string(),
  status_code: z.string(),
  internal_notes: z.string().optional(),
  user_notes: z.string().optional(),
  items: z.array(
    z.object({
      sku: z.string(),
      description: z.string(),
      quantity: z.number(),
      price: z.number()
    })
  )
});

const updateOrderStatusSchema = z.object({ status_code: z.string() });

const createInvoiceSchema = z.object({
  user_id: z.string(),
  template_id: z.string(),
  order_ids: z.array(z.string()),
  field_values: z.record(z.any())
});

export const adminController = {
  listUsers: async context => {
    await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
    const tenant_id = await requireTenantContext(context);
    const filters = {
      dni: context.query.get('dni') || undefined,
      name: context.query.get('name') || undefined,
      active: typeof context.query.get('active') !== 'undefined'
        ? context.query.get('active') === 'true'
        : undefined
    };
    const page = Number(context.query.get('page') || '1');
    const limit = Number(context.query.get('limit') || '20');

    // CQRS: Dispatch Query
    const query = new GetUsersQuery({ tenant_id, filters, page, limit });
    const users = await queryBus.execute(query);
    sendOk(context.res, { users });
  },

  createUser: async context => {
    await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
    const payload = createUserSchema.parse(context.body || {});
    const tenant_id = await requireTenantContext(context);

    // CQRS: Dispatch Command
    const command = new CreateUserCommand({ tenant_id, payload });
    const result = await commandBus.dispatch(command);
    sendOk(context.res, { user_id: result.user_id }, 201);
  },

  listOrders: async context => {
    await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
    const tenant_id = await requireTenantContext(context);
    const filters = {
      user_id: context.query.get('user_id') || undefined,
      status: context.query.get('status') || undefined,
      from: context.query.get('from') || undefined,
      to: context.query.get('to') || undefined
    };
    const page = Number(context.query.get('page') || '1');
    const limit = Number(context.query.get('limit') || '20');

    // CQRS: Dispatch Query
    const query = new GetOrdersQuery({ tenant_id, filters, page, limit });
    const orders = await queryBus.execute(query);
    sendOk(context.res, { orders });
  },

  createOrder: async context => {
    await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
    const tenant_id = await requireTenantContext(context);
    const payload = createOrderSchema.parse(context.body || {});

    // CQRS: Dispatch Command
    const command = new CreateOrderCommand({ tenant_id, payload });
    const result = await commandBus.dispatch(command);
    sendOk(context.res, { order_id: result.order_id }, 201);
  },

  updateOrderStatus: async context => {
    await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
    const tenant_id = await requireTenantContext(context);
    const payload = updateOrderStatusSchema.parse(context.body || {});
    const command = new UpdateOrderStatusCommand({ tenant_id, order_id: context.params.id, status_code: payload.status_code });
    const result = await commandBus.dispatch(command);
    sendOk(context.res, result);
  },

  listPayments: async context => {
    await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
    const tenant_id = await requireTenantContext(context);
    const page = Number(context.query.get('page') || '1');
    const limit = Number(context.query.get('limit') || '20');
    const user_id = context.query.get('user_id') || undefined;
    const payments = await queryBus.execute(new GetPaymentsQuery({ tenant_id, payload: { user_id, page, limit } }));
    sendOk(context.res, { payments });
  },

  listCash: async context => {
    await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
    const tenant_id = await requireTenantContext(context);
    const filters = {
      category: context.query.get('category') || undefined,
      method: context.query.get('method') || undefined,
      from: context.query.get('from') || undefined,
      to: context.query.get('to') || undefined
    };
    const page = Number(context.query.get('page') || '1');
    const limit = Number(context.query.get('limit') || '20');
    const cash = await queryBus.execute(new GetCashboxQuery({ tenant_id, payload: { filters, page, limit } }));
    sendOk(context.res, { cash });
  },

  createInvoice: async context => {
    await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
    const tenant_id = await requireTenantContext(context);
    const payload = createInvoiceSchema.parse(context.body || {});
    const invoice = await invoiceService.createInvoice({
      tenant_id,
      user_id: payload.user_id,
      template_id: payload.template_id,
      order_ids: payload.order_ids,
      field_values: payload.field_values
    });
    sendOk(context.res, { invoice_id: invoice.id }, 201);
  },

  listInvoices: async context => {
    await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
    const tenant_id = await requireTenantContext(context);
    const page = Number(context.query.get('page') || '1');
    const limit = Number(context.query.get('limit') || '20');
    const invoices = await invoicesRepository.listByTenant(tenant_id, { page, limit });
    sendOk(context.res, { invoices });
  },

  // ============ NEW ENDPOINTS ============

  updateUser: async context => {
    await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
    const tenant_id = await requireTenantContext(context);
    const user_id = context.params.id;
    const payload = updateUserSchema.parse(context.body || {});

    const command = new UpdateUserCommand({ tenant_id, user_id, payload });
    const result = await commandBus.dispatch(command);

    sendOk(context.res, result);
  },

  getUserDetails: async context => {
    await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
    const tenant_id = await requireTenantContext(context);
    const user_id = context.params.id;

    const query = new GetUserDetailsQuery({ tenant_id, user_id });
    const result = await queryBus.execute(query);

    sendOk(context.res, result);
  },

  deactivateUser: async context => {
    await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
    const tenant_id = await requireTenantContext(context);
    const user_id = context.params.id;

    const command = new DeactivateUserCommand({ tenant_id, user_id });
    const result = await commandBus.dispatch(command);

    sendOk(context.res, result);
  },

  registerPayment: async context => {
    await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
    const tenant_id = await requireTenantContext(context);
    const payload = z.object({
      user_id: z.string(),
      amount: z.number(),
      method_code: z.string(),
      order_ids: z.array(z.string()).optional(),
      note: z.string().optional()
    }).parse(context.body || {});

    const command = new RegisterPaymentCommand({ tenant_id, payload });
    const result = await commandBus.dispatch(command);

    sendOk(context.res, result, 201);
  },

  createCash: async context => {
    await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
    const tenant_id = await requireTenantContext(context);
    const payload = z.object({
      type: z.enum(['INCOME', 'EXPENSE']),
      category: z.string(),
      method_code: z.string(),
      amount: z.number(),
      user_id: z.string().optional(),
      note: z.string().optional()
    }).parse(context.body || {});

    const command = new CreateCashMovementCommand({ tenant_id, payload });
    const result = await commandBus.dispatch(command);

    sendOk(context.res, result, 201);
  },

  generateTrackingLink: async context => {
    await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
    const tenant_id = await requireTenantContext(context);
    const order_id = context.params.id;

    const command = new GenerateTrackingLinkCommand({
      tenant_id,
      payload: { tenant_id, order_id }
    });
    const result = await commandBus.dispatch(command);

    sendOk(context.res, result, 201);
  }
};
