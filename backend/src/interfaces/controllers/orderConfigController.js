import { z } from 'zod';
import { requireAuth } from '../../infrastructure/http/authGuard.js';
import { orderStatusesRepository } from '../../domain/repositories/orderStatusesRepository.js';
import { orderStatusTransitionsRepository } from '../../domain/repositories/orderStatusTransitionsRepository.js';

const statusSchema = z.object({
    name: z.string(),
    code: z.string(),
    sort_order: z.number()
});

const transitionSchema = z.object({
    from_status_id: z.string(),
    to_status_id: z.string()
});

export const orderConfigController = {
    listStatuses: async (context) => {
        await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
        const statuses = await orderStatusesRepository.list(context.user.tenant_id);
        context.res.writeHead(200, { 'Content-Type': 'application/json' });
        context.res.end(JSON.stringify({ statuses }));
    },

    createStatus: async (context) => {
        await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
        const payload = statusSchema.parse(context.body || {});
        const id = await orderStatusesRepository.create({
            tenant_id: context.user.tenant_id,
            ...payload
        });
        context.res.writeHead(201, { 'Content-Type': 'application/json' });
        context.res.end(JSON.stringify({ id }));
    },

    updateStatus: async (context) => {
        await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
        const payload = statusSchema.parse(context.body || {});
        await orderStatusesRepository.update(context.params.id, context.user.tenant_id, payload);
        context.res.writeHead(200, { 'Content-Type': 'application/json' });
        context.res.end(JSON.stringify({ updated: true }));
    },

    listTransitions: async (context) => {
        await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
        const transitions = await orderStatusTransitionsRepository.list(context.user.tenant_id);
        context.res.writeHead(200, { 'Content-Type': 'application/json' });
        context.res.end(JSON.stringify({ transitions }));
    },

    createTransition: async (context) => {
        await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
        const payload = transitionSchema.parse(context.body || {});
        await orderStatusTransitionsRepository.create({
            tenant_id: context.user.tenant_id,
            ...payload
        });
        context.res.writeHead(201, { 'Content-Type': 'application/json' });
        context.res.end(JSON.stringify({ created: true }));
    },

    deleteTransition: async (context) => {
        await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
        const payload = transitionSchema.parse(context.body || {}); // or query params?
        // Using body for DELETE is allowed but sometimes tricky. Let's assume BODY for now as per plan.
        await orderStatusTransitionsRepository.delete(
            context.user.tenant_id,
            payload.from_status_id,
            payload.to_status_id
        );
        context.res.writeHead(200, { 'Content-Type': 'application/json' });
        context.res.end(JSON.stringify({ deleted: true }));
    }
};
