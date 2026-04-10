import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, process.env.SMOKE_DIST_DIR || 'dist');
const defaultPort = Number.parseInt(process.env.SMOKE_PORT || '3010', 10);
const defaultRoutes = [
  '/',
  '/blog',
  '/blog/guia-estilos-ambientes-residenciais',
  '/blog/guia-estilos-decoracao',
  '/arquitetura',
  '/engenharia',
  '/processo',
];

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.vtt': 'text/vtt; charset=utf-8',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
};

const ignoredConsolePatterns = [
  /locize\.com/i,
  /chrome-extension:\/\//i,
  /chrome-error:\/\//i,
  /content\.js/i,
  /ct\.pinterest\.com/i,
  /unsafe attempt to load url/i,
];

const ignoredRequestUrlPatterns = [
  /^data:/i,
  /^blob:/i,
  /chrome-extension:\/\//i,
  /ct\.pinterest\.com/i,
];

const allowedAssetHosts = [
  'res.cloudinary.com',
];

const parseArgs = () => {
  const options = {};

  for (const arg of process.argv.slice(2)) {
    if (!arg.startsWith('--')) continue;
    const [rawKey, ...rest] = arg.slice(2).split('=');
    const value = rest.join('=');
    options[rawKey] = value === '' ? 'true' : value;
  }

  return options;
};

const cli = parseArgs();

const routes = (cli.routes || process.env.SMOKE_ROUTES || defaultRoutes.join(','))
  .split(',')
  .map((route) => route.trim())
  .filter(Boolean);

const shouldStartLocalServer = !(cli.url || process.env.SMOKE_URL);

const normalizeRoutePath = (route) => {
  if (!route) return '/';
  if (/^https?:\/\//i.test(route)) return route;
  return route.startsWith('/') ? route : `/${route}`;
};

const ensureDir = (target) => {
  fs.mkdirSync(target, { recursive: true });
};

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const reportsDir = path.join(projectRoot, '.monitor-data', 'reports');
const reportPath = path.join(reportsDir, `console-smoke-${timestamp}.json`);

const shouldIgnoreConsoleMessage = (text = '') =>
  ignoredConsolePatterns.some((pattern) => pattern.test(text));

const shouldIgnoreRequestUrl = (value = '') =>
  ignoredRequestUrlPatterns.some((pattern) => pattern.test(value));

const isRelevantHttpUrl = (targetUrl, baseOrigin) => {
  try {
    const url = new URL(targetUrl);
    return url.origin === baseOrigin || allowedAssetHosts.includes(url.hostname);
  } catch {
    return false;
  }
};

const getFileFromDist = (pathname) => {
  const decodedPath = decodeURIComponent(pathname);
  const safeRelativePath = decodedPath.replace(/^\/+/, '');
  const directPath = path.join(distDir, safeRelativePath);
  const hasExplicitExtension = Boolean(path.extname(decodedPath));

  if (fs.existsSync(directPath) && fs.statSync(directPath).isFile()) {
    return { filePath: directPath, statusCode: 200 };
  }

  if (fs.existsSync(directPath) && fs.statSync(directPath).isDirectory()) {
    const indexPath = path.join(directPath, 'index.html');
    if (fs.existsSync(indexPath)) return { filePath: indexPath, statusCode: 200 };
  }

  if (hasExplicitExtension) {
    return null;
  }

  const fallbackIndex = path.join(distDir, 'index.html');
  return { filePath: fallbackIndex, statusCode: 200 };
};

const startStaticServer = async (port) => {
  if (!fs.existsSync(distDir)) {
    throw new Error(`Dist nao encontrado em ${distDir}. Rode npm run build antes do smoke.`);
  }

  const server = http.createServer((req, res) => {
    const url = new URL(req.url || '/', `http://127.0.0.1:${port}`);
    const resolvedFile = getFileFromDist(url.pathname);

    if (!resolvedFile) {
      res.statusCode = 404;
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Not found');
      return;
    }

    const { filePath, statusCode } = resolvedFile;
    const extension = path.extname(filePath);

    res.statusCode = statusCode;
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Type', mimeTypes[extension] || 'application/octet-stream');

    fs.createReadStream(filePath).pipe(res);
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });

  return server;
};

const tryLaunchBrowser = async () => {
  const baseOptions = {
    headless: true,
    args: [
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-breakpad',
      '--disable-component-update',
      '--disable-default-apps',
      '--disable-dev-shm-usage',
      '--disable-extensions',
      '--disable-features=Translate,BackForwardCache',
      '--disable-renderer-backgrounding',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-default-browser-check',
      '--no-first-run',
    ],
  };

  const attempts = [];
  const launchCandidates = [
    process.env.SMOKE_BROWSER_EXECUTABLE
      ? { label: 'custom-executable', options: { executablePath: process.env.SMOKE_BROWSER_EXECUTABLE } }
      : null,
    { label: 'msedge-channel', options: { channel: 'msedge' } },
    { label: 'chrome-channel', options: { channel: 'chrome' } },
    { label: 'playwright-chromium', options: {} },
  ].filter(Boolean);

  for (const candidate of launchCandidates) {
    try {
      const browser = await chromium.launch({
        ...baseOptions,
        ...candidate.options,
      });

      return { browser, launcher: candidate.label };
    } catch (error) {
      attempts.push(`${candidate.label}: ${error.message}`);
    }
  }

  throw new Error(`Falha ao iniciar navegador para smoke.\n${attempts.join('\n')}`);
};

const buildPageUrl = (baseUrl, route) => {
  if (/^https?:\/\//i.test(route)) return route;
  return `${baseUrl.replace(/\/+$/, '')}${normalizeRoutePath(route)}`;
};

const summarizeFindings = (entries) => ({
  total: entries.length,
  byKind: entries.reduce((acc, entry) => {
    acc[entry.kind] = (acc[entry.kind] || 0) + 1;
    return acc;
  }, {}),
});

const main = async () => {
  ensureDir(reportsDir);

  let server;
  const findings = [];
  const startedAt = new Date().toISOString();

  try {
    const targetPort = Number.parseInt(cli.port || process.env.SMOKE_PORT || String(defaultPort), 10);
    const targetBaseUrl = cli.url || process.env.SMOKE_URL || `http://127.0.0.1:${targetPort}`;

    if (shouldStartLocalServer) {
      server = await startStaticServer(targetPort);
    }

    const { browser, launcher } = await tryLaunchBrowser();

    try {
      for (const route of routes) {
        const context = await browser.newContext({
          bypassCSP: true,
          ignoreHTTPSErrors: true,
          serviceWorkers: 'block',
          viewport: { width: 1440, height: 960 },
        });
        const page = await context.newPage();
        const pageUrl = buildPageUrl(targetBaseUrl, route);
        const pageOrigin = new URL(pageUrl).origin;

        page.on('console', (message) => {
          const type = message.type();
          const text = message.text();
          if (!['error', 'warning'].includes(type)) return;
          if (shouldIgnoreConsoleMessage(text)) return;

          findings.push({
            kind: 'console',
            severity: type === 'error' ? 'high' : 'medium',
            route,
            url: pageUrl,
            text,
            type,
          });
        });

        page.on('pageerror', (error) => {
          findings.push({
            kind: 'pageerror',
            severity: 'high',
            route,
            url: pageUrl,
            text: error.message,
            stack: error.stack || '',
          });
        });

        page.on('requestfailed', (request) => {
          const failedUrl = request.url();
          if (shouldIgnoreRequestUrl(failedUrl)) return;
          if (!isRelevantHttpUrl(failedUrl, pageOrigin)) return;

          findings.push({
            kind: 'requestfailed',
            severity: 'high',
            route,
            url: pageUrl,
            requestUrl: failedUrl,
            method: request.method(),
            failureText: request.failure()?.errorText || 'unknown',
          });
        });

        page.on('response', async (response) => {
          const responseUrl = response.url();
          if (shouldIgnoreRequestUrl(responseUrl)) return;
          if (!isRelevantHttpUrl(responseUrl, pageOrigin)) return;
          if (response.status() < 400) return;

          findings.push({
            kind: 'http',
            severity: response.status() >= 500 ? 'high' : 'medium',
            route,
            url: pageUrl,
            requestUrl: responseUrl,
            status: response.status(),
            statusText: response.statusText(),
          });
        });

        try {
          const response = await page.goto(pageUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 45000,
          });

          if (!response) {
            findings.push({
              kind: 'navigation',
              severity: 'high',
              route,
              url: pageUrl,
              text: 'Navegacao sem resposta inicial.',
            });
          } else if (response.status() >= 400) {
            findings.push({
              kind: 'navigation',
              severity: response.status() >= 500 ? 'high' : 'medium',
              route,
              url: pageUrl,
              status: response.status(),
              statusText: response.statusText(),
              text: 'Status HTTP invalido na navegacao inicial.',
            });
          }

          await page.waitForTimeout(Number.parseInt(cli.wait || process.env.SMOKE_WAIT_MS || '2500', 10));
        } catch (error) {
          findings.push({
            kind: 'navigation',
            severity: 'high',
            route,
            url: pageUrl,
            text: error.message,
          });
        } finally {
          await context.close();
        }
      }
    } finally {
      await browser.close();
    }

    const blockingFindings = findings.filter((entry) => entry.severity === 'high');
    const report = {
      startedAt,
      finishedAt: new Date().toISOString(),
      launcher,
      baseUrl: cli.url || process.env.SMOKE_URL || `http://127.0.0.1:${targetPort}`,
      routes,
      summary: summarizeFindings(findings),
      findings,
    };

    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

    console.log(`Smoke report: ${reportPath}`);

    if (findings.length === 0) {
      console.log('Smoke de console sem ocorrencias relevantes.');
      return;
    }

    console.log(`Ocorrencias relevantes: ${findings.length}`);
    for (const entry of findings) {
      const detail = entry.requestUrl || entry.text || entry.statusText || '';
      console.log(`[${entry.severity}] ${entry.kind} ${entry.route} ${detail}`);
    }

    if (blockingFindings.length > 0) {
      process.exitCode = 1;
    }
  } finally {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  }
};

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
