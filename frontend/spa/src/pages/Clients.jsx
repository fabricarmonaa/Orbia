import React, { useState, useEffect } from 'react';

export function Clients({ api, tenant_id }) {
    const [clients, setClients] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ dni: '', first_name: '', last_name: '', email: '', phone: '', password: '' });

    async function loadClients() {
        try {
            const data = await api.request(`/admin/users?tenant_id=${tenant_id}`);
            setClients(data.users || data);
        } catch (err) {
            console.error(err);
        }
    }

    async function createClient() {
        if (!form.dni || !form.first_name || !form.last_name || !form.email) {
            alert('⚠️ Completa DNI, Nombre, Apellido y Email');
            return;
        }
        try {
            await api.request(`/admin/users?tenant_id=${tenant_id}`, {
                method: 'POST',
                body: JSON.stringify({ ...form, role: 'USER' })
            });
            alert(`✅ Cliente creado. DNI: ${form.dni}, Password: ${form.password || 'temporal123'}`);
            setForm({ dni: '', first_name: '', last_name: '', email: '', phone: '', password: '' });
            setShowForm(false);
            loadClients();
        } catch (err) {
            alert('❌ Error: ' + err.message);
        }
    }

    useEffect(() => {
        loadClients();
    }, [tenant_id]);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>👥 Clientes ({clients.length})</h1>
                <button onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancelar' : '+ Nuevo Cliente'}
                </button>
            </div>

            {showForm && (
                <div className="card" style={{ marginBottom: '20px' }}>
                    <h3>Crear Cliente</h3>
                    <div className="row">
                        <input placeholder="DNI *" value={form.dni} onChange={e => setForm({ ...form, dni: e.target.value })} />
                        <input placeholder="Nombre *" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} />
                        <input placeholder="Apellido *" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
                    </div>
                    <div className="row">
                        <input placeholder="Email *" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                        <input placeholder="Teléfono" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                        <input placeholder="Password (opcional)" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                        <button onClick={createClient}>Crear</button>
                    </div>
                </div>
            )}

            <div className="card">
                {clients.length === 0 ? (
                    <p style={{ color: 'var(--text-dim)' }}>No hay clientes. Crea el primero.</p>
                ) : (
                    <table>
                        <thead>
                            <tr><th>DNI</th><th>Nombre</th><th>Email</th><th>Balance</th><th>Estado</th></tr>
                        </thead>
                        <tbody>
                            {clients.map((c, i) => (
                                <tr key={i}>
                                    <td><code>{c.dni}</code></td>
                                    <td>{c.name}</td>
                                    <td>{c.email || 'N/A'}</td>
                                    <td>${c.balance?.toLocaleString() || 0}</td>
                                    <td><span className={`badge ${c.active ? 'success' : 'danger'}`}>{c.active ? 'Activo' : 'Inactivo'}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
