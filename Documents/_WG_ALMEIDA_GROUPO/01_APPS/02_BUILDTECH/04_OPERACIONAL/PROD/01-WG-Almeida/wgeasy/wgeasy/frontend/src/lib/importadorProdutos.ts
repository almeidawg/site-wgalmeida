/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// IMPORTADOR DE PRODUTOS
// Sistema WG Easy - ImportaçÍo de produtos com IA e Web Search
// ============================================================

import { supabase, supabaseUrl } from "./supabaseClient";

export interface ProdutoImportado {
  titulo: string;
  preco: number;
  sku?: string;
  imagem_url?: string;
  url_origem: string;
  avaliacao?: number;
  total_avaliacoes?: number;
  marca?: string;
  categoria?: string;
  descricao?: string;
  especificacoes?: Record<string, string>;
}

// URL da Edge Function para chamadas IA (evita CORS)
const EDGE_FUNCTION_URL = `${supabaseUrl}/functions/v1/buscar-produto-ia`;

/**
 * Importa produto usando IA para extrair dados
 */
export async function importarProdutoPorLink(url: string): Promise<ProdutoImportado> {
  try {
    // Detectar o site de origem
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Mercado Livre tem API pública - usar diretamente
    if (hostname.includes('mercadolivre') || hostname.includes('mercadolibre')) {
      return await importarMercadoLivre(url);
    }

    // 1. Tentar proxy CORS primeiro (mais rápido)
    try {
      console.log('[ImportadorProdutos] Tentando proxy CORS...');
      const produto = await importarViaProxy(url, hostname);
      if (produto && produto.titulo && !produto.titulo.includes('Just a moment')) {
        console.log('[ImportadorProdutos] ✅ Produto extraído via proxy');
        return produto;
      }
      console.log('[ImportadorProdutos] Proxy retornou dados inválidos (Cloudflare?)');
    } catch (e) {
      console.log('[ImportadorProdutos] Proxy CORS falhou:', e);
    }

    // 2. Se proxy falhar, usar Edge Function (contorna Cloudflare)
    try {
      console.log('[ImportadorProdutos] Tentando Edge Function...');
      const produto = await importarViaEdgeFunction(url);
      if (produto && produto.titulo) {
        console.log('[ImportadorProdutos] ✅ Produto extraído via Edge Function');
        return produto;
      }
    } catch (e) {
      console.log('[ImportadorProdutos] Edge Function falhou:', e);
    }

    // Fallback com dados básicos (sem IA)
    return {
      titulo: `Produto de ${getSiteName(hostname)}`,
      preco: 0,
      url_origem: url,
      descricao: 'não foi possível extrair dados automaticamente. Por favor, preencha manualmente ou use a busca com IA.'
    };

  } catch (error) {
    console.error('Erro ao importar produto:', error);
    throw new Error('não foi possível importar o produto. Verifique a URL e tente novamente.');
  }
}

/**
 * Importa usando Edge Function com extraçÍo direta (sem IA)
 */
async function importarViaEdgeFunction(url: string): Promise<ProdutoImportado> {
  console.log('[ImportadorProdutos] Chamando Edge Function extrair_direto:', url);

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      termoBusca: url,
      tipo: 'extrair_direto'
    }),
  });

  if (!response.ok) {
    throw new Error(`Edge Function retornou ${response.status}`);
  }

  const data = await response.json();

  if (data.error || !data.produto) {
    throw new Error(data.error || 'Produto não encontrado');
  }

  const p = data.produto;

  return {
    titulo: p.titulo || 'Produto não encontrado',
    preco: parseFloat(p.preco) || 0,
    marca: p.marca,
    categoria: p.categoria,
    descricao: p.descricao,
    sku: p.sku,
    imagem_url: p.imagem_url,
    url_origem: url,
  };
}

/**
 * Importa usando proxy CORS
 */
async function importarViaProxy(url: string, hostname: string): Promise<ProdutoImportado> {
  // Tentar múltiplos proxies
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  ];

  for (const proxyUrl of proxies) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(proxyUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'text/html,application/xhtml+xml',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) continue;

      const html = await response.text();
      return extrairDadosDoHTML(html, url, hostname);
    } catch (e) {
      continue;
    }
  }

  throw new Error('Todos os proxies falharam');
}

/**
 * Importa usando IA via Edge Function (evita CORS)
 */
async function importarViaIA(url: string, _hostname: string): Promise<ProdutoImportado> {
  console.log('[ImportadorProdutos] Extraindo dados via Edge Function:', url);

  // Obter token de autenticaçÍo
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      termoBusca: url,
      tipo: 'extrair'
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('[ImportadorProdutos] Erro Edge Function:', errorData);
    throw new Error(errorData.error || 'Falha na chamada da IA');
  }

  const data = await response.json();

  if (data.error || !data.produto) {
    throw new Error(data.error || 'Produto não encontrado');
  }

  const produtoData = data.produto;

  return {
    titulo: produtoData.titulo || 'Produto não encontrado',
    preco: parseFloat(produtoData.preco) || 0,
    marca: produtoData.marca,
    categoria: produtoData.categoria,
    descricao: produtoData.descricao,
    sku: produtoData.sku,
    avaliacao: produtoData.avaliacao,
    total_avaliacoes: produtoData.total_avaliacoes,
    url_origem: url,
  };
}

/**
 * Extrai dados do HTML usando múltiplos métodos
 */
function extrairDadosDoHTML(html: string, url: string, hostname: string): ProdutoImportado {
  let titulo = '';
  let preco = 0;
  let imagem_url: string | undefined;
  let sku: string | undefined;
  let avaliacao: number | undefined;
  let total_avaliacoes: number | undefined;
  let marca: string | undefined;
  let descricao: string | undefined;

  // Método 1: JSON-LD (mais confiável)
  const jsonLdMatches = html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of jsonLdMatches) {
    try {
      const jsonData = JSON.parse(match[1]);
      const product = Array.isArray(jsonData)
        ? jsonData.find(item => item['@type'] === 'Product')
        : jsonData['@type'] === 'Product' ? jsonData : null;

      if (product) {
        titulo = product.name || titulo;
        preco = parseFloat(product.offers?.price || product.offers?.[0]?.price) || preco;
        imagem_url = product.image || product.image?.[0] || imagem_url;
        sku = product.sku || product.productID || sku;
        marca = product.brand?.name || product.brand || marca;
        descricao = product.description || descricao;

        if (product.aggregateRating) {
          avaliacao = parseFloat(product.aggregateRating.ratingValue) || avaliacao;
          total_avaliacoes = parseInt(product.aggregateRating.reviewCount || product.aggregateRating.ratingCount) || total_avaliacoes;
        }
      }
    } catch (e) {
      continue;
    }
  }

  // Método 2: Meta tags Open Graph
  if (!titulo) {
    const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/i);
    if (ogTitle) titulo = ogTitle[1];
  }

  if (!preco) {
    const ogPrice = html.match(/<meta[^>]*property="product:price:amount"[^>]*content="([^"]*)"/i);
    if (ogPrice) preco = parseFloat(ogPrice[1]) || 0;
  }

  if (!imagem_url) {
    const ogImage = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"/i);
    if (ogImage) imagem_url = ogImage[1];
  }

  // Método 3: Regex patterns específicos por site
  if (hostname.includes('leroymerlin')) {
    if (!titulo) {
      const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      if (h1) titulo = h1[1].trim();
    }
    if (!preco) {
      const precoMatch = html.match(/"price"[:\s]*"?([0-9]+[.,][0-9]{2})"?/i);
      if (precoMatch) preco = parseFloat(precoMatch[1].replace(',', '.'));
    }
  }

  if (hostname.includes('amazon')) {
    if (!titulo) {
      const prodTitle = html.match(/<span[^>]*id="productTitle"[^>]*>([^<]+)<\/span>/i);
      if (prodTitle) titulo = prodTitle[1].trim();
    }
    if (!preco) {
      const precoWhole = html.match(/<span[^>]*class="[^"]*a-price-whole[^"]*"[^>]*>([^<]+)/i);
      if (precoWhole) preco = parseFloat(precoWhole[1].replace(/\D/g, ''));
    }
  }

  // Método 4: Fallbacks genéricos
  if (!titulo) {
    const titleTag = html.match(/<title>([^<|]+)/i);
    if (titleTag) titulo = titleTag[1].trim().split('|')[0].trim();
  }

  if (!preco) {
    const precoGenerico = html.match(/R\$\s*([0-9.,]+)/i);
    if (precoGenerico) {
      preco = parseFloat(precoGenerico[1].replace(/\./g, '').replace(',', '.'));
    }
  }

  return {
    titulo: titulo || `Produto de ${getSiteName(hostname)}`,
    preco,
    imagem_url,
    sku,
    avaliacao,
    total_avaliacoes,
    marca,
    descricao,
    url_origem: url,
  };
}

/**
 * Importa produto do Mercado Livre (API pública)
 */
async function importarMercadoLivre(url: string): Promise<ProdutoImportado> {
  try {
    const mlbMatch = url.match(/MLB-?(\d+)/i);

    if (mlbMatch) {
      const itemId = `MLB${mlbMatch[1]}`;
      const apiUrl = `https://api.mercadolibre.com/items/${itemId}`;

      const response = await fetch(apiUrl);

      if (response.ok) {
        const data = await response.json();

        // Buscar descriçÍo separadamente
        let descricao = '';
        try {
          const descResponse = await fetch(`${apiUrl}/description`);
          if (descResponse.ok) {
            const descData = await descResponse.json();
            descricao = descData.plain_text || '';
          }
        } catch (e) {
          console.debug("Erro ao buscar descriçÍo ML:", e);
        }

        return {
          titulo: data.title || 'Produto Mercado Livre',
          preco: data.price || 0,
          sku: data.id,
          imagem_url: data.pictures?.[0]?.url || data.thumbnail,
          avaliacao: data.reviews_average,
          total_avaliacoes: data.reviews_total,
          marca: data.attributes?.find((a: any) => a.id === 'BRAND')?.value_name,
          categoria: data.category_id,
          descricao: descricao.slice(0, 500),
          url_origem: url,
        };
      }
    }

    return {
      titulo: 'Produto Mercado Livre',
      preco: 0,
      url_origem: url,
    };

  } catch (error) {
    console.error('Erro ao importar do Mercado Livre:', error);
    return {
      titulo: 'Produto Mercado Livre',
      preco: 0,
      url_origem: url,
    };
  }
}

/**
 * Busca produto por texto usando IA via Edge Function (evita CORS)
 */
export async function buscarProdutoNaInternet(termoBusca: string): Promise<ProdutoImportado[]> {
  console.log('[ImportadorProdutos] Buscando produto via Edge Function:', termoBusca);

  // Obter token de autenticaçÍo
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      termoBusca,
      tipo: 'buscar'
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('[ImportadorProdutos] Erro Edge Function:', errorData);
    throw new Error(errorData.error || 'Falha na busca');
  }

  const data = await response.json();

  if (data.error) {
    console.error('[ImportadorProdutos] Erro:', data.error);
    return [];
  }

  const resultados = data.produtos || [];
  console.log('[ImportadorProdutos] Produtos encontrados:', resultados.length);

  return resultados;
}

/**
 * Retorna nome amigável do site
 */
function getSiteName(hostname: string): string {
  if (hostname.includes('leroymerlin')) return 'Leroy Merlin';
  if (hostname.includes('amazon')) return 'Amazon';
  if (hostname.includes('mercadolivre') || hostname.includes('mercadolibre')) return 'Mercado Livre';
  if (hostname.includes('magazineluiza') || hostname.includes('magalu')) return 'Magazine Luiza';
  if (hostname.includes('casasbahia')) return 'Casas Bahia';
  if (hostname.includes('pontofrio')) return 'Ponto Frio';
  if (hostname.includes('extra')) return 'Extra';
  if (hostname.includes('americanas')) return 'Americanas';
  if (hostname.includes('submarino')) return 'Submarino';
  if (hostname.includes('shoptime')) return 'Shoptime';
  return hostname.split('.')[0];
}

/**
 * Valida URL de produto
 */
export function validarUrlProduto(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const sitesValidos = [
      'leroymerlin.com.br',
      'amazon.com.br',
      'amazon.com',
      'mercadolivre.com.br',
      'mercadolibre.com',
      'magazineluiza.com.br',
      'magalu.com.br',
      'casasbahia.com.br',
      'pontofrio.com.br',
      'extra.com.br',
      'americanas.com.br',
      'submarino.com.br',
      'shoptime.com.br',
      'madeiramadeira.com.br',
      'cobasi.com.br',
      'decathlon.com.br',
      'centauro.com.br',
      'netshoes.com.br',
    ];

    return sitesValidos.some(site => urlObj.hostname.includes(site.split('.')[0]));
  } catch {
    return false;
  }
}

/**
 * Formata preço brasileiro
 */
export function formatarPreco(preco: number): string {
  return preco.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}



