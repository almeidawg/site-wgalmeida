/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// HELPERS: Funções auxiliares para geraçÍo de PDFs
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import type { PropostaItem } from "@/types/propostas";
import type { ContratoItem } from "@/types/contratos";

export type Nucleo = "arquitetura" | "engenharia" | "marcenaria" | "produtos";

// Union type for items that can be from Proposta or Contrato
type ItemPDF = PropostaItem | ContratoItem;

export interface ItensPorNucleo {
  arquitetura: PropostaItem[] | ContratoItem[];
  engenharia: {
    maoDeObra: PropostaItem[] | ContratoItem[];
    materiais: PropostaItem[] | ContratoItem[];
  };
  marcenaria: PropostaItem[] | ContratoItem[];
  produtos: PropostaItem[] | ContratoItem[];
}

export interface SubtotaisPorNucleo {
  arquitetura: number;
  engenharia: {
    maoDeObra: number;
    materiais: number;
    total: number;
  };
  marcenaria: number;
  produtos: number;
  total: number;
}

// Helper to get nome from either PropostaItem or ContratoItem
function getItemNome(item: ItemPDF): string | undefined {
  if ("nome" in item) return item.nome;
  if ("descricao" in item) return item.descricao;
  return undefined;
}

/**
 * Identifica o núcleo de um item baseado em código, categoria ou nome
 * PRIORIDADE: 1. Campo nucleo do banco, 2. Código, 3. Categoria, 4. Nome, 5. Tipo
 */
function identificarNucleoItem(item: ItemPDF): Nucleo {
  // PRIORIDADE 1: Usar campo nucleo do banco de dados (se disponível)
  if ("nucleo" in item && item.nucleo) {
    return item.nucleo as Nucleo;
  }

  // PRIORIDADE 2: Verificar código do item (ex: ACA-001 = Arquitetura, MAR-001 = Marcenaria)
  const itemCodigo = "codigo" in item ? item.codigo : undefined;
  if (itemCodigo) {
    const codigo = itemCodigo.toUpperCase();
    if (codigo.startsWith("ACA-") || codigo.startsWith("ARQ-")) return "arquitetura";
    if (codigo.startsWith("MAR-") || codigo.startsWith("MARC-")) return "marcenaria";
    if (codigo.startsWith("ENG-") || codigo.startsWith("OBRA-") || codigo.startsWith("MAT-")) return "engenharia";
    if (codigo.startsWith("PROD-")) return "produtos";
  }

  // PRIORIDADE 3: Verificar categoria
  const itemCategoria = "categoria" in item ? item.categoria : undefined;
  if (itemCategoria) {
    const cat = itemCategoria.toLowerCase();
    if (cat.includes("arquitetura") || cat.includes("projeto")) return "arquitetura";
    if (cat.includes("marcenaria") || cat.includes("marcen") || cat.includes("mobil")) return "marcenaria";
    if (cat.includes("engenharia") || cat.includes("obra") || cat.includes("constru")) return "engenharia";
    if (cat.includes("produto") || cat.includes("mercadoria")) return "produtos";
  }

  // PRIORIDADE 4: Verificar nome do item
  const nome = getItemNome(item)?.toLowerCase() || "";
  if (nome.includes("projeto") || nome.includes("arquitet")) return "arquitetura";
  if (nome.includes("marcenaria") || nome.includes("móvel") || nome.includes("armário")) return "marcenaria";

  // PRIORIDADE 5: Usar tipo como fallback
  if ("tipo" in item) {
    const propItem = item as PropostaItem;
    // Se for mÍo de obra ou material, considerar engenharia por padrÍo
    if (propItem.tipo === "mao_obra" || propItem.tipo === "material") {
      return "engenharia";
    }
  }

  // PadrÍo: produtos
  return "produtos";
}

/**
 * Organiza itens de proposta/contrato por núcleo
 */
export function organizarItensPorNucleo(
  itens: ItemPDF[],
  nucleoPrincipal?: string
): ItensPorNucleo {
  const resultado: ItensPorNucleo = {
    arquitetura: [],
    engenharia: {
      maoDeObra: [],
      materiais: [],
    },
    marcenaria: [],
    produtos: [],
  };

  itens.forEach((item) => {
    // Identificar o núcleo do item
    const nucleo = identificarNucleoItem(item);

    // Distribuir por núcleo
    if (nucleo === "arquitetura") {
      (resultado.arquitetura as ItemPDF[]).push(item);
    } else if (nucleo === "engenharia") {
      // Para engenharia, separar por tipo (mÍo de obra ou material)
      const itemTipo = "tipo" in item ? item.tipo : undefined;
      if (itemTipo === "mao_obra") {
        (resultado.engenharia.maoDeObra as ItemPDF[]).push(item);
      } else if (itemTipo === "material") {
        (resultado.engenharia.materiais as ItemPDF[]).push(item);
      } else {
        // Se for "ambos" ou não especificado, colocar em mÍo de obra
        (resultado.engenharia.maoDeObra as ItemPDF[]).push(item);
      }
    } else if (nucleo === "marcenaria") {
      (resultado.marcenaria as ItemPDF[]).push(item);
    } else {
      (resultado.produtos as ItemPDF[]).push(item);
    }
  });

  return resultado;
}

/**
 * Calcula subtotais por núcleo
 */
export function calcularSubtotaisPorNucleo(
  itensPorNucleo: ItensPorNucleo
): SubtotaisPorNucleo {
  const calcularTotal = (itens: any[]) =>
    itens.reduce((sum, item) => {
      const valor = item.valor_subtotal || item.preco_total || item.valor_total || 0;
      return sum + valor;
    }, 0);

  const arquitetura = calcularTotal(itensPorNucleo.arquitetura);
  const engenhariaObra = calcularTotal(itensPorNucleo.engenharia.maoDeObra);
  const engenhariaMat = calcularTotal(itensPorNucleo.engenharia.materiais);
  const marcenaria = calcularTotal(itensPorNucleo.marcenaria);
  const produtos = calcularTotal(itensPorNucleo.produtos);

  return {
    arquitetura,
    engenharia: {
      maoDeObra: engenhariaObra,
      materiais: engenhariaMat,
      total: engenhariaObra + engenhariaMat,
    },
    marcenaria,
    produtos,
    total: arquitetura + engenhariaObra + engenhariaMat + marcenaria + produtos,
  };
}

/**
 * Sanitiza texto para PDF - substitui caracteres especiais que não renderizam corretamente
 * jsPDF com fonte Helvetica não suporta alguns caracteres Unicode
 */
export function sanitizarTextoPDF(texto: string): string {
  if (!texto) return texto;

  return texto
    // Caracteres especiais
    .replace(/×/g, "x")
    .replace(/²/g, "2")
    .replace(/³/g, "3")
    .replace(/°/g, "o")
    .replace(/—/g, "-")
    .replace(/–/g, "-")
    .replace(/'/g, "'")
    .replace(/'/g, "'")
    .replace(/"/g, '"')
    .replace(/"/g, '"')
    .replace(/…/g, "...")
    .replace(/•/g, "-")
    .replace(/€/g, "EUR")
    .replace(/£/g, "GBP")
    .replace(/¥/g, "JPY")
    // Acentos - manter mas garantir encoding correto
    .replace(/à/g, "a")
    .replace(/á/g, "a")
    .replace(/â/g, "a")
    .replace(/Í/g, "a")
    .replace(/ä/g, "a")
    .replace(/è/g, "e")
    .replace(/é/g, "e")
    .replace(/ê/g, "e")
    .replace(/ë/g, "e")
    .replace(/ì/g, "i")
    .replace(/í/g, "i")
    .replace(/î/g, "i")
    .replace(/ï/g, "i")
    .replace(/ò/g, "o")
    .replace(/ó/g, "o")
    .replace(/ô/g, "o")
    .replace(/õ/g, "o")
    .replace(/ö/g, "o")
    .replace(/ù/g, "u")
    .replace(/ú/g, "u")
    .replace(/û/g, "u")
    .replace(/ü/g, "u")
    .replace(/ç/g, "c")
    .replace(/ñ/g, "n")
    .replace(/À/g, "A")
    .replace(/Á/g, "A")
    .replace(/Â/g, "A")
    .replace(/Í/g, "A")
    .replace(/Ä/g, "A")
    .replace(/È/g, "E")
    .replace(/É/g, "E")
    .replace(/Ê/g, "E")
    .replace(/Ë/g, "E")
    .replace(/Ì/g, "I")
    .replace(/Í/g, "I")
    .replace(/Î/g, "I")
    .replace(/Ï/g, "I")
    .replace(/Ò/g, "O")
    .replace(/Ó/g, "O")
    .replace(/Ô/g, "O")
    .replace(/Õ/g, "O")
    .replace(/Ö/g, "O")
    .replace(/Ù/g, "U")
    .replace(/Ú/g, "U")
    .replace(/Û/g, "U")
    .replace(/Ü/g, "U")
    .replace(/Ç/g, "C")
    .replace(/Ñ/g, "N");
}

/**
 * Converte cor hex para RGB
 */
export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}

/**
 * Cores dos núcleos
 */
export const CORES_NUCLEOS = {
  arquitetura: "#5E9B94",
  engenharia: "#2B4580",
  marcenaria: "#8B5E3C",
  produtos: "#F25C26",
};

/**
 * Textos "sobre a cor" para cada núcleo
 */
export const TEXTOS_SOBRE_COR = {
  arquitetura:
    "sobre a cor: design racional, equilíbrio e intençÍo. Evoca clareza de pensamento, proporçÍo e visÍo arquitetônica. É a cor da concepçÍo: traduz o momento em que o espaço é imaginado e ganha forma conceitual no ecossistema turnkey.",
  engenharia:
    "sobre a cor: Estrutura, método e precisÍo. Representa cálculo, confiabilidade e disciplina técnica. É a espinha dorsal do processo, o ponto onde a ideia deixa de ser abstrata e se torna viável, segura e executável.",
  marcenaria:
    "sobre a cor: Materialidade, artesania e luxo discreto. É o toque humano e autoral da obra, onde o projeto se transforma em realidade concreta. Transmite aconchego, tradiçÍo e a sofisticaçÍo silenciosa dos acabamentos de alto padrÍo.",
  produtos:
    "sobre a cor: Energia, inovaçÍo e açÍo. É o ponto de partida criativo, o 'ponto WG', símbolo do nascimento da ideia. Representa o movimento, a decisÍo e a força que impulsiona o projeto — do primeiro traço à entrega final.",
};

/**
 * Texto introdutório padrÍo
 */
export const TEXTO_INTRODUTORIO = `Sua proposta é estruturada de forma clara e estratégica para que você visualize, com precisÍo, tudo o que será desenvolvido e contratado ao longo do seu projeto.

Os itens estÍo organizados pelos núcleos que compõem o ecossistema turnkey do Grupo WG Almeida: Arquitetura, Engenharia e Marcenaria. Cada unidade atua de maneira integrada, mantendo a mesma linguagem técnica, o mesmo padrÍo de qualidade e o compromisso com o resultado final.

Ao longo deste documento, você encontrará os itens distribuídos por especialidade, demonstrando como cada área contribui tecnicamente para a construçÍo de um resultado final harmônico, eficiente e fiel ao propósito do projeto. Essa integraçÍo é o que garante previsibilidade, organizaçÍo, controle absoluto de qualidade e, sobretudo, uma experiência fluida para o cliente — do conceito à entrega.

Nosso objetivo é tornar o processo mais seguro, transparente e inteligente, reduzindo ruídos, eliminando retrabalhos e unificando as tomadas de decisÍo sob uma gestÍo centralizada, sólida e responsável.

Seja bem-vindo à experiência WG Almeida: onde técnica, design e execuçÍo atuam como um só organismo para transformar espaços com propósito e alta performance.`;



