const API_URL = process.env.API_URL || 'http://localhost:3000';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Request failed');
  }
  return response.json();
}

export const api = {
  login: async (tenant_id, dni, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ tenant_id, dni, password })
    }),
  fetchAdminUsers: async token =>
    request('/admin/users', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    }),
  fetchAdminOrders: async token =>
    request('/admin/orders', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    }),
  fetchAdminPayments: async token =>
    request('/admin/payments', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    }),
  fetchAdminCash: async token =>
    request('/admin/cash', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    }),
  sendAiCommand: async (token, command) =>
    request('/admin/ai/command', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ command })
    }),
  confirmAiCommand: async (token, id) =>
    request(`/admin/ai/command/${id}/confirm`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }),
  rejectAiCommand: async (token, id) =>
    request(`/admin/ai/command/${id}/reject`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }),
  fetchTenants: async token =>
    request('/super/tenants', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    })
};
