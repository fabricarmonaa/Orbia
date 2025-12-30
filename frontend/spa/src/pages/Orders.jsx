import React, { useState, useEffect } from 'react';

export function Orders({ api, tenant_id }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    async function loadOrders() {
        setLoading(true);
        try {
            const data = await api.request(`/admin/orders?tenant_id=${tenant_id}`);
            setOrders(data.orders || data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function generateTracking(orderId) {
        try {
            const res = await api.request(`/admin/orders/${orderId}/tracking-link`, { method: 'POST' });
            const url = `${window.location.origin}/track/${res.token}`;
            prompt('🔗 Link de rastreo generado (copiar):', url);
        } catch (err) {
            alert('Error generando link: ' + err.message);
        }
    }

    useEffect(() => {
        loadOrders();
    }, [tenant_id]);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>📦 Pedidos ({orders.length})</h1>
                <button onClick={loadOrders}>🔄 Recargar</button>
            </div>

            <div className="card">
                {loading ? <p>Cargando...</p> : orders.length === 0 ? (
                    <p style={{ color: 'var(--text-dim)' }}>No hay pedidos.</p>
                ) : (
                    <table>
                        <thead>
                            <tr><th>ID</th><th>Cliente</th><th>Estado</th><th>Total</th><th>Acciones</th></tr>
                        </thead>
                        <tbody>
                            {orders.map((o, i) => (
                                <tr key={i}>
                                    <td><code>{o.id?.slice(0, 8)}</code></td>
                                    <td>{o.client_name || o.client_dni}</td>
                                    <td><span className="badge warning">{o.status}</span></td>
                                    <td>${o.total?.toLocaleString()}</td>
                                    <td>
                                        <button className="small" onClick={() => generateTracking(o.id)}>🔗 Rastreo</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
