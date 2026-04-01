/**
 * API para Área do Fornecedor
 * Gerencia cotações, propostas, serviços contratados e financeiro do fornecedor
 */

import { supabase } from "./supabaseClient";

// ============================================================================
// TIPOS
// ============================================================================

export interface FornecedorCategoria {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  icone?: string;
  ativo: boolean;
}

export interface FornecedorCategoriaVinculo {
  id: string;
  fornecedor_id: string;
  categoria_id: string;
  principal: boolean;
  categoria?: FornecedorCategoria;
}

export type StatusCotacao =
  | "aberta"
  | "em_andamento"
  | "encerrada"
  | "cancelada";

export interface Cotacao {
  id: string;
  numero_cotacao?: string;
  projeto_id?: string;
  projeto_nome?: string;
  categoria_id: string;
  titulo: string;
  descricao?: string;
  data_abertura: string;
  data_limite: string;
  prazo_execucao_dias?: number;
  status: StatusCotacao;
  permite_proposta_parcial: boolean;
  exige_visita_tecnica: boolean;
  fornecedor_vencedor_id?: string;
  data_fechamento?: string;
  observacao_fechamento?: string;
  criado_em: string;
  criado_por?: string;
  // Joins
  categoria?: FornecedorCategoria;
  itens?: CotacaoItem[];
  fornecedores_convidados?: CotacaoFornecedor[];
  propostas?: CotacaoProposta[];
}

export interface CotacaoItem {
  id: string;
  cotacao_id: string;
  descricao: string;
  unidade?: string;
  quantidade?: number;
  especificacao?: string;
  referencia?: string;
  ordem: number;
}

export interface CotacaoFornecedor {
  id: string;
  cotacao_id: string;
  fornecedor_id: string;
  data_convite: string;
  visualizado: boolean;
  data_visualizacao?: string;
  participando?: boolean;
  motivo_declinio?: string;
  // Join
  fornecedor?: {
    id: string;
    nome: string;
    email?: string;
    telefone?: string;
  };
}

export type StatusPropostaFornecedor =
  | "rascunho"
  | "enviada"
  | "em_analise"
  | "aprovada"
  | "rejeitada"
  | "vencedora";

export interface CotacaoProposta {
  id: string;
  cotacao_id: string;
  fornecedor_id: string;
  valor_total: number;
  prazo_execucao_dias?: number;
  validade_proposta_dias: number;
  condicoes_pagamento?: string;
  observacoes?: string;
  garantia_meses?: number;
  descricao_garantia?: string;
  status: StatusPropostaFornecedor;
  data_envio?: string;
  nota_interna?: number;
  comentario_interno?: string;
  criado_em: string;
  atualizado_em: string;
  // Joins
  fornecedor?: { nome: string; empresa?: string };
  itens?: CotacaoPropostaItem[];
  anexos?: CotacaoPropostaAnexo[];
}

export interface CotacaoPropostaItem {
  id: string;
  proposta_id: string;
  item_id: string;
  valor_unitario: number;
  valor_total: number;
  marca_modelo?: string;
  observacao?: string;
  // Join
  item?: CotacaoItem;
}

export interface CotacaoPropostaAnexo {
  id: string;
  proposta_id: string;
  nome: string;
  tipo?: string;
  arquivo_url: string;
  tamanho_bytes?: number;
}

export type StatusServicoContratado =
  | "contratado"
  | "em_execucao"
  | "pausado"
  | "concluido"
  | "cancelado";

export interface FornecedorServico {
  id: string;
  fornecedor_id: string;
  projeto_id: string;
  cotacao_id?: string;
  proposta_id?: string;
  descricao: string;
  categoria_id?: string;
  valor_contratado: number;
  data_contratacao: string;
  data_inicio_prevista?: string;
  data_fim_prevista?: string;
  data_conclusao?: string;
  status: StatusServicoContratado;
  percentual_execucao: number;
  condicoes_pagamento?: string;
  garantia_meses?: number;
  criado_em: string;
  criado_por?: string;
  // Joins
  projeto?: { numero_contrato?: string; cliente_nome?: string };
  categoria?: FornecedorCategoria;
  parcelas?: FornecedorServicoParcela[];
}

export interface FornecedorServicoParcela {
  id: string;
  servico_id: string;
  numero_parcela: number;
  descricao?: string;
  valor: number;
  data_vencimento?: string;
  condicao?: string;
  data_pagamento?: string;
  valor_pago?: number;
  comprovante_url?: string;
  lancamento_id?: string;
}

export interface ResumoFinanceiroFornecedor {
  valor_contratado: number;
  valor_pago: number;
  valor_pendente: number;
  total_servicos: number;
}

export interface FornecedorCompleto {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  empresa?: string;
  avatar_url?: string;
  ativo: boolean;
  auth_user_id?: string;
  categorias: string[];
  total_servicos: number;
  valor_total_contratado: number;
  valor_total_pago: number;
}

export interface CotacaoParaFornecedor {
  id: string;
  numero_cotacao?: string;
  projeto_nome?: string;
  titulo: string;
  descricao?: string;
  data_limite: string;
  prazo_execucao_dias?: number;
  status: StatusCotacao;
  permite_proposta_parcial: boolean;
  exige_visita_tecnica: boolean;
  categoria: string;
  fornecedor_id: string;
  visualizado: boolean;
  participando?: boolean;
  proposta_id?: string;
  proposta_status?: StatusPropostaFornecedor;
  proposta_valor?: number;
}

// ============================================================================
// CATEGORIAS
// ============================================================================

export async function listarCategoriasFornecedor(): Promise<FornecedorCategoria[]> {
  const { data, error } = await supabase
    .from("fornecedor_categorias")
    .select("*")
    .eq("ativo", true)
    .order("nome");

  if (error) throw error;
  return data || [];
}

export async function obterCategoriasDoFornecedor(
  fornecedorId: string
): Promise<FornecedorCategoriaVinculo[]> {
  const { data, error } = await supabase
    .from("fornecedor_categoria_vinculo")
    .select(
      `
      *,
      categoria:fornecedor_categorias(*)
    `
    )
    .eq("fornecedor_id", fornecedorId);

  if (error) throw error;
  return data || [];
}

export async function vincularCategoriaFornecedor(
  fornecedorId: string,
  categoriaId: string,
  principal: boolean = false
): Promise<FornecedorCategoriaVinculo> {
  const { data, error } = await supabase
    .from("fornecedor_categoria_vinculo")
    .upsert(
      {
        fornecedor_id: fornecedorId,
        categoria_id: categoriaId,
        principal,
      },
      { onConflict: "fornecedor_id,categoria_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function desvincularCategoriaFornecedor(
  fornecedorId: string,
  categoriaId: string
): Promise<void> {
  const { error } = await supabase
    .from("fornecedor_categoria_vinculo")
    .delete()
    .eq("fornecedor_id", fornecedorId)
    .eq("categoria_id", categoriaId);

  if (error) throw error;
}

// ============================================================================
// COTAÇÕES (VISÍO INTERNA - WG)
// ============================================================================

export async function listarCotacoes(filtros?: {
  status?: StatusCotacao;
  categoria_id?: string;
  projeto_id?: string;
}): Promise<Cotacao[]> {
  let query = supabase
    .from("cotacoes")
    .select(
      `
      *,
      categoria:fornecedor_categorias(*),
      itens:cotacao_itens(*),
      fornecedores_convidados:cotacao_fornecedores(
        *,
        fornecedor:pessoas(id, nome, email, telefone)
      ),
      propostas:cotacao_propostas(
        *,
        fornecedor:pessoas(nome, empresa)
      )
    `
    )
    .order("criado_em", { ascending: false });

  if (filtros?.status) {
    query = query.eq("status", filtros.status);
  }
  if (filtros?.categoria_id) {
    query = query.eq("categoria_id", filtros.categoria_id);
  }
  if (filtros?.projeto_id) {
    query = query.eq("projeto_id", filtros.projeto_id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function obterCotacao(id: string): Promise<Cotacao | null> {
  const { data, error } = await supabase
    .from("cotacoes")
    .select(
      `
      *,
      categoria:fornecedor_categorias(*),
      itens:cotacao_itens(*),
      fornecedores_convidados:cotacao_fornecedores(
        *,
        fornecedor:pessoas(id, nome, email, telefone)
      ),
      propostas:cotacao_propostas(
        *,
        fornecedor:pessoas(nome, empresa),
        itens:cotacao_proposta_itens(
          *,
          item:cotacao_itens(*)
        ),
        anexos:cotacao_proposta_anexos(*)
      )
    `
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function criarCotacao(
  dados: Omit<Cotacao, "id" | "numero_cotacao" | "criado_em" | "criado_por">,
  itens?: Omit<CotacaoItem, "id" | "cotacao_id" | "criado_em">[]
): Promise<Cotacao> {
  const { data: { user } } = await supabase.auth.getUser();

  // Criar cotaçÍo
  const { data: cotacao, error: cotacaoError } = await supabase
    .from("cotacoes")
    .insert({
      ...dados,
      criado_por: user?.id,
    })
    .select()
    .single();

  if (cotacaoError) throw cotacaoError;

  // Criar itens se fornecidos
  if (itens && itens.length > 0) {
    const itensComCotacao = itens.map((item, index) => ({
      ...item,
      cotacao_id: cotacao.id,
      ordem: index,
    }));

    const { error: itensError } = await supabase
      .from("cotacao_itens")
      .insert(itensComCotacao);

    if (itensError) throw itensError;
  }

  // Convidar fornecedores automaticamente
  await supabase.rpc("fn_convidar_fornecedores_cotacao", {
    p_cotacao_id: cotacao.id,
  });

  return cotacao;
}

export async function atualizarCotacao(
  id: string,
  dados: Partial<Cotacao>
): Promise<Cotacao> {
  const { data, error } = await supabase
    .from("cotacoes")
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

export async function encerrarCotacao(
  id: string,
  fornecedorVencedorId?: string,
  observacao?: string
): Promise<Cotacao> {
  const { data, error } = await supabase
    .from("cotacoes")
    .update({
      status: "encerrada",
      fornecedor_vencedor_id: fornecedorVencedorId,
      data_fechamento: new Date().toISOString(),
      observacao_fechamento: observacao,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  // Atualizar proposta vencedora
  if (fornecedorVencedorId) {
    await supabase
      .from("cotacao_propostas")
      .update({ status: "vencedora" })
      .eq("cotacao_id", id)
      .eq("fornecedor_id", fornecedorVencedorId);
  }

  return data;
}

export async function convidarFornecedorCotacao(
  cotacaoId: string,
  fornecedorId: string
): Promise<CotacaoFornecedor> {
  const { data, error } = await supabase
    .from("cotacao_fornecedores")
    .upsert(
      {
        cotacao_id: cotacaoId,
        fornecedor_id: fornecedorId,
      },
      { onConflict: "cotacao_id,fornecedor_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// COTAÇÕES (VISÍO DO FORNECEDOR)
// ============================================================================

export async function listarCotacoesParaFornecedor(
  fornecedorId: string
): Promise<CotacaoParaFornecedor[]> {
  const { data, error } = await supabase
    .from("vw_cotacoes_fornecedor")
    .select("*")
    .eq("fornecedor_id", fornecedorId)
    .order("data_limite", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function marcarCotacaoVisualizada(
  cotacaoId: string,
  fornecedorId: string
): Promise<void> {
  const { error } = await supabase
    .from("cotacao_fornecedores")
    .update({
      visualizado: true,
      data_visualizacao: new Date().toISOString(),
    })
    .eq("cotacao_id", cotacaoId)
    .eq("fornecedor_id", fornecedorId);

  if (error) throw error;
}

export async function declinarCotacao(
  cotacaoId: string,
  fornecedorId: string,
  motivo?: string
): Promise<void> {
  const { error } = await supabase
    .from("cotacao_fornecedores")
    .update({
      participando: false,
      motivo_declinio: motivo,
    })
    .eq("cotacao_id", cotacaoId)
    .eq("fornecedor_id", fornecedorId);

  if (error) throw error;
}

export async function confirmarParticipacao(
  cotacaoId: string,
  fornecedorId: string
): Promise<void> {
  const { error } = await supabase
    .from("cotacao_fornecedores")
    .update({
      participando: true,
    })
    .eq("cotacao_id", cotacaoId)
    .eq("fornecedor_id", fornecedorId);

  if (error) throw error;
}

// ============================================================================
// PROPOSTAS DO FORNECEDOR
// ============================================================================

export async function obterPropostaFornecedor(
  cotacaoId: string,
  fornecedorId: string
): Promise<CotacaoProposta | null> {
  const { data, error } = await supabase
    .from("cotacao_propostas")
    .select(
      `
      *,
      itens:cotacao_proposta_itens(
        *,
        item:cotacao_itens(*)
      ),
      anexos:cotacao_proposta_anexos(*)
    `
    )
    .eq("cotacao_id", cotacaoId)
    .eq("fornecedor_id", fornecedorId)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function criarOuAtualizarProposta(
  cotacaoId: string,
  fornecedorId: string,
  dados: Omit<CotacaoProposta, "id" | "cotacao_id" | "fornecedor_id" | "criado_em" | "atualizado_em">
): Promise<CotacaoProposta> {
  const { data, error } = await supabase
    .from("cotacao_propostas")
    .upsert(
      {
        cotacao_id: cotacaoId,
        fornecedor_id: fornecedorId,
        ...dados,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: "cotacao_id,fornecedor_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function enviarProposta(
  propostaId: string
): Promise<CotacaoProposta> {
  const { data, error } = await supabase
    .from("cotacao_propostas")
    .update({
      status: "enviada",
      data_envio: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", propostaId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function salvarItensProposta(
  propostaId: string,
  itens: Omit<CotacaoPropostaItem, "id" | "proposta_id" | "criado_em">[]
): Promise<CotacaoPropostaItem[]> {
  // Remover itens existentes
  await supabase
    .from("cotacao_proposta_itens")
    .delete()
    .eq("proposta_id", propostaId);

  // Inserir novos itens
  const itensComProposta = itens.map((item) => ({
    ...item,
    proposta_id: propostaId,
  }));

  const { data, error } = await supabase
    .from("cotacao_proposta_itens")
    .insert(itensComProposta)
    .select();

  if (error) throw error;
  return data || [];
}

export async function adicionarAnexoProposta(
  propostaId: string,
  arquivo: File,
  tipo?: string
): Promise<CotacaoPropostaAnexo> {
  // Upload do arquivo
  const fileName = `${Date.now()}-${arquivo.name}`;
  const filePath = `propostas/${propostaId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("documentos")
    .upload(filePath, arquivo);

  if (uploadError) throw uploadError;

  // Obter URL pública
  const { data: urlData } = supabase.storage
    .from("documentos")
    .getPublicUrl(filePath);

  // Criar registro do anexo
  const { data, error } = await supabase
    .from("cotacao_proposta_anexos")
    .insert({
      proposta_id: propostaId,
      nome: arquivo.name,
      tipo,
      arquivo_url: urlData.publicUrl,
      tamanho_bytes: arquivo.size,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// SERVIÇOS CONTRATADOS
// ============================================================================

export async function listarServicosContratados(
  fornecedorId: string
): Promise<FornecedorServico[]> {
  const { data, error } = await supabase
    .from("fornecedor_servicos")
    .select(
      `
      *,
      categoria:fornecedor_categorias(*),
      parcelas:fornecedor_servico_parcelas(*)
    `
    )
    .eq("fornecedor_id", fornecedorId)
    .order("data_contratacao", { ascending: false });

  if (error) throw error;

  return (data || []).map((item: any) => ({
    ...item,
    projeto: undefined,
  }));
}

export async function obterServicoContratado(
  id: string
): Promise<FornecedorServico | null> {
  const { data, error } = await supabase
    .from("fornecedor_servicos")
    .select(
      `
      *,
      categoria:fornecedor_categorias(*),
      parcelas:fornecedor_servico_parcelas(*)
    `
    )
    .eq("id", id)
    .single();

  if (error) throw error;

  return data
    ? {
        ...data,
        projeto: data.projeto
          ? {
              numero_contrato: (data.projeto as any).numero_contrato,
              cliente_nome: (data.projeto as any).cliente?.nome,
            }
          : undefined,
      }
    : null;
}

export async function criarServicoContratado(
  dados: Omit<FornecedorServico, "id" | "criado_em" | "criado_por">,
  parcelas?: Omit<FornecedorServicoParcela, "id" | "servico_id" | "criado_em">[]
): Promise<FornecedorServico> {
  const { data: { user } } = await supabase.auth.getUser();

  // Criar serviço
  const { data: servico, error: servicoError } = await supabase
    .from("fornecedor_servicos")
    .insert({
      ...dados,
      criado_por: user?.id,
    })
    .select()
    .single();

  if (servicoError) throw servicoError;

  // Criar parcelas se fornecidas
  if (parcelas && parcelas.length > 0) {
    const parcelasComServico = parcelas.map((parcela) => ({
      ...parcela,
      servico_id: servico.id,
    }));

    const { error: parcelasError } = await supabase
      .from("fornecedor_servico_parcelas")
      .insert(parcelasComServico);

    if (parcelasError) throw parcelasError;
  }

  return servico;
}

export async function atualizarServicoContratado(
  id: string,
  dados: Partial<FornecedorServico>
): Promise<FornecedorServico> {
  const { data, error } = await supabase
    .from("fornecedor_servicos")
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

export async function registrarPagamentoParcela(
  parcelaId: string,
  valorPago: number,
  comprovanteUrl?: string
): Promise<FornecedorServicoParcela> {
  const { data, error } = await supabase
    .from("fornecedor_servico_parcelas")
    .update({
      data_pagamento: new Date().toISOString().split("T")[0],
      valor_pago: valorPago,
      comprovante_url: comprovanteUrl,
    })
    .eq("id", parcelaId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// RESUMO FINANCEIRO
// ============================================================================

export async function obterResumoFinanceiroFornecedor(
  fornecedorId: string
): Promise<ResumoFinanceiroFornecedor> {
  const { data, error } = await supabase.rpc("fn_resumo_financeiro_fornecedor", {
    p_fornecedor_id: fornecedorId,
  });

  if (error) throw error;
  return data?.[0] || {
    valor_contratado: 0,
    valor_pago: 0,
    valor_pendente: 0,
    total_servicos: 0,
  };
}

// ============================================================================
// VIEW DE FORNECEDORES COMPLETOS
// ============================================================================

export async function listarFornecedoresCompleto(): Promise<FornecedorCompleto[]> {
  const { data, error } = await supabase
    .from("vw_fornecedores_completo")
    .select("*")
    .order("nome");

  if (error) throw error;
  return data || [];
}

export async function obterFornecedorCompleto(
  id: string
): Promise<FornecedorCompleto | null> {
  const { data, error } = await supabase
    .from("vw_fornecedores_completo")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// COMPARATIVO DE PROPOSTAS (VISÍO INTERNA)
// ============================================================================

export interface ComparativoProposta {
  fornecedor_id: string;
  fornecedor_nome: string;
  fornecedor_empresa?: string;
  valor_total: number;
  prazo_dias?: number;
  garantia_meses?: number;
  nota_interna?: number;
  status: StatusPropostaFornecedor;
  itens: {
    item_id: string;
    item_descricao: string;
    valor_unitario: number;
    valor_total: number;
    marca_modelo?: string;
  }[];
}

export async function obterComparativoCotacao(
  cotacaoId: string
): Promise<ComparativoProposta[]> {
  const { data, error } = await supabase
    .from("cotacao_propostas")
    .select(
      `
      *,
      fornecedor:pessoas(id, nome, empresa),
      itens:cotacao_proposta_itens(
        *,
        item:cotacao_itens(id, descricao)
      )
    `
    )
    .eq("cotacao_id", cotacaoId)
    .in("status", ["enviada", "em_analise", "aprovada", "vencedora"])
    .order("valor_total", { ascending: true });

  if (error) throw error;

  return (data || []).map((proposta: any) => ({
    fornecedor_id: proposta.fornecedor_id,
    fornecedor_nome: proposta.fornecedor?.nome || "",
    fornecedor_empresa: proposta.fornecedor?.empresa,
    valor_total: proposta.valor_total,
    prazo_dias: proposta.prazo_execucao_dias,
    garantia_meses: proposta.garantia_meses,
    nota_interna: proposta.nota_interna,
    status: proposta.status,
    itens: (proposta.itens || []).map((item: any) => ({
      item_id: item.item_id,
      item_descricao: item.item?.descricao || "",
      valor_unitario: item.valor_unitario,
      valor_total: item.valor_total,
      marca_modelo: item.marca_modelo,
    })),
  }));
}

