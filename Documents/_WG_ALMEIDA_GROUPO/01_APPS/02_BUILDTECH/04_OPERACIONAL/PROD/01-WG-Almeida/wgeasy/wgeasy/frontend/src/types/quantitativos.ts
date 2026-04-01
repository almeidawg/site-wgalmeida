// ============================================================
// TYPES: Módulo de Quantitativos de Projeto
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

export type NucleoQuantitativo = "arquitetura" | "engenharia" | "marcenaria";
export type StatusQuantitativo = "em_elaboracao" | "aprovado" | "revisao" | "arquivado";
export type TipoTemplate = "ambiente" | "categoria";

// ============================================================
// Interface: Projeto de Quantitativo
// ============================================================
export interface QuantitativoProjeto {
  id: string;

  // Relacionamentos
  proposta_id: string | null;
  contrato_id: string | null;
  cliente_id: string;
  nucleo_id: string | null;

  // Núcleo
  nucleo: NucleoQuantitativo;

  // IdentificaçÍo
  numero: string;
  nome: string;
  descricao: string | null;

  // Dados do Projeto
  area_construida: number | null;
  area_total: number | null;
  endereco_obra: string | null;

  // Metadados
  status: StatusQuantitativo;
  versao: number;
  observacoes: string | null;

  // Auditoria
  criado_por: string | null;
  atualizado_por: string | null;
  criado_em: string;
  atualizado_em: string;
}

// ============================================================
// Interface: Ambiente de Quantitativo
// ============================================================
export interface QuantitativoAmbiente {
  id: string;
  projeto_id: string;

  // IdentificaçÍo
  codigo: string | null;
  nome: string;
  descricao: string | null;

  // Dimensões
  largura: number | null;
  comprimento: number | null;
  area: number | null;
  // Compatibilidade: alguns lugares usam `area_m2`
  area_m2?: number | null;
  pe_direito: number | null;
  perimetro: number | null;

  // OrganizaçÍo
  ordem: number;

  // Auditoria
  criado_em: string;
  atualizado_em: string;
  // Possíveis joins usados na UI
  categorias?: QuantitativoCategoriaCompleta[];
}

// ============================================================
// Interface: Categoria de Quantitativo
// ============================================================
export interface QuantitativoCategoria {
  id: string;
  ambiente_id: string;

  // IdentificaçÍo
  nome: string;
  descricao: string | null;
  cor: string | null; // Hexadecimal color

  // OrganizaçÍo
  ordem: number;

  // Auditoria
  criado_em: string;
  atualizado_em: string;
  // Alguns componentes esperam `itens` mesmo na tipagem base
  itens?: QuantitativoItem[];
}

// ============================================================
// Interface: Item de Quantitativo
// ============================================================
export interface QuantitativoItem {
  id: string;

  // Relacionamentos
  categoria_id: string;
  pricelist_item_id: string | null;

  // IdentificaçÍo
  codigo: string | null;
  nome: string;
  descricao: string | null;
  especificacao: string | null;

  // Quantidades
  quantidade: number;
  unidade: string;

  // Preço
  preco_unitario: number | null;
  preco_total: number | null;

  // VinculaçÍo com Pricelist
  sincronizar_preco: boolean;

  // Metadados
  observacoes: string | null;
  ordem: number;

  // Auditoria
  criado_em: string;
  atualizado_em: string;
}

// ============================================================
// Interface: Template de Quantitativo
// ============================================================
export interface QuantitativoTemplate {
  id: string;

  // IdentificaçÍo
  nome: string;
  tipo: TipoTemplate;
  nucleo: NucleoQuantitativo | null;

  // Dados do Template
  estrutura: Record<string, unknown>; // JSON structure

  // Metadados
  descricao: string | null;
  ativo: boolean;

  // Auditoria
  criado_por: string | null;
  criado_em: string;
  atualizado_em: string;
}

// ============================================================
// Interfaces: Dados Completos (com joins)
// ============================================================

export interface QuantitativoProjetoCompleto extends QuantitativoProjeto {
  cliente_nome?: string;
  cliente_email?: string;
  cliente_telefone?: string;
  nucleo_nome?: string;
  total_ambientes?: number;
  total_categorias?: number;
  total_itens?: number;
  valor_total?: number;
  ambientes?: QuantitativoAmbienteCompleto[];
}

export interface QuantitativoAmbienteCompleto extends QuantitativoAmbiente {
  projeto_numero?: string;
  projeto_nome?: string;
  categorias?: QuantitativoCategoriaCompleta[];
  total_categorias?: number;
  total_itens?: number;
  valor_total?: number;
}

export interface QuantitativoCategoriaCompleta extends QuantitativoCategoria {
  ambiente_nome?: string;
  ambiente_codigo?: string;
  projeto_numero?: string;
  projeto_nome?: string;
  itens?: QuantitativoItemCompleto[];
  total_itens?: number;
  valor_total?: number;
}

export interface QuantitativoItemCompleto extends QuantitativoItem {
  categoria_nome?: string;
  categoria_cor?: string;
  ambiente_nome?: string;
  ambiente_codigo?: string;
  projeto_numero?: string;
  projeto_nome?: string;
  pricelist_nome?: string;
  pricelist_preco?: number;
  pricelist_unidade?: string;
  preco_unitario_efetivo?: number;
  preco_total_efetivo?: number;
}

// ============================================================
// Interfaces: Formulários
// ============================================================

export interface QuantitativoProjetoFormData {
  proposta_id?: string;
  contrato_id?: string;
  cliente_id: string;
  nucleo_id?: string;
  nucleo: NucleoQuantitativo;
  numero?: string; // Se nÍo fornecido, será gerado automaticamente
  nome: string;
  descricao?: string;
  area_construida?: number;
  area_total?: number;
  endereco_obra?: string;
  status?: StatusQuantitativo;
  versao?: number;
  observacoes?: string;
}

export interface QuantitativoAmbienteFormData {
  projeto_id: string;
  codigo?: string;
  nome: string;
  descricao?: string;
  largura?: number;
  comprimento?: number;
  area?: number;
  area_m2?: number;
  pe_direito?: number;
  perimetro?: number;
  ordem?: number;
}

export interface QuantitativoCategoriaFormData {
  ambiente_id: string;
  nome: string;
  descricao?: string;
  cor?: string;
  ordem?: number;
}

export interface QuantitativoItemFormData {
  categoria_id: string;
  pricelist_item_id?: string;
  codigo?: string;
  nome: string;
  descricao?: string;
  especificacao?: string;
  quantidade: number;
  unidade: string;
  preco_unitario?: number;
  sincronizar_preco?: boolean;
  observacoes?: string;
  ordem?: number;
}

export interface QuantitativoTemplateFormData {
  nome: string;
  tipo: TipoTemplate;
  nucleo?: NucleoQuantitativo;
  estrutura: Record<string, unknown>;
  descricao?: string;
  ativo?: boolean;
}

// ============================================================
// Interfaces: Filtros
// ============================================================

export interface QuantitativosFiltros {
  nucleo?: NucleoQuantitativo;
  nucleo_id?: string;
  status?: StatusQuantitativo;
  cliente_id?: string;
  proposta_id?: string;
  contrato_id?: string;
  busca?: string; // Busca por número ou nome
  data_inicio?: string;
  data_fim?: string;
}

export interface QuantitativosEstatisticas {
  total_projetos: number;
  total_em_elaboracao: number;
  total_aprovados: number;
  total_revisao: number;
  total_arquivados: number;
  valor_total_geral: number;
  total_ambientes: number;
  total_itens: number;
  projetos_por_nucleo: {
    arquitetura: number;
    engenharia: number;
    marcenaria: number;
  };
}

// ============================================================
// Helpers e Utilitários
// ============================================================

export const NUCLEO_LABELS: Record<NucleoQuantitativo, string> = {
  arquitetura: "Arquitetura",
  engenharia: "Engenharia",
  marcenaria: "Marcenaria",
};

export const NUCLEO_COLORS: Record<NucleoQuantitativo, string> = {
  arquitetura: "#5E9B94", // Verde Mineral
  engenharia: "#2B4580", // Azul Técnico
  marcenaria: "#8B5E3C", // Marrom Carvalho
};

export const STATUS_LABELS: Record<StatusQuantitativo, string> = {
  em_elaboracao: "Em ElaboraçÍo",
  aprovado: "Aprovado",
  revisao: "Em RevisÍo",
  arquivado: "Arquivado",
};

export const STATUS_COLORS: Record<StatusQuantitativo, string> = {
  em_elaboracao: "#FFA726", // Laranja
  aprovado: "#66BB6A", // Verde
  revisao: "#42A5F5", // Azul
  arquivado: "#9E9E9E", // Cinza
};

// Cores padrÍo para categorias (PAREDE, PISO, TETO, etc.)
export const CATEGORIA_COLORS_PADRAO: Record<string, string> = {
  PAREDE: "#E3F2FD", // Azul claro
  PISO: "#FFF3E0", // Laranja claro
  TETO: "#E8F5E9", // Verde claro
  RODAPÉ: "#FCE4EC", // Rosa claro
  FORRO: "#F3E5F5", // Roxo claro
  REVESTIMENTO: "#E0F2F1", // Teal claro
  PINTURA: "#FFF9C4", // Amarelo claro
  ELÉTRICA: "#FFECB3", // Âmbar claro
  HIDRÁULICA: "#B3E5FC", // Cyan claro
  ESQUADRIAS: "#D7CCC8", // Marrom claro
};

// ============================================================
// Funções Utilitárias
// ============================================================

export function formatarNumeroQuantitativo(numero: string): string {
  return numero.toUpperCase();
}

export function getNucleoLabel(nucleo: NucleoQuantitativo): string {
  return NUCLEO_LABELS[nucleo] || nucleo;
}

export function getNucleoColor(nucleo: NucleoQuantitativo): string {
  return NUCLEO_COLORS[nucleo] || "#9E9E9E";
}

export function getStatusLabel(status: StatusQuantitativo): string {
  return STATUS_LABELS[status] || status;
}

export function getStatusColor(status: StatusQuantitativo): string {
  return STATUS_COLORS[status] || "#9E9E9E";
}

export function getCorCategoria(nomeCategoria: string): string {
  const nomeUpper = nomeCategoria.toUpperCase();
  return CATEGORIA_COLORS_PADRAO[nomeUpper] || "#F5F5F5";
}

export function calcularValorTotalProjeto(
  projeto: QuantitativoProjetoCompleto
): number {
  if (!projeto.ambientes || projeto.ambientes.length === 0) {
    return 0;
  }

  return projeto.ambientes.reduce((total, ambiente) => {
    return total + calcularValorTotalAmbiente(ambiente);
  }, 0);
}

export function calcularValorTotalAmbiente(
  ambiente: QuantitativoAmbienteCompleto
): number {
  if (!ambiente.categorias || ambiente.categorias.length === 0) {
    return 0;
  }

  return ambiente.categorias.reduce((total, categoria) => {
    return total + calcularValorTotalCategoria(categoria);
  }, 0);
}

export function calcularValorTotalCategoria(
  categoria: QuantitativoCategoriaCompleta
): number {
  if (!categoria.itens || categoria.itens.length === 0) {
    return 0;
  }

  return categoria.itens.reduce((total, item) => {
    return total + (item.preco_total_efetivo || item.preco_total || 0);
  }, 0);
}

export function validarProjetoFormData(
  data: QuantitativoProjetoFormData
): string[] {
  const erros: string[] = [];

  if (!data.cliente_id || data.cliente_id.trim() === "") {
    erros.push("Cliente é obrigatório");
  }

  if (!data.nome || data.nome.trim() === "") {
    erros.push("Nome do projeto é obrigatório");
  }

  if (!data.nucleo) {
    erros.push("Núcleo é obrigatório");
  }

  if (data.area_construida && data.area_construida <= 0) {
    erros.push("Área construída deve ser maior que zero");
  }

  if (data.area_total && data.area_total <= 0) {
    erros.push("Área total deve ser maior que zero");
  }

  return erros;
}

export function validarAmbienteFormData(
  data: QuantitativoAmbienteFormData
): string[] {
  const erros: string[] = [];

  if (!data.projeto_id || data.projeto_id.trim() === "") {
    erros.push("Projeto é obrigatório");
  }

  if (!data.nome || data.nome.trim() === "") {
    erros.push("Nome do ambiente é obrigatório");
  }

  if (data.area && data.area <= 0) {
    erros.push("Área deve ser maior que zero");
  }

  if (data.pe_direito && data.pe_direito <= 0) {
    erros.push("Pé-direito deve ser maior que zero");
  }

  if (data.perimetro && data.perimetro <= 0) {
    erros.push("Perímetro deve ser maior que zero");
  }

  return erros;
}

export function validarCategoriaFormData(
  data: QuantitativoCategoriaFormData
): string[] {
  const erros: string[] = [];

  if (!data.ambiente_id || data.ambiente_id.trim() === "") {
    erros.push("Ambiente é obrigatório");
  }

  if (!data.nome || data.nome.trim() === "") {
    erros.push("Nome da categoria é obrigatório");
  }

  return erros;
}

export function validarItemFormData(
  data: QuantitativoItemFormData
): string[] {
  const erros: string[] = [];

  if (!data.categoria_id || data.categoria_id.trim() === "") {
    erros.push("Categoria é obrigatória");
  }

  if (!data.nome || data.nome.trim() === "") {
    erros.push("Nome do item é obrigatório");
  }

  if (!data.unidade || data.unidade.trim() === "") {
    erros.push("Unidade é obrigatória");
  }

  if (data.quantidade < 0) {
    erros.push("Quantidade nÍo pode ser negativa");
  }

  if (data.preco_unitario && data.preco_unitario < 0) {
    erros.push("Preço unitário nÍo pode ser negativo");
  }

  return erros;
}

export function formatarAreaComUnidade(area: number | null): string {
  if (area === null) return "-";
  return `${area.toFixed(2)} m²`;
}

export function formatarMetragemComUnidade(metragem: number | null): string {
  if (metragem === null) return "-";
  return `${metragem.toFixed(2)} m`;
}

export function formatarQuantidade(
  quantidade: number,
  unidade: string
): string {
  return `${quantidade.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  })} ${unidade}`;
}

export function formatarPreco(preco: number | null): string {
  if (preco === null) return "-";
  return preco.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Agrupa itens por categoria
 */
export function agruparItensPorCategoria(
  itens: QuantitativoItemCompleto[]
): Record<string, QuantitativoItemCompleto[]> {
  return itens.reduce((acc, item) => {
    const categoria = item.categoria_nome || "Sem categoria";
    if (!acc[categoria]) {
      acc[categoria] = [];
    }
    acc[categoria].push(item);
    return acc;
  }, {} as Record<string, QuantitativoItemCompleto[]>);
}

/**
 * Agrupa categorias por ambiente
 */
export function agruparCategoriasPorAmbiente(
  categorias: QuantitativoCategoriaCompleta[]
): Record<string, QuantitativoCategoriaCompleta[]> {
  return categorias.reduce((acc, categoria) => {
    const ambiente = categoria.ambiente_nome || "Sem ambiente";
    if (!acc[ambiente]) {
      acc[ambiente] = [];
    }
    acc[ambiente].push(categoria);
    return acc;
  }, {} as Record<string, QuantitativoCategoriaCompleta[]>);
}

/**
 * Calcula estatísticas de um projeto
 */
export function calcularEstatisticasProjeto(
  projeto: QuantitativoProjetoCompleto
): {
  total_ambientes: number;
  total_categorias: number;
  total_itens: number;
  valor_total: number;
} {
  const ambientes = projeto.ambientes || [];

  const total_ambientes = ambientes.length;
  const total_categorias = ambientes.reduce(
    (acc, amb) => acc + (amb.categorias?.length || 0),
    0
  );
  const total_itens = ambientes.reduce(
    (acc, amb) =>
      acc +
      (amb.categorias?.reduce(
        (acc2, cat) => acc2 + (cat.itens?.length || 0),
        0
      ) || 0),
    0
  );
  const valor_total = calcularValorTotalProjeto(projeto);

  return {
    total_ambientes,
    total_categorias,
    total_itens,
    valor_total,
  };
}

