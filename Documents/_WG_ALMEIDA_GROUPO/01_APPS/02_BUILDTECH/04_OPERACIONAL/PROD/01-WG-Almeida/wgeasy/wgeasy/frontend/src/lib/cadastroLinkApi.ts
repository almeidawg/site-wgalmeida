/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// src/lib/cadastroLinkApi.ts
// API para sistema de cadastro por link

import { supabase } from "./supabaseClient";

// URL base do sistema em produçÍo
const PRODUCTION_URL = "https://easy.wgalmeida.com.br";

// FunçÍo para obter a URL base correta
function getBaseUrl(): string {
  // Em produçÍo, sempre usar o domínio oficial
  if (import.meta.env.PROD) {
    return PRODUCTION_URL;
  }
  // Em desenvolvimento, usar a URL atual
  return window.location.origin;
}

function formatSupabaseError(error: any, fallback = "Erro ao processar solicitaçÍo"): string {
  if (!error) return fallback;

  const parts = [error.message, error.details, error.hint]
    .filter((part) => typeof part === "string" && part.trim().length > 0);

  if (error.code === "42501") {
    parts.unshift("Sem permissÍo para gravar no banco.");
  }

  return parts.length > 0 ? parts.join(" | ") : fallback;
}

async function getCurrentUsuarioId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) {
    return null;
  }

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (usuario?.id) {
    return usuario.id;
  }

  const { data: usuarioAtual, error } = await supabase.rpc("fn_usuario_id_atual");

  if (!error && typeof usuarioAtual === "string" && usuarioAtual.length > 0) {
    return usuarioAtual;
  }

  return null;
}

// ============================================================
// TIPOS
// ============================================================

export type TipoCadastro = "CLIENTE" | "COLABORADOR" | "FORNECEDOR" | "ESPECIFICADOR";

export type StatusCadastro = "aguardando_preenchimento" | "pendente_aprovacao" | "aprovado" | "rejeitado";

export interface CadastroPendente {
  id: string;
  token: string;
  tipo_solicitado: TipoCadastro;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  cpf_cnpj: string | null;
  empresa: string | null;
  cargo: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  observacoes: string | null;
  status: StatusCadastro;
  enviado_por: string | null;
  enviado_via: "email" | "whatsapp" | null;
  aprovado_por: string | null;
  aprovado_em: string | null;
  tipo_usuario_aprovado: string | null;
  motivo_rejeicao: string | null;
  pessoa_id: string | null;
  usuario_id: string | null;
  nucleo_id: string | null;
  criado_em: string;
  atualizado_em: string;
  preenchido_em: string | null;
  expira_em: string;
  // Campos para links reutilizáveis
  reutilizavel?: boolean;
  uso_maximo?: number | null;
  total_usos?: number;
  link_pai_id?: string | null;
  descricao_link?: string | null;
  // Dados bancários
  banco?: string | null;
  agencia?: string | null;
  conta?: string | null;
  tipo_conta?: string | null;
  pix?: string | null;
  // Da view
  enviado_por_nome?: string;
  enviado_por_tipo?: string;
  // Título personalizado da página
  titulo_pagina?: string | null;
}

export interface NotificacaoSistema {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string | null;
  referencia_tipo: string | null;
  referencia_id: string | null;
  destinatario_id: string | null;
  para_todos_admins: boolean;
  lida: boolean;
  lida_em: string | null;
  url_acao: string | null;
  texto_acao: string | null;
  criado_em: string;
  nucleo_id: string | null;
}

export interface DadosCadastroPublico {
  nome: string;
  email: string;
  telefone?: string;
  cpf_cnpj?: string;
  empresa?: string;
  cargo?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  observacoes?: string;
  // Dados bancários (para Colaborador e Fornecedor)
  banco?: string;
  agencia?: string;
  conta?: string;
  tipo_conta?: string;
  pix?: string;
}

// ============================================================
// TIPOS - COMISSIONAMENTO
// ============================================================

export interface CategoriaComissao {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  tipo_pessoa: "VENDEDOR" | "ESPECIFICADOR" | "COLABORADOR" | "EQUIPE_INTERNA";
  is_master: boolean;
  is_indicacao: boolean;
  ordem: number;
  ativo: boolean;
}

export interface FaixaVGV {
  id: string;
  cota: number;
  nome: string;
  valor_minimo: number;
  valor_maximo: number | null;
  descricao: string | null;
  ativo: boolean;
}

export interface PercentualComissao {
  id: string;
  categoria_id: string;
  faixa_id: string;
  percentual: number;
  ativo: boolean;
}

export interface TabelaComissaoItem {
  categoria_id: string;
  codigo: string;
  categoria_nome: string;
  tipo_pessoa: string;
  is_master: boolean;
  is_indicacao: boolean;
  ordem: number;
  faixa_id: string;
  cota: number;
  faixa_nome: string;
  valor_minimo: number;
  valor_maximo: number | null;
  percentual: number;
}

export interface EspecificadorMaster {
  id: string;
  nome: string;
  email: string | null;
  tipo: string;
}

// ============================================================
// FUNÇÕES - CRIAR E GERENCIAR LINKS
// ============================================================

export interface CriarLinkParams {
  tipo: TipoCadastro;
  enviadoVia?: "email" | "whatsapp";
  nucleoId?: string;
  reutilizavel?: boolean;
  usoMaximo?: number | null;
  expiraDias?: number;
  pessoaVinculadaId?: string; // ID da pessoa vinculada ao link
  descricaoLink?: string; // DescriçÍo personalizada do link
  tituloPagina?: string; // Título personalizado exibido na página pública
  pessoaAlvoId?: string; // ID da pessoa para link de atualizaçÍo cadastral
}

export interface CriarLinkResult {
  id: string;
  token: string;
  url: string;
  expira_em: string;
  reutilizavel: boolean;
  pessoaVinculadaNome?: string;
}

/**
 * Cria um novo link de cadastro
 * @param params - Parâmetros para criaçÍo do link
 * @param params.tipo - Tipo de cadastro (CLIENTE, COLABORADOR, FORNECEDOR, ESPECIFICADOR)
 * @param params.reutilizavel - Se true, permite que o link seja usado por múltiplas pessoas
 * @param params.usoMaximo - Limite de usos do link (apenas se reutilizavel=true)
 * @param params.pessoaVinculadaId - ID da pessoa que está vinculada ao link (vendedor/colaborador/etc)
 */
export async function criarLinkCadastro(
  params: CriarLinkParams
): Promise<CriarLinkResult> {
  const {
    tipo,
    enviadoVia,
    nucleoId,
    reutilizavel = false,
    usoMaximo,
    expiraDias = 7,
    pessoaVinculadaId,
    descricaoLink,
    tituloPagina,
    pessoaAlvoId,
  } = params;

  const usuarioId = await getCurrentUsuarioId();

  // Calcular data de expiraçÍo
  const expiraEm = new Date();
  expiraEm.setDate(expiraEm.getDate() + expiraDias);

  // Criar registro diretamente na tabela (para ter mais controle)
  const token = crypto.randomUUID();

  // Se for link de atualizaçÍo, pré-carrega dados atuais da pessoa no cadastro pendente
  let pessoaAlvo: any = null;
  if (pessoaAlvoId) {
    const { data: pessoaData } = await supabase
      .from("pessoas")
      .select("id, tipo, nome, email, telefone, cpf, cnpj, empresa, cargo, endereco, numero, complemento, cidade, estado, cep, observacoes, banco, agencia, conta, tipo_conta, pix")
      .eq("id", pessoaAlvoId)
      .maybeSingle();
    pessoaAlvo = pessoaData || null;
  }

  const cpfCnpjAlvo = pessoaAlvo?.cpf || pessoaAlvo?.cnpj || null;
  const tipoSolicitado = (pessoaAlvo?.tipo as TipoCadastro | undefined) || tipo;

  const { data: cadastro, error } = await supabase
    .from("cadastros_pendentes")
    .insert({
      token,
      tipo_solicitado: tipoSolicitado,
      status: "aguardando_preenchimento",
      enviado_por: pessoaVinculadaId || usuarioId, // Se tiver pessoa vinculada, ela é quem "enviou"
      enviado_via: enviadoVia || null,
      nucleo_id: nucleoId || null,
      reutilizavel,
      uso_maximo: reutilizavel ? usoMaximo : null,
      expira_em: expiraEm.toISOString(),
      observacoes: descricaoLink || pessoaAlvo?.observacoes || null,
      titulo_pagina: tituloPagina || null,
      pessoa_id: pessoaAlvo?.id || null,
      nome: pessoaAlvo?.nome || null,
      email: pessoaAlvo?.email || null,
      telefone: pessoaAlvo?.telefone || null,
      cpf_cnpj: cpfCnpjAlvo,
      empresa: pessoaAlvo?.empresa || null,
      cargo: pessoaAlvo?.cargo || null,
      endereco: pessoaAlvo?.endereco || null,
      numero: pessoaAlvo?.numero || null,
      complemento: pessoaAlvo?.complemento || null,
      cidade: pessoaAlvo?.cidade || null,
      estado: pessoaAlvo?.estado || null,
      cep: pessoaAlvo?.cep || null,
      banco: pessoaAlvo?.banco || null,
      agencia: pessoaAlvo?.agencia || null,
      conta: pessoaAlvo?.conta || null,
      tipo_conta: pessoaAlvo?.tipo_conta || null,
      pix: pessoaAlvo?.pix || null,
      usuario_id: usuarioId,
    })
    .select("id, token, expira_em, reutilizavel")
    .single();

  if (error) {
    console.error("Erro ao criar link:", error);
    throw new Error(formatSupabaseError(error, "Erro ao criar link"));
  }

  // Se tiver pessoa vinculada, buscar nome
  let pessoaVinculadaNome: string | undefined;
  if (pessoaVinculadaId) {
    const { data: pessoa } = await supabase
      .from("pessoas")
      .select("nome")
      .eq("id", pessoaVinculadaId)
      .single();
    pessoaVinculadaNome = pessoa?.nome;
  }

  const baseUrl = getBaseUrl();
  // Corrigir para rota correta de cadastro público
  const url = `${baseUrl}/cadastro-publico/${cadastro.token}`;

  return {
    id: cadastro.id,
    token: cadastro.token,
    url,
    expira_em: cadastro.expira_em,
    reutilizavel: cadastro.reutilizavel || false,
    pessoaVinculadaNome,
  };
}

/**
 * Busca cadastro pelo token (para formulário público)
 */
export async function buscarCadastroPorToken(token: string): Promise<CadastroPendente | null> {
  const { data, error } = await supabase
    .from("cadastros_pendentes")
    .select("*")
    .eq("token", token)
    .single();

  if (error) {
    console.error("Erro ao buscar cadastro:", error);
    return null;
  }

  return data;
}

/**
 * Preenche o cadastro (formulário público)
 */
export async function preencherCadastro(
  token: string,
  dados: DadosCadastroPublico
): Promise<{ success: boolean; message: string }> {
  const { data, error } = await supabase.rpc("preencher_cadastro", {
    p_token: token,
    p_nome: dados.nome,
    p_email: dados.email,
    p_telefone: dados.telefone || null,
    p_cpf_cnpj: dados.cpf_cnpj || null,
    p_empresa: dados.empresa || null,
    p_cargo: dados.cargo || null,
    p_endereco: dados.endereco || null,
    p_numero: dados.numero || null,
    p_complemento: dados.complemento || null,
    p_cidade: dados.cidade || null,
    p_estado: dados.estado || null,
    p_cep: dados.cep || null,
    p_observacoes: dados.observacoes || null,
    p_banco: dados.banco || null,
    p_agencia: dados.agencia || null,
    p_conta: dados.conta || null,
    p_tipo_conta: dados.tipo_conta || null,
    p_pix: dados.pix || null,
  });

  if (error) {
    console.error("Erro ao preencher cadastro:", error);
    throw new Error(error.message);
  }

  return {
    success: data.success,
    message: data.message || data.error,
  };
}

/**
 * Atualiza cadastro existente por token (link de atualizaçÍo cadastral)
 */
export async function atualizarCadastroPorToken(
  token: string,
  dados: DadosCadastroPublico
): Promise<{ success: boolean; message: string }> {
  const { data, error } = await supabase.rpc("atualizar_cadastro_por_token", {
    p_token: token,
    p_nome: dados.nome,
    p_email: dados.email,
    p_telefone: dados.telefone || null,
    p_cpf_cnpj: dados.cpf_cnpj || null,
    p_empresa: dados.empresa || null,
    p_cargo: dados.cargo || null,
    p_endereco: dados.endereco || null,
    p_numero: dados.numero || null,
    p_complemento: dados.complemento || null,
    p_cidade: dados.cidade || null,
    p_estado: dados.estado || null,
    p_cep: dados.cep || null,
    p_observacoes: dados.observacoes || null,
    p_banco: dados.banco || null,
    p_agencia: dados.agencia || null,
    p_conta: dados.conta || null,
    p_tipo_conta: dados.tipo_conta || null,
    p_pix: dados.pix || null,
  });

  if (error) {
    console.error("Erro ao atualizar cadastro por token:", error);
    throw new Error(error.message);
  }

  const payload = Array.isArray(data) ? data[0] : data;
  return {
    success: Boolean(payload?.success),
    message: payload?.message || payload?.error || "AtualizaçÍo processada",
  };
}

// ============================================================
// FUNÇÕES - LISTAR E APROVAR CADASTROS
// ============================================================

/**
 * Lista cadastros pendentes de aprovaçÍo
 */
export async function listarCadastrosPendentes(params?: {
  status?: StatusCadastro;
  tipo?: TipoCadastro;
  nucleoId?: string;
}): Promise<CadastroPendente[]> {
  let query = supabase
    .from("vw_cadastros_pendentes")
    .select("*")
    .order("criado_em", { ascending: false });

  if (params?.status) {
    query = query.eq("status", params.status);
  }

  if (params?.tipo) {
    query = query.eq("tipo_solicitado", params.tipo);
  }

  if (params?.nucleoId) {
    query = query.eq("nucleo_id", params.nucleoId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao listar cadastros:", error);
    throw error;
  }

  return data || [];
}

/**
 * Aprova um cadastro pendente
 * @param isMaster - Se true, marca como Master (cadastro direto pela WG)
 * @param indicadoPorId - ID da pessoa que indicou (se for indicado por um Master)
 * @param categoriaComissaoId - ID da categoria de comissÍo (opcional, calculado automaticamente se não fornecido)
 */
export async function aprovarCadastro(
  cadastroId: string,
  tipoUsuario: string,
  options?: {
    isMaster?: boolean;
    indicadoPorId?: string;
    categoriaComissaoId?: string;
  }
): Promise<{
  success: boolean;
  pessoaId?: string;
  usuarioId?: string;
  email?: string;
  senhaTemporaria?: string;
  isMaster?: boolean;
  categoriaComissaoId?: string;
  message: string;
}> {
  const aprovadoPor = await getCurrentUsuarioId();

  const tentativasArgs: Array<Record<string, unknown>> = [
    {
      p_cadastro_id: cadastroId,
      p_tipo_usuario: tipoUsuario,
      p_aprovado_por: aprovadoPor,
      p_is_master: options?.isMaster ?? null,
      p_indicado_por_id: options?.indicadoPorId ?? null,
      p_categoria_comissao_id: options?.categoriaComissaoId ?? null,
    },
    {
      p_cadastro_id: cadastroId,
      p_tipo_usuario: tipoUsuario,
      p_aprovado_por: aprovadoPor,
      p_is_master: options?.isMaster ?? null,
      p_indicado_por_id: options?.indicadoPorId ?? null,
    },
    {
      p_cadastro_id: cadastroId,
      p_tipo_usuario: tipoUsuario,
      p_aprovado_por: aprovadoPor,
    },
    {
      p_cadastro_id: cadastroId,
      p_tipo_usuario: tipoUsuario,
    },
  ];

  let lastError: any = null;
  let data: any = null;

  for (const args of tentativasArgs) {
    const result = await supabase.rpc("aprovar_cadastro", args as any);
    if (!result.error) {
      data = result.data;
      lastError = null;
      break;
    }

    lastError = result.error;
    const isIncompatibilidadeAssinatura =
      result.error.code === "PGRST202" ||
      result.error.code === "42883" ||
      String(result.error.message || "").toLowerCase().includes("function") ||
      String(result.error.message || "").toLowerCase().includes("signature");

    if (!isIncompatibilidadeAssinatura) {
      break;
    }
  }

  if (lastError) {
    console.error("Erro ao aprovar cadastro:", {
      code: lastError.code,
      message: lastError.message,
      details: lastError.details,
      hint: lastError.hint,
      cadastroId,
      tipoUsuario,
      aprovadoPor,
      options,
    });
    throw new Error(lastError.message || "Erro ao aprovar cadastro");
  }

  const payload = Array.isArray(data) ? data[0] : data;
  if (!payload) {
    throw new Error("Resposta inválida ao aprovar cadastro");
  }

  return {
    success: Boolean(payload.success),
    pessoaId: payload.pessoa_id,
    usuarioId: payload.usuario_id,
    email: payload.email,
    senhaTemporaria: payload.senha_temporaria,
    isMaster: payload.is_master,
    categoriaComissaoId: payload.categoria_comissao_id,
    message: payload.message || payload.error || "Cadastro processado",
  };
}

/**
 * Rejeita um cadastro pendente
 */
export async function rejeitarCadastro(
  cadastroId: string,
  motivo: string
): Promise<{ success: boolean; message: string }> {
  const rejeitadoPor = await getCurrentUsuarioId();

  const { data, error } = await supabase.rpc("rejeitar_cadastro", {
    p_cadastro_id: cadastroId,
    p_motivo: motivo,
    p_rejeitado_por: rejeitadoPor,
  });

  if (error) {
    console.error("Erro ao rejeitar cadastro:", error);
    throw new Error(error.message);
  }

  return {
    success: data.success,
    message: data.message || data.error,
  };
}

// ============================================================
// FUNÇÕES - NOTIFICAÇÕES
// ============================================================

// Flag para evitar logs repetitivos de erros de rede
let _notificacoesNetworkErrorLogged = false;

/**
 * Lista notificações não lidas
 * @param limite - Número máximo de notificações a retornar (padrÍo: 50)
 */
export async function listarNotificacoesNaoLidas(limite: number = 50): Promise<NotificacaoSistema[]> {
  try {
    const { data, error } = await supabase
      .from("notificacoes_sistema")
      .select("*")
      .eq("lida", false)
      .order("criado_em", { ascending: false })
      .limit(limite);

    if (error) {
      // Só loga erro se não for erro de rede repetido
      if (!_notificacoesNetworkErrorLogged) {
        console.warn("Notificações temporariamente indisponíveis");
        _notificacoesNetworkErrorLogged = true;
      }
      return [];
    }

    // Reset flag se conseguiu conectar
    _notificacoesNetworkErrorLogged = false;
    return data || [];
  } catch {
    // Erro de rede/CORS - silencioso para não poluir console (intencional)
    if (!_notificacoesNetworkErrorLogged) {
      console.warn("Notificações: erro de conexÍo");
      _notificacoesNetworkErrorLogged = true;
    }
    return [];
  }
}

/**
 * Conta notificações não lidas
 */
export async function contarNotificacoesNaoLidas(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("notificacoes_sistema")
      .select("*", { count: "exact", head: true })
      .eq("lida", false);

    if (error) {
      // Só loga erro se não for erro de rede repetido
      if (!_notificacoesNetworkErrorLogged) {
        console.warn("Notificações temporariamente indisponíveis");
        _notificacoesNetworkErrorLogged = true;
      }
      return 0;
    }

    // Reset flag se conseguiu conectar
    _notificacoesNetworkErrorLogged = false;
    return count || 0;
  } catch {
    // Erro de rede/CORS - silencioso para não poluir console (intencional)
    if (!_notificacoesNetworkErrorLogged) {
      console.warn("Notificações: erro de conexÍo");
      _notificacoesNetworkErrorLogged = true;
    }
    return 0;
  }
}

/**
 * Marca notificaçÍo como lida
 */
export async function marcarNotificacaoComoLida(notificacaoId: string): Promise<void> {
  const { error } = await supabase
    .from("notificacoes_sistema")
    .update({
      lida: true,
    })
    .eq("id", notificacaoId);

  if (error) {
    console.error("Erro ao marcar notificaçÍo:", error);
  }
}

/**
 * Marca todas notificações como lidas
 * @returns Número de notificações marcadas como lidas
 */
export async function marcarTodasNotificacoesComoLidas(): Promise<number> {
  // Primeiro, buscar IDs das notificações não lidas
  const { data: notificacoesNaoLidas, error: fetchError } = await supabase
    .from("notificacoes_sistema")
    .select("id")
    .eq("lida", false);

  if (fetchError) {
    console.error("[marcarTodasNotificacoesComoLidas] Erro ao buscar:", fetchError);
    throw new Error("Erro ao buscar notificações não lidas");
  }

  if (!notificacoesNaoLidas || notificacoesNaoLidas.length === 0) {
    console.log("[marcarTodasNotificacoesComoLidas] Nenhuma notificaçÍo para marcar");
    return 0;
  }

  const ids = notificacoesNaoLidas.map(n => n.id);
  console.log(`[marcarTodasNotificacoesComoLidas] Marcando ${ids.length} notificações como lidas`);

  // Atualizar usando os IDs específicos
  const { data, error } = await supabase
    .from("notificacoes_sistema")
    .update({
      lida: true,
    })
    .in("id", ids)
    .select();

  if (error) {
    console.error("[marcarTodasNotificacoesComoLidas] Erro ao atualizar:", error);
    throw new Error(`Erro ao marcar notificações: ${error.message}`);
  }

  const qtdMarcadas = data?.length || 0;
  console.log(`[marcarTodasNotificacoesComoLidas] ${qtdMarcadas} notificações marcadas com sucesso`);
  return qtdMarcadas;
}

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

/**
 * Gera mensagem completa para Especificador Master com tabelas de comissionamento
 */
function gerarMensagemEspecificadorMaster(urlProd: string): string {
  return `👋 Olá!

Você foi convidado(a) a se cadastrar como *Especificador* no *WGEasy*, a plataforma oficial do Grupo WG Almeida.

📋 Acesse o link e preencha seu cadastro:
${urlProd}

⚠️ *Importante:* Link pessoal com validade de 7 dias.

━━━━━━━━━━━━━━━━━━━━

🔑 *Como funciona o Especificador Master*

Ao se cadastrar, o sistema gera um token exclusivo:

✅ Após aprovaçÍo, você recebe um link de indicaçÍo
✅ Compartilhe para cadastrar novos especificadores
✅ Todo cadastro fica vinculado a você automaticamente

O WGEasy garante rastreabilidade, segurança e comissionamento correto.

━━━━━━━━━━━━━━━━━━━━

💰 *TABELA DE COMISSIONAMENTOS*

🟠 *MASTER - Cliente Direto*
até R$ 40 mil      → 4,0%
R$ 40 - 100 mil    → 4,7%
R$ 100 - 160 mil   → 5,8%
R$ 160 - 200 mil   → 6,7%
R$ 200 - 300 mil   → 7,8%
R$ 300 - 500 mil   → 8,2%
acima R$ 500 mil   → 10,0%

🔵 *MASTER - ParticipaçÍo*
até R$ 40 mil      → 1,2%
R$ 40 - 100 mil    → 1,5%
R$ 100 - 160 mil   → 1,9%
R$ 160 - 200 mil   → 2,3%
R$ 200 - 300 mil   → 2,8%
R$ 300 - 500 mil   → 3,2%
acima R$ 500 mil   → 3,8%

🟢 *ESPECIFICADOR - ComissÍo*
até R$ 40 mil      → 2,8%
R$ 40 - 100 mil    → 3,2%
R$ 100 - 160 mil   → 3,9%
R$ 160 - 200 mil   → 4,5%
R$ 200 - 300 mil   → 5,0%
R$ 300 - 500 mil   → 5,6%
acima R$ 500 mil   → 6,2%

━━━━━━━━━━━━━━━━━━━━

🏢 *Grupo WG Almeida*
Designer • Arquitetura • Marcenaria • Reformas`;
}

/**
 * @deprecated Usar gerarMensagemWhatsApp de @/lib/mensagemTemplates com TipoTemplate.
 * Esta funçÍo usa a API antiga (url, tipo) e não será removida enquanto houver importações legadas.
 * Gera mensagem para WhatsApp (retorna texto puro, não encodado)
 */
export function gerarMensagemWhatsApp(url: string, tipo: TipoCadastro): string {
  // Garantir que a URL use produçÍo (substituir localhost por produçÍo)
  const urlProd = url.replace(/http:\/\/localhost:\d+/, PRODUCTION_URL);

  // Template especial para Especificador Master
  if (tipo === "ESPECIFICADOR") {
    return gerarMensagemEspecificadorMaster(urlProd);
  }

  const tipoLabel = {
    CLIENTE: "Cliente",
    COLABORADOR: "Colaborador",
    FORNECEDOR: "Fornecedor",
    ESPECIFICADOR: "Especificador",
  }[tipo];

  return (
    `Olá!\n\n` +
    `Você foi convidado a se cadastrar como *${tipoLabel}* no sistema WGEasy do Grupo WG Almeida.\n\n` +
    `Clique no link abaixo para preencher seu cadastro:\n${urlProd}\n\n` +
    `Este link expira em 7 dias.\n\n` +
    `Após o preenchimento, sua solicitaçÍo será analisada e você receberá as credenciais de acesso.`
  );
}

/**
 * Gera mensagem para WhatsApp para links de SERVIÇO
 * IMPORTANTE: Sempre usa URL de produçÍo para compartilhamento
 */
export function gerarMensagemServicoWhatsApp(url: string, nomeServico: string): string {
  // Garantir que a URL use produçÍo (substituir localhost por produçÍo)
  const urlProd = url.replace(/http:\/\/localhost:\d+/, PRODUCTION_URL);

  return (
    `Olá!\n\n` +
    `Você recebeu uma solicitaçÍo de serviço de *${nomeServico}* do Grupo WG Almeida.\n\n` +
    `Clique no link abaixo para visualizar os detalhes e aceitar o serviço:\n${urlProd}\n\n` +
    `Este link expira em 7 dias.\n\n` +
    `Após aceitar, entraremos em contato para alinhar os próximos passos.`
  );
}

/**
 * Gera URL do WhatsApp com mensagem
 */
export function gerarUrlWhatsApp(mensagem: string, telefone?: string): string {
  const encoded = encodeURIComponent(mensagem);
  if (telefone) {
    // Remove caracteres não numéricos do telefone
    const tel = telefone.replace(/\D/g, "");
    return `https://wa.me/${tel}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

/**
 * Gera link mailto para email
 * IMPORTANTE: Sempre usa URL de produçÍo para compartilhamento
 */
export function gerarLinkEmail(url: string, tipo: TipoCadastro, email?: string): string {
  // Garantir que a URL use produçÍo
  const urlProd = url.replace(/http:\/\/localhost:\d+/, PRODUCTION_URL);

  // Template especial para Especificador Master
  if (tipo === "ESPECIFICADOR") {
    const assunto = encodeURIComponent(`Convite para cadastro de Especificador - Grupo WG Almeida`);
    const corpo = encodeURIComponent(gerarMensagemEspecificadorMaster(urlProd) + `\n\nAtenciosamente,\nEquipe WG Almeida`);
    return `mailto:${email || ""}?subject=${assunto}&body=${corpo}`;
  }

  const tipoLabel = {
    CLIENTE: "Cliente",
    COLABORADOR: "Colaborador",
    FORNECEDOR: "Fornecedor",
    ESPECIFICADOR: "Especificador",
  }[tipo];

  const assunto = encodeURIComponent(`Convite para cadastro - Grupo WG Almeida`);
  const corpo = encodeURIComponent(
    `Olá!\n\n` +
    `Você foi convidado a se cadastrar como ${tipoLabel} no sistema WGEasy do Grupo WG Almeida.\n\n` +
    `Clique no link abaixo para preencher seu cadastro:\n${urlProd}\n\n` +
    `Este link expira em 7 dias.\n\n` +
    `Após o preenchimento, sua solicitaçÍo será analisada e você receberá as credenciais de acesso.\n\n` +
    `Atenciosamente,\nEquipe WG Almeida`
  );

  return `mailto:${email || ""}?subject=${assunto}&body=${corpo}`;
}

/**
 * Gera link mailto para email de SERVIÇO
 * IMPORTANTE: Sempre usa URL de produçÍo para compartilhamento
 */
export function gerarLinkEmailServico(url: string, nomeServico: string, email?: string): string {
  // Garantir que a URL use produçÍo
  const urlProd = url.replace(/http:\/\/localhost:\d+/, PRODUCTION_URL);

  const assunto = encodeURIComponent(`SolicitaçÍo de Serviço: ${nomeServico} - Grupo WG Almeida`);
  const corpo = encodeURIComponent(
    `Olá!\n\n` +
    `Você recebeu uma solicitaçÍo de serviço de ${nomeServico} do Grupo WG Almeida.\n\n` +
    `Clique no link abaixo para visualizar os detalhes e aceitar o serviço:\n${urlProd}\n\n` +
    `Este link expira em 7 dias.\n\n` +
    `Após aceitar, entraremos em contato para alinhar os próximos passos.\n\n` +
    `Atenciosamente,\nEquipe WG Almeida`
  );

  return `mailto:${email || ""}?subject=${assunto}&body=${corpo}`;
}

/**
 * Retorna label do tipo de cadastro
 */
export function getLabelTipoCadastro(tipo: TipoCadastro): string {
  return {
    CLIENTE: "Cliente",
    COLABORADOR: "Colaborador",
    FORNECEDOR: "Fornecedor",
    ESPECIFICADOR: "Especificador",
  }[tipo];
}

/**
 * Retorna cor do badge para status
 */
export function getCorStatusCadastro(status: StatusCadastro): string {
  return {
    aguardando_preenchimento: "gray",
    pendente_aprovacao: "yellow",
    aprovado: "green",
    rejeitado: "red",
  }[status];
}

/**
 * Retorna label do status
 */
export function getLabelStatusCadastro(status: StatusCadastro): string {
  return {
    aguardando_preenchimento: "Aguardando preenchimento",
    pendente_aprovacao: "Pendente de aprovaçÍo",
    aprovado: "Aprovado",
    rejeitado: "Rejeitado",
  }[status];
}

// ============================================================
// FUNÇÕES - COMISSIONAMENTO
// ============================================================

/**
 * Lista especificadores/colaboradores Master (para dropdown de indicador)
 */
export async function listarEspecificadoresMaster(nucleoId?: string): Promise<EspecificadorMaster[]> {
  const { data, error } = await supabase.rpc("listar_especificadores_master", {
    p_nucleo_id: nucleoId || null,
  });

  if (error) {
    console.error("Erro ao listar masters:", error);
    return [];
  }

  return data || [];
}

/**
 * Lista categorias de comissÍo
 */
export async function listarCategoriasComissao(): Promise<CategoriaComissao[]> {
  const { data, error } = await supabase
    .from("categorias_comissao")
    .select("*")
    .eq("ativo", true)
    .order("ordem");

  if (error) {
    console.error("Erro ao listar categorias:", error);
    return [];
  }

  return data || [];
}

/**
 * Lista faixas de VGV
 */
export async function listarFaixasVGV(): Promise<FaixaVGV[]> {
  const { data, error } = await supabase
    .from("faixas_vgv")
    .select("*")
    .eq("ativo", true)
    .order("cota");

  if (error) {
    console.error("Erro ao listar faixas:", error);
    return [];
  }

  return data || [];
}

/**
 * Lista tabela completa de comissões (view)
 */
export async function listarTabelaComissoes(): Promise<TabelaComissaoItem[]> {
  const { data, error } = await supabase
    .from("vw_tabela_comissoes")
    .select("*")
    .order("ordem")
    .order("cota");

  if (error) {
    console.error("Erro ao listar tabela de comissões:", error);
    return [];
  }

  return data || [];
}

/**
 * Atualiza percentual de comissÍo
 */
export async function atualizarPercentualComissao(
  categoriaId: string,
  faixaId: string,
  percentual: number
): Promise<{ success: boolean; message: string }> {
  const { data, error } = await supabase
    .from("percentuais_comissao")
    .upsert(
      {
        categoria_id: categoriaId,
        faixa_id: faixaId,
        percentual,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: "categoria_id,faixa_id" }
    );

  if (error) {
    console.error("Erro ao atualizar percentual:", error);
    return { success: false, message: error.message };
  }

  return { success: true, message: "Percentual atualizado com sucesso!" };
}

/**
 * Adiciona nova faixa de VGV
 */
export async function adicionarFaixaVGV(faixa: {
  cota: number;
  nome: string;
  valor_minimo: number;
  valor_maximo?: number;
  descricao?: string;
}): Promise<{ success: boolean; message: string; id?: string }> {
  const { data, error } = await supabase
    .from("faixas_vgv")
    .insert(faixa)
    .select("id")
    .single();

  if (error) {
    console.error("Erro ao adicionar faixa:", error);
    return { success: false, message: error.message };
  }

  return { success: true, message: "Faixa adicionada!", id: data?.id };
}

/**
 * Atualiza faixa de VGV
 */
export async function atualizarFaixaVGV(
  faixaId: string,
  faixa: Partial<FaixaVGV>
): Promise<{ success: boolean; message: string }> {
  const { error } = await supabase
    .from("faixas_vgv")
    .update({ ...faixa, atualizado_em: new Date().toISOString() })
    .eq("id", faixaId);

  if (error) {
    console.error("Erro ao atualizar faixa:", error);
    return { success: false, message: error.message };
  }

  return { success: true, message: "Faixa atualizada!" };
}

/**
 * Calcula comissÍo para um valor de venda
 */
export async function calcularComissao(
  valorVenda: number,
  categoriaId: string
): Promise<{
  faixaId: string;
  faixaNome: string;
  percentual: number;
  valorComissao: number;
} | null> {
  const { data, error } = await supabase.rpc("calcular_comissao", {
    p_valor_venda: valorVenda,
    p_categoria_id: categoriaId,
  });

  if (error || !data || data.length === 0) {
    console.error("Erro ao calcular comissÍo:", error);
    return null;
  }

  return {
    faixaId: data[0].faixa_id,
    faixaNome: data[0].faixa_nome,
    percentual: data[0].percentual,
    valorComissao: data[0].valor_comissao,
  };
}

/**
 * Lista indicados de um Master específico
 */
export async function listarIndicadosPorMaster(masterId: string): Promise<{
  id: string;
  nome: string;
  email: string;
  tipo: string;
  categoria_nome: string;
  data_inicio: string;
}[]> {
  const { data, error } = await supabase.rpc("listar_indicados_por_master", {
    p_master_id: masterId,
  });

  if (error) {
    console.error("Erro ao listar indicados:", error);
    return [];
  }

  return data || [];
}


