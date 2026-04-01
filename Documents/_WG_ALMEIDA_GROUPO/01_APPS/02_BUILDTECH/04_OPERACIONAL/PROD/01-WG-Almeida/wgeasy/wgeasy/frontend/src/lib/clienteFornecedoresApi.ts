// ============================================================
// API: Fornecedores da Obra - Area do Cliente
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { supabase } from "./supabaseClient";

// ============================================================
// TIPOS
// ============================================================

export interface FornecedorBasico {
  fornecedor_id: string;
  fornecedor_nome: string;
  fornecedor_email: string | null;
  fornecedor_telefone: string | null;
  fornecedor_empresa: string | null;
  responsavel?: string | null;
  origem: "servico" | "equipe";
}

// Mantido para compatibilidade de páginas que usam categorias/garantia
export interface FornecedorServico extends FornecedorBasico {
  servico_id: string;
  servico_descricao: string;
  data_conclusao: string | null;
  data_inicio: string | null;
  garantia_meses: number | null;
  status: string;
  categoria_id: string | null;
  categoria_nome: string | null;
  categoria_icone: string | null;
}

export interface FornecedorAgrupado {
  categoria_id: string | null;
  categoria_nome: string;
  categoria_icone: string | null;
  fornecedores: FornecedorServico[];
}

export interface SolicitacaoAssistencia {
  id?: string;
  contrato_id: string;
  fornecedor_id: string;
  servico_id: string;
  tipo_problema: string;
  descricao: string;
  fotos_urls?: string[];
  status?: string;
  criado_em?: string;
  criado_por?: string;
}

export interface GarantiaStatus {
  vigente: boolean;
  diasRestantes: number;
  dataFim: Date | null;
  mesesGarantia: number;
}

// ============================================================
// FUNCOES AUXILIARES
// ============================================================

/**
 * Calcula o status da garantia
 */
export function calcularGarantia(
  dataConclusao: string | null,
  mesesGarantia: number | null
): GarantiaStatus {
  if (!dataConclusao || !mesesGarantia || mesesGarantia <= 0) {
    return { vigente: false, diasRestantes: 0, dataFim: null, mesesGarantia: 0 };
  }

  const conclusao = new Date(dataConclusao);
  const fimGarantia = new Date(conclusao);
  fimGarantia.setMonth(fimGarantia.getMonth() + mesesGarantia);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  if (hoje > fimGarantia) {
    return { vigente: false, diasRestantes: 0, dataFim: fimGarantia, mesesGarantia };
  }

  const diffTime = fimGarantia.getTime() - hoje.getTime();
  const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return { vigente: true, diasRestantes, dataFim: fimGarantia, mesesGarantia };
}

/**
 * Formata telefone para link WhatsApp
 */
export function formatarWhatsAppLink(telefone: string | null, mensagem?: string): string | null {
  if (!telefone) return null;

  // Remove caracteres nao numericos
  const numero = telefone.replace(/\D/g, "");

  // Adiciona codigo do pais se nao tiver
  const numeroFormatado = numero.startsWith("55") ? numero : `55${numero}`;

  const msgEncoded = mensagem ? encodeURIComponent(mensagem) : "";
  return `https://wa.me/${numeroFormatado}${msgEncoded ? `?text=${msgEncoded}` : ""}`;
}

/**
 * Formata email para link mailto
 */
export function formatarEmailLink(
  email: string | null,
  assunto?: string,
  corpo?: string
): string | null {
  if (!email) return null;

  const params = new URLSearchParams();
  if (assunto) params.set("subject", assunto);
  if (corpo) params.set("body", corpo);

  const queryString = params.toString();
  return `mailto:${email}${queryString ? `?${queryString}` : ""}`;
}

// ============================================================
// API FUNCTIONS
// ============================================================

/**
 * Lista todos os fornecedores que participaram da obra do cliente
 */
export async function listarFornecedoresDoContrato(
  contratoId: string
): Promise<FornecedorServico[]> {
  const { data, error } = await supabase
    .from("fornecedor_servicos")
    .select(`
      id,
      descricao,
      data_conclusao,
      data_inicio_prevista,
      garantia_meses,
      status,
      categoria_id,
      fornecedor:pessoas!fornecedor_id (
        id,
        nome,
        email,
        telefone,
        empresa
      ),
      categoria:fornecedor_categorias!categoria_id (
        id,
        nome,
        icone
      )
    `)
    .eq("projeto_id", contratoId)
    .in("status", ["concluido", "em_execucao", "contratado"])
    .order("categoria_id", { ascending: true });

  if (error) {
    console.error("[clienteFornecedoresApi] Erro ao listar fornecedores:", error);
    throw new Error("Erro ao carregar fornecedores da obra");
  }

  if (!data) return [];

  // Mapear para o formato esperado
  return data.map((item: any) => ({
    servico_id: item.id,
    servico_descricao: item.descricao,
    origem: "servico",
    data_conclusao: item.data_conclusao,
    data_inicio: item.data_inicio_prevista,
    garantia_meses: item.garantia_meses,
    status: item.status,
    fornecedor_id: item.fornecedor?.id || "",
    fornecedor_nome: item.fornecedor?.nome || "Fornecedor",
    fornecedor_email: item.fornecedor?.email,
    fornecedor_telefone: item.fornecedor?.telefone,
    fornecedor_empresa: item.fornecedor?.empresa,
    categoria_id: item.categoria?.id || null,
    categoria_nome: item.categoria?.nome || "Outros",
    categoria_icone: item.categoria?.icone || null,
  }));
}

/**
 * Agrupa fornecedores por categoria
 */
export function agruparPorCategoria(
  fornecedores: FornecedorServico[]
): FornecedorAgrupado[] {
  const grupos: Record<string, FornecedorAgrupado> = {};

  fornecedores.forEach((f) => {
    const key = f.categoria_id || "outros";

    if (!grupos[key]) {
      grupos[key] = {
        categoria_id: f.categoria_id,
        categoria_nome: f.categoria_nome || "Outros",
        categoria_icone: f.categoria_icone,
        fornecedores: [],
      };
    }

    grupos[key].fornecedores.push(f);
  });

  // Ordenar: categorias com nome primeiro, "Outros" por ultimo
  return Object.values(grupos).sort((a, b) => {
    if (a.categoria_nome === "Outros") return 1;
    if (b.categoria_nome === "Outros") return -1;
    return a.categoria_nome.localeCompare(b.categoria_nome);
  });
}

/**
 * Cria uma solicitacao de assistencia
 */
export async function criarSolicitacaoAssistencia(
  dados: Omit<SolicitacaoAssistencia, "id" | "criado_em" | "status">
): Promise<SolicitacaoAssistencia> {
  // Obter usuario atual
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("solicitacoes_assistencia")
    .insert({
      contrato_id: dados.contrato_id,
      fornecedor_id: dados.fornecedor_id,
      servico_id: dados.servico_id,
      tipo_problema: dados.tipo_problema,
      descricao: dados.descricao,
      fotos_urls: dados.fotos_urls || [],
      status: "aberta",
      criado_por: user?.id || null,
    })
    .select()
    .single();

  if (error) {
    console.error("[clienteFornecedoresApi] Erro ao criar solicitacao:", error);
    throw new Error("Erro ao criar solicitacao de assistencia");
  }

  // Criar notificacao para a WG
  try {
    await supabase.from("notificacoes_sistema").insert({
      tipo: "nova_solicitacao_assistencia",
      titulo: "Nova Solicitacao de Assistencia",
      mensagem: `Cliente solicitou assistencia: ${dados.tipo_problema}`,
      referencia_tipo: "solicitacoes_assistencia",
      referencia_id: data.id,
      para_todos_admins: true,
      url_acao: `/pos-vendas/assistencias/${data.id}`,
      texto_acao: "Ver Solicitacao",
    });
  } catch (notifError) {
    console.warn("[clienteFornecedoresApi] Erro ao criar notificacao:", notifError);
  }

  return data;
}

/**
 * Lista solicitacoes de assistencia do cliente
 */
export async function listarSolicitacoesAssistencia(
  contratoId: string
): Promise<SolicitacaoAssistencia[]> {
  const { data, error } = await supabase
    .from("solicitacoes_assistencia")
    .select(`
      *,
      fornecedor:pessoas!fornecedor_id (nome, email, telefone),
      servico:fornecedor_servicos!servico_id (descricao)
    `)
    .eq("contrato_id", contratoId)
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("[clienteFornecedoresApi] Erro ao listar solicitacoes:", error);
    return [];
  }

  return data || [];
}

/**
 * Obtem contrato do cliente logado
 */
export async function obterContratoDoCliente(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Buscar pessoa_id do usuario
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("pessoa_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!usuario?.pessoa_id) return null;

  // Buscar contrato ativo do cliente
  const { data: contrato } = await supabase
    .from("contratos")
    .select("id")
    .eq("cliente_id", usuario.pessoa_id)
    .in("status", ["em_andamento", "concluido", "ativo"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return contrato?.id || null;
}

// ============================================================
// LISTAGEM SIMPLIFICADA DE FORNECEDORES PARA ÁREA DO CLIENTE
// Combina fornecedores já contratados (fornecedor_servicos) e
// fornecedores adicionados na equipe do projeto (projeto_equipe).
// ============================================================

/**
 * Lista fornecedores vinculados ao contrato/projeto do cliente
 * priorizando dados de equipe quando não houver registro de serviço.
 */
export async function listarFornecedoresDoCliente(): Promise<FornecedorBasico[]> {
  // Obter contrato do cliente logado
  const contratoId = await obterContratoDoCliente();
  if (!contratoId) return [];

  // Descobrir projeto ligado ao contrato (pode haver mais de um; pega o mais recente)
  const { data: projeto } = await supabase
    .from("projetos")
    .select("id")
    .eq("contrato_id", contratoId)
    .order("created_at", { ascending: false })
    .maybeSingle();

  // Buscar fornecedores de serviços já cadastrados
  const { data: servicos, error: servicosError } = await supabase
    .from("fornecedor_servicos")
    .select(`
      id,
      descricao,
      fornecedor:pessoas!fornecedor_id (
        id,
        nome,
        email,
        telefone,
        empresa
      )
    `)
    .eq("projeto_id", contratoId) // coluna projeto_id referencia contratos
    .in("status", ["concluido", "em_execucao", "contratado"])
    .order("criado_em", { ascending: false });

  if (servicosError) {
    console.error("[clienteFornecedoresApi] Erro ao listar fornecedor_servicos:", servicosError);
  }

  const fornecedoresPorServico: FornecedorBasico[] =
    servicos?.map((item: any) => ({
      fornecedor_id: item.fornecedor?.id || "",
      fornecedor_nome: item.fornecedor?.nome || "Fornecedor",
      fornecedor_email: item.fornecedor?.email || null,
      fornecedor_telefone: item.fornecedor?.telefone || null,
      fornecedor_empresa: item.fornecedor?.empresa || null,
      responsavel: item.descricao || null,
      origem: "servico",
    })) || [];

  // Buscar fornecedores adicionados na equipe do projeto (se existir projeto)
  let fornecedoresEquipe: FornecedorBasico[] = [];
  if (projeto?.id) {
    const { data: equipe, error: equipeError } = await supabase
      .from("projeto_equipe")
      .select(`
        id,
        funcao_no_projeto,
        ativo,
        pessoa:pessoas(
          id,
          nome,
          email,
          telefone,
          empresa,
          tipo
        )
      `)
      .eq("projeto_id", projeto.id)
      .eq("ativo", true);

    if (equipeError) {
      console.error("[clienteFornecedoresApi] Erro ao listar projeto_equipe:", equipeError);
    }

    fornecedoresEquipe =
      equipe
        ?.filter((item: any) => {
          const tipo = item.pessoa?.tipo?.toUpperCase?.();
          return tipo === "FORNECEDOR";
        })
        .map((item: any) => ({
          fornecedor_id: item.pessoa?.id || "",
          fornecedor_nome: item.pessoa?.nome || "Fornecedor",
          fornecedor_email: item.pessoa?.email || null,
          fornecedor_telefone: item.pessoa?.telefone || null,
          fornecedor_empresa: item.pessoa?.empresa || null,
          responsavel: item.funcao_no_projeto || null,
          origem: "equipe",
        })) || [];
  }

  // Merge preferindo dados de serviço e preenchendo lacunas com equipe
  const merged = new Map<string, FornecedorBasico>();

  fornecedoresEquipe.forEach((f) => {
    if (f.fornecedor_id) merged.set(f.fornecedor_id, f);
  });

  fornecedoresPorServico.forEach((f) => {
    const existente = merged.get(f.fornecedor_id);
    merged.set(f.fornecedor_id, {
      ...existente,
      ...f,
      responsavel: f.responsavel || existente?.responsavel || null,
      fornecedor_email: f.fornecedor_email || existente?.fornecedor_email || null,
      fornecedor_telefone: f.fornecedor_telefone || existente?.fornecedor_telefone || null,
      fornecedor_empresa: f.fornecedor_empresa || existente?.fornecedor_empresa || null,
    });
  });

  return Array.from(merged.values()).filter((f) => f.fornecedor_id);
}


