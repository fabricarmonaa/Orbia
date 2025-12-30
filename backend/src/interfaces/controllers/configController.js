import { z } from 'zod';
import { requireAuth } from '../../infrastructure/http/authGuard.js';
import { tenantSettingsRepository } from '../../domain/repositories/tenantSettingsRepository.js';
import { userPreferencesRepository } from '../../domain/repositories/userPreferencesRepository.js';
import { auditEventsRepository } from '../../domain/repositories/auditEventsRepository.js';

const tenantSettingsSchema = z.object({
    business_name: z.string().optional(),
    business_email: z.string().email().optional(),
    business_phone: z.string().optional(),
    business_address: z.string().optional(),
    currency: z.string().optional(),
    currency_symbol: z.string().optional(),
    timezone: z.string().optional(),
    date_format: z.string().optional(),
    tax_rate: z.string().optional(),
    tax_included: z.string().optional(),
    invoice_prefix: z.string().optional(),
    invoice_next_number: z.string().optional(),
    default_order_status: z.string().optional()
}).catchall(z.string()); // Allow any other string keys

const userPreferencesSchema = z.object({
    theme: z.enum(['light', 'dark']).optional(),
    language: z.enum(['es', 'en']).optional(),
    notifications_email: z.string().optional(),
    notifications_push: z.string().optional(),
    notifications_sms: z.string().optional(),
    dashboard_layout: z.string().optional()
}).catchall(z.string()); // Allow any other string keys

export const configController = {
    // Tenant Settings
    getTenantSettings: async (context) => {
        await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
        const settings = await tenantSettingsRepository.getAll(context.user.tenant_id);
        context.res.writeHead(200, { 'Content-Type': 'application/json' });
        context.res.end(JSON.stringify({ settings }));
    },

    updateTenantSettings: async (context) => {
        await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
        const payload = tenantSettingsSchema.parse(context.body || {});

        await tenantSettingsRepository.setMultiple(context.user.tenant_id, payload);

        await auditEventsRepository.append({
            tenant_id: context.user.tenant_id,
            aggregate_id: context.user.tenant_id,
            type: 'TENANT_SETTINGS_UPDATED',
            payload: { keys: Object.keys(payload) }
        });

        context.res.writeHead(200, { 'Content-Type': 'application/json' });
        context.res.end(JSON.stringify({ updated: true }));
    },

    initializeTenantDefaults: async (context) => {
        await requireAuth(context, ['SUPER_ADMIN']);
        const tenant_id = context.params.tenant_id || context.user.tenant_id;

        await tenantSettingsRepository.initializeDefaults(tenant_id);

        context.res.writeHead(200, { 'Content-Type': 'application/json' });
        context.res.end(JSON.stringify({ initialized: true }));
    },

    // User Preferences
    getUserPreferences: async (context) => {
        await requireAuth(context);
        const preferences = await userPreferencesRepository.getAll(context.user.user_id);
        context.res.writeHead(200, { 'Content-Type': 'application/json' });
        context.res.end(JSON.stringify({ preferences }));
    },

    updateUserPreferences: async (context) => {
        await requireAuth(context);
        const payload = userPreferencesSchema.parse(context.body || {});

        await userPreferencesRepository.setMultiple(context.user.user_id, payload);

        context.res.writeHead(200, { 'Content-Type': 'application/json' });
        context.res.end(JSON.stringify({ updated: true }));
    }
};
