import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const inputPath = path.join(root, 'public', 'images', 'about', 'william-almeida.png');
const outputDir = path.join(root, 'public', 'images', 'about');
const variants = [
  { width: 800, output: 'william-almeida-800.webp' },
  { width: 1200, output: 'william-almeida-1200.webp' },
];

if (!fs.existsSync(inputPath)) {
  console.log('about webp skipped: source image not found');
  process.exit(0);
}

await fs.promises.mkdir(outputDir, { recursive: true });

let generated = 0;
let skipped = 0;

for (const variant of variants) {
  const outputPath = path.join(outputDir, variant.output);
  const sourceStat = await fs.promises.stat(inputPath);
  const outputStat = await fs.promises
    .stat(outputPath)
    .catch(() => null);

  if (outputStat && outputStat.mtimeMs >= sourceStat.mtimeMs) {
    skipped += 1;
    continue;
  }

  await sharp(inputPath)
    .rotate()
    .resize({
      width: variant.width,
      withoutEnlargement: true,
    })
    .webp({
      quality: 82,
      effort: 6,
    })
    .toFile(outputPath);

  generated += 1;
}

console.log(`about webp generated/updated: ${generated}`);
console.log(`about webp skipped: ${skipped}`);
