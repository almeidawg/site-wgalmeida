/**
 * 🎨 WGeasy Design System — Design Tokens
 * Baseado no Manual de Identidade Visual Oficial do Grupo WG Almeida | 2026
 *
 * "Do ponto de partida criativo à criaçÍo."
 *
 * FONTE ÚNICA DA VERDADE para todo o sistema visual.
 * Qualquer alteraçÍo aqui se propaga automaticamente.
 */

export const designTokens = {

  // ========================================
  // 🎨 PALETA CROMÁTICA OFICIAL
  // ========================================
  colors: {

    // IDENTIDADE MARCA GRUPO WG ALMEIDA
    brand: {
      // Laranja WG - Energia, inovaçÍo e açÍo. O ponto da criaçÍo.
      primary: '#F25C26',
      primaryCMYK: 'C0 M74 Y90 K0',

      // Preto WG - SofisticaçÍo e autoridade
      black: '#2E2E2E',
      blackCMYK: 'C0 M0 Y0 K82',

      // Cinza WG - Neutralidade técnica
      gray: '#4C4C4C',
      grayCMYK: 'C0 M0 Y0 K70',

      // Cinza Claro - Suavidade
      grayLight: '#F3F3F3',
      grayLightCMYK: 'C0 M0 Y0 K5',

      // Branco
      white: '#FFFFFF',
      whiteCMYK: 'C0 M0 Y0 K0',
    },

    // NÚCLEOS (Cores de Unidade)
    nucleos: {
      // Verde Mineral - WG Arquitetura
      arquitetura: {
        main: '#5E9B94',
        cmyk: 'C35 M60 Y75 K20',
        meaning: 'Design racional, equilíbrio e intençÍo',
      },

      // Azul Técnico - WG Engenharia
      engenharia: {
        main: '#2B4580',
        cmyk: 'C60 M10 Y35 K10',
        meaning: 'Estrutura, método e precisÍo',
      },

      // Marrom Carvalho - WG Marcenaria
      marcenaria: {
        main: '#8B5E3C',
        cmyk: 'C100 M85 Y25 K10',
        meaning: 'Calor, materialidade e luxo artesanal',
      },
    },

    // SEMÂNTICAS (Status e alertas)
    semantic: {
      success: '#10b981',
      successLight: '#d1fae5',
      warning: '#f59e0b',
      warningLight: '#fef3c7',
      error: '#ef4444',
      errorLight: '#fee2e2',
      info: '#3b82f6',
      infoLight: '#dbeafe',
    },
  },

  // ========================================
  // 📏 SISTEMA TIPOGRÁFICO OFICIAL
  // ========================================
  typography: {
    fontFamily: {
      display: '"Oswald", sans-serif',
      body: '"Poppins", sans-serif',
      text: '"Roboto", sans-serif',
    },

    fontSize: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
      '5xl': '3rem',      // 48px
    },

    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

} as const;

export type DesignTokens = typeof designTokens;

