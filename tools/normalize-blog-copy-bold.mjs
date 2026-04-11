import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const root = process.cwd();
const blogDir = path.join(root, 'src', 'content', 'blog');
const queuePath = path.join(root, 'src', 'data', 'blogEditorialQueue.generated.json');

const args = process.argv.slice(2);
const shouldApply = args.includes('--apply');
const onlyPending = args.includes('--only-pending');
const slugArg = args.find((arg) => arg.startsWith('--slug='))?.split('=')[1]?.trim() || '';

const readQueuePendingSlugs = () => {
  if (!fs.existsSync(queuePath)) return new Set();
  const payload = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
  return new Set(
    payload
      .filter((item) => item?.needsCopyNormalization)
      .map((item) => String(item.slug || '').trim())
      .filter(Boolean)
  );
};

const readBlogRecords = () => {
  const files = fs
    .readdirSync(blogDir)
    .filter((name) => name.endsWith('.md'))
    .sort((a, b) => a.localeCompare(b));

  return files.map((fileName) => {
    const filePath = path.join(blogDir, fileName);
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = matter(raw);
    const derivedSlug = fileName.replace(/\.md$/, '');
    const frontmatterSlug = String(parsed.data?.slug || '').trim();
    const slug = frontmatterSlug || derivedSlug;

    return {
      filePath,
      raw,
      slug,
    };
  });
};

const splitFrontmatterPrefix = (raw) => {
  const match = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  if (!match) {
    return { prefix: '', content: raw };
  }
  const prefix = match[0];
  return { prefix, content: raw.slice(prefix.length) };
};

const countMarkdownBold = (content) => {
  const matches = content.match(/\*\*[^*]+\*\*/g);
  return matches ? matches.length : 0;
};

const stripMarkdownBold = (content) => {
  const lines = content.split(/\r?\n/);
  let inFence = false;
  const normalized = lines.map((line) => {
    if (/^\s*```/.test(line) || /^\s*~~~/.test(line)) {
      inFence = !inFence;
      return line;
    }
    if (inFence) return line;
    return line.replace(/\*\*([^*]+)\*\*/g, '$1');
  });
  return normalized.join('\n');
};

const pendingSlugs = readQueuePendingSlugs();
const records = readBlogRecords();

const selectedRecords = records.filter((record) => {
  if (slugArg) return record.slug === slugArg;
  if (onlyPending) return pendingSlugs.has(record.slug);
  return true;
});

if (!selectedRecords.length) {
  console.log('No blog post matched the current filters.');
  process.exit(0);
}

let changedFiles = 0;
let boldBeforeTotal = 0;
let boldAfterTotal = 0;

for (const record of selectedRecords) {
  const { prefix, content } = splitFrontmatterPrefix(record.raw);
  const before = countMarkdownBold(content);
  const normalized = stripMarkdownBold(content);
  const after = countMarkdownBold(normalized);

  boldBeforeTotal += before;
  boldAfterTotal += after;

  if (before === after && content === normalized) {
    continue;
  }

  changedFiles += 1;
  if (shouldApply) {
    const nextRaw = `${prefix}${normalized}`;
    fs.writeFileSync(record.filePath, nextRaw, 'utf8');
  }

  const relativePath = path.relative(root, record.filePath).replace(/\\/g, '/');
  console.log(`${shouldApply ? 'updated' : 'preview'}: ${relativePath} (${before} -> ${after})`);
}

console.log(`processed=${selectedRecords.length}`);
console.log(`changed=${changedFiles}`);
console.log(`bold_before_total=${boldBeforeTotal}`);
console.log(`bold_after_total=${boldAfterTotal}`);
console.log(`mode=${shouldApply ? 'apply' : 'dry-run'}`);
