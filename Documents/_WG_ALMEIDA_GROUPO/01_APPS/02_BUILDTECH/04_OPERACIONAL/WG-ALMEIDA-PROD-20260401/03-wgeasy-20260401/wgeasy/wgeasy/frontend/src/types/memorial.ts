// ============================================================
// TYPES: Memorial de Acabamentos
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import type { PricelistItemCompleto } from "./pricelist";

// ============================================================
// Constantes de Ambientes
// ============================================================

export const AMBIENTES_MEMORIAL = [
  "ÁREA GOURMET",
  "LAVABO",
  "BANHO SUÍTE MASTER",
  "BANHO SUÍTE 02",
  "BANHO SUÍTE 03",
  "BANHO SERVIÇO",
  "COZINHA",
  "LAVANDERIA",
  "SALA DE ESTAR",
  "SALA DE JANTAR",
  "SUÍTE MASTER",
  "SUÍTE 02",
  "SUÍTE 03",
  "CLOSET",
  "CLOSET MASTER",
  "CIRCULAÇÍO ÍNTIMA",
  "CIRCULAÇÍO SOCIAL",
  "HALL SOCIAL",
  "HOME OFFICE",
  "VARANDA",
  "PISCINA",
  "AQUECIMENTO CENTRAL",
  "AUTOMAÇÍO GERAL",
] as const;

export type AmbienteMemorial = (typeof AMBIENTES_MEMORIAL)[number];

// ============================================================
// Constantes de Categorias
// ============================================================

export const CATEGORIAS_MEMORIAL = [
  "LOUÇAS",
  "METAIS",
  "ELETRODOMÉSTICOS",
  "ACABAMENTOS E REVESTIMENTOS",
  "ACESSÓRIOS",
  "ILUMINAÇÍO",
  "AUTOMAÇÍO",
  "VIDRAÇARIA",
  "EQUIPAMENTOS",
] as const;

export type CategoriaMemorial = (typeof CATEGORIAS_MEMORIAL)[number];

// ============================================================
// Assuntos por Categoria
// ============================================================

export const ASSUNTOS_POR_CATEGORIA: Record<CategoriaMemorial, string[]> = {
  LOUÇAS: ["Bacias Sanitárias", "Cubas e Lavatórios", "Tanques"],
  METAIS: [
    "Torneiras e Misturadores",
    "Chuveiros e Duchas",
    "Itens de InstalaçÍo",
    "Acessórios de Banheiro",
  ],
  ELETRODOMÉSTICOS: [
    "Cooktop",
    "Forno",
    "Coifa",
    "Lava-Louças",
    "Adega Climatizada",
    "Refrigerador",
    "Micro-ondas",
  ],
  "ACABAMENTOS E REVESTIMENTOS": ["Piso", "Parede", "Rodapé", "Teto"],
  ACESSÓRIOS: ["Acessórios de Banheiro", "Puxadores", "Ferragens"],
  ILUMINAÇÍO: [
    "Spots e Embutidos",
    "Trilhos",
    "Pendentes",
    "Balizadores",
    "Arandelas",
  ],
  AUTOMAÇÍO: [
    "Interruptores Inteligentes",
    "Tomadas Inteligentes",
    "Sensores",
    "Câmeras",
    "Fechaduras Digitais",
  ],
  VIDRAÇARIA: ["Box", "Espelhos", "Fechamentos"],
  EQUIPAMENTOS: ["Aquecedores a Gás", "Ar Condicionado", "ClimatizaçÍo"],
};

// ============================================================
// Status do Item
// ============================================================

export const STATUS_MEMORIAL = [
  "pendente",
  "especificado",
  "aprovado",
  "comprado",
  "instalado",
] as const;

export type StatusMemorial = (typeof STATUS_MEMORIAL)[number];

export const STATUS_MEMORIAL_LABELS: Record<StatusMemorial, string> = {
  pendente: "Pendente",
  especificado: "Especificado",
  aprovado: "Aprovado",
  comprado: "Comprado",
  instalado: "Instalado",
};

export const STATUS_MEMORIAL_COLORS: Record<StatusMemorial, string> = {
  pendente: "#9CA3AF", // Cinza
  especificado: "#3B82F6", // Azul
  aprovado: "#10B981", // Verde
  comprado: "#F59E0B", // Laranja
  instalado: "#8B5CF6", // Roxo
};

// ============================================================
// Fabricantes por Categoria
// ============================================================

export const FABRICANTES_ELETRO = [
  "Elettromec",
  "Electrolux",
  "Brastemp",
  "Tramontina",
  "Fischer",
  "Franke",
];

export const FABRICANTES_ILUMINACAO = [
  "Interlight",
  "Brilia",
  "Stella",
  "Lumini",
  "La Lampe",
];

export const FABRICANTES_AUTOMACAO = [
  "Ekaza",
  "Nova Digital",
  "Intelbras",
  "Legrand",
  "Schneider",
];

export const FABRICANTES_AQUECEDORES = [
  "Rinnai",
  "Lorenzetti",
  "Bosch",
  "Komeco",
  "Orbis",
];

export const FABRICANTES_VIDRACARIA = [
  "Blindex",
  "Cebrace",
  "Guardian",
  "Decoralux",
  "Moldurama",
];

export const FABRICANTES_RODAPES = ["Moldurama", "Santa Luzia", "Eucafloor"];

export const FABRICANTES_REJUNTES = [
  "Quartzolit",
  "Kerakoll",
  "Portokoll",
  "Votomassa",
  "Weber",
];

// ============================================================
// Interface: Template de Ambiente
// ============================================================

export interface AmbienteTemplate {
  id: string;
  nome: string;
  descricao: string | null;
  categorias_padrao: CategoriaMemorial[];
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Interface: Item do Memorial
// ============================================================

export interface MemorialAcabamento {
  id: string;
  projeto_id: string;
  ambiente: AmbienteMemorial;
  categoria: CategoriaMemorial;
  assunto: string;
  item: string;

  // Vínculo com Pricelist
  pricelist_item_id: string | null;

  // Dados manuais (fallback)
  fabricante: string | null;
  modelo: string | null;
  codigo_fabricante: string | null;

  // Quantidades e preços
  quantidade: number;
  unidade: string;
  preco_unitario: number | null;
  preco_total: number | null;

  // Metadados
  observacoes: string | null;
  ordem: number;
  status: StatusMemorial;

  // Auditoria
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

// ============================================================
// Interface: Memorial Completo (com dados agregados)
// ============================================================

export interface MemorialAcabamentoCompleto extends MemorialAcabamento {
  // Dados do Pricelist agregados
  pricelist_item?: PricelistItemCompleto;

  // Dados combinados (Pricelist ou manual)
  fabricante_display: string | null;
  modelo_display: string | null;
  codigo_display: string | null;
  preco_display: number;
}

// ============================================================
// Interface: Formulário de Memorial
// ============================================================

export interface MemorialAcabamentoFormData {
  projeto_id: string;
  ambiente: AmbienteMemorial;
  categoria: CategoriaMemorial;
  assunto: string;
  item: string;
  pricelist_item_id?: string;
  fabricante?: string;
  modelo?: string;
  codigo_fabricante?: string;
  quantidade?: number;
  unidade?: string;
  preco_unitario?: number;
  observacoes?: string;
  ordem?: number;
  status?: StatusMemorial;
}

// ============================================================
// Interface: Filtros de Busca
// ============================================================

export interface MemorialFiltros {
  projeto_id?: string;
  ambiente?: AmbienteMemorial;
  categoria?: CategoriaMemorial;
  assunto?: string;
  status?: StatusMemorial;
  busca?: string;
}

// ============================================================
// Interface: Resumo por Ambiente
// ============================================================

export interface MemorialResumoAmbiente {
  projeto_id: string;
  ambiente: AmbienteMemorial;
  total_itens: number;
  itens_pendentes: number;
  itens_especificados: number;
  itens_aprovados: number;
  valor_total: number;
}

// ============================================================
// Interface: Estatísticas do Memorial
// ============================================================

export interface MemorialEstatisticas {
  total_ambientes: number;
  total_itens: number;
  itens_pendentes: number;
  itens_especificados: number;
  itens_aprovados: number;
  itens_comprados: number;
  itens_instalados: number;
  valor_total_estimado: number;
  progresso_percentual: number;
}

// ============================================================
// Funções Helper
// ============================================================

export function getStatusLabel(status: StatusMemorial): string {
  return STATUS_MEMORIAL_LABELS[status] || status;
}

export function getStatusColor(status: StatusMemorial): string {
  return STATUS_MEMORIAL_COLORS[status] || "#9CA3AF";
}

export function getAssuntosPorCategoria(categoria: CategoriaMemorial): string[] {
  return ASSUNTOS_POR_CATEGORIA[categoria] || [];
}

export function formatarPrecoMemorial(preco: number | null): string {
  if (preco === null || preco === undefined) return "-";
  return preco.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function calcularProgressoMemorial(
  itens: MemorialAcabamento[]
): number {
  if (itens.length === 0) return 0;

  const concluidos = itens.filter(
    (i) => i.status === "comprado" || i.status === "instalado"
  ).length;

  return Math.round((concluidos / itens.length) * 100);
}

export function agruparPorAmbiente(
  itens: MemorialAcabamentoCompleto[]
): Record<AmbienteMemorial, MemorialAcabamentoCompleto[]> {
  return itens.reduce((acc, item) => {
    const ambiente = item.ambiente;
    if (!acc[ambiente]) {
      acc[ambiente] = [];
    }
    acc[ambiente].push(item);
    return acc;
  }, {} as Record<AmbienteMemorial, MemorialAcabamentoCompleto[]>);
}

export function agruparPorCategoria(
  itens: MemorialAcabamentoCompleto[]
): Record<CategoriaMemorial, MemorialAcabamentoCompleto[]> {
  return itens.reduce((acc, item) => {
    const categoria = item.categoria;
    if (!acc[categoria]) {
      acc[categoria] = [];
    }
    acc[categoria].push(item);
    return acc;
  }, {} as Record<CategoriaMemorial, MemorialAcabamentoCompleto[]>);
}

export function agruparPorAmbienteECategoria(
  itens: MemorialAcabamentoCompleto[]
): Record<AmbienteMemorial, Record<CategoriaMemorial, MemorialAcabamentoCompleto[]>> {
  const porAmbiente = agruparPorAmbiente(itens);

  const resultado: Record<
    AmbienteMemorial,
    Record<CategoriaMemorial, MemorialAcabamentoCompleto[]>
  > = {} as Record<AmbienteMemorial, Record<CategoriaMemorial, MemorialAcabamentoCompleto[]>>;

  for (const [ambiente, itensAmbiente] of Object.entries(porAmbiente)) {
    resultado[ambiente as AmbienteMemorial] = agruparPorCategoria(itensAmbiente);
  }

  return resultado;
}

export function calcularTotalAmbiente(
  itens: MemorialAcabamentoCompleto[]
): number {
  return itens.reduce((total, item) => {
    const preco = item.preco_total || item.preco_display * item.quantidade || 0;
    return total + preco;
  }, 0);
}

export function calcularEstatisticasMemorial(
  itens: MemorialAcabamento[]
): MemorialEstatisticas {
  const ambientesUnicos = new Set(itens.map((i) => i.ambiente));

  const pendentes = itens.filter((i) => i.status === "pendente").length;
  const especificados = itens.filter((i) => i.status === "especificado").length;
  const aprovados = itens.filter((i) => i.status === "aprovado").length;
  const comprados = itens.filter((i) => i.status === "comprado").length;
  const instalados = itens.filter((i) => i.status === "instalado").length;

  const valorTotal = itens.reduce((acc, item) => {
    return acc + (item.preco_total || 0);
  }, 0);

  const concluidos = comprados + instalados;
  const progresso = itens.length > 0 ? (concluidos / itens.length) * 100 : 0;

  return {
    total_ambientes: ambientesUnicos.size,
    total_itens: itens.length,
    itens_pendentes: pendentes,
    itens_especificados: especificados,
    itens_aprovados: aprovados,
    itens_comprados: comprados,
    itens_instalados: instalados,
    valor_total_estimado: valorTotal,
    progresso_percentual: Math.round(progresso),
  };
}

