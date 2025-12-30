import React, { useState } from 'react';

// Note: API_URL isn't directly needed if we pass a callback, but the component does fetch directly.
// We can assume it's passed or imported. Let's import it from client.js context or environment.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function Login({ onLoggedIn }) {
    const [loginType, setLoginType] = useState('admin');
    const [tenantId, setTenantId] = useState('');
    const [dni, setDni] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        const body = { dni, password };
        if (loginType !== 'superadmin' && tenantId) {
            body.tenant_id = tenantId;
        }

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            onLoggedIn(data.access_token, data.user);
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <div className="container" style={{ maxWidth: '500px', marginTop: '100px' }}>
            <div className="card">
                <h2>🔐 Iniciar Sesión</h2>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <button
                        className={loginType === 'superadmin' ? 'success' : 'secondary'}
                        onClick={() => setLoginType('superadmin')}
                    >
                        👑 Super Admin
                    </button>
                    <button
                        className={loginType === 'admin' ? 'success' : 'secondary'}
                        onClick={() => setLoginType('admin')}
                    >
                        ⚙️ Admin
                    </button>
                    <button
                        className={loginType === 'user' ? 'success' : 'secondary'}
                        onClick={() => setLoginType('user')}
                    >
                        👤 Cliente
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {loginType !== 'superadmin' && (
                        <div>
                            <label>Tenant ID *</label>
                            <input value={tenantId} onChange={e => setTenantId(e.target.value)} placeholder="ID de la empresa" />
                        </div>
                    )}
                    <div>
                        <label>DNI</label>
                        <input value={dni} onChange={e => setDni(e.target.value)} placeholder="Tu DNI" />
                    </div>
                    <div>
                        <label>Contraseña</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                    <button type="submit">Ingresar</button>
                </form>
                {error && <p className="error">{error}</p>}

                {loginType === 'superadmin' && (
                    <div style={{ marginTop: '15px', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                        Credenciales: DNI <code>00000000</code> / Password <code>admin123</code>
                    </div>
                )}
            </div>
        </div>
    );
}
