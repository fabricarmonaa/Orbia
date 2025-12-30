import { z } from 'zod';
import { requireAuth } from '../../infrastructure/http/authGuard.js';
import { branchesRepository } from '../../domain/repositories/branchesRepository.js';

const branchSchema = z.object({
    name: z.string(),
    address: z.string().optional(),
    phone: z.string().optional()
});

export const branchController = {
    list: async (context) => {
        await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
        const branches = await branchesRepository.list(context.user.tenant_id);
        context.res.writeHead(200, { 'Content-Type': 'application/json' });
        context.res.end(JSON.stringify({ branches }));
    },

    create: async (context) => {
        await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
        const payload = branchSchema.parse(context.body || {});
        const id = await branchesRepository.create({
            tenant_id: context.user.tenant_id,
            ...payload
        });
        context.res.writeHead(201, { 'Content-Type': 'application/json' });
        context.res.end(JSON.stringify({ id }));
    },

    update: async (context) => {
        await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
        const payload = branchSchema.parse(context.body || {});
        await branchesRepository.update(context.params.id, context.user.tenant_id, payload);
        context.res.writeHead(200, { 'Content-Type': 'application/json' });
        context.res.end(JSON.stringify({ updated: true }));
    }
};
