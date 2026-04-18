import { buildWgImageSearchPayload } from '@/lib/wgVisualSearchProfile';

const UNSPLASH_PROXY_URL = '/api/unsplash-search';

export interface UnsplashImage {
  id: string;
  urls: {
    regular: string;
    full: string;
    raw: string;
    thumb?: string;
    small?: string;
  };
  alt_description: string;
  description?: string;
  photographer?: string;
  photographerUsername?: string;
  profileUrl?: string;
  unsplashPage?: string;
  downloadLocation?: string;
  user: {
    name: string;
    links: {
      html: string;
    };
  };
}

interface SearchParams {
  query: string;
  orientation?: 'landscape' | 'portrait' | 'squarish';
  color?: string;
  perPage?: number;
}

interface UnsplashTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  fit?: 'crop' | 'max' | 'fill' | 'clip';
  crop?: string | null;
}

interface UnsplashSrcSetVariant extends UnsplashTransformOptions {
  descriptor: string;
}

const isUnsplashImageUrl = (value: string) => {
  if (!value) return false;

  try {
    const parsed = new URL(value);
    return parsed.hostname === 'images.unsplash.com';
  } catch {
    return false;
  }
};

export function normalizeUnsplashImageUrl(value: string, options: UnsplashTransformOptions = {}): string {
  if (!isUnsplashImageUrl(value)) {
    return value;
  }

  const {
    width,
    height,
    quality = 80,
    fit = height ? 'crop' : 'max',
    crop = fit === 'crop' ? 'entropy' : null,
  } = options;

  const parsed = new URL(value);
  const params = parsed.searchParams;

  ['auto', 'fm', 'fit', 'crop', 'q', 'w', 'h'].forEach((key) => params.delete(key));
  params.set('auto', 'format');
  params.set('q', String(quality));
  params.set('fit', fit);

  if (crop) {
    params.set('crop', crop);
  }

  if (typeof width === 'number') {
    params.set('w', String(width));
  }

  if (typeof height === 'number') {
    params.set('h', String(height));
  }

  return parsed.toString();
}

export function buildUnsplashSrcSet(value: string, variants: UnsplashSrcSetVariant[]): string {
  return variants
    .map(({ descriptor, ...options }) => `${normalizeUnsplashImageUrl(value, options)} ${descriptor}`)
    .join(', ');
}

export async function searchUnsplashImages({
  query,
  orientation = 'landscape',
  color,
  perPage = 10,
}: SearchParams): Promise<UnsplashImage[]> {
  try {
    const params = new URLSearchParams({
      query,
      orientation,
      per_page: perPage.toString(),
    });

    if (color) {
      params.append('color', color);
    }

    const response = await fetch(`${UNSPLASH_PROXY_URL}?${params}`);

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.statusText}`);
    }

    const data = await response.json();
    return (data.photos || []).map((photo: any) => ({
      id: photo.id,
      urls: {
        regular: photo.urls?.regular || '',
        full: photo.urls?.full || '',
        raw: photo.urls?.raw || '',
        thumb: photo.urls?.thumb || '',
        small: photo.urls?.small || '',
      },
      alt_description: photo.alt || photo.description || '',
      description: photo.description || photo.alt || '',
      photographer: photo.photographer || '',
      photographerUsername: photo.photographerUsername || '',
      profileUrl: photo.profileUrl || '',
      unsplashPage: photo.unsplashPage || '',
      downloadLocation: photo.downloadLocation || '',
      user: {
        name: photo.photographer || '',
        links: {
          html: photo.profileUrl || '',
        },
      },
    }));
  } catch (error) {
    console.error('Error fetching from Unsplash:', error);
    return [];
  }
}

export async function getRandomImage(
  query: string,
  orientation?: 'landscape' | 'portrait'
): Promise<UnsplashImage | null> {
  try {
    const [firstImage] = await searchUnsplashImages({
      query,
      orientation: orientation || 'landscape',
      perPage: 1,
    });
    return firstImage || null;
  } catch (error) {
    console.error('Error fetching random image from Unsplash:', error);
    return null;
  }
}

export function buildImageQuery(style: string, environment: string, colorPalette?: string[]): string {
  const toneHint = colorPalette && colorPalette.length > 0 ? 'neutral palette' : '';
  const payload = buildWgImageSearchPayload(`${style} ${environment} ${toneHint}`.trim(), {
    category: 'design',
    slot: 'hero',
  });

  return payload.mainQuery;
}

export function mapColorToUnsplash(color: string): string {
  const colorMap: Record<string, string> = {
    branco: 'white',
    preto: 'black',
    cinza: 'black_and_white',
    marrom: 'brown',
    bege: 'yellow',
    verde: 'green',
    azul: 'blue',
    laranja: 'orange',
    rosa: 'magenta',
    vermelho: 'red',
    amarelo: 'yellow',
    roxo: 'purple',
  };

  return colorMap[color.toLowerCase()] || '';
}
