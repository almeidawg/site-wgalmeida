/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// SERVIÇO DE SINCRONIZAÇÍO PRICELIST x SINAPI
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { supabase } from "@/lib/supabaseClient";
import type { PricelistItemCompleto } from "@/types/pricelist";
import type { ItemSINAPI, EstadoBrasil } from "./sinapiIntegracaoService";

// ============================================================
// TIPOS E INTERFACES
// ============================================================

export interface MatchSINAPI {
  itemPricelist: PricelistItemCompleto;
  itemSINAPI: ItemSINAPI | null;
  tipoMatch: "exato" | "aproximado" | "sugerido" | "nenhum";
  confianca: number; // 0-1
  diferencaPreco: number | null;
  percentualDiferenca: number | null;
  recomendacao: "atualizar" | "revisar" | "manter" | "adicionar_codigo";
}

export interface ResultadoSincronizacao {
  totalAnalisado: number;
  comMatchExato: number;
  comMatchAproximado: number;
  semMatch: number;
  precosDesatualizados: number;
  sugestoesAtualizacao: MatchSINAPI[];
  itensSemCodigoSINAPI: PricelistItemCompleto[];
  tempoProcessamentoMs: number;
}

export interface ConfiguracaoSync {
  estado: EstadoBrasil;
  limiarDiferencaPreco: number; // Percentual mínimo de diferença para sugerir atualizaçÍo (ex: 0.05 = 5%)
  apenasCategoria?: string;
  apenasNucleo?: string;
  incluirSemCodigo?: boolean; // Tentar encontrar match mesmo para itens sem código SINAPI
}

// ============================================================
// MAPEAMENTO DE CATEGORIAS PRICELIST -> SINAPI
// ============================================================

const MAPEAMENTO_CATEGORIAS_SINAPI: Record<string, string[]> = {
  // Elétrica
  eletrica: ["91853", "91854", "91856", "91857", "91859", "91860", "91928"],
  // Hidráulica
  hidraulica: ["89357", "89358", "89360", "89400", "89401", "89402"],
  // Pintura
  pintura: ["88485", "88486", "88489", "88490", "88494", "88496"],
  // Revestimento
  revestimento: ["87879", "87878", "87877", "87876", "87529", "87528", "87891"],
  // Piso
  piso: ["87622", "87623", "87624", "87261", "87263", "87266", "87268"],
  // DemoliçÍo
  demolicao: ["97622", "97623", "97631", "97632", "97641", "97644", "97645"],
  // Forro
  forro: ["96117", "96118", "96123", "96125", "96127"],
  // Louças e Metais
  loucas_metais: ["86911", "86912", "86920", "86921", "86930", "86940"],
};

// ============================================================
// CLASSE PRINCIPAL DE SINCRONIZAÇÍO
// ============================================================

export class PricelistSinapiSyncService {
  /**
   * Analisa o Pricelist e compara com dados SINAPI
   */
  async analisarSincronizacao(
    config: ConfiguracaoSync
  ): Promise<ResultadoSincronizacao> {
    const inicio = Date.now();

    // Buscar itens do Pricelist
    let queryPricelist = supabase
      .from("pricelist_itens")
      .select(`
        *,
        categoria:pricelist_categorias!categoria_id (id, nome, codigo, tipo_servico),
        nucleo:nucleos!nucleo_id (id, nome)
      `)
      .eq("ativo", true);

    if (config.apenasCategoria) {
      queryPricelist = queryPricelist.eq("categoria_id", config.apenasCategoria);
    }
    if (config.apenasNucleo) {
      queryPricelist = queryPricelist.eq("nucleo_id", config.apenasNucleo);
    }

    const { data: itensPricelist, error: erroPricelist } = await queryPricelist;
    if (erroPricelist) throw erroPricelist;

    // Buscar itens SINAPI do estado selecionado
    const { data: itensSINAPI, error: erroSINAPI } = await supabase
      .from("sinapi_insumos")
      .select("*")
      .eq("estado", config.estado)
      .order("codigo", { ascending: true });

    // Se tabela SINAPI não existe, retornar resultado vazio
    if (erroSINAPI?.code === "42P01") {
      console.warn("[SINAPI Sync] Tabela sinapi_insumos não existe. Execute a migraçÍo primeiro.");
      return {
        totalAnalisado: itensPricelist?.length || 0,
        comMatchExato: 0,
        comMatchAproximado: 0,
        semMatch: itensPricelist?.length || 0,
        precosDesatualizados: 0,
        sugestoesAtualizacao: [],
        itensSemCodigoSINAPI: (itensPricelist || []) as PricelistItemCompleto[],
        tempoProcessamentoMs: Date.now() - inicio,
      };
    }

    if (erroSINAPI) throw erroSINAPI;

    // Criar índice de itens SINAPI por código
    const sinapiPorCodigo = new Map<string, ItemSINAPI>();
    for (const item of (itensSINAPI || []) as ItemSINAPI[]) {
      sinapiPorCodigo.set(item.codigo, item);
    }

    // Analisar cada item do Pricelist
    const sugestoesAtualizacao: MatchSINAPI[] = [];
    const itensSemCodigoSINAPI: PricelistItemCompleto[] = [];
    let comMatchExato = 0;
    let comMatchAproximado = 0;
    let semMatch = 0;
    let precosDesatualizados = 0;

    for (const item of (itensPricelist || []) as PricelistItemCompleto[]) {
      const match = this.encontrarMatchSINAPI(
        item,
        sinapiPorCodigo,
        itensSINAPI as ItemSINAPI[],
        config
      );

      if (match.tipoMatch === "exato") {
        comMatchExato++;
      } else if (match.tipoMatch === "aproximado" || match.tipoMatch === "sugerido") {
        comMatchAproximado++;
      } else {
        semMatch++;
        if (config.incluirSemCodigo) {
          itensSemCodigoSINAPI.push(item);
        }
      }

      // Verificar se preço está desatualizado
      if (
        match.percentualDiferenca !== null &&
        Math.abs(match.percentualDiferenca) >= config.limiarDiferencaPreco
      ) {
        precosDesatualizados++;
        sugestoesAtualizacao.push(match);
      } else if (match.recomendacao === "adicionar_codigo") {
        sugestoesAtualizacao.push(match);
      }
    }

    // Ordenar sugestões por diferença de preço (maior primeiro)
    sugestoesAtualizacao.sort((a, b) => {
      const diffA = Math.abs(a.percentualDiferenca || 0);
      const diffB = Math.abs(b.percentualDiferenca || 0);
      return diffB - diffA;
    });

    return {
      totalAnalisado: itensPricelist?.length || 0,
      comMatchExato,
      comMatchAproximado,
      semMatch,
      precosDesatualizados,
      sugestoesAtualizacao,
      itensSemCodigoSINAPI,
      tempoProcessamentoMs: Date.now() - inicio,
    };
  }

  /**
   * Encontra match SINAPI para um item do Pricelist
   */
  private encontrarMatchSINAPI(
    item: PricelistItemCompleto,
    sinapiPorCodigo: Map<string, ItemSINAPI>,
    todosSINAPI: ItemSINAPI[],
    config: ConfiguracaoSync
  ): MatchSINAPI {
    // 1. Tentar match exato por código SINAPI no item
    const codigoSINAPI = this.extrairCodigoSINAPI(item);
    if (codigoSINAPI && sinapiPorCodigo.has(codigoSINAPI)) {
      const itemSINAPI = sinapiPorCodigo.get(codigoSINAPI)!;
      return this.criarMatch(item, itemSINAPI, "exato", 1.0, config);
    }

    // 2. Tentar match por nome similar
    const matchPorNome = this.buscarPorNomeSimilar(item, todosSINAPI);
    if (matchPorNome) {
      return this.criarMatch(
        item,
        matchPorNome.item,
        "aproximado",
        matchPorNome.confianca,
        config
      );
    }

    // 3. Tentar match por categoria mapeada
    const matchPorCategoria = this.buscarPorCategoria(item, sinapiPorCodigo);
    if (matchPorCategoria) {
      return this.criarMatch(
        item,
        matchPorCategoria,
        "sugerido",
        0.6,
        config
      );
    }

    // Nenhum match encontrado
    return {
      itemPricelist: item,
      itemSINAPI: null,
      tipoMatch: "nenhum",
      confianca: 0,
      diferencaPreco: null,
      percentualDiferenca: null,
      recomendacao: config.incluirSemCodigo ? "adicionar_codigo" : "manter",
    };
  }

  /**
   * Extrai código SINAPI de um item (pode estar no código ou descriçÍo)
   */
  private extrairCodigoSINAPI(item: PricelistItemCompleto): string | null {
    // Verificar se código começa com padrÍo SINAPI (5-6 dígitos)
    if (item.codigo && /^\d{4,6}$/.test(item.codigo)) {
      return item.codigo;
    }

    // Procurar padrÍo "SINAPI XXXXX" no nome ou descriçÍo
    const textoCompleto = `${item.nome} ${item.descricao || ""}`;
    const matchSINAPI = textoCompleto.match(/SINAPI\s*[:\s]?\s*(\d{4,6})/i);
    if (matchSINAPI) {
      return matchSINAPI[1];
    }

    // Procurar código isolado no formato comum
    const matchCodigo = textoCompleto.match(/\b(\d{5})\b/);
    if (matchCodigo) {
      return matchCodigo[1];
    }

    return null;
  }

  /**
   * Busca item SINAPI por nome similar
   */
  private buscarPorNomeSimilar(
    item: PricelistItemCompleto,
    todosSINAPI: ItemSINAPI[]
  ): { item: ItemSINAPI; confianca: number } | null {
    const nomeNormalizado = this.normalizarTexto(item.nome);
    let melhorMatch: { item: ItemSINAPI; confianca: number } | null = null;

    for (const sinapiItem of todosSINAPI) {
      const descNormalizada = this.normalizarTexto(sinapiItem.descricao);

      // Calcular similaridade
      const similaridade = this.calcularSimilaridadeTexto(
        nomeNormalizado,
        descNormalizada
      );

      if (similaridade > 0.75 && (!melhorMatch || similaridade > melhorMatch.confianca)) {
        melhorMatch = { item: sinapiItem, confianca: similaridade };
      }
    }

    return melhorMatch;
  }

  /**
   * Busca item SINAPI por categoria mapeada
   */
  private buscarPorCategoria(
    item: PricelistItemCompleto,
    sinapiPorCodigo: Map<string, ItemSINAPI>
  ): ItemSINAPI | null {
    // Determinar categoria do item
    const tipoServico = (item.categoria as any)?.tipo_servico?.toLowerCase() || "";
    const nomeCategoria = (item.categoria as any)?.nome?.toLowerCase() || "";

    // Encontrar mapeamento correspondente
    for (const [categoria, codigos] of Object.entries(MAPEAMENTO_CATEGORIAS_SINAPI)) {
      if (
        tipoServico.includes(categoria) ||
        nomeCategoria.includes(categoria)
      ) {
        // Retornar primeiro código disponível da categoria
        for (const codigo of codigos) {
          if (sinapiPorCodigo.has(codigo)) {
            return sinapiPorCodigo.get(codigo)!;
          }
        }
      }
    }

    return null;
  }

  /**
   * Cria objeto de match com cálculos de preço
   */
  private criarMatch(
    item: PricelistItemCompleto,
    itemSINAPI: ItemSINAPI,
    tipoMatch: MatchSINAPI["tipoMatch"],
    confianca: number,
    config: ConfiguracaoSync
  ): MatchSINAPI {
    const diferencaPreco = itemSINAPI.preco_mediano - item.preco;
    const percentualDiferenca = item.preco > 0
      ? diferencaPreco / item.preco
      : (itemSINAPI.preco_mediano > 0 ? 1 : 0);

    // Determinar recomendaçÍo
    let recomendacao: MatchSINAPI["recomendacao"] = "manter";

    if (tipoMatch === "exato" && Math.abs(percentualDiferenca) >= config.limiarDiferencaPreco) {
      recomendacao = "atualizar";
    } else if (tipoMatch === "aproximado" && Math.abs(percentualDiferenca) >= config.limiarDiferencaPreco) {
      recomendacao = "revisar";
    } else if (tipoMatch === "sugerido") {
      recomendacao = "revisar";
    }

    return {
      itemPricelist: item,
      itemSINAPI,
      tipoMatch,
      confianca,
      diferencaPreco,
      percentualDiferenca,
      recomendacao,
    };
  }

  /**
   * Normaliza texto para comparaçÍo
   */
  private normalizarTexto(texto: string): string {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Calcula similaridade entre dois textos usando tokens
   */
  private calcularSimilaridadeTexto(texto1: string, texto2: string): number {
    const tokens1 = texto1.split(" ").filter(t => t.length > 2);
    const tokens2 = texto2.split(" ").filter(t => t.length > 2);

    if (tokens1.length === 0 || tokens2.length === 0) return 0;

    let matches = 0;
    for (const t1 of tokens1) {
      if (tokens2.some(t2 => t2 === t1 || t2.includes(t1) || t1.includes(t2))) {
        matches++;
      }
    }

    return matches / Math.max(tokens1.length, tokens2.length);
  }

  /**
   * Aplica atualizaçÍo de preço de um item baseado no SINAPI
   */
  async aplicarAtualizacaoPreco(
    itemId: string,
    novoPreco: number,
    codigoSINAPI?: string
  ): Promise<{ sucesso: boolean; erro?: string }> {
    try {
      const updateData: Record<string, unknown> = {
        preco: novoPreco,
        updated_at: new Date().toISOString(),
      };

      // Se fornecido código SINAPI, adicionar nas observações ou campo específico
      if (codigoSINAPI) {
        // Buscar item atual para preservar descriçÍo
        const { data: itemAtual } = await supabase
          .from("pricelist_itens")
          .select("descricao")
          .eq("id", itemId)
          .single();

        const descricaoAtual = itemAtual?.descricao || "";
        if (!descricaoAtual.includes(`SINAPI ${codigoSINAPI}`)) {
          updateData.descricao = `${descricaoAtual}\n[SINAPI ${codigoSINAPI}]`.trim();
        }
      }

      const { error } = await supabase
        .from("pricelist_itens")
        .update(updateData)
        .eq("id", itemId);

      if (error) throw error;

      return { sucesso: true };
    } catch (error) {
      return {
        sucesso: false,
        erro: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  /**
   * Aplica atualizações em lote
   */
  async aplicarAtualizacoesEmLote(
    atualizacoes: Array<{ itemId: string; novoPreco: number; codigoSINAPI?: string }>
  ): Promise<{ sucesso: number; erros: number; detalhes: string[] }> {
    let sucesso = 0;
    let erros = 0;
    const detalhes: string[] = [];

    for (const atualizacao of atualizacoes) {
      const resultado = await this.aplicarAtualizacaoPreco(
        atualizacao.itemId,
        atualizacao.novoPreco,
        atualizacao.codigoSINAPI
      );

      if (resultado.sucesso) {
        sucesso++;
      } else {
        erros++;
        detalhes.push(`Item ${atualizacao.itemId}: ${resultado.erro}`);
      }
    }

    return { sucesso, erros, detalhes };
  }
}

// ============================================================
// INSTÂNCIA PADRÍO
// ============================================================

export const pricelistSinapiSyncService = new PricelistSinapiSyncService();

// ============================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================

/**
 * Obtém estatísticas de cobertura SINAPI do Pricelist
 */
export async function obterEstatisticasCoberturaSINAPI(
  estado: EstadoBrasil = "SP"
): Promise<{
  totalPricelist: number;
  comCodigoSINAPI: number;
  semCodigoSINAPI: number;
  percentualCobertura: number;
}> {
  // Contar itens do Pricelist
  const { count: totalPricelist } = await supabase
    .from("pricelist_itens")
    .select("*", { count: "exact", head: true })
    .eq("ativo", true);

  // Contar itens com código SINAPI
  const { data: itensComCodigo } = await supabase
    .from("pricelist_itens")
    .select("id, codigo, descricao")
    .eq("ativo", true);

  let comCodigoSINAPI = 0;
  for (const item of itensComCodigo || []) {
    // Verificar se tem código SINAPI
    if (item.codigo && /^\d{4,6}$/.test(item.codigo)) {
      comCodigoSINAPI++;
    } else if (
      item.descricao &&
      /SINAPI\s*[:\s]?\s*\d{4,6}/i.test(item.descricao)
    ) {
      comCodigoSINAPI++;
    }
  }

  const total = totalPricelist || 0;
  const semCodigoSINAPI = total - comCodigoSINAPI;
  const percentualCobertura = total > 0 ? (comCodigoSINAPI / total) * 100 : 0;

  return {
    totalPricelist: total,
    comCodigoSINAPI,
    semCodigoSINAPI,
    percentualCobertura,
  };
}



