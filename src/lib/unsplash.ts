import { buildWgImageSearchPayload } from '@/lib/wgVisualSearchProfile';

const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY || '';
const UNSPLASH_API_URL = 'https://api.unsplash.com';

export interface UnsplashImage {
  id: string;
  urls: {
    regular: string;
    full: string;
    raw: string;
  };
  alt_description: string;
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

const buildAuthHeaders = () => ({
  Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
  'Accept-Version': 'v1',
});

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
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn('Unsplash access key is missing. Configure VITE_UNSPLASH_ACCESS_KEY to enable image search.');
    return [];
  }

  try {
    const params = new URLSearchParams({
      query,
      orientation,
      per_page: perPage.toString(),
      content_filter: 'high',
      order_by: 'relevant',
    });

    if (color) {
      params.append('color', color);
    }

    const response = await fetch(`${UNSPLASH_API_URL}/search/photos?${params}`, {
      headers: buildAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error fetching from Unsplash:', error);
    return [];
  }
}

export async function getRandomImage(
  query: string,
  orientation?: 'landscape' | 'portrait'
): Promise<UnsplashImage | null> {
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn('Unsplash access key is missing. Configure VITE_UNSPLASH_ACCESS_KEY to enable image search.');
    return null;
  }

  try {
    const params = new URLSearchParams({
      query,
    });

    if (orientation) {
      params.append('orientation', orientation);
    }

    const response = await fetch(`${UNSPLASH_API_URL}/photos/random?${params}`, {
      headers: buildAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.statusText}`);
    }

    return await response.json();
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
