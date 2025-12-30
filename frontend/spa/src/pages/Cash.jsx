import React, { useState, useEffect } from 'react';

export function Cash({ api, tenant_id }) {
    const [movements, setMovements] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ type: 'INCOME', category: 'PAYMENT', method_code: 'CASH', amount: '', note: '' });

    async function loadCash() {
        try {
            const data = await api.request(`/admin/cash?tenant_id=${tenant_id}`);
            setMovements(data.cash || data);
        } catch (err) {
            console.error(err);
        }
    }

    async function createMovement() {
        if (!form.amount) {
            alert('⚠️ Ingresa un monto');
            return;
        }
        try {
            await api.request(`/admin/cash?tenant_id=${tenant_id}`, {
                method: 'POST',
                body: JSON.stringify({ ...form, amount: parseFloat(form.amount) })
            });
            alert('✅ Movimiento registrado');
            setForm({ type: 'INCOME', category: 'PAYMENT', method_code: 'CASH', amount: '', note: '' });
            setShowForm(false);
            loadCash();
        } catch (err) {
            alert('❌ Error: ' + err.message);
        }
    }

    useEffect(() => {
        loadCash();
    }, [tenant_id]);

    const totalIncome = movements.filter(m => m.type === 'INCOME').reduce((sum, m) => sum + parseFloat(m.amount || 0), 0);
    const totalExpense = movements.filter(m => m.type === 'EXPENSE').reduce((sum, m) => sum + parseFloat(m.amount || 0), 0);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>💰 Caja</h1>
                <button onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancelar' : '+ Nuevo Movimiento'}
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 10px', color: 'var(--success)' }}>Ingresos</h3>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>${totalIncome.toLocaleString()}</p>
                </div>
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 10px', color: 'var(--danger)' }}>Egresos</h3>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>${totalExpense.toLocaleString()}</p>
                </div>
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 10px', color: 'var(--primary)' }}>Balance</h3>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>${(totalIncome - totalExpense).toLocaleString()}</p>
                </div>
            </div>

            {showForm && (
                <div className="card" style={{ marginBottom: '20px' }}>
                    <h3>Nuevo Movimiento</h3>
                    <div className="row">
                        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                            <option value="INCOME">Ingreso</option>
                            <option value="EXPENSE">Egreso</option>
                        </select>
                        <input placeholder="Categoría" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
                        <select value={form.method_code} onChange={e => setForm({ ...form, method_code: e.target.value })}>
                            <option value="CASH">Efectivo</option>
                            <option value="TRANSFER">Transferencia</option>
                        </select>
                        <input placeholder="Monto *" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                        <button onClick={createMovement}>Registrar</button>
                    </div>
                    <input placeholder="Nota" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
                </div>
            )}

            <div className="card">
                {movements.length === 0 ? (
                    <p style={{ color: 'var(--text-dim)' }}>No hay movimientos de caja.</p>
                ) : (
                    <table>
                        <thead>
                            <tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Monto</th><th>Método</th></tr>
                        </thead>
                        <tbody>
                            {movements.map((m, i) => (
                                <tr key={i}>
                                    <td>{new Date(m.occurred_at).toLocaleString()}</td>
                                    <td><span className={`badge ${m.type === 'INCOME' ? 'success' : 'danger'}`}>{m.type}</span></td>
                                    <td>{m.category}</td>
                                    <td>${m.amount?.toLocaleString()}</td>
                                    <td>{m.method}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
