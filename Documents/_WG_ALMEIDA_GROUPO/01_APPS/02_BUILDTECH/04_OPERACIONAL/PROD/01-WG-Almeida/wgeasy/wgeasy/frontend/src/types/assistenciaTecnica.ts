// ============================================================
// TYPES: Módulo de Assistência Técnica
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

export type StatusOS =
  | "aberta"
  | "em_atendimento"
  | "aguardando_peca"
  | "aguardando_cliente"
  | "concluida"
  | "cancelada";

export type PrioridadeOS =
  | "baixa"
  | "media"
  | "alta"
  | "urgente";

export type TipoAtendimento =
  | "garantia"
  | "manutencao"
  | "instalacao"
  | "outros";

// ============================================================
// Interface: Ordem de Serviço
// ============================================================
export interface OrdemServico {
  id: string;
  numero: string;
  cliente_id: string;
  contrato_id: string | null;

  // Informações do Atendimento
  titulo: string;
  descricao: string;
  tipo_atendimento: TipoAtendimento;
  prioridade: PrioridadeOS;

  // Status e Datas
  status: StatusOS;
  data_abertura: string; // ISO date
  data_previsao: string | null; // ISO date
  data_conclusao: string | null; // ISO date

  // Responsável
  tecnico_responsavel_id: string | null;

  // Valores
  valor_mao_obra: number;
  valor_pecas: number;
  valor_total: number;
  valor_aprovado_cliente: boolean;

  // LocalizaçÍo
  endereco_atendimento: string | null;

  // Observações
  observacoes: string | null;
  solucao: string | null;

  // Auditoria
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

// ============================================================
// Interface: OS com dados agregados
// ============================================================
export interface OrdemServicoCompleta extends OrdemServico {
  cliente?: {
    id: string;
    nome: string;
    email?: string;
    telefone?: string;
  };
  tecnico?: {
    id: string;
    nome: string;
    email?: string;
    telefone?: string;
  };
  contrato?: {
    id: string;
    numero: string;
  };
  total_itens: number;
  itens?: ItemOS[];
  historico?: HistoricoOSCompleto[];
}

// ============================================================
// Interface: Item da OS (Peças/Materiais)
// ============================================================
export interface ItemOS {
  id: string;
  os_id: string;
  pricelist_item_id: string | null;

  descricao: string;
  quantidade: number;
  unidade: string;
  valor_unitario: number;
  valor_total: number;

  aplicado: boolean; // Se foi aplicado/usado no atendimento

  observacoes: string | null;

  created_at: string;
}

// ============================================================
// Interface: Item com dados do pricelist
// ============================================================
export interface ItemOSCompleto extends ItemOS {
  pricelist_item?: {
    codigo: string | null;
    marca: string | null;
    especificacoes: Record<string, unknown> | null;
  };
}

// ============================================================
// Interface: Histórico de Atendimento
// ============================================================
export interface HistoricoOS {
  id: string;
  os_id: string;
  usuario_id: string;

  descricao: string;
  status_anterior: StatusOS | null;
  status_novo: StatusOS | null;

  created_at: string;
}

// ============================================================
// Interface: Histórico com dados do usuário
// ============================================================
export interface HistoricoOSCompleto extends HistoricoOS {
  usuario?: {
    id: string;
    nome: string;
  };
}

// ============================================================
// Interface: Formulário de criaçÍo/ediçÍo de OS
// ============================================================
export interface OrdemServicoFormData {
  cliente_id: string;
  contrato_id?: string;
  titulo: string;
  descricao: string;
  tipo_atendimento: TipoAtendimento;
  prioridade: PrioridadeOS;
  data_previsao?: string;
  tecnico_responsavel_id?: string;
  endereco_atendimento?: string;
  observacoes?: string;
}

// ============================================================
// Interface: Formulário de item da OS
// ============================================================
export interface ItemOSFormData {
  pricelist_item_id?: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  valor_unitario: number;
  observacoes?: string;
}

// ============================================================
// Interface: Filtros de busca
// ============================================================
export interface OSFiltros {
  status?: StatusOS[];
  prioridade?: PrioridadeOS[];
  tipo_atendimento?: TipoAtendimento[];
  cliente_id?: string;
  tecnico_id?: string;
  contrato_id?: string;
  data_abertura_inicio?: string;
  data_abertura_fim?: string;
  busca?: string; // busca por número ou título
}

// ============================================================
// Interface: Estatísticas
// ============================================================
export interface OSEstatisticas {
  total_os: number;
  os_abertas: number;
  os_em_atendimento: number;
  os_aguardando_peca: number;
  os_aguardando_cliente: number;
  os_concluidas: number;
  os_canceladas: number;
  tempo_medio_atendimento: number; // em horas
  valor_total_mes: number;
  taxa_conclusao: number; // percentual
}

// ============================================================
// Helpers e Utilitários
// ============================================================

export const STATUS_OS_LABELS: Record<StatusOS, string> = {
  aberta: "Aberta",
  em_atendimento: "Em Atendimento",
  aguardando_peca: "Aguardando Peça",
  aguardando_cliente: "Aguardando Cliente",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export const STATUS_OS_COLORS: Record<StatusOS, string> = {
  aberta: "#F59E0B", // Amarelo
  em_atendimento: "#3B82F6", // Azul
  aguardando_peca: "#8B5CF6", // Roxo
  aguardando_cliente: "#F97316", // Laranja
  concluida: "#10B981", // Verde
  cancelada: "#EF4444", // Vermelho
};

export const PRIORIDADE_LABELS: Record<PrioridadeOS, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

export const PRIORIDADE_COLORS: Record<PrioridadeOS, string> = {
  baixa: "#10B981", // Verde
  media: "#F59E0B", // Amarelo
  alta: "#F97316", // Laranja
  urgente: "#EF4444", // Vermelho
};

export const TIPO_ATENDIMENTO_LABELS: Record<TipoAtendimento, string> = {
  garantia: "Garantia",
  manutencao: "ManutençÍo",
  instalacao: "InstalaçÍo",
  outros: "Outros",
};

export const TIPO_ATENDIMENTO_ICONS: Record<TipoAtendimento, string> = {
  garantia: "🛡️",
  manutencao: "🔧",
  instalacao: "🔨",
  outros: "📋",
};

// ============================================================
// Funções Utilitárias
// ============================================================

export function formatarNumeroOS(numero: string): string {
  return numero.toUpperCase();
}

export function formatarValor(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatarData(data?: string | null): string {
  if (!data) return "-";
  const date = parseDataLocal(data);
  return date.toLocaleDateString("pt-BR");
}

export function formatarDataHora(data?: string | null): string {
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

export function calcularValorTotalItens(itens: ItemOS[]): number {
  return itens.reduce((acc, item) => acc + item.valor_total, 0);
}

export function calcularTempoAtendimento(os: OrdemServico): number | null {
  if (!os.data_conclusao) return null;

  const dataAbertura = new Date(os.data_abertura);
  const dataConclusao = new Date(os.data_conclusao);
  const diff = dataConclusao.getTime() - dataAbertura.getTime();

  return Math.floor(diff / (1000 * 60 * 60)); // em horas
}

export function calcularDiasAtePrevisao(os: OrdemServico): number | null {
  if (!os.data_previsao || os.status === "concluida" || os.status === "cancelada") {
    return null;
  }

  const dataPrevisao = new Date(os.data_previsao);
  const hoje = new Date();
  const diff = dataPrevisao.getTime() - hoje.getTime();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function calcularDiasAtraso(os: OrdemServico): number | null {
  if (
    !os.data_previsao ||
    os.status === "concluida" ||
    os.status === "cancelada"
  ) {
    return null;
  }

  const dataPrevisao = new Date(os.data_previsao);
  const hoje = new Date();

  if (hoje <= dataPrevisao) return null;

  const diff = hoje.getTime() - dataPrevisao.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function validarOS(os: OrdemServicoFormData): string[] {
  const erros: string[] = [];

  if (!os.cliente_id) {
    erros.push("Cliente é obrigatório");
  }

  if (!os.titulo || os.titulo.trim() === "") {
    erros.push("Título é obrigatório");
  }

  if (!os.descricao || os.descricao.trim() === "") {
    erros.push("DescriçÍo é obrigatória");
  }

  return erros;
}

export function validarItem(item: ItemOSFormData): string[] {
  const erros: string[] = [];

  if (!item.descricao || item.descricao.trim() === "") {
    erros.push("DescriçÍo é obrigatória");
  }

  if (!item.quantidade || item.quantidade <= 0) {
    erros.push("Quantidade deve ser maior que zero");
  }

  if (!item.valor_unitario || item.valor_unitario < 0) {
    erros.push("Valor unitário deve ser maior ou igual a zero");
  }

  if (!item.unidade || item.unidade.trim() === "") {
    erros.push("Unidade é obrigatória");
  }

  return erros;
}

export function podeIniciarAtendimento(os: OrdemServico): boolean {
  return os.status === "aberta";
}

export function podeConcluirOS(os: OrdemServico): boolean {
  return os.status === "em_atendimento" || os.status === "aguardando_cliente";
}

export function podeCancelarOS(os: OrdemServico): boolean {
  return os.status !== "concluida" && os.status !== "cancelada";
}

export function podeEditarOS(os: OrdemServico): boolean {
  return os.status === "aberta" || os.status === "em_atendimento";
}

export function podeAprovarOrcamento(os: OrdemServico): boolean {
  return !os.valor_aprovado_cliente && os.status !== "concluida" && os.status !== "cancelada";
}

export function getStatusOSIcon(status: StatusOS): string {
  const icons: Record<StatusOS, string> = {
    aberta: "📋",
    em_atendimento: "🔧",
    aguardando_peca: "⏳",
    aguardando_cliente: "👤",
    concluida: "✅",
    cancelada: "❌",
  };

  return icons[status] || "📄";
}

export function getPrioridadeIcon(prioridade: PrioridadeOS): string {
  const icons: Record<PrioridadeOS, string> = {
    baixa: "⬇️",
    media: "➡️",
    alta: "⬆️",
    urgente: "🔴",
  };

  return icons[prioridade] || "➡️";
}

export function getUrgenciaOS(os: OrdemServico): {
  label: string;
  color: string;
  urgente: boolean;
} {
  const diasAtraso = calcularDiasAtraso(os);
  const diasAtePrevisao = calcularDiasAtePrevisao(os);

  if (diasAtraso !== null && diasAtraso > 0) {
    return {
      label: `Atrasado ${diasAtraso} dia${diasAtraso > 1 ? "s" : ""}`,
      color: "#EF4444",
      urgente: true,
    };
  }

  if (diasAtePrevisao !== null) {
    if (diasAtePrevisao === 0) {
      return {
        label: "PrevisÍo hoje",
        color: "#F59E0B",
        urgente: true,
      };
    }

    if (diasAtePrevisao > 0 && diasAtePrevisao <= 3) {
      return {
        label: `${diasAtePrevisao} dia${diasAtePrevisao > 1 ? "s" : ""} para previsÍo`,
        color: "#F59E0B",
        urgente: true,
      };
    }

    if (diasAtePrevisao > 3) {
      return {
        label: `${diasAtePrevisao} dias para previsÍo`,
        color: "#10B981",
        urgente: false,
      };
    }
  }

  return {
    label: os.status === "concluida" ? "Concluída" : "Sem previsÍo",
    color: "#9CA3AF",
    urgente: false,
  };
}

export function agruparPorStatus(
  ordens: OrdemServico[]
): Record<StatusOS, OrdemServico[]> {
  const grupos: Record<StatusOS, OrdemServico[]> = {
    aberta: [],
    em_atendimento: [],
    aguardando_peca: [],
    aguardando_cliente: [],
    concluida: [],
    cancelada: [],
  };

  ordens.forEach((os) => {
    grupos[os.status].push(os);
  });

  return grupos;
}

export function agruparPorPrioridade(
  ordens: OrdemServico[]
): Record<PrioridadeOS, OrdemServico[]> {
  const grupos: Record<PrioridadeOS, OrdemServico[]> = {
    baixa: [],
    media: [],
    alta: [],
    urgente: [],
  };

  ordens.forEach((os) => {
    grupos[os.prioridade].push(os);
  });

  return grupos;
}

export function agruparPorTecnico(
  ordens: OrdemServicoCompleta[]
): Record<string, OrdemServicoCompleta[]> {
  return ordens.reduce((acc, os) => {
    const tecnico = os.tecnico?.nome || "Sem técnico";
    if (!acc[tecnico]) {
      acc[tecnico] = [];
    }
    acc[tecnico].push(os);
    return acc;
  }, {} as Record<string, OrdemServicoCompleta[]>);
}

export function calcularEstatisticas(
  ordens: OrdemServico[]
): OSEstatisticas {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const ordensMes = ordens.filter((os) => {
    const dataAbertura = new Date(os.data_abertura);
    return dataAbertura >= inicioMes;
  });

  const ordensConcluidas = ordens.filter((os) => os.status === "concluida");

  const temposAtendimento = ordensConcluidas
    .map(calcularTempoAtendimento)
    .filter((t) => t !== null) as number[];

  const tempoMedio =
    temposAtendimento.length > 0
      ? temposAtendimento.reduce((a, b) => a + b, 0) / temposAtendimento.length
      : 0;

  const taxaConclusao =
    ordens.length > 0
      ? (ordensConcluidas.length / ordens.length) * 100
      : 0;

  return {
    total_os: ordens.length,
    os_abertas: ordens.filter((os) => os.status === "aberta").length,
    os_em_atendimento: ordens.filter((os) => os.status === "em_atendimento").length,
    os_aguardando_peca: ordens.filter((os) => os.status === "aguardando_peca").length,
    os_aguardando_cliente: ordens.filter((os) => os.status === "aguardando_cliente").length,
    os_concluidas: ordensConcluidas.length,
    os_canceladas: ordens.filter((os) => os.status === "cancelada").length,
    tempo_medio_atendimento: Math.round(tempoMedio),
    valor_total_mes: ordensMes.reduce((acc, os) => acc + os.valor_total, 0),
    taxa_conclusao: Math.round(taxaConclusao),
  };
}

export function filtrarOrdens(
  ordens: OrdemServicoCompleta[],
  filtros: OSFiltros
): OrdemServicoCompleta[] {
  let resultado = [...ordens];

  if (filtros.status && filtros.status.length > 0) {
    resultado = resultado.filter((os) => filtros.status!.includes(os.status));
  }

  if (filtros.prioridade && filtros.prioridade.length > 0) {
    resultado = resultado.filter((os) => filtros.prioridade!.includes(os.prioridade));
  }

  if (filtros.tipo_atendimento && filtros.tipo_atendimento.length > 0) {
    resultado = resultado.filter((os) => filtros.tipo_atendimento!.includes(os.tipo_atendimento));
  }

  if (filtros.cliente_id) {
    resultado = resultado.filter((os) => os.cliente_id === filtros.cliente_id);
  }

  if (filtros.tecnico_id) {
    resultado = resultado.filter((os) => os.tecnico_responsavel_id === filtros.tecnico_id);
  }

  if (filtros.contrato_id) {
    resultado = resultado.filter((os) => os.contrato_id === filtros.contrato_id);
  }

  if (filtros.busca) {
    const busca = filtros.busca.toLowerCase();
    resultado = resultado.filter(
      (os) =>
        os.numero.toLowerCase().includes(busca) ||
        os.titulo.toLowerCase().includes(busca)
    );
  }

  return resultado;
}

