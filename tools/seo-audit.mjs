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

console.log("\nSEO Audit - Grupo WG Almeida");
console.log("----------------------------");

// 1. Check critical files
["public/robots.txt", "public/sitemap.xml", "index.html"].forEach((file) => {
  if (exists(file)) ok(`${file} exists`);
  else fail(`${file} is missing`);
});

// 2. Audit index.html
if (exists("index.html")) {
  const html = read("index.html");

  // Keywords check (Should NOT exist)
  if (html.includes('name="keywords"')) fail("index.html still contains legacy 'keywords' meta tag");
  else ok("index.html is clean (no legacy keywords)");

  // Encoding check
  if (html.includes("Ã")) fail("index.html contains encoding artifacts (mojibake)");
  else ok("index.html has no mojibake artifacts");

  // Social images
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
      const fileName = url.replace("https://wgalmeida.com.br/", "");
      const localPath = exists(`dist/${fileName}`) ? `dist/${fileName}` : `public/${fileName}`;
      if (exists(localPath)) ok(`${name} points to existing file (${localPath})`);
      else fail(`${name} points to missing file (${localPath})`);
      return;
    }
    warn(`${name} uses an external URL (${url})`);
  });
}

// 3. Audit Components for Accessibility/SEO
const componentDir = path.join(root, "src", "components");
if (fs.existsSync(componentDir)) {
  const heroVideoPath = path.join(componentDir, "HeroVideo.jsx");
  if (fs.existsSync(heroVideoPath)) {
    const content = fs.readFileSync(heroVideoPath, "utf8");
    if (content.includes('alt=""') && content.includes('HeroVideo')) {
      fail("HeroVideo.jsx still has empty alt tags for poster image");
    } else {
      ok("HeroVideo.jsx has descriptive alt tags");
    }
  }
}

// 4. Check react-helmet usage
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

checks.forEach((line) => console.log(line));
console.log("----------------------------");

if (hasError) {
  console.error("SEO audit finished with errors.");
  process.exit(1);
}

console.log("SEO audit finished successfully.");
