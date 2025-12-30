import React, { useState } from 'react';
import { useApi } from './api/client';
import { Sidebar } from './components/Sidebar';
import { VoiceAssistant } from './components/VoiceAssistant';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Clients } from './pages/Clients';
import { Payments } from './pages/Payments';
import { Cash } from './pages/Cash';
import { Settings } from './pages/Settings';
import { Orders } from './pages/Orders';
import { Products } from './pages/Products';

import './styles.css';
import './components/Sidebar.css';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('orbia_token') || '');
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem('orbia_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [activeModule, setActiveModule] = useState('dashboard');
  const api = useApi(token);

  function handleLogin(newToken, userInfo) {
    setToken(newToken);
    setUser(userInfo);
    localStorage.setItem('orbia_token', newToken);
    localStorage.setItem('orbia_user', JSON.stringify(userInfo));
  }

  function logout() {
    setToken('');
    setUser(null);
    localStorage.clear();
  }

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  if (!token || !user) {
    return <Login onLoggedIn={handleLogin} />;
  }

  if (!isAdmin) {
    return (
      <div className="container">
        <div className="card">
          <h2>Acceso Denegado</h2>
          <p>Solo administradores pueden acceder al panel.</p>
          <button onClick={logout}>Volver al Login</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        onLogout={logout}
        userRole={user.role}
        tenantName={user.tenant_id}
      />

      <main style={{ flex: 1, marginLeft: '260px', padding: '30px', transition: 'margin-left 0.3s ease' }}>
        {activeModule === 'dashboard' && <Dashboard api={api} tenant_id={user.tenant_id} />}
        {activeModule === 'orders' && <Orders api={api} tenant_id={user.tenant_id} />}
        {activeModule === 'products' && <Products api={api} tenant_id={user.tenant_id} />}
        {activeModule === 'clients' && <Clients api={api} tenant_id={user.tenant_id} />}
        {activeModule === 'payments' && <Payments api={api} tenant_id={user.tenant_id} />}
        {activeModule === 'cash' && <Cash api={api} tenant_id={user.tenant_id} />}
        {activeModule === 'settings' && <Settings api={api} tenant_id={user.tenant_id} />}
      </main>

      {/* Global Voice Assistant */}
      <VoiceAssistant api={api} />
    </div>
  );
}
