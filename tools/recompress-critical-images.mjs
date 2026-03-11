#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const outDir = process.argv[2] || 'dist';
const targetDir = path.join(root, outDir, 'images');

async function compressImages(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`[perf:images] Directory not found: ${dir}. Skipping.`);
    return;
  }

  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      await compressImages(filePath);
      continue;
    }

    if (/\.(jpg|jpeg|png|webp)$/i.test(file)) {
      const ext = path.extname(file).toLowerCase();
      const tempPath = filePath + '.tmp';

      try {
        let pipeline = sharp(filePath);
        
        if (ext === '.jpg' || ext === '.jpeg') {
          pipeline = pipeline.jpeg({ quality: 80, mozjpeg: true });
        } else if (ext === '.png') {
          pipeline = pipeline.png({ compressionLevel: 9, palette: true });
        } else if (ext === '.webp') {
          pipeline = pipeline.webp({ quality: 80, effort: 6 });
        }

        await pipeline.toFile(tempPath);
        const newStats = fs.statSync(tempPath);

        if (newStats.size < stats.size) {
          const saved = (((stats.size - newStats.size) / stats.size) * 100).toFixed(2);
          fs.renameSync(tempPath, filePath);
          console.log(`[perf:images] Optimized: ${file} (${saved}% saved)`);
        } else {
          fs.unlinkSync(tempPath);
        }
      } catch (err) {
        console.error(`[perf:images] Error processing ${file}:`, err.message);
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      }
    }
  }
}

console.log(`[perf:images] Starting recompression in ${targetDir}...`);
compressImages(targetDir).then(() => {
  console.log('[perf:images] Task completed.');
});
