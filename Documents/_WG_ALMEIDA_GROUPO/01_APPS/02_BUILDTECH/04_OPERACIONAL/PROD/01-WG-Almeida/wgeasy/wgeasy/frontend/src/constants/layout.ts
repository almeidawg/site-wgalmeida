// ============================================================
// CONSTANTES DE LAYOUT RESPONSIVO
// Sistema WG Easy - Grupo WG Almeida
// Padrões de layout para tela inteira e responsividade
// ============================================================

/**
 * BREAKPOINTS TAILWIND (referência):
 * sm: 640px   - Smartphones landscape
 * md: 768px   - Tablets
 * lg: 1024px  - Laptops
 * xl: 1280px  - Desktops
 * 2xl: 1536px - Telas grandes
 */

export const LAYOUT = {
  // ==========================================
  // CONTAINERS - Layouts de página principal
  // ==========================================

  // Container de página principal - tela inteira com padding responsivo
  pageContainer: "w-full px-3 sm:px-4 md:px-6 lg:px-8",

  // Container com largura máxima para conteúdo centralizado
  contentContainer: "w-full max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8",

  // Container para formulários (mais estreito)
  formContainer: "w-full max-w-4xl mx-auto px-3 sm:px-4 md:px-6",

  // ==========================================
  // GRIDS - Layouts de grade responsivos
  // ==========================================

  // Grid padrÍo 1-2-3-4 colunas
  gridCards: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4",

  // Grid para dashboard (1-2-3 colunas)
  gridDashboard: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4",

  // Grid para stats/métricas (2-3-4-6 colunas)
  gridStats: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3",

  // Grid 50/50 que vira stack em mobile
  gridHalf: "grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4",

  // Grid 2/3 + 1/3 (sidebar direita)
  gridSidebar: "grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_400px] gap-4",

  // Grid 1/3 + 2/3 (sidebar esquerda)
  gridSidebarLeft: "grid grid-cols-1 lg:grid-cols-[320px_1fr] xl:grid-cols-[400px_1fr] gap-4",

  // ==========================================
  // ESPAÇAMENTOS - Gaps e margens
  // ==========================================

  // Espaçamento entre seções
  sectionGap: "space-y-4 sm:space-y-6",

  // Espaçamento entre cards
  cardGap: "space-y-3 sm:space-y-4",

  // Espaçamento interno de cards
  cardPadding: "p-3 sm:p-4 md:p-5",

  // Espaçamento de header de página
  pageHeaderSpacing: "mb-4 sm:mb-6",

  // ==========================================
  // HEADERS - Cabeçalhos de página
  // ==========================================

  // Header de página com ações
  pageHeader: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6",

  // Título com ícone
  pageTitleWrapper: "flex items-center gap-2 sm:gap-3",

  // Ações do header (botões)
  pageActions: "flex flex-wrap items-center gap-2",

  // ==========================================
  // TABELAS - Layout responsivo para tabelas
  // ==========================================

  // Container de tabela com scroll horizontal em mobile
  tableWrapper: "w-full overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0",

  // Tabela com largura mínima
  tableResponsive: "min-w-[600px] w-full",

  // ==========================================
  // MODAIS E SHEETS
  // ==========================================

  // Modal pequeno
  modalSmall: "w-[95vw] max-w-md",

  // Modal médio
  modalMedium: "w-[95vw] max-w-lg",

  // Modal grande
  modalLarge: "w-[95vw] max-w-2xl",

  // Modal extra grande
  modalXLarge: "w-[95vw] max-w-4xl",

  // Sheet lateral
  sheetSide: "w-[95vw] sm:w-[400px] md:w-[500px]",

  // ==========================================
  // CARDS - Estilos de cards
  // ==========================================

  // Card padrÍo
  card: "bg-white rounded-lg shadow-sm border-0 p-3 sm:p-4",

  // Card com hover
  cardHover: "bg-white rounded-lg shadow-sm border-0 p-3 sm:p-4 hover:shadow-md transition-shadow",

  // Card de stat/métrica
  cardStat: "bg-white rounded-lg shadow-sm border-0 p-3 sm:p-4 text-center",

  // ==========================================
  // FORMULÁRIOS - Layouts de formulário
  // ==========================================

  // Grid de formulário 1-2 colunas
  formGrid: "grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4",

  // Grid de formulário 1-2-3 colunas
  formGridThree: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4",

  // Campo de formulário full width
  formFieldFull: "col-span-1 md:col-span-2",

  // ==========================================
  // LISTAS - Layouts de lista
  // ==========================================

  // Lista com itens
  listContainer: "space-y-2 sm:space-y-3",

  // Item de lista
  listItem: "flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors",

  // ==========================================
  // NAVEGAÇÍO - Tabs e navegaçÍo
  // ==========================================

  // Tabs com scroll horizontal em mobile
  tabsWrapper: "w-full overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0",

  // Container de tabs
  tabsList: "inline-flex min-w-max",

  // ==========================================
  // UTILIDADES - Classes auxiliares
  // ==========================================

  // Esconder em mobile
  hideOnMobile: "hidden sm:block",

  // Mostrar apenas em mobile
  showOnMobile: "block sm:hidden",

  // Texto truncado responsivo
  truncateResponsive: "truncate max-w-[120px] sm:max-w-[200px] md:max-w-none",

  // Stack em mobile, row em desktop
  stackToRow: "flex flex-col sm:flex-row",

  // Centralizar em mobile
  centerOnMobile: "text-center sm:text-left",
} as const;

// Tipo para autocomplete
export type LayoutKey = keyof typeof LAYOUT;

// ==========================================
// HELPERS - Funções auxiliares
// ==========================================

/**
 * Combina classes de layout com classes customizadas
 */
export function combineLayout(layoutKey: LayoutKey, customClasses?: string): string {
  return customClasses ? `${LAYOUT[layoutKey]} ${customClasses}` : LAYOUT[layoutKey];
}

/**
 * Gera classes de grid responsivo customizado
 */
export function responsiveGrid(
  mobile: number,
  tablet: number,
  desktop: number,
  gap: string = "gap-3 sm:gap-4"
): string {
  return `grid grid-cols-${mobile} sm:grid-cols-${tablet} lg:grid-cols-${desktop} ${gap}`;
}

