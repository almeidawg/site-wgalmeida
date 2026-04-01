// Shared types for pricelist items to avoid duplicated local definitions
// Unidades canônicas — sem aliases (m2 nÍo m², hr nÍo hora, un nÍo und, dia nÍo diaria)
export type ItemUnit = 'm2' | 'm3' | 'ml' | 'm' | 'un' | 'dia' | 'hr' | 'empreita' | 'sc' | 'cx' | 'rolo' | 'lata' | 'pct' | 'par' | 'pc' | 'kg' | 'l' | 'serv';

/** Normaliza variantes legacy para a unidade canônica */
export function normalizarUnidade(u: string): ItemUnit {
  const map: Record<string, ItemUnit> = {
    'm²': 'm2', 'm³': 'm3', 'und': 'un', 'hora': 'hr', 'diaria': 'dia',
  };
  return (map[u] ?? u) as ItemUnit;
}
export type ItemType = 'material' | 'mao_obra' | 'servico' | 'produto' | 'ambos';

export type TipoPricelist = "mao_obra" | "material" | "servico" | "produto";

export type FlowResourceKey =
  | "ferramenta"
  | "insumo"
  | "epi"
  | "infra"
  | "materialCinza"
  | "acabamento"
  | "produto";

export interface PricelistTaskFlow {
  id: string;
  nome: string;
  descricao?: string;
  tempoEstimadoMinutos?: number;
  ambientes?: string[];
  kits?: string[];
  recursos?: Partial<Record<FlowResourceKey, string>>;
}

export interface PricelistPhaseFlow {
  id: string;
  nome: string;
  descricao?: string;
  tasks: PricelistTaskFlow[];
}

export interface PricelistCategoryFlow {
  id: string;
  nome: string;
  descricao?: string;
  fases: PricelistPhaseFlow[];
}

export const FLOW_RESOURCE_LABELS: Record<FlowResourceKey, string> = {
  ferramenta: "Ferramentas",
  insumo: "Insumo",
  epi: "EPI",
  infra: "Infraestrutura",
  materialCinza: "Material",
  acabamento: "Acabamentos",
  produto: "Produto",
};

export interface ItemPriceList {
  id: string;
  codigo: string;
  nome: string;
  descricao: string;
  categoria: string;
  categoria_id?: string | null; // ID da categoria principal para filtros
  // Tipo vindo do pricelist: agora suporta também serviço e produto
  tipo: ItemType;
  unidade: ItemUnit;
  preco: number;
  imagem_url?: string;
  // Núcleo do item (arquitetura, engenharia, marcenaria, materiais, produtos, etc.)
  nucleo?: string | null;
}

export interface ItemPriceListCompleto extends ItemPriceList {
  estoque?: number | null;
  fornecedor_nome?: string | null;
}

// ============================================================
// Interface: Ambiente associado ao Pricelist
// ============================================================
export interface PricelistAmbiente {
  id: string;
  nome: string;
  descricao?: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}
// ============================================================
// TYPES: Módulo de Pricelist (Catálogo de Produtos e Serviços)
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

// export type TipoPricelist = "mao_obra" | "material" | "servico" | "produto";


// ============================================================
// Interface: Categoria de Pricelist
// ============================================================
export interface PricelistCategoria {
  id: string;
  nome: string;
  codigo: string | null; // Código abreviado (ex: ARQ, ENG, EST)
  tipo?: TipoPricelist | null;
  // Tipo removido
  descricao: string | null;
  ordem: number;
  ativo: boolean;
  cor: string | null; // Cor hex da categoria (aplicada em todo sistema)
  created_at: string;
  updated_at: string;
  tipo_servico?: string | null;
  guia_principal?: string | null;
  tags?: string[] | null;
  ambientes?: PricelistAmbiente[];
  guias?: string[];
  fluxo?: PricelistCategoryFlow | null;
  evf_categoria_codigo?: string | null; // FK para evf_categorias_config.codigo
  aplicacao_obra?: 'reforma' | 'construcao' | 'ambos' | null; // Aplica em reforma, construção ou ambos
}

// ============================================================
// Interface: Subcategoria de Pricelist
// ============================================================
export interface PricelistSubcategoria {
  id: string;
  categoria_id: string;
  nome: string;
  tipo?: TipoPricelist | null;
  // Tipo removido
  descricao?: string | null;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface PricelistSubcategoriaFormData {
  categoria_id: string;
  nome: string;
  tipo: TipoPricelist;
  descricao?: string;
  ordem?: number;
  ativo?: boolean;
}


// ============================================================
// Interface: Item de Pricelist
// ============================================================
export interface PricelistItem {
  id: string;
  categoria_id: string | null;
  subcategoria_id: string | null;
  nucleo_id: string | null;

  // IdentificaçÍo
  codigo: string | null;
  nome: string;
  descricao: string | null;
  tipo?: TipoPricelist | null; // Tipo do item (mao_obra, material, servico, produto)

  // Unidade e preço
  unidade: string;
  preco: number;
  producao_diaria?: number | null; // Quantidade executada por dia (m²/ml/un)

  // Custos e margem
  custo_aquisicao?: number | null; // Custo de compra/aquisiçÍo
  margem_lucro?: number | null; // Margem de lucro em % (ex: 30.00 = 30%)
  markup?: number | null; // Markup sobre custo em % (ex: 50.00 = 50%)
  preco_minimo?: number | null; // Preço mínimo calculado automaticamente
  custo_operacional?: number | null; // Custos operacionais indiretos
  lucro_estimado?: number | null; // Lucro por unidade (calculado automaticamente)

  // ============================================================
  // CAMPOS DE CATÁLOGO (Revestimentos, Porcelanatos, etc)
  // ============================================================

  // Dimensões físicas
  espessura?: number | null; // Espessura em cm
  largura?: number | null; // Largura em metros
  comprimento?: number | null; // Comprimento em metros
  peso?: number | null; // Peso em kg

  // Metragem e rendimento
  m2_peca?: number | null; // M² por peça individual
  m2_caixa?: number | null; // M² por caixa
  unidades_caixa?: number | null; // Quantidade de peças por caixa
  rendimento?: number | null; // Rendimento por litro/kg

  // ClassificaçÍo do produto
  aplicacao?: string | null; // PISO, PAREDE, TETO, FACHADA
  ambiente?: string | null; // INTERNO, EXTERNO, AREA_MOLHADA
  acabamento?: string | null; // POLIDO, ACETINADO, NATURAL, RUSTICO
  formato?: string | null; // 60x60, 90x90, 120x120
  borda?: string | null; // RETA, BOLD
  resistencia?: string | null; // PEI 1-5 (para pisos)
  cor?: string | null; // Cor principal

  // Informações do fabricante
  fabricante?: string | null; // Nome do fabricante
  linha?: string | null; // Linha/coleçÍo do produto
  modelo?: string | null; // Modelo específico
  codigo_fabricante?: string | null; // Código do fabricante (SKU)
  link_produto?: string | null; // URL para página do produto

  // ComercializaçÍo
  unidade_venda?: string | null; // CX, M2, UN, PC
  multiplo_venda?: number | null; // Múltiplo mínimo de venda
  preco_m2?: number | null; // Preço por M² (calculado)
  preco_caixa?: number | null; // Preço por caixa

  // ============================================================

  // Informações adicionais
  fornecedor_id: string | null;
  marca: string | null;
  especificacoes: Record<string, unknown> | null;
  imagem_url: string | null;

  // AvaliaçÍo
  avaliacao: number | null; // Nota média (ex: 4.8 estrelas)
  total_avaliacoes: number | null; // Quantidade de avaliações

  // Estoque (se aplicável)
  controla_estoque: boolean;
  estoque_minimo: number | null;
  estoque_atual: number | null;

  // Status
  ativo: boolean;

  // AplicaçÍo de obra
  aplicacao_obra?: 'reforma' | 'construcao' | 'ambos' | null; // Identifica se o item é de reforma, construção ou ambos
  iccri_servico_id?: string | null; // FK para serviço ICCRI — vincula mão de obra ao índice de custo

  // Auditoria
  created_at: string;
  updated_at: string;
}

// ============================================================
// Interface: Núcleo (relacionamento)
// ============================================================
export interface PricelistNucleo {
  id: string;
  nome: string;
  cor?: string;
}

// ============================================================
// Interface: Item com dados agregados
// ============================================================
export interface PricelistItemCompleto extends PricelistItem {
  categoria_nome?: string;
  fornecedor_nome?: string;
  categoria?: PricelistCategoria;
  subcategoria?: PricelistSubcategoria;
  fornecedor?: {
    id: string;
    nome: string;
    telefone?: string;
    email?: string;
  };
  nucleo?: PricelistNucleo | string; // Pode ser objeto (do join) ou string normalizada
  // Compatibilidade com campos usados pela UI / Quantitativos
  preco_venda?: number;
}


// ============================================================
// Interface: Formulário de categoria
// ============================================================
export interface PricelistCategoriaFormData {
  nome: string;
  codigo?: string; // Código abreviado (ex: ARQ, ENG, EST)
  tipo?: TipoPricelist | null;
  // Tipo removido
  descricao?: string;
  ordem?: number;
  ativo?: boolean;
  cor?: string; // Cor hex da categoria (aplicada em todo sistema)
  tipo_servico?: string;
  guia_principal?: string;
  tags?: string[];
  ambientes?: string[];
  guias?: string[];
  evf_categoria_codigo?: string | null; // FK para evf_categorias_config.codigo
  aplicacao_obra?: 'reforma' | 'construcao' | 'ambos';
}

// ============================================================
// Interface: Formulário de item
// ============================================================
export interface PricelistItemFormData {
  categoria_id?: string | null;
  subcategoria_id?: string | null;
  nucleo_id?: string | null;
  codigo?: string;
  nome: string; // Obrigatório
  descricao?: string; // Opcional
  tipo?: "mao_obra" | "material" | "servico" | "produto"; // Tipo do item
  unidade: string;
  preco: number;
  producao_diaria?: number | null;

  // Custos e margem
  custo_aquisicao?: number | null;
  margem_lucro?: number | null;
  markup?: number | null;
  custo_operacional?: number | null;

  // Campos de Catálogo - Dimensões
  espessura?: number | null;
  largura?: number | null;
  comprimento?: number | null;
  peso?: number | null;

  // Campos de Catálogo - Metragem
  m2_peca?: number | null;
  m2_caixa?: number | null;
  unidades_caixa?: number | null;
  rendimento?: number | null;

  // Campos de Catálogo - ClassificaçÍo
  aplicacao?: string | null;
  ambiente?: string | null;
  acabamento?: string | null;
  formato?: string | null;
  borda?: string | null;
  resistencia?: string | null;
  cor?: string | null;

  // Campos de Catálogo - Fabricante
  fabricante?: string | null;
  linha?: string | null;
  modelo?: string | null;
  codigo_fabricante?: string | null;
  link_produto?: string | null;

  // Campos de Catálogo - ComercializaçÍo
  unidade_venda?: string | null;
  multiplo_venda?: number | null;
  preco_m2?: number | null;
  preco_caixa?: number | null;

  fornecedor_id?: string;
  marca?: string;
  especificacoes?: Record<string, unknown>;
  imagem_url?: string;
  avaliacao?: number; // Nota média (ex: 4.8 estrelas)
  total_avaliacoes?: number; // Quantidade de avaliações
  controla_estoque?: boolean;
  estoque_minimo?: number | null;
  estoque_atual?: number | null;
  ativo?: boolean;
  aplicacao_obra?: 'reforma' | 'construcao' | 'ambos';
  iccri_servico_id?: string | null;
}

// ============================================================
// Interface: Filtros de busca
// ============================================================
export interface PricelistFiltros {
  // Tipo removido
  categoria_id?: string;
  subcategoria_id?: string;
  nucleo_id?: string; // Filtro por núcleo (arquitetura, engenharia, marcenaria, produtos)
  fornecedor_id?: string;
  apenas_ativos?: boolean;
  busca?: string; // Busca por código ou descriçÍo
  preco_min?: number;
  preco_max?: number;
  estoque_baixo?: boolean; // Itens com estoque abaixo do mínimo
  limite?: number; // Limite de resultados (padrÍo 50)

  // Filtros de Catálogo
  fabricante?: string;
  linha?: string;
  aplicacao?: string;
  ambiente?: string;
  acabamento?: string;
  formato?: string;
}

// ============================================================
// Interface: Estatísticas
// ============================================================
export interface PricelistEstatisticas {
  total_itens: number;
  total_mao_obra: number;
  total_materiais: number;
  total_categorias: number;
  itens_estoque_baixo: number;
  valor_medio_mao_obra: number;
  valor_medio_material: number;
}

// ============================================================
// Helpers e Utilitários
// ============================================================

export const TIPO_PRICELIST_LABELS: Record<TipoPricelist, string> = {
  mao_obra: "mão de obra",
  material: "Material",
  servico: "Serviço",
  produto: "Produto",
};

export const TIPO_PRICELIST_COLORS: Record<TipoPricelist, string> = {
  mao_obra: "#3B82F6", // Azul
  material: "#F59E0B", // Laranja
  servico: "#8B5CF6", // Roxo
  produto: "#10B981", // Verde
};

// Unidades de medida comuns
export const UNIDADES_MAO_OBRA = [
  { value: "hr", label: "Hora" },
  { value: "dia", label: "Dia" },
  { value: "m2", label: "Metro Quadrado" },
  { value: "m²", label: "Metro Quadrado" },
  { value: "m3", label: "Metro Cúbico" },
  { value: "m³", label: "Metro Cúbico" },
  { value: "ml", label: "Metro Linear" },
  { value: "m", label: "Metro Linear" },
  { value: "und", label: "Unidade" },
  { value: "serv", label: "Serviço" },
];

export const UNIDADES_MATERIAL = [
  { value: "und", label: "Unidade" },
  { value: "m2", label: "Metro Quadrado" },
  { value: "m²", label: "Metro Quadrado" },
  { value: "m3", label: "Metro Cúbico" },
  { value: "m³", label: "Metro Cúbico" },
  { value: "ml", label: "Metro Linear" },
  { value: "m", label: "Metro Linear" },
  { value: "kg", label: "Quilograma" },
  { value: "l", label: "Litro" },
  { value: "cx", label: "Caixa" },
  { value: "sc", label: "Saco" },
  { value: "rolo", label: "Rolo" },
  { value: "lata", label: "Lata" },
  { value: "pct", label: "Pacote" },
  { value: "pc", label: "Peça" },
  { value: "pç", label: "Peças" },
  { value: "par", label: "Par" },
];

// Alias para compatibilidade (plural)
export const UNIDADES_MATERIAIS = UNIDADES_MATERIAL;

// Unidades de medida para serviços
export const UNIDADES_SERVICO = [
  { value: "serv", label: "Serviço" },
  { value: "und", label: "Unidade" },
  { value: "hr", label: "Hora" },
  { value: "dia", label: "Dia" },
  { value: "m²", label: "Metro Quadrado" },
  { value: "m", label: "Metro Linear" },
  { value: "projeto", label: "Projeto" },
];

// Unidades de medida para produtos
export const UNIDADES_PRODUTO = [
  { value: "und", label: "Unidade" },
  { value: "pc", label: "Peça" },
  { value: "pç", label: "Peças" },
  { value: "cx", label: "Caixa" },
  { value: "m2", label: "Metro Quadrado" },
  { value: "m²", label: "Metro Quadrado" },
  { value: "ml", label: "Metro Linear" },
  { value: "m", label: "Metro Linear" },
  { value: "kg", label: "Quilograma" },
  { value: "l", label: "Litro" },
  { value: "rolo", label: "Rolo" },
  { value: "lata", label: "Lata" },
  { value: "conj", label: "Conjunto" },
  { value: "par", label: "Par" },
];

// ============================================================
// Constantes para Catálogos de Produtos
// ============================================================

// Tipos de aplicaçÍo (revestimentos)
export const TIPOS_APLICACAO = [
  { value: "PISO", label: "Piso" },
  { value: "PAREDE", label: "Parede" },
  { value: "TETO", label: "Teto" },
  { value: "FACHADA", label: "Fachada" },
  { value: "BANCADA", label: "Bancada" },
  { value: "PISCINA", label: "Piscina" },
  { value: "BANHEIRO", label: "Banheiro" },
  { value: "COZINHA", label: "Cozinha" },
];

// Tipos de ambiente
export const TIPOS_AMBIENTE = [
  { value: "INTERNO", label: "Interno" },
  { value: "EXTERNO", label: "Externo" },
  { value: "AREA_MOLHADA", label: "Área Molhada" },
  { value: "AREA_SECA", label: "Área Seca" },
];

// Tipos de acabamento
export const TIPOS_ACABAMENTO = [
  { value: "POLIDO", label: "Polido" },
  { value: "ACETINADO", label: "Acetinado" },
  { value: "NATURAL", label: "Natural" },
  { value: "RUSTICO", label: "Rústico" },
  { value: "BRILHANTE", label: "Brilhante" },
  { value: "FOSCO", label: "Fosco" },
  { value: "ESMALTADO", label: "Esmaltado" },
  { value: "TEXTURIZADO", label: "Texturizado" },
];

// Tipos de borda
export const TIPOS_BORDA = [
  { value: "RETA", label: "Borda Reta" },
  { value: "BOLD", label: "Borda Bold" },
  { value: "ARREDONDADA", label: "Borda Arredondada" },
];

// ClassificaçÍo PEI (resistência de pisos)
export const CLASSIFICACAO_PEI = [
  { value: "PEI 1", label: "PEI 1 - Residencial Leve" },
  { value: "PEI 2", label: "PEI 2 - Residencial Leve" },
  { value: "PEI 3", label: "PEI 3 - Residencial Médio" },
  { value: "PEI 4", label: "PEI 4 - Residencial Alto" },
  { value: "PEI 5", label: "PEI 5 - Comercial/Industrial" },
];

// Formatos comuns de revestimentos
export const FORMATOS_REVESTIMENTO = [
  { value: "20x20", label: "20x20 cm" },
  { value: "30x30", label: "30x30 cm" },
  { value: "30x60", label: "30x60 cm" },
  { value: "45x45", label: "45x45 cm" },
  { value: "60x60", label: "60x60 cm" },
  { value: "60x120", label: "60x120 cm" },
  { value: "80x80", label: "80x80 cm" },
  { value: "90x90", label: "90x90 cm" },
  { value: "120x120", label: "120x120 cm" },
  { value: "120x240", label: "120x240 cm" },
];

// Fabricantes conhecidos
export const FABRICANTES_REVESTIMENTOS = [
  "Portobello",
  "Eliane",
  "Portinari",
  "Ceusa",
  "Roca",
  "Incepa",
  "Delta",
  "Biancogres",
  "Via Rosa",
];

export const FABRICANTES_LOUCAS_METAIS = [
  "Deca",
  "Docol",
  "Lorenzetti",
  "Celite",
  "Roca",
  "Incepa",
  "Tigre",
];

export const FABRICANTES_TINTAS = [
  "Suvinil",
  "Coral",
  "Sherwin-Williams",
  "Lukscolor",
  "Renner",
  "Dacar",
];

// ============================================================
// Funções Utilitárias
// ============================================================

export function formatarPreco(preco: number): string {
  return preco.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatarCodigo(codigo: string | null): string {
  if (!codigo) return "-";
  return codigo.toUpperCase();
}

export function validarCategoria(
  categoria: PricelistCategoriaFormData
): string[] {
  const erros: string[] = [];

  if (!categoria.nome || categoria.nome.trim() === "") {
    erros.push("Nome é obrigatório");
  }

  if (!categoria.tipo) {
    erros.push("Tipo é obrigatório");
  }

  return erros;
}

export function validarItem(item: PricelistItemFormData): string[] {
  const erros: string[] = [];

  // Nome é obrigatório
  if (!item.nome || item.nome.trim() === "") {
    erros.push("Nome é obrigatório");
  }

  if (!item.tipo) {
    erros.push("Tipo é obrigatório");
  }

  if (!item.unidade || item.unidade.trim() === "") {
    erros.push("Unidade é obrigatória");
  }

  if (!item.preco || item.preco < 0) {
    erros.push("Preço base deve ser maior ou igual a zero");
  }

  if (item.controla_estoque) {
    if (
      item.estoque_minimo !== undefined &&
      item.estoque_minimo !== null &&
      item.estoque_minimo < 0
    ) {
      erros.push("Estoque mínimo nÍo pode ser negativo");
    }

    if (
      item.estoque_atual !== undefined &&
      item.estoque_atual !== null &&
      item.estoque_atual < 0
    ) {
      erros.push("Estoque atual nÍo pode ser negativo");
    }
  }

  return erros;
}

export function calcularPrecoTotal(
  item: PricelistItem,
  quantidade: number
): number {
  return item.preco * quantidade;
}

export function verificarEstoqueBaixo(item: PricelistItem): boolean {
  if (!item.controla_estoque) return false;
  if (item.estoque_minimo === null || item.estoque_atual === null) return false;

  return item.estoque_atual < item.estoque_minimo;
}

export function getStatusEstoque(item: PricelistItem): {
  label: string;
  color: string;
  urgente: boolean;
} {
  if (!item.controla_estoque) {
    return {
      label: "NÍo controla",
      color: "#9CA3AF",
      urgente: false,
    };
  }

  if (item.estoque_atual === null) {
    return {
      label: "Sem informaçÍo",
      color: "#9CA3AF",
      urgente: false,
    };
  }

  if (item.estoque_minimo === null) {
    return {
      label: `${item.estoque_atual} ${item.unidade}`,
      color: "#3B82F6",
      urgente: false,
    };
  }

  if (item.estoque_atual === 0) {
    return {
      label: "Esgotado",
      color: "#EF4444",
      urgente: true,
    };
  }

  if (item.estoque_atual < item.estoque_minimo) {
    return {
      label: `Baixo (${item.estoque_atual} ${item.unidade})`,
      color: "#F59E0B",
      urgente: true,
    };
  }

  return {
    label: `${item.estoque_atual} ${item.unidade}`,
    color: "#10B981",
    urgente: false,
  };
}

export function gerarCodigoAutomatico(tipo: TipoPricelist, numero: number): string {
  let prefixo = "MAT";
  if (tipo === "mao_obra") prefixo = "MO";
  if (tipo === "servico") prefixo = "SERV";
  if (tipo === "produto") prefixo = "PROD";
  return `${prefixo}-${numero.toString().padStart(5, "0")}`;
}

export function filtrarUnidades(tipo: TipoPricelist) {
  if (tipo === "mao_obra") return UNIDADES_MAO_OBRA;
  if (tipo === "servico") return UNIDADES_SERVICO;
  if (tipo === "produto") return UNIDADES_PRODUTO;
  return UNIDADES_MATERIAL;
}

/**
 * Formatar código de exibiçÍo da categoria
 * @param categoria - Categoria a ser formatada
 * @returns String formatada como "001-ARQ - Nome" ou apenas "Nome"
 */
export function formatarCodigoCategoria(categoria: PricelistCategoria): string {
  const codigoDisplay =
    categoria.ordem !== undefined && categoria.codigo
      ? `${String(categoria.ordem).padStart(3, "0")}-${categoria.codigo} - `
      : categoria.codigo
      ? `${categoria.codigo} - `
      : "";
  return `${codigoDisplay}${categoria.nome}`;
}

export function agruparPorCategoria(
  itens: PricelistItemCompleto[]
): Record<string, PricelistItemCompleto[]> {
  return itens.reduce((acc, item) => {
    const categoria = item.categoria_nome || "Sem categoria";
    if (!acc[categoria]) {
      acc[categoria] = [];
    }
    acc[categoria].push(item);
    return acc;
  }, {} as Record<string, PricelistItemCompleto[]>);
}

export function calcularEstatisticas(
  itens: PricelistItem[]
): PricelistEstatisticas {
  const itensMaoObra = itens.filter((i) => i.tipo === "mao_obra");
  const itensMateriais = itens.filter((i) => i.tipo === "material" || i.tipo === "produto");
  const itensEstoqueBaixo = itens.filter(verificarEstoqueBaixo);

  const somaPrecosMaoObra = itensMaoObra.reduce(
    (acc, item) => acc + item.preco,
    0
  );
  const somaPrecosMateriais = itensMateriais.reduce(
    (acc, item) => acc + item.preco,
    0
  );

  return {
    total_itens: itens.length,
    total_mao_obra: itensMaoObra.length,
    total_materiais: itensMateriais.length,
    total_categorias: new Set(itens.map((i) => i.categoria_id).filter(Boolean))
      .size,
    itens_estoque_baixo: itensEstoqueBaixo.length,
    valor_medio_mao_obra:
      itensMaoObra.length > 0 ? somaPrecosMaoObra / itensMaoObra.length : 0,
    valor_medio_material:
      itensMateriais.length > 0 ? somaPrecosMateriais / itensMateriais.length : 0,
  };
}

// ============================================================
// Funções Helper para Labels e Cores
// ============================================================

export function getTipoItemLabel(tipo: TipoPricelist): string {
  return TIPO_PRICELIST_LABELS[tipo] || tipo;
}

export function getTipoItemColor(tipo: TipoPricelist): string {
  return TIPO_PRICELIST_COLORS[tipo] || "#9CA3AF";
}

// ============================================================
// Funções de Cálculo de Custos e Margem
// ============================================================

/**
 * Calcula o preço mínimo baseado no custo e margem desejada
 * Fórmula: preco_minimo = custo_aquisicao + (custo_aquisicao × margem_lucro / 100)
 */
export function calcularPrecoMinimo(
  custoAquisicao: number,
  margemLucro: number
): number {
  return custoAquisicao + (custoAquisicao * margemLucro / 100);
}

/**
 * Calcula o preço de venda baseado no custo e markup
 * Fórmula: preco_venda = custo_aquisicao + (custo_aquisicao × markup / 100)
 */
export function calcularPrecoComMarkup(
  custoAquisicao: number,
  markup: number
): number {
  return custoAquisicao + (custoAquisicao * markup / 100);
}

/**
 * Calcula o lucro estimado por unidade
 * Fórmula: lucro = preco_venda - (custo_aquisicao + custo_operacional)
 */
export function calcularLucroEstimado(
  precoVenda: number,
  custoAquisicao: number,
  custoOperacional: number = 0
): number {
  return precoVenda - (custoAquisicao + custoOperacional);
}

/**
 * Calcula a margem real em percentual
 * Fórmula: margem_real = ((preco_venda - custo_total) / preco_venda) × 100
 */
export function calcularMargemReal(
  precoVenda: number,
  custoAquisicao: number,
  custoOperacional: number = 0
): number {
  if (precoVenda === 0) return 0;
  const custoTotal = custoAquisicao + custoOperacional;
  return ((precoVenda - custoTotal) / precoVenda) * 100;
}

/**
 * Verifica se o preço de venda está abaixo do preço mínimo
 */
export function isPrecoAbaixoMinimo(item: PricelistItem): boolean {
  if (!item.preco_minimo) return false;
  return item.preco < item.preco_minimo;
}

/**
 * Retorna o status de rentabilidade do item
 */
export function getStatusRentabilidade(item: PricelistItem): {
  label: string;
  color: string;
  alerta: boolean;
} {
  // Se nÍo tem custo definido, nÍo pode calcular rentabilidade
  if (!item.custo_aquisicao || item.custo_aquisicao === 0) {
    return {
      label: "Sem custo definido",
      color: "#9CA3AF",
      alerta: false,
    };
  }

  // Calcular margem real
  const margemReal = calcularMargemReal(
    item.preco,
    item.custo_aquisicao,
    item.custo_operacional || 0
  );

  // Preço abaixo do mínimo - CRÍTICO
  if (item.preco_minimo && item.preco < item.preco_minimo) {
    return {
      label: `Abaixo do mínimo (${margemReal.toFixed(1)}%)`,
      color: "#EF4444",
      alerta: true,
    };
  }

  // Margem muito baixa (<10%) - ATENÇÍO
  if (margemReal < 10) {
    return {
      label: `Margem baixa (${margemReal.toFixed(1)}%)`,
      color: "#F59E0B",
      alerta: true,
    };
  }

  // Margem boa (10-30%) - OK
  if (margemReal < 30) {
    return {
      label: `Margem boa (${margemReal.toFixed(1)}%)`,
      color: "#3B82F6",
      alerta: false,
    };
  }

  // Margem excelente (≥30%) - ÓTIMO
  return {
    label: `Margem excelente (${margemReal.toFixed(1)}%)`,
    color: "#10B981",
    alerta: false,
  };
}

/**
 * Formata valor de margem/markup para exibiçÍo
 */
export function formatarPercentual(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "-";
  return `${valor.toFixed(2)}%`;
}

/**
 * Calcula custo estimado baseado no preço e margem
 * Útil para migraçÍo de dados
 */
export function estimarCustoDePreco(
  precoVenda: number,
  margemLucro: number = 30
): number {
  // Fórmula inversa: custo = preco_venda / (1 + margem/100)
  return precoVenda / (1 + margemLucro / 100);
}


// ============================================================
// TIPOS: Histórico, ValidaçÍo e PublicaçÍo
// ============================================================

/** Tipos de problema detectados pela validaçÍo */
export type TipoProblemaValidacao =
  | "valor_zerado"
  | "margem_negativa"
  | "nome_duplicado"
  | "sem_categoria"
  | "codigo_irregular"
  | "unidade_invalida"
  | "preco_m2_inconsistente"
  | "custo_zerado"
  | "preco_abaixo_custo"
  | "item_sem_fornecedor"
  | "estoque_abaixo_minimo";

/** Fontes de importaçÍo */
export type FonteImportacao = "excel" | "catalogo" | "sinapi" | "ia" | "manual" | "lote";

/** Registro de histórico de um item */
export interface PricelistItemHistorico {
  id: string;
  item_id: string;
  versao: number;
  snapshot: Record<string, unknown>;
  nome_anterior: string | null;
  preco_anterior: number | null;
  preco_novo: number | null;
  alterado_por: string | null;
  motivo: string | null;
  campos_alterados: string[];
  created_at: string;
}

/** Problema de validaçÍo de um item */
export interface PricelistValidacao {
  id: string;
  item_id: string;
  campo: string;
  tipo_problema: TipoProblemaValidacao;
  mensagem: string;
  sugestao: string | null;
  bloqueante: boolean;
  resolvido: boolean;
  resolvido_em: string | null;
  resolvido_por: string | null;
  created_at: string;
}

/** Problema com dados do item (view vw_pricelist_problemas) */
export interface PricelistProblema extends PricelistValidacao {
  codigo: string | null;
  nome: string;
  preco: number;
  tipo: TipoPricelist | null;
  ativo: boolean;
  categoria_nome: string | null;
  detectado_em: string;
}

/** PublicaçÍo versionada */
export interface PricelistPublicacao {
  id: string;
  versao_label: string;
  publicado_por: string | null;
  publicado_em: string;
  total_itens: number;
  snapshot: Record<string, unknown>[];
  resumo: {
    total_itens: number;
    total_categorias: number;
    por_tipo: Record<string, number>;
    preco_medio: number;
    data_publicacao: string;
  } | null;
  notas: string | null;
}

/** Dashboard de saúde (view vw_pricelist_saude) */
export interface PricelistSaude {
  total_itens: number;
  ativos: number;
  inativos: number;
  sem_preco: number;
  sem_categoria: number;
  margem_negativa: number;
  estoque_baixo: number;
  pct_saudavel: number | null;
  ultima_publicacao: string | null;
  ultima_publicacao_em: string | null;
}

/** Log de importaçÍo */
export interface PricelistImportLog {
  id: string;
  fonte: FonteImportacao;
  nome_arquivo: string | null;
  total_linhas: number;
  importados: number;
  erros: number;
  itens_ids: string[] | null;
  detalhes_erros: Array<{ linha?: number; campo?: string; mensagem: string }> | null;
  importado_por: string | null;
  created_at: string;
}

/** Resultado da validaçÍo completa */
export interface ResultadoValidacaoCompleta {
  total_itens: number;
  total_problemas: number;
  bloqueantes: number;
  alertas: number;
}


