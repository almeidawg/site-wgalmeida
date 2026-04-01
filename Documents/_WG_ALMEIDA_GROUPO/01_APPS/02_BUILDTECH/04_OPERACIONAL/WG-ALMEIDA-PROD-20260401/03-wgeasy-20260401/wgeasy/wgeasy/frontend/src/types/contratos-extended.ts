// ============================================================
// TYPES EXTENDIDOS: Sistema de Contratos Multi-Núcleo
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import type {
  UnidadeNegocio,
  ContratoDadosCliente,
  ContratoDadosImovel,
} from "./contratos";

// ============================================================
// NOVOS TIPOS PARA SISTEMA MULTI-NÚCLEO
// ============================================================

export type StatusEtapa = "pendente" | "em_andamento" | "concluida" | "atrasada" | "cancelada";
export type StatusPagamento = "pendente" | "pago" | "atrasado" | "cancelado";
export type TipoDocumento = "contrato_assinado" | "projeto_executivo" | "memorial" | "termo_aceite" | "aditivo" | "outro";

// ============================================================
// Interface: Contrato Atualizado (com novos campos)
// ============================================================

export interface ContratoExtendido {
  id: string;
  numero: string;

  // Relacionamentos
  proposta_id?: string | null;
  oportunidade_id?: string | null;
  cliente_id: string;

  // Núcleos selecionados (pode gerar 1, 2 ou 3 contratos)
  nucleos_selecionados: UnidadeNegocio[];
  unidade_negocio: UnidadeNegocio; // Núcleo principal deste contrato
  contrato_grupo_id?: string | null; // Vincula contratos de uma mesma proposta

  // DescriçÍo
  descricao: string;
  observacoes?: string | null;

  // Prazos e duraçÍo
  data_inicio?: Date | string | null;
  duracao_dias_uteis?: number | null; // Calculado automaticamente
  data_previsao_termino?: Date | string | null; // Calculada automaticamente
  prazo_entrega_dias?: number; // Legacy (manter por compatibilidade)

  // Valores por núcleo (editável)
  valor_total: number;
  valor_mao_obra: number;
  valor_materiais: number;

  // Forma de pagamento
  forma_pagamento?: string | null;
  percentual_entrada: number;
  valor_entrada: number; // Calculado
  numero_parcelas: number;
  valor_parcela: number; // Calculado

  // Status
  status: "rascunho" | "ativo" | "em_execucao" | "concluido" | "cancelado";

  // Dados do cliente (cache JSON)
  dados_cliente_json?: ContratoDadosCliente | null;

  // Dados do imóvel (cache JSON)
  dados_imovel_json?: ContratoDadosImovel | null;

  // Auditoria
  created_at: string;
  updated_at: string;
}

// ============================================================
// Interface: Etapa do Contrato
// ============================================================

export interface ContratoEtapa {
  id: string;
  contrato_id: string;

  ordem: number;
  nome: string;
  descricao?: string | null;

  // Prazos
  prazo_dias_uteis?: number | null;
  data_inicio_prevista?: Date | string | null;
  data_termino_prevista?: Date | string | null;
  data_inicio_real?: Date | string | null;
  data_termino_real?: Date | string | null;

  // Pagamento
  percentual_pagamento?: number | null;
  valor_pagamento?: number | null;
  pago: boolean;
  data_pagamento?: Date | string | null;

  // Status
  status: StatusEtapa;
  observacoes?: string | null;

  created_at: string;
  updated_at: string;
}

// ============================================================
// Interface: Item do Contrato (Memorial)
// ============================================================

export interface ContratoItemExtendido {
  id: string;
  contrato_id: string;
  proposta_item_id?: string | null;
  pricelist_item_id?: string | null;

  // Dados do item
  tipo: "mao_obra" | "material" | "servico";
  descricao: string;
  nome?: string;
  quantidade: number;
  unidade: string;
  valor_unitario: number;
  valor_total: number;
  producao_diaria?: number | null;
  dias_estimados?: number | null;

  // CategorizaçÍo
  categoria?: string | null;
  nucleo?: UnidadeNegocio | null; // arquitetura, engenharia, marcenaria
  contratado_pelo_cliente?: boolean;

  // Ordem de exibiçÍo no memorial
  ordem?: number | null;

  created_at: string;
  updated_at: string;
}

// ============================================================
// Interface: Ambiente de Marcenaria
// ============================================================

export interface ContratoMarcemariaAmbiente {
  id: string;
  contrato_id: string;

  // IdentificaçÍo
  ambiente: string; // "Área de Serviço", "Office", "Suite Master", etc.
  ordem?: number | null;

  // Especificações técnicas
  caixas?: string | null; // "18mm"
  portas?: string | null; // "18mm"
  lacca?: string | null; // "NÍo", "Sim"
  dobradica?: string | null; // "Hafele"
  amortecedor_dobradica?: string | null;
  corredica?: string | null; // "Hafele"
  amortecedor_corredica?: string | null;
  puxador?: string | null; // "vide projeto"

  // Acabamentos personalizados
  acabamentos?: {
    cor?: string;
    textura?: string;
    tipo_madeira?: string;
    [key: string]: unknown;
  };

  // Medidas
  medidas_json?: {
    largura?: number;
    altura?: number;
    profundidade?: number;
    [key: string]: unknown;
  };

  observacoes?: string | null;

  created_at: string;
  updated_at: string;
}

// ============================================================
// Interface: Documento do Contrato
// ============================================================

export interface ContratoDocumento {
  id: string;
  contrato_id: string;

  tipo: TipoDocumento;
  nome: string;
  descricao?: string | null;
  url?: string | null;
  mime_type?: string | null;
  tamanho_bytes?: number | null;

  // Assinatura digital
  assinado: boolean;
  data_assinatura?: string | null;
  assinante_nome?: string | null;

  created_at: string;
  updated_at: string;
}

// ============================================================
// Interface: Pagamento do Contrato
// ============================================================

export interface ContratoPagamento {
  id: string;
  contrato_id: string;
  etapa_id?: string | null;

  numero_parcela?: number | null;
  valor: number;
  data_vencimento: Date | string;
  data_pagamento?: Date | string | null;

  forma_pagamento?: string | null;
  status: StatusPagamento;
  observacoes?: string | null;

  created_at: string;
  updated_at: string;
}

// ============================================================
// Interface: Form Data para CriaçÍo de Contrato Multi-Núcleo
// ============================================================

export interface ContratoMultiNucleoFormData {
  // Da proposta
  proposta_id?: string;
  oportunidade_id?: string;
  cliente_id: string;

  // Núcleos selecionados (checkboxes)
  nucleos_selecionados: UnidadeNegocio[]; // ["arquitetura", "engenharia"]

  // DescriçÍo geral
  descricao: string;
  observacoes?: string;

  // Prazos por núcleo
  prazos_por_nucleo: Record<UnidadeNegocio, {
    data_inicio?: string;
    duracao_dias_uteis: number;
  }>;

  // Valores editáveis por núcleo
  valores_por_nucleo: Record<UnidadeNegocio, {
    valor_total: number;
    valor_mao_obra: number;
    valor_materiais: number;
  }>;

  // Forma de pagamento (geral ou por núcleo)
  forma_pagamento: string;
  percentual_entrada: number;
  numero_parcelas: number;

  // Dados do cliente
  dados_cliente: ContratoDadosCliente;

  // Dados do imóvel
  dados_imovel: ContratoDadosImovel;

  // Dados do especificador/indicaçÍo
  especificador_id?: string;
  tem_especificador?: boolean;
  codigo_rastreamento?: string;
  observacoes_indicacao?: string;

  // Itens por núcleo (do memorial da proposta)
  itens_por_nucleo?: Record<UnidadeNegocio, ContratoItemExtendido[]>;

  // Ambientes de marcenaria (se aplicável)
  ambientes_marcenaria?: ContratoMarcemariaAmbiente[];

  // ConfiguraçÍo de pagamento por núcleo
  pagamento_por_nucleo?: Record<UnidadeNegocio, {
    percentual_entrada: number;
    numero_parcelas: number;
    forma_pagamento: string;
    dia_vencimento: number;
    conta_tipo: "real" | "virtual";
    modalidade_materiais: "revenda" | "gestao";
    fee_gestao_percentual: number;
  }>;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export const STATUS_ETAPA_LABELS: Record<StatusEtapa, string> = {
  pendente: "Pendente",
  em_andamento: "Em Andamento",
  concluida: "Concluída",
  atrasada: "Atrasada",
  cancelada: "Cancelada",
};

export const STATUS_ETAPA_COLORS: Record<StatusEtapa, string> = {
  pendente: "#9CA3AF",
  em_andamento: "#3B82F6",
  concluida: "#10B981",
  atrasada: "#EF4444",
  cancelada: "#6B7280",
};

export const STATUS_PAGAMENTO_LABELS: Record<StatusPagamento, string> = {
  pendente: "Pendente",
  pago: "Pago",
  atrasado: "Atrasado",
  cancelado: "Cancelado",
};

export const STATUS_PAGAMENTO_COLORS: Record<StatusPagamento, string> = {
  pendente: "#F59E0B",
  pago: "#10B981",
  atrasado: "#EF4444",
  cancelado: "#6B7280",
};

// ============================================================
// Utilitário: Calcular Dias Úteis
// ============================================================

export function calcularDiasUteis(dataInicio: Date, dataFim: Date): number {
  let diasUteis = 0;
  let dataAtual = new Date(dataInicio);

  while (dataAtual <= dataFim) {
    const diaSemana = dataAtual.getDay();
    // Segunda a Sexta (1-5)
    if (diaSemana >= 1 && diaSemana <= 5) {
      diasUteis++;
    }
    dataAtual.setDate(dataAtual.getDate() + 1);
  }

  return diasUteis;
}

export function adicionarDiasUteis(dataInicio: Date, diasUteis: number): Date {
  let dataAtual = new Date(dataInicio);
  let diasContados = 0;

  while (diasContados < diasUteis) {
    dataAtual.setDate(dataAtual.getDate() + 1);
    const diaSemana = dataAtual.getDay();
    // Segunda a Sexta (1-5)
    if (diaSemana >= 1 && diaSemana <= 5) {
      diasContados++;
    }
  }

  return dataAtual;
}

export function formatarDiasUteis(dias: number): string {
  return `${dias} dia${dias !== 1 ? 's' : ''} úteis`;
}

// ============================================================
// Utilitário: Agrupar Itens por Núcleo
// ============================================================

export function agruparItensPorNucleo(
  itens: ContratoItemExtendido[]
): Record<UnidadeNegocio, ContratoItemExtendido[]> {
  const grupos: Record<string, ContratoItemExtendido[]> = {
    arquitetura: [],
    engenharia: [],
    marcenaria: [],
  };

  itens.forEach(item => {
    if (item.nucleo && grupos[item.nucleo]) {
      grupos[item.nucleo].push(item);
    }
  });

  return grupos as Record<UnidadeNegocio, ContratoItemExtendido[]>;
}

// ============================================================
// Utilitário: Calcular Totais por Núcleo
// ============================================================

export function calcularTotaisPorNucleo(
  itens: ContratoItemExtendido[]
): Record<UnidadeNegocio, { total: number; maoObra: number; materiais: number }> {
  const agrupados = agruparItensPorNucleo(itens);
  const totais: Record<string, { total: number; maoObra: number; materiais: number }> = {
    arquitetura: { total: 0, maoObra: 0, materiais: 0 },
    engenharia: { total: 0, maoObra: 0, materiais: 0 },
    marcenaria: { total: 0, maoObra: 0, materiais: 0 },
  };

  Object.entries(agrupados).forEach(([nucleo, itensNucleo]) => {
    itensNucleo.forEach(item => {
      totais[nucleo].total += item.valor_total;
      if (item.tipo === "mao_obra") {
        totais[nucleo].maoObra += item.valor_total;
      } else if (item.tipo === "material") {
        totais[nucleo].materiais += item.valor_total;
      }
    });
  });

  return totais as Record<UnidadeNegocio, { total: number; maoObra: number; materiais: number }>;
}

// ============================================================
// Utilitário: Validar Dados de Contrato Multi-Núcleo
// ============================================================

export function validarContratoMultiNucleo(data: ContratoMultiNucleoFormData): string[] {
  const erros: string[] = [];

  if (!data.cliente_id) {
    erros.push("Cliente é obrigatório");
  }

  if (!data.nucleos_selecionados || data.nucleos_selecionados.length === 0) {
    erros.push("Selecione pelo menos um núcleo de negócio");
  }

  if (!data.descricao || data.descricao.trim() === "") {
    erros.push("DescriçÍo é obrigatória");
  }

  // Validar prazos por núcleo
  data.nucleos_selecionados.forEach(nucleo => {
    if (!data.prazos_por_nucleo[nucleo]?.duracao_dias_uteis) {
      erros.push(`DuraçÍo em dias úteis é obrigatória para ${nucleo}`);
    }
    if (data.prazos_por_nucleo[nucleo]?.duracao_dias_uteis <= 0) {
      erros.push(`DuraçÍo deve ser maior que zero para ${nucleo}`);
    }
  });

  // Validar valores por núcleo
  data.nucleos_selecionados.forEach(nucleo => {
    if (!data.valores_por_nucleo[nucleo]?.valor_total) {
      erros.push(`Valor total é obrigatório para ${nucleo}`);
    }
    if (data.valores_por_nucleo[nucleo]?.valor_total <= 0) {
      erros.push(`Valor total deve ser maior que zero para ${nucleo}`);
    }
  });

  // Validar dados do cliente
  if (!data.dados_cliente?.nome) {
    erros.push("Nome do cliente é obrigatório");
  }
  if (!data.dados_cliente?.cpf) {
    erros.push("CPF do cliente é obrigatório");
  }

  // Validar dados do imóvel
  if (!data.dados_imovel?.endereco_completo) {
    erros.push("Endereço do imóvel é obrigatório");
  }

  // Validar forma de pagamento
  if (!data.forma_pagamento) {
    erros.push("Forma de pagamento é obrigatória");
  }
  if (data.percentual_entrada < 0 || data.percentual_entrada > 100) {
    erros.push("Percentual de entrada deve estar entre 0 e 100");
  }
  if (data.numero_parcelas <= 0) {
    erros.push("Número de parcelas deve ser maior que zero");
  }

  return erros;
}

