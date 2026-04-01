// ============================================================
// ConfiguraçÍo Centralizada de Categorias do Sistema
// Sistema WG Easy - Grupo WG Almeida
// ============================================================
// Cores e códigos padronizados para uso em:
// - Pricelist (categorias e subcategorias)
// - Orçamentos (headers de categoria)
// - EVF (Estudo de Viabilidade)
// - Tags e identificadores visuais
// ============================================================

export interface CategoriaConfig {
  id: string;
  codigo: string;        // Ex: ELE, AUT, HID
  nome: string;
  cor: string;           // Cor principal (hex)
  corClara: string;      // Cor clara para backgrounds
  icone: string;         // Nome do ícone lucide-react
  ordem: number;         // Ordem cronológica de obra
  tipo: 'material' | 'mao_de_obra' | 'servico' | 'equipamento';
}

export interface SubcategoriaConfig {
  prefixo: string;       // MAT, ACA, PRO, MDO, etc.
  nome: string;
  descricao: string;
}

// ============================================================
// SUBCATEGORIAS PADRÍO — 8 tipos em ordem de workflow
// Nota: MDO (legado) está mapeado para EXE
// ============================================================
export const SUBCATEGORIAS_PADRAO: SubcategoriaConfig[] = [
  { prefixo: "EXE", nome: "ExecuçÍo", descricao: "MÍo de obra de execuçÍo — tarefas e atividades" },
  { prefixo: "EPI", nome: "EPI", descricao: "Equipamentos de proteçÍo individual" },
  { prefixo: "INS", nome: "Insumo", descricao: "Consumíveis: cola, disco de corte, lixa, etc." },
  { prefixo: "FER", nome: "Ferramentas", descricao: "Ferramentas necessárias para execuçÍo" },
  { prefixo: "INF", nome: "Infraestrutura", descricao: "Caixas, conduítes, eletrodutos, fios de passagem" },
  { prefixo: "MAT", nome: "Materiais", descricao: "Materiais: gesso, areia, cimento, massa pronta, fios" },
  { prefixo: "ACA", nome: "Acabamentos", descricao: "Tomadas, interruptores, módulos, espelhos de acabamento" },
  { prefixo: "PRO", nome: "Produto", descricao: "Lustres, luminárias, equipamentos e produtos finais" },
];

// ============================================================
// CATEGORIAS PRINCIPAIS - Ordem Cronológica de Obra (sincronizado com DB)
// ============================================================
export const CATEGORIAS_CONFIG: CategoriaConfig[] = [
  // Fase 0 — Planejamento
  { id: "arquitetura",                codigo: "ARQ", nome: "Arquitetura",                  cor: "#059669", corClara: "#D1FAE5", icone: "Compass",         ordem: 1,  tipo: "servico" },
  { id: "documentacao",               codigo: "DOC", nome: "DocumentaçÍo",                 cor: "#7C3AED", corClara: "#EDE9FE", icone: "FileText",        ordem: 2,  tipo: "servico" },
  { id: "staff",                      codigo: "STA", nome: "Staff",                        cor: "#EC4899", corClara: "#FCE7F3", icone: "Users",           ordem: 3,  tipo: "servico" },
  { id: "kick_off",                   codigo: "KIC", nome: "Kick-off",                     cor: "#F97316", corClara: "#FFEDD5", icone: "Rocket",          ordem: 4,  tipo: "mao_de_obra" },
  { id: "pre_obra_protecoes",         codigo: "PRE", nome: "Pré Obra & Proteções",         cor: "#78716C", corClara: "#F5F5F4", icone: "Shield",          ordem: 5,  tipo: "mao_de_obra" },

  // Fase 1 — PreparaçÍo
  { id: "pre_obra",                   codigo: "POM", nome: "Pré Obra e Remoções",          cor: "#78716C", corClara: "#F5F5F4", icone: "Trash2",          ordem: 6,  tipo: "servico" },
  { id: "demolicoes",                 codigo: "DEM", nome: "Demolições",                   cor: "#EF4444", corClara: "#FEE2E2", icone: "Hammer",          ordem: 7,  tipo: "servico" },
  { id: "icamento",                   codigo: "ICA", nome: "Içamento",                     cor: "#8B5CF6", corClara: "#EDE9FE", icone: "ArrowUp",         ordem: 8,  tipo: "servico" },

  // Fase 2 — Estrutura
  { id: "paredes",                    codigo: "PAR", nome: "Paredes",                      cor: "#F59E0B", corClara: "#FEF3C7", icone: "LayoutGrid",      ordem: 9,  tipo: "material" },
  { id: "alvenaria",                  codigo: "ALV", nome: "Alvenaria",                    cor: "#92400E", corClara: "#FEF3C7", icone: "Brick",           ordem: 10, tipo: "mao_de_obra" },
  { id: "drywall",                    codigo: "DRY", nome: "Drywall",                      cor: "#9CA3AF", corClara: "#F3F4F6", icone: "Square",          ordem: 11, tipo: "mao_de_obra" },
  { id: "material_basico",            codigo: "MBA", nome: "Material Básico",              cor: "#78716C", corClara: "#F5F5F4", icone: "Package",         ordem: 12, tipo: "material" },

  // Fase 3 — Instalações
  { id: "eletrica",                   codigo: "ELE", nome: "Elétrica",                     cor: "#FBBF24", corClara: "#FEF3C7", icone: "Zap",             ordem: 13, tipo: "material" },
  { id: "hidrossanitaria",            codigo: "HID", nome: "Hidrossanitária",              cor: "#3B82F6", corClara: "#DBEAFE", icone: "Droplets",        ordem: 14, tipo: "material" },
  { id: "gas",                        codigo: "GAS", nome: "Gás",                          cor: "#FF6B6B", corClara: "#FFE0E0", icone: "Flame",           ordem: 15, tipo: "material" },
  { id: "aquecedor_gas",              codigo: "AQG", nome: "Aquecedor a Gas",              cor: "#DC2626", corClara: "#FEE2E2", icone: "Flame",           ordem: 16, tipo: "equipamento" },
  { id: "infra_ar",                   codigo: "IAT", nome: "Infra TubulaçÍo AC",           cor: "#06B6D4", corClara: "#CFFAFE", icone: "Wind",            ordem: 17, tipo: "material" },
  { id: "infra_ar_condicionado",      codigo: "IAC", nome: "Infra de Ar Condicionado",     cor: "#10B981", corClara: "#D1FAE5", icone: "Wind",            ordem: 18, tipo: "material" },
  { id: "ar_condicionado",            codigo: "ACO", nome: "Ar Condicionado",              cor: "#60A5FA", corClara: "#DBEAFE", icone: "Snowflake",       ordem: 19, tipo: "equipamento" },
  { id: "automacao",                  codigo: "AUT", nome: "AutomaçÍo",                    cor: "#A855F7", corClara: "#F3E8FF", icone: "Cpu",             ordem: 20, tipo: "equipamento" },
  { id: "material_eletrico_hidraulico", codigo: "MEH", nome: "Material Elétrico e Hidráulico", cor: "#0EA5E9", corClara: "#E0F2FE", icone: "Package",    ordem: 21, tipo: "material" },
  { id: "tomadas_interruptores",      codigo: "TOM", nome: "Tomadas e Interruptores",      cor: "#EA580C", corClara: "#FFEDD5", icone: "PlugZap",        ordem: 22, tipo: "material" },

  // Fase 4 — Revestimentos
  { id: "gesso",                      codigo: "GES", nome: "Gesso",                        cor: "#9CA3AF", corClara: "#F3F4F6", icone: "Square",          ordem: 23, tipo: "material" },
  { id: "piso",                       codigo: "PIS", nome: "Piso",                         cor: "#A78BFA", corClara: "#EDE9FE", icone: "Grid3X3",         ordem: 24, tipo: "material" },
  { id: "pintura",                    codigo: "PIN", nome: "Pintura",                      cor: "#0D9488", corClara: "#CCFBF1", icone: "PaintBucket",     ordem: 25, tipo: "material" },
  { id: "material_pintura",           codigo: "MPT", nome: "Material Pintura",             cor: "#84CC16", corClara: "#ECFCCB", icone: "PaintBucket",     ordem: 26, tipo: "material" },
  { id: "marmoraria",                 codigo: "MRM", nome: "Marmoraria",                   cor: "#C4B5FD", corClara: "#F5F3FF", icone: "Gem",             ordem: 27, tipo: "material" },

  // Fase 5 — Acabamentos
  { id: "envidracamento",             codigo: "ENV", nome: "Envidraçamento",               cor: "#14B8A6", corClara: "#CCFBF1", icone: "GalleryVertical", ordem: 28, tipo: "material" },
  { id: "vidracaria",                 codigo: "VID", nome: "Vidraçaria",                   cor: "#22D3EE", corClara: "#CFFAFE", icone: "GalleryVertical", ordem: 29, tipo: "material" },
  { id: "cubas_loucas_metais",        codigo: "CLM", nome: "Cubas, Louças e Metais",       cor: "#0891B2", corClara: "#CFFAFE", icone: "Droplets",        ordem: 30, tipo: "material" },
  { id: "iluminacao",                 codigo: "ILU", nome: "IluminaçÍo",                   cor: "#EAB308", corClara: "#FEF9C3", icone: "Lightbulb",       ordem: 31, tipo: "equipamento" },
  { id: "loucas_metais",              codigo: "LMT", nome: "Louças e Metais",              cor: "#0EA5E9", corClara: "#E0F2FE", icone: "Droplets",        ordem: 32, tipo: "material" },
  { id: "acabamentos",                codigo: "ABA", nome: "Acabamentos",                  cor: "#DB2777", corClara: "#FCE7F3", icone: "Palette",         ordem: 33, tipo: "material" },

  // Fase 6 — Mobiliário
  { id: "marcenaria",                 codigo: "MAR", nome: "Marcenaria",                   cor: "#8B5E3C", corClara: "#FED7AA", icone: "Hammer",          ordem: 34, tipo: "material" },
  { id: "eletrodomesticos",           codigo: "ELT", nome: "Eletrodomésticos",             cor: "#FB923C", corClara: "#FED7AA", icone: "Refrigerator",    ordem: 35, tipo: "equipamento" },
  { id: "eletros",                    codigo: "ELR", nome: "Eletros",                      cor: "#6366F1", corClara: "#E0E7FF", icone: "Tv",              ordem: 36, tipo: "equipamento" },
  { id: "cortinas_persianas",         codigo: "CTP", nome: "Cortinas e Persianas",         cor: "#8B5CF6", corClara: "#EDE9FE", icone: "Blinds",          ordem: 37, tipo: "material" },
  { id: "moveis_convencionais",       codigo: "MVC", nome: "Móveis Convencionais",         cor: "#A16207", corClara: "#FEF3C7", icone: "Armchair",        ordem: 38, tipo: "equipamento" },

  // Fase 7 — FinalizaçÍo e Apoio
  { id: "finalizacao",                codigo: "FIN", nome: "FinalizaçÍo",                  cor: "#22C55E", corClara: "#DCFCE7", icone: "CheckCircle",     ordem: 39, tipo: "servico" },
  { id: "limpeza",                    codigo: "LIM", nome: "Limpeza Pós Obra",             cor: "#2DD4BF", corClara: "#CCFBF1", icone: "Sparkles",        ordem: 40, tipo: "servico" },
  { id: "mao_obra",                   codigo: "MOB", nome: "MÍo de Obra",                  cor: "#2B4580", corClara: "#DBEAFE", icone: "HardHat",         ordem: 41, tipo: "mao_de_obra" },
  { id: "producao",                   codigo: "PRD", nome: "ProduçÍo",                     cor: "#64748B", corClara: "#F1F5F9", icone: "Factory",         ordem: 42, tipo: "servico" },
];

// ============================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================

/**
 * Normaliza nome removendo prefixos numéricos e caracteres especiais
 */
function normalizarNome(nome: string): string {
  if (!nome) return "";
  return nome
    .toLowerCase()
    .trim()
    // eslint-disable-next-line no-useless-escape
    .replace(/^\d{1,3}[\s]*[\/\-][\s]*/, "") // Remove "001/", "01-", "1 / "
    .replace(/&/g, "e") // Substitui & por e
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Remove acentos
}

/**
 * Extrai apenas o nome da categoria sem prefixos
 * Ex: "001/Arquitetura" → "arquitetura"
 */
function extrairNomeCategoria(nome: string): string {
  if (!nome) return "";
  // Remove prefixo numérico com / ou -
  // eslint-disable-next-line no-useless-escape
  const match = nome.match(/^\d{1,3}[\s]*[\/\-][\s]*(.+)$/);
  if (match) {
    return normalizarNome(match[1]);
  }
  return normalizarNome(nome);
}

/**
 * Busca configuraçÍo de categoria pelo nome
 */
export function getCategoriaConfig(nome: string): CategoriaConfig | undefined {
  const nomeBusca = extrairNomeCategoria(nome);

  // Primeiro: busca exata
  let resultado = CATEGORIAS_CONFIG.find(
    c => extrairNomeCategoria(c.nome) === nomeBusca ||
         c.id === nomeBusca ||
         c.codigo.toLowerCase() === nomeBusca
  );

  // Segundo: busca parcial (contains)
  if (!resultado && nomeBusca.length >= 3) {
    resultado = CATEGORIAS_CONFIG.find(
      c => extrairNomeCategoria(c.nome).includes(nomeBusca) ||
           nomeBusca.includes(extrairNomeCategoria(c.nome))
    );
  }

  return resultado;
}

/**
 * Retorna a cor de uma categoria pelo nome
 */
export function getCorCategoria(nome: string): string {
  const config = getCategoriaConfig(nome);
  return config?.cor || "#6B7280";
}

/**
 * Retorna a cor clara (background) de uma categoria
 */
export function getCorClaraCategoria(nome: string): string {
  const config = getCategoriaConfig(nome);
  return config?.corClara || "#F3F4F6";
}

/**
 * Retorna o código de uma categoria pelo nome
 */
export function getCodigoCategoria(nome: string): string {
  const config = getCategoriaConfig(nome);
  return config?.codigo || nome.substring(0, 3).toUpperCase();
}

/**
 * Retorna a ordem cronológica de uma categoria
 */
export function getOrdemCategoria(nome: string): number {
  const config = getCategoriaConfig(nome);
  return config?.ordem || 99;
}

/**
 * Gera código de item: SUBCAT/CAT-NNN
 * Ex: MAT/ELE-001
 */
export function gerarCodigoItem(
  categoria: string,
  subcategoria: string,
  numero: number
): string {
  const codigoCat = getCodigoCategoria(categoria);
  const prefixoSub = SUBCATEGORIAS_PADRAO.find(
    s => s.nome.toLowerCase() === subcategoria.toLowerCase() ||
         s.prefixo.toLowerCase() === subcategoria.toLowerCase()
  )?.prefixo || subcategoria.substring(0, 3).toUpperCase();

  return `${prefixoSub}/${codigoCat}-${String(numero).padStart(3, '0')}`;
}

/**
 * Ordena categorias por ordem cronológica de obra
 */
export function ordenarCategorias<T extends { categoria?: string; nome?: string }>(
  itens: T[]
): T[] {
  return [...itens].sort((a, b) => {
    const ordemA = getOrdemCategoria(a.categoria || a.nome || "");
    const ordemB = getOrdemCategoria(b.categoria || b.nome || "");
    return ordemA - ordemB;
  });
}

/**
 * Mapa de cores por nome de categoria (para uso direto)
 */
export const CORES_CATEGORIAS: Record<string, string> = CATEGORIAS_CONFIG.reduce(
  (acc, cat) => {
    acc[cat.nome] = cat.cor;
    acc[cat.nome.toLowerCase()] = cat.cor;
    acc[cat.id] = cat.cor;
    acc[cat.codigo] = cat.cor;
    return acc;
  },
  {} as Record<string, string>
);

/**
 * Mapa de cores claras por nome de categoria
 */
export const CORES_CLARAS_CATEGORIAS: Record<string, string> = CATEGORIAS_CONFIG.reduce(
  (acc, cat) => {
    acc[cat.nome] = cat.corClara;
    acc[cat.nome.toLowerCase()] = cat.corClara;
    acc[cat.id] = cat.corClara;
    acc[cat.codigo] = cat.corClara;
    return acc;
  },
  {} as Record<string, string>
);

