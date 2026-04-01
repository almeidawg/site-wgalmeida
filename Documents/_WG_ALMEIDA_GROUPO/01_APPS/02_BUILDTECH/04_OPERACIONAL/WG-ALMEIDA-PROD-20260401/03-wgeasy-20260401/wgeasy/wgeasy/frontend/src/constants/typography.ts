// ============================================================
// CONSTANTES DE TIPOGRAFIA
// Sistema WG Easy - Grupo WG Almeida
// Padrões de tamanho e peso de fonte para todo o sistema
// Com suporte responsivo para mobile, tablet e desktop
// ============================================================

/**
 * ESCALA RESPONSIVA:
 * Mobile (base): Tamanhos reduzidos para melhor legibilidade
 * Tablet (sm/md): Tamanhos intermediários
 * Desktop (lg+): Tamanhos padrÍo
 */

export const TYPOGRAPHY = {
  // ==========================================
  // TÍTULOS DE PÁGINA
  // ==========================================
  pageTitle: "text-[20px] sm:text-[22px] lg:text-[24px] font-light tracking-tight text-gray-900",
  pageSubtitle: "text-[11px] sm:text-[12px] text-gray-600",

  // ==========================================
  // CARDS DE STATUS/MÉTRICAS
  // ==========================================
  statNumber: "text-[16px] sm:text-[17px] lg:text-[18px] font-light text-gray-900",
  statLabel: "text-[11px] sm:text-[12px] text-gray-500",
  statDescription: "text-[10px] sm:text-[11px] text-gray-400",

  // ==========================================
  // CARDS DE CLIENTE/ENTIDADE
  // ==========================================
  cardTitle: "text-[12px] sm:text-[13px] font-normal text-gray-900",
  cardTitleLight: "text-[12px] sm:text-[13px] font-normal text-gray-900",
  cardSubtitle: "text-[10px] sm:text-[11px] text-gray-500",
  cardMeta: "text-[10px] sm:text-[11px] text-gray-400",

  // ==========================================
  // SEÇÕES DENTRO DE PÁGINAS
  // ==========================================
  sectionTitle: "text-[16px] sm:text-[17px] lg:text-[18px] font-normal text-gray-900",
  sectionSubtitle: "text-[11px] sm:text-[12px] text-gray-600",

  // ==========================================
  // BOTÕES DE AÇÍO
  // ==========================================
  actionTitle: "text-[12px] sm:text-[13px] font-normal text-wg-primary",
  actionSubtitle: "text-[10px] sm:text-[11px] text-gray-500",

  // ==========================================
  // BADGES/TAGS
  // ==========================================
  badge: "text-[11px] sm:text-[12px] font-normal px-1.5 sm:px-2 py-0.5 rounded-full",
  badgeSmall: "text-[9px] sm:text-[10px] font-normal px-1 sm:px-1.5 py-0.5 rounded-full",

  // ==========================================
  // TABELAS
  // ==========================================
  tableHeader: "text-[12px] sm:text-[13px] font-normal text-gray-500 uppercase tracking-wider",
  tableCell: "text-[11px] sm:text-[12px] text-gray-900",
  tableCellSmall: "text-[10px] sm:text-[11px] text-gray-500",

  // ==========================================
  // FORMULÁRIOS
  // ==========================================
  formLabel: "text-[12px] sm:text-[13px] font-normal text-gray-700",
  formHelper: "text-[10px] sm:text-[11px] text-gray-500",
  formError: "text-[10px] sm:text-[11px] text-red-600",

  // ==========================================
  // LINKS E NAVEGAÇÍO
  // ==========================================
  navItem: "text-[12px] sm:text-[13px] font-normal text-gray-700",
  navItemActive: "text-[12px] sm:text-[13px] font-normal text-wg-primary",
  breadcrumb: "text-[11px] sm:text-[12px] text-gray-500",

  // ==========================================
  // MODAIS E SHEETS
  // ==========================================
  modalTitle: "text-[16px] sm:text-[17px] lg:text-[18px] font-normal text-gray-900",
  modalDescription: "text-[11px] sm:text-[12px] text-gray-600",

  // ==========================================
  // MENSAGENS/ALERTAS
  // ==========================================
  alertTitle: "text-[12px] sm:text-[13px] font-normal text-gray-900",
  alertDescription: "text-[10px] sm:text-[11px] text-gray-600",

  // ==========================================
  // VALORES MONETÁRIOS
  // ==========================================
  moneyLarge: "text-[16px] sm:text-[17px] lg:text-[18px] font-normal text-wg-primary",
  moneyMedium: "text-[13px] sm:text-[14px] font-normal text-wg-primary",
  moneySmall: "text-[11px] sm:text-[12px] font-normal text-wg-primary",

  // ==========================================
  // ÍCONES RESPONSIVOS
  // ==========================================
  iconSmall: "w-3 h-3 sm:w-3.5 sm:h-3.5",
  iconMedium: "w-4 h-4 sm:w-5 sm:h-5",
  iconLarge: "w-5 h-5 sm:w-6 sm:h-6",

  // ==========================================
  // TEXTOS ESPECIAIS
  // ==========================================
  caption: "text-[9px] sm:text-[10px] text-gray-400",
  overline: "text-[9px] sm:text-[10px] uppercase tracking-wider text-gray-500",
  bodySmall: "text-[11px] sm:text-[12px] text-gray-700",
  bodyMedium: "text-[12px] sm:text-[13px] text-gray-700",
} as const;

// Tipo para autocomplete
export type TypographyKey = keyof typeof TYPOGRAPHY;

// ==========================================
// HELPERS - Funções auxiliares
// ==========================================

/**
 * Combina classes de tipografia com classes customizadas
 */
export function combineTypography(typoKey: TypographyKey, customClasses?: string): string {
  return customClasses ? `${TYPOGRAPHY[typoKey]} ${customClasses}` : TYPOGRAPHY[typoKey];
}

