// ============================================================
// TYPES: Módulo de Etapas da Obra
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

export type StatusEtapa =
  | "nao_iniciada"
  | "em_andamento"
  | "concluida"
  | "atrasada"
  | "bloqueada"
  | "cancelada";

export type TipoEtapa = "macro" | "subetapa";

export type TipoEvidencia = "antes" | "durante" | "depois" | "outro";

export type TipoAprovacao =
  | "inicio_etapa"
  | "conclusao_etapa"
  | "aprovacao_qualidade"
  | "outro";

export type TipoMudanca = "status" | "percentual" | "data" | "responsavel" | "outro";

export type TipoAlerta =
  | "prazo_vencido"
  | "prazo_proximo"
  | "dependencia_bloqueada"
  | "checklist_incompleto"
  | "sem_evidencias"
  | "atraso_acumulado"
  | "outro";

export type SeveridadeAlerta = "baixa" | "media" | "alta" | "critica";

// ============================================================
// Interface: Etapa da Obra
// ============================================================
export interface ObraEtapa {
  id: string;
  obra_id: string;

  // Informações básicas
  titulo: string;
  descricao?: string;
  tipo: TipoEtapa;
  etapa_pai_id?: string;
  ordem: number;

  // Datas e prazos
  data_inicio_prevista?: string;
  data_fim_prevista?: string;
  data_inicio_real?: string;
  data_fim_real?: string;

  // Status e progresso
  percentual_concluido: number;
  status: StatusEtapa;

  // Responsabilidade
  responsavel_id?: string;
  responsavel_nome?: string;
  responsavel_cargo?: string;

  // Dependências
  dependencias?: string[];

  // Observações
  observacoes?: string;
  notas_internas?: string;

  // Auditoria
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

// ============================================================
// Interface: Etapa com dados agregados (da view)
// ============================================================
export interface ObraEtapaCompleta extends ObraEtapa {
  obra_nome?: string;
  cliente_nome?: string;
  total_checklist: number;
  checklist_concluidos: number;
  total_evidencias: number;
  total_assinaturas: number;
  alertas_pendentes: number;
  dias_atraso: number;

  // Dados relacionados (carregados separadamente)
  subetapas?: ObraEtapa[];
  checklist?: EtapaChecklist[];
  evidencias?: EtapaEvidencia[];
  assinaturas?: EtapaAssinatura[];
  alertas?: EtapaAlerta[];
}

// ============================================================
// Interface: Checklist da Etapa
// ============================================================
export interface EtapaChecklist {
  id: string;
  etapa_id: string;

  // Item
  item: string;
  descricao?: string;
  ordem: number;
  obrigatorio: boolean;

  // Status
  concluido: boolean;
  data_conclusao?: string;
  concluido_por_id?: string;
  concluido_por_nome?: string;

  // Observações
  observacoes?: string;

  // Auditoria
  created_at: string;
  updated_at: string;
}

// ============================================================
// Interface: Evidência da Etapa
// ============================================================
export interface EtapaEvidencia {
  id: string;
  etapa_id: string;
  anexo_id: string;

  // Tipo
  tipo: TipoEvidencia;

  // DescriçÍo
  titulo?: string;
  descricao?: string;

  // Auditoria
  created_at: string;
  created_by?: string;

  // Dados do anexo (joined)
  anexo?: {
    nome_arquivo: string;
    url_publica: string;
    mime_type?: string;
    tamanho_bytes: number;
  };
}

// ============================================================
// Interface: Assinatura da Etapa
// ============================================================
export interface EtapaAssinatura {
  id: string;
  etapa_id: string;

  // Assinatura
  assinatura_base64: string;

  // Responsável
  responsavel_id?: string;
  responsavel_nome: string;
  responsavel_cargo?: string;
  responsavel_email?: string;

  // Tipo
  tipo_aprovacao: TipoAprovacao;

  // Observações
  observacoes?: string;

  // Dados técnicos
  ip_address?: string;
  user_agent?: string;
  localizacao?: Record<string, unknown>;

  // Auditoria
  data_assinatura: string;
}

// ============================================================
// Interface: Histórico da Etapa
// ============================================================
export interface EtapaHistorico {
  id: string;
  etapa_id: string;

  // Tipo de mudança
  tipo_mudanca: TipoMudanca;

  // Valores
  campo_alterado?: string;
  valor_anterior?: string;
  valor_novo?: string;

  // Justificativa
  justificativa?: string;

  // Auditoria
  alterado_por_id?: string;
  alterado_por_nome?: string;
  data_alteracao: string;
}

// ============================================================
// Interface: Alerta da Etapa
// ============================================================
export interface EtapaAlerta {
  id: string;
  etapa_id: string;
  obra_id: string;

  // Tipo e severidade
  tipo_alerta: TipoAlerta;
  severidade: SeveridadeAlerta;

  // Mensagem
  titulo: string;
  mensagem?: string;

  // Status
  lido: boolean;
  resolvido: boolean;
  data_resolucao?: string;
  resolvido_por_id?: string;

  // Destinatários
  destinatarios?: string[];

  // Auditoria
  created_at: string;
}

// ============================================================
// Interface: Formulário de criaçÍo/ediçÍo de etapa
// ============================================================
export interface EtapaFormData {
  obra_id: string;
  titulo: string;
  descricao?: string;
  tipo: TipoEtapa;
  etapa_pai_id?: string;
  ordem?: number;
  data_inicio_prevista?: string;
  data_fim_prevista?: string;
  responsavel_id?: string;
  responsavel_nome?: string;
  responsavel_cargo?: string;
  dependencias?: string[];
  observacoes?: string;
}

// ============================================================
// Interface: Filtros de busca
// ============================================================
export interface EtapasFiltros {
  obra_id?: string;
  status?: StatusEtapa[];
  tipo?: TipoEtapa;
  responsavel_id?: string;
  data_inicio?: string;
  data_fim?: string;
  apenas_atrasadas?: boolean;
  apenas_macro?: boolean;
  com_alertas?: boolean;
}

// ============================================================
// Interface: Estatísticas de etapas
// ============================================================
export interface EtapasEstatisticas {
  total_etapas: number;
  etapas_nao_iniciadas: number;
  etapas_em_andamento: number;
  etapas_concluidas: number;
  etapas_atrasadas: number;
  etapas_bloqueadas: number;
  percentual_conclusao_geral: number;
  dias_atraso_medio: number;
  total_checklist: number;
  checklist_concluidos: number;
  total_evidencias: number;
  total_assinaturas: number;
  alertas_pendentes: number;
}

// ============================================================
// Helpers e Utilitários
// ============================================================

export const STATUS_LABELS: Record<StatusEtapa, string> = {
  nao_iniciada: "NÍo Iniciada",
  em_andamento: "Em Andamento",
  concluida: "Concluída",
  atrasada: "Atrasada",
  bloqueada: "Bloqueada",
  cancelada: "Cancelada",
};

export const STATUS_COLORS: Record<StatusEtapa, string> = {
  nao_iniciada: "#9CA3AF", // Cinza
  em_andamento: "#3B82F6", // Azul
  concluida: "#10B981", // Verde
  atrasada: "#EF4444", // Vermelho
  bloqueada: "#F59E0B", // Amarelo/Laranja
  cancelada: "#6B7280", // Cinza escuro
};

export const TIPO_EVIDENCIA_LABELS: Record<TipoEvidencia, string> = {
  antes: "Antes",
  durante: "Durante",
  depois: "Depois",
  outro: "Outro",
};

export const TIPO_ALERTA_LABELS: Record<TipoAlerta, string> = {
  prazo_vencido: "Prazo Vencido",
  prazo_proximo: "Prazo Próximo",
  dependencia_bloqueada: "Dependência Bloqueada",
  checklist_incompleto: "Checklist Incompleto",
  sem_evidencias: "Sem Evidências",
  atraso_acumulado: "Atraso Acumulado",
  outro: "Outro",
};

export const SEVERIDADE_COLORS: Record<SeveridadeAlerta, string> = {
  baixa: "#10B981",
  media: "#F59E0B",
  alta: "#EF4444",
  critica: "#DC2626",
};

// ============================================================
// Funções Utilitárias
// ============================================================

export function calcularDiasAtraso(etapa: ObraEtapa): number {
  if (
    !etapa.data_fim_prevista ||
    etapa.status === "concluida" ||
    etapa.status === "cancelada"
  ) {
    return 0;
  }

  const dataFimPrevista = new Date(etapa.data_fim_prevista);
  const hoje = new Date();

  if (hoje > dataFimPrevista) {
    const diff = hoje.getTime() - dataFimPrevista.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  return 0;
}

export function calcularDiasRestantes(etapa: ObraEtapa): number {
  if (!etapa.data_fim_prevista || etapa.status === "concluida") {
    return 0;
  }

  const dataFimPrevista = new Date(etapa.data_fim_prevista);
  const hoje = new Date();
  const diff = dataFimPrevista.getTime() - hoje.getTime();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function calcularDuracao(etapa: ObraEtapa): number | null {
  if (!etapa.data_inicio_prevista || !etapa.data_fim_prevista) {
    return null;
  }

  const dataInicio = new Date(etapa.data_inicio_prevista);
  const dataFim = new Date(etapa.data_fim_prevista);
  const diff = dataFim.getTime() - dataInicio.getTime();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatarData(data?: string): string {
  if (!data) return "-";

  const date = parseDataLocal(data);
  return date.toLocaleDateString("pt-BR");
}

export function formatarDataHora(data?: string): string {
  if (!data) return "-";

  const date = parseDataLocal(data);
  return date.toLocaleString("pt-BR");
}

function parseDataLocal(valor: string): Date {
  const isoSemHora = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoSemHora) {
    const [, ano, mes, dia] = isoSemHora;
    return new Date(Number(ano), Number(mes) - 1, Number(dia));
  }
  return new Date(valor);
}

export function verificarDependenciasBloqueadas(
  etapa: ObraEtapa,
  todasEtapas: ObraEtapa[]
): boolean {
  if (!etapa.dependencias || etapa.dependencias.length === 0) {
    return false;
  }

  return etapa.dependencias.some((depId) => {
    const etapaDependencia = todasEtapas.find((e) => e.id === depId);
    return etapaDependencia && etapaDependencia.status !== "concluida";
  });
}

export function calcularProgressoGeral(etapas: ObraEtapa[]): number {
  if (etapas.length === 0) return 0;

  const somaPercentuais = etapas.reduce(
    (acc, etapa) => acc + etapa.percentual_concluido,
    0
  );

  return Math.round(somaPercentuais / etapas.length);
}

export function obterEtapasMacro(etapas: ObraEtapa[]): ObraEtapa[] {
  return etapas.filter((e) => e.tipo === "macro").sort((a, b) => a.ordem - b.ordem);
}

export function obterSubetapas(
  etapas: ObraEtapa[],
  etapaPaiId: string
): ObraEtapa[] {
  return etapas
    .filter((e) => e.etapa_pai_id === etapaPaiId)
    .sort((a, b) => a.ordem - b.ordem);
}

