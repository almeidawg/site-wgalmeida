import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const publicDir = path.join(root, "public");
const contentDirs = [
  path.join(root, "src", "content", "blog"),
  path.join(root, "src", "content", "estilos"),
];

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};

  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const found = line.match(/^(\w+):\s*"?([^"]*)"?\s*$/);
    if (found) data[found[1]] = found[2].trim();
  }
  return data;
}

async function walkMarkdown(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return walkMarkdown(fullPath);
      if (entry.isFile() && entry.name.endsWith(".md")) return [fullPath];
      return [];
    }),
  );
  return files.flat();
}

async function main() {
  const markdownFiles = (await Promise.all(contentDirs.map(walkMarkdown))).flat();
  const missing = [];

  for (const filePath of markdownFiles) {
    const raw = await fs.readFile(filePath, "utf8");
    const frontmatter = parseFrontmatter(raw);
    if (!frontmatter.image || !frontmatter.image.startsWith("/")) continue;

    const assetPath = path.join(publicDir, frontmatter.image.replace(/^\//, ""));
    try {
      await fs.access(assetPath);
    } catch {
      missing.push({
        markdown: path.relative(root, filePath),
        image: frontmatter.image,
      });
    }
  }

  console.log(`markdown checked: ${markdownFiles.length}`);
  console.log(`missing frontmatter assets: ${missing.length}`);

  if (missing.length) {
    for (const item of missing.slice(0, 20)) {
      console.log(`- ${item.markdown} -> ${item.image}`);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
