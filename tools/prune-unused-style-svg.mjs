import fs from "node:fs/promises";
import path from "node:path";

const distDir = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(process.cwd(), "dist");

const stylesDir = path.join(distDir, "images", "estilos");
const COMPANION_SUFFIXES = [".svg", ".svg.gz", ".svg.br"];

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await fileExists(stylesDir))) {
    console.log(`styles directory not found: ${stylesDir}`);
    return;
  }

  const entries = await fs.readdir(stylesDir, { withFileTypes: true });
  const webpFiles = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".webp"))
    .map((entry) => entry.name);

  let removedCount = 0;
  let removedBytes = 0;

  for (const webpName of webpFiles) {
    const baseName = webpName.replace(/\.webp$/i, "");

    for (const suffix of COMPANION_SUFFIXES) {
      const candidate = path.join(stylesDir, `${baseName}${suffix}`);
      if (!(await fileExists(candidate))) continue;

      const stats = await fs.stat(candidate);
      await fs.unlink(candidate);
      removedCount += 1;
      removedBytes += stats.size;
    }
  }

  console.log(`style webp files scanned: ${webpFiles.length}`);
  console.log(`redundant svg artifacts removed: ${removedCount}`);
  console.log(`bytes removed: ${removedBytes}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
