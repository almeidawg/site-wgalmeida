import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const targetDir = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(process.cwd(), "dist");

const MIN_BYTES = 10 * 1024;

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(fullPath);
      return [fullPath];
    }),
  );
  return files.flat();
}

function extractEmbeddedImage(svgContent) {
  const match = svgContent.match(/data:image\/(?:jpeg|jpg|png);base64,([^"]+)/i);
  if (!match) return null;
  return Buffer.from(match[1], "base64");
}

async function maybeWriteSmaller(filePath, nextBuffer) {
  const currentSize = (await fs.stat(filePath)).size;
  if (nextBuffer.length >= currentSize * 0.95) {
    return { filePath, updated: false, currentSize, nextSize: nextBuffer.length };
  }

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  await fs.writeFile(tempPath, nextBuffer);
  await fs.rename(tempPath, filePath);
  return { filePath, updated: true, currentSize, nextSize: nextBuffer.length };
}

async function recompressRaster(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const currentSize = (await fs.stat(filePath)).size;

  if (currentSize < MIN_BYTES) {
    return { filePath, updated: false, currentSize, nextSize: currentSize };
  }

  const image = sharp(filePath).rotate();
  let nextBuffer;

  if (ext === ".jpg" || ext === ".jpeg") {
    nextBuffer = await image.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
  } else if (ext === ".png") {
    nextBuffer = await image.png({ compressionLevel: 9, palette: true }).toBuffer();
  } else if (ext === ".webp") {
    nextBuffer = await image.webp({ quality: 78, effort: 6 }).toBuffer();
  } else {
    return { filePath, updated: false, currentSize, nextSize: currentSize };
  }

  return maybeWriteSmaller(filePath, nextBuffer);
}

async function createWebpFromEmbeddedSvg(filePath) {
  const svgContent = await fs.readFile(filePath, "utf8");
  const embedded = extractEmbeddedImage(svgContent);
  const outputPath = filePath.replace(/\.svg$/i, ".webp");
  const image = embedded ? sharp(embedded).rotate() : sharp(Buffer.from(svgContent));
  const buffer = await image
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 78, effort: 6 })
    .toBuffer();

  const exists = await fs
    .access(outputPath)
    .then(() => true)
    .catch(() => false);

  if (!exists) {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, buffer);
    return { filePath: outputPath, updated: true, currentSize: 0, nextSize: buffer.length };
  }

  return maybeWriteSmaller(outputPath, buffer);
}

async function main() {
  const files = await walk(targetDir);
  const rasterFiles = files.filter((filePath) => /\.(jpe?g|png|webp)$/i.test(filePath));
  const svgFiles = files.filter((filePath) => /images[\\/]+estilos[\\/].+\.svg$/i.test(filePath));

  const rasterResults = [];
  for (const filePath of rasterFiles) {
    rasterResults.push(await recompressRaster(filePath));
  }

  const svgResults = [];
  for (const filePath of svgFiles) {
    const result = await createWebpFromEmbeddedSvg(filePath);
    svgResults.push(result);
  }

  const updated = [...rasterResults, ...svgResults].filter((result) => result.updated);
  console.log(`image root: ${targetDir}`);
  console.log(`raster scanned: ${rasterFiles.length}`);
  console.log(`style svg scanned: ${svgFiles.length}`);
  console.log(`optimized assets: ${updated.length}`);

  for (const item of updated.slice(0, 15)) {
    console.log(
      `- ${path.relative(targetDir, item.filePath)} :: ${Math.round(item.currentSize / 1024)} KB -> ${Math.round(item.nextSize / 1024)} KB`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
