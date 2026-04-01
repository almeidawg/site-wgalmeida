// ============================================================
// PARSER DE TEXTO INTELIGENTE
// Extrai automaticamente: nome, unidade, preço, quantidade
// de textos colados em diversos formatos
// ============================================================

export interface DadosExtraidos {
  nome: string;
  unidade: string;
  preco: number | null;
  quantidade: number | null;
  fonte: "extraido" | "buscar"; // extraido = dados encontrados no texto, buscar = precisa buscar na internet
  confianca: "alta" | "media" | "baixa";
  linhaOriginal: string;
  categoriaSugerida?: string; // Categoria extraída da primeira coluna (se formato planilha)
}

// Unidades de medida reconhecidas (ordenadas por prioridade/especificidade)
// IMPORTANTE: Usar (?:\s|$|R|\d) em vez de \b para caracteres Unicode como ² e ³
const UNIDADES_REGEX: { regex: RegExp; unidade: string }[] = [
  // Área - CORRIGIDO para Unicode ² e ³
  { regex: /(?:^|\s)m[²2](?:\s|$|R)/gi, unidade: "m²" },
  { regex: /(?:^|\s)cm[²2](?:\s|$|R)/gi, unidade: "cm²" },
  { regex: /\bmetro[s]?\s*quadrado[s]?\b/gi, unidade: "m²" },
  // Volume - CORRIGIDO para Unicode
  { regex: /(?:^|\s)m[³3](?:\s|$|R)/gi, unidade: "m³" },
  { regex: /\bmetro[s]?\s*c[úu]bico[s]?\b/gi, unidade: "m³" },
  { regex: /\b(\d+)\s*[lL]\b|\b(\d+)\s*litro[s]?\b/gi, unidade: "L" },
  { regex: /\bml\b|\bmililitro[s]?\b/gi, unidade: "ml" },
  // Linear
  { regex: /\bmetro[s]?\s*linear[es]?\b/gi, unidade: "ml" },
  { regex: /(?:^|\s)m(?:\s|$)(?![²³2-9])/gi, unidade: "m" },
  { regex: /\bcm\b/gi, unidade: "cm" },
  { regex: /\bmm\b/gi, unidade: "mm" },
  // Peso
  { regex: /\bkg\b|\bquilo[s]?\b|\bkilograma[s]?\b/gi, unidade: "kg" },
  { regex: /\bg\b(?!r)|\bgrama[s]?\b/gi, unidade: "g" },
  { regex: /\bton\b|\btonelada[s]?\b/gi, unidade: "ton" },
  // Unidade/peça
  { regex: /\bunidade[s]?\b/gi, unidade: "un" },
  { regex: /(?:^|\s)(?:un|und|unid)(?:\s|$)/gi, unidade: "un" },
  { regex: /\bpe[çc]a[s]?\b/gi, unidade: "pç" },
  { regex: /(?:^|\s)(?:p[çc]|pc)(?:\s|$)/gi, unidade: "pç" },
  // Verba/conjunto
  { regex: /\bverba[s]?\b/gi, unidade: "vb" },
  { regex: /(?:^|\s)vb(?:\s|$)/gi, unidade: "vb" },
  { regex: /\bconjunto[s]?\b/gi, unidade: "cj" },
  { regex: /(?:^|\s)cj(?:\s|$)/gi, unidade: "cj" },
  // Pacote/saco
  { regex: /\bpacote[s]?\b/gi, unidade: "pct" },
  { regex: /(?:^|\s)pct(?:\s|$)/gi, unidade: "pct" },
  { regex: /\bsaco[s]?\b/gi, unidade: "sc" },
  { regex: /(?:^|\s)sc(?:\s|$)/gi, unidade: "sc" },
  // Rolo/folha
  { regex: /\brolo[s]?\b/gi, unidade: "rl" },
  { regex: /(?:^|\s)rl(?:\s|$)/gi, unidade: "rl" },
  { regex: /\bfolha[s]?\b/gi, unidade: "fl" },
  { regex: /(?:^|\s)fl(?:\s|$)/gi, unidade: "fl" },
  // Caixa/lata
  { regex: /\bcaixa[s]?\b/gi, unidade: "cx" },
  { regex: /(?:^|\s)cx(?:\s|$)/gi, unidade: "cx" },
  { regex: /\blata[s]?\b/gi, unidade: "lt" },
  { regex: /(?:^|\s)lt(?:\s|$)/gi, unidade: "lt" },
  // Diária/hora
  { regex: /\bdi[áa]ria[s]?\b/gi, unidade: "diária" },
  { regex: /\bhora[s]?\b/gi, unidade: "h" },
  { regex: /(?:^|\s)hr?(?:\s|$)/gi, unidade: "h" },
];

// Regex para extrair preços em diversos formatos
const PRECO_PATTERNS = [
  // R$ 1.234,56 ou R$1234,56
  /R\$\s*([\d.,]+)/gi,
  // 1.234,56 ou 1234,56 (número com vírgula decimal brasileiro)
  /(\d{1,3}(?:\.\d{3})*,\d{2})/g,
  // 1234.56 (número com ponto decimal)
  /(\d+\.\d{2})(?!\d)/g,
];

// Regex para quantidade + unidade (ex: "45m²", "10un", "5kg")
const QTD_UNIDADE_PATTERN = /(\d+[.,]?\d*)\s*(m[²2³3]|m|cm|mm|kg|g|ton|un|und|p[çc]|pc|vb|cj|pct|sc|rl|fl|cx|lt|[lL])\b/gi;

/**
 * Detecta o formato da linha
 */
function detectarFormato(linha: string): "tab" | "pipe" | "espacos" | "preco" | "simples" {
  // Tem TAB? → formato planilha
  if (linha.includes("\t")) {
    return "tab";
  }

  // Tem pipe |? → formato tabular
  if (linha.includes("|")) {
    return "pipe";
  }

  // Tem múltiplos espaços separando campos? (3+ espaços consecutivos)
  // Ex: "Pintura de paredes   m²   R$ 16,00"
  if (/\s{3,}/.test(linha) && /R\$|(\d+[.,]\d{2})/.test(linha)) {
    return "espacos";
  }

  // Tem R$ ou preço? → formato lista com preços
  if (/R\$|(\d+[.,]\d{2})/.test(linha)) {
    return "preco";
  }

  // Texto simples
  return "simples";
}

/**
 * Extrai preço do texto
 */
function extrairPreco(texto: string): number | null {
  // Tentar cada pattern
  for (const pattern of PRECO_PATTERNS) {
    const matches = texto.matchAll(new RegExp(pattern));
    for (const match of matches) {
      const valorStr = match[1];
      if (valorStr) {
        // Converter formato brasileiro (1.234,56) para número
        const valorLimpo = valorStr
          .replace(/\./g, "") // Remove pontos de milhar
          .replace(",", "."); // Troca vírgula por ponto

        const valor = parseFloat(valorLimpo);
        if (!isNaN(valor) && valor > 0 && valor < 1000000) {
          return valor;
        }
      }
    }
  }
  return null;
}

/**
 * Extrai unidade do texto
 */
function extrairUnidade(texto: string): string {
  // Primeiro, verificar se tem preço/unidade (ex: R$ 89,90/m²)
  const precoUnidadeMatch = texto.match(/\/\s*(m[²2³3]|m|cm|mm|kg|g|ton|un|und|p[çc]|pc|vb|cj|pct|sc|rl|fl|cx|lt|[lL])\b/i);
  if (precoUnidadeMatch) {
    return normalizarUnidade(precoUnidadeMatch[1]);
  }

  // Verificar quantidade + unidade (ex: 45m², 10un)
  const qtdUnidadeMatch = texto.match(QTD_UNIDADE_PATTERN);
  if (qtdUnidadeMatch) {
    const match = qtdUnidadeMatch[0].match(/\d+[.,]?\d*\s*(.+)/i);
    if (match) {
      return normalizarUnidade(match[1]);
    }
  }

  // Buscar unidade isolada no texto
  for (const { regex, unidade } of UNIDADES_REGEX) {
    if (regex.test(texto)) {
      return unidade;
    }
  }

  return "un"; // PadrÍo
}

/**
 * Normaliza a unidade para formato padrÍo
 */
function normalizarUnidade(unidade: string): string {
  const u = unidade.toLowerCase().trim();

  if (/^m[²2]$|^metro[s]?\s*quadrado/.test(u)) return "m²";
  if (/^m[³3]$|^metro[s]?\s*c[úu]bico/.test(u)) return "m³";
  if (/^m$|^metro[s]?$/.test(u)) return "m";
  if (/^cm$/.test(u)) return "cm";
  if (/^mm$/.test(u)) return "mm";
  if (/^kg$|^quilo/.test(u)) return "kg";
  if (/^g$|^grama/.test(u)) return "g";
  if (/^ton/.test(u)) return "ton";
  if (/^un|^und|^unid/.test(u)) return "un";
  if (/^p[çc]$|^pe[çc]a/.test(u)) return "pç";
  if (/^pc$/.test(u)) return "pç";
  if (/^vb$|^verba/.test(u)) return "vb";
  if (/^cj$|^conjunto/.test(u)) return "cj";
  if (/^l$|^litro/.test(u)) return "L";
  if (/^ml$|^mililitro/.test(u)) return "ml";
  if (/^pct$|^pacote/.test(u)) return "pct";
  if (/^sc$|^saco/.test(u)) return "sc";
  if (/^rl$|^rolo/.test(u)) return "rl";
  if (/^fl$|^folha/.test(u)) return "fl";
  if (/^cx$|^caixa/.test(u)) return "cx";
  if (/^lt$|^lata/.test(u)) return "lt";
  if (/^di[áa]ria/.test(u)) return "diária";
  if (/^h$|^hr$|^hora/.test(u)) return "h";

  return "un";
}

/**
 * Extrai quantidade do texto
 */
function extrairQuantidade(texto: string): number | null {
  // Procurar padrÍo quantidade + unidade (ex: 45m², 10un, 5,5kg)
  const matches = texto.matchAll(QTD_UNIDADE_PATTERN);
  for (const match of matches) {
    const qtdStr = match[1].replace(",", ".");
    const qtd = parseFloat(qtdStr);
    if (!isNaN(qtd) && qtd > 0) {
      return qtd;
    }
  }

  // Procurar padrÍo "x 10" ou "x10" (multiplicador)
  const multMatch = texto.match(/[xX]\s*(\d+[.,]?\d*)\s*(un|und|p[çc]|pc)?/i);
  if (multMatch) {
    const qtd = parseFloat(multMatch[1].replace(",", "."));
    if (!isNaN(qtd) && qtd > 0) {
      return qtd;
    }
  }

  return null;
}

/**
 * Limpa o nome do produto removendo preços, quantidades e caracteres especiais
 */
function limparNome(texto: string): string {
  let nome = texto
    // Remove preços (R$ xxx,xx)
    .replace(/R\$\s*[\d.,]+/gi, "")
    // Remove preço/unidade (/m², /un) - incluindo Unicode
    .replace(/\/\s*(m[²2³3]|m|cm|mm|kg|g|ton|un|und|unidade|p[çc]|pc|vb|cj|pct|sc|rl|fl|cx|lt|[lL])/gi, "")
    // Remove unidades isoladas (m², m³, un, kg, etc.)
    .replace(/(?:^|\s)(m[²2³3]|cm[²2]|un|und|unid|unidade|kg|ton|vb|cj|pct|sc|rl|fl|cx|lt)(?:\s|$)/gi, " ")
    // Remove quantidade + unidade (45m², 10un) - mas mantém dimensões como 60x60
    .replace(/(\d+[.,]?\d*)\s*(m[²2³3]|kg|g|ton|un|und|p[çc]|pc|vb|cj|pct|sc|rl|fl|cx|lt|[lL])/gi, "")
    // Remove = total (= R$ 4.045,50)
    .replace(/=\s*R?\$?\s*[\d.,]+/gi, "")
    // Remove numeraçÍo inicial (1., 1), 01 -)
    .replace(/^\s*\d+[\.\)\-]\s*/g, "")
    // Remove separadores excessivos
    .replace(/\s*[-–—\.]{2,}\s*/g, " ")
    // Remove pontos finais isolados
    .replace(/\.{2,}/g, "")
    // Normaliza espaços
    .replace(/\s+/g, " ")
    .trim();

  // Remove traços no início/fim
  nome = nome.replace(/^[\s\-–—]+|[\s\-–—]+$/g, "").trim();

  return nome;
}

/**
 * Processa linha no formato TAB (planilha)
 * Detecta padrões como: [Categoria, Nome, Unidade, Preço] ou [Nome, Unidade, Preço]
 */
function processarFormatoTab(linha: string): DadosExtraidos {
  const colunas = linha.split("\t").map(c => c.trim()).filter(c => c);

  let nome = "";
  let unidade = "un";
  let preco: number | null = null;
  let quantidade: number | null = null;
  let categoriaSugerida: string | undefined = undefined;

  // Identificar colunas de texto (possíveis nomes/categorias)
  const colunasTexto: { indice: number; valor: string }[] = [];
  const colunasUnidade: { indice: number; valor: string }[] = [];
  const colunasPreco: { indice: number; valor: number }[] = [];
  const colunasNumero: { indice: number; valor: number }[] = [];

  for (let i = 0; i < colunas.length; i++) {
    const col = colunas[i];

    // É um preço?
    const precoExtraido = extrairPreco(col);
    if (precoExtraido !== null) {
      colunasPreco.push({ indice: i, valor: precoExtraido });
      continue;
    }

    // É uma unidade conhecida?
    const unidadeNormalizada = normalizarUnidade(col);
    if (unidadeNormalizada !== "un" || /^(un|und|unid|unidade)$/i.test(col)) {
      colunasUnidade.push({ indice: i, valor: unidadeNormalizada });
      continue;
    }

    // É um número puro (quantidade)?
    const numPuro = parseFloat(col.replace(",", "."));
    if (!isNaN(numPuro) && numPuro > 0 && numPuro < 10000) {
      colunasNumero.push({ indice: i, valor: numPuro });
      continue;
    }

    // É texto (possível nome ou categoria)
    if (col.length > 1) {
      colunasTexto.push({ indice: i, valor: col });
    }
  }

  // Atribuir valores encontrados
  if (colunasPreco.length > 0) preco = colunasPreco[0].valor;
  if (colunasUnidade.length > 0) unidade = colunasUnidade[0].valor;
  if (colunasNumero.length > 0) quantidade = colunasNumero[0].valor;

  // Lógica para nome e categoria:
  // Se tem 2+ colunas de texto, a primeira curta (<20 chars) é categoria, a segunda é nome
  // PadrÍo: [Categoria, Nome/DescriçÍo, Unidade, Preço]
  if (colunasTexto.length >= 2) {
    const primeiraColTexto = colunasTexto[0].valor;
    const segundaColTexto = colunasTexto[1].valor;

    // Se a primeira coluna é curta (provavelmente categoria) e a segunda é mais longa (descriçÍo)
    if (primeiraColTexto.length < 25 && segundaColTexto.length > primeiraColTexto.length) {
      categoriaSugerida = primeiraColTexto;
      nome = segundaColTexto;
    } else {
      // Usar a coluna mais longa como nome
      nome = colunasTexto.reduce((a, b) => a.valor.length > b.valor.length ? a : b).valor;
    }
  } else if (colunasTexto.length === 1) {
    nome = colunasTexto[0].valor;
  }

  return {
    nome: nome || linha,
    unidade,
    preco,
    quantidade,
    fonte: preco !== null ? "extraido" : "buscar",
    confianca: preco !== null ? "alta" : "baixa",
    linhaOriginal: linha,
    categoriaSugerida,
  };
}

/**
 * Processa linha no formato com preços
 */
function processarFormatoPreco(linha: string): DadosExtraidos {
  const preco = extrairPreco(linha);
  const unidade = extrairUnidade(linha);
  const quantidade = extrairQuantidade(linha);
  const nome = limparNome(linha);

  return {
    nome: nome || linha,
    unidade,
    preco,
    quantidade,
    fonte: preco !== null ? "extraido" : "buscar",
    confianca: preco !== null ? (unidade !== "un" ? "alta" : "media") : "baixa",
    linhaOriginal: linha,
  };
}

/**
 * Processa linha no formato pipe (tabular)
 */
function processarFormatoPipe(linha: string): DadosExtraidos {
  // Converter pipes em tabs e usar o mesmo processamento
  const linhaTab = linha.replace(/\|/g, "\t");
  return processarFormatoTab(linhaTab);
}

/**
 * Processa linha com múltiplos espaços como separador
 * Ex: "Pintura de paredes   m²   R$ 16,00"
 */
function processarFormatoEspacos(linha: string): DadosExtraidos {
  // Converter múltiplos espaços (3+) em TAB e usar o mesmo processamento
  const linhaTab = linha.replace(/\s{3,}/g, "\t");
  return processarFormatoTab(linhaTab);
}

/**
 * Processa linha simples (só nome)
 */
function processarFormatoSimples(linha: string): DadosExtraidos {
  return {
    nome: linha.trim(),
    unidade: "un",
    preco: null,
    quantidade: null,
    fonte: "buscar",
    confianca: "baixa",
    linhaOriginal: linha,
  };
}

/**
 * FunçÍo principal: processa uma linha de texto e extrai dados
 */
export function parseLinhaInteligente(linha: string): DadosExtraidos {
  const linhaLimpa = linha.trim();

  if (!linhaLimpa || linhaLimpa.length < 3) {
    return {
      nome: linhaLimpa,
      unidade: "un",
      preco: null,
      quantidade: null,
      fonte: "buscar",
      confianca: "baixa",
      linhaOriginal: linha,
    };
  }

  const formato = detectarFormato(linhaLimpa);

  switch (formato) {
    case "tab":
      return processarFormatoTab(linhaLimpa);
    case "pipe":
      return processarFormatoPipe(linhaLimpa);
    case "espacos":
      return processarFormatoEspacos(linhaLimpa);
    case "preco":
      return processarFormatoPreco(linhaLimpa);
    default:
      return processarFormatoSimples(linhaLimpa);
  }
}

/**
 * Processa múltiplas linhas de texto
 */
export function parseTextoCompleto(texto: string): DadosExtraidos[] {
  const linhas = texto
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 2);

  return linhas.map(parseLinhaInteligente);
}

/**
 * Estatísticas do parsing
 */
export function calcularEstatisticasParsing(dados: DadosExtraidos[]): {
  total: number;
  comPreco: number;
  semPreco: number;
  confiancaAlta: number;
  confiancaMedia: number;
  confiancaBaixa: number;
} {
  return {
    total: dados.length,
    comPreco: dados.filter(d => d.preco !== null).length,
    semPreco: dados.filter(d => d.preco === null).length,
    confiancaAlta: dados.filter(d => d.confianca === "alta").length,
    confiancaMedia: dados.filter(d => d.confianca === "media").length,
    confiancaBaixa: dados.filter(d => d.confianca === "baixa").length,
  };
}
/* eslint-disable no-useless-escape */


