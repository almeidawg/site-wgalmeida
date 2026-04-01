// ============================================================
// Lista de Compras - Formatadores e Utilitários
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import type {
  ItemListaCompra,
  GrupoAmbiente,
  StatusItem,
  TipoCompra,
  Obrigatoriedade,
} from '../types';

// ============================================================
// FORMATAÇÍO DE VALORES
// ============================================================

/**
 * Formata valor em moeda brasileira (R$)
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'R$ 0,00';

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata número com separador de milhares
 */
export function formatNumber(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined) return '0';

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formata percentual
 */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0%';

  return `${formatNumber(value, 1)}%`;
}

/**
 * Formata quantidade com unidade
 */
export function formatQuantidade(qtd: number, unidade: string): string {
  return `${formatNumber(qtd, qtd % 1 === 0 ? 0 : 2)} ${unidade}`;
}

/**
 * Formata data para exibiçÍo
 */
export function formatDate(date: string | null | undefined): string {
  if (!date) return '-';

  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date));
  } catch {
    return '-';
  }
}

/**
 * Formata data e hora para exibiçÍo
 */
export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '-';

  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  } catch {
    return '-';
  }
}

// ============================================================
// CORES E ESTILOS
// ============================================================

/**
 * Retorna classes CSS para status
 */
export function getStatusClasses(status: StatusItem): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  const statusMap: Record<StatusItem, { bg: string; text: string; border: string; dot: string }> = {
    PENDENTE: {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      border: 'border-gray-300',
      dot: 'bg-gray-500',
    },
    APROVADO: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-300',
      dot: 'bg-blue-500',
    },
    COMPRADO: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-300',
      dot: 'bg-green-500',
    },
    ENTREGUE: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-300',
      dot: 'bg-emerald-500',
    },
    CANCELADO: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-300',
      dot: 'bg-red-500',
    },
  };

  return statusMap[status] || statusMap.PENDENTE;
}

/**
 * Retorna classes CSS para tipo de compra
 */
export function getTipoCompraClasses(tipo: TipoCompra): {
  bg: string;
  text: string;
  border: string;
  icon: string;
} {
  if (tipo === 'WG_COMPRA') {
    return {
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-300',
      icon: 'text-green-500',
    };
  }

  return {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-300',
    icon: 'text-amber-500',
  };
}

/**
 * Retorna classes CSS para tipo de conta
 */
export function getTipoContaClasses(tipo: 'REAL' | 'VIRTUAL'): {
  bg: string;
  text: string;
} {
  if (tipo === 'REAL') {
    return { bg: 'bg-green-100', text: 'text-green-800' };
  }
  return { bg: 'bg-amber-100', text: 'text-amber-800' };
}

/**
 * Retorna classes CSS para obrigatoriedade
 */
export function getObrigatoriedadeClasses(obrig: Obrigatoriedade): {
  bg: string;
  text: string;
  border: string;
} {
  const map: Record<Obrigatoriedade, { bg: string; text: string; border: string }> = {
    OBRIGATORIO: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-300',
    },
    RECOMENDADO: {
      bg: 'bg-amber-100',
      text: 'text-amber-800',
      border: 'border-amber-300',
    },
    OPCIONAL: {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      border: 'border-gray-300',
    },
  };

  return map[obrig];
}

// ============================================================
// LABELS E TEXTOS
// ============================================================

/**
 * Retorna label do status
 */
export function getStatusLabel(status: StatusItem): string {
  const labels: Record<StatusItem, string> = {
    PENDENTE: 'Pendente',
    APROVADO: 'Aprovado',
    COMPRADO: 'Comprado',
    ENTREGUE: 'Entregue',
    CANCELADO: 'Cancelado',
  };
  return labels[status];
}

/**
 * Retorna label do tipo de compra
 */
export function getTipoCompraLabel(tipo: TipoCompra): string {
  return tipo === 'WG_COMPRA' ? 'WG Compra' : 'Cliente Direto';
}

/**
 * Retorna label do tipo de conta
 */
export function getTipoContaLabel(tipo: 'REAL' | 'VIRTUAL'): string {
  return tipo === 'REAL' ? 'Conta Real' : 'Conta Virtual';
}

/**
 * Retorna label da obrigatoriedade
 */
export function getObrigatoriedadeLabel(obrig: Obrigatoriedade): string {
  const labels: Record<Obrigatoriedade, string> = {
    OBRIGATORIO: 'Obrigatório',
    RECOMENDADO: 'Recomendado',
    OPCIONAL: 'Opcional',
  };
  return labels[obrig];
}

// ============================================================
// AGRUPAMENTO E ORDENAÇÍO
// ============================================================

/**
 * Agrupa itens por ambiente
 */
export function agruparPorAmbiente(itens: ItemListaCompra[]): GrupoAmbiente[] {
  const grupos = new Map<string, ItemListaCompra[]>();

  itens.forEach((item) => {
    const ambiente = item.ambiente || 'Sem ambiente';
    if (!grupos.has(ambiente)) {
      grupos.set(ambiente, []);
    }
    grupos.get(ambiente)!.push(item);
  });

  return Array.from(grupos.entries())
    .map(([ambiente, itensGrupo]) => ({
      ambiente,
      itens: itensGrupo,
      totalValor: itensGrupo.reduce((sum, item) => sum + (item.valor_total || 0), 0),
      totalFee: itensGrupo.reduce((sum, item) => sum + (item.valor_fee || 0), 0),
    }))
    .sort((a, b) => a.ambiente.localeCompare(b.ambiente));
}

/**
 * Ordena itens com complementares abaixo dos pais
 */
export function ordenarComComplementares(itens: ItemListaCompra[]): ItemListaCompra[] {
  const principais = itens.filter((item) => !item.is_complementar);
  const complementares = itens.filter((item) => item.is_complementar);

  const resultado: ItemListaCompra[] = [];

  principais.forEach((principal) => {
    resultado.push(principal);
    const filhos = complementares.filter((c) => c.item_pai_id === principal.id);
    resultado.push(...filhos);
  });

  // Adicionar complementares órfÍos (sem pai na lista)
  const idsUsados = new Set(resultado.map((i) => i.id));
  complementares.forEach((c) => {
    if (!idsUsados.has(c.id)) {
      resultado.push(c);
    }
  });

  return resultado;
}

// ============================================================
// CÁLCULOS
// ============================================================

/**
 * Calcula valor total de um item
 */
export function calcularValorTotal(qtd: number, precoUnit: number): number {
  return qtd * precoUnit;
}

/**
 * Calcula valor do FEE
 */
export function calcularFee(valorTotal: number, taxaPercent: number, tipoCompra: TipoCompra): number {
  if (tipoCompra !== 'CLIENTE_DIRETO') return 0;
  return valorTotal * (taxaPercent / 100);
}

/**
 * Determina tipo de conta baseado no tipo de compra
 */
export function determinarTipoConta(tipoCompra: TipoCompra): 'REAL' | 'VIRTUAL' {
  return tipoCompra === 'WG_COMPRA' ? 'REAL' : 'VIRTUAL';
}

/**
 * Calcula resumo de uma lista de itens
 */
export function calcularResumoLista(itens: ItemListaCompra[]): {
  totalItens: number;
  valorTotal: number;
  wgCompra: number;
  clienteDireto: number;
  totalFee: number;
  contaReal: number;
  contaVirtual: number;
} {
  return itens.reduce(
    (acc, item) => {
      if (item.status === 'CANCELADO') return acc;

      acc.totalItens += 1;
      acc.valorTotal += item.valor_total || 0;
      acc.totalFee += item.valor_fee || 0;

      if (item.tipo_compra === 'WG_COMPRA') {
        acc.wgCompra += item.valor_total || 0;
        acc.contaReal += item.valor_total || 0;
      } else {
        acc.clienteDireto += item.valor_total || 0;
        acc.contaVirtual += item.valor_fee || 0;
      }

      return acc;
    },
    {
      totalItens: 0,
      valorTotal: 0,
      wgCompra: 0,
      clienteDireto: 0,
      totalFee: 0,
      contaReal: 0,
      contaVirtual: 0,
    }
  );
}

// ============================================================
// VALIDAÇÍO
// ============================================================

/**
 * Valida dados de novo item
 */
export function validarNovoItem(item: {
  ambiente?: string;
  item?: string;
  qtd_compra?: number;
  preco_unit?: number;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!item.ambiente?.trim()) {
    errors.push('Ambiente é obrigatório');
  }
  if (!item.item?.trim()) {
    errors.push('Nome do item é obrigatório');
  }
  if (!item.qtd_compra || item.qtd_compra <= 0) {
    errors.push('Quantidade deve ser maior que zero');
  }
  if (item.preco_unit === undefined || item.preco_unit < 0) {
    errors.push('Preço unitário inválido');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================
// FILTROS
// ============================================================

/**
 * Extrai lista única de ambientes
 */
export function extrairAmbientes(itens: ItemListaCompra[]): string[] {
  const ambientes = new Set(itens.map((item) => item.ambiente).filter(Boolean));
  return Array.from(ambientes).sort();
}

/**
 * Extrai lista única de categorias
 */
export function extrairCategorias(itens: ItemListaCompra[]): string[] {
  const categorias = new Set(itens.map((item) => item.categoria).filter(Boolean));
  return Array.from(categorias).sort();
}

/**
 * Extrai lista única de fornecedores
 */
export function extrairFornecedores(itens: ItemListaCompra[]): string[] {
  const fornecedores = new Set(itens.map((item) => item.fornecedor_nome).filter(Boolean));
  return Array.from(fornecedores as Set<string>).sort();
}

