/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// CATÁLOGO DE PRODUTOS - WG EASY
// Sistema de catálogo com captura automática de preços
// Inspirado na funcionalidade de extensÍo Chrome da VOBI
// ============================================================

import { supabase } from '@/lib/supabaseClient';

// ============================================================
// TIPOS E INTERFACES
// ============================================================

/**
 * Produto do catálogo
 */
export interface ProdutoCatalogo {
  id: string;
  codigo_interno?: string;
  codigo_fabricante?: string;
  codigo_barras?: string;
  nome: string;
  descricao?: string;
  categoria_id?: string;
  subcategoria_id?: string;
  marca?: string;
  modelo?: string;
  unidade: string;
  preco_referencia?: number;
  preco_minimo?: number;
  preco_maximo?: number;
  fornecedor_preferencial_id?: string;
  imagem_url?: string;
  especificacoes?: Record<string, unknown>;
  tags?: string[];
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * CotaçÍo de produto
 */
export interface CotacaoProduto {
  id: string;
  produto_id: string;
  fornecedor_id?: string;
  fornecedor_nome?: string;
  url_origem?: string;
  preco: number;
  preco_promocional?: number;
  disponibilidade: 'em_estoque' | 'sob_encomenda' | 'indisponivel';
  prazo_entrega_dias?: number;
  quantidade_minima?: number;
  frete_incluso?: boolean;
  observacoes?: string;
  data_captura: string;
  metodo_captura: 'manual' | 'extensao' | 'api' | 'scraping';
  confiabilidade: number; // 0-100
}

/**
 * Dados capturados de uma página web
 */
export interface DadosCapturadosWeb {
  url: string;
  titulo?: string;
  nome_produto?: string;
  preco?: number;
  preco_original?: number;
  desconto?: number;
  imagem_url?: string;
  marca?: string;
  modelo?: string;
  codigo?: string;
  disponibilidade?: string;
  frete?: number;
  vendedor?: string;
  categoria?: string;
  especificacoes?: Record<string, string>;
  data_captura: string;
}

/**
 * ConfiguraçÍo de scraping para um site
 */
export interface ConfiguracaoScraping {
  dominio: string;
  nome_site: string;
  seletores: {
    nome_produto?: string;
    preco?: string;
    preco_original?: string;
    imagem?: string;
    codigo?: string;
    disponibilidade?: string;
    marca?: string;
    categoria?: string;
    descricao?: string;
  };
  transformacoes?: {
    preco?: (valor: string) => number;
    disponibilidade?: (texto: string) => string;
  };
  ativo: boolean;
}

/**
 * Resultado de busca no catálogo
 */
export interface ResultadoBuscaCatalogo {
  produtos: ProdutoCatalogo[];
  total: number;
  pagina: number;
  porPagina: number;
  temMais: boolean;
  filtrosAplicados: Record<string, unknown>;
}

/**
 * Filtros de busca
 */
export interface FiltrosBuscaCatalogo {
  termo?: string;
  categoria_id?: string;
  subcategoria_id?: string;
  marca?: string;
  preco_min?: number;
  preco_max?: number;
  apenas_com_preco?: boolean;
  apenas_ativos?: boolean;
  tags?: string[];
  ordenar_por?: 'nome' | 'preco' | 'atualizado' | 'relevancia';
  ordem?: 'asc' | 'desc';
  pagina?: number;
  por_pagina?: number;
}

// ============================================================
// CLASSE PRINCIPAL DO CATÁLOGO
// ============================================================

export class CatalogoProdutosService {
  private readonly configuracoesScrapingCache: Map<string, ConfiguracaoScraping> = new Map();

  /**
   * Buscar produtos no catálogo
   */
  async buscarProdutos(filtros: FiltrosBuscaCatalogo): Promise<ResultadoBuscaCatalogo> {
    try {
      const pagina = filtros.pagina || 1;
      const porPagina = filtros.por_pagina || 20;
      const offset = (pagina - 1) * porPagina;

      let query = supabase
        .from('pricelist')
        .select('*', { count: 'exact' });

      // Aplicar filtros
      if (filtros.termo) {
        query = query.or(`nome.ilike.%${filtros.termo}%,descricao.ilike.%${filtros.termo}%,codigo.ilike.%${filtros.termo}%`);
      }

      if (filtros.categoria_id) {
        query = query.eq('categoria_id', filtros.categoria_id);
      }

      if (filtros.subcategoria_id) {
        query = query.eq('subcategoria_id', filtros.subcategoria_id);
      }

      if (filtros.marca) {
        query = query.ilike('marca', `%${filtros.marca}%`);
      }

      if (filtros.preco_min !== undefined) {
        query = query.gte('preco', filtros.preco_min);
      }

      if (filtros.preco_max !== undefined) {
        query = query.lte('preco', filtros.preco_max);
      }

      if (filtros.apenas_com_preco) {
        query = query.not('preco', 'is', null);
      }

      if (filtros.apenas_ativos !== false) {
        query = query.eq('ativo', true);
      }

      // OrdenaçÍo
      const ordenarPor = filtros.ordenar_por || 'nome';
      const ordem = filtros.ordem || 'asc';

      switch (ordenarPor) {
        case 'nome':
          query = query.order('nome', { ascending: ordem === 'asc' });
          break;
        case 'preco':
          query = query.order('preco', { ascending: ordem === 'asc', nullsFirst: false });
          break;
        case 'atualizado':
          query = query.order('updated_at', { ascending: ordem === 'asc' });
          break;
        default:
          query = query.order('nome', { ascending: true });
      }

      // PaginaçÍo
      query = query.range(offset, offset + porPagina - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      const produtos: ProdutoCatalogo[] = (data || []).map(item => ({
        id: item.id,
        codigo_interno: item.codigo,
        nome: item.nome,
        descricao: item.descricao,
        categoria_id: item.categoria_id,
        subcategoria_id: item.subcategoria_id,
        marca: item.marca,
        unidade: item.unidade || 'UN',
        preco_referencia: item.preco,
        imagem_url: item.imagem_url,
        ativo: item.ativo ?? true,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      return {
        produtos,
        total: count || 0,
        pagina,
        porPagina,
        temMais: (count || 0) > offset + porPagina,
        filtrosAplicados: filtros as Record<string, unknown>,
      };
    } catch (error) {
      console.error('[CatalogoProdutos] Erro ao buscar produtos:', error);
      throw error;
    }
  }

  /**
   * Processar dados capturados de uma página web
   * Usado pela extensÍo Chrome para importar produtos
   */
  async processarDadosCapturados(dados: DadosCapturadosWeb): Promise<{
    sucesso: boolean;
    produto_id?: string;
    cotacao_id?: string;
    mensagem: string;
  }> {
    try {
      // Tentar encontrar produto existente pelo código ou nome similar
      let produtoExistente: ProdutoCatalogo | null = null;

      if (dados.codigo) {
        const { data } = await supabase
          .from('pricelist')
          .select('*')
          .or(`codigo.eq.${dados.codigo},codigo_fabricante.eq.${dados.codigo}`)
          .limit(1)
          .single();

        if (data) {
          produtoExistente = data as unknown as ProdutoCatalogo;
        }
      }

      if (!produtoExistente && dados.nome_produto) {
        // Busca por similaridade de nome (simplificada)
        const termosBusca = dados.nome_produto.split(' ').slice(0, 3).join(' ');
        const { data } = await supabase
          .from('pricelist')
          .select('*')
          .ilike('nome', `%${termosBusca}%`)
          .limit(1)
          .single();

        if (data) {
          produtoExistente = data as unknown as ProdutoCatalogo;
        }
      }

      let produtoId: string;

      if (produtoExistente) {
        // Atualizar produto existente se o preço for melhor
        produtoId = produtoExistente.id;

        if (dados.preco && (!produtoExistente.preco_referencia || dados.preco < produtoExistente.preco_referencia)) {
          await supabase
            .from('pricelist')
            .update({
              preco: dados.preco,
              preco_minimo: Math.min(dados.preco, produtoExistente.preco_minimo || dados.preco),
              updated_at: new Date().toISOString(),
            })
            .eq('id', produtoId);
        }
      } else {
        // Criar novo produto
        const novoProduto = {
          codigo: dados.codigo || null,
          nome: dados.nome_produto || dados.titulo || 'Produto sem nome',
          descricao: null,
          marca: dados.marca || null,
          preco: dados.preco || null,
          imagem_url: dados.imagem_url || null,
          unidade: 'UN',
          ativo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('pricelist')
          .insert(novoProduto)
          .select()
          .single();

        if (error) throw error;
        produtoId = data.id;
      }

      // Registrar cotaçÍo
      const novaCotacao = {
        produto_id: produtoId,
        fornecedor_nome: dados.vendedor || this.extrairDominio(dados.url),
        url_origem: dados.url,
        preco: dados.preco || 0,
        preco_promocional: dados.preco_original && dados.preco ? dados.preco : null,
        disponibilidade: 'em_estoque',
        data_captura: dados.data_captura || new Date().toISOString(),
        metodo_captura: 'extensao',
        confiabilidade: 80,
      };

      // TODO: Criar tabela cotacoes_produtos se não existir
      // Por enquanto, apenas log
      console.log('[CatalogoProdutos] CotaçÍo registrada:', novaCotacao);

      return {
        sucesso: true,
        produto_id: produtoId,
        mensagem: produtoExistente
          ? 'Produto atualizado com nova cotaçÍo'
          : 'Novo produto adicionado ao catálogo',
      };
    } catch (error) {
      console.error('[CatalogoProdutos] Erro ao processar dados capturados:', error);
      return {
        sucesso: false,
        mensagem: `Erro ao processar: ${error}`,
      };
    }
  }

  /**
   * Configurações de scraping para sites populares
   */
  getConfiguracoesScrapingPadrao(): ConfiguracaoScraping[] {
    return [
      {
        dominio: 'leroymerlin.com.br',
        nome_site: 'Leroy Merlin',
        seletores: {
          nome_produto: 'h1.product-title',
          preco: '[data-testid="price"]',
          preco_original: '[data-testid="original-price"]',
          imagem: 'img.product-image',
          codigo: '[data-testid="product-code"]',
          disponibilidade: '[data-testid="availability"]',
        },
        ativo: true,
      },
      {
        dominio: 'telhanorte.com.br',
        nome_site: 'Telha Norte',
        seletores: {
          nome_produto: '.product-name h1',
          preco: '.price-box .price',
          imagem: '#image-main',
          codigo: '.product-sku span',
        },
        ativo: true,
      },
      {
        dominio: 'casasbahia.com.br',
        nome_site: 'Casas Bahia',
        seletores: {
          nome_produto: 'h1[data-testid="heading-product-title"]',
          preco: '[data-testid="price-value"]',
          preco_original: '[data-testid="price-original"]',
          imagem: 'img[data-testid="image-selected-thumbnail"]',
        },
        ativo: true,
      },
      {
        dominio: 'magazineluiza.com.br',
        nome_site: 'Magazine Luiza',
        seletores: {
          nome_produto: 'h1[data-testid="heading-product-title"]',
          preco: 'p[data-testid="price-value"]',
          imagem: 'img[data-testid="image-selected-thumbnail"]',
        },
        ativo: true,
      },
      {
        dominio: 'mercadolivre.com.br',
        nome_site: 'Mercado Livre',
        seletores: {
          nome_produto: 'h1.ui-pdp-title',
          preco: 'span.andes-money-amount__fraction',
          imagem: 'img.ui-pdp-image',
        },
        ativo: true,
      },
      {
        dominio: 'obramax.com.br',
        nome_site: 'Obramax',
        seletores: {
          nome_produto: '.product-name h1',
          preco: '.price',
          imagem: '.product-image img',
          codigo: '.product-reference',
        },
        ativo: true,
      },
    ];
  }

  /**
   * Extrair domínio de uma URL
   */
  private extrairDominio(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  }

  /**
   * Gerar relatório de preços do catálogo
   */
  async gerarRelatorioPrecos(categoria_id?: string): Promise<{
    totalProdutos: number;
    produtosComPreco: number;
    produtosSemPreco: number;
    precoMedio: number;
    ultimaAtualizacao: string | null;
    topMarcas: { marca: string; quantidade: number }[];
  }> {
    try {
      let query = supabase
        .from('pricelist')
        .select('id, preco, marca, updated_at')
        .eq('ativo', true);

      if (categoria_id) {
        query = query.eq('categoria_id', categoria_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const produtos = data || [];
      const produtosComPreco = produtos.filter(p => p.preco && p.preco > 0);
      const precoTotal = produtosComPreco.reduce((sum, p) => sum + (p.preco || 0), 0);

      // Contar marcas
      const marcasCount: Record<string, number> = {};
      produtos.forEach(p => {
        if (p.marca) {
          marcasCount[p.marca] = (marcasCount[p.marca] || 0) + 1;
        }
      });

      const topMarcas = Object.entries(marcasCount)
        .map(([marca, quantidade]) => ({ marca, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 10);

      // Última atualizaçÍo
      const datas = produtos
        .map(p => p.updated_at)
        .filter(Boolean)
        .sort()
        .reverse();

      return {
        totalProdutos: produtos.length,
        produtosComPreco: produtosComPreco.length,
        produtosSemPreco: produtos.length - produtosComPreco.length,
        precoMedio: produtosComPreco.length > 0 ? precoTotal / produtosComPreco.length : 0,
        ultimaAtualizacao: datas[0] || null,
        topMarcas,
      };
    } catch (error) {
      console.error('[CatalogoProdutos] Erro ao gerar relatório:', error);
      throw error;
    }
  }

  /**
   * Comparar preços entre fornecedores
   */
  async compararPrecosFornecedores(produto_id: string): Promise<{
    produto: ProdutoCatalogo | null;
    cotacoes: CotacaoProduto[];
    melhorPreco: CotacaoProduto | null;
    economiaMaxima: number;
  }> {
    // TODO: Implementar quando tabela de cotações existir
    console.warn('[CatalogoProdutos] ComparaçÍo de fornecedores não implementada');

    return {
      produto: null,
      cotacoes: [],
      melhorPreco: null,
      economiaMaxima: 0,
    };
  }
}

// ============================================================
// INSTÂNCIA GLOBAL
// ============================================================

export const catalogoProdutosService = new CatalogoProdutosService();

// ============================================================
// SCRIPT PARA EXTENSÍO CHROME (para referência)
// ============================================================

/**
 * Código de exemplo para extensÍo Chrome de captura de preços
 * Este código seria executado na extensÍo, não no frontend
 */
export const EXTENSAO_CHROME_CODIGO_EXEMPLO = `
// content-script.js - Executado nas páginas de e-commerce

(function() {
  // Verificar se estamos em uma página de produto
  const configuracoes = {
    'leroymerlin.com.br': {
      nome: 'h1.product-title',
      preco: '[data-testid="price"]',
      imagem: 'img.product-image',
      codigo: '[data-testid="product-code"]',
    },
    // ... outras configurações
  };

  const dominio = window.location.hostname.replace('www.', '');
  const config = configuracoes[dominio];

  if (!config) {
    console.log('[WGEasy] Site não configurado para captura');
    return;
  }

  // FunçÍo para capturar dados
  function capturarDados() {
    const dados = {
      url: window.location.href,
      data_captura: new Date().toISOString(),
    };

    // Capturar cada campo
    for (const [campo, seletor] of Object.entries(config)) {
      const elemento = document.querySelector(seletor);
      if (elemento) {
        if (campo === 'preco') {
          // Limpar e converter preço
          const texto = elemento.textContent || '';
          const numero = texto.replace(/[^0-9,]/g, '').replace(',', '.');
          dados[campo] = parseFloat(numero) || null;
        } else if (campo === 'imagem') {
          dados.imagem_url = elemento.src;
        } else {
          dados[campo] = elemento.textContent?.trim();
        }
      }
    }

    return dados;
  }

  // Adicionar botÍo de captura
  const botao = document.createElement('button');
  botao.textContent = '📥 Adicionar ao WGEasy';
  botao.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:99999;padding:12px 24px;background:#2E2E2E;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:bold;box-shadow:0 4px 12px rgba(0,0,0,0.3);';

  botao.onclick = async () => {
    const dados = capturarDados();

    // Enviar para API do WGEasy
    try {
      const response = await fetch('https://seu-dominio.com/api/catalogo/captura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });

      if (response.ok) {
        botao.textContent = '✅ Adicionado!';
        setTimeout(() => botao.textContent = '📥 Adicionar ao WGEasy', 2000);
      }
    } catch (error) {
      console.error('[WGEasy] Erro ao enviar:', error);
      botao.textContent = '❌ Erro';
    }
  };

  document.body.appendChild(botao);
})();
`;



