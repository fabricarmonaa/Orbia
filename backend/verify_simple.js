const API_URL = 'http://localhost:3001';

async function main() {
    console.log('--- Verification Start ---');

    // 1. Health
    try {
        const h = await fetch(`${API_URL}/health`);
        console.log('Health Status:', h.status);
        if (!h.ok) throw new Error('Health failed');
    } catch (e) {
        console.error('Fetch failed or health bad:', e);
        process.exit(1);
    }

    // 2. Login
    let token = '';
    try {
        const login = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dni: '00000000', password: 'admin123' })
        });
        if (!login.ok) throw new Error(await login.text());
        const data = await login.json();
        console.log('Login Success. Token:', data.access_token.slice(0, 10));
        token = data.access_token;
    } catch (e) {
        console.error('Login Failed:', e);
        process.exit(1);
    }

    // 3. Check Products
    try {
        const prod = await fetch(`${API_URL}/admin/products?tenant_id=t_root`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!prod.ok) throw new Error(await prod.text());
        const prods = await prod.json();
        const list = prods.products || prods;
        console.log('Products Count:', list.length);
        if (list.length < 3) throw new Error('Seeding failed (not enough products)');
    } catch (e) {
        console.error('Products check failed:', e);
        process.exit(1);
    }

    console.log('--- Verification Success ---');
}

main();
