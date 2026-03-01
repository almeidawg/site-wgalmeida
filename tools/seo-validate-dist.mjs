import fs from "node:fs";
import path from "node:path";

const distDir = process.argv[2] || "dist";
const root = process.cwd();
const base = path.join(root, distDir);

const checks = [];
let hasError = false;

function ok(message) {
  checks.push(`OK   ${message}`);
}

function fail(message) {
  checks.push(`FAIL ${message}`);
  hasError = true;
}

function exists(relPath) {
  return fs.existsSync(path.join(base, relPath));
}

function read(relPath) {
  return fs.readFileSync(path.join(base, relPath), "utf8");
}

if (!fs.existsSync(base)) {
  console.error(`Dist directory not found: ${base}`);
  process.exit(1);
}

["index.html", "robots.txt", "sitemap.xml", "sitemap-index.xml", "video-sitemap.xml"].forEach((file) => {
  if (exists(file)) ok(`${distDir}/${file} exists`);
  else fail(`${distDir}/${file} is missing`);
});

if (exists("index.html")) {
  const html = read("index.html");

  if (html.includes("Ã")) fail(`${distDir}/index.html contains mojibake`);
  else ok(`${distDir}/index.html has no mojibake`);

  if (/<link\s+rel="canonical"\s+href="https:\/\/wgalmeida\.com\.br\//i.test(html)) {
    ok(`${distDir}/index.html has canonical tag`);
  } else {
    fail(`${distDir}/index.html missing canonical tag`);
  }

  const ogImage = html.match(/<meta\s+property="og:image"\s+content="https:\/\/wgalmeida\.com\.br\/([^"]+)"/i);
  if (!ogImage) {
    fail(`${distDir}/index.html missing og:image`);
  } else if (exists(ogImage[1])) {
    ok(`${distDir}/index.html og:image file exists (${ogImage[1]})`);
  } else {
    fail(`${distDir}/index.html og:image file is missing (${ogImage[1]})`);
  }
}

if (exists("robots.txt")) {
  const robots = read("robots.txt");
  if (robots.includes("Sitemap: https://wgalmeida.com.br/sitemap-index.xml")) ok(`${distDir}/robots.txt references sitemap-index.xml`);
  else fail(`${distDir}/robots.txt missing sitemap-index.xml reference`);

  if (/crawl-delay/i.test(robots)) fail(`${distDir}/robots.txt should not contain Crawl-delay`);
  else ok(`${distDir}/robots.txt has no Crawl-delay directives`);
}

console.log("\nSEO Dist Validation");
console.log("-------------------");
checks.forEach((line) => console.log(line));
console.log("-------------------");

if (hasError) {
  console.error("SEO dist validation finished with errors.");
  process.exit(1);
}

console.log("SEO dist validation finished successfully.");
