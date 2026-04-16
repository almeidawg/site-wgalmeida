import fs from 'node:fs';
import path from 'node:path';
import { BLOG_IMAGE_MANIFEST, getBlogManifestEntry, getBlogImageAsset } from '../src/data/blogImageManifest.js';

const root = process.cwd();
const reportPath = path.join(root, `blog-image-repetition-audit-${new Date().toISOString().slice(0, 10)}.json`);
const latestReportPath = path.join(root, 'blog-image-repetition-audit.latest.json');

const slugs = Object.keys(BLOG_IMAGE_MANIFEST?.slugs || {}).sort();

const results = slugs.map((slug) => {
  const entry = getBlogManifestEntry(slug);
  const hero = getBlogImageAsset({ slug, variant: 'hero', allowCategoryFallback: false });
  const card = getBlogImageAsset({ slug, variant: 'card', allowCategoryFallback: false });
  const thumb = getBlogImageAsset({ slug, variant: 'thumb', allowCategoryFallback: false });

  const heroSrc = hero?.src || '';
  const cardSrc = card?.src || '';
  const thumbSrc = thumb?.src || '';

  return {
    slug,
    hasEntry: Boolean(entry),
    missingHero: !heroSrc,
    missingCard: !cardSrc,
    missingThumb: !thumbSrc,
    heroEqualsCard: Boolean(heroSrc && cardSrc && heroSrc === cardSrc),
    heroEqualsThumb: Boolean(heroSrc && thumbSrc && heroSrc === thumbSrc),
    cardEqualsThumb: Boolean(cardSrc && thumbSrc && cardSrc === thumbSrc),
    allThreeEqual: Boolean(heroSrc && cardSrc && thumbSrc && heroSrc === cardSrc && heroSrc === thumbSrc),
    heroSource: hero?.source || '',
    cardSource: card?.source || '',
    thumbSource: thumb?.source || '',
  };
});

const summary = {
  slugs: results.length,
  missingHero: results.filter((item) => item.missingHero).length,
  missingCard: results.filter((item) => item.missingCard).length,
  missingThumb: results.filter((item) => item.missingThumb).length,
  heroEqualsCard: results.filter((item) => item.heroEqualsCard).length,
  heroEqualsThumb: results.filter((item) => item.heroEqualsThumb).length,
  cardEqualsThumb: results.filter((item) => item.cardEqualsThumb).length,
  allThreeEqual: results.filter((item) => item.allThreeEqual).length,
  problematicDuplicates: results.filter((item) => item.heroEqualsCard || item.heroEqualsThumb || item.allThreeEqual).length,
};

const payload = { generatedAt: new Date().toISOString(), summary, results };

fs.writeFileSync(reportPath, JSON.stringify(payload, null, 2));
fs.writeFileSync(latestReportPath, JSON.stringify(payload, null, 2));

console.log(`Slugs audited: ${summary.slugs}`);
console.log(`Missing hero: ${summary.missingHero}`);
console.log(`Missing card: ${summary.missingCard}`);
console.log(`Missing thumb: ${summary.missingThumb}`);
console.log(`Hero = Card: ${summary.heroEqualsCard}`);
console.log(`Hero = Thumb: ${summary.heroEqualsThumb}`);
console.log(`Card = Thumb: ${summary.cardEqualsThumb}`);
console.log(`All three equal: ${summary.allThreeEqual}`);
console.log(`Problematic duplicates: ${summary.problematicDuplicates}`);
console.log(`Saved report to ${reportPath}`);
console.log(`Saved latest report to ${latestReportPath}`);
