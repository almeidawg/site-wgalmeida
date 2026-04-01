// ============================================================
// TYPES: Módulo de Pedidos de Compra
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

export type StatusPedidoCompra =
  | "pendente"
  | "aprovado"
  | "em_transito"
  | "entregue"
  | "cancelado";

// ============================================================
// Interface: Pedido de Compra
// ============================================================
export interface PedidoCompra {
  id: string;
  numero: string;
  contrato_id: string | null;
  fornecedor_id: string | null;

  // Valores
  valor_total: number;

  // Status
  status: StatusPedidoCompra;
  data_pedido: string; // ISO date
  data_previsao_entrega: string | null; // ISO date
  data_entrega_real: string | null; // ISO date

  // Observações
  observacoes: string | null;
  condicoes_pagamento: string | null;

  // Auditoria
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

// ============================================================
// Interface: Pedido com dados agregados
// ============================================================
export interface PedidoCompraCompleto extends PedidoCompra {
  fornecedor_nome?: string;
  contrato_numero?: string;
  total_itens: number;
  fornecedor?: {
    id: string;
    nome: string;
    email?: string;
    telefone?: string;
  };
  itens?: PedidoCompraItemCompleto[];
}

// ============================================================
// Interface: Item do Pedido de Compra
// ============================================================
export interface PedidoCompraItem {
  id: string;
  pedido_id: string;
  pricelist_item_id: string | null;

  descricao: string;
  quantidade: number;
  unidade: string;
  preco_unitario: number;
  preco_total: number;

  observacoes: string | null;

  created_at: string;
}

// ============================================================
// Interface: Item com dados do pricelist
// ============================================================
export interface PedidoCompraItemCompleto extends PedidoCompraItem {
  pricelist_item?: {
    codigo: string | null;
    marca: string | null;
    especificacoes: Record<string, unknown> | null;
  };
}

// ============================================================
// Interface: Formulário de criaçÍo/ediçÍo de pedido
// ============================================================
export interface PedidoCompraFormData {
  contrato_id?: string;
  fornecedor_id: string;
  data_pedido: string;
  data_previsao_entrega?: string;
  observacoes?: string;
  condicoes_pagamento?: string;
}

// ============================================================
// Interface: Formulário de item do pedido
// ============================================================
export interface PedidoCompraItemFormData {
  pricelist_item_id?: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  preco_unitario: number;
  observacoes?: string;
}

// ============================================================
// Interface: Filtros de busca
// ============================================================
export interface PedidosCompraFiltros {
  status?: StatusPedidoCompra[];
  fornecedor_id?: string;
  contrato_id?: string;
  data_pedido_inicio?: string;
  data_pedido_fim?: string;
  busca?: string; // busca por número
}

// ============================================================
// Interface: Estatísticas
// ============================================================
export interface PedidosCompraEstatisticas {
  total_pedidos: number;
  pedidos_pendentes: number;
  pedidos_aprovados: number;
  pedidos_em_transito: number;
  pedidos_entregues: number;
  pedidos_cancelados: number;
  valor_total_pendente: number;
  valor_total_mes: number;
}

// ============================================================
// Helpers e Utilitários
// ============================================================

export const STATUS_PEDIDO_LABELS: Record<StatusPedidoCompra, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  em_transito: "Em Trânsito",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export const STATUS_PEDIDO_COLORS: Record<StatusPedidoCompra, string> = {
  pendente: "#F59E0B", // Amarelo
  aprovado: "#3B82F6", // Azul
  em_transito: "#8B5CF6", // Roxo
  entregue: "#10B981", // Verde
  cancelado: "#EF4444", // Vermelho
};

// ============================================================
// Funções Utilitárias
// ============================================================

export function formatarNumeroPedido(numero: string): string {
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

function parseDataLocal(valor: string): Date {
  const isoSemHora = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoSemHora) {
    const [, ano, mes, dia] = isoSemHora;
    return new Date(Number(ano), Number(mes) - 1, Number(dia));
  }
  return new Date(valor);
}

export function calcularValorTotalItens(itens: PedidoCompraItem[]): number {
  return itens.reduce((acc, item) => acc + item.preco_total, 0);
}

export function calcularDiasAteEntrega(pedido: PedidoCompra): number | null {
  if (!pedido.data_previsao_entrega || pedido.status === "entregue") {
    return null;
  }

  const dataPrevisao = new Date(pedido.data_previsao_entrega);
  const hoje = new Date();
  const diff = dataPrevisao.getTime() - hoje.getTime();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function calcularDiasAtraso(pedido: PedidoCompra): number | null {
  if (
    !pedido.data_previsao_entrega ||
    pedido.status === "entregue" ||
    pedido.status === "cancelado"
  ) {
    return null;
  }

  const dataPrevisao = new Date(pedido.data_previsao_entrega);
  const hoje = new Date();

  if (hoje <= dataPrevisao) return null;

  const diff = hoje.getTime() - dataPrevisao.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function validarPedido(pedido: PedidoCompraFormData): string[] {
  const erros: string[] = [];

  if (!pedido.fornecedor_id) {
    erros.push("Fornecedor é obrigatório");
  }

  if (!pedido.data_pedido) {
    erros.push("Data do pedido é obrigatória");
  }

  if (pedido.data_pedido && pedido.data_previsao_entrega) {
    const dataPedido = new Date(pedido.data_pedido);
    const dataPrevisao = new Date(pedido.data_previsao_entrega);

    if (dataPrevisao < dataPedido) {
      erros.push("Data de previsÍo de entrega deve ser posterior à data do pedido");
    }
  }

  return erros;
}

export function validarItem(item: PedidoCompraItemFormData): string[] {
  const erros: string[] = [];

  if (!item.descricao || item.descricao.trim() === "") {
    erros.push("DescriçÍo é obrigatória");
  }

  if (!item.quantidade || item.quantidade <= 0) {
    erros.push("Quantidade deve ser maior que zero");
  }

  if (!item.preco_unitario || item.preco_unitario < 0) {
    erros.push("Preço unitário deve ser maior ou igual a zero");
  }

  if (!item.unidade || item.unidade.trim() === "") {
    erros.push("Unidade é obrigatória");
  }

  return erros;
}

export function podeAprovarPedido(pedido: PedidoCompra): boolean {
  return pedido.status === "pendente";
}

export function podeCancelarPedido(pedido: PedidoCompra): boolean {
  return pedido.status !== "entregue" && pedido.status !== "cancelado";
}

export function podeEditarPedido(pedido: PedidoCompra): boolean {
  return pedido.status === "pendente";
}

export function podeMarcarComoEntregue(pedido: PedidoCompra): boolean {
  return pedido.status === "em_transito" || pedido.status === "aprovado";
}

export function getStatusPedidoIcon(status: StatusPedidoCompra): string {
  const icons: Record<StatusPedidoCompra, string> = {
    pendente: "⏳",
    aprovado: "✅",
    em_transito: "🚚",
    entregue: "📦",
    cancelado: "❌",
  };

  return icons[status] || "📄";
}

export function getUrgenciaPedido(pedido: PedidoCompra): {
  label: string;
  color: string;
  urgente: boolean;
} {
  const diasAtraso = calcularDiasAtraso(pedido);
  const diasAteEntrega = calcularDiasAteEntrega(pedido);

  if (diasAtraso !== null && diasAtraso > 0) {
    return {
      label: `Atrasado ${diasAtraso} dia${diasAtraso > 1 ? "s" : ""}`,
      color: "#EF4444",
      urgente: true,
    };
  }

  if (diasAteEntrega !== null) {
    if (diasAteEntrega === 0) {
      return {
        label: "Entrega hoje",
        color: "#F59E0B",
        urgente: true,
      };
    }

    if (diasAteEntrega > 0 && diasAteEntrega <= 3) {
      return {
        label: `${diasAteEntrega} dia${diasAteEntrega > 1 ? "s" : ""} para entrega`,
        color: "#F59E0B",
        urgente: true,
      };
    }

    if (diasAteEntrega > 3) {
      return {
        label: `${diasAteEntrega} dias para entrega`,
        color: "#10B981",
        urgente: false,
      };
    }
  }

  return {
    label: pedido.status === "entregue" ? "Entregue" : "Sem previsÍo",
    color: "#9CA3AF",
    urgente: false,
  };
}

export function agruparPorFornecedor(
  pedidos: PedidoCompraCompleto[]
): Record<string, PedidoCompraCompleto[]> {
  return pedidos.reduce((acc, pedido) => {
    const fornecedor = pedido.fornecedor_nome || "Sem fornecedor";
    if (!acc[fornecedor]) {
      acc[fornecedor] = [];
    }
    acc[fornecedor].push(pedido);
    return acc;
  }, {} as Record<string, PedidoCompraCompleto[]>);
}

export function agruparPorStatus(
  pedidos: PedidoCompra[]
): Record<StatusPedidoCompra, PedidoCompra[]> {
  const grupos: Record<StatusPedidoCompra, PedidoCompra[]> = {
    pendente: [],
    aprovado: [],
    em_transito: [],
    entregue: [],
    cancelado: [],
  };

  pedidos.forEach((pedido) => {
    grupos[pedido.status].push(pedido);
  });

  return grupos;
}

export function calcularEstatisticas(
  pedidos: PedidoCompra[]
): PedidosCompraEstatisticas {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const pedidosMes = pedidos.filter((p) => {
    const dataPedido = new Date(p.data_pedido);
    return dataPedido >= inicioMes;
  });

  return {
    total_pedidos: pedidos.length,
    pedidos_pendentes: pedidos.filter((p) => p.status === "pendente").length,
    pedidos_aprovados: pedidos.filter((p) => p.status === "aprovado").length,
    pedidos_em_transito: pedidos.filter((p) => p.status === "em_transito").length,
    pedidos_entregues: pedidos.filter((p) => p.status === "entregue").length,
    pedidos_cancelados: pedidos.filter((p) => p.status === "cancelado").length,
    valor_total_pendente: pedidos
      .filter((p) => p.status === "pendente")
      .reduce((acc, p) => acc + p.valor_total, 0),
    valor_total_mes: pedidosMes.reduce((acc, p) => acc + p.valor_total, 0),
  };
}

