import 'dotenv/config';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import { generateId } from './src/domain/utils/id.js';

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'orbia'
}; 

async function seed() {
    console.log('🌱 Starting Seed...');
    const conn = await mysql.createConnection(dbConfig);

    try {
        console.log('🧹 Clearing tables...');
        // Disable foreign keys to truncate safely
        await conn.query('SET FOREIGN_KEY_CHECKS = 0');
        const tables = [
            'ai_command_logs', 'audit_events', 'cash_movements', 'cash_categories', 'cash_sessions',
            'fixed_expenses', 'invoice_field_values', 'invoice_orders', 'invoices', 'invoice_template_fields',
            'invoice_templates', 'payment_orders', 'payments', 'payment_methods', 'order_items', 'orders',
            'order_status_history', 'order_status_transitions', 'orders_read', 'payments_read', 'cashbox_read',
            'users_read', 'monthly_finance_read', 'user_extra_values', 'extra_fields', 'user_profiles',
            'user_preferences', 'users', 'tenant_ai_configs', 'tenant_settings', 'tenant_status_history', 'tenants',
            'branches', 'products', 'public_tracking_links'
        ];

        for (const t of tables) {
            // Check if table exists before truncating to avoid errors
            const [exists] = await conn.query(`SHOW TABLES LIKE '${t}'`);
            if (exists.length > 0) {
                await conn.query(`TRUNCATE TABLE ${t}`);
            }
        }
        await conn.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('🏢 Creating Root Tenant...');
        const tenantId = 't_root';
        await conn.execute('INSERT INTO tenants (id, name, status) VALUES (?, ?, ?)', [tenantId, 'Orbia Default', 'ACTIVE']);

        console.log('👤 Creating Super Admin...');
        const adminId = generateId();
        const hash = await bcrypt.hash('admin123', 10);
        await conn.execute(
            'INSERT INTO users (id, tenant_id, dni, role, password_hash) VALUES (?, ?, ?, ?, ?)',
            [adminId, tenantId, '00000000', 'SUPER_ADMIN', hash]
        );

        console.log('💰 Creating Payment Methods...');
        const methods = [
            { name: 'Efectivo', code: 'CASH' },
            { name: 'Transferencia', code: 'TRANSFER' },
            { name: 'Tarjeta Crédito', code: 'CARD' },
            { name: 'Tarjeta Débito', code: 'DEBIT' }
        ];
        for (const m of methods) {
            await conn.execute(
                'INSERT INTO payment_methods (id, tenant_id, name, code) VALUES (?, ?, ?, ?)',
                [generateId(), tenantId, m.name, m.code]
            );
        }

        console.log('📊 Creating Order Statuses...');
        const statuses = [
            { name: 'Pendiente', code: 'PENDING', sort: 10 },
            { name: 'En Reparación', code: 'IN_PROGRESS', sort: 20 },
            { name: 'Listo', code: 'READY', sort: 30 },
            { name: 'Entregado', code: 'DELIVERED', sort: 40 },
            { name: 'Cancelado', code: 'CANCELLED', sort: 99 }
        ];
        for (const s of statuses) {
            await conn.execute(
                'INSERT INTO order_statuses (id, tenant_id, name, code, sort_order) VALUES (?, ?, ?, ?, ?)',
                [generateId(), tenantId, s.name, s.code, s.sort]
            );
        }

        console.log('📦 Creating Default Products...');
        const products = [
            { name: 'Reparación Placa Base', price: 25000, sku: 'REP-PCB' },
            { name: 'Cambio Pantalla iPhone X', price: 45000, sku: 'REP-SCR-IPX' },
            { name: 'Limpieza General', price: 15000, sku: 'SRV-CLN' }
        ];
        for (const p of products) {
            await conn.execute(
                'INSERT INTO products (id, tenant_id, name, price, sku, stock) VALUES (?, ?, ?, ?, ?, ?)',
                [generateId(), tenantId, p.name, p.price, p.sku, 100]
            );
        }

        console.log('✅ Seed Complete!');
        console.log('------------------------------------------------');
        console.log('Tenant ID: t_root');
        console.log('Super Admin: 00000000 / admin123');
        console.log('------------------------------------------------');

    } catch (err) {
        console.error('❌ Seed Failed:', err);
        process.exit(1);
    } finally {
        await conn.end();
    }
}

seed();
