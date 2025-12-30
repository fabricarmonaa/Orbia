import http from 'node:http';
import https from 'node:https';

export function postJson(url, body) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const lib = target.protocol === 'https:' ? https : http;
    const data = JSON.stringify(body);
    const req = lib.request(
      {
        method: 'POST',
        hostname: target.hostname,
        port: target.port,
        path: target.pathname,
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
      },
      res => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          try {
            const raw = Buffer.concat(chunks).toString() || '{}';
            const parsed = JSON.parse(raw);
            resolve(parsed);
          } catch (err) {
            reject(new Error(`Failed to parse response: ${err.message}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}
