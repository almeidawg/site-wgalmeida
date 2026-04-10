import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const stylesDir = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(process.cwd(), "public", "images", "estilos");

const MAX_WIDTH = 1600;
const QUALITY = 78;

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function extractEmbeddedImage(svgContent) {
  const match = svgContent.match(/data:image\/(?:jpeg|jpg|png);base64,([^"]+)/i);
  if (!match) return null;
  return Buffer.from(match[1], "base64");
}

async function generateWebpFromSvg(svgPath) {
  const webpPath = svgPath.replace(/\.svg$/i, ".webp");
  const svgContent = await fs.readFile(svgPath, "utf8");
  const embeddedBuffer = extractEmbeddedImage(svgContent);
  const image = embeddedBuffer ? sharp(embeddedBuffer).rotate() : sharp(Buffer.from(svgContent));
  const metadata = await image.metadata();
  const width = metadata.width && metadata.width > MAX_WIDTH ? MAX_WIDTH : undefined;
  const webpBuffer = await image
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 6 })
    .toBuffer();

  const alreadyExists = await fileExists(webpPath);
  const previousSize = alreadyExists ? (await fs.stat(webpPath)).size : 0;

  if (alreadyExists && previousSize <= webpBuffer.length) {
    return {
      svgPath,
      webpPath,
      created: false,
      reason: "existing-webp-smaller",
      previousSize,
      nextSize: webpBuffer.length,
    };
  }

  await fs.writeFile(webpPath, webpBuffer);

  return {
    svgPath,
    webpPath,
    created: true,
    previousSize,
    nextSize: webpBuffer.length,
  };
}

async function main() {
  const entries = await fs.readdir(stylesDir, { withFileTypes: true });
  const svgFiles = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".svg"))
    .map((entry) => path.join(stylesDir, entry.name));

  if (!svgFiles.length) {
    console.log(`No SVG files found in ${stylesDir}`);
    return;
  }

  const results = [];

  for (const svgPath of svgFiles) {
    results.push(await generateWebpFromSvg(svgPath));
  }

  const created = results.filter((result) => result.created);
  const skipped = results.filter((result) => !result.created);

  console.log(`styles scanned: ${results.length}`);
  console.log(`webp generated/updated: ${created.length}`);
  console.log(`webp skipped: ${skipped.length}`);

  for (const result of created.slice(0, 10)) {
    const fileName = path.basename(result.webpPath);
    console.log(`ok: ${fileName} (${Math.round((result.nextSize || 0) / 1024)} KB)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
