// ============================================================
// SANITIZAÇÃO DE INPUTS — Wrapper tipado para DOMPurify
// Previne XSS em conteúdo gerado pelo usuário
// ============================================================

import DOMPurify from "dompurify";

/**
 * Sanitiza HTML gerado pelo usuário (rich text editors, templates).
 * Remove scripts e atributos maliciosos, mas preserva formatação básica.
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== "string") return "";
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [
      "p", "br", "b", "i", "u", "strong", "em", "ul", "ol", "li",
      "h1", "h2", "h3", "h4", "span", "div", "a", "table", "tr", "td", "th",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "style", "class"],
    FORCE_BODY: true,
  });
}

/**
 * Sanitiza texto puro — remove toda marcação HTML.
 * Use para campos de texto simples (nome, descrição, etc).
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== "string") return "";
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
}

/**
 * Escapa caracteres HTML especiais para exibição segura.
 * Alternativa leve sem DOMPurify para casos simples.
 */
export function escapeHtml(input: string): string {
  if (!input || typeof input !== "string") return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Sanitiza URL — permite apenas http/https/mailto.
 * Previne javascript: e data: URIs maliciosos.
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed;
  return "";
}

/**
 * Sanitiza nome de arquivo — remove caracteres perigosos.
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName || typeof fileName !== "string") return "";
  return fileName
    // eslint-disable-next-line no-control-regex
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/\.\./g, "_")
    .trim()
    .slice(0, 255);
}

