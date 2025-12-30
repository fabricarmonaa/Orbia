import { useMemo } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function useApi(token) {
    return useMemo(() => ({
        async request(path, options = {}) {
            const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
            if (token) headers.Authorization = `Bearer ${token}`;
            const res = await fetch(`${API_URL}${path}`, { ...options, headers });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || res.statusText);
            }
            return res.status === 204 ? null : res.json();
        }
    }), [token]);
}
