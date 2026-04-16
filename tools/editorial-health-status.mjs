import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const today = new Date().toISOString().slice(0, 10);
const reportPath = path.join(root, `editorial-health-status-${today}.json`);
const latestReportPath = path.join(root, 'editorial-health-status.latest.json');

const runTool = (script) => {
  execFileSync(process.execPath, [path.join(root, 'tools', script)], {
    cwd: root,
    stdio: 'inherit',
  });
};

const readJson = (filename) => JSON.parse(fs.readFileSync(path.join(root, filename), 'utf8'));

runTool('blog-editorial-status.mjs');
runTool('build-editorial-search-report.mjs');
runTool('audit-blog-image-repetition.mjs');
runTool('style-editorial-status.mjs');

const blogStatus = readJson('blog-editorial-status.latest.json');
const editorialSearch = readJson('editorial-search-report.latest.json');
const blogRepetition = readJson('blog-image-repetition-audit.latest.json');
const styleStatus = readJson('style-editorial-status.latest.json');

const blogSummary = blogStatus.summary || {};
const blogCoverage = blogSummary.coverage || {};
const searchSummary = editorialSearch.summary || {};
const repetitionSummary = blogRepetition.summary || {};
const styleSummary = styleStatus.summary || {};

const blogStructuralClosed = Boolean(
  blogSummary.totalPosts > 0
  && (blogCoverage['published-manifest'] || 0) === blogSummary.totalPosts
  && (blogCoverage['published-remote-curated'] || 0) === 0
  && (blogCoverage['generic-banner-fallback'] || 0) === 0
  && (searchSummary.blogNeedsSearch || 0) === 0
  && (searchSummary.blogHeroUnsplashOrRemote || 0) === 0
  && (searchSummary.blogCardUnsplashOrRemote || 0) === 0
  && (repetitionSummary.problematicDuplicates || 0) === 0
  && (repetitionSummary.allThreeEqual || 0) === 0
);

const stylesStructuralClosed = Boolean(
  styleSummary.styles > 0
  && styleSummary.styles === styleSummary.localWebp
  && styleSummary.styles === styleSummary.localSvg
  && styleSummary.styles === (styleSummary.publicReady || 0)
);

const stylesCloudinaryClosed = Boolean(
  styleSummary.styles > 0
  && styleSummary.styles === (styleSummary.cloudinaryManifest || styleSummary.cloudinary || 0)
  && styleSummary.styles === (styleSummary.cloudinaryReachable || 0)
  && (styleSummary.cloudinaryBroken || 0) === 0
  && styleSummary.missingCloudinary === 0
);

const payload = {
  generatedAt: new Date().toISOString(),
  summary: {
    blogStructuralClosed,
    stylesStructuralClosed,
    stylesCloudinaryClosed,
    editorialStructuralClosed: blogStructuralClosed && stylesStructuralClosed,
  },
  blog: {
    totalPosts: blogSummary.totalPosts || 0,
    publishedWithManifest: blogCoverage['published-manifest'] || 0,
    publishedWithRemoteCuratedAsset: blogCoverage['published-remote-curated'] || 0,
    genericBannerFallback: blogCoverage['generic-banner-fallback'] || 0,
    needsSearch: searchSummary.blogNeedsSearch || 0,
    heroUnsplashOrRemote: searchSummary.blogHeroUnsplashOrRemote || 0,
    cardUnsplashOrRemote: searchSummary.blogCardUnsplashOrRemote || 0,
    problematicDuplicates: repetitionSummary.problematicDuplicates || 0,
    allThreeEqual: repetitionSummary.allThreeEqual || 0,
  },
  styles: {
    totalStyles: styleSummary.styles || 0,
    localWebp: styleSummary.localWebp || 0,
    localSvg: styleSummary.localSvg || 0,
    publicReady: styleSummary.publicReady || 0,
    cloudinaryManifest: styleSummary.cloudinaryManifest || styleSummary.cloudinary || 0,
    cloudinaryReachable: styleSummary.cloudinaryReachable || 0,
    cloudinaryBroken: styleSummary.cloudinaryBroken || 0,
    missingCloudinary: styleSummary.missingCloudinary || 0,
  },
  evidence: {
    blogStatus: 'blog-editorial-status.latest.json',
    editorialSearch: 'editorial-search-report.latest.json',
    blogRepetition: 'blog-image-repetition-audit.latest.json',
    styleStatus: 'style-editorial-status.latest.json',
  },
};

fs.writeFileSync(reportPath, JSON.stringify(payload, null, 2));
fs.writeFileSync(latestReportPath, JSON.stringify(payload, null, 2));

console.log(`Blog structural closed: ${payload.summary.blogStructuralClosed ? 'YES' : 'NO'}`);
console.log(`Styles structural closed: ${payload.summary.stylesStructuralClosed ? 'YES' : 'NO'}`);
console.log(`Styles Cloudinary closed: ${payload.summary.stylesCloudinaryClosed ? 'YES' : 'NO'}`);
console.log(`Editorial structural closed: ${payload.summary.editorialStructuralClosed ? 'YES' : 'NO'}`);
console.log(`Saved report to ${reportPath}`);
console.log(`Saved latest report to ${latestReportPath}`);
