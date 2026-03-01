import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checks = [];
let hasError = false;

function ok(message) {
  checks.push(`OK   ${message}`);
}

function warn(message) {
  checks.push(`WARN ${message}`);
}

function fail(message) {
  checks.push(`FAIL ${message}`);
  hasError = true;
}

function exists(relPath) {
  return fs.existsSync(path.join(root, relPath));
}

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

["public/robots.txt", "public/sitemap.xml", "public/sitemap-index.xml", "index.html"].forEach((file) => {
  if (exists(file)) ok(`${file} exists`);
  else fail(`${file} is missing`);
});

if (exists("index.html")) {
  const html = read("index.html");

  if (html.includes("Ã")) fail("index.html contains encoding artifacts (mojibake)");
  else ok("index.html has no mojibake artifacts");

  const ogMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
  const twMatch = html.match(/<meta\s+name="twitter:image"\s+content="([^"]+)"/i);

  const imageTags = [
    ["og:image", ogMatch?.[1]],
    ["twitter:image", twMatch?.[1]],
  ];

  imageTags.forEach(([name, url]) => {
    if (!url) {
      fail(`${name} tag is missing`);
      return;
    }
    if (url.startsWith("https://wgalmeida.com.br/")) {
      const localPath = `public/${url.replace("https://wgalmeida.com.br/", "")}`;
      if (exists(localPath)) ok(`${name} points to existing file (${localPath})`);
      else fail(`${name} points to missing file (${localPath})`);
      return;
    }
    warn(`${name} uses an external URL (${url})`);
  });
}

if (exists("public/robots.txt")) {
  const robots = read("public/robots.txt");
  if (robots.includes("Sitemap: https://wgalmeida.com.br/sitemap-index.xml")) ok("robots.txt references sitemap-index.xml");
  else fail("robots.txt does not reference sitemap-index.xml");
}

const sourceDir = path.join(root, "src");
if (fs.existsSync(sourceDir)) {
  const files = [];
  const stack = [sourceDir];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile() && /\.(js|jsx|ts|tsx)$/.test(entry.name)) files.push(full);
    }
  }

  const legacyHelmetImports = files.filter((file) => {
    const text = fs.readFileSync(file, "utf8");
    return text.includes("from 'react-helmet'") || text.includes('from "react-helmet"');
  });

  if (legacyHelmetImports.length > 0) {
    fail(`legacy react-helmet imports found (${legacyHelmetImports.length} files)`);
  } else {
    ok("only react-helmet-async is used");
  }
}

console.log("\nSEO Audit");
console.log("---------");
checks.forEach((line) => console.log(line));
console.log("---------");

if (hasError) {
  console.error("SEO audit finished with errors.");
  process.exit(1);
}

console.log("SEO audit finished successfully.");
