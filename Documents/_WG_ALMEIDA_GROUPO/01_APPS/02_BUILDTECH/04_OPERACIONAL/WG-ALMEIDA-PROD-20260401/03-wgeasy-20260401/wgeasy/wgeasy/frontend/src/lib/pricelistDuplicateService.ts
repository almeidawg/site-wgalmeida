// ============================================================
// SERVIÇO DE DETECÇÍO DE DUPLICIDADES - PRICELIST
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { supabase } from "@/lib/supabaseClient";
import type { PricelistItemCompleto } from "@/types/pricelist";

// ============================================================
// TIPOS E INTERFACES
// ============================================================

export interface DuplicadoPotencial {
  item1: PricelistItemCompleto;
  item2: PricelistItemCompleto;
  similaridade: number;
  motivoDeteccao: "nome" | "codigo" | "nome_codigo" | "fabricante_modelo";
  sugestao: "manter_primeiro" | "manter_segundo" | "mesclar" | "revisar";
}

export interface GrupoDuplicados {
  id: string;
  itens: PricelistItemCompleto[];
  similaridadeMedia: number;
  motivoPrincipal: string;
}

export interface ResultadoAnalise {
  totalItens: number;
  duplicadosPotenciais: DuplicadoPotencial[];
  gruposDuplicados: GrupoDuplicados[];
  itensUnicos: number;
  tempoAnaliseMs: number;
}

export interface ConfiguracaoDeteccao {
  limiarSimilaridade: number; // 0-1, padrÍo 0.85
  ignorarMaiusculas: boolean;
  ignorarAcentos: boolean;
  compararCodigos: boolean;
  compararNomes: boolean;
  compararFabricante: boolean;
  apenasCategoria?: string;
  apenasNucleo?: string;
}

export interface SugestaoDeduplicacaoBanco {
  id: string;
  execucao_id: string;
  motivo: "chave_exata" | "similaridade";
  score: number;
  mesma_unidade: boolean;
  mesma_categoria: boolean;
  status: "pendente" | "aprovado" | "rejeitado" | "aplicado" | "erro";
  justificativa: string | null;
  item_principal_id: string;
  item_principal_nome: string;
  item_principal_codigo: string | null;
  item_principal_preco: number | null;
  item_principal_unidade: string | null;
  item_principal_tipo: string | null;
  item_duplicado_id: string;
  item_duplicado_nome: string;
  item_duplicado_codigo: string | null;
  item_duplicado_preco: number | null;
  item_duplicado_unidade: string | null;
  item_duplicado_tipo: string | null;
  created_at: string;
}

export interface RegraDescritivoCanonico {
  id: string;
  tipo: "sinonimo" | "stopword";
  termo: string;
  substituto: string | null;
  prioridade: number;
  ativo: boolean;
  observacao: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================

/**
 * Remove acentos de uma string
 */
function removerAcentos(texto: string): string {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Normaliza texto para comparaçÍo
 */
function normalizarTexto(texto: string, config: ConfiguracaoDeteccao): string {
  let resultado = texto.trim();

  if (config.ignorarMaiusculas) {
    resultado = resultado.toLowerCase();
  }

  if (config.ignorarAcentos) {
    resultado = removerAcentos(resultado);
  }

  // Remove espaços duplicados
  resultado = resultado.replace(/\s+/g, " ");

  return resultado;
}

/**
 * Calcula distância de Levenshtein entre duas strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;

  // Criar matriz de distâncias
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  // Inicializar primeira coluna e primeira linha
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  // Preencher matriz
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // DeleçÍo
          dp[i][j - 1],     // InserçÍo
          dp[i - 1][j - 1]  // SubstituiçÍo
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Calcula similaridade entre duas strings (0-1)
 */
function calcularSimilaridade(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (!str1 || !str2) return 0;

  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;

  const distancia = levenshteinDistance(str1, str2);
  return 1 - distancia / maxLen;
}

/**
 * Calcula similaridade usando tokens (palavras)
 */
function calcularSimilaridadeTokens(str1: string, str2: string): number {
  const tokens1 = str1.split(/\s+/).filter(t => t.length > 2);
  const tokens2 = str2.split(/\s+/).filter(t => t.length > 2);

  if (tokens1.length === 0 || tokens2.length === 0) return 0;

  let matches = 0;
  for (const t1 of tokens1) {
    for (const t2 of tokens2) {
      if (t1 === t2 || calcularSimilaridade(t1, t2) > 0.85) {
        matches++;
        break;
      }
    }
  }

  return matches / Math.max(tokens1.length, tokens2.length);
}

/**
 * Determina qual item manter em caso de duplicidade
 */
function determinarSugestao(
  item1: PricelistItemCompleto,
  item2: PricelistItemCompleto
): DuplicadoPotencial["sugestao"] {
  // Critérios de preferência:
  // 1. Item com imagem
  // 2. Item com mais informações preenchidas
  // 3. Item mais recente
  // 4. Item com preço maior (geralmente mais atualizado)

  const pontos1 = calcularPontosCompletude(item1);
  const pontos2 = calcularPontosCompletude(item2);

  if (Math.abs(pontos1 - pontos2) > 2) {
    return pontos1 > pontos2 ? "manter_primeiro" : "manter_segundo";
  }

  // Se muito similares em completude, sugerir mesclagem ou revisÍo manual
  return pontos1 === pontos2 ? "revisar" : "mesclar";
}

/**
 * Calcula pontos de completude de um item
 */
function calcularPontosCompletude(item: PricelistItemCompleto): number {
  let pontos = 0;

  if (item.imagem_url) pontos += 3;
  if (item.descricao) pontos += 2;
  if (item.codigo) pontos += 2;
  if (item.fabricante) pontos += 1;
  if (item.modelo) pontos += 1;
  if (item.formato) pontos += 1;
  if (item.link_produto) pontos += 1;
  if (item.preco > 0) pontos += 2;
  if (item.categoria_id) pontos += 1;
  if (item.nucleo_id) pontos += 1;

  return pontos;
}

// ============================================================
// CLASSE PRINCIPAL DE DETECÇÍO
// ============================================================

export class PricelistDuplicateService {
  private config: ConfiguracaoDeteccao;

  constructor(config?: Partial<ConfiguracaoDeteccao>) {
    this.config = {
      limiarSimilaridade: 0.80,
      ignorarMaiusculas: true,
      ignorarAcentos: true,
      compararCodigos: true,
      compararNomes: true,
      compararFabricante: true,
      ...config,
    };
  }

  /**
   * Analisa todos os itens do pricelist em busca de duplicidades
   */
  async analisarDuplicidades(itens?: PricelistItemCompleto[]): Promise<ResultadoAnalise> {
    const inicio = Date.now();

    // Se não passados, buscar do banco
    if (!itens) {
      const { data, error } = await supabase
        .from("pricelist_itens")
        .select(`
          *,
          categoria:pricelist_categorias!categoria_id (id, nome, codigo),
          nucleo:nucleos!nucleo_id (id, nome)
        `)
        .eq("ativo", true);

      if (error) throw error;
      itens = data as PricelistItemCompleto[];
    }

    // Filtrar por categoria/núcleo se configurado
    if (this.config.apenasCategoria) {
      itens = itens.filter(i => i.categoria_id === this.config.apenasCategoria);
    }
    if (this.config.apenasNucleo) {
      itens = itens.filter(i => i.nucleo_id === this.config.apenasNucleo);
    }

    const duplicadosPotenciais: DuplicadoPotencial[] = [];
    const processados = new Set<string>();

    // Comparar cada item com todos os outros
    for (let i = 0; i < itens.length; i++) {
      for (let j = i + 1; j < itens.length; j++) {
        const item1 = itens[i];
        const item2 = itens[j];

        // Pular se já processados como par
        const parId = [item1.id, item2.id].sort().join("-");
        if (processados.has(parId)) continue;

        const resultado = this.compararItens(item1, item2);

        if (resultado) {
          duplicadosPotenciais.push(resultado);
          processados.add(parId);
        }
      }
    }

    // Agrupar duplicados relacionados
    const gruposDuplicados = this.agruparDuplicados(duplicadosPotenciais, itens);

    // Calcular itens únicos (não envolvidos em duplicidades)
    const idsEnvolvidos = new Set<string>();
    for (const dup of duplicadosPotenciais) {
      idsEnvolvidos.add(dup.item1.id);
      idsEnvolvidos.add(dup.item2.id);
    }

    return {
      totalItens: itens.length,
      duplicadosPotenciais,
      gruposDuplicados,
      itensUnicos: itens.length - idsEnvolvidos.size,
      tempoAnaliseMs: Date.now() - inicio,
    };
  }

  /**
   * Compara dois itens e retorna resultado de duplicidade se encontrada
   */
  private compararItens(
    item1: PricelistItemCompleto,
    item2: PricelistItemCompleto
  ): DuplicadoPotencial | null {
    let similaridadeNome = 0;
    let similaridadeCodigo = 0;
    let similaridadeFabricante = 0;
    let motivoDeteccao: DuplicadoPotencial["motivoDeteccao"] = "nome";

    // Comparar nomes
    if (this.config.compararNomes && item1.nome && item2.nome) {
      const nome1 = normalizarTexto(item1.nome, this.config);
      const nome2 = normalizarTexto(item2.nome, this.config);

      // Usar combinaçÍo de similaridade por caracteres e tokens
      const simCaracteres = calcularSimilaridade(nome1, nome2);
      const simTokens = calcularSimilaridadeTokens(nome1, nome2);
      similaridadeNome = Math.max(simCaracteres, simTokens);
    }

    // Comparar códigos
    if (this.config.compararCodigos && item1.codigo && item2.codigo) {
      const codigo1 = normalizarTexto(item1.codigo, this.config);
      const codigo2 = normalizarTexto(item2.codigo, this.config);

      // Para códigos, exigir similaridade muito alta
      if (codigo1 === codigo2) {
        similaridadeCodigo = 1;
      } else if (codigo1.includes(codigo2) || codigo2.includes(codigo1)) {
        similaridadeCodigo = 0.9;
      }
    }

    // Comparar fabricante + modelo
    if (this.config.compararFabricante && item1.fabricante && item2.fabricante) {
      const fab1 = normalizarTexto(item1.fabricante, this.config);
      const fab2 = normalizarTexto(item2.fabricante, this.config);

      if (fab1 === fab2 && item1.modelo && item2.modelo) {
        const mod1 = normalizarTexto(item1.modelo, this.config);
        const mod2 = normalizarTexto(item2.modelo, this.config);

        if (calcularSimilaridade(mod1, mod2) > 0.85) {
          similaridadeFabricante = 0.95;
        }
      }
    }

    // Determinar melhor match e motivo
    let similaridadeFinal = 0;

    if (similaridadeCodigo >= this.config.limiarSimilaridade) {
      similaridadeFinal = similaridadeCodigo;
      motivoDeteccao = similaridadeNome > 0.7 ? "nome_codigo" : "codigo";
    } else if (similaridadeNome >= this.config.limiarSimilaridade) {
      similaridadeFinal = similaridadeNome;
      motivoDeteccao = "nome";
    } else if (similaridadeFabricante >= this.config.limiarSimilaridade) {
      similaridadeFinal = similaridadeFabricante;
      motivoDeteccao = "fabricante_modelo";
    }

    // Se não atingiu limiar, não é duplicado
    if (similaridadeFinal < this.config.limiarSimilaridade) {
      return null;
    }

    return {
      item1,
      item2,
      similaridade: similaridadeFinal,
      motivoDeteccao,
      sugestao: determinarSugestao(item1, item2),
    };
  }

  /**
   * Agrupa duplicados relacionados em clusters
   */
  private agruparDuplicados(
    duplicados: DuplicadoPotencial[],
    todosItens: PricelistItemCompleto[]
  ): GrupoDuplicados[] {
    // Usar Union-Find para agrupar itens relacionados
    const parent = new Map<string, string>();

    function find(x: string): string {
      if (!parent.has(x)) parent.set(x, x);
      if (parent.get(x) !== x) {
        parent.set(x, find(parent.get(x)!));
      }
      return parent.get(x)!;
    }

    function union(x: string, y: string): void {
      const px = find(x);
      const py = find(y);
      if (px !== py) parent.set(px, py);
    }

    // Unir itens duplicados
    for (const dup of duplicados) {
      union(dup.item1.id, dup.item2.id);
    }

    // Agrupar por raiz
    const grupos = new Map<string, Set<string>>();
    const idsEnvolvidos = new Set<string>();

    for (const dup of duplicados) {
      idsEnvolvidos.add(dup.item1.id);
      idsEnvolvidos.add(dup.item2.id);
    }

    for (const id of idsEnvolvidos) {
      const raiz = find(id);
      if (!grupos.has(raiz)) {
        grupos.set(raiz, new Set());
      }
      grupos.get(raiz)!.add(id);
    }

    // Construir resultado
    const itemMap = new Map(todosItens.map(i => [i.id, i]));
    const gruposFinais: GrupoDuplicados[] = [];

    for (const [raiz, ids] of grupos) {
      if (ids.size < 2) continue;

      const itens = Array.from(ids)
        .map(id => itemMap.get(id))
        .filter((i): i is PricelistItemCompleto => i !== undefined);

      // Calcular similaridade média do grupo
      const dupsDoGrupo = duplicados.filter(
        d => ids.has(d.item1.id) && ids.has(d.item2.id)
      );
      const similaridadeMedia = dupsDoGrupo.length > 0
        ? dupsDoGrupo.reduce((acc, d) => acc + d.similaridade, 0) / dupsDoGrupo.length
        : 0;

      // Determinar motivo principal
      const motivos = dupsDoGrupo.map(d => d.motivoDeteccao);
      const motivoCounts = motivos.reduce((acc, m) => {
        acc[m] = (acc[m] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const motivoPrincipal = Object.entries(motivoCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "nome";

      gruposFinais.push({
        id: raiz,
        itens,
        similaridadeMedia,
        motivoPrincipal,
      });
    }

    // Ordenar por número de itens (maior primeiro)
    return gruposFinais.sort((a, b) => b.itens.length - a.itens.length);
  }

  /**
   * Busca duplicados de um item específico
   */
  async buscarDuplicadosDeItem(
    item: PricelistItemCompleto
  ): Promise<DuplicadoPotencial[]> {
    const { data, error } = await supabase
      .from("pricelist_itens")
      .select(`
        *,
        categoria:pricelist_categorias!categoria_id (id, nome, codigo),
        nucleo:nucleos!nucleo_id (id, nome)
      `)
      .neq("id", item.id)
      .eq("ativo", true);

    if (error) throw error;

    const duplicados: DuplicadoPotencial[] = [];

    for (const outro of data as PricelistItemCompleto[]) {
      const resultado = this.compararItens(item, outro);
      if (resultado) {
        duplicados.push(resultado);
      }
    }

    // Ordenar por similaridade (maior primeiro)
    return duplicados.sort((a, b) => b.similaridade - a.similaridade);
  }

  async listarSugestoesPendentesBanco(
    limite = 200
  ): Promise<SugestaoDeduplicacaoBanco[]> {
    const { data, error } = await supabase
      .from("vw_pricelist_dedup_sugestoes_pendentes")
      .select("*")
      .order("score", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limite);

    if (error) throw error;
    return (data || []) as SugestaoDeduplicacaoBanco[];
  }

  async gerarSugestoesBanco(params?: {
    limiar?: number;
    limite?: number;
  }): Promise<string> {
    const { data, error } = await supabase.rpc(
      "pricelist_gerar_sugestoes_deduplicacao",
      {
        p_limiar: params?.limiar ?? 0.9,
        p_limite: params?.limite ?? 3000,
      }
    );
    if (error) throw error;
    return data as string;
  }

  async aplicarSugestaoBanco(
    sugestaoId: string
  ): Promise<{
    ok: boolean;
    sugestao_id: string;
    item_principal_id: string;
    item_duplicado_id: string;
    referencias_reapontadas: number;
  }> {
    const { data, error } = await supabase.rpc(
      "pricelist_aplicar_sugestao_deduplicacao",
      {
        p_sugestao_id: sugestaoId,
      }
    );
    if (error) throw error;
    return data as {
      ok: boolean;
      sugestao_id: string;
      item_principal_id: string;
      item_duplicado_id: string;
      referencias_reapontadas: number;
    };
  }

  async rejeitarSugestaoBanco(
    sugestaoId: string,
    motivo?: string
  ): Promise<boolean> {
    const { data, error } = await supabase.rpc(
      "pricelist_rejeitar_sugestao_deduplicacao",
      {
        p_sugestao_id: sugestaoId,
        p_motivo: motivo ?? null,
      }
    );
    if (error) throw error;
    return Boolean(data);
  }

  async aplicarLoteSeguroBanco(params?: {
    execucaoId?: string | null;
    minScore?: number;
    limit?: number;
    dryRun?: boolean;
  }): Promise<{
    ok: boolean;
    dry_run: boolean;
    selecionadas?: number;
    aplicadas?: number;
    erros?: number;
    sugestoes_ids: string[];
    sugestoes_consolidadas?: number;
  }> {
    const { data, error } = await supabase.rpc(
      "pricelist_aplicar_sugestoes_deduplicacao_lote_v2",
      {
        p_execucao_id: params?.execucaoId ?? null,
        p_min_score: params?.minScore ?? 1.0,
        p_limit: params?.limit ?? 100,
        p_dry_run: params?.dryRun ?? true,
      }
    );
    if (error) throw error;
    return data as {
      ok: boolean;
      dry_run: boolean;
      selecionadas?: number;
      aplicadas?: number;
      erros?: number;
      sugestoes_ids: string[];
      sugestoes_consolidadas?: number;
    };
  }

  async listarRegrasDescritivoBanco(
    tipo?: "sinonimo" | "stopword" | "todos"
  ): Promise<RegraDescritivoCanonico[]> {
    let query = supabase
      .from("pricelist_descritivo_regras")
      .select("*")
      .order("prioridade", { ascending: true })
      .order("termo", { ascending: true });

    if (tipo && tipo !== "todos") {
      query = query.eq("tipo", tipo);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as RegraDescritivoCanonico[];
  }

  async criarRegraDescritivoBanco(input: {
    tipo: "sinonimo" | "stopword";
    termo: string;
    substituto?: string | null;
    prioridade?: number;
    ativo?: boolean;
    observacao?: string | null;
  }): Promise<RegraDescritivoCanonico> {
    const payload = {
      tipo: input.tipo,
      termo: input.termo.trim().toLowerCase(),
      substituto: input.substituto ? input.substituto.trim().toLowerCase() : null,
      prioridade: input.prioridade ?? 100,
      ativo: input.ativo ?? true,
      observacao: input.observacao ?? null,
    };

    const { data, error } = await supabase
      .from("pricelist_descritivo_regras")
      .upsert(payload, { onConflict: "tipo,termo" })
      .select("*")
      .single();

    if (error) throw error;
    return data as RegraDescritivoCanonico;
  }

  async atualizarRegraDescritivoBanco(
    id: string,
    patch: Partial<Pick<RegraDescritivoCanonico, "substituto" | "prioridade" | "ativo" | "observacao">>
  ): Promise<RegraDescritivoCanonico> {
    const { data, error } = await supabase
      .from("pricelist_descritivo_regras")
      .update({
        ...patch,
        substituto:
          patch.substituto === undefined
            ? undefined
            : patch.substituto
              ? patch.substituto.trim().toLowerCase()
              : null,
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data as RegraDescritivoCanonico;
  }

  async excluirRegraDescritivoBanco(id: string): Promise<void> {
    const { error } = await supabase
      .from("pricelist_descritivo_regras")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }
}

// ============================================================
// INSTÂNCIA PADRÍO
// ============================================================

export const pricelistDuplicateService = new PricelistDuplicateService();

// ============================================================
// FUNÇÕES UTILITÁRIAS EXPORTADAS
// ============================================================

/**
 * Verifica rapidamente se um nome já existe no pricelist
 */
export async function verificarNomeExistente(
  nome: string,
  excluirId?: string
): Promise<{ existe: boolean; itemExistente?: PricelistItemCompleto }> {
  const nomeNormalizado = normalizarTexto(nome, {
    ignorarMaiusculas: true,
    ignorarAcentos: true,
    limiarSimilaridade: 0.85,
    compararCodigos: false,
    compararNomes: true,
    compararFabricante: false,
  });

  let query = supabase
    .from("pricelist_itens")
    .select("*")
    .eq("ativo", true);

  if (excluirId) {
    query = query.neq("id", excluirId);
  }

  const { data, error } = await query;
  if (error) throw error;

  for (const item of data as PricelistItemCompleto[]) {
    const nomeItem = normalizarTexto(item.nome, {
      ignorarMaiusculas: true,
      ignorarAcentos: true,
      limiarSimilaridade: 0.85,
      compararCodigos: false,
      compararNomes: true,
      compararFabricante: false,
    });

    if (calcularSimilaridade(nomeNormalizado, nomeItem) > 0.9) {
      return { existe: true, itemExistente: item };
    }
  }

  return { existe: false };
}

/**
 * Verifica se um código já existe no pricelist
 */
export async function verificarCodigoExistente(
  codigo: string,
  excluirId?: string
): Promise<{ existe: boolean; itemExistente?: PricelistItemCompleto }> {
  let query = supabase
    .from("pricelist_itens")
    .select("*")
    .ilike("codigo", codigo)
    .eq("ativo", true);

  if (excluirId) {
    query = query.neq("id", excluirId);
  }

  const { data, error } = await query.limit(1);
  if (error) throw error;

  if (data && data.length > 0) {
    return { existe: true, itemExistente: data[0] as PricelistItemCompleto };
  }

  return { existe: false };
}


