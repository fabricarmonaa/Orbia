import React, { useState, useEffect } from 'react';

export function Dashboard({ api, tenant_id }) {
    const [stats, setStats] = useState({ total_clients: 0, active_clients: 0, total_balance: 0 });
    const [recentPayments, setRecentPayments] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);

    async function loadDashboard() {
        try {
            const [users, payments, orders] = await Promise.all([
                api.request(`/admin/users?tenant_id=${tenant_id}`),
                api.request(`/admin/payments?tenant_id=${tenant_id}&limit=5`),
                api.request(`/admin/orders?tenant_id=${tenant_id}&limit=5`)
            ]);

            const usersList = users.users || users;
            setStats({
                total_clients: usersList.length,
                active_clients: usersList.filter(u => u.active).length,
                total_balance: usersList.reduce((sum, u) => sum + (parseFloat(u.balance) || 0), 0)
            });

            setRecentPayments(payments.payments || payments || []);
            setRecentOrders(orders.orders || orders || []);
        } catch (err) {
            console.error(err);
        }
    }

    useEffect(() => {
        loadDashboard();
    }, [tenant_id]);

    return (
        <div>
            <h1>📊 Dashboard</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 10px', color: 'var(--primary)' }}>👥 Clientes</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{stats.total_clients}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Activos: {stats.active_clients}</p>
                </div>

                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 10px', color: 'var(--success)' }}>💰 Balance Total</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>${stats.total_balance.toLocaleString()}</p>
                </div>
            </div>

            <div className="card">
                <h3>💳 Últimos Pagos</h3>
                {recentPayments.length === 0 ? (
                    <p style={{ color: 'var(--text-dim)' }}>No hay pagos recientes</p>
                ) : (
                    <table>
                        <thead>
                            <tr><th>Fecha</th><th>Cliente</th><th>Monto</th><th>Método</th></tr>
                        </thead>
                        <tbody>
                            {recentPayments.slice(0, 5).map((p, i) => (
                                <tr key={i}>
                                    <td>{new Date(p.paid_at).toLocaleDateString()}</td>
                                    <td>{p.user_dni || 'N/A'}</td>
                                    <td>${p.amount?.toLocaleString()}</td>
                                    <td>{p.method}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="card">
                <h3>📦 Últimos Pedidos</h3>
                {recentOrders.length === 0 ? (
                    <p style={{ color: 'var(--text-dim)' }}>No hay pedidos recientes</p>
                ) : (
                    <table>
                        <thead>
                            <tr><th>ID</th><th>Estado</th><th>Total</th><th>Fecha</th></tr>
                        </thead>
                        <tbody>
                            {recentOrders.slice(0, 5).map((o, i) => (
                                <tr key={i}>
                                    <td><code>{o.id?.slice(0, 8)}...</code></td>
                                    <td><span className="badge warning">{o.status}</span></td>
                                    <td>${o.total?.toLocaleString() || 0}</td>
                                    <td>{new Date(o.last_update).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
