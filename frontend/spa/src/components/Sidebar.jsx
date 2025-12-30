import React, { useState } from 'react';
import './Sidebar.css';

export function Sidebar({ activeModule, onModuleChange, onLogout, userRole, tenantName }) {
    const [collapsed, setCollapsed] = useState(false);

    const modules = [
        { id: 'dashboard', icon: '📊', label: 'Dashboard' },
        { id: 'orders', icon: '📦', label: 'Pedidos' },
        { id: 'products', icon: '🏷️', label: 'Productos' },
        { id: 'clients', icon: '👥', label: 'Clientes' },
        { id: 'payments', icon: '💳', label: 'Pagos' },
        { id: 'cash', icon: '💰', label: 'Caja' },
        { id: 'settings', icon: '⚙️', label: 'Configuración' }
    ];

    return (
        <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <div className="sidebar-brand">
                    {!collapsed && <h2>🚀 Orbia</h2>}
                    {collapsed && <h2>🚀</h2>}
                </div>
                <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
                    {collapsed ? '→' : '←'}
                </button>
            </div>

            {!collapsed && tenantName && (
                <div className="sidebar-tenant">
                    <p>{tenantName}</p>
                </div>
            )}

            <nav className="sidebar-nav">
                {modules.map(module => (
                    <button
                        key={module.id}
                        className={`nav-item ${activeModule === module.id ? 'active' : ''}`}
                        onClick={() => onModuleChange(module.id)}
                        title={collapsed ? module.label : ''}
                    >
                        <span className="nav-icon">{module.icon}</span>
                        {!collapsed && <span className="nav-label">{module.label}</span>}
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                <button className="logout-btn" onClick={onLogout} title={collapsed ? 'Cerrar Sesión' : ''}>
                    <span className="nav-icon">🚪</span>
                    {!collapsed && <span>Cerrar Sesión</span>}
                </button>
            </div>
        </div>
    );
}
