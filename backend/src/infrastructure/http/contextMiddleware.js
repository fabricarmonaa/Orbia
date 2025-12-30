import { verifyToken } from '../security/jwt.js';

export function createContextMiddleware(req, res, rawBody) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const headers = req.headers;
  const method = req.method || 'GET';
  const auth = headers['authorization'];
  const token = auth?.startsWith('Bearer ')
    ? auth.slice('Bearer '.length)
    : undefined;
  if (token) console.log('Token extracted:', token.substring(0, 10) + '...');
  const user = token ? verifyToken(token) : null;
  if (token && !user) console.log('Token verification failed');
  if (user) console.log('User verified:', user.tenant_id, user.role);

  return {
    req,
    res,
    url,
    method,
    headers,
    rawBody,
    body: null,
    user,
    params: {},
    locals: {},
    query: url.searchParams
  };
}
