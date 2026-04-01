// ============================================================================
// TIPOS DO MÓDULO EVF - Estudo de Viabilidade Financeira
// Sistema WG Easy - Grupo WG Almeida
// ============================================================================

// Padrões de acabamento com multiplicadores
export type PadraoAcabamento = 'economico' | 'medio_alto' | 'alto_luxo';

export const PADRAO_MULTIPLICADORES: Record<PadraoAcabamento, number> = {
  economico: 0.7,
  medio_alto: 1.0,
  alto_luxo: 1.5,
};

export const PADRAO_LABELS: Record<PadraoAcabamento, { label: string; descricao: string }> = {
  economico: {
    label: 'Econômico',
    descricao: 'Materiais básicos, acabamento simples (0.7x)'
  },
  medio_alto: {
    label: 'Médio/Alto',
    descricao: 'Materiais de qualidade, acabamento padrÍo (1.0x)'
  },
  alto_luxo: {
    label: 'Alto/Luxo',
    descricao: 'Materiais premium, acabamento sofisticado (1.5x)'
  },
};

// Categorias do EVF - widened to string for extensibility (v2: ~28 categorias)
export type CategoriaEVF = string;

// Tipo de categoria para classificaçÍo
export type TipoCategoria = 'servico' | 'material' | 'mao_de_obra' | 'equipamento';

// ConfiguraçÍo de cada categoria (fallback local)
export interface CategoriaEVFConfig {
  id: CategoriaEVF;
  nome: string;
  valorM2Padrao: number;
  icone: string;
  cor: string;
  ordem: number;
  fase: number;
  fase_nome: string;
  tipo: TipoCategoria;
}

// Fases da obra para agrupamento no EVF
export interface FaseEVF {
  fase: number;
  nome: string;
  cor: string;
}

export const FASES_EVF: FaseEVF[] = [
  { fase: 0, nome: 'Planejamento',  cor: '#64748B' },
  { fase: 1, nome: 'PreparaçÍo',    cor: '#78716C' },
  { fase: 2, nome: 'Estrutura',     cor: '#92400E' },
  { fase: 3, nome: 'Instalações',   cor: '#D97706' },
  { fase: 4, nome: 'Revestimentos', cor: '#7C3AED' },
  { fase: 5, nome: 'Acabamentos',   cor: '#DB2777' },
  { fase: 6, nome: 'Mobiliário',    cor: '#8B5E3C' },
  { fase: 7, nome: 'Apoio',         cor: '#06B6D4' },
];

// ConfiguraçÍo padrÍo das ~28 categorias (EVF v2 - Fev/2026)
// Fontes: SINAPI, CUB, Cronoshare, MySide, WebArCondicionado
// CORES PADRONIZADAS com categoriasConfig.ts (sem duplicatas)
// TIPO: servico (fee/projeto), material, mao_de_obra (MDO+mat), equipamento (só produto)
export const CATEGORIAS_EVF_CONFIG: CategoriaEVFConfig[] = [
  // F0 - Planejamento
  { id: 'arquitetura',          nome: 'Arquitetura',              valorM2Padrao: 120.00, icone: 'Compass',        cor: '#059669', ordem: 1,  fase: 0, fase_nome: 'Planejamento', tipo: 'servico' },
  { id: 'documentacao',         nome: 'DocumentaçÍo',             valorM2Padrao: 35.00,  icone: 'FileText',       cor: '#64748B', ordem: 2,  fase: 0, fase_nome: 'Planejamento', tipo: 'servico' },
  // F1 - PreparaçÍo
  { id: 'pre_obra_protecoes',   nome: 'Pré Obra & Proteções',     valorM2Padrao: 45.00,  icone: 'ShieldCheck',    cor: '#78716C', ordem: 3,  fase: 1, fase_nome: 'PreparaçÍo',   tipo: 'mao_de_obra' },
  { id: 'demolicoes',           nome: 'Demolições',               valorM2Padrao: 80.00,  icone: 'Hammer',         cor: '#B91C1C', ordem: 4,  fase: 1, fase_nome: 'PreparaçÍo',   tipo: 'mao_de_obra' },
  { id: 'icamento',             nome: 'Içamento',                 valorM2Padrao: 25.00,  icone: 'ArrowUpCircle',  cor: '#475569', ordem: 5,  fase: 1, fase_nome: 'PreparaçÍo',   tipo: 'servico' },
  // F2 - Estrutura
  { id: 'alvenaria',            nome: 'Alvenaria',                valorM2Padrao: 120.00, icone: 'Blocks',         cor: '#92400E', ordem: 6,  fase: 2, fase_nome: 'Estrutura',    tipo: 'mao_de_obra' },
  { id: 'material_basico',      nome: 'Material Básico',          valorM2Padrao: 250.00, icone: 'Package',        cor: '#78716C', ordem: 7,  fase: 2, fase_nome: 'Estrutura',    tipo: 'material' },
  { id: 'drywall',              nome: 'Drywall',                  valorM2Padrao: 95.00,  icone: 'LayoutGrid',     cor: '#9CA3AF', ordem: 8,  fase: 2, fase_nome: 'Estrutura',    tipo: 'mao_de_obra' },
  // F3 - Instalações
  { id: 'eletrica',             nome: 'Elétrica',                 valorM2Padrao: 180.00, icone: 'Zap',            cor: '#D97706', ordem: 9,  fase: 3, fase_nome: 'Instalações',  tipo: 'mao_de_obra' },
  { id: 'hidrossanitaria',      nome: 'Hidrossanitária',          valorM2Padrao: 150.00, icone: 'Droplets',       cor: '#0369A1', ordem: 10, fase: 3, fase_nome: 'Instalações',  tipo: 'mao_de_obra' },
  { id: 'ar_condicionado',      nome: 'Ar Condicionado',          valorM2Padrao: 450.00, icone: 'Snowflake',      cor: '#60A5FA', ordem: 11, fase: 3, fase_nome: 'Instalações',  tipo: 'mao_de_obra' },  // Inclui infra (170) + equipamento (280)
  { id: 'gas',                  nome: 'Gás',                      valorM2Padrao: 95.00,  icone: 'Flame',          cor: '#DC2626', ordem: 12, fase: 3, fase_nome: 'Instalações',  tipo: 'mao_de_obra' },   // Inclui infra gás (40) + aquecedor (55)
  { id: 'tomadas_interruptores',nome: 'Tomadas e Interruptores',  valorM2Padrao: 55.00,  icone: 'PlugZap',        cor: '#EA580C', ordem: 13, fase: 3, fase_nome: 'Instalações',  tipo: 'material' },
  // F4 - Revestimentos
  { id: 'gesso',                nome: 'Gesso',                    valorM2Padrao: 140.00, icone: 'Square',         cor: '#9CA3AF', ordem: 16, fase: 4, fase_nome: 'Revestimentos', tipo: 'mao_de_obra' },
  { id: 'piso',                 nome: 'Piso',                     valorM2Padrao: 200.00, icone: 'Grid3x3',        cor: '#7C3AED', ordem: 17, fase: 4, fase_nome: 'Revestimentos', tipo: 'material' },
  { id: 'pintura',              nome: 'Pintura (MDO)',             valorM2Padrao: 65.00,  icone: 'PaintBucket',    cor: '#84CC16', ordem: 18, fase: 4, fase_nome: 'Revestimentos', tipo: 'mao_de_obra' },
  { id: 'material_pintura',     nome: 'Material Pintura',         valorM2Padrao: 70.00,  icone: 'PaintBucket',    cor: '#84CC16', ordem: 19, fase: 4, fase_nome: 'Revestimentos', tipo: 'material' },
  { id: 'marmoraria',           nome: 'Marmoraria',               valorM2Padrao: 350.00, icone: 'Gem',            cor: '#C4B5FD', ordem: 20, fase: 4, fase_nome: 'Revestimentos', tipo: 'material' },
  // F5 - Acabamentos
  { id: 'automacao',            nome: 'AutomaçÍo',                valorM2Padrao: 200.00, icone: 'Cpu',            cor: '#A855F7', ordem: 21, fase: 5, fase_nome: 'Acabamentos',  tipo: 'equipamento' },
  { id: 'cubas_loucas_metais',  nome: 'Cubas, Louças e Metais',   valorM2Padrao: 120.00, icone: 'Droplets',       cor: '#0891B2', ordem: 22, fase: 5, fase_nome: 'Acabamentos',  tipo: 'material' },
  { id: 'envidracamento',       nome: 'Envidraçamento',            valorM2Padrao: 280.00, icone: 'GalleryVertical',cor: '#14B8A6', ordem: 23, fase: 5, fase_nome: 'Acabamentos',  tipo: 'material' },
  { id: 'iluminacao',           nome: 'IluminaçÍo',               valorM2Padrao: 100.00, icone: 'Lightbulb',      cor: '#EAB308', ordem: 24, fase: 5, fase_nome: 'Acabamentos',  tipo: 'equipamento' },
  { id: 'vidracaria',           nome: 'Vidraçaria',               valorM2Padrao: 250.00, icone: 'GalleryVertical',cor: '#22D3EE', ordem: 25, fase: 5, fase_nome: 'Acabamentos',  tipo: 'material' },
  { id: 'acabamentos',          nome: 'Acabamentos',              valorM2Padrao: 280.00, icone: 'Palette',        cor: '#DB2777', ordem: 26, fase: 5, fase_nome: 'Acabamentos',  tipo: 'material' },
  // F6 - Mobiliário
  { id: 'marcenaria',           nome: 'Marcenaria',               valorM2Padrao: 1800.00,icone: 'Hammer',         cor: '#8B5E3C', ordem: 27, fase: 6, fase_nome: 'Mobiliário',   tipo: 'material' },
  { id: 'eletros',              nome: 'Eletros',                  valorM2Padrao: 250.00, icone: 'Refrigerator',   cor: '#6366F1', ordem: 28, fase: 6, fase_nome: 'Mobiliário',   tipo: 'equipamento' },
  { id: 'cortinas_persianas',  nome: 'Cortinas e Persianas',     valorM2Padrao: 85.00,  icone: 'Blinds',         cor: '#8B5CF6', ordem: 29, fase: 6, fase_nome: 'Mobiliário',   tipo: 'material' },
  { id: 'moveis_convencionais',nome: 'Móveis Convencionais',     valorM2Padrao: 350.00, icone: 'Armchair',       cor: '#A16207', ordem: 30, fase: 6, fase_nome: 'Mobiliário',   tipo: 'equipamento' },
  // F7 - Apoio
  { id: 'limpeza',              nome: 'Limpeza Pós Obra',         valorM2Padrao: 20.00,  icone: 'Sparkles',       cor: '#06B6D4', ordem: 31, fase: 7, fase_nome: 'Apoio',        tipo: 'servico' },
];

// Item individual do estudo
export interface EVFItem {
  id?: string;
  estudo_id?: string;
  categoria: CategoriaEVF;
  nome: string;
  valorM2Base: number;
  valorM2Ajustado: number;
  valorPrevisao: number;
  valorMinimo: number; // -15%
  valorMaximo: number; // +15%
  valorEstudoReal: number;
  percentualTotal: number;
  ordem: number;
}

// Estudo completo
export interface EVFEstudo {
  id: string;
  analise_projeto_id: string | null;
  cliente_id: string | null;
  titulo: string;
  metragem_total: number;
  padrao_acabamento: PadraoAcabamento;
  valor_total: number;
  valor_m2_medio: number;
  observacoes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Estudo com dados relacionados
export interface EVFEstudoCompleto extends EVFEstudo {
  itens: EVFItem[];
  analise_projeto?: {
    id: string;
    titulo: string;
    area_total: number;
  } | null;
  cliente?: {
    id: string;
    nome: string;
  } | null;
}

// Formulário de criaçÍo/ediçÍo
export interface EVFEstudoFormData {
  analise_projeto_id?: string;  // Opcional - EVF é criado ANTES da análise de projeto
  // Permitir null/undefined pois formulários existentes às vezes passam `null`
  cliente_id?: string | null;           // Obrigatório no fluxo, mas aceitar null em formulários
  titulo: string;
  metragem_total: number;
  padrao_acabamento: PadraoAcabamento;
  observacoes?: string;
}

// ConfiguraçÍo de categoria do banco
export interface EVFCategoriaConfig {
  id: string;
  codigo: CategoriaEVF;
  nome: string;
  valor_m2_padrao: number;
  icone: string | null;
  cor: string | null;
  ordem: number;
  ativo: boolean;
  updated_at: string;
  fase: number;
  fase_nome: string;
  tipo: TipoCategoria;
}

// Resultado do agrupamento por fase
export interface GrupoFaseEVF {
  fase: number;
  nome: string;
  cor: string;
  itens: EVFItem[];
  subtotal: number;
}

/**
 * Agrupa itens do EVF por fase da obra
 */
export function agruparItensPorFase(
  itens: EVFItem[],
  categoriasConfig: EVFCategoriaConfig[]
): GrupoFaseEVF[] {
  // Criar mapa de categoria -> fase
  const categoriaFaseMap = new Map<string, { fase: number; fase_nome: string }>();

  for (const cat of categoriasConfig) {
    categoriaFaseMap.set(cat.codigo, { fase: cat.fase ?? 7, fase_nome: cat.fase_nome ?? 'Apoio' });
  }

  // Fallback para categorias do config local
  for (const cat of CATEGORIAS_EVF_CONFIG) {
    if (!categoriaFaseMap.has(cat.id)) {
      categoriaFaseMap.set(cat.id, { fase: cat.fase, fase_nome: cat.fase_nome });
    }
  }

  // Agrupar itens
  const gruposMap = new Map<number, GrupoFaseEVF>();

  for (const item of itens) {
    const info = categoriaFaseMap.get(item.categoria) || { fase: 7, fase_nome: 'Outros' };
    const faseInfo = FASES_EVF.find(f => f.fase === info.fase);

    if (!gruposMap.has(info.fase)) {
      gruposMap.set(info.fase, {
        fase: info.fase,
        nome: faseInfo?.nome || info.fase_nome,
        cor: faseInfo?.cor || '#6B7280',
        itens: [],
        subtotal: 0,
      });
    }

    const grupo = gruposMap.get(info.fase)!;
    grupo.itens.push(item);
    grupo.subtotal += item.valorEstudoReal;
  }

  // Ordenar por número de fase
  return [...gruposMap.values()].sort((a, b) => a.fase - b.fase);
}

// ============================================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================================

/**
 * Calcula os itens do EVF baseado na metragem e padrÍo
 */
export function calcularItensEVF(
  metragem: number,
  padrao: PadraoAcabamento,
  categoriasConfig?: EVFCategoriaConfig[]
): EVFItem[] {
  const multiplicador = PADRAO_MULTIPLICADORES[padrao];

  // Usar configuraçÍo do banco ou valores padrÍo
  const categorias = categoriasConfig?.length
    ? categoriasConfig.map(c => ({
        id: c.codigo,
        nome: c.nome,
        valorM2Padrao: c.valor_m2_padrao,
        ordem: c.ordem,
      }))
    : CATEGORIAS_EVF_CONFIG.map(c => ({
        id: c.id,
        nome: c.nome,
        valorM2Padrao: c.valorM2Padrao,
        ordem: c.ordem,
      }));

  const itens: EVFItem[] = categorias.map(cat => {
    const valorM2Ajustado = cat.valorM2Padrao * multiplicador;
    const valorPrevisao = valorM2Ajustado * metragem;
    const valorMinimo = valorPrevisao * 0.85;
    const valorMaximo = valorPrevisao * 1.15;

    return {
      categoria: cat.id as CategoriaEVF,
      nome: cat.nome,
      valorM2Base: cat.valorM2Padrao,
      valorM2Ajustado,
      valorPrevisao,
      valorMinimo,
      valorMaximo,
      valorEstudoReal: valorPrevisao, // Valor inicial = previsÍo
      percentualTotal: 0,
      ordem: cat.ordem,
    };
  });

  // Calcular percentuais
  return calcularPercentuais(itens);
}

/**
 * Recalcula os percentuais de cada item
 */
export function calcularPercentuais(itens: EVFItem[]): EVFItem[] {
  const total = itens.reduce((sum, item) => sum + item.valorEstudoReal, 0);

  return itens.map(item => ({
    ...item,
    percentualTotal: total > 0 ? (item.valorEstudoReal / total) * 100 : 0,
  }));
}

/**
 * Calcula totais do estudo
 */
export function calcularTotaisEVF(itens: EVFItem[], metragem: number): {
  valorTotal: number;
  valorM2Medio: number;
  valorPrevisaoTotal: number;
  valorMinimoTotal: number;
  valorMaximoTotal: number;
} {
  const valorTotal = itens.reduce((sum, item) => sum + item.valorEstudoReal, 0);
  const valorPrevisaoTotal = itens.reduce((sum, item) => sum + item.valorPrevisao, 0);
  const valorMinimoTotal = itens.reduce((sum, item) => sum + item.valorMinimo, 0);
  const valorMaximoTotal = itens.reduce((sum, item) => sum + item.valorMaximo, 0);

  return {
    valorTotal,
    valorM2Medio: metragem > 0 ? valorTotal / metragem : 0,
    valorPrevisaoTotal,
    valorMinimoTotal,
    valorMaximoTotal,
  };
}

/**
 * Formata valor em reais
 */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

/**
 * Formata número com separadores
 */
export function formatarNumero(valor: number, decimais: number = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais,
  }).format(valor);
}

/**
 * Retorna a cor da categoria
 */
export function getCorCategoria(categoria: string): string {
  const config = CATEGORIAS_EVF_CONFIG.find(c => c.id === categoria);
  return config?.cor || '#6B7280';
}

/**
 * Retorna o ícone da categoria
 */
export function getIconeCategoria(categoria: string): string {
  const config = CATEGORIAS_EVF_CONFIG.find(c => c.id === categoria);
  return config?.icone || 'Package';
}

