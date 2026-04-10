import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const envPath = path.join(root, '.env');

const parseEnv = (filePath) => {
  if (!fs.existsSync(filePath)) return {};

  return Object.fromEntries(
    fs
      .readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .filter(Boolean)
      .filter((line) => !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index), line.slice(index + 1)];
      })
  );
};

const env = parseEnv(envPath);
const cloudName = env.VITE_CLOUDINARY_CLOUD_NAME || env.CLOUDINARY_CLOUD_NAME;
const apiKey = env.VITE_CLOUDINARY_API_KEY || env.CLOUDINARY_API_KEY;
const apiSecret = env.VITE_CLOUDINARY_API_SECRET || env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error('Cloudinary credentials are missing in .env');
  process.exit(1);
}

const slugify = (value) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\.(webp|png|jpg|jpeg)$/i, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const walkFiles = (dir) => {
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walkFiles(entryPath);
    }

    return [entryPath];
  });
};

const slugifyRelativePath = (relativeFilePath) =>
  relativeFilePath
    .split(path.sep)
    .map((segment) => slugify(segment).toLowerCase())
    .join('/');

const uploadTargets = [
  {
    dir: path.join(root, 'public', 'images', 'blog'),
    filter: (relativeFilePath) => relativeFilePath.endsWith('.webp'),
    publicId: (relativeFilePath) => `editorial/blog/${slugifyRelativePath(relativeFilePath)}`,
  },
  {
    dir: path.join(root, 'public', 'images', 'estilos'),
    filter: (relativeFilePath) => relativeFilePath.endsWith('.webp'),
    publicId: (relativeFilePath) => `editorial/estilos/${slugifyRelativePath(relativeFilePath)}`,
  },
  {
    dir: path.join(root, 'public', 'images', 'banners'),
    filter: (name) =>
      [
        'ARQ.webp',
        'ENGENHARIA.webp',
        'MARCENARIA.webp',
        'PROCESSOS.webp',
        'SOBRE.webp',
        'FALECONOSCO.webp',
      ].includes(name),
    publicId: (name) => `editorial/banners/${slugify(name).toUpperCase()}`,
  },
];

const buildSignature = (params) =>
  crypto
    .createHash('sha1')
    .update(
      Object.entries(params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('&') + apiSecret
    )
    .digest('hex');

const uploadAsset = async (filePath, publicId) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const params = {
    invalidate: 'true',
    overwrite: 'true',
    public_id: publicId,
    timestamp: String(timestamp),
    use_filename: 'false',
    unique_filename: 'false',
  };

  const signature = buildSignature(params);
  const formData = new FormData();
  const fileBuffer = fs.readFileSync(filePath);

  formData.append('file', new Blob([fileBuffer]), path.basename(filePath));
  Object.entries(params).forEach(([key, value]) => formData.append(key, value));
  formData.append('api_key', apiKey);
  formData.append('signature', signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`${publicId}: ${data?.error?.message || 'upload failed'}`);
  }

  return data;
};

const run = async () => {
  const results = [];

  for (const target of uploadTargets) {
    if (!fs.existsSync(target.dir)) continue;

    const files = walkFiles(target.dir)
      .map((filePath) => ({
        filePath,
        relativeFilePath: path.relative(target.dir, filePath),
      }))
      .filter(({ relativeFilePath }) => target.filter(relativeFilePath))
      .sort((a, b) => a.relativeFilePath.localeCompare(b.relativeFilePath));

    for (const { filePath, relativeFilePath } of files) {
      const publicId = target.publicId(relativeFilePath);
      const uploaded = await uploadAsset(filePath, publicId);
      results.push({
        file: path.relative(root, filePath),
        public_id: uploaded.public_id,
        bytes: uploaded.bytes,
        secure_url: uploaded.secure_url,
      });
      console.log(`uploaded\t${uploaded.public_id}`);
    }
  }

  const outputPath = path.join(root, 'cloudinary-editorial-sync-2026-04-08.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nSaved report to ${outputPath}`);
};

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
