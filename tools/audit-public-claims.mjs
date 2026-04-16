import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const strict = process.argv.includes('--strict');

const targets = [
  path.join(root, 'src', 'pages'),
  path.join(root, 'src', 'i18n', 'locales'),
  path.join(root, 'public'),
];

const extensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.json', '.xml', '.svg']);
const ignoreFragments = [
  `${path.sep}src${path.sep}content${path.sep}`,
  `${path.sep}src${path.sep}pages${path.sep}Admin.jsx`,
  `${path.sep}node_modules${path.sep}`,
  `${path.sep}dist${path.sep}`,
];

const patterns = [
  { label: 'tempo-rigido', regex: /\b48 horas\b|\bem menos de 2 minutos\b|\bem menos de 3 minutos\b/gi },
  { label: 'prova-numerica', regex: /\b15 anos\b|\+400 clientes|\+1\.000 or[cç]amentos|\b200\+\b|\b53\+\s*transa[cç][õo]es/gi },
  { label: 'precisao-rigida', regex: /±\s*\d+%|\bprecis[aã]o entre \d+% e \d+%/gi },
];

function collectFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (ignoreFragments.some((fragment) => fullPath.includes(fragment))) continue;
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath));
      continue;
    }
    if (extensions.has(path.extname(entry.name))) files.push(fullPath);
  }
  return files;
}

function findLineNumber(content, index) {
  return content.slice(0, index).split('\n').length;
}

const findings = [];
for (const target of targets) {
  if (!fs.existsSync(target)) continue;
  for (const filePath of collectFiles(target)) {
    const content = fs.readFileSync(filePath, 'utf8');
    for (const pattern of patterns) {
      pattern.regex.lastIndex = 0;
      let match;
      while ((match = pattern.regex.exec(content)) !== null) {
        findings.push({
          file: path.relative(root, filePath),
          line: findLineNumber(content, match.index),
          label: pattern.label,
          text: match[0],
        });
      }
    }
  }
}

if (findings.length === 0) {
  console.log('audit-public-claims: OK');
  process.exit(0);
}

console.log(`audit-public-claims: ${findings.length} sinalizacoes`);
for (const finding of findings) {
  console.log(`- ${finding.file}:${finding.line} [${finding.label}] ${finding.text}`);
}

if (strict) process.exit(1);
