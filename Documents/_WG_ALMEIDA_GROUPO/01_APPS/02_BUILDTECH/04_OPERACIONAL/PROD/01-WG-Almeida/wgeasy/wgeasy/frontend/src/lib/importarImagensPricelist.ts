// Tipo auxiliar para mapear o retorno do Supabase
type ProdutoSupabase = {
  id: string;
  nome: string;
  codigo?: string;
  fabricante?: string;
  link_produto?: string;
  pricelist_categorias?: { nome?: string }[] | { nome?: string };
};
// ============================================================
// IMPORTADOR DE IMAGENS PARA PRICELIST
// Sistema WG Easy - Busca automática de imagens para produtos
// ============================================================

import { supabase, supabaseUrl } from "./supabaseClient";

export interface ProdutoSemImagem {
  id: string;
  nome: string;
  codigo?: string;
  fabricante?: string;
  categoria_nome?: string;
  link_produto?: string;
}

export interface ResultadoBuscaImagem {
  id: string;
  nome: string;
  imagem_url: string | null;
  descricao?: string | null;
  link_produto?: string | null;
  fonte: string | null;
  sucesso: boolean;
  erro?: string;
}

// URL da Edge Function
const EDGE_FUNCTION_URL = `${supabaseUrl}/functions/v1/buscar-produto-ia`;

/**
 * Busca produtos da pricelist que não possuem imagem
 */
export async function buscarProdutosSemImagem(
  limite: number = 100,
  offset: number = 0,
  filtroCategoria?: string
): Promise<{ produtos: ProdutoSemImagem[]; total: number }> {
  let query = supabase
    .from("pricelist_itens")
    .select(`
      id,
      nome,
      codigo,
      fabricante,
      link_produto,
      pricelist_categorias!pricelist_itens_categoria_id_fkey(nome)
    `, { count: 'exact' })
    .or("imagem_url.is.null,imagem_url.eq.")
    .eq("ativo", true)
    .order("nome");

  if (filtroCategoria) {
    query = query.eq("categoria_id", filtroCategoria);
  }

  const { data, error, count } = await query.range(offset, offset + limite - 1);

  if (error) {
    console.error("Erro ao buscar produtos sem imagem:", error);
    throw new Error("Erro ao buscar produtos sem imagem");
  }

  const produtos = (data || []).map((item: ProdutoSupabase) => {
    let categoria_nome: string | undefined;
    if (Array.isArray(item.pricelist_categorias)) {
      categoria_nome = item.pricelist_categorias[0]?.nome;
    } else if (item.pricelist_categorias) {
      categoria_nome = item.pricelist_categorias.nome;
    }
    return {
      id: item.id,
      nome: item.nome,
      codigo: item.codigo,
      fabricante: item.fabricante,
      link_produto: item.link_produto,
      categoria_nome,
    };
  });

  return { produtos, total: count || 0 };
}

/**
 * Busca imagem para um produto específico
 * Prioridade: 1. Link do produto, 2. Busca na Leroy Merlin, 3. IA
 */
export async function buscarImagemProduto(
  produto: ProdutoSemImagem
): Promise<ResultadoBuscaImagem> {
  try {
    // Obter token de autenticaçÍo
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    // 1. Primeiro tentar extrair imagem do link do produto, se existir
    if (produto.link_produto) {
      console.log(`[BuscarImagem] Tentando extrair de URL: ${produto.link_produto}`);
      const imagemUrl = await extrairImagemDePaginaProduto(produto.link_produto);
      if (imagemUrl) {
        return {
          id: produto.id,
          nome: produto.nome,
          imagem_url: imagemUrl,
          fonte: "link_produto",
          sucesso: true,
        };
      }
    }

    // 2. Buscar na Leroy Merlin usando o nome do produto
    console.log(`[BuscarImagem] Buscando na Leroy Merlin: ${produto.nome}`);
    const resultadoLeroy = await buscarProdutoNaLeroyMerlin(produto.nome, produto.fabricante);
    if (resultadoLeroy?.imagem_url) {
      return {
        id: produto.id,
        nome: produto.nome,
        imagem_url: resultadoLeroy.imagem_url,
        descricao: resultadoLeroy.descricao,
        link_produto: resultadoLeroy.link_produto,
        fonte: "leroy_merlin",
        sucesso: true,
      };
    }

    // 3. Fallback: buscar imagem via IA (Edge Function)
    if (token) {
      console.log(`[BuscarImagem] Tentando via IA para: ${produto.nome}`);
      const termoBusca = JSON.stringify({
        nome: produto.nome,
        fabricante: produto.fabricante,
        url_referencia: produto.link_produto,
      });

      const response = await fetch(EDGE_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          termoBusca,
          tipo: "buscar_imagem",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.imagem_url) {
          return {
            id: produto.id,
            nome: produto.nome,
            imagem_url: data.imagem_url,
            fonte: data.fonte || "ia",
            sucesso: true,
          };
        }
      }
    }

    // Nenhuma imagem encontrada
    return {
      id: produto.id,
      nome: produto.nome,
      imagem_url: null,
      fonte: null,
      sucesso: false,
    };
  } catch (error) {
    console.error(`Erro ao buscar imagem para ${produto.nome}:`, error);
    return {
      id: produto.id,
      nome: produto.nome,
      imagem_url: null,
      fonte: null,
      sucesso: false,
      erro: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Resultado da busca na Leroy Merlin
 */
interface ResultadoLeroyMerlin {
  imagem_url: string | null;
  descricao: string | null;
  link_produto: string | null;
  nome_produto: string | null;
}

/**
 * Otimiza o termo de busca para melhor correspondência
 */
function otimizarTermoBusca(nomeProduto: string, fabricante?: string): string {
  let termo = nomeProduto;

  // Adicionar fabricante se não estiver no nome
  if (fabricante && !termo.toLowerCase().includes(fabricante.toLowerCase())) {
    termo = `${termo} ${fabricante}`;
  }

  // Remover caracteres especiais que podem atrapalhar a busca
  termo = termo
    .replace(/[()[\]{}]/g, ' ')  // Remover parênteses e colchetes
    .replace(/\s+/g, ' ')         // Normalizar espaços
    .trim();

  // Limitar tamanho do termo (termos muito longos podem não encontrar resultados)
  const palavras = termo.split(' ');
  if (palavras.length > 6) {
    // Priorizar: nome do produto + fabricante + características principais
    termo = palavras.slice(0, 6).join(' ');
  }

  return termo;
}

/**
 * Busca produto na Leroy Merlin pelo nome
 * Retorna imagem, descriçÍo e link do produto
 *
 * Estratégia de busca em múltiplas tentativas:
 * 1. Termo completo otimizado
 * 2. Apenas nome do produto (sem fabricante extra)
 * 3. Palavras-chave principais
 */
async function buscarProdutoNaLeroyMerlin(
  nomeProduto: string,
  fabricante?: string
): Promise<ResultadoLeroyMerlin | null> {
  // Gerar variações do termo de busca
  const termosPrioridade = [
    otimizarTermoBusca(nomeProduto, fabricante),
    nomeProduto.split(' ').slice(0, 4).join(' '), // Primeiras 4 palavras
  ];

  // Remover duplicatas mantendo ordem
  const termosUnicos = [...new Set(termosPrioridade)];

  for (const termoBusca of termosUnicos) {
    console.log(`[BuscarImagem] Tentando termo: "${termoBusca}"`);

    const resultado = await tentarBuscaLeroy(termoBusca);
    if (resultado?.imagem_url) {
      return resultado;
    }
  }

  return null;
}

/**
 * Executa uma tentativa de busca na Leroy Merlin
 */
async function tentarBuscaLeroy(termoBusca: string): Promise<ResultadoLeroyMerlin | null> {
  try {
    const termoEncoded = encodeURIComponent(termoBusca);
    const urlBusca = `https://www.leroymerlin.com.br/search?term=${termoEncoded}&searchTerm=${termoEncoded}&searchType=default`;
    console.log(`[BuscarImagem] URL de busca Leroy: ${urlBusca}`);

    // Tentar múltiplos proxies CORS (ordenados por confiabilidade)
    const proxies = [
      `https://corsproxy.io/?${encodeURIComponent(urlBusca)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(urlBusca)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(urlBusca)}`,
    ];

    for (const proxyUrl of proxies) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const response = await fetch(proxyUrl, {
          signal: controller.signal,
          headers: {
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) continue;

        const html = await response.text();

        // Verificar se a página tem conteúdo de produtos
        if (!html.includes('cdn.leroymerlin.com.br/products')) {
          console.log(`[BuscarImagem] Sem produtos na resposta, tentando próximo proxy...`);
          continue;
        }

        const resultado = extrairDadosDoResultadoLeroy(html);

        if (resultado.imagem_url) {
          console.log(`[BuscarImagem] Produto encontrado via proxy:`, resultado.nome_produto);
          return resultado;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
        console.log(`[BuscarImagem] Proxy falhou (${errorMsg}), tentando próximo...`);
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error("[BuscarImagem] Erro na busca Leroy Merlin:", error);
    return null;
  }
}

/**
 * Busca apenas imagem na Leroy Merlin (compatibilidade)
 */
export async function buscarImagemNaLeroyMerlin(
  nomeProduto: string,
  fabricante?: string
): Promise<string | null> {
  const resultado = await buscarProdutoNaLeroyMerlin(nomeProduto, fabricante);
  return resultado?.imagem_url || null;
}

/**
 * Gera URL de busca da Leroy Merlin para um termo
 * Útil para integraçÍo com ferramentas externas (browser automation)
 */
export function gerarUrlBuscaLeroy(nomeProduto: string, fabricante?: string): string {
  const termo = otimizarTermoBusca(nomeProduto, fabricante);
  const termoEncoded = encodeURIComponent(termo);
  return `https://www.leroymerlin.com.br/search?term=${termoEncoded}&searchTerm=${termoEncoded}&searchType=default`;
}

/**
 * Extrai dados completos do produto do HTML da Leroy Merlin
 * Inclui imagem, descriçÍo e link do produto
 */
function extrairDadosDoResultadoLeroy(html: string): ResultadoLeroyMerlin {
  const resultado: ResultadoLeroyMerlin = {
    imagem_url: null,
    descricao: null,
    link_produto: null,
    nome_produto: null,
  };

  // Extrair imagem
  resultado.imagem_url = extrairImagemDoResultadoLeroy(html);

  // Extrair link do primeiro produto (padrÍo: /nome-do-produto_123456789)
  const linkMatch = html.match(/href="(\/[^"]+_\d{8,})"/) ||
    html.match(/href="(https:\/\/www\.leroymerlin\.com\.br\/[^"]+_\d{8,})"/);
  if (linkMatch) {
    resultado.link_produto = linkMatch[1].startsWith('http')
      ? linkMatch[1]
      : `https://www.leroymerlin.com.br${linkMatch[1]}`;
  }

  // Tentar extrair descriçÍo do JSON-LD (Schema.org Product)
  const jsonLdMatch = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatch) {
    for (const match of jsonLdMatch) {
      try {
        const jsonContent = match.replace(/<[^>]*>/g, "");
        const data = JSON.parse(jsonContent);

        // Procurar por Product
        const product = data["@type"] === "Product" ? data :
          (Array.isArray(data["@graph"]) ? data["@graph"].find((item: Record<string, unknown>) => item["@type"] === "Product") : null);

        if (product) {
          if (product.description) {
            resultado.descricao = product.description;
          }
          if (product.name) {
            resultado.nome_produto = product.name;
          }
          if (!resultado.link_produto && product.url) {
            resultado.link_produto = product.url;
          }
        }
      } catch {
        continue;
      }
    }
  }

  // Tentar extrair descriçÍo do meta description
  if (!resultado.descricao) {
    const metaDesc = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i);
    if (metaDesc && metaDesc[1]) {
      resultado.descricao = metaDesc[1].trim();
    }
  }

  // Extrair nome do produto do título
  if (!resultado.nome_produto) {
    const titleMatch = html.match(/<title>([^<]*)/i);
    if (titleMatch && titleMatch[1]) {
      resultado.nome_produto = titleMatch[1]
        .replace(/\s*\|\s*Leroy Merlin.*$/i, '')
        .trim();
    }
  }

  return resultado;
}

/**
 * Converte URL de imagem para resoluçÍo 600x600 (alta qualidade)
 */
function converterParaAltaResolucao(url: string): string {
  // Substituir qualquer resoluçÍo por 600x600
  let urlAlta = url.replace(/_\d+x\d+/, "_600x600");

  // Garantir que tem extensÍo válida
  if (!urlAlta.match(/\.(jpg|jpeg|png|webp)$/i)) {
    // Tentar adicionar .jpg se não tiver extensÍo
    const hasExtension = urlAlta.match(/\.[a-z]{3,4}$/i);
    if (!hasExtension) {
      urlAlta = urlAlta + ".jpg";
    }
  }

  return urlAlta;
}

/**
 * Extrai URL da imagem do HTML de resultados da Leroy Merlin
 * IMPORTANTE: Filtra apenas imagens de produtos (pasta /products/)
 *
 * Ordem de prioridade:
 * 1. Imagens do CDN com /products/ (mais confiável)
 * 2. og:image meta tag
 * 3. JSON-LD Schema.org
 * 4. Tags img com src do CDN
 */
function extrairImagemDoResultadoLeroy(html: string): string | null {
  // Padrões para IGNORAR (não sÍo imagens de produtos)
  const ignorarPatterns = [
    /\/assets\//i,
    /\/footer\//i,
    /\/icons?\//i,
    /\/logos?\//i,
    /\/banners?\//i,
    /\/header\//i,
    /sustentabilidade/i,
    /selo[_-]/i,
    /badge/i,
    /sprite/i,
    /placeholder/i,
    /loading/i,
    /lazy/i,
    /thumbnail/i,
  ];

  const isImagemValida = (url: string): boolean => {
    // Deve conter /products/ no caminho
    if (!url.includes("/products/")) return false;
    // não deve conter padrões de não-produto
    for (const pattern of ignorarPatterns) {
      if (pattern.test(url)) return false;
    }
    // Deve ter pelo menos 8 caracteres após /products/
    const afterProducts = url.split("/products/")[1];
    if (!afterProducts || afterProducts.length < 8) return false;

    return true;
  };

  // Método 1: Buscar imagens APENAS da pasta /products/ do CDN
  const productPattern = /https:\/\/cdn\.leroymerlin\.com\.br\/products\/[^"'\s<>]+\.(?:jpg|jpeg|png|webp|JPG|JPEG|PNG|WEBP)/gi;
  const matches = html.match(productPattern);

  if (matches && matches.length > 0) {
    // Filtrar apenas imagens válidas de produtos
    const imagensValidas = matches.filter(isImagemValida);

    if (imagensValidas.length > 0) {
      // Criar um mapa de imagens únicas (mesmo produto pode ter múltiplas resoluções)
      const imagensUnicas = new Map<string, string>();

      for (const url of imagensValidas) {
        // Extrair o identificador base da imagem (sem resoluçÍo)
        const baseUrl = url.replace(/_\d+x\d+/, '');
        if (!imagensUnicas.has(baseUrl)) {
          imagensUnicas.set(baseUrl, url);
        }
      }

      // Pegar a primeira imagem única e converter para alta resoluçÍo
      const primeiraImagem = Array.from(imagensUnicas.values())[0];
      return converterParaAltaResolucao(primeiraImagem);
    }
  }

  // Método 2: Buscar via og:image (geralmente tem imagem do produto)
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                       html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  if (ogImageMatch && ogImageMatch[1] && ogImageMatch[1].includes("/products/")) {
    return converterParaAltaResolucao(ogImageMatch[1]);
  }

  // Método 3: Buscar via JSON-LD (Schema.org Product)
  const jsonLdMatch = html.match(/<script type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatch) {
    for (const match of jsonLdMatch) {
      try {
        const jsonContent = match.replace(/<[^>]*>/g, "");
        const data = JSON.parse(jsonContent);

        // Procurar por Product em diferentes estruturas
        let product = null;
        if (data["@type"] === "Product") {
          product = data;
        } else if (Array.isArray(data["@graph"])) {
          product = data["@graph"].find((item: Record<string, unknown>) => item["@type"] === "Product");
        } else if (data.itemListElement && Array.isArray(data.itemListElement)) {
          // ItemList com produtos
          const firstItem = data.itemListElement[0];
          if (firstItem?.item?.image) {
            const imgUrl = typeof firstItem.item.image === "string"
              ? firstItem.item.image
              : firstItem.item.image?.url || firstItem.item.image?.[0];
            if (imgUrl && imgUrl.includes("/products/")) {
              return converterParaAltaResolucao(imgUrl);
            }
          }
        }

        if (product?.image) {
          const img = Array.isArray(product.image) ? product.image[0] : product.image;
          const imgUrl = typeof img === "string" ? img : img?.url;
          if (imgUrl && imgUrl.includes("/products/")) {
            return converterParaAltaResolucao(imgUrl);
          }
        }
      } catch {
        continue;
      }
    }
  }

  // Método 4: Buscar imagem de produto em tags img
  const imgMatches = html.match(/<img[^>]*src=["'](https:\/\/cdn\.leroymerlin\.com\.br\/products\/[^"']+)["']/gi);
  if (imgMatches) {
    for (const imgTag of imgMatches) {
      const srcMatch = imgTag.match(/src=["']([^"']+)["']/);
      if (srcMatch && srcMatch[1] && isImagemValida(srcMatch[1])) {
        return converterParaAltaResolucao(srcMatch[1]);
      }
    }
  }

  // Método 5: Buscar em data-src (lazy loading)
  const dataSrcMatches = html.match(/data-src=["'](https:\/\/cdn\.leroymerlin\.com\.br\/products\/[^"']+)["']/gi);
  if (dataSrcMatches) {
    for (const dataSrc of dataSrcMatches) {
      const srcMatch = dataSrc.match(/data-src=["']([^"']+)["']/);
      if (srcMatch && srcMatch[1] && isImagemValida(srcMatch[1])) {
        return converterParaAltaResolucao(srcMatch[1]);
      }
    }
  }

  return null;
}

/**
 * Extrai imagem diretamente de uma página de produto
 */
async function extrairImagemDePaginaProduto(url: string): Promise<string | null> {
  try {
    const proxies = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      `https://corsproxy.io/?${encodeURIComponent(url)}`,
    ];

    for (const proxyUrl of proxies) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(proxyUrl, {
          signal: controller.signal,
          headers: {
            Accept: "text/html,application/xhtml+xml",
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) continue;

        const html = await response.text();

        // Buscar via JSON-LD (mais confiável)
        const jsonLdRegex = /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
        let jsonLdMatch;
        while ((jsonLdMatch = jsonLdRegex.exec(html)) !== null) {
          try {
            const jsonData = JSON.parse(jsonLdMatch[1]);
            const product = Array.isArray(jsonData)
              ? jsonData.find((item) => item["@type"] === "Product")
              : jsonData["@type"] === "Product"
              ? jsonData
              : null;

            if (product?.image) {
              const img = Array.isArray(product.image) ? product.image[0] : product.image;
              if (typeof img === "string") return img;
            }
          } catch {
            continue;
          }
        }

        // Buscar via og:image
        const ogImage = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"/i);
        if (ogImage && ogImage[1]) {
          return ogImage[1];
        }

        // Buscar imagem CDN Leroy
        if (url.includes("leroymerlin")) {
          const imagemLeroy = extrairImagemDoResultadoLeroy(html);
          if (imagemLeroy) return imagemLeroy;
        }

        return null;
      } catch {
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error("[BuscarImagem] Erro ao extrair imagem da página:", error);
    return null;
  }
}


/**
 * Atualiza a imagem e descriçÍo de um produto no banco de dados
 */
export async function atualizarImagemProduto(
  produtoId: string,
  imagemUrl: string,
  descricao?: string | null,
  linkProduto?: string | null
): Promise<boolean> {
  const updateData: Record<string, unknown> = {
    imagem_url: imagemUrl,
    updated_at: new Date().toISOString(),
  };

  // Adicionar descriçÍo se fornecida e o produto não tiver uma
  if (descricao) {
    updateData.descricao = descricao;
  }

  // Adicionar link do produto se fornecido e o produto não tiver um
  if (linkProduto) {
    updateData.link_produto = linkProduto;
  }

  const { error } = await supabase
    .from("pricelist_itens")
    .update(updateData)
    .eq("id", produtoId);

  if (error) {
    console.error("Erro ao atualizar imagem:", error);
    return false;
  }

  return true;
}

/**
 * Busca imagens para múltiplos produtos em lote
 * Retorna um AsyncGenerator para processar progressivamente
 */
export async function* buscarImagensEmLote(
  produtos: ProdutoSemImagem[],
  delayMs: number = 1000
): AsyncGenerator<ResultadoBuscaImagem & { progresso: number }> {
  for (let i = 0; i < produtos.length; i++) {
    const produto = produtos[i];
    const resultado = await buscarImagemProduto(produto);

    // Se encontrou imagem, atualiza no banco (incluindo descriçÍo e link se disponíveis)
    if (resultado.sucesso && resultado.imagem_url) {
      await atualizarImagemProduto(
        produto.id,
        resultado.imagem_url,
        resultado.descricao,
        resultado.link_produto
      );
    }

    yield {
      ...resultado,
      progresso: Math.round(((i + 1) / produtos.length) * 100),
    };

    // Delay entre requisições para não sobrecarregar
    if (i < produtos.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

/**
 * Busca imagem na internet via Google Images (usando IA)
 */
export async function buscarImagemNaInternet(
  termoBusca: string
): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      throw new Error("Usuário não autenticado");
    }

    // Usar buscar_imagem com termo simples
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        termoBusca: JSON.stringify({ nome: termoBusca }),
        tipo: "buscar_imagem",
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.imagem_url || null;
  } catch {
    return null;
  }
}

/**
 * Valida se uma URL de imagem é válida e acessível
 */
export async function validarUrlImagem(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    const contentType = response.headers.get("content-type") || "";
    return response.ok && contentType.startsWith("image/");
  } catch {
    return false;
  }
}

/**
 * Busca imagem do produto na Leroy Merlin
 */
export async function buscarImagemLeroy(
  nomeProduto: string
): Promise<string | null> {
  try {
    // Construir URL de busca na Leroy Merlin (formato correto /search?term=)
    const termoBusca = encodeURIComponent(nomeProduto);
    const url = `https://www.leroymerlin.com.br/search?term=${termoBusca}&searchTerm=${termoBusca}&searchType=default`;

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) return null;

    // Usar Edge Function para extrair imagem da página de busca
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        termoBusca: url,
        tipo: "extrair_imagem_url",
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.imagem_url || null;
  } catch {
    return null;
  }
}


