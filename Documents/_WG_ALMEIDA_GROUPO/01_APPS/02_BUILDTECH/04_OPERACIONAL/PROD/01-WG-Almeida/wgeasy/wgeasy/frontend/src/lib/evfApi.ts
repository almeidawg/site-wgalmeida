// ============================================================================
// API DO MÓDULO EVF - Estudo de Viabilidade Financeira
// Sistema WG Easy - Grupo WG Almeida
// ============================================================================

import { supabase } from "@/lib/supabaseClient";
import type {
  EVFEstudoCompleto,
  EVFEstudoFormData,
  EVFItem,
  EVFCategoriaConfig,
  PadraoAcabamento,
} from "@/types/evf";
import {
  calcularItensEVF,
  calcularTotaisEVF,
  calcularPercentuais,
  CATEGORIAS_EVF_CONFIG,
} from "@/types/evf";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
const INTERNAL_API_KEY = import.meta.env.VITE_INTERNAL_API_KEY || "";

export interface EVFPublicoResumo {
  token: string;
  status: "pendente" | "aprovado" | "rejeitado";
  data_envio: string;
  data_acao: string | null;
  observacao: string | null;
  estudo: EVFEstudoCompleto;
}

export interface EVFPublicLinkResult {
  token: string;
  linkPublico: string;
  status: "pendente" | "aprovado" | "rejeitado";
}

// ============================================================================
// CONFIGURAÇÍO DE CATEGORIAS
// ============================================================================

/**
 * Busca configuraçÍo das categorias do EVF
 */
export async function buscarCategoriasConfig(): Promise<EVFCategoriaConfig[]> {
  const { data, error } = await supabase
    .from("evf_categorias_config")
    .select("*")
    .eq("ativo", true)
    .order("ordem", { ascending: true });

  if (error) {
    console.error("Erro ao buscar categorias EVF:", error);
    // Retorna valores padrÍo se não encontrar no banco
    return CATEGORIAS_EVF_CONFIG.map((c, index) => ({
      id: `default-${index}`,
      codigo: c.id,
      nome: c.nome,
      valor_m2_padrao: c.valorM2Padrao,
      icone: c.icone,
      cor: c.cor,
      ordem: c.ordem,
      ativo: true,
      updated_at: new Date().toISOString(),
      fase: c.fase,
      fase_nome: c.fase_nome,
      tipo: c.tipo,
    }));
  }

  return data || [];
}

export async function sincronizarCategoriasEVFComPricelist(): Promise<{
  sincronizadas: number;
  total: number;
  sem_match: number;
}> {
  const { data, error } = await supabase.rpc(
    "sincronizar_evf_categorias_com_pricelist"
  );

  if (error) {
    console.warn(
      "[EVF] Falha ao sincronizar categorias com pricelist:",
      error.message
    );
    return { sincronizadas: 0, total: 0, sem_match: 0 };
  }

  const linhas = Array.isArray(data) ? data : [];
  return {
    sincronizadas: linhas.filter((row: any) => Boolean(row?.atualizado)).length,
    total: linhas.length,
    sem_match: linhas.filter((row: any) => Number(row?.fonte_itens || 0) === 0)
      .length,
  };
}

/**
 * Atualiza valor padrÍo de uma categoria
 */
export async function atualizarCategoriaConfig(
  codigo: string,
  valorM2Padrao: number
): Promise<EVFCategoriaConfig> {
  const { data, error } = await supabase
    .from("evf_categorias_config")
    .update({ valor_m2_padrao: valorM2Padrao })
    .eq("codigo", codigo)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar categoria: ${error.message}`);
  }

  return data;
}

// ============================================================================
// CRUD DE ESTUDOS
// ============================================================================

/**
 * Lista todos os estudos EVF
 */
export async function listarEstudos(): Promise<EVFEstudoCompleto[]> {
  // Buscar estudos pela view, que já traz os campos prontos
  const { data, error } = await supabase
    .from("evf_estudos_vw")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    // View pode não existir - retorna vazio
    console.warn("EVF: View evf_estudos_vw não disponível:", error.message);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Buscar itens de cada estudo (se necessário)
  const estudosComItens = await Promise.all(
    data.map(async (estudo) => {
      const itens = await buscarItensEstudo(estudo.id);
      return {
        ...estudo,
        cliente: estudo.cliente_id ? { id: estudo.cliente_id, nome: estudo.cliente_nome || null } : null,
        itens,
      } as EVFEstudoCompleto;
    })
  );

  return estudosComItens;
}

/**
 * Lista estudos de um cliente específico
 */
export async function listarEstudosPorCliente(
  clienteId: string
): Promise<EVFEstudoCompleto[]> {
  const { data, error } = await supabase
    .from("evf_estudos")
    .select(`
      *,
      analise_projeto:analises_projeto(id, titulo),
      cliente:pessoas(id, nome)
    `)
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Erro ao listar estudos do cliente: ${error.message}`);
  }

  const estudosComItens = await Promise.all(
    (data || []).map(async (estudo) => {
      const itens = await buscarItensEstudo(estudo.id);
      return { ...estudo, itens } as EVFEstudoCompleto;
    })
  );

  return estudosComItens;
}

/**
 * Busca um estudo específico
 */
export async function buscarEstudo(id: string): Promise<EVFEstudoCompleto> {
  console.log('🔍 [evfApi] buscarEstudo - ID:', id);

  // Primeiro buscar estudo base (sem joins que podem falhar)
  const { data: estudoBase, error: erroBase } = await supabase
    .from("evf_estudos")
    .select("*")
    .eq("id", id)
    .single();

  if (erroBase) {
    console.error('❌ [evfApi] Erro ao buscar estudo:', erroBase);
    throw new Error(`Erro ao buscar estudo: ${erroBase.message}`);
  }

  if (!estudoBase) {
    throw new Error('Estudo não encontrado');
  }

  console.log('📊 [evfApi] Estudo base encontrado:', {
    id: estudoBase?.id,
    titulo: estudoBase?.titulo,
    metragem: estudoBase?.metragem_total,
    padrao: estudoBase?.padrao_acabamento,
    cliente_id: estudoBase?.cliente_id,
  });

  // Buscar cliente separadamente se existir cliente_id
  let cliente = null;
  if (estudoBase.cliente_id) {
    const { data: clienteData } = await supabase
      .from("pessoas")
      .select("id, nome")
      .eq("id", estudoBase.cliente_id)
      .maybeSingle();
    cliente = clienteData;
  }

  // Buscar analise_projeto separadamente se existir analise_projeto_id
  let analise_projeto = null;
  if (estudoBase.analise_projeto_id) {
    const { data: analiseData } = await supabase
      .from("analises_projeto")
      .select("id, titulo, total_area_piso")
      .eq("id", estudoBase.analise_projeto_id)
      .maybeSingle();
    if (analiseData) {
      analise_projeto = {
        id: analiseData.id,
        titulo: analiseData.titulo,
        area_total: analiseData.total_area_piso,
      };
    }
  }

  const itens = await buscarItensEstudo(id);
  console.log('📋 [evfApi] Itens carregados:', itens?.length || 0);

  return {
    ...estudoBase,
    cliente,
    analise_projeto,
    itens,
  } as EVFEstudoCompleto;
}

/**
 * Cria um novo estudo
 */
export async function criarEstudo(
  dados: EVFEstudoFormData
): Promise<EVFEstudoCompleto> {


  // Buscar pessoa vinculada ao usuário autenticado
  const { data: { user } } = await supabase.auth.getUser();
  let pessoaId: string | null = null;
  if (user?.id) {
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("pessoa_id")
      .eq("auth_user_id", user.id)
      .single();
    pessoaId = usuario?.pessoa_id || null;
  }

  // ValidaçÍo básica do payload
  if (!dados.cliente_id || !dados.titulo || !dados.metragem_total || !dados.padrao_acabamento || !pessoaId) {
    throw new Error("Campos obrigatórios faltando para criar estudo (cliente_id, titulo, metragem_total, padrao_acabamento ou created_by).");
  }


  // Montar payload sem analise_projeto_id se não informado
  const payload: Record<string, any> = {
    cliente_id: dados.cliente_id,
    titulo: dados.titulo,
    metragem_total: dados.metragem_total,
    padrao_acabamento: dados.padrao_acabamento,
    created_by: pessoaId,
  };
  if (dados.observacoes) payload.observacoes = dados.observacoes;
  if (dados.analise_projeto_id) payload.analise_projeto_id = dados.analise_projeto_id;
  // Log para debug
  if (typeof window !== 'undefined') console.log('Payload estudo:', payload);

  // Criar estudo com header Accept forçado
  const { data: estudo, error: erroEstudo } = await supabase
    .from("evf_estudos")
    .insert(payload)
    .select()
    .single();

  if (erroEstudo) {
    throw new Error(`Erro ao criar estudo: ${erroEstudo.message}`);
  }

  // Buscar configuraçÍo de categorias
  const categoriasConfig = await buscarCategoriasConfig();

  // Calcular itens
  const itens = calcularItensEVF(
    dados.metragem_total,
    dados.padrao_acabamento,
    categoriasConfig
  );

  // Salvar itens
  await salvarItensEstudo(estudo.id, itens);

  // Recalcular totais
  await recalcularTotais(estudo.id);

  // Retornar estudo completo
  return buscarEstudo(estudo.id);
}

/**
 * Atualiza um estudo existente (apenas dados básicos, sem recalcular itens)
 */
export async function atualizarEstudo(
  id: string,
  dados: Partial<EVFEstudoFormData>
): Promise<EVFEstudoCompleto> {
  console.log('📝 API: atualizarEstudo iniciado', { id, dados });

  // Montar payload apenas com campos definidos
  const payload: Record<string, any> = {};
  if (dados.titulo !== undefined) payload.titulo = dados.titulo;
  if (dados.cliente_id !== undefined) payload.cliente_id = dados.cliente_id;
  if (dados.metragem_total !== undefined) payload.metragem_total = dados.metragem_total;
  if (dados.padrao_acabamento !== undefined) payload.padrao_acabamento = dados.padrao_acabamento;
  if (dados.observacoes !== undefined) payload.observacoes = dados.observacoes;

  console.log('📝 API: payload do update', payload);

  const { error } = await supabase
    .from("evf_estudos")
    .update(payload)
    .eq("id", id);

  if (error) {
    console.error('❌ API: erro no update', error);
    throw new Error(`Erro ao atualizar estudo: ${error.message}`);
  }

  console.log('✅ API: update concluído com sucesso');

  // não recalcular itens aqui - isso é feito pelo frontend se necessário
  // Os itens sÍo atualizados separadamente via atualizarItemEstudoReal

  return buscarEstudo(id);
}

/**
 * Deleta um estudo
 */
export async function deletarEstudo(id: string): Promise<void> {
  const { error } = await supabase
    .from("evf_estudos")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Erro ao deletar estudo: ${error.message}`);
  }
}

/**
 * Duplica um estudo
 */
export async function duplicarEstudo(id: string): Promise<EVFEstudoCompleto> {
  const estudoOriginal = await buscarEstudo(id);

  const novoEstudo = await criarEstudo({
    analise_projeto_id: estudoOriginal.analise_projeto_id || undefined,  // Pode ser null
    cliente_id: estudoOriginal.cliente_id || "",  // Obrigatório
    titulo: `${estudoOriginal.titulo} (Cópia)`,
    metragem_total: estudoOriginal.metragem_total,
    padrao_acabamento: estudoOriginal.padrao_acabamento,
    observacoes: estudoOriginal.observacoes || undefined,
  });

  // Copiar valores editados manualmente
  const itensOriginais = estudoOriginal.itens;
  const itensNovos = novoEstudo.itens.map((item) => {
    const itemOriginal = itensOriginais.find((i) => i.categoria === item.categoria);
    return {
      ...item,
      valorEstudoReal: itemOriginal?.valorEstudoReal ?? item.valorPrevisao,
    };
  });

  await salvarItensEstudo(novoEstudo.id, calcularPercentuais(itensNovos));
  await recalcularTotais(novoEstudo.id);

  return buscarEstudo(novoEstudo.id);
}

// ============================================================================
// ITENS DO ESTUDO
// ============================================================================

/**
 * Busca itens de um estudo
 */
export async function buscarItensEstudo(estudoId: string): Promise<EVFItem[]> {
  console.log('🔍 [evfApi] buscarItensEstudo - estudoId:', estudoId);

  const { data, error } = await supabase
    .from("evf_estudos_itens")
    .select("*")
    .eq("estudo_id", estudoId)
    .order("ordem", { ascending: true });

  if (error) {
    console.error("❌ [evfApi] Erro ao buscar itens:", error);
    return [];
  }

  console.log('📋 [evfApi] Itens encontrados:', data?.length || 0);

  return (data || []).map((item) => ({
    id: item.id,
    estudo_id: item.estudo_id,
    categoria: item.categoria as string,
    nome: item.nome,
    valorM2Base: item.valor_m2_base,
    valorM2Ajustado: item.valor_m2_ajustado,
    valorPrevisao: item.valor_previsao,
    valorMinimo: item.valor_minimo,
    valorMaximo: item.valor_maximo,
    valorEstudoReal: item.valor_estudo_real,
    percentualTotal: item.percentual_total,
    ordem: item.ordem,
  }));
}

/**
 * Salva itens de um estudo (substitui todos)
 */
export async function salvarItensEstudo(
  estudoId: string,
  itens: EVFItem[]
): Promise<void> {
  // Deletar itens existentes
  await supabase
    .from("evf_estudos_itens")
    .delete()
    .eq("estudo_id", estudoId);

  // Inserir novos itens
  const itensParaInserir = itens.map((item) => ({
    estudo_id: estudoId,
    categoria: item.categoria,
    nome: item.nome,
    valor_m2_base: item.valorM2Base,
    valor_m2_ajustado: item.valorM2Ajustado,
    valor_previsao: item.valorPrevisao,
    valor_minimo: item.valorMinimo,
    valor_maximo: item.valorMaximo,
    valor_estudo_real: item.valorEstudoReal,
    percentual_total: item.percentualTotal,
    ordem: item.ordem,
  }));

  const { error } = await supabase
    .from("evf_estudos_itens")
    .insert(itensParaInserir);

  if (error) {
    throw new Error(`Erro ao salvar itens: ${error.message}`);
  }
}

/**
 * Atualiza valor de estudo real de um item específico
 */
export async function atualizarItemEstudoReal(
  estudoId: string,
  categoria: string,
  valorEstudoReal: number
): Promise<void> {
  const { error } = await supabase
    .from("evf_estudos_itens")
    .update({ valor_estudo_real: valorEstudoReal })
    .eq("estudo_id", estudoId)
    .eq("categoria", categoria);

  if (error) {
    throw new Error(`Erro ao atualizar item: ${error.message}`);
  }

  // Recalcular totais e percentuais
  await recalcularTotais(estudoId);
}

// ============================================================================
// CÁLCULOS
// ============================================================================

/**
 * Recalcula totais de um estudo
 */
export async function recalcularTotais(estudoId: string): Promise<void> {
  // Buscar estudo e itens
  const { data: estudo, error: erroEstudo } = await supabase
    .from("evf_estudos")
    .select("metragem_total")
    .eq("id", estudoId)
    .single();

  if (erroEstudo) {
    throw new Error(`Erro ao buscar estudo: ${erroEstudo.message}`);
  }

  const itens = await buscarItensEstudo(estudoId);
  const totais = calcularTotaisEVF(itens, estudo.metragem_total);

  // Atualizar estudo
  const { error: erroUpdate } = await supabase
    .from("evf_estudos")
    .update({
      valor_total: totais.valorTotal,
      valor_m2_medio: totais.valorM2Medio,
    })
    .eq("id", estudoId);

  if (erroUpdate) {
    throw new Error(`Erro ao atualizar totais: ${erroUpdate.message}`);
  }

  // Recalcular percentuais dos itens
  const itensComPercentuais = calcularPercentuais(itens);

  for (const item of itensComPercentuais) {
    await supabase
      .from("evf_estudos_itens")
      .update({ percentual_total: item.percentualTotal })
      .eq("estudo_id", estudoId)
      .eq("categoria", item.categoria);
  }
}

/**
 * Recalcula todos os valores de um estudo (após mudança de metragem/padrÍo)
 */
export async function recalcularEstudoCompleto(
  estudoId: string,
  metragem: number,
  padrao: PadraoAcabamento
): Promise<EVFEstudoCompleto> {
  const categoriasConfig = await buscarCategoriasConfig();
  const novosItens = calcularItensEVF(metragem, padrao, categoriasConfig);

  await salvarItensEstudo(estudoId, novosItens);
  await recalcularTotais(estudoId);

  return buscarEstudo(estudoId);
}

// ============================================================================
// ANÁLISE DE PROJETO
// ============================================================================

/**
 * Busca análises de projeto aprovadas para seleçÍo
 */
export async function buscarAnalisesAprovadas(): Promise<
  Array<{
    id: string;
    titulo: string;
    area_total: number;
    cliente_id: string | null;
    cliente_nome: string | null;
  }>
> {
  // Query simples primeiro, sem join que pode falhar
  const { data, error } = await supabase
    .from("analises_projeto")
    .select("id, titulo, total_area_piso, cliente_id")
    .in("status", ["analisado", "aprovado"])
    .order("id", { ascending: false });

  if (error) {
    console.error("Erro ao buscar análises:", error);
    // Tentar query alternativa sem filtro de status
    const { data: dataAlt, error: errorAlt } = await supabase
      .from("analises_projeto")
      .select("id, titulo, total_area_piso, cliente_id")
      .order("id", { ascending: false })
      .limit(50);

    if (errorAlt) {
      console.error("Erro na query alternativa:", errorAlt);
      return [];
    }

    return (dataAlt || []).map((analise: any) => ({
      id: analise.id,
      titulo: analise.titulo || "Análise sem título",
      area_total: analise.total_area_piso || 0,
      cliente_id: analise.cliente_id || null,
      cliente_nome: null,
    }));
  }

  // Se tiver cliente_id, buscar nomes dos clientes
  const clienteIds = [...new Set((data || []).map((a: any) => a.cliente_id).filter(Boolean))];
  let clientesMap: Record<string, string> = {};

  if (clienteIds.length > 0) {
    const { data: clientes } = await supabase
      .from("pessoas")
      .select("id, nome")
      .in("id", clienteIds);

    if (clientes) {
      clientesMap = Object.fromEntries(clientes.map((c: any) => [c.id, c.nome]));
    }
  }

  return (data || []).map((analise: any) => ({
    id: analise.id,
    titulo: analise.titulo || "Análise sem título",
    area_total: analise.total_area_piso || 0,
    cliente_id: analise.cliente_id || null,
    cliente_nome: analise.cliente_id ? (clientesMap[analise.cliente_id] || null) : null,
  }));
}

// ============================================================================
// ESTATÍSTICAS
// ============================================================================

/**
 * Busca estatísticas de estudos EVF
 */
export async function buscarEstatisticasEVF(): Promise<{
  totalEstudos: number;
  valorMedioTotal: number;
  valorMedioM2: number;
  distribuicaoPadrao: Record<PadraoAcabamento, number>;
}> {
  const { data, error } = await supabase
    .from("evf_estudos")
    .select("valor_total, valor_m2_medio, padrao_acabamento");

  if (error) {
    // Tabela pode não existir - retorna valores zerados
    console.warn("EVF: Tabela evf_estudos não disponível para estatísticas");
    return {
      totalEstudos: 0,
      valorMedioTotal: 0,
      valorMedioM2: 0,
      distribuicaoPadrao: { economico: 0, medio_alto: 0, alto_luxo: 0 },
    };
  }

  const estudos = data || [];
  const totalEstudos = estudos.length;

  const valorMedioTotal =
    totalEstudos > 0
      ? estudos.reduce((sum, e) => sum + (e.valor_total || 0), 0) / totalEstudos
      : 0;

  const valorMedioM2 =
    totalEstudos > 0
      ? estudos.reduce((sum, e) => sum + (e.valor_m2_medio || 0), 0) / totalEstudos
      : 0;

  const distribuicaoPadrao: Record<PadraoAcabamento, number> = {
    economico: 0,
    medio_alto: 0,
    alto_luxo: 0,
  };

  estudos.forEach((e) => {
    const padrao = e.padrao_acabamento as PadraoAcabamento;
    if (padrao in distribuicaoPadrao) {
      distribuicaoPadrao[padrao]++;
    }
  });

  return {
    totalEstudos,
    valorMedioTotal,
    valorMedioM2,
    distribuicaoPadrao,
  };
}

// ============================================================================
// FLUXO PÚBLICO DE APROVAÇÍO (TOKEN)
// ============================================================================

export async function gerarLinkPublicoEVF(
  estudoId: string,
  conteudoHtml: string,
  canal?: "email" | "whatsapp" | "manual"
): Promise<EVFPublicLinkResult> {
  const response = await fetch(`${BACKEND_URL}/api/evf/public-link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-key": INTERNAL_API_KEY,
    },
    body: JSON.stringify({
      estudoId,
      conteudoHtml,
      canal: canal || "manual",
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error || "não foi possível gerar link público do EVF");
  }

  return response.json();
}

export async function buscarEVFPublicoPorToken(token: string): Promise<EVFPublicoResumo> {
  const response = await fetch(`${BACKEND_URL}/api/evf/public/${token}`);

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error || "EVF público não encontrado");
  }

  return response.json();
}

export async function registrarAcaoPublicaEVF(
  token: string,
  acao: "aprovar" | "rejeitar",
  observacao?: string
): Promise<{ status: "aprovado" | "rejeitado"; data_acao: string }> {
  const response = await fetch(`${BACKEND_URL}/api/evf/public/${token}/action`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ acao, observacao: observacao || null }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error || "não foi possível registrar açÍo do cliente");
  }

  return response.json();
}


