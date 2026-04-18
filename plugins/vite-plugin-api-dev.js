/**
 * vite-plugin-api-dev
 *
 * Serves Vercel serverless functions from /api/*.js during local Vite dev.
 * Reads .env variables into process.env so handlers have access to secrets.
 * Only active in dev mode (configureServer is no-op in build).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function loadEnvFile(envPath) {
  try {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let value = trimmed.slice(eqIdx + 1).trim();
      // Strip surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (key && !(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env not found — skip
  }
}

export default function apiDevPlugin() {
  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      const root = server.config.root;

      // Load .env into process.env before handling any request
      loadEnvFile(path.resolve(root, '.env'));
      loadEnvFile(path.resolve(root, '.env.local'));

      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url ?? '';
        const urlPath = rawUrl.split('?')[0];

        if (!urlPath.startsWith('/api/')) return next();

        // Derive handler name from path: /api/unsplash-search → unsplash-search
        const handlerName = urlPath.replace(/^\/api\//, '').replace(/\/$/, '');

        // Reject internal files (prefixed with _)
        if (!handlerName || handlerName.startsWith('_') || handlerName.includes('/')) {
          return next();
        }

        const handlerFile = path.resolve(root, 'api', `${handlerName}.js`);

        if (!fs.existsSync(handlerFile)) return next();

        // Parse query string
        const urlObj = new URL(rawUrl, 'http://localhost');
        const query = Object.fromEntries(urlObj.searchParams.entries());

        // Minimal req/res wrappers compatible with the handler interface
        const reqProxy = {
          method: req.method,
          headers: req.headers,
          query,
        };

        const resProxy = {
          _code: 200,
          setHeader(key, value) {
            res.setHeader(key, value);
            return this;
          },
          status(code) {
            this._code = code;
            return this;
          },
          json(data) {
            if (!res.headersSent) {
              res.writeHead(this._code, { 'Content-Type': 'application/json; charset=utf-8' });
            }
            res.end(JSON.stringify(data));
          },
        };

        // Dynamic import of the handler (ESM file:// — no query string cache busting)
        import(fileURLToPath(new URL(`file:///${handlerFile.replace(/\\/g, '/')}`)))
          .then((mod) => {
            const handler = mod.default;
            if (typeof handler !== 'function') return next();
            return Promise.resolve(handler(reqProxy, resProxy));
          })
          .catch((err) => {
            console.error(`[api-dev] Handler error for ${handlerName}:`, err);
            if (!res.headersSent) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message || 'Internal error' }));
            }
          });
      });
    },
  };
}
