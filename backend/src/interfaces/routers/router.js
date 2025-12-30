import { superAdminController } from '../controllers/superAdminController.js';
import { adminController } from '../controllers/adminController.js';
import { userController } from '../controllers/userController.js';
import { authController } from '../controllers/authController.js';
import { aiProxyController } from '../../interfaces/controllers/aiProxyController.js';
import { publicController } from '../controllers/publicController.js';
import { orderConfigController } from '../controllers/orderConfigController.js';
import { cashSessionConfigController } from '../controllers/cashSessionConfigController.js';
import { branchController } from '../../interfaces/controllers/branchController.js';
import { productController } from '../../interfaces/controllers/productController.js';
import { configController } from '../../interfaces/controllers/configController.js';

function buildRouteRegex(path) {
  const parts = path.split('/').filter(Boolean);
  const names = [];
  const regexParts = parts.map(p => {
    if (p.startsWith(':')) {
      names.push(p.slice(1));
      return '([^/]+)';
    }
    return p;
  });
  const regex = new RegExp(`^/${regexParts.join('/')}/?$`);
  return { regex, names };
}

export function createRouter() {
  const routes = [];

  function register(method, path, handler) {
    const { regex, names } = buildRouteRegex(path);
    routes.push({ method, regex, names, handler });
  }

  function matchRoute(method, path) {
    return routes.find(r => r.method === method && r.regex.test(path));
  }

  register('POST', '/auth/login', authController.login);
  register('POST', '/auth/refresh', authController.refresh);

  register('GET', '/super/tenants', superAdminController.listTenants);
  register('POST', '/super/tenants', superAdminController.createTenant);
  register('PATCH', '/super/tenants/status', superAdminController.updateTenantStatus);

  register('GET', '/admin/users', adminController.listUsers);
  register('POST', '/admin/users', adminController.createUser);
  register('PATCH', '/admin/users/:id', adminController.updateUser);
  register('GET', '/admin/users/:id', adminController.getUserDetails);
  register('DELETE', '/admin/users/:id', adminController.deactivateUser);
  register('GET', '/admin/orders', adminController.listOrders);
  register('POST', '/admin/orders', adminController.createOrder);
  register('PATCH', '/admin/orders/:id/status', adminController.updateOrderStatus);
  register('GET', '/admin/payments', adminController.listPayments);
  register('POST', '/admin/payments', adminController.registerPayment);
  register('GET', '/admin/cash', adminController.listCash);
  register('POST', '/admin/cash', adminController.createCash);
  register('GET', '/admin/invoices', adminController.listInvoices);
  register('POST', '/admin/invoices', adminController.createInvoice);

  register('POST', '/admin/ai/command', aiProxyController.handleVoiceCommand);
  register('POST', '/admin/ai/command/:id/confirm', aiProxyController.confirmCommand);
  register('POST', '/admin/ai/command/:id/reject', aiProxyController.rejectCommand);

  // Tracking
  register('POST', '/admin/orders/:id/tracking-link', adminController.generateTrackingLink);
  register('GET', '/track/:token', publicController.getTracking);

  // Config Order Statuses
  register('GET', '/admin/config/order-statuses', orderConfigController.listStatuses);
  register('POST', '/admin/config/order-statuses', orderConfigController.createStatus);
  register('PATCH', '/admin/config/order-statuses/:id', orderConfigController.updateStatus);

  register('GET', '/admin/config/order-statuses/transitions', orderConfigController.listTransitions);
  register('POST', '/admin/config/order-statuses/transitions', orderConfigController.createTransition);
  register('DELETE', '/admin/config/order-statuses/transitions', orderConfigController.deleteTransition);

  // Cash Sessions & Fixed Expenses
  register('GET', '/admin/cash/session/status', cashSessionConfigController.statusSession);
  register('POST', '/admin/cash/session/open', cashSessionConfigController.openSession);
  register('POST', '/admin/cash/session/close', cashSessionConfigController.closeSession);

  register('GET', '/admin/cash/fixed-expenses', cashSessionConfigController.listFixedExpenses);
  register('POST', '/admin/cash/fixed-expenses', cashSessionConfigController.createFixedExpense);
  register('DELETE', '/admin/cash/fixed-expenses/:id', cashSessionConfigController.deleteFixedExpense);

  // Branches
  register('GET', '/admin/branches', branchController.list);
  register('POST', '/admin/branches', branchController.create);
  register('PATCH', '/admin/branches/:id', branchController.update);

  // Products
  register('GET', '/admin/products', productController.list);
  register('POST', '/admin/products', productController.create);
  register('PATCH', '/admin/products/:id', productController.update);
  register('DELETE', '/admin/products/:id', productController.delete);
  register('GET', '/admin/products/export', productController.exportPriceList);

  // Configuration
  register('GET', '/admin/config/tenant', configController.getTenantSettings);
  register('PATCH', '/admin/config/tenant', configController.updateTenantSettings);
  register('POST', '/admin/config/tenant/initialize', configController.initializeTenantDefaults);

  register('GET', '/me/preferences', configController.getUserPreferences);
  register('PATCH', '/me/preferences', configController.updateUserPreferences);

  register('GET', '/me/profile', userController.profile);
  register('POST', '/me/password', userController.changePassword);
  register('GET', '/me/orders', userController.myOrders);
  register('GET', '/me/payments', userController.myPayments);

  // AI
  register('POST', '/admin/ai/command', aiProxyController.handleVoiceCommand);
  register('POST', '/admin/ai/command/:id/confirm', aiProxyController.confirmCommand);
  register('POST', '/admin/ai/command/:id/reject', aiProxyController.rejectCommand);

  register('GET', '/health', async (ctx) => {
    ctx.res.statusCode = 200;
    ctx.res.end(JSON.stringify({ ok: true }));
  });

  return {
    handle: async context => {
      const route = matchRoute(context.method, context.url.pathname);
      if (!route) {
        throw Object.assign(new Error('Not Found'), { statusCode: 404 });
      }
      const match = context.url.pathname.match(route.regex);
      if (match) {
        route.names.forEach((name, index) => {
          context.params[name] = match[index + 1];
        });
      }
      await route.handler(context);
    }
  };
}
