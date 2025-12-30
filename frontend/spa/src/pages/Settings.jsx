import React from 'react';

export function Settings({ api, tenant_id }) {
    return (
        <div>
            <h1>⚙️ Configuración</h1>
            <div className="card">
                <h3>Configuración del Sistema</h3>
                <p style={{ color: 'var(--text-dim)' }}>Módulo en desarrollo. Aquí podrás configurar:</p>
                <ul>
                    <li>Campos personalizados de clientes</li>
                    <li>Métodos de pago</li>
                    <li>Categorías de caja</li>
                    <li>Estados de pedidos</li>
                    <li>Plantillas de factura</li>
                </ul>
            </div>
        </div>
    );
}
