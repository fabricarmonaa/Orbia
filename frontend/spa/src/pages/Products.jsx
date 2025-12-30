import React, { useState, useEffect } from 'react';

export function Products({ api, tenant_id }) {
    const [products, setProducts] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', description: '', sku: '', price: '', stock: '' });

    async function loadProducts() {
        try {
            const data = await api.request(`/admin/products?tenant_id=${tenant_id}`);
            setProducts(data.products || data || []);
        } catch (err) {
            console.error(err);
        }
    }

    async function createProduct() {
        if (!form.name || !form.price) return alert('Nombre y precio requeridos');
        try {
            await api.request(`/admin/products?tenant_id=${tenant_id}`, {
                method: 'POST',
                body: JSON.stringify({ ...form, price: parseFloat(form.price), stock: parseInt(form.stock) || 0 })
            });
            alert('✅ Producto creado');
            setShowForm(false);
            setForm({ name: '', description: '', sku: '', price: '', stock: '' });
            loadProducts();
        } catch (err) {
            alert('Error: ' + err.message);
        }
    }

    async function exportCsv() {
        try {
            // This endpoint returns a Blob/Text (CSV), so we might need special handling if api.request expects JSON
            // But for now, let's open it in a new tab if it's GET
            window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/admin/products/export?tenant_id=${tenant_id}`, '_blank');
        } catch (err) {
            alert('Error exportando');
        }
    }

    useEffect(() => {
        loadProducts();
    }, [tenant_id]);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>🏷️ Productos ({products.length})</h1>
                <div style={{ gap: '10px', display: 'flex' }}>
                    <button className="secondary" onClick={exportCsv}>⬇️ Exportar CSV</button>
                    <button onClick={() => setShowForm(!showForm)}>
                        {showForm ? 'Cancelar' : '+ Nuevo Producto'}
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="card" style={{ marginBottom: '20px' }}>
                    <h3>Nuevo Producto</h3>
                    <div className="row">
                        <input placeholder="SKU" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} />
                        <input placeholder="Nombre *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                        <input placeholder="Precio *" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                        <input placeholder="Stock" type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
                        <button onClick={createProduct}>Guardar</button>
                    </div>
                    <input placeholder="Descripción" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
            )}

            <div className="card">
                {products.length === 0 ? (
                    <p style={{ color: 'var(--text-dim)' }}>No hay productos.</p>
                ) : (
                    <table>
                        <thead>
                            <tr><th>SKU</th><th>Nombre</th><th>Precio</th><th>Stock</th></tr>
                        </thead>
                        <tbody>
                            {products.map((p, i) => (
                                <tr key={i}>
                                    <td><code>{p.sku || '-'}</code></td>
                                    <td>{p.name}</td>
                                    <td>${p.price?.toLocaleString()}</td>
                                    <td>{p.stock}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
