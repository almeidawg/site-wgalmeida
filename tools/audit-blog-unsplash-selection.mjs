import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const selectionPath = path.join(root, 'src', 'data', 'blogUnsplashSelection.json');

const payload = JSON.parse(fs.readFileSync(selectionPath, 'utf8'));
const rows = [];
const cityKeywordRules = {
  'arquitetura-barcelona-espanha': ['barcelona', 'catala', 'espanha', 'gaudi', 'sagrada familia'],
  'arquitetura-bruges-belgica': ['bruges', 'brugge', 'belgica'],
  'arquitetura-bruxelas-belgica': ['bruxelas', 'brussels', 'belgica'],
  'arquitetura-haarlem-holanda': ['haarlem', 'holanda', 'holandes', 'holandesa'],
  'arquitetura-lisboa-portugal': ['lisboa', 'lisboeta', 'portugal'],
  'arquitetura-paris-franca': ['paris', 'parisiense', 'franca', 'frances'],
};

const normalizeText = (value = '') => value
  .normalize('NFD')
  .replace(/\p{Diacritic}/gu, '')
  .toLowerCase();

const includesAnyKeyword = (value, keywords) => {
  const normalized = normalizeText(value);
  return keywords.some((keyword) => normalized.includes(normalizeText(keyword)));
};

for (const [slug, entry] of Object.entries(payload.slugs || {})) {
  if (!entry || typeof entry !== 'object') continue;

  for (const slot of ['hero', 'card']) {
    const value = entry[slot];
    if (value?.id) {
      rows.push({ slug, slot, id: value.id, alt: value.alt || '' });
    }
  }

  if (Array.isArray(entry.context)) {
    entry.context.forEach((item, index) => {
      if (item?.id) {
        rows.push({ slug, slot: `context${index + 1}`, id: item.id, alt: item.alt || '' });
      }
    });
  }
}

const byId = new Map();
for (const row of rows) {
  if (!byId.has(row.id)) byId.set(row.id, []);
  byId.get(row.id).push(row);
}

const duplicates = [...byId.entries()]
  .map(([id, uses]) => ({ id, uses }))
  .filter(({ uses }) => uses.length > 1);

const duplicateAcrossSlugs = duplicates.filter(({ uses }) => {
  const slugSet = new Set(uses.map((use) => use.slug));
  return slugSet.size > 1;
});

const keywordIssues = [];

for (const [slug, keywords] of Object.entries(cityKeywordRules)) {
  const entry = payload.slugs?.[slug];
  if (!entry || typeof entry !== 'object') continue;

  for (const slot of ['hero', 'card']) {
    const alt = entry?.[slot]?.alt || '';
    if (!alt.trim()) {
      keywordIssues.push({ slug, slot, reason: 'alt ausente' });
      continue;
    }

    if (!includesAnyKeyword(alt, keywords)) {
      keywordIssues.push({
        slug,
        slot,
        reason: `alt sem referencia geografica esperada (${keywords.join(', ')})`,
      });
    }
  }
}

if (duplicateAcrossSlugs.length === 0 && keywordIssues.length === 0) {
  console.log('Unsplash selection audit: ok');
  process.exit(0);
}

console.error('Unsplash selection audit failed.\n');

if (duplicateAcrossSlugs.length > 0) {
  console.error('Duplicate photo IDs detected across different slugs:\n');
  for (const duplicate of duplicateAcrossSlugs) {
    console.error(`- ${duplicate.id}`);
    duplicate.uses.forEach((use) => {
      console.error(`  ${use.slug} :: ${use.slot}`);
    });
  }
  console.error('');
}

if (keywordIssues.length > 0) {
  console.error('Geographic consistency issues in hero/card alt text:\n');
  keywordIssues.forEach((issue) => {
    console.error(`- ${issue.slug} :: ${issue.slot} -> ${issue.reason}`);
  });
  console.error('');
}

process.exit(1);
