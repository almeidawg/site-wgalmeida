/**
 * 🇧🇷 Formatadores Brasil - WGeasy Design System
 *
 * Utilitários para formataçÍo de datas, moedas e números
 * no padrÍo brasileiro (pt-BR)
 *
 * Grupo WG Almeida | 2026
 */

// ========================================
// 📅 FORMATAÇÍO DE DATAS
// ========================================

/**
 * Formata data para DD/MM/AAAA
 * @example formatDate(new Date()) => "23/01/2026"
 */
export const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return '-';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return '-';

  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();

  return `${day}/${month}/${year}`;
};

/**
 * Formata data com hora para DD/MM/AAAA HH:mm
 */
export const formatDateTime = (date: Date | string | null | undefined): string => {
  if (!date) return '-';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return '-';

  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Formata data por extenso
 * @example formatDateExtended(new Date()) => "23 de janeiro de 2026"
 */
export const formatDateExtended = (date: Date | string | null | undefined): string => {
  if (!date) return '-';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return '-';

  return dateObj.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Formata data relativa (hoje, ontem, etc)
 */
export const formatRelativeDate = (date: Date | string | null | undefined): string => {
  if (!date) return '-';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return '-';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(dateObj);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - targetDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  if (diffDays === -1) return 'AmanhÍ';
  if (diffDays > 1 && diffDays <= 7) return `Há ${diffDays} dias`;

  return formatDate(dateObj);
};

// ========================================
// 💰 FORMATAÇÍO DE MOEDA (REAL BRASILEIRO)
// ========================================

/**
 * Formata valor em Real brasileiro (R$)
 * @example formatCurrency(100) => "R$ 100,00"
 * @example formatCurrency(1053.02) => "R$ 1.053,02"
 */
export const formatCurrency = (
  value: number | string | null | undefined,
  options?: {
    showSymbol?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string => {
  const {
    showSymbol = true,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options || {};

  if (value === null || value === undefined) return showSymbol ? 'R$ 0,00' : '0,00';

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) return showSymbol ? 'R$ 0,00' : '0,00';

  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(numValue);

  return showSymbol ? formatted : formatted.replace('R$', '').trim();
};

/**
 * Formata valor compacto (K, M, B)
 * @example formatCurrencyCompact(1500000) => "R$ 1,5 mi"
 */
export const formatCurrencyCompact = (
  value: number | string | null | undefined
): string => {
  if (value === null || value === undefined) return 'R$ 0';

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) return 'R$ 0';

  const absValue = Math.abs(numValue);
  const sign = numValue < 0 ? '-' : '';

  if (absValue >= 1_000_000_000) {
    return `${sign}R$ ${(absValue / 1_000_000_000).toFixed(1).replace('.', ',')} bi`;
  }
  if (absValue >= 1_000_000) {
    return `${sign}R$ ${(absValue / 1_000_000).toFixed(1).replace('.', ',')} mi`;
  }
  if (absValue >= 1_000) {
    return `${sign}R$ ${(absValue / 1_000).toFixed(1).replace('.', ',')} mil`;
  }

  return formatCurrency(numValue);
};

// ========================================
// 🔢 FORMATAÇÍO DE NÚMEROS
// ========================================

/**
 * Formata número com separadores de milhar
 * @example formatNumber(1053.02) => "1.053,02"
 */
export const formatNumber = (
  value: number | string | null | undefined,
  decimals: number = 0
): string => {
  if (value === null || value === undefined) return '0';

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) return '0';

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue);
};

/**
 * Formata percentual
 * @example formatPercent(0.1532) => "15,32%"
 */
export const formatPercent = (
  value: number | string | null | undefined,
  isDecimal: boolean = true,
  decimals: number = 2
): string => {
  if (value === null || value === undefined) return '0%';

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) return '0%';

  const percentValue = isDecimal ? numValue * 100 : numValue;

  return `${formatNumber(percentValue, decimals)}%`;
};

// ========================================
// 🔄 PARSING (Converter de volta para valores)
// ========================================

/**
 * Converte string de data DD/MM/AAAA para Date
 */
export const parseDate = (dateString: string): Date | null => {
  if (!dateString) return null;

  const parts = dateString.split('/');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);

  const date = new Date(year, month, day);

  if (isNaN(date.getTime())) return null;

  return date;
};

/**
 * Converte string de moeda para número
 * @example parseCurrency("R$ 1.053,02") => 1053.02
 */
export const parseCurrency = (value: string | null | undefined): number => {
  if (!value) return 0;

  const cleaned = value
    .replace(/R\$/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');

  const num = parseFloat(cleaned);

  return isNaN(num) ? 0 : num;
};

// ========================================
// 📦 EXPORTAÇÍO AGRUPADA
// ========================================

export const formatters = {
  date: formatDate,
  dateTime: formatDateTime,
  dateExtended: formatDateExtended,
  relativeDate: formatRelativeDate,
  currency: formatCurrency,
  currencyCompact: formatCurrencyCompact,
  number: formatNumber,
  percent: formatPercent,
  parseDate,
  parseCurrency,
};

export default formatters;

