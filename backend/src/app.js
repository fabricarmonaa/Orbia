import 'dotenv/config';
import http from 'node:http';
import { createRouter } from './interfaces/routers/router.js';
import { createContextMiddleware } from './infrastructure/http/contextMiddleware.js';
import { jsonParser } from './infrastructure/http/jsonParser.js';
import { errorHandler } from './infrastructure/http/errorHandler.js';
import { ensureBootstrapAdmin } from './bootstrap.js';
import { bootstrapCqrs } from './bootstrapCqrs.js';
import { corsMiddleware } from './infrastructure/http/corsMiddleware.js';

const router = createRouter();
const PORT = process.env.PORT || 3000;

async function start() {
  bootstrapCqrs();
  try {
    await ensureBootstrapAdmin();
  } catch (err) {
    console.error('⚠️ DB Bootstrap failed - API starting in limited mode', err.message);
  }

  const server = http.createServer(async (req, res) => {
    if (corsMiddleware(req, res)) return;

    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      const bodyRaw = Buffer.concat(chunks).toString();
      try {
        const context = createContextMiddleware(req, res, bodyRaw);
        await jsonParser(context);
        await router.handle(context);
      } catch (error) {
        console.log('App.js CAUGHT ERROR:', error);
        errorHandler(res, error);
      }
    });
  });

  server.listen(PORT, () => {
    console.log(`API listening on port ${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start API', err);
  process.exit(1);
});
