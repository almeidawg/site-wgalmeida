// Unsplash API integration for moodboard image fetching
const UNSPLASH_ACCESS_KEY = 'thlDT58odwkTiBspsbgUoQdwes7QWFudrXalC0NWPMg';
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

export async function searchUnsplashImages({
  query,
  orientation = 'landscape',
  color,
  perPage = 10
}: SearchParams): Promise<UnsplashImage[]> {
  try {
    const params = new URLSearchParams({
      query,
      orientation,
      per_page: perPage.toString(),
      client_id: UNSPLASH_ACCESS_KEY
    });

    if (color) {
      params.append('color', color);
    }

    const response = await fetch(`${UNSPLASH_API_URL}/search/photos?${params}`);

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

export async function getRandomImage(query: string, orientation?: 'landscape' | 'portrait'): Promise<UnsplashImage | null> {
  try {
    const params = new URLSearchParams({
      query,
      client_id: UNSPLASH_ACCESS_KEY
    });

    if (orientation) {
      params.append('orientation', orientation);
    }

    const response = await fetch(`${UNSPLASH_API_URL}/photos/random?${params}`);

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching random image from Unsplash:', error);
    return null;
  }
}

// Helper function to build search query based on style and environment
export function buildImageQuery(style: string, environment: string, colorPalette?: string[]): string {
  let query = `${style} ${environment} interior design architecture`;

  if (colorPalette && colorPalette.length > 0) {
    // Add dominant color to search
    query += ` ${colorPalette[0]}`;
  }

  return query;
}

// Map color names to Unsplash color parameters
export function mapColorToUnsplash(color: string): string {
  const colorMap: Record<string, string> = {
    'branco': 'white',
    'preto': 'black',
    'cinza': 'black_and_white',
    'marrom': 'brown',
    'bege': 'yellow',
    'verde': 'green',
    'azul': 'blue',
    'laranja': 'orange',
    'rosa': 'magenta',
    'vermelho': 'red',
    'amarelo': 'yellow',
    'roxo': 'purple'
  };

  return colorMap[color.toLowerCase()] || '';
}
