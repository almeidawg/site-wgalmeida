// ============================================================
// Utilitário: ConversÍo de PDF para Imagens
// Sistema WG Easy - Grupo WG Almeida
// Usa pdf.js para renderizar páginas de PDF como imagens
// ============================================================

import * as pdfjsLib from "pdfjs-dist";

// Configurar worker do pdf.js com arquivo da própria lib (evita mismatch de versÍo)
pdfjsLib.GlobalWorkerOptions.workerSrc =
  new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

export interface PDFPageImage {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

export interface PDFConversionResult {
  success: boolean;
  pages: PDFPageImage[];
  totalPages: number;
  error?: string;
}

/**
 * Converte um arquivo PDF em array de imagens (uma por página)
 * @param file Arquivo PDF
 * @param scale Escala de renderizaçÍo (2 = 2x resoluçÍo, bom para análise)
 * @param maxPages Máximo de páginas a converter (0 = todas)
 * @returns Array de imagens em base64
 */
export async function convertPDFToImages(
  file: File,
  scale: number = 2,
  maxPages: number = 0
): Promise<PDFConversionResult> {
  try {
    // Ler arquivo como ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Carregar PDF
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;
    const pagesToConvert = maxPages > 0 ? Math.min(maxPages, totalPages) : totalPages;

    const pages: PDFPageImage[] = [];

    // Converter cada página
    for (let pageNum = 1; pageNum <= pagesToConvert; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      // Criar canvas para renderizaçÍo
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("não foi possível criar contexto de canvas");
      }

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Renderizar página no canvas
      await page.render({
        canvasContext: context,
        viewport: viewport,
        canvas: canvas,
      }).promise;

      // Converter para imagem base64
      const dataUrl = canvas.toDataURL("image/png", 0.95);

      pages.push({
        pageNumber: pageNum,
        dataUrl,
        width: viewport.width,
        height: viewport.height,
      });
    }

    return {
      success: true,
      pages,
      totalPages,
    };
  } catch (error: unknown) {
    console.error("Erro ao converter PDF:", error);
    return {
      success: false,
      pages: [],
      totalPages: 0,
      error: error instanceof Error ? error.message : "Erro ao processar PDF",
    };
  }
}

/**
 * Converte data URL em File object
 */
export function dataUrlToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
}

/**
 * Verifica se um arquivo é PDF
 */
export function isPDFFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}


