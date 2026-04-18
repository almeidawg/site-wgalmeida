import { describe, expect, it } from 'vitest';
import {
  buildEditorialOverrideEntry,
  buildEditorialOverrideMap,
  serializeEditorialOverridesModule,
} from '@/lib/editorialOverrides';

describe('editorialOverrides', () => {
  it('builds cloudinary and remote entries from admin session state', () => {
    const entry = buildEditorialOverrideEntry({
      slug: 'post-alpha',
      uploads: {
        'post-alpha': {
          hero: { publicId: 'editorial/blog/post-alpha/hero' },
          card: {
            src: 'https://images.unsplash.com/photo-123',
            source: 'unsplash',
            unsplashPhotoId: 'abc123',
            alt: 'Card image',
          },
          context1: {
            src: 'https://example.com/context-1.jpg',
            source: 'remote',
            sectionTitle: 'Bloco 1',
          },
        },
      },
      unsplashSelections: {},
    });

    expect(entry.hero).toBe('editorial/blog/post-alpha/hero');
    expect(entry.seo).toBe('editorial/blog/post-alpha/hero');
    expect(entry.card).toMatchObject({
      source: 'unsplash',
      src: 'https://images.unsplash.com/photo-123',
      alt: 'Card image',
    });
    expect(entry.default).toBe('editorial/blog/post-alpha/hero');
    expect(entry.context).toHaveLength(1);
    expect(entry.context[0]).toMatchObject({
      source: 'remote',
      sectionTitle: 'Bloco 1',
    });
  });

  it('uses unsplash selections when no upload exists and reports removed slugs', () => {
    const result = buildEditorialOverrideMap({
      uploads: {},
      unsplashSelections: {
        'post-beta': {
          hero: { id: 'hero123', alt: 'Hero alt' },
          card: { id: 'card456' },
        },
      },
      managedSlugs: ['post-beta', 'post-empty'],
    });

    expect(result.entries['post-beta']).toMatchObject({
      hero: { source: 'unsplash', alt: 'Hero alt' },
      card: { source: 'unsplash' },
    });
    expect(result.removedSlugs).toContain('post-empty');
  });

  it('serializes overrides file preserving unrelated existing entries', () => {
    const source = serializeEditorialOverridesModule({
      existing: {
        generatedAt: '2026-01-01T00:00:00.000Z',
        source: 'admin-localstorage-import',
        slugs: {
          legacy: { hero: { source: 'local', src: '/images/blog/legacy/hero.webp' } },
        },
      },
      entries: {
        fresh: { hero: 'editorial/blog/fresh/hero', seo: 'editorial/blog/fresh/hero', default: 'editorial/blog/fresh/hero' },
      },
      removedSlugs: [],
    });

    expect(source).toContain('"legacy"');
    expect(source).toContain('"fresh"');
    expect(source).toContain('"source": "admin-api-sync"');
  });
});
