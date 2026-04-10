import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srcRoot = path.join(root, 'src');
const appFile = path.join(srcRoot, 'App.jsx');
const distRoot = path.join(root, 'dist');

const read = (filePath) => fs.readFileSync(filePath, 'utf8');

const routePatternToRegex = (routePath) => {
  const normalized = routePath === '/' ? '/' : routePath.replace(/\/+$/, '');
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const withParams = escaped.replace(/:([A-Za-z0-9_]+)/g, '[^/]+');
  return new RegExp(`^${withParams}$`);
};

const appSource = read(appFile);
const routeMatches = [...appSource.matchAll(/<Route\s+path="([^"]+)"/g)].map((match) => match[1]);
const knownRoutes = [...new Set(routeMatches)];
const routeRegexes = knownRoutes.map((routePath) => ({ routePath, regex: routePatternToRegex(routePath) }));

const files = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (fullPath.includes(`${path.sep}__tests__${path.sep}`)) continue;
    if (/\.(js|jsx)$/.test(entry.name)) files.push(fullPath);
  }
};
walk(srcRoot);

const patterns = [
  { type: 'href', regex: /href\s*=\s*["'](\/[^"'?#]*)/g },
  { type: 'to', regex: /to\s*=\s*["'](\/[^"'?#]*)/g },
  { type: 'navigate', regex: /navigate\(\s*["'](\/[^"'?#]*)/g },
  { type: 'windowLocation', regex: /window\.location(?:\.href)?\s*=\s*["'](\/[^"'?#]*)/g },
];

const references = [];
for (const file of files) {
  const source = read(file);
  for (const { type, regex } of patterns) {
    for (const match of source.matchAll(regex)) {
      const routeValue = match[1];
      const line = source.slice(0, match.index).split(/\r?\n/).length;
      const resolved = routeRegexes.find(({ regex }) => regex.test(routeValue));
      references.push({
        file: path.relative(root, file),
        line,
        type,
        value: routeValue,
        valid: Boolean(resolved),
        matchedRoute: resolved?.routePath || null,
        issue:
          !resolved
            ? 'missing-route'
            : type === 'href' || type === 'windowLocation'
              ? 'internal-hard-navigation'
              : null,
      });
    }
  }
}

const missingRoutes = references.filter((item) => item.issue === 'missing-route');
const hardNavigations = references.filter((item) => item.issue === 'internal-hard-navigation');

const distRoutes = [];
const walkDist = (dir, relativeBase = '') => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.join(relativeBase, entry.name);
    if (entry.isDirectory()) {
      walkDist(fullPath, relPath);
      continue;
    }
    if (entry.name === 'index.html') {
      const urlPath = `/${relativeBase.replace(/\\/g, '/')}`.replace(/\/index\.html$/, '').replace(/\/+/g, '/');
      distRoutes.push(urlPath === '/' ? '/' : urlPath.replace(/\/+$/, ''));
    }
  }
};

if (fs.existsSync(distRoot)) {
  walkDist(distRoot);
}

const report = {
  generatedAt: new Date().toISOString(),
  totals: {
    knownRoutes: knownRoutes.length,
    references: references.length,
    missingRoutes: missingRoutes.length,
    hardNavigations: hardNavigations.length,
    distRoutes: distRoutes.length,
  },
  knownRoutes,
  missingRoutes,
  hardNavigations,
};

const jsonPath = path.join(root, 'link-audit-2026-04-08.json');
fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

const mdLines = [
  '# Auditoria de Links — 08/04/2026',
  '',
  `- Rotas registradas em \`src/App.jsx\`: ${report.totals.knownRoutes}`,
  `- Referências internas encontradas no código: ${report.totals.references}`,
  `- Links/rotas inválidos: ${report.totals.missingRoutes}`,
  `- Navegações internas com hard reload: ${report.totals.hardNavigations}`,
  `- Rotas estáticas encontradas em \`dist\`: ${report.totals.distRoutes}`,
  '',
  '## Links inválidos',
  '',
];

if (missingRoutes.length === 0) {
  mdLines.push('- Nenhum link interno inválido encontrado.');
} else {
  missingRoutes.forEach((item) => {
    mdLines.push(`- \`${item.value}\` em \`${item.file}:${item.line}\``);
  });
}

mdLines.push('', '## Navegações internas com reload', '');

if (hardNavigations.length === 0) {
  mdLines.push('- Nenhum caso restante.');
} else {
  hardNavigations.forEach((item) => {
    mdLines.push(`- \`${item.value}\` em \`${item.file}:${item.line}\` via \`${item.type}\``);
  });
}

const mdPath = path.join(root, 'LINK-AUDIT-2026-04-08.md');
fs.writeFileSync(mdPath, mdLines.join('\n'));

console.log(`Routes: ${report.totals.knownRoutes}`);
console.log(`References: ${report.totals.references}`);
console.log(`Missing routes: ${report.totals.missingRoutes}`);
console.log(`Hard navigations: ${report.totals.hardNavigations}`);
console.log(`Saved: ${jsonPath}`);
console.log(`Saved: ${mdPath}`);
