import React, { useState, useEffect } from 'react';

export function Payments({ api, tenant_id }) {
    const [payments, setPayments] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ user_id: '', amount: '', method_code: 'CASH', note: '' });

    async function loadPayments() {
        try {
            const data = await api.request(`/admin/payments?tenant_id=${tenant_id}`);
            setPayments(data.payments || data);
        } catch (err) {
            console.error(err);
        }
    }

    async function registerPayment() {
        if (!form.user_id || !form.amount) {
            alert('⚠️ Completa Usuario y Monto');
            return;
        }
        try {
            await api.request(`/admin/payments?tenant_id=${tenant_id}`, {
                method: 'POST',
                body: JSON.stringify({ ...form, amount: parseFloat(form.amount) })
            });
            alert('✅ Pago registrado correctamente');
            setForm({ user_id: '', amount: '', method_code: 'CASH', note: '' });
            setShowForm(false);
            loadPayments();
        } catch (err) {
            alert('❌ Error: ' + err.message);
        }
    }

    useEffect(() => {
        loadPayments();
    }, [tenant_id]);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>💳 Pagos ({payments.length})</h1>
                <button onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancelar' : '+ Registrar Pago'}
                </button>
            </div>

            {showForm && (
                <div className="card" style={{ marginBottom: '20px' }}>
                    <h3>Registrar Pago</h3>
                    <div className="row">
                        <input placeholder="ID Usuario *" value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })} />
                        <input placeholder="Monto *" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                        <select value={form.method_code} onChange={e => setForm({ ...form, method_code: e.target.value })}>
                            <option value="CASH">Efectivo</option>
                            <option value="TRANSFER">Transferencia</option>
                            <option value="CARD">Tarjeta</option>
                        </select>
                        <button onClick={registerPayment}>Registrar</button>
                    </div>
                    <input placeholder="Nota (opcional)" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
                </div>
            )}

            <div className="card">
                {payments.length === 0 ? (
                    <p style={{ color: 'var(--text-dim)' }}>No hay pagos registrados.</p>
                ) : (
                    <table>
                        <thead>
                            <tr><th>Fecha</th><th>Cliente</th><th>Monto</th><th>Método</th><th>Nota</th></tr>
                        </thead>
                        <tbody>
                            {payments.map((p, i) => (
                                <tr key={i}>
                                    <td>{new Date(p.paid_at).toLocaleString()}</td>
                                    <td><code>{p.user_id?.slice(0, 8)}...</code></td>
                                    <td>${p.amount?.toLocaleString()}</td>
                                    <td>{p.method}</td>
                                    <td>{p.note || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
