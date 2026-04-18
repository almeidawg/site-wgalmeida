import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const repoRoot = path.resolve(import.meta.dirname, '..', '..');
const helperModulePath = path.join(repoRoot, 'api', '_editorialOverrides.js');
const originalCwd = process.cwd();

afterEach(async () => {
  process.chdir(originalCwd);
});

describe('syncEditorialOverrides', () => {
  it('writes published blog and page overrides from admin uploads', async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'wg-editorial-overrides-'));
    const dataDir = path.join(tempRoot, 'src', 'data');
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(
      path.join(dataDir, 'blogImageOverrides.generated.js'),
      'const BLOG_IMAGE_OVERRIDES = { generatedAt: "", source: "test", slugs: {} };\nexport default BLOG_IMAGE_OVERRIDES;\n',
      'utf8'
    );
    await fs.writeFile(
      path.join(dataDir, 'publicPageImageOverrides.generated.js'),
      'const PUBLIC_PAGE_IMAGE_OVERRIDES = { generatedAt: "", source: "test", pages: {} };\nexport default PUBLIC_PAGE_IMAGE_OVERRIDES;\n',
      'utf8'
    );

    process.chdir(tempRoot);

    const helper = await import(`${pathToFileURL(helperModulePath).href}?test=${Date.now()}`);
    const result = await helper.syncEditorialOverrides({
      uploads: {
        'post-teste': {
          hero: {
            publicId: 'editorial/blog/post-teste/hero',
            alt: 'Hero do post teste',
          },
          card: {
            src: 'https://images.unsplash.com/photo-123?w=720&h=480',
            alt: 'Card do post teste',
            pageUrl: 'https://unsplash.com/photos/post-teste',
          },
        },
        buildtech: {
          hero: {
            publicId: 'editorial/pages/buildtech/hero',
            alt: 'Build Tech hero',
          },
        },
      },
      managedBlogSlugs: ['post-teste'],
      managedPageSlugs: ['buildtech'],
      source: 'vitest',
    });

    expect(result.ok).toBe(true);
    expect(result.blog.synced).toBe(1);
    expect(result.pages.synced).toBe(1);

    const blogOutput = await fs.readFile(path.join(dataDir, 'blogImageOverrides.generated.js'), 'utf8');
    const pageOutput = await fs.readFile(path.join(dataDir, 'publicPageImageOverrides.generated.js'), 'utf8');

    expect(blogOutput).toContain('"post-teste"');
    expect(blogOutput).toContain('"hero": {');
    expect(blogOutput).toContain('"publicId": "editorial/blog/post-teste/hero"');
    expect(blogOutput).toContain('"card": {');
    expect(blogOutput).toContain('"source": "unsplash"');
    expect(pageOutput).toContain('"buildtech"');
    expect(pageOutput).toContain('"publicId": "editorial/pages/buildtech/hero"');
  });
});
