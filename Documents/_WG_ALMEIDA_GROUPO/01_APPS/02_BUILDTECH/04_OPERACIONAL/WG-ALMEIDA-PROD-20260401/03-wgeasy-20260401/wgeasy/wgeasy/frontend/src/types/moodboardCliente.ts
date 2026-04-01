/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// TYPES: Moodboard Cliente - Experiencia de Escolha de Acabamentos
// Sistema WG Easy 2026 - Grupo WG Almeida
// ============================================================

import type { MemorialAcabamento, AmbienteMemorial, CategoriaMemorial, StatusMemorial } from "./memorial";

// ============================================================
// Constantes de Etapas Cronologicas
// ============================================================

export const ETAPAS_ESCOLHA = [
  "revestimentos",
  "loucas_metais",
  "marcenaria",
  "iluminacao",
  "pintura",
  "automacao",
] as const;

export type EtapaEscolha = (typeof ETAPAS_ESCOLHA)[number];

export const ETAPAS_ESCOLHA_CONFIG: Record<EtapaEscolha, {
  label: string;
  descricao: string;
  categorias_memorial: CategoriaMemorial[];
  categorias_evf: string[];
  cor: string;
  icone: string;
  ordem: number;
}> = {
  revestimentos: {
    label: "Revestimentos",
    descricao: "Pisos, paredes, granitos e marmores",
    categorias_memorial: ["ACABAMENTOS E REVESTIMENTOS"],
    categorias_evf: ["ABA", "MRM"],
    cor: "#8B5CF6",
    icone: "LayoutGrid",
    ordem: 1,
  },
  loucas_metais: {
    label: "Loucas e Metais",
    descricao: "Bacias, cubas, torneiras, toalheiros",
    categorias_memorial: ["LOUÇAS", "METAIS", "ACESSÓRIOS"],
    categorias_evf: ["CLM"],
    cor: "#0EA5E9",
    icone: "Droplet",
    ordem: 2,
  },
  marcenaria: {
    label: "Marcenaria",
    descricao: "Cores de MDF, puxadores, acabamentos",
    categorias_memorial: ["ACESSÓRIOS"],
    categorias_evf: ["MAR"],
    cor: "#D97706",
    icone: "Hammer",
    ordem: 3,
  },
  iluminacao: {
    label: "Iluminacao",
    descricao: "Luminarias, spots, pendentes",
    categorias_memorial: ["ILUMINAÇÍO"],
    categorias_evf: ["ILU"],
    cor: "#EAB308",
    icone: "Lightbulb",
    ordem: 4,
  },
  pintura: {
    label: "Pintura",
    descricao: "Cores de parede (Suvinil)",
    categorias_memorial: ["ACABAMENTOS E REVESTIMENTOS"],
    categorias_evf: ["MPT"],
    cor: "#10B981",
    icone: "PaintBucket",
    ordem: 5,
  },
  automacao: {
    label: "Automacao",
    descricao: "Interruptores, sensores, fechaduras",
    categorias_memorial: ["AUTOMAÇÍO"],
    categorias_evf: ["AUT"],
    cor: "#6366F1",
    icone: "Smartphone",
    ordem: 6,
  },
};

// ============================================================
// Status do Moodboard
// ============================================================

export const STATUS_MOODBOARD = [
  "rascunho",
  "ativo",
  "em_aprovacao",
  "aprovado",
  "concluido",
] as const;

export type StatusMoodboard = (typeof STATUS_MOODBOARD)[number];

export const STATUS_MOODBOARD_LABELS: Record<StatusMoodboard, string> = {
  rascunho: "Rascunho",
  ativo: "Ativo",
  em_aprovacao: "Em Aprovacao",
  aprovado: "Aprovado",
  concluido: "Concluido",
};

// ============================================================
// Status da Etapa de Escolha
// ============================================================

export const STATUS_ETAPA = [
  "pendente",
  "liberada",
  "em_andamento",
  "aguardando_aprovacao",
  "concluida",
] as const;

export type StatusEtapa = (typeof STATUS_ETAPA)[number];

export const STATUS_ETAPA_LABELS: Record<StatusEtapa, string> = {
  pendente: "Pendente",
  liberada: "Liberada",
  em_andamento: "Em Andamento",
  aguardando_aprovacao: "Aguardando Aprovacao",
  concluida: "Concluida",
};

export const STATUS_ETAPA_COLORS: Record<StatusEtapa, string> = {
  pendente: "#9CA3AF",
  liberada: "#3B82F6",
  em_andamento: "#F59E0B",
  aguardando_aprovacao: "#8B5CF6",
  concluida: "#10B981",
};

// ============================================================
// Tipos de Integracao de Fornecedor
// ============================================================

export const TIPOS_INTEGRACAO = [
  "manual",
  "csv",
  "api",
  "bim",
  "casoca",
] as const;

export type TipoIntegracao = (typeof TIPOS_INTEGRACAO)[number];

// ============================================================
// Interface: Configuracao de Fornecedor
// ============================================================

export interface FornecedorConfig {
  id: string;
  pessoa_id: string | null;
  codigo: string;
  nome: string;
  logo_url: string | null;
  website: string | null;
  tipo_integracao: TipoIntegracao;
  config_integracao: Record<string, unknown> | null;
  categorias_evf: string[];
  ativo: boolean;
  ordem_exibicao: number;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Interface: Item do Catalogo de Fornecedor
// ============================================================

export interface CatalogoItem {
  id: string;
  fornecedor_id: string;
  origem?: "catalogo" | "pricelist";
  pricelist_item_id?: string | null;
  codigo_produto: string | null;
  nome: string;
  descricao: string | null;
  categoria: string;
  subcategoria: string | null;
  imagem_url: string | null;
  imagens_adicionais: string[];
  preco_referencia: number | null;
  preco_atualizado_em: string | null;
  cores_disponiveis: string[];
  acabamentos: string[];
  dimensoes: Record<string, unknown> | null;
  especificacoes: Record<string, unknown> | null;
  estoque_disponivel: boolean;
  link_externo: string | null;
  arquivo_3d_url: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;

  // Join com fornecedor
  fornecedor?: FornecedorConfig;
}

// ============================================================
// Interface: Cor Suvinil
// ============================================================

export interface CorSuvinil {
  id: string;
  codigo: string;
  nome: string;
  hex: string;
  rgb: { r: number; g: number; b: number } | null;
  familia: string | null;
  colecao: string | null;
  imagem_url: string | null;
  updated_at: string;
}

// ============================================================
// Interface: Paleta do Cliente
// ============================================================

export interface PaletaCliente {
  id: string;
  cliente_id: string;
  nome: string;
  cores: Array<{
    hex: string;
    nome?: string;
    fonte?: "suvinil" | "custom" | "site";
    codigo?: string;
  }>;
  is_favorita: boolean;
  origem: "site" | "sistema";
  created_at: string;
}

// ============================================================
// Interface: Moodboard do Cliente
// ============================================================

export interface MoodboardCliente {
  id: string;
  cliente_id: string | null;
  contrato_id: string | null;
  analise_projeto_id: string | null;
  titulo: string;
  descricao: string | null;
  paleta_id: string | null;
  estilos: string[];
  imagens_referencia: Array<{
    url: string;
    descricao?: string;
    origem?: string;
  }>;
  status: StatusMoodboard;
  share_token: string | null;
  origem: "site" | "sistema";
  site_moodboard_id: string | null;
  created_at: string;
  updated_at: string;

  // Joins
  paleta?: PaletaCliente;
  cliente?: {
    id: string;
    nome: string;
    email: string;
  };
  contrato?: {
    id: string;
    numero: string;
    titulo: string;
  };
}

// ============================================================
// Interface: Etapa de Escolha
// ============================================================

export interface EtapaEscolhaContrato {
  id: string;
  contrato_id: string;
  moodboard_id: string | null;
  tipo: EtapaEscolha;
  ordem: number;
  titulo: string;
  descricao: string | null;
  categorias_liberadas: CategoriaMemorial[];
  data_inicio: string | null;
  data_limite: string | null;
  status: StatusEtapa;
  notificacao_enviada: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Interface: Selecao de Acabamento (Extensao do Memorial)
// ============================================================

export interface SelecaoAcabamentoMoodboard extends MemorialAcabamento {
  moodboard_id: string | null;
  etapa_id: string | null;
  selecionado_por_cliente: boolean;
  data_selecao_cliente: string | null;
  aprovado_por_admin: boolean;
  fornecedor_catalogo_id: string | null;

  // Joins
  catalogo_item?: CatalogoItem;
  etapa?: EtapaEscolhaContrato;
}

// ============================================================
// Interface: Pedido para Fornecedor
// ============================================================

export interface PedidoFornecedor {
  id: string;
  contrato_id: string;
  fornecedor_id: string;
  moodboard_id: string | null;
  numero_pedido: string | null;
  itens: Array<{
    memorial_id: string;
    catalogo_id: string | null;
    nome: string;
    quantidade: number;
    preco_unitario: number;
    preco_total: number;
  }>;
  valor_total: number;
  status: "rascunho" | "enviado" | "confirmado" | "em_transito" | "entregue" | "cancelado";
  data_envio: string | null;
  data_previsao_entrega: string | null;
  observacoes: string | null;
  created_at: string;

  // Joins
  fornecedor?: FornecedorConfig;
  contrato?: {
    id: string;
    numero: string;
  };
}

// ============================================================
// Interface: Formularios
// ============================================================

export interface MoodboardFormData {
  cliente_id?: string;
  contrato_id?: string;
  analise_projeto_id?: string;
  titulo: string;
  descricao?: string;
  paleta_id?: string;
  estilos?: string[];
  imagens_referencia?: Array<{
    url: string;
    descricao?: string;
  }>;
  share_token?: string;
}

export interface EtapaEscolhaFormData {
  contrato_id: string;
  moodboard_id?: string;
  tipo: EtapaEscolha;
  titulo?: string;
  descricao?: string;
  data_inicio?: string;
  data_limite?: string;
}

export interface FornecedorConfigFormData {
  pessoa_id?: string;
  codigo: string;
  nome: string;
  logo_url?: string;
  website?: string;
  tipo_integracao: TipoIntegracao;
  config_integracao?: Record<string, unknown>;
  categorias_evf?: string[];
}

export interface CatalogoItemFormData {
  fornecedor_id: string;
  codigo_produto?: string;
  nome: string;
  descricao?: string;
  categoria: string;
  subcategoria?: string;
  imagem_url?: string;
  preco_referencia?: number;
  cores_disponiveis?: string[];
  acabamentos?: string[];
  link_externo?: string;
}

// ============================================================
// Interface: Filtros
// ============================================================

export interface MoodboardFiltros {
  cliente_id?: string;
  contrato_id?: string;
  status?: StatusMoodboard;
  origem?: "site" | "sistema";
}

export interface CatalogoFiltros {
  fornecedor_id?: string;
  categoria?: string;
  subcategoria?: string;
  busca?: string;
  preco_min?: number;
  preco_max?: number;
  apenas_disponiveis?: boolean;
  incluir_pricelist?: boolean;
}

// ============================================================
// Interface: Estatisticas
// ============================================================

export interface MoodboardEstatisticas {
  total_moodboards: number;
  moodboards_ativos: number;
  total_selecoes: number;
  selecoes_aprovadas: number;
  valor_total_selecoes: number;
  etapas_concluidas: number;
  etapas_total: number;
}

export interface EtapaProgresso {
  etapa: EtapaEscolha;
  total_itens: number;
  itens_selecionados: number;
  itens_aprovados: number;
  valor_estimado: number;
  status: StatusEtapa;
  percentual: number;
}

// ============================================================
// Funcoes Helper
// ============================================================

export function getEtapaConfig(tipo: EtapaEscolha) {
  return ETAPAS_ESCOLHA_CONFIG[tipo];
}

export function getStatusEtapaLabel(status: StatusEtapa): string {
  return STATUS_ETAPA_LABELS[status] || status;
}

export function getStatusEtapaColor(status: StatusEtapa): string {
  return STATUS_ETAPA_COLORS[status] || "#9CA3AF";
}

export function calcularProgressoEtapa(
  totalItens: number,
  itensSelecionados: number
): number {
  if (totalItens === 0) return 0;
  return Math.round((itensSelecionados / totalItens) * 100);
}

export function formatarValorMoodboard(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function gerarShareToken(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

