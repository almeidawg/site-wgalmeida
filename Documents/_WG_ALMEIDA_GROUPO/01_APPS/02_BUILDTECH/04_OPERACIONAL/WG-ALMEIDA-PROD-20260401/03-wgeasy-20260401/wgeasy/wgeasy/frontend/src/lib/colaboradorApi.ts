/**
 * API para Área do Colaborador
 * Gerencia projetos, solicitações de pagamento, valores a receber e registros de obra
 */

import { supabase } from "./supabaseClient";

// ============================================================================
// TIPOS
// ============================================================================

export interface ColaboradorPerfil {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  nivel_hierarquico: number;
  ativo: boolean;
}

export interface ColaboradorProjeto {
  id: string;
  colaborador_id: string;
  projeto_id: string;
  funcao?: string;
  data_inicio?: string;
  data_fim?: string;
  ativo: boolean;
  criado_em: string;
  // Dados do projeto (join)
  projeto?: {
    id: string;
    numero?: string;
    cliente_id?: string;
    cliente_nome?: string;
    cliente_avatar_url?: string | null;
    cliente_foto_url?: string | null;
    status?: string;
    valor_total?: number;
  };
}

export type StatusSolicitacaoPagamento =
  | "rascunho"
  | "solicitado"
  | "em_analise"
  | "aprovado"
  | "rejeitado"
  | "pago"
  | "cancelado";

export type TipoSolicitacaoPagamento =
  | "prestador"
  | "fornecedor"
  | "reembolso"
  | "comissao"
  | "honorario"
  | "outros";

export interface SolicitacaoPagamento {
  id: string;
  numero_solicitacao?: string;
  solicitante_id: string;
  projeto_id?: string;
  beneficiario_id?: string;
  beneficiario_nome?: string;
  beneficiario_documento?: string;
  tipo: TipoSolicitacaoPagamento;
  descricao: string;
  valor: number;
  banco?: string;
  agencia?: string;
  conta?: string;
  tipo_conta?: string;
  chave_pix?: string;
  data_vencimento?: string;
  data_pagamento?: string;
  status: StatusSolicitacaoPagamento;
  aprovado_por?: string;
  data_aprovacao?: string;
  motivo_rejeicao?: string;
  lancamento_id?: string;
  criado_em: string;
  criado_por?: string;
  atualizado_em: string;
  // Joins
  solicitante?: { nome: string };
  beneficiario?: { nome: string };
  projeto?: { numero_contrato?: string };
  anexos?: SolicitacaoPagamentoAnexo[];
}

export interface SolicitacaoPagamentoAnexo {
  id: string;
  solicitacao_id: string;
  nome: string;
  tipo?: string;
  arquivo_url: string;
  tamanho_bytes?: number;
  criado_em: string;
}

export interface SolicitacaoPagamentoHistorico {
  id: string;
  solicitacao_id: string;
  status_anterior?: StatusSolicitacaoPagamento;
  status_novo: StatusSolicitacaoPagamento;
  observacao?: string;
  criado_em: string;
  criado_por?: string;
  usuario?: { nome: string };
}

export type TipoValorReceber =
  | "comissao"
  | "honorario"
  | "fee_projeto"
  | "bonus"
  | "repasse"
  | "outros";

export type StatusValorReceber =
  | "previsto"
  | "aprovado"
  | "liberado"
  | "pago"
  | "cancelado";

export interface ColaboradorValorReceber {
  id: string;
  colaborador_id: string;
  projeto_id?: string;
  parcela_id?: string;
  tipo: TipoValorReceber;
  descricao?: string;
  valor: number;
  percentual?: number;
  condicao_liberacao?: string;
  data_prevista?: string;
  data_liberacao?: string;
  data_pagamento?: string;
  status: StatusValorReceber;
  solicitacao_pagamento_id?: string;
  criado_em: string;
  // Joins
  projeto?: { numero_contrato?: string; cliente_nome?: string };
}

export interface ObraRegistro {
  id: string;
  projeto_id: string;
  colaborador_id: string;
  data_registro: string;
  titulo?: string;
  descricao?: string;
  etapa_cronograma_id?: string;
  percentual_avanco?: number;
  clima?: string;
  equipe_presente?: number;
  observacoes?: string;
  pendencias?: string;
  criado_em: string;
  // Joins
  fotos?: ObraRegistroFoto[];
  colaborador?: { nome: string };
}

export interface ObraRegistroFoto {
  id: string;
  registro_id: string;
  arquivo_url: string;
  descricao?: string;
  ordem: number;
}

export interface ObraChecklist {
  id: string;
  projeto_id: string;
  etapa?: string;
  titulo: string;
  descricao?: string;
  criado_em: string;
  itens?: ObraChecklistItem[];
}

export interface ObraChecklistItem {
  id: string;
  checklist_id: string;
  descricao: string;
  ordem: number;
  obrigatorio: boolean;
  concluido: boolean;
  data_conclusao?: string;
  concluido_por?: string;
  observacao?: string;
}

export interface ResumoFinanceiroColaborador {
  valor_previsto: number;
  valor_aprovado: number;
  valor_liberado: number;
  valor_pago: number;
}

// Lançamentos vinculados ao colaborador como favorecido
export interface ColaboradorLancamento {
  id: string;
  descricao: string;
  valor_total: number;
  status?: string;
  tipo?: string;
  vencimento?: string | null;
  data_pagamento?: string | null;
  data_competencia?: string | null;
  nucleo?: string | null;
  categoria?: string | null;
  centro_custo?: string | null;
  centro_custos?: string | null;
  contrato?: { numero?: string; titulo?: string };
  projeto?: { nome?: string };
}

export interface ColaboradorCompleto {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  cargo?: string;
  avatar_url?: string;
  ativo: boolean;
  perfil_codigo?: string;
  perfil_nome?: string;
  nivel_hierarquico?: number;
  auth_user_id?: string;
  tipo_usuario?: string;
  total_projetos: number;
  valor_previsto: number;
  valor_recebido: number;
}

// ============================================================================
// PERFIS
// ============================================================================

export async function listarPerfisColaborador(): Promise<ColaboradorPerfil[]> {
  const { data, error } = await supabase
    .from("colaborador_perfis")
    .select("*")
    .eq("ativo", true)
    .order("nivel_hierarquico", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function atualizarPerfilColaborador(
  pessoaId: string,
  perfilId: string
): Promise<void> {
  const { error } = await supabase
    .from("pessoas")
    .update({ colaborador_perfil_id: perfilId })
    .eq("id", pessoaId);

  if (error) throw error;
}

// ============================================================================
// PROJETOS DO COLABORADOR
// ============================================================================

export async function listarProjetosColaborador(
  colaboradorId: string
): Promise<ColaboradorProjeto[]> {
  // Buscar projetos do colaborador sem join (FK não existe)
  const { data, error } = await supabase
    .from("colaborador_projetos")
    .select("*")
    .eq("colaborador_id", colaboradorId)
    .eq("ativo", true)
    .order("criado_em", { ascending: false });

  if (error) throw error;

  // Buscar dados dos contratos separadamente
  const projetosComDados = await Promise.all(
    (data || []).map(async (item: any) => {
      let projeto = undefined;

      if (item.projeto_id) {
        const { data: contrato } = await supabase
          .from("contratos")
          .select("id, numero, cliente_id, status, valor_total, cliente:pessoas!contratos_cliente_id_fkey(nome, avatar_url, foto_url)")
          .eq("id", item.projeto_id)
          .single();

        if (contrato) {
          projeto = {
            id: contrato.id,
            numero: contrato.numero,
            cliente_id: contrato.cliente_id,
            status: contrato.status,
            valor_total: contrato.valor_total,
            cliente_nome: (contrato.cliente as any)?.nome,
            cliente_avatar_url: (contrato.cliente as any)?.avatar_url ?? null,
            cliente_foto_url: (contrato.cliente as any)?.foto_url ?? null,
          };
        }
      }

      return { ...item, projeto };
    })
  );

  return projetosComDados;
}

export async function vincularColaboradorProjeto(
  colaboradorId: string,
  projetoId: string,
  funcao?: string
): Promise<ColaboradorProjeto> {
  const { data, error } = await supabase
    .from("colaborador_projetos")
    .upsert(
      {
        colaborador_id: colaboradorId,
        projeto_id: projetoId,
        funcao,
        ativo: true,
      },
      { onConflict: "colaborador_id,projeto_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function desvincularColaboradorProjeto(
  colaboradorId: string,
  projetoId: string
): Promise<void> {
  const { error } = await supabase
    .from("colaborador_projetos")
    .update({ ativo: false })
    .eq("colaborador_id", colaboradorId)
    .eq("projeto_id", projetoId);

  if (error) throw error;
}

// ============================================================================
// SOLICITAÇÕES DE PAGAMENTO
// ============================================================================

export async function listarSolicitacoesPagamento(filtros?: {
  solicitante_id?: string;
  projeto_id?: string;
  status?: StatusSolicitacaoPagamento;
  tipo?: TipoSolicitacaoPagamento;
}): Promise<SolicitacaoPagamento[]> {
  let query = supabase
    .from("solicitacoes_pagamento")
    .select(
      `
      *,
      solicitante:pessoas!solicitacoes_pagamento_solicitante_id_fkey(nome),
      beneficiario:pessoas!solicitacoes_pagamento_beneficiario_id_fkey(nome),
      projeto:contratos(numero_contrato),
      anexos:solicitacoes_pagamento_anexos(*)
    `
    )
    .order("criado_em", { ascending: false });

  if (filtros?.solicitante_id) {
    query = query.eq("solicitante_id", filtros.solicitante_id);
  }
  if (filtros?.projeto_id) {
    query = query.eq("projeto_id", filtros.projeto_id);
  }
  if (filtros?.status) {
    query = query.eq("status", filtros.status);
  }
  if (filtros?.tipo) {
    query = query.eq("tipo", filtros.tipo);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((item: any) => ({
    ...item,
    contrato: Array.isArray(item.contrato) ? item.contrato[0] : item.contrato,
    projeto: Array.isArray(item.projeto) ? item.projeto[0] : item.projeto,
  }));
}

// ============================================================================
// LANÇAMENTOS POR FAVORECIDO (COLABORADOR)
// ============================================================================

export async function listarLancamentosFavorecido(
  pessoaId: string,
  filtros?: { status?: string; tipo?: string }
): Promise<ColaboradorLancamento[]> {
  // Buscar lançamentos onde a pessoa é o beneficiário/favorecido (pessoa_id)
  // Geralmente sÍo lançamentos de saída (pagamentos ao colaborador)
  let query = supabase
    .from("financeiro_lancamentos")
    .select(
      `
      id,
      descricao,
      valor_total,
      status,
      tipo,
      vencimento,
      data_pagamento,
      data_competencia,
      nucleo,
      categoria,
      centro_custo,
      centro_custos,
      contrato:contratos(numero, titulo),
      projeto:projetos(nome)
    `
    )
    .eq("pessoa_id", pessoaId)
    .eq("tipo", "saida") // Apenas saídas = pagamentos ao colaborador
    .order("vencimento", { ascending: false, nullsFirst: false })
    .order("data_competencia", { ascending: false });

  if (filtros?.status) {
    query = query.eq("status", filtros.status);
  }
  if (filtros?.tipo) {
    // Se o usuário quiser ver entradas também, pode remover o filtro
    query = query.eq("tipo", filtros.tipo);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((item: any) => ({
    ...item,
    contrato: Array.isArray(item.contrato) ? item.contrato[0] : item.contrato,
    projeto: Array.isArray(item.projeto) ? item.projeto[0] : item.projeto,
  }));
}

export async function obterSolicitacaoPagamento(
  id: string
): Promise<SolicitacaoPagamento | null> {
  const { data, error } = await supabase
    .from("solicitacoes_pagamento")
    .select(
      `
      *,
      solicitante:pessoas!solicitacoes_pagamento_solicitante_id_fkey(nome),
      beneficiario:pessoas!solicitacoes_pagamento_beneficiario_id_fkey(nome),
      projeto:contratos(numero),
      anexos:solicitacoes_pagamento_anexos(*)
    `
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function criarSolicitacaoPagamento(
  dados: Omit<
    SolicitacaoPagamento,
    "id" | "numero_solicitacao" | "criado_em" | "atualizado_em"
  >
): Promise<SolicitacaoPagamento> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("solicitacoes_pagamento")
    .insert({
      ...dados,
      criado_por: user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function atualizarSolicitacaoPagamento(
  id: string,
  dados: Partial<SolicitacaoPagamento>
): Promise<SolicitacaoPagamento> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("solicitacoes_pagamento")
    .update({
      ...dados,
      atualizado_em: new Date().toISOString(),
      atualizado_por: user?.id,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function aprovarSolicitacaoPagamento(
  id: string
): Promise<SolicitacaoPagamento> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("solicitacoes_pagamento")
    .update({
      status: "aprovado",
      aprovado_por: user?.id,
      data_aprovacao: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
      atualizado_por: user?.id,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function rejeitarSolicitacaoPagamento(
  id: string,
  motivo: string
): Promise<SolicitacaoPagamento> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("solicitacoes_pagamento")
    .update({
      status: "rejeitado",
      motivo_rejeicao: motivo,
      atualizado_em: new Date().toISOString(),
      atualizado_por: user?.id,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listarHistoricoSolicitacao(
  solicitacaoId: string
): Promise<SolicitacaoPagamentoHistorico[]> {
  const { data, error } = await supabase
    .from("solicitacoes_pagamento_historico")
    .select(
      `
      *,
      usuario:usuarios!solicitacoes_pagamento_historico_criado_por_fkey(
        pessoa:pessoas(nome)
      )
    `
    )
    .eq("solicitacao_id", solicitacaoId)
    .order("criado_em", { ascending: false });

  if (error) throw error;
  return (data || []).map((item: any) => ({
    ...item,
    usuario: { nome: item.usuario?.pessoa?.nome },
  }));
}

// ============================================================================
// ANEXOS DE SOLICITAÇÍO
// ============================================================================

export async function adicionarAnexoSolicitacao(
  solicitacaoId: string,
  arquivo: File,
  tipo?: string
): Promise<SolicitacaoPagamentoAnexo> {
  // Upload do arquivo
  const fileName = `${Date.now()}-${arquivo.name}`;
  const filePath = `solicitacoes/${solicitacaoId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("documentos")
    .upload(filePath, arquivo);

  if (uploadError) throw uploadError;

  // Obter URL pública
  const { data: urlData } = supabase.storage
    .from("documentos")
    .getPublicUrl(filePath);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Criar registro do anexo
  const { data, error } = await supabase
    .from("solicitacoes_pagamento_anexos")
    .insert({
      solicitacao_id: solicitacaoId,
      nome: arquivo.name,
      tipo,
      arquivo_url: urlData.publicUrl,
      tamanho_bytes: arquivo.size,
      criado_por: user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removerAnexoSolicitacao(anexoId: string): Promise<void> {
  const { error } = await supabase
    .from("solicitacoes_pagamento_anexos")
    .delete()
    .eq("id", anexoId);

  if (error) throw error;
}

// ============================================================================
// VALORES A RECEBER
// ============================================================================

export async function listarValoresReceber(
  colaboradorId: string
): Promise<ColaboradorValorReceber[]> {

  const { data, error } = await supabase
    .from("colaborador_valores_receber")
    .select(`*`)
    .eq("colaborador_id", colaboradorId)
    .order("data_prevista", { ascending: true });

  if (error) throw error;

  return data || [];
}

export async function obterResumoFinanceiroColaborador(
  colaboradorId: string
): Promise<ResumoFinanceiroColaborador> {
  const { data, error } = await supabase.rpc(
    "fn_resumo_financeiro_colaborador",
    {
      p_colaborador_id: colaboradorId,
    }
  );

  if (error) throw error;
  return (
    data?.[0] || {
      valor_previsto: 0,
      valor_aprovado: 0,
      valor_liberado: 0,
      valor_pago: 0,
    }
  );
}

export async function criarValorReceber(
  dados: Omit<ColaboradorValorReceber, "id" | "criado_em">
): Promise<ColaboradorValorReceber> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("colaborador_valores_receber")
    .insert({
      ...dados,
      criado_por: user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// REGISTROS DE OBRA
// ============================================================================

export async function listarRegistrosObra(
  projetoId: string
): Promise<ObraRegistro[]> {
  const { data, error } = await supabase
    .from("obra_registros")
    .select(
      `
      *,
      colaborador:pessoas!obra_registros_colaborador_id_fkey(nome),
      fotos:obra_registros_fotos(*)
    `
    )
    .eq("projeto_id", projetoId)
    .order("data_registro", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function criarRegistroObra(
  dados: Omit<ObraRegistro, "id" | "criado_em" | "atualizado_em">
): Promise<ObraRegistro> {
  const { data, error } = await supabase
    .from("obra_registros")
    .insert(dados)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function adicionarFotoRegistro(
  registroId: string,
  arquivo: File,
  descricao?: string
): Promise<ObraRegistroFoto> {
  // Upload do arquivo
  const fileName = `${Date.now()}-${arquivo.name}`;
  const filePath = `obra_registros/${registroId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("documentos")
    .upload(filePath, arquivo);

  if (uploadError) throw uploadError;

  // Obter URL pública
  const { data: urlData } = supabase.storage
    .from("documentos")
    .getPublicUrl(filePath);

  // Criar registro da foto
  const { data, error } = await supabase
    .from("obra_registros_fotos")
    .insert({
      registro_id: registroId,
      arquivo_url: urlData.publicUrl,
      descricao,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// CHECKLISTS DE OBRA
// ============================================================================

export async function listarChecklistsObra(
  projetoId: string
): Promise<ObraChecklist[]> {
  const { data, error } = await supabase
    .from("obra_checklists")
    .select(
      `
      *,
      itens:obra_checklist_itens(*)
    `
    )
    .eq("projeto_id", projetoId)
    .order("criado_em", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function criarChecklist(
  dados: Omit<ObraChecklist, "id" | "criado_em">
): Promise<ObraChecklist> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("obra_checklists")
    .insert({
      ...dados,
      criado_por: user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function marcarItemChecklist(
  itemId: string,
  concluido: boolean,
  observacao?: string
): Promise<ObraChecklistItem> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("obra_checklist_itens")
    .update({
      concluido,
      data_conclusao: concluido ? new Date().toISOString() : null,
      concluido_por: concluido ? user?.id : null,
      observacao,
    })
    .eq("id", itemId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// VIEW DE COLABORADORES COMPLETOS
// ============================================================================

export async function listarColaboradoresCompleto(): Promise<
  ColaboradorCompleto[]
> {
  const { data, error } = await supabase
    .from("vw_colaboradores_completo")
    .select("*")
    .order("nome");

  if (error) throw error;
  return data || [];
}

export async function obterColaboradorCompleto(
  id: string
): Promise<ColaboradorCompleto | null> {
  const { data, error } = await supabase
    .from("vw_colaboradores_completo")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}


