// ============================================================
// API: Composições de Materiais
// Sistema WG Easy - Grupo WG Almeida
// Composições para cálculo automático de materiais
// ============================================================

import { supabase } from "./supabaseClient";

// ============================================================
// TIPOS
// ============================================================

export type ClassificacaoMaterial = "ACABAMENTO" | "INSUMO" | "CONSUMIVEL" | "FERRAMENTA";
export type CalculoTipo = "POR_AREA" | "POR_PERIMETRO" | "POR_UNIDADE" | "FIXO" | "PROPORCIONAL";
export type Disciplina = "ELETRICA" | "HIDRAULICA" | "REVESTIMENTOS" | "PINTURA" | "GESSO" | "ALVENARIA" | "FORRO" | "MARCENARIA";

export interface ModeloComposicao {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  disciplina: Disciplina;
  categoria?: string;
  unidade_base: string; // m2, ml, un
  ativo: boolean;
  criado_em: string;
  atualizado_em?: string;
  itens?: ModeloComposicaoItem[];
}

export interface ModeloComposicaoItem {
  id: string;
  composicao_id: string;
  classificacao: ClassificacaoMaterial;
  categoria_material?: string;
  descricao_generica: string;
  calculo_tipo: CalculoTipo;
  coeficiente: number;
  unidade: string;
  arredondar_para?: number;
  minimo?: number;
  pricelist_item_id?: string;
  obrigatorio: boolean;
  observacao?: string;
  ordem: number;
  // Join com pricelist
  pricelist_item?: {
    id: string;
    nome: string;
    preco: number;
    codigo?: string;
    imagem_url?: string;
  };
}

export interface MaterialCalculado {
  composicao_codigo: string;
  composicao_nome: string;
  item_descricao: string;
  classificacao: ClassificacaoMaterial;
  quantidade_calculada: number;
  quantidade_final: number;
  unidade: string;
  preco_unitario?: number;
  valor_total?: number;
  pricelist_item_id?: string;
  pricelist_item?: any;
  observacao?: string;
}

// ============================================================
// COMPOSIÇÕES
// ============================================================

/**
 * Listar todas as composições ativas
 */
export async function listarComposicoes(filtros?: {
  disciplina?: string;
  categoria?: string;
  busca?: string;
  ativo?: boolean;
}): Promise<ModeloComposicao[]> {
  let query = supabase
    .from("modelos_composicao")
    .select("*")
    .order("disciplina")
    .order("nome");

  if (filtros?.disciplina && filtros.disciplina !== "todos") {
    query = query.eq("disciplina", filtros.disciplina);
  }

  if (filtros?.categoria) {
    query = query.eq("categoria", filtros.categoria);
  }

  if (filtros?.ativo !== undefined) {
    query = query.eq("ativo", filtros.ativo);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Filtrar por busca se necessário
  let composicoes = data || [];
  if (filtros?.busca) {
    const termo = filtros.busca.toLowerCase();
    composicoes = composicoes.filter(
      (c) =>
        c.nome.toLowerCase().includes(termo) ||
        c.codigo.toLowerCase().includes(termo) ||
        (c.descricao || "").toLowerCase().includes(termo)
    );
  }

  return composicoes;
}

/**
 * Buscar composiçÍo completa com itens
 */
export async function buscarComposicaoCompleta(composicaoId: string): Promise<ModeloComposicao | null> {
  // Buscar composiçÍo
  const { data: composicao, error: composicaoError } = await supabase
    .from("modelos_composicao")
    .select("*")
    .eq("id", composicaoId)
    .single();

  if (composicaoError) throw composicaoError;
  if (!composicao) return null;

  // Tentar buscar itens com pricelist (requer FK configurada)
  let itens: ModeloComposicaoItem[] = [];

  try {
    const { data: itensComPricelist, error: joinError } = await supabase
      .from("modelos_composicao_itens")
      .select(`
        *,
        pricelist_item:pricelist_itens(id, nome, preco, codigo, imagem_url)
      `)
      .eq("composicao_id", composicaoId)
      .order("ordem", { ascending: true });

    if (!joinError && itensComPricelist) {
      itens = itensComPricelist;
    } else {
      // Fallback: buscar itens sem join se FK não existir
      console.warn("Join com pricelist_itens falhou, buscando sem join:", joinError?.message);
      const { data: itensSemJoin } = await supabase
        .from("modelos_composicao_itens")
        .select("*")
        .eq("composicao_id", composicaoId)
        .order("ordem", { ascending: true });

      itens = itensSemJoin || [];
    }
  } catch (err) {
    // Fallback em caso de erro
    console.warn("Erro ao buscar itens com join, usando fallback:", err);
    const { data: itensSemJoin } = await supabase
      .from("modelos_composicao_itens")
      .select("*")
      .eq("composicao_id", composicaoId)
      .order("ordem", { ascending: true });

    itens = itensSemJoin || [];
  }

  return {
    ...composicao,
    itens,
  };
}

/**
 * Buscar composiçÍo por código
 */
export async function buscarComposicaoPorCodigo(codigo: string): Promise<ModeloComposicao | null> {
  const { data, error } = await supabase
    .from("modelos_composicao")
    .select("*")
    .eq("codigo", codigo)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw error;
  }

  if (!data) return null;

  return buscarComposicaoCompleta(data.id);
}

/**
 * Criar nova composiçÍo
 */
export async function criarComposicao(dados: Partial<ModeloComposicao>): Promise<ModeloComposicao> {
  const { data, error } = await supabase
    .from("modelos_composicao")
    .insert({
      codigo: dados.codigo,
      nome: dados.nome,
      descricao: dados.descricao,
      disciplina: dados.disciplina,
      categoria: dados.categoria,
      unidade_base: dados.unidade_base,
      ativo: dados.ativo ?? true,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Atualizar composiçÍo
 */
export async function atualizarComposicao(id: string, dados: Partial<ModeloComposicao>): Promise<ModeloComposicao> {
  const { data, error } = await supabase
    .from("modelos_composicao")
    .update({
      ...dados,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Excluir composiçÍo
 */
export async function excluirComposicao(id: string): Promise<void> {
  // Primeiro excluir itens
  await supabase
    .from("modelos_composicao_itens")
    .delete()
    .eq("composicao_id", id);

  // Depois excluir composiçÍo
  const { error } = await supabase
    .from("modelos_composicao")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// ============================================================
// ITENS DA COMPOSIÇÍO
// ============================================================

/**
 * Adicionar item à composiçÍo
 */
export async function adicionarItemComposicao(dados: Partial<ModeloComposicaoItem>): Promise<ModeloComposicaoItem> {
  // Buscar maior ordem atual
  const { data: maxOrdem } = await supabase
    .from("modelos_composicao_itens")
    .select("ordem")
    .eq("composicao_id", dados.composicao_id)
    .order("ordem", { ascending: false })
    .limit(1)
    .single();

  const { data, error } = await supabase
    .from("modelos_composicao_itens")
    .insert({
      composicao_id: dados.composicao_id,
      classificacao: dados.classificacao,
      categoria_material: dados.categoria_material,
      descricao_generica: dados.descricao_generica,
      calculo_tipo: dados.calculo_tipo,
      coeficiente: dados.coeficiente,
      unidade: dados.unidade,
      arredondar_para: dados.arredondar_para,
      minimo: dados.minimo,
      pricelist_item_id: dados.pricelist_item_id,
      obrigatorio: dados.obrigatorio ?? true,
      observacao: dados.observacao,
      ordem: dados.ordem ?? (maxOrdem?.ordem ?? 0) + 1,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Atualizar item da composiçÍo
 */
export async function atualizarItemComposicao(id: string, dados: Partial<ModeloComposicaoItem>): Promise<ModeloComposicaoItem> {
  const { data, error } = await supabase
    .from("modelos_composicao_itens")
    .update(dados)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Excluir item da composiçÍo
 */
export async function excluirItemComposicao(id: string): Promise<void> {
  const { error } = await supabase
    .from("modelos_composicao_itens")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// ============================================================
// CÁLCULO DE MATERIAIS
// ============================================================

/**
 * Calcular materiais necessários para uma composiçÍo
 */
export function calcularMateriaisComposicao(
  composicao: ModeloComposicao,
  quantidade: number,
  dadosExtras?: {
    area?: number;
    perimetro?: number;
    unidades?: number;
  }
): MaterialCalculado[] {
  if (!composicao.itens) return [];

  return composicao.itens.map((item) => {
    let quantidadeBase = quantidade;

    // Determinar a base de cálculo
    switch (item.calculo_tipo) {
      case "POR_AREA":
        quantidadeBase = dadosExtras?.area ?? quantidade;
        break;
      case "POR_PERIMETRO":
        quantidadeBase = dadosExtras?.perimetro ?? quantidade;
        break;
      case "POR_UNIDADE":
        quantidadeBase = dadosExtras?.unidades ?? quantidade;
        break;
      case "FIXO":
        quantidadeBase = 1;
        break;
      case "PROPORCIONAL":
        // Proporcional à quantidade principal
        break;
    }

    // Calcular quantidade
    let quantidadeCalculada = quantidadeBase * item.coeficiente;

    // Aplicar mínimo se definido
    if (item.minimo && quantidadeCalculada < item.minimo) {
      quantidadeCalculada = item.minimo;
    }

    // Arredondar para embalagem comercial se definido
    let quantidadeFinal = quantidadeCalculada;
    if (item.arredondar_para && item.arredondar_para > 0) {
      quantidadeFinal = Math.ceil(quantidadeCalculada / item.arredondar_para) * item.arredondar_para;
    }

    // Calcular valor se tiver preço
    const precoUnitario = item.pricelist_item?.preco;
    const valorTotal = precoUnitario ? quantidadeFinal * precoUnitario : undefined;

    return {
      composicao_codigo: composicao.codigo,
      composicao_nome: composicao.nome,
      item_descricao: item.descricao_generica,
      classificacao: item.classificacao,
      quantidade_calculada: quantidadeCalculada,
      quantidade_final: quantidadeFinal,
      unidade: item.unidade,
      preco_unitario: precoUnitario,
      valor_total: valorTotal,
      pricelist_item_id: item.pricelist_item_id,
      pricelist_item: item.pricelist_item,
      observacao: item.observacao,
    };
  });
}

/**
 * Calcular materiais para múltiplas composições (análise completa)
 */
export async function calcularMateriaisAnalise(
  itensAnalise: Array<{
    composicao_codigo: string;
    quantidade: number;
    area?: number;
    perimetro?: number;
  }>
): Promise<{
  materiais: MaterialCalculado[];
  resumoPorClassificacao: Record<ClassificacaoMaterial, {
    itens: number;
    valorTotal: number;
  }>;
  valorTotal: number;
}> {
  const materiaisCalculados: MaterialCalculado[] = [];

  // Para cada item da análise, buscar composiçÍo e calcular
  for (const item of itensAnalise) {
    const composicao = await buscarComposicaoPorCodigo(item.composicao_codigo);
    if (!composicao) continue;

    const materiais = calcularMateriaisComposicao(composicao, item.quantidade, {
      area: item.area,
      perimetro: item.perimetro,
      unidades: item.quantidade,
    });

    materiaisCalculados.push(...materiais);
  }

  // Agrupar materiais similares
  const materiaisAgrupados = agruparMateriais(materiaisCalculados);

  // Calcular resumo por classificaçÍo
  const resumo: Record<ClassificacaoMaterial, { itens: number; valorTotal: number }> = {
    ACABAMENTO: { itens: 0, valorTotal: 0 },
    INSUMO: { itens: 0, valorTotal: 0 },
    CONSUMIVEL: { itens: 0, valorTotal: 0 },
    FERRAMENTA: { itens: 0, valorTotal: 0 },
  };

  let valorTotal = 0;

  for (const material of materiaisAgrupados) {
    resumo[material.classificacao].itens += 1;
    resumo[material.classificacao].valorTotal += material.valor_total || 0;
    valorTotal += material.valor_total || 0;
  }

  return {
    materiais: materiaisAgrupados,
    resumoPorClassificacao: resumo,
    valorTotal,
  };
}

/**
 * Agrupar materiais similares somando quantidades
 */
function agruparMateriais(materiais: MaterialCalculado[]): MaterialCalculado[] {
  const agrupado: Record<string, MaterialCalculado> = {};

  for (const material of materiais) {
    // Chave única: descriçÍo + classificaçÍo + unidade
    const chave = `${material.item_descricao}|${material.classificacao}|${material.unidade}|${material.pricelist_item_id || 'sem-pricelist'}`;

    if (agrupado[chave]) {
      // Somar quantidades
      agrupado[chave].quantidade_calculada += material.quantidade_calculada;
      agrupado[chave].quantidade_final += material.quantidade_final;
      if (material.valor_total) {
        agrupado[chave].valor_total = (agrupado[chave].valor_total || 0) + material.valor_total;
      }
    } else {
      agrupado[chave] = { ...material };
    }
  }

  return Object.values(agrupado);
}

// ============================================================
// GERAÇÍO DE LISTA DE COMPRAS
// ============================================================

/**
 * Interface para item de lista de compras
 */
export interface ItemListaCompras {
  descricao: string;
  classificacao: ClassificacaoMaterial;
  quantidade: number;
  unidade: string;
  preco_unitario?: number;
  valor_total?: number;
  pricelist_item_id?: string;
  ambiente?: string;
  observacao?: string;
}

/**
 * Gerar lista de compras a partir de materiais calculados
 */
export async function gerarListaComprasDeOrcamento(
  analiseId: string,
  analiseTitulo: string,
  clienteNome: string,
  materiais: MaterialCalculado[],
  ambientesPorMaterial?: Record<string, string[]>
): Promise<{ projetoId: string; totalItens: number }> {
  // 1. Criar projeto de compras
  const { data: ultimoProjeto } = await supabase
    .from("projetos_compras")
    .select("codigo")
    .order("created_at", { ascending: false })
    .limit(1);

  const proximoNum = ultimoProjeto && ultimoProjeto.length > 0
    ? parseInt(ultimoProjeto[0].codigo.replace("PC-", ""), 10) + 1
    : 1;

  const { data: projeto, error: erroProjeto } = await supabase
    .from("projetos_compras")
    .insert({
      codigo: `PC-${proximoNum.toString().padStart(4, "0")}`,
      nome: `Materiais - ${analiseTitulo}`,
      cliente_nome: clienteNome,
      tipo_projeto: "ORCAMENTO_MATERIAIS",
      status: "EM_ANDAMENTO",
    })
    .select()
    .single();

  if (erroProjeto) throw erroProjeto;

  // 2. Agrupar materiais e criar itens de compra
  const materiaisAgrupados = agruparMateriaisParaCompras(materiais, ambientesPorMaterial);

  // 3. Inserir itens de compra
  let ordem = 0;
  for (const material of materiaisAgrupados) {
    // Gerar código do item
    const codigoItem = `LC-${(proximoNum * 1000 + ordem).toString().padStart(5, "0")}`;

    await supabase
      .from("projeto_lista_compras")
      .insert({
        codigo: codigoItem,
        projeto_id: projeto.id,
        pricelist_id: material.pricelist_item_id || null,
        ambiente: material.ambiente || null,
        descricao: material.descricao,
        especificacao: `ClassificaçÍo: ${material.classificacao}`,
        quantidade_projeto: material.quantidade,
        quantidade_compra: material.quantidade,
        unidade: material.unidade,
        preco_unitario: material.preco_unitario || null,
        valor_total: material.valor_total || null,
        tipo_compra: "WG_COMPRA",
        tipo_conta: "REAL",
        taxa_fee_percent: 0,
        valor_fee: 0,
        status: "PENDENTE",
      });

    ordem++;
  }

  return {
    projetoId: projeto.id,
    totalItens: materiaisAgrupados.length,
  };
}

/**
 * Agrupar materiais para compras (consolidar por descriçÍo)
 */
function agruparMateriaisParaCompras(
  materiais: MaterialCalculado[],
  ambientesPorMaterial?: Record<string, string[]>
): ItemListaCompras[] {
  const agrupado: Record<string, ItemListaCompras & { _chave: string }> = {};

  for (const material of materiais) {
    const chave = `${material.item_descricao}|${material.classificacao}|${material.unidade}`;

    if (agrupado[chave]) {
      agrupado[chave].quantidade += material.quantidade_final;
      if (material.valor_total) {
        agrupado[chave].valor_total = (agrupado[chave].valor_total || 0) + material.valor_total;
      }
    } else {
      const ambientes = ambientesPorMaterial?.[chave];
      agrupado[chave] = {
        _chave: chave,
        descricao: material.item_descricao,
        classificacao: material.classificacao,
        quantidade: material.quantidade_final,
        unidade: material.unidade,
        preco_unitario: material.preco_unitario,
        valor_total: material.valor_total,
        pricelist_item_id: material.pricelist_item_id,
        ambiente: ambientes?.join(", "),
        observacao: material.observacao,
      };
    }
  }

  // Ordenar por classificaçÍo
  const ordem = ["ACABAMENTO", "INSUMO", "CONSUMIVEL", "FERRAMENTA"];
  return Object.values(agrupado)
    .sort((a, b) => ordem.indexOf(a.classificacao) - ordem.indexOf(b.classificacao));
}

// ============================================================
// ESTATÍSTICAS
// ============================================================

/**
 * Obter estatísticas das composições
 */
export async function obterEstatisticasComposicoes(): Promise<{
  totalComposicoes: number;
  totalItens: number;
  porDisciplina: Record<string, number>;
  porClassificacao: Record<string, number>;
}> {
  // Total de composições
  const { count: totalComposicoes } = await supabase
    .from("modelos_composicao")
    .select("*", { count: "exact", head: true })
    .eq("ativo", true);

  // Total de itens
  const { count: totalItens } = await supabase
    .from("modelos_composicao_itens")
    .select("*", { count: "exact", head: true });

  // Por disciplina
  const { data: disciplinas } = await supabase
    .from("modelos_composicao")
    .select("disciplina")
    .eq("ativo", true);

  const porDisciplina: Record<string, number> = {};
  for (const d of disciplinas || []) {
    porDisciplina[d.disciplina] = (porDisciplina[d.disciplina] || 0) + 1;
  }

  // Por classificaçÍo
  const { data: classificacoes } = await supabase
    .from("modelos_composicao_itens")
    .select("classificacao");

  const porClassificacao: Record<string, number> = {};
  for (const c of classificacoes || []) {
    porClassificacao[c.classificacao] = (porClassificacao[c.classificacao] || 0) + 1;
  }

  return {
    totalComposicoes: totalComposicoes || 0,
    totalItens: totalItens || 0,
    porDisciplina,
    porClassificacao,
  };
}

export default {
  listarComposicoes,
  buscarComposicaoCompleta,
  buscarComposicaoPorCodigo,
  criarComposicao,
  atualizarComposicao,
  excluirComposicao,
  adicionarItemComposicao,
  atualizarItemComposicao,
  excluirItemComposicao,
  calcularMateriaisComposicao,
  calcularMateriaisAnalise,
  obterEstatisticasComposicoes,
};


