import fs from "node:fs/promises";
import path from "node:path";

const targetDir = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(process.cwd(), "dist");

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

function formatKb(size) {
  return `${(size / 1024).toFixed(1)} KB`;
}

async function main() {
  const allFiles = await walk(targetDir);
  const stats = await Promise.all(
    allFiles.map(async (filePath) => ({
      filePath,
      relativePath: path.relative(targetDir, filePath),
      size: (await fs.stat(filePath)).size,
    })),
  );

  const top = [...stats].sort((a, b) => b.size - a.size).slice(0, 15);
  const critical = stats.filter((item) => item.size >= 500 * 1024);

  console.log(`asset root: ${targetDir}`);
  console.log(`total files: ${stats.length}`);
  console.log(`assets >= 500 KB: ${critical.length}`);
  console.log("");
  console.log("Top 15 largest assets:");

  for (const item of top) {
    console.log(`- ${item.relativePath} :: ${formatKb(item.size)}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
