import fs from 'node:fs';
import path from 'node:path';
import STYLE_IMAGE_MANIFEST from '../src/data/styleImageManifest.js';
import { getCloudinaryStyleImage } from '../src/data/styleImageManifest.js';

const root = process.cwd();
const estilosDir = path.join(root, 'src', 'content', 'estilos');
const publicImagesDir = path.join(root, 'public', 'images', 'estilos');
const reportPath = path.join(root, `style-editorial-status-${new Date().toISOString().slice(0, 10)}.json`);
const latestReportPath = path.join(root, 'style-editorial-status.latest.json');

const slugToTitle = (slug = '') =>
  slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const buildSearchUrls = (slug) => {
  const theme = `${slugToTitle(slug)} interior design`;
  return {
    googleImages: `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(theme)}`,
    unsplash: `https://unsplash.com/s/photos/${encodeURIComponent(theme)}`,
  };
};

const styleSlugs = fs
  .readdirSync(estilosDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
  .map((entry) => entry.name.replace(/\.md$/, ''))
  .sort();

const report = styleSlugs.map((slug) => {
  const localWebp = path.join(publicImagesDir, `${slug}.webp`);
  const localSvg = path.join(publicImagesDir, `${slug}.svg`);
  const hasLocalWebp = fs.existsSync(localWebp);
  const hasLocalSvg = fs.existsSync(localSvg);
  const cloudinaryPublicId = STYLE_IMAGE_MANIFEST?.[slug] || '';
  const resolvedCard = getCloudinaryStyleImage({ slug, variant: 'card' }) || '';

  return {
    slug,
    title: slugToTitle(slug),
    hasLocalWebp,
    hasLocalSvg,
    cloudinaryPublicId,
    hasCloudinary: Boolean(cloudinaryPublicId),
    resolvedCard,
    search: buildSearchUrls(slug),
  };
});

const summary = {
  styles: report.length,
  localWebp: report.filter((item) => item.hasLocalWebp).length,
  localSvg: report.filter((item) => item.hasLocalSvg).length,
  cloudinary: report.filter((item) => item.hasCloudinary).length,
  missingCloudinary: report.filter((item) => !item.hasCloudinary).length,
};

const payload = { generatedAt: new Date().toISOString(), summary, report };

fs.writeFileSync(reportPath, JSON.stringify(payload, null, 2));
fs.writeFileSync(latestReportPath, JSON.stringify(payload, null, 2));

console.log(`Styles: ${summary.styles}`);
console.log(`Local WEBP: ${summary.localWebp}`);
console.log(`Local SVG: ${summary.localSvg}`);
console.log(`Cloudinary manifest: ${summary.cloudinary}`);
console.log(`Missing Cloudinary manifest: ${summary.missingCloudinary}`);

if (summary.missingCloudinary > 0) {
  console.log('\nMissing Cloudinary entries:');
  for (const item of report.filter((entry) => !entry.hasCloudinary)) {
    console.log(`- ${item.slug}`);
    console.log(`  Google Images: ${item.search.googleImages}`);
    console.log(`  Unsplash: ${item.search.unsplash}`);
  }
}

console.log(`Saved report to ${reportPath}`);
console.log(`Saved latest report to ${latestReportPath}`);
