// ============================================================
// TYPES: Módulo de Orçamentos com Workflow de AprovaçÍo
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

export type StatusOrcamento =
  | "rascunho"
  | "enviado"
  | "aprovado"
  | "rejeitado"
  | "cancelado"
  | "expirado";

// ============================================================
// Interface: Orçamento
// ============================================================
export interface Orcamento {
  id: string;
  obra_id: string | null;
  cliente_id: string | null;
  cliente?: string | null;
  titulo: string | null;
  valor_total: number | null;
  margem: number | null;
  imposto: number | null;

  // Campos de workflow
  status: StatusOrcamento;
  enviado_em: string | null;
  aprovado_em: string | null;
  rejeitado_em: string | null;
  aprovado_por: string | null;
  motivo_rejeicao: string | null;
  link_aprovacao: string | null;
  validade: string | null;
  observacoes_cliente: string | null;

  // Timestamps
  criado_em: string | null;
  atualizado_em: string | null;
}

// ============================================================
// Interface: Orçamento com dados completos
// ============================================================
export interface OrcamentoCompleto extends Orcamento {
  cliente_nome?: string;
  cliente_email?: string;
  cliente_telefone?: string;
  total_itens?: number;
  itens?: OrcamentoItem[];
  historico?: OrcamentoHistorico[];
}

// ============================================================
// Interface: Item do Orçamento
// ============================================================
export interface OrcamentoItem {
  id: string;
  orcamento_id: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  grupo: string | null;
  subtotal: number;

  // Campos de compra
  comprado: boolean;
  comprado_em: string | null;
  pedido_compra_id: string | null;
  aprovado_cliente: boolean;
}

// ============================================================
// Interface: Histórico de Aprovações
// ============================================================
export interface OrcamentoHistorico {
  id: string;
  orcamento_id: string;
  status_anterior: string | null;
  status_novo: string;
  usuario_id: string | null;
  cliente_aprovador: boolean;
  ip_address: string | null;
  user_agent: string | null;
  observacao: string | null;
  created_at: string;
}

// ============================================================
// Interface: Formulário de criaçÍo/ediçÍo
// ============================================================
export interface OrcamentoFormData {
  cliente_id?: string;
  cliente?: string;
  obra_id?: string;
  titulo: string;
  margem?: number;
  imposto?: number;
}

// ============================================================
// Interface: Dados de AprovaçÍo do Cliente
// ============================================================
export interface AprovacaoClienteData {
  link_aprovacao: string;
  aceito: boolean;
  observacoes?: string;
  itens_aprovados?: string[]; // IDs dos itens aprovados
}

// ============================================================
// Interface: Filtros de busca
// ============================================================
export interface OrcamentosFiltros {
  status?: StatusOrcamento[];
  cliente_id?: string;
  obra_id?: string;
  data_inicio?: string;
  data_fim?: string;
  busca?: string;
}

// ============================================================
// Interface: Estatísticas
// ============================================================
export interface OrcamentosEstatisticas {
  total: number;
  rascunhos: number;
  enviados: number;
  aprovados: number;
  rejeitados: number;
  cancelados: number;
  expirados: number;
  valor_total_enviados: number;
  valor_total_aprovados: number;
}

// ============================================================
// Labels e Cores
// ============================================================

export const STATUS_ORCAMENTO_LABELS: Record<StatusOrcamento, string> = {
  rascunho: "Rascunho",
  enviado: "Aguardando AprovaçÍo",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
  cancelado: "Cancelado",
  expirado: "Expirado",
};

export const STATUS_ORCAMENTO_COLORS: Record<StatusOrcamento, string> = {
  rascunho: "#6B7280", // Cinza
  enviado: "#F59E0B", // Amarelo
  aprovado: "#10B981", // Verde
  rejeitado: "#EF4444", // Vermelho
  cancelado: "#9CA3AF", // Cinza claro
  expirado: "#DC2626", // Vermelho escuro
};

export const STATUS_ORCAMENTO_BG_COLORS: Record<StatusOrcamento, string> = {
  rascunho: "bg-gray-100 text-gray-700",
  enviado: "bg-yellow-100 text-yellow-700",
  aprovado: "bg-green-100 text-green-700",
  rejeitado: "bg-red-100 text-red-700",
  cancelado: "bg-gray-100 text-gray-500",
  expirado: "bg-red-50 text-red-600",
};

// ============================================================
// Funções Utilitárias
// ============================================================

export function formatarValor(valor: number | null): string {
  if (valor === null) return "R$ 0,00";
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

export function calcularDiasRestantes(validade: string | null): number | null {
  if (!validade) return null;
  const dataValidade = new Date(validade);
  const hoje = new Date();
  const diff = dataValidade.getTime() - hoje.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function verificarExpirado(orcamento: Orcamento): boolean {
  if (orcamento.status !== "enviado") return false;
  if (!orcamento.validade) return false;
  return new Date(orcamento.validade) < new Date();
}

// ============================================================
// Permissões de AçÍo
// ============================================================

export function podeEnviarParaAprovacao(orcamento: Orcamento): boolean {
  return orcamento.status === "rascunho";
}

export function podeAprovar(orcamento: Orcamento): boolean {
  return orcamento.status === "enviado" && !verificarExpirado(orcamento);
}

export function podeRejeitar(orcamento: Orcamento): boolean {
  return orcamento.status === "enviado";
}

export function podeCancelar(orcamento: Orcamento): boolean {
  return ["rascunho", "enviado"].includes(orcamento.status);
}

export function podeEditar(orcamento: Orcamento): boolean {
  return orcamento.status === "rascunho";
}

export function podeDuplicar(_orcamento: Orcamento): boolean {
  return true; // Pode duplicar qualquer orçamento
}

export function podeGerarCompra(orcamento: Orcamento): boolean {
  return orcamento.status === "aprovado";
}

export function podeReenviar(orcamento: Orcamento): boolean {
  return ["rejeitado", "expirado", "cancelado"].includes(orcamento.status);
}

// ============================================================
// Ícones de Status
// ============================================================

export function getStatusIcon(status: StatusOrcamento): string {
  const icons: Record<StatusOrcamento, string> = {
    rascunho: "📝",
    enviado: "⏳",
    aprovado: "✅",
    rejeitado: "❌",
    cancelado: "🚫",
    expirado: "⏰",
  };
  return icons[status] || "📄";
}

// ============================================================
// Cálculos
// ============================================================

export function calcularTotalItens(itens: OrcamentoItem[]): number {
  return itens.reduce((acc, item) => acc + item.subtotal, 0);
}

export function calcularTotalComMargemImposto(
  totalItens: number,
  margem: number = 15,
  imposto: number = 7
): {
  totalItens: number;
  valorMargem: number;
  valorImposto: number;
  totalFinal: number;
} {
  const valorMargem = totalItens * (margem / 100);
  const valorImposto = totalItens * (imposto / 100);
  const totalFinal = totalItens + valorMargem + valorImposto;

  return {
    totalItens,
    valorMargem,
    valorImposto,
    totalFinal,
  };
}

export function calcularItensComprados(itens: OrcamentoItem[]): {
  total: number;
  comprados: number;
  percentual: number;
} {
  const total = itens.length;
  const comprados = itens.filter((i) => i.comprado).length;
  const percentual = total > 0 ? Math.round((comprados / total) * 100) : 0;

  return { total, comprados, percentual };
}

// ============================================================
// Estatísticas
// ============================================================

export function calcularEstatisticas(
  orcamentos: Orcamento[]
): OrcamentosEstatisticas {
  return {
    total: orcamentos.length,
    rascunhos: orcamentos.filter((o) => o.status === "rascunho").length,
    enviados: orcamentos.filter((o) => o.status === "enviado").length,
    aprovados: orcamentos.filter((o) => o.status === "aprovado").length,
    rejeitados: orcamentos.filter((o) => o.status === "rejeitado").length,
    cancelados: orcamentos.filter((o) => o.status === "cancelado").length,
    expirados: orcamentos.filter((o) => o.status === "expirado").length,
    valor_total_enviados: orcamentos
      .filter((o) => o.status === "enviado")
      .reduce((acc, o) => acc + (o.valor_total || 0), 0),
    valor_total_aprovados: orcamentos
      .filter((o) => o.status === "aprovado")
      .reduce((acc, o) => acc + (o.valor_total || 0), 0),
  };
}

