import fs from "node:fs/promises";
import path from "node:path";

const distDir = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(process.cwd(), "dist");

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const requiredFiles = [
    path.join(distDir, "index.html"),
    path.join(distDir, "sitemap.xml"),
  ];

  const missing = [];
  for (const filePath of requiredFiles) {
    if (!(await exists(filePath))) missing.push(path.relative(distDir, filePath));
  }

  const blogDir = path.join(distDir, "blog");
  const estilosDir = path.join(distDir, "estilos");

  if (!(await exists(blogDir))) missing.push("blog/");
  if (!(await exists(estilosDir))) missing.push("estilos/");

  if (missing.length) {
    console.log("dist validation failed:");
    for (const item of missing) console.log(`- missing: ${item}`);
    process.exit(1);
  }

  const sitemap = await fs.readFile(path.join(distDir, "sitemap.xml"), "utf8");
  const routeCount = [...sitemap.matchAll(/<loc>/g)].length;
  console.log(`dist root: ${distDir}`);
  console.log(`sitemap routes: ${routeCount}`);
  console.log("dist validation: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
