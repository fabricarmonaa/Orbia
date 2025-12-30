import { z } from 'zod';
import { requireAuth } from '../../infrastructure/http/authGuard.js';
import { productsRepository } from '../../domain/repositories/productsRepository.js';
import { auditEventsRepository } from '../../domain/repositories/auditEventsRepository.js';

const productSchema = z.object({
    sku: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    price: z.number().min(0),
    cost: z.number().min(0).optional(),
    stock: z.number().int().min(0).optional(),
    category: z.string().optional()
});

const updateProductSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    price: z.number().min(0),
    cost: z.number().min(0).optional(),
    stock: z.number().int().min(0).optional(),
    category: z.string().optional()
});

export const productController = {
    list: async (context) => {
        await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
        const category = context.query.get('category');
        const search = context.query.get('search');
        const active = context.query.get('active') !== 'false';

        const products = await productsRepository.list(context.user.tenant_id, { category, search, active });
        context.res.writeHead(200, { 'Content-Type': 'application/json' });
        context.res.end(JSON.stringify({ products }));
    },

    create: async (context) => {
        await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
        const payload = productSchema.parse(context.body || {});

        // Check SKU uniqueness
        const existing = await productsRepository.findBySku(payload.sku, context.user.tenant_id);
        if (existing) {
            const error = new Error('SKU already exists');
            error.statusCode = 409;
            throw error;
        }

        const id = await productsRepository.create({
            tenant_id: context.user.tenant_id,
            ...payload
        });

        await auditEventsRepository.append({
            tenant_id: context.user.tenant_id,
            aggregate_id: id,
            type: 'PRODUCT_CREATED',
            payload
        });

        context.res.writeHead(201, { 'Content-Type': 'application/json' });
        context.res.end(JSON.stringify({ id }));
    },

    update: async (context) => {
        await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
        const payload = updateProductSchema.parse(context.body || {});

        const product = await productsRepository.findById(context.params.id, context.user.tenant_id);
        if (!product) {
            const error = new Error('Product not found');
            error.statusCode = 404;
            throw error;
        }

        await productsRepository.update(context.params.id, context.user.tenant_id, payload);

        await auditEventsRepository.append({
            tenant_id: context.user.tenant_id,
            aggregate_id: context.params.id,
            type: 'PRODUCT_UPDATED',
            payload
        });

        context.res.writeHead(200, { 'Content-Type': 'application/json' });
        context.res.end(JSON.stringify({ updated: true }));
    },

    delete: async (context) => {
        await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);

        const product = await productsRepository.findById(context.params.id, context.user.tenant_id);
        if (!product) {
            const error = new Error('Product not found');
            error.statusCode = 404;
            throw error;
        }

        await productsRepository.delete(context.params.id, context.user.tenant_id);

        await auditEventsRepository.append({
            tenant_id: context.user.tenant_id,
            aggregate_id: context.params.id,
            type: 'PRODUCT_DELETED',
            payload: { sku: product.sku }
        });

        context.res.writeHead(200, { 'Content-Type': 'application/json' });
        context.res.end(JSON.stringify({ deleted: true }));
    },

    exportPriceList: async (context) => {
        await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);

        const products = await productsRepository.listForExport(context.user.tenant_id);

        // Generate CSV
        let csv = 'SKU,Nombre,Precio,Categoría\n';
        for (const p of products) {
            csv += `"${p.sku}","${p.name}","${p.price}","${p.category || ''}"\n`;
        }

        context.res.writeHead(200, {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': 'attachment; filename="lista_precios.csv"'
        });
        context.res.end(csv);
    }
};
