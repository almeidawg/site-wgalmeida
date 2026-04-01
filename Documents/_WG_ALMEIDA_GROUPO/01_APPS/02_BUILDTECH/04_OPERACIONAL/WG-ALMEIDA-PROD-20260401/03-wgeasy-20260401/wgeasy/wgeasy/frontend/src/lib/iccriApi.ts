// ============================================================
// ICCRI API — ÍÍndice de Custo da ConstruçÍo e Reforma
// WG Easy Â· Motor de PrecificaçÍo Inteligente
// Base: Supabase ahlqzzkxuutwoepirpzr (compartilhado com ObraEasy)
// ============================================================

import { supabase } from "@/lib/supabaseClient";

// â”€â”€â”€ Tipos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface ICCRIMacrocategoria {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  ordem: number;
  ativo: boolean;
}

export interface ICCRICategoria {
  id: string;
  macrocategoria_id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  cor_hex: string | null;
  icone: string | null;
  ordem: number;
  ativo: boolean;
  macrocategoria?: ICCRIMacrocategoria;
}

export interface ICCRISubcategoria {
  id: string;
  categoria_id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  ordem: number;
  ativo: boolean;
  categoria?: ICCRICategoria;
}

export interface ICCRIServico {
  id: string;
  subcategoria_id: string | null;
  categoria_id: string | null;
  codigo: string;
  nome: string;
  descricao: string | null;
  unidade: string;
  tipo: "servico" | "material" | "mdo" | "equipamento";
  padrao: "basico" | "intermediario" | "alto" | "todos";
  complexidade: "baixa" | "media" | "alta" | "muito_alta";
  produtividade_diaria: number | null;
  codigo_sinapi: string | null;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
  subcategoria?: ICCRISubcategoria;
  categoria?: ICCRICategoria;
}

export interface ICCRIComposicao {
  id: string;
  servico_id: string;
  versao: number;
  descricao: string | null;
  valida_de: string;
  valida_ate: string | null;
  ativa: boolean;
  criado_em: string;
}

export interface ICCRIComposicaoItem {
  id: string;
  composicao_id: string;
  tipo: "material" | "mdo" | "equipamento";
  nome: string;
  unidade: string;
  quantidade: number;
  coeficiente: number;
  fator_perda: number;
  codigo_sinapi: string | null;
  preco_ref_sp: number | null;
  observacao: string | null;
}

export interface ICCRIPrecoRegional {
  id: string;
  composicao_item_id: string | null;
  servico_id: string | null;
  estado: string;
  cidade_tipo: "capital" | "interior";
  preco_basico: number;
  preco_intermediario: number;
  preco_alto: number;
  competencia: string;
  fonte: "sinapi" | "iccri_wg" | "mercado";
  atualizado_em: string;
}

export interface ICCRIEncargo {
  id: string;
  profissao: string;
  salario_base: number;
  encargos_fator: number;
  horas_mes: number;
  custo_hora: number;
  estado: string;
  competencia: string;
}

export interface ICCRIindice {
  id: string;
  mes: string;
  valor_iccri: number;
  variacao_mensal: number;
  variacao_anual: number;
  incc: number;
  fonte: string;
  publicado_em: string;
}

// â”€â”€â”€ Stats para Dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface ICCRIStats {
  totalMacrocategorias: number;
  totalCategorias: number;
  totalSubcategorias: number;
  totalServicos: number;
  totalComposicoes: number;
  totalItensComposicao: number;
  servicosSemComposicao: number;
  indiceMesAtual: ICCRIindice | null;
}

// â”€â”€â”€ Macrocategorias â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getMacrocategorias(): Promise<ICCRIMacrocategoria[]> {
  const { data, error } = await supabase
    .from("iccri_macrocategorias")
    .select("*")
    .order("ordem");
  if (error) throw error;
  return data ?? [];
}

// â”€â”€â”€ Categorias â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getCategorias(macrocategoria_id?: string): Promise<ICCRICategoria[]> {
  let q = supabase
    .from("iccri_categorias")
    .select("*, macrocategoria:iccri_macrocategorias(id,codigo,nome)")
    .order("ordem");
  if (macrocategoria_id) q = q.eq("macrocategoria_id", macrocategoria_id);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function upsertCategoria(
  payload: Partial<ICCRICategoria>
): Promise<ICCRICategoria> {
  const { data, error } = await supabase
    .from("iccri_categorias")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// â”€â”€â”€ Subcategorias â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getSubcategorias(categoria_id?: string): Promise<ICCRISubcategoria[]> {
  let q = supabase
    .from("iccri_subcategorias")
    .select("*, categoria:iccri_categorias(id,codigo,nome,cor_hex)")
    .order("ordem");
  if (categoria_id) q = q.eq("categoria_id", categoria_id);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function upsertSubcategoria(
  payload: Partial<ICCRISubcategoria>
): Promise<ICCRISubcategoria> {
  const { data, error } = await supabase
    .from("iccri_subcategorias")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// â”€â”€â”€ Serviços â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getServicos(filtros?: {
  categoria_id?: string;
  subcategoria_id?: string;
  tipo?: string;
  padrao?: string;
  busca?: string;
  ativo?: boolean;
}): Promise<ICCRIServico[]> {
  let q = supabase
    .from("iccri_servicos")
    .select(`
      *,
      subcategoria:iccri_subcategorias(id,codigo,nome),
      categoria:iccri_categorias(id,codigo,nome,cor_hex)
    `)
    .order("codigo");

  if (filtros?.categoria_id)    q = q.eq("categoria_id", filtros.categoria_id);
  if (filtros?.subcategoria_id) q = q.eq("subcategoria_id", filtros.subcategoria_id);
  if (filtros?.tipo)            q = q.eq("tipo", filtros.tipo);
  if (filtros?.padrao)          q = q.eq("padrao", filtros.padrao);
  if (filtros?.ativo !== undefined) q = q.eq("ativo", filtros.ativo);
  if (filtros?.busca)           q = q.ilike("nome", `%${filtros.busca}%`);

  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getServico(id: string): Promise<ICCRIServico | null> {
  const { data, error } = await supabase
    .from("iccri_servicos")
    .select(`
      *,
      subcategoria:iccri_subcategorias(id,codigo,nome),
      categoria:iccri_categorias(id,codigo,nome,cor_hex)
    `)
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export async function upsertServico(
  payload: Partial<ICCRIServico>
): Promise<ICCRIServico> {
  const { data, error } = await supabase
    .from("iccri_servicos")
    .upsert({ ...payload, atualizado_em: new Date().toISOString() }, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteServico(id: string): Promise<void> {
  // Soft delete
  const { error } = await supabase
    .from("iccri_servicos")
    .update({ ativo: false, atualizado_em: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

// â”€â”€â”€ ComposiçÍµes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getComposicoesByServico(servico_id: string): Promise<ICCRIComposicao[]> {
  const { data, error } = await supabase
    .from("iccri_composicoes")
    .select("*")
    .eq("servico_id", servico_id)
    .order("versao", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getComposicaoItens(composicao_id: string): Promise<ICCRIComposicaoItem[]> {
  const { data, error } = await supabase
    .from("iccri_composicao_itens")
    .select("*")
    .eq("composicao_id", composicao_id)
    .order("tipo");
  if (error) throw error;
  return data ?? [];
}

export async function upsertComposicaoItem(
  payload: Partial<ICCRIComposicaoItem>
): Promise<ICCRIComposicaoItem> {
  const { data, error } = await supabase
    .from("iccri_composicao_itens")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteComposicaoItem(id: string): Promise<void> {
  const { error } = await supabase
    .from("iccri_composicao_itens")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// â”€â”€â”€ Preços Regionais â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getPrecosRegionais(servico_id?: string): Promise<ICCRIPrecoRegional[]> {
  let q = supabase
    .from("iccri_precos_regionais")
    .select("*")
    .order("estado");
  if (servico_id) q = q.eq("servico_id", servico_id);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function upsertPrecoRegional(
  payload: Partial<ICCRIPrecoRegional>
): Promise<ICCRIPrecoRegional> {
  const { data, error } = await supabase
    .from("iccri_precos_regionais")
    .upsert({ ...payload, atualizado_em: new Date().toISOString() }, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePrecoRegional(id: string): Promise<void> {
  const { error } = await supabase.from("iccri_precos_regionais").delete().eq("id", id);
  if (error) throw error;
}

// â”€â”€â”€ ÍÍndice ICCRI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getindiceAtual(): Promise<ICCRIindice | null> {
  const { data, error } = await supabase
    .from("iccri_indice")
    .select("*")
    .order("competencia", { ascending: false })
    .limit(1)
    .single();
  if (error) return null;
  return data;
}

export async function getHistoricoindice(meses = 12): Promise<ICCRIindice[]> {
  const { data, error } = await supabase
    .from("iccri_indice")
    .select("*")
    .order("competencia", { ascending: false })
    .limit(meses);
  if (error) throw error;
  return data ?? [];
}

// â”€â”€â”€ Encargos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getEncargos(estado = "SP"): Promise<ICCRIEncargo[]> {
  const { data, error } = await supabase
    .from("iccri_encargos")
    .select("*")
    .eq("estado", estado)
    .order("profissao");
  if (error) throw error;
  return data ?? [];
}

// â”€â”€â”€ Stats Dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getICCRIStats(): Promise<ICCRIStats> {
  const [
    { count: totalMacrocategorias },
    { count: totalCategorias },
    { count: totalSubcategorias },
    { count: totalServicos },
    { count: totalComposicoes },
    { count: totalItensComposicao },
    indice,
  ] = await Promise.all([
    supabase.from("iccri_macrocategorias").select("*", { count: "exact", head: true }),
    supabase.from("iccri_categorias").select("*", { count: "exact", head: true }),
    supabase.from("iccri_subcategorias").select("*", { count: "exact", head: true }),
    supabase.from("iccri_servicos").select("*", { count: "exact", head: true }).eq("ativo", true),
    supabase.from("iccri_composicoes").select("*", { count: "exact", head: true }).eq("ativa", true),
    supabase.from("iccri_composicao_itens").select("*", { count: "exact", head: true }),
    getindiceAtual(),
  ]);

  // Serviços sem composiçÍo ativa
  const { count: comComposicao } = await supabase
    .from("iccri_composicoes")
    .select("servico_id", { count: "exact", head: true })
    .eq("ativa", true);

  return {
    totalMacrocategorias: totalMacrocategorias ?? 0,
    totalCategorias: totalCategorias ?? 0,
    totalSubcategorias: totalSubcategorias ?? 0,
    totalServicos: totalServicos ?? 0,
    totalComposicoes: totalComposicoes ?? 0,
    totalItensComposicao: totalItensComposicao ?? 0,
    servicosSemComposicao: (totalServicos ?? 0) - (comComposicao ?? 0),
    indiceMesAtual: indice,
  };
}

// â”€â”€â”€ Cálculo de preço por composiçÍo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Fórmula: Preço = (Î£MDOi + Î£MATi + Î£EQPi) Í— fatorRegional Í— índiceICCRI Í— margem

export interface CalculoComposicaoInput {
  composicao_id: string;
  quantidade: number;
  estado: string;
  cidade_tipo: "capital" | "interior";
  padrao: "basico" | "intermediario" | "alto";
  margem?: number; // ex: 1.22 = 22%
}

export interface CalculoComposicaoOutput {
  custo_mdo: number;
  custo_materiais: number;
  custo_equipamentos: number;
  custo_base: number;
  fator_regional: number;
  fator_iccri: number;
  margem: number;
  preco_final: number;
  preco_por_unidade: number;
  itens: {
    nome: string;
    tipo: string;
    quantidade_total: number;
    unidade: string;
    preco_unit: number;
    total: number;
  }[];
}

const FATOR_REGIONAL: Record<string, { capital: number; interior: number }> = {
  SP: { capital: 1.00, interior: 0.83 }, RJ: { capital: 0.95, interior: 0.82 },
  MG: { capital: 0.86, interior: 0.76 }, ES: { capital: 0.83, interior: 0.75 },
  DF: { capital: 0.93, interior: 0.93 }, GO: { capital: 0.82, interior: 0.74 },
  MT: { capital: 0.80, interior: 0.72 }, MS: { capital: 0.80, interior: 0.73 },
  PR: { capital: 0.89, interior: 0.80 }, SC: { capital: 0.90, interior: 0.82 },
  RS: { capital: 0.87, interior: 0.79 }, BA: { capital: 0.80, interior: 0.71 },
  PE: { capital: 0.79, interior: 0.70 }, CE: { capital: 0.79, interior: 0.69 },
  MA: { capital: 0.74, interior: 0.66 }, PI: { capital: 0.73, interior: 0.65 },
  RN: { capital: 0.76, interior: 0.68 }, PB: { capital: 0.75, interior: 0.67 },
  AL: { capital: 0.74, interior: 0.66 }, SE: { capital: 0.76, interior: 0.68 },
  PA: { capital: 0.75, interior: 0.67 }, AM: { capital: 0.77, interior: 0.69 },
  AC: { capital: 0.72, interior: 0.64 }, RO: { capital: 0.73, interior: 0.65 },
  RR: { capital: 0.71, interior: 0.63 }, AP: { capital: 0.72, interior: 0.64 },
  TO: { capital: 0.73, interior: 0.65 },
};

export async function calcularComposicao(
  input: CalculoComposicaoInput
): Promise<CalculoComposicaoOutput> {
  const itens = await getComposicaoItens(input.composicao_id);
  const indice = await getindiceAtual();
  const iccriAtual = indice?.valor_iccri ?? 174.1;
  const baseIccri = 100;
  const fatorIccri = iccriAtual / baseIccri;

  const fatorReg = FATOR_REGIONAL[input.estado.toUpperCase()]?.[input.cidade_tipo] ?? 0.80;
  const margem = input.margem ?? 1.22;

  const padroPreco: Record<string, keyof ICCRIPrecoRegional> = {
    basico: "preco_basico",
    intermediario: "preco_intermediario",
    alto: "preco_alto",
  };

  // Buscar preços regionais para os itens
  const precos = await getPrecosRegionais();
  const precosMap = new Map(precos.map(p => [p.composicao_item_id, p]));

  let custo_mdo = 0, custo_materiais = 0, custo_equipamentos = 0;
  const itensCalculados = itens.map(item => {
    const precoReg = precosMap.get(item.id);
    const precoKey = padroPreco[input.padrao];
    const preco_unit = precoReg
      ? ((precoReg[precoKey] as number) ?? item.preco_ref_sp ?? 0)
      : (item.preco_ref_sp ?? 0);

    const qtd_total = item.quantidade * input.quantidade * (1 + item.fator_perda);
    const total = qtd_total * preco_unit;

    if (item.tipo === "mdo")        custo_mdo         += total;
    if (item.tipo === "material")   custo_materiais   += total;
    if (item.tipo === "equipamento") custo_equipamentos += total;

    return { nome: item.nome, tipo: item.tipo, quantidade_total: qtd_total, unidade: item.unidade, preco_unit, total };
  });

  const custo_base = custo_mdo + custo_materiais + custo_equipamentos;
  const preco_final = custo_base * fatorReg * fatorIccri * margem;

  return {
    custo_mdo, custo_materiais, custo_equipamentos, custo_base,
    fator_regional: fatorReg, fator_iccri: fatorIccri, margem,
    preco_final, preco_por_unidade: input.quantidade > 0 ? preco_final / input.quantidade : preco_final,
    itens: itensCalculados,
  };
}



