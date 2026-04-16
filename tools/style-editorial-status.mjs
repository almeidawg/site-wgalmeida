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

const checkHttpStatus = async (url) => {
  if (!url) return { ok: false, status: 0, error: 'missing-url' };

  try {
    let response = await fetch(url, { method: 'HEAD' });

    if (response.status === 405 || response.status === 403) {
      response = await fetch(url, { method: 'GET' });
    }

    return {
      ok: response.ok,
      status: response.status,
      error: '',
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message,
    };
  }
};

const styleSlugs = fs
  .readdirSync(estilosDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
  .map((entry) => entry.name.replace(/\.md$/, ''))
  .sort();

const report = await Promise.all(
  styleSlugs.map(async (slug) => {
    const localWebp = path.join(publicImagesDir, `${slug}.webp`);
    const localSvg = path.join(publicImagesDir, `${slug}.svg`);
    const hasLocalWebp = fs.existsSync(localWebp);
    const hasLocalSvg = fs.existsSync(localSvg);
    const cloudinaryPublicId = STYLE_IMAGE_MANIFEST?.[slug] || '';
    const resolvedCard = getCloudinaryStyleImage({ slug, variant: 'card' }) || '';
    const cloudinaryStatus = await checkHttpStatus(resolvedCard);

    return {
      slug,
      title: slugToTitle(slug),
      hasLocalWebp,
      hasLocalSvg,
      publicReady: hasLocalWebp,
      cloudinaryPublicId,
      hasCloudinary: Boolean(cloudinaryPublicId),
      cloudinaryReachable: Boolean(cloudinaryPublicId && cloudinaryStatus.ok),
      cloudinaryStatus: cloudinaryPublicId ? cloudinaryStatus.status : 0,
      cloudinaryError: cloudinaryPublicId ? cloudinaryStatus.error : '',
      resolvedCard,
      search: buildSearchUrls(slug),
    };
  })
);

const summary = {
  styles: report.length,
  localWebp: report.filter((item) => item.hasLocalWebp).length,
  localSvg: report.filter((item) => item.hasLocalSvg).length,
  publicReady: report.filter((item) => item.publicReady).length,
  cloudinaryManifest: report.filter((item) => item.hasCloudinary).length,
  cloudinaryReachable: report.filter((item) => item.cloudinaryReachable).length,
  cloudinaryBroken: report.filter((item) => item.hasCloudinary && !item.cloudinaryReachable).length,
  missingCloudinary: report.filter((item) => !item.hasCloudinary).length,
};

const payload = { generatedAt: new Date().toISOString(), summary, report };

fs.writeFileSync(reportPath, JSON.stringify(payload, null, 2));
fs.writeFileSync(latestReportPath, JSON.stringify(payload, null, 2));

console.log(`Styles: ${summary.styles}`);
console.log(`Local WEBP: ${summary.localWebp}`);
console.log(`Local SVG: ${summary.localSvg}`);
console.log(`Public ready: ${summary.publicReady}`);
console.log(`Cloudinary manifest: ${summary.cloudinaryManifest}`);
console.log(`Cloudinary reachable: ${summary.cloudinaryReachable}`);
console.log(`Cloudinary broken: ${summary.cloudinaryBroken}`);
console.log(`Missing Cloudinary manifest: ${summary.missingCloudinary}`);

if (summary.missingCloudinary > 0) {
  console.log('\nMissing Cloudinary entries:');
  for (const item of report.filter((entry) => !entry.hasCloudinary)) {
    console.log(`- ${item.slug}`);
    console.log(`  Google Images: ${item.search.googleImages}`);
    console.log(`  Unsplash: ${item.search.unsplash}`);
  }
}

if (summary.cloudinaryBroken > 0) {
  console.log('\nBroken Cloudinary style assets:');
  for (const item of report.filter((entry) => entry.hasCloudinary && !entry.cloudinaryReachable)) {
    console.log(`- ${item.slug} (${item.cloudinaryStatus || item.cloudinaryError || 'unknown'})`);
    console.log(`  ${item.resolvedCard}`);
  }
}

console.log(`Saved report to ${reportPath}`);
console.log(`Saved latest report to ${latestReportPath}`);
