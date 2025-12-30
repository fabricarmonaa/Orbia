import { z } from 'zod';
import { requireAuth } from '../../infrastructure/http/authGuard.js';
import { cashSessionsRepository } from '../../domain/repositories/cashSessionsRepository.js';
import { fixedExpensesRepository } from '../../domain/repositories/fixedExpensesRepository.js';

const openSessionSchema = z.object({
    opening_amount: z.number().min(0)
});

const closeSessionSchema = z.object({
    closing_amount: z.number().min(0)
});

const fixedExpenseSchema = z.object({
    name: z.string(),
    amount: z.number().positive(),
    category_id: z.string(),
    due_day: z.number().min(1).max(31)
});

export const cashSessionConfigController = {
    openSession: async (context) => {
        await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
        const active = await cashSessionsRepository.findActive(context.user.tenant_id);
        if (active) {
            const error = new Error('Session already open');
            error.statusCode = 409;
            throw error;
        }
        const payload = openSessionSchema.parse(context.body || {});
        const id = await cashSessionsRepository.create({
            tenant_id: context.user.tenant_id,
            opening_amount: payload.opening_amount
        });
        context.res.writeHead(201, { 'Content-Type': 'application/json' });
        context.res.end(JSON.stringify({ id }));
    },

    closeSession: async (context) => {
        await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
        const active = await cashSessionsRepository.findActive(context.user.tenant_id);
        if (!active) {
            const error = new Error('No active session');
            error.statusCode = 404;
            throw error;
        }
        const payload = closeSessionSchema.parse(context.body || {});
        await cashSessionsRepository.close(active.id, context.user.tenant_id, payload.closing_amount);
        context.res.writeHead(200, { 'Content-Type': 'application/json' });
        context.res.end(JSON.stringify({ closed: true }));
    },

    statusSession: async (context) => {
        await requireAuth(context); // any auth
        const active = await cashSessionsRepository.findActive(context.user.tenant_id);
        context.res.writeHead(200, { 'Content-Type': 'application/json' });
        context.res.end(JSON.stringify({ active: !!active, session: active }));
    },

    listFixedExpenses: async (context) => {
        await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
        const expenses = await fixedExpensesRepository.list(context.user.tenant_id);
        context.res.writeHead(200, { 'Content-Type': 'application/json' });
        context.res.end(JSON.stringify({ expenses }));
    },

    createFixedExpense: async (context) => {
        await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
        const payload = fixedExpenseSchema.parse(context.body || {});
        const id = await fixedExpensesRepository.create({
            tenant_id: context.user.tenant_id,
            ...payload
        });
        context.res.writeHead(201, { 'Content-Type': 'application/json' });
        context.res.end(JSON.stringify({ id }));
    },

    deleteFixedExpense: async (context) => {
        await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
        await fixedExpensesRepository.delete(context.params.id, context.user.tenant_id);
        context.res.writeHead(200, { 'Content-Type': 'application/json' });
        context.res.end(JSON.stringify({ deleted: true }));
    }
};
