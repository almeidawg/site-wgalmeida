import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const blogRoot = path.join(projectRoot, 'src', 'content', 'blog');
const localeDirs = {
  'pt-BR': blogRoot,
  en: path.join(blogRoot, 'en'),
  es: path.join(blogRoot, 'es'),
};

function listMarkdownSlugs(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath)
    .filter((entry) => entry.endsWith('.md'))
    .map((entry) => entry.replace(/\.md$/, ''))
    .sort();
}

function diffMissing(reference, target) {
  const targetSet = new Set(target);
  return reference.filter((slug) => !targetSet.has(slug));
}

function findSuspiciousLocaleFallbacks(rootDir) {
  const findings = [];
  const stack = [rootDir];
  const suspiciousPatterns = [
    { label: 'hardcoded-pt-fallback', regex: /\?\s*['"]pt['"]\s*:\s*['"]pt['"]/ },
    { label: 'language-startsWith-pt', regex: /language\?\.(?:startsWith|includes)\(['"]pt['"]\)/ },
    { label: 'raw-i18next-localstorage', regex: /localStorage\.getItem\(['"]i18nextLng['"]\)/ },
  ];

  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const nextPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(nextPath);
        continue;
      }

      if (!/\.(jsx?|tsx?)$/.test(entry.name)) continue;

      const content = fs.readFileSync(nextPath, 'utf8');
      const relativePath = path.relative(projectRoot, nextPath);

      suspiciousPatterns.forEach(({ label, regex }) => {
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (regex.test(line)) {
            findings.push({
              type: label,
              file: relativePath,
              line: index + 1,
              excerpt: line.trim(),
            });
          }
        });
      });
    }
  }

  return findings;
}

const ptSlugs = listMarkdownSlugs(localeDirs['pt-BR']);
const enSlugs = listMarkdownSlugs(localeDirs.en);
const esSlugs = listMarkdownSlugs(localeDirs.es);

const report = {
  generatedAt: new Date().toISOString(),
  coverage: {
    'pt-BR': ptSlugs.length,
    en: enSlugs.length,
    es: esSlugs.length,
  },
  missingAgainstPortuguese: {
    en: diffMissing(ptSlugs, enSlugs),
    es: diffMissing(ptSlugs, esSlugs),
  },
  suspiciousLocaleFallbacks: findSuspiciousLocaleFallbacks(path.join(projectRoot, 'src')),
};

console.log(JSON.stringify(report, null, 2));
