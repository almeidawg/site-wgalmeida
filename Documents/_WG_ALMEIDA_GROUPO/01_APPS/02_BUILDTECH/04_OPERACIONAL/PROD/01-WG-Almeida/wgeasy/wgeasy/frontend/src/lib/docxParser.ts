// ============================================================
// Parser de documentos .docx para texto estruturado
// Sistema WG Easy - Grupo WG Almeida
// Usa JSZip para extrair word/document.xml e parsear paragrafos
// ============================================================

import JSZip from "jszip";

/**
 * Extrair texto completo de um arquivo .docx
 * O .docx é um ZIP contendo word/document.xml com os parágrafos
 */
export async function extrairTextoDocx(arquivo: File): Promise<string> {
  if (!arquivo.name.toLowerCase().endsWith(".docx")) {
    throw new Error("Arquivo deve ser .docx");
  }

  const arrayBuffer = await arquivo.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const documentXml = zip.file("word/document.xml");
  if (!documentXml) {
    throw new Error("Arquivo .docx inválido: word/document.xml não encontrado");
  }

  const xmlContent = await documentXml.async("string");

  // Parsear XML e extrair texto dos parágrafos
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, "text/xml");

  // Namespace do WordprocessingML
  const ns = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

  const paragraphs = doc.getElementsByTagNameNS(ns, "p");
  const lines: string[] = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    const textNodes = p.getElementsByTagNameNS(ns, "t");
    let line = "";

    for (let j = 0; j < textNodes.length; j++) {
      line += textNodes[j].textContent || "";
    }

    // Preservar linhas vazias como separadores de seçÍo
    lines.push(line);
  }

  // Juntar e limpar (remover excesso de linhas vazias consecutivas)
  return lines
    .join("\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

/**
 * Verificar se um arquivo é .docx válido
 */
export function isDocxFile(arquivo: File): boolean {
  return (
    arquivo.name.toLowerCase().endsWith(".docx") &&
    (arquivo.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      arquivo.type === "" || // Alguns browsers não detectam o tipo
      arquivo.type === "application/octet-stream")
  );
}

/**
 * Tipos de arquivo aceitos para análise de escopo
 */
export const TIPOS_ARQUIVO_ESCOPO = {
  docx: ".docx",
  pdf: ".pdf",
  imagens: ".jpg,.jpeg,.png,.gif,.webp",
} as const;

export const ACCEPT_ESCOPO = `${TIPOS_ARQUIVO_ESCOPO.docx},${TIPOS_ARQUIVO_ESCOPO.pdf},${TIPOS_ARQUIVO_ESCOPO.imagens}`;


