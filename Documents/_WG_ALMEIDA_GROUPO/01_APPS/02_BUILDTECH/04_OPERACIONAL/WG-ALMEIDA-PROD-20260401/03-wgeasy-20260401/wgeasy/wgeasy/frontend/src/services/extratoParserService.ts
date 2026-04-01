// ========================================
// SERVIÇO DE PARSING DE EXTRATOS BANCÁRIOS
// Suporta: PDF, Excel (xlsx/xls), CSV, OFX
// ========================================

const loadXLSX = () => import("../lib/xlsxCompat");

// ConfiguraçÍo do backend
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
const INTERNAL_API_KEY = import.meta.env.VITE_INTERNAL_API_KEY || "";

// Tipos minimais para representar células/linhas de uma planilha Excel
type ExcelCell = string | number | boolean | null;
type ExcelRow = ExcelCell[];
type ExcelTable = ExcelRow[];

export interface LinhaExtrato {
  data: string;
  descricao: string;
  valor: number;
  tipo: "entrada" | "saida";
  saldo?: number;
  documento?: string;
  categoria_nome?: string;
  centro_custo_nome?: string;
  nucleo?: string;
  projeto_nome?: string;
  contrato?: string;
  pessoa_nome?: string;
  status_lancamento?: string;
  forma_pagamento?: string;
  conta_nome?: string;
  parcela?: string;
  data_vencimento?: string;
  data_pagamento?: string;
  observacoes?: string;
  raw?: string; // linha original para debug
}

export interface ResultadoParsing {
  sucesso: boolean;
  linhas: LinhaExtrato[];
  erros: string[];
  tipoArquivo: string;
  totalLinhas: number;
  dataInicio?: string;
  dataFim?: string;
}

// ========================================
// PARSER PRINCIPAL
// ========================================
export async function parseExtrato(file: File): Promise<ResultadoParsing> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "csv":
      return parseCSV(file);
    case "xlsx":
    case "xls":
      return parseExcel(file);
    case "ofx":
      return parseOFX(file);
    case "pdf":
      return parsePDF(file);
    default:
      return {
        sucesso: false,
        linhas: [],
        erros: [`Formato nÍo suportado: ${extension}`],
        tipoArquivo: extension || "desconhecido",
        totalLinhas: 0,
      };
  }
}

// ========================================
// PARSER CSV
// ========================================
async function parseCSV(file: File): Promise<ResultadoParsing> {
  const text = await file.text();
  const lines = text.split("\n").filter((l) => l.trim());
  const linhas: LinhaExtrato[] = [];
  const erros: string[] = [];

  // Detectar separador (vírgula, ponto-e-vírgula, tab)
  const separator = detectSeparator(lines[0]);
  const headerRaw = lines[0];
  const headers = headerRaw
    .split(separator)
    .map((c) => normalizeHeader(c));

  const columnIndex = (name: string) => headers.indexOf(name);

  // Pular cabeçalho
  const dataLines = lines.slice(1);

  for (let i = 0; i < dataLines.length; i++) {
    try {
      const cols = dataLines[i]
        .split(separator)
        .map((c) => c.trim().replace(/^"|"$/g, ""));

      if (cols.length < 3) continue;

      const getCol = (name: string) => {
        const idx = columnIndex(name);
        return idx >= 0 ? cols[idx] || "" : "";
      };

      const data = parseDataBrasileira(getCol("data")) || null;
      const descricao = getCol("descricao") || getCol("historico");
      const valorStr = getCol("valor");
      const tipoCol = (getCol("tipo") || "").toLowerCase();
      const parsedValor = parseValorBrasileiro(valorStr);
      const valor = parsedValor !== null ? Math.abs(parsedValor) : null;
      const tipo: "entrada" | "saida" = tipoCol.includes("entrada")
        ? "entrada"
        : tipoCol.includes("receb")
          ? "entrada"
          : tipoCol.includes("cred")
            ? "entrada"
            : parsedValor !== null && parsedValor >= 0
              ? "entrada"
              : "saida";

      const linhaBase: Partial<LinhaExtrato> = {
        categoria_nome: getCol("categoria") || undefined,
        centro_custo_nome: getCol("centro_custo") || undefined,
        nucleo: getCol("nucleo") || undefined,
        projeto_nome: getCol("projeto") || undefined,
        contrato: getCol("contrato") || undefined,
        pessoa_nome: getCol("pessoa") || getCol("favorecido") || undefined,
        status_lancamento: getCol("status") || undefined,
        forma_pagamento: getCol("forma_pagamento") || undefined,
        conta_nome: getCol("conta_bancaria") || getCol("conta") || undefined,
        documento: getCol("documento") || undefined,
        parcela: getCol("parcela") || undefined,
        data_vencimento: parseDataBrasileira(getCol("data_vencimento")) || undefined,
        data_pagamento: parseDataBrasileira(getCol("data_pagamento")) || undefined,
        observacoes: getCol("observacoes") || undefined,
        raw: cols.join(" | "),
      };

      let linha: LinhaExtrato | null = null;

      if (data && descricao && valor !== null) {
        linha = {
          data,
          descricao,
          valor,
          tipo,
          ...linhaBase,
        };
      } else {
        const linhaGenerica = parseLinhaGenerica(cols);
        if (linhaGenerica) {
          linha = { ...linhaGenerica, ...linhaBase };
        }
      }

      if (linha) {
        linhas.push(linha);
      }
    } catch (error) {
      erros.push(`Linha ${i + 2}: ${formatError(error)}`);
    }
  }

  return {
    sucesso: linhas.length > 0,
    linhas,
    erros,
    tipoArquivo: "csv",
    totalLinhas: dataLines.length,
    dataInicio: linhas[0]?.data,
    dataFim: linhas[linhas.length - 1]?.data,
  };
}

// ========================================
// PARSER EXCEL
// ========================================
async function parseExcel(file: File): Promise<ResultadoParsing> {
  const XLSX = await loadXLSX();
  const buffer = await file.arrayBuffer();
  const workbook = await XLSX.read(buffer, {
    type: "array",
  });

  if (!workbook || !Array.isArray(workbook.SheetNames) || workbook.SheetNames.length === 0) {
    return {
      sucesso: false,
      linhas: [],
      erros: ["Arquivo Excel nÍo possui planilhas ou está corrompido"],
      tipoArquivo: "excel",
      totalLinhas: 0,
    };
  }
  const linhas: LinhaExtrato[] = [];
  const erros: string[] = [];

  // Pegar primeira planilha
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    return {
      sucesso: false,
      linhas: [],
      erros: ["Planilha vazia ou nÍo encontrada"],
      tipoArquivo: "excel",
      totalLinhas: 0,
    };
  }

  // Converter para JSON - tentar diferentes métodos
  let data: ExcelTable = [];

  try {
    // Primeiro, tentar com raw: false para obter valores formatados
    data = XLSX.utils.sheet_to_json<ExcelCell[]>(sheet, {
      header: 1,
      raw: false,
      defval: "",
    });
  } catch {
    try {
      // Fallback: tentar com raw: true
      data = XLSX.utils.sheet_to_json<ExcelCell[]>(sheet, {
        header: 1,
        raw: true,
        defval: "",
      });
    } catch (e2) {
      return {
        sucesso: false,
        linhas: [],
        erros: [`Erro ao ler planilha: ${formatError(e2)}`],
        tipoArquivo: "excel",
        totalLinhas: 0,
      };
    }
  }

  if (!data || data.length === 0) {
    return {
      sucesso: false,
      linhas: [],
      erros: ["Planilha nÍo contém dados"],
      tipoArquivo: "excel",
      totalLinhas: 0,
    };
  }

  // Log para debug - primeiras linhas
  console.log("Primeiras 5 linhas da planilha:", data.slice(0, 5));

  // Detectar estrutura da planilha - encontrar cabeçalho e início dos dados
  const { headerRow, dataStartRow, columnMap } = detectExcelStructure(data);

  console.log("Estrutura detectada:", { headerRow, dataStartRow, columnMap });

  // Processar linhas de dados
  for (let i = dataStartRow; i < data.length; i++) {
    try {
      const row = data[i] as ExcelRow;
      if (!row || row.every((cell) => !cell || String(cell).trim() === ""))
        continue;

      const linha = parseLinhaExcelInteligente(row, columnMap);
      if (linha) {
        linhas.push(linha);
      }
    } catch (error) {
      erros.push(`Linha ${i + 1}: ${formatError(error)}`);
    }
  }

  // Se nÍo conseguiu com mapeamento, tentar método genérico
  if (linhas.length === 0) {
    console.log("Tentando método genérico de parsing...");
    for (let i = 0; i < data.length; i++) {
      try {
        const row = data[i] as ExcelRow;
        if (!row || row.length < 2) continue;

        const linha = parseLinhaExcel(row);
        if (linha) {
          linhas.push(linha);
        }
      } catch {
        // Silenciar erros do método genérico
      }
    }
  }

  if (linhas.length === 0) {
    erros.push("NÍo foi possível identificar transações na planilha.");
    erros.push(
      "Verifique se o arquivo contém colunas de Data, DescriçÍo e Valor."
    );
    erros.push(
      "Formatos esperados: Data (DD/MM/AAAA), Valor (1.234,56 ou -1.234,56)"
    );
  }

  return {
    sucesso: linhas.length > 0,
    linhas,
    erros,
    tipoArquivo: "excel",
    totalLinhas: data.length - dataStartRow,
    dataInicio: linhas[0]?.data,
    dataFim: linhas[linhas.length - 1]?.data,
  };
}

// Detectar estrutura da planilha Excel
function detectExcelStructure(data: ExcelTable): {
  headerRow: number;
  dataStartRow: number;
  columnMap: ColumnMap;
} {
  const columnMap: ColumnMap = {
    data: -1,
    descricao: -1,
    valor: -1,
    debito: -1,
    credito: -1,
    saldo: -1,
    tipo: -1,
    nucleo: -1,
    categoria: -1,
    projeto: -1,
    contrato: -1,
    pessoa: -1,
    status: -1,
    forma_pagamento: -1,
    conta: -1,
    documento: -1,
    centro_custo: -1,
    parcela: -1,
    data_vencimento: -1,
    data_pagamento: -1,
    observacoes: -1,
  };
  let headerRow = -1;
  let dataStartRow = 0;

  // Palavras-chave para identificar colunas
  const keywords = {
    data: [
      "data",
      "date",
      "dt",
      "dia",
      "lançamento",
      "lancamento",
      "movimento",
    ],
    data_vencimento: [
      "data_vencimento",
      "data vencimento",
      "vencimento",
      "dt_venc",
    ],
    data_pagamento: [
      "data_pagamento",
      "data pagamento",
      "pagamento",
      "dt_pag",
    ],
    descricao: [
      "descriçÍo",
      "descricao",
      "historico",
      "histórico",
      "memo",
      "descrip",
      "lançamento",
      "lancamento",
      "transaçÍo",
      "transacao",
    ],
    valor: ["valor", "value", "quantia", "amount", "vlr"],
    debito: ["débito", "debito", "saída", "saida", "debit", "deb", "d"],
    credito: ["crédito", "credito", "entrada", "credit", "cred", "c"],
    saldo: ["saldo", "balance", "acumulado"],
    tipo: ["tipo", "tipo_lancamento", "tipo lancamento"],
    nucleo: ["nucleo", "núcleo"],
    categoria: ["categoria", "cat"],
    projeto: ["projeto", "obra"],
    contrato: ["contrato", "ct"],
    pessoa: ["pessoa", "favorecido", "cliente", "fornecedor"],
    status: ["status", "situaçÍo", "situacao"],
    forma_pagamento: ["forma_pagamento", "forma pagamento", "meio_pagamento", "meio pagamento"],
    conta: ["conta_bancaria", "conta bancaria", "conta", "banco", "agencia"],
    documento: ["documento", "cpf", "cnpj", "doc"],
    centro_custo: ["centro_custo", "centro custo", "cc"],
    parcela: ["parcela", "parcelamento"],
    observacoes: ["observacao", "observações", "observacao", "obs"],
  };

  // Procurar linha de cabeçalho nas primeiras 15 linhas
  for (let i = 0; i < Math.min(15, data.length); i++) {
    const row = data[i];
    if (!row) continue;

    let matchCount = 0;
    for (let j = 0; j < row.length; j++) {
      const cell = String(row[j] || "")
        .toLowerCase()
        .trim();

      const isDataVencimento = keywords.data_vencimento.some((k) => cell.includes(k));
      const isDataPagamento = keywords.data_pagamento.some((k) => cell.includes(k));
      const isData = keywords.data.some((k) => cell.includes(k)) && !isDataVencimento && !isDataPagamento;

      if (columnMap.data === -1 && isData) {
        columnMap.data = j;
        matchCount++;
      }
      if (columnMap.data_vencimento === -1 && isDataVencimento) {
        columnMap.data_vencimento = j;
      }
      if (columnMap.data_pagamento === -1 && isDataPagamento) {
        columnMap.data_pagamento = j;
      }
      if (keywords.descricao.some((k) => cell.includes(k))) {
        if (columnMap.descricao === -1) {
          columnMap.descricao = j;
          matchCount++;
        }
      }
      if (
        keywords.valor.some((k) => cell.includes(k)) &&
        !keywords.debito.some((k) => cell.includes(k)) &&
        !keywords.credito.some((k) => cell.includes(k))
      ) {
        if (columnMap.valor === -1) {
          columnMap.valor = j;
          matchCount++;
        }
      }
      if (keywords.debito.some((k) => cell.includes(k) || cell === k)) {
        if (columnMap.debito === -1) {
          columnMap.debito = j;
          matchCount++;
        }
      }
      if (keywords.credito.some((k) => cell.includes(k) || cell === k)) {
        if (columnMap.credito === -1) {
          columnMap.credito = j;
          matchCount++;
        }
      }
      if (keywords.saldo.some((k) => cell.includes(k))) {
        if (columnMap.saldo === -1) {
          columnMap.saldo = j;
          matchCount++;
        }
      }

      if (columnMap.tipo === -1 && keywords.tipo.some((k) => cell.includes(k))) {
        columnMap.tipo = j;
      }
      if (columnMap.nucleo === -1 && keywords.nucleo.some((k) => cell.includes(k))) {
        columnMap.nucleo = j;
      }
      if (columnMap.categoria === -1 && keywords.categoria.some((k) => cell.includes(k))) {
        columnMap.categoria = j;
      }
      if (columnMap.projeto === -1 && keywords.projeto.some((k) => cell.includes(k))) {
        columnMap.projeto = j;
      }
      if (columnMap.contrato === -1 && keywords.contrato.some((k) => cell.includes(k))) {
        columnMap.contrato = j;
      }
      if (columnMap.pessoa === -1 && keywords.pessoa.some((k) => cell.includes(k))) {
        columnMap.pessoa = j;
      }
      if (columnMap.status === -1 && keywords.status.some((k) => cell.includes(k))) {
        columnMap.status = j;
      }
      if (columnMap.forma_pagamento === -1 && keywords.forma_pagamento.some((k) => cell.includes(k))) {
        columnMap.forma_pagamento = j;
      }
      if (columnMap.conta === -1 && keywords.conta.some((k) => cell.includes(k))) {
        columnMap.conta = j;
      }
      if (columnMap.documento === -1 && keywords.documento.some((k) => cell.includes(k))) {
        columnMap.documento = j;
      }
      if (columnMap.centro_custo === -1 && keywords.centro_custo.some((k) => cell.includes(k))) {
        columnMap.centro_custo = j;
      }
      if (columnMap.parcela === -1 && keywords.parcela.some((k) => cell.includes(k))) {
        columnMap.parcela = j;
      }
      if (columnMap.observacoes === -1 && keywords.observacoes.some((k) => cell.includes(k))) {
        columnMap.observacoes = j;
      }
    }

    if (matchCount >= 2) {
      headerRow = i;
      dataStartRow = i + 1;
      break;
    }
  }

  // Se nÍo encontrou cabeçalho, procurar primeira linha com data
  if (headerRow === -1) {
    for (let i = 0; i < Math.min(20, data.length); i++) {
      const row = data[i];
      if (row && hasDateLikeValue(row)) {
        dataStartRow = i;
        // Assumir estrutura padrÍo: Data, DescriçÍo, Valor
        if (row.length >= 3) {
          for (let j = 0; j < row.length; j++) {
            const cell = String(row[j] || "");
            if (columnMap.data === -1 && parseDataBrasileira(cell)) {
              columnMap.data = j;
            } else if (
              columnMap.valor === -1 &&
              parseValorBrasileiro(cell) !== null
            ) {
              columnMap.valor = j;
            }
          }
          // DescriçÍo é a coluna mais longa que nÍo é data nem valor
          let maxLen = 0;
          for (let j = 0; j < row.length; j++) {
            const cell = String(row[j] || "");
            if (
              j !== columnMap.data &&
              j !== columnMap.valor &&
              cell.length > maxLen
            ) {
              maxLen = cell.length;
              columnMap.descricao = j;
            }
          }
        }
        break;
      }
    }
  }

  return { headerRow, dataStartRow, columnMap };
}

interface ColumnMap {
  data: number;
  descricao: number;
  valor: number;
  debito: number;
  credito: number;
  saldo: number;
  tipo: number;
  nucleo: number;
  categoria: number;
  projeto: number;
  contrato: number;
  pessoa: number;
  status: number;
  forma_pagamento: number;
  conta: number;
  documento: number;
  centro_custo: number;
  parcela: number;
  data_vencimento: number;
  data_pagamento: number;
  observacoes: number;
}

// Extrair valor de célula Excel (pode ser número ou string formatada)
function extractExcelValue(cell: ExcelCell): number | null {
  if (cell === null || cell === undefined || cell === "") return null;

  // Se já é número, retornar diretamente
  if (typeof cell === "number") {
    return cell;
  }

  // Se é string, usar o parser brasileiro
  return parseValorBrasileiro(String(cell));
}

// Parser inteligente usando mapeamento de colunas
function parseLinhaExcelInteligente(
  row: ExcelRow,
  columnMap: ColumnMap
): LinhaExtrato | null {
  let data: string | null = null;
  let descricao = "";
  let valor: number | null = null;
  let tipo: "entrada" | "saida" = "saida";
  let tipoFromColumn: "entrada" | "saida" | null = null;

  const getCell = (idx: number) => (idx >= 0 ? row[idx] : null);
  const asString = (value: ExcelCell) => String(value ?? "").trim();
  const asOptionalString = (value: ExcelCell) => {
    const str = asString(value);
    return str ? str : undefined;
  };

  // Extrair data
  if (columnMap.data >= 0 && getCell(columnMap.data)) {
    data = parseDataBrasileira(asString(getCell(columnMap.data)));
  }

  // Extrair descriçÍo
  if (columnMap.descricao >= 0 && getCell(columnMap.descricao)) {
    descricao = asString(getCell(columnMap.descricao));
  }

  // Tipo explícito (template)
  if (columnMap.tipo >= 0 && getCell(columnMap.tipo)) {
    const tipoCell = asString(getCell(columnMap.tipo)).toLowerCase();
    if (tipoCell.includes("entrada") || tipoCell.includes("receita") || tipoCell.includes("credito") || tipoCell.includes("credit")) {
      tipoFromColumn = "entrada";
    }
    if (tipoCell.includes("saida") || tipoCell.includes("despesa") || tipoCell.includes("debito") || tipoCell.includes("debit")) {
      tipoFromColumn = "saida";
    }
  }

  // Extrair valor - priorizar colunas separadas de débito/crédito
  if (columnMap.debito >= 0 || columnMap.credito >= 0) {
    const debitoCell = columnMap.debito >= 0 ? getCell(columnMap.debito) : null;
    const creditoCell = columnMap.credito >= 0 ? getCell(columnMap.credito) : null;

    const debito = extractExcelValue(debitoCell);
    const credito = extractExcelValue(creditoCell);

    if (debito !== null && Math.abs(debito) > 0) {
      valor = Math.abs(debito);
      tipo = "saida";
    } else if (credito !== null && Math.abs(credito) > 0) {
      valor = Math.abs(credito);
      tipo = "entrada";
    }
  }

  // Se nÍo tem débito/crédito separado, usar coluna valor
  if (valor === null && columnMap.valor >= 0 && getCell(columnMap.valor)) {
    const valorCell = getCell(columnMap.valor);
    const parsedValor = extractExcelValue(valorCell);
    if (parsedValor !== null) {
      valor = Math.abs(parsedValor);
      tipo = parsedValor >= 0 ? "entrada" : "saida";
    }
  }

  if (tipoFromColumn) {
    tipo = tipoFromColumn;
  }

  // Fallback: procurar data e valor em qualquer coluna
  if (!data || valor === null) {
    for (let i = 0; i < row.length; i++) {
      const cell = row[i];
      if (cell === null || cell === undefined || cell === "") continue;

      const cellStr = String(cell).trim();

      if (!data) {
        const parsedDate = parseDataBrasileira(cellStr);
        if (parsedDate) {
          data = parsedDate;
          continue;
        }
      }

      if (valor === null) {
        const parsedValor = extractExcelValue(cell);
        if (parsedValor !== null && Math.abs(parsedValor) > 0.01) {
          valor = Math.abs(parsedValor);
          tipo = parsedValor >= 0 ? "entrada" : "saida";
        }
      }
    }
  }

  // Fallback descriçÍo: pegar a coluna de texto mais longa
  if (!descricao) {
    let maxLen = 0;
    for (let i = 0; i < row.length; i++) {
      const cell = String(row[i] || "").trim();
      if (
        cell.length > maxLen &&
        !parseDataBrasileira(cell) &&
        parseValorBrasileiro(cell) === null
      ) {
        maxLen = cell.length;
        descricao = cell;
      }
    }
  }

  // Validar linha
  if (data && valor !== null && valor > 0) {
    const dataVencimento = columnMap.data_vencimento >= 0
      ? parseDataBrasileira(asString(getCell(columnMap.data_vencimento)))
      : null;
    const dataPagamento = columnMap.data_pagamento >= 0
      ? parseDataBrasileira(asString(getCell(columnMap.data_pagamento)))
      : null;

    const linhaBase: Partial<LinhaExtrato> = {
      categoria_nome: columnMap.categoria >= 0 ? asOptionalString(getCell(columnMap.categoria)) : undefined,
      centro_custo_nome: columnMap.centro_custo >= 0 ? asOptionalString(getCell(columnMap.centro_custo)) : undefined,
      nucleo: columnMap.nucleo >= 0 ? asOptionalString(getCell(columnMap.nucleo)) : undefined,
      projeto_nome: columnMap.projeto >= 0 ? asOptionalString(getCell(columnMap.projeto)) : undefined,
      contrato: columnMap.contrato >= 0 ? asOptionalString(getCell(columnMap.contrato)) : undefined,
      pessoa_nome: columnMap.pessoa >= 0 ? asOptionalString(getCell(columnMap.pessoa)) : undefined,
      status_lancamento: columnMap.status >= 0 ? asOptionalString(getCell(columnMap.status)) : undefined,
      forma_pagamento: columnMap.forma_pagamento >= 0 ? asOptionalString(getCell(columnMap.forma_pagamento)) : undefined,
      conta_nome: columnMap.conta >= 0 ? asOptionalString(getCell(columnMap.conta)) : undefined,
      documento: columnMap.documento >= 0 ? asOptionalString(getCell(columnMap.documento)) : undefined,
      parcela: columnMap.parcela >= 0 ? asOptionalString(getCell(columnMap.parcela)) : undefined,
      data_vencimento: dataVencimento || undefined,
      data_pagamento: dataPagamento || undefined,
      observacoes: columnMap.observacoes >= 0 ? asOptionalString(getCell(columnMap.observacoes)) : undefined,
    };

    // Log para debug de valores suspeitos (muito grandes ou muito pequenos)
    if (valor > 100000 || valor < 0.01) {
      console.warn("[Parser] Valor suspeito detectado:", {
        valorFinal: valor,
        tipo,
        descricao: descricao.substring(0, 50),
        row: row.map(c => typeof c === 'number' ? `NUM:${c}` : String(c).substring(0, 20)),
      });
    }

    return {
      data,
      descricao: descricao || "Sem descriçÍo",
      valor,
      tipo,
      ...linhaBase,
      raw: row.join(" | "),
    };
  }

  return null;
}

// ========================================
// PARSER OFX (Open Financial Exchange)
// ========================================
async function parseOFX(file: File): Promise<ResultadoParsing> {
  const text = await file.text();
  const linhas: LinhaExtrato[] = [];
  const erros: string[] = [];

  // Extrair transações do OFX
  const transacoes = text.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) || [];

  for (const trn of transacoes) {
    try {
      const data = extractOFXTag(trn, "DTPOSTED")?.substring(0, 8);
      const valor = parseFloat(extractOFXTag(trn, "TRNAMT") || "0");
      const descricao =
        extractOFXTag(trn, "MEMO") || extractOFXTag(trn, "NAME") || "";

      if (data && valor !== 0) {
        linhas.push({
          data: formatOFXDate(data),
          descricao: descricao.trim(),
          valor: Math.abs(valor),
          tipo: valor >= 0 ? "entrada" : "saida",
        });
      }
    } catch (error) {
      erros.push(`TransaçÍo: ${formatError(error)}`);
    }
  }

  return {
    sucesso: linhas.length > 0,
    linhas,
    erros,
    tipoArquivo: "ofx",
    totalLinhas: transacoes.length,
    dataInicio: linhas[0]?.data,
    dataFim: linhas[linhas.length - 1]?.data,
  };
}

// ========================================
// PARSER PDF (com IA Vision)
// Converte páginas em imagens e usa GPT-4o para extrair dados
// ========================================
async function parsePDF(file: File): Promise<ResultadoParsing> {
  const linhas: LinhaExtrato[] = [];
  const erros: string[] = [];

  try {
    // Importar pdf.js
    const pdfjsLib = await import("pdfjs-dist");

    // Configurar worker da própria lib (evita mismatch de versÍo)
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

    // Carregar PDF
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    console.log(`[PDF Parser] PDF carregado: ${pdf.numPages} páginas`);

    // Processar cada página (máximo 10 páginas para nÍo estourar limites)
    const maxPages = Math.min(pdf.numPages, 10);
    const paginasBase64: string[] = [];

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const scale = 2; // Escala para melhor qualidade
        const viewport = page.getViewport({ scale });

        // Criar canvas
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
          erros.push(`Página ${pageNum}: Erro ao criar canvas`);
          continue;
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Renderizar página
        const renderTask = page.render({
          canvas,
          canvasContext: context,
          viewport,
        });
        await renderTask.promise;

        // Converter para base64 (JPEG para menor tamanho)
        const base64 = canvas.toDataURL("image/jpeg", 0.8);
        paginasBase64.push(base64);

        console.log(`[PDF Parser] Página ${pageNum} renderizada`);
      } catch (pageError) {
        erros.push(`Página ${pageNum}: ${formatError(pageError)}`);
      }
    }

    if (paginasBase64.length === 0) {
      return {
        sucesso: false,
        linhas: [],
        erros: ["NÍo foi possível renderizar nenhuma página do PDF"],
        tipoArquivo: "pdf",
        totalLinhas: 0,
      };
    }

    // Enviar para IA Vision extrair dados
    console.log(
      `[PDF Parser] Enviando ${paginasBase64.length} páginas para IA...`
    );
    const linhasExtraidas = await extrairDadosPDFComIA(paginasBase64);

    if (linhasExtraidas.length > 0) {
      linhas.push(...linhasExtraidas);
    } else {
      erros.push("A IA nÍo conseguiu extrair transações do PDF.");
      erros.push("Verifique se o PDF contém um extrato bancário legível.");
    }

    return {
      sucesso: linhas.length > 0,
      linhas,
      erros,
      tipoArquivo: "pdf",
      totalLinhas: linhas.length,
      dataInicio: linhas[0]?.data,
      dataFim: linhas[linhas.length - 1]?.data,
    };
  } catch (error) {
    console.error("[PDF Parser] Erro:", error);
    return {
      sucesso: false,
      linhas: [],
      erros: [
        `Erro ao processar PDF: ${formatError(error)}`,
        "Tente exportar o extrato em formato Excel ou CSV.",
      ],
      tipoArquivo: "pdf",
      totalLinhas: 0,
    };
  }
}

// ========================================
// EXTRAIR DADOS DO PDF COM IA VISION
// ========================================
async function extrairDadosPDFComIA(
  paginasBase64: string[]
): Promise<LinhaExtrato[]> {
  // Usar backend proxy para nÍo expor API key no frontend
  if (!INTERNAL_API_KEY) {
    console.error("[PDF Parser] VITE_INTERNAL_API_KEY nÍo configurada");
    return [];
  }

  const linhas: LinhaExtrato[] = [];

// Prompt otimizado para extratos bancários brasileiros (BTG, Itaú, Bradesco, etc)
  const prompt = `Você é um especialista em extrair dados de extratos bancários brasileiros.

Analise as imagens do extrato bancário e extraia TODAS as transações encontradas.

Para CADA transaçÍo, extraia os seguintes campos:
- data: Data da transaçÍo (formato YYYY-MM-DD)
- descricao: DescriçÍo completa da transaçÍo
- valor: Valor da transaçÍo (número positivo, sem R$)
- tipo: "entrada" para créditos/depósitos/recebimentos, "saida" para débitos/pagamentos/transferências enviadas
- favorecido: Nome da pessoa/empresa envolvida (quando identificável na descriçÍo)
- documento: CPF/CNPJ do favorecido (se visível)
- centro_custo_nome (opcional): nome do cliente/obra que deve ser tratado como centro de custo

REGRAS DE EXTRAÇÍO:
1. EXTRAIA TODAS as transações visíveis, linha por linha
2. Use valores ABSOLUTOS (sempre positivos, sem sinal)
3. Identifique entrada/saída por:
   - Crédito, C, +, Depósito, Recebido, TED Recebida, PIX Recebido = "entrada"
   - Débito, D, -, Pagamento, Transferência, TED Enviada, PIX Enviado = "saida"
4. EXTRAIA o favorecido da descriçÍo:
   - "PIX ENVIADO - JOAO SILVA" → favorecido: "JOAO SILVA"
   - "TED PARA MARIA SANTOS CPF 123.456.789-00" → favorecido: "MARIA SANTOS", documento: "12345678900"
   - "PAGTO BOLETO CEMIG" → favorecido: "CEMIG"
   - Regra especial PIX RECEBIDO: se a descriçÍo for "PIX RECEBIDO de FULANO" (ou variações), trate "FULANO" como centro_custo_nome e deixe favorecido vazio/null
   - Regra especial PIX ENVIADO: "PIX ENVIADO para FULANO" → favorecido = "FULANO" (centro_custo_nome vazio)
   - Regra especial OBRA: se a descriçÍo contiver "obra FULANO" ou "ref. obra FULANO", extraia centro_custo_nome = "FULANO" (cliente/obra), mesmo que também exista um favorecido
5. Ignore linhas de: saldo, cabeçalhos, totais, rodapés
6. Para transações de IMPOSTOS/TAXAS (DARF, GPS, DAS): extraia o tipo de imposto como parte da descriçÍo

FORMATO DE RESPOSTA - Retorne APENAS um array JSON válido:
[
  {"data": "2026-01-15", "descricao": "PIX RECEBIDO FULANO DE TAL", "valor": 1500.00, "tipo": "entrada", "favorecido": null, "centro_custo_nome": "FULANO DE TAL", "documento": null},
  {"data": "2026-01-16", "descricao": "PAGTO BOLETO CEMIG ENERGIA", "valor": 250.50, "tipo": "saida", "favorecido": "CEMIG", "documento": null},
  {"data": "2026-01-17", "descricao": "TED ENVIADA FORNECEDOR LTDA CNPJ 12.345.678/0001-90", "valor": 5000.00, "tipo": "saida", "favorecido": "FORNECEDOR LTDA", "documento": "12345678000190"}
]

Se nÍo encontrar transações válidas, retorne: []`;

  try {
    const response = await fetch(`${BACKEND_URL}/api/openai/vision`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-key": INTERNAL_API_KEY,
      },
      body: JSON.stringify({
        images: paginasBase64,
        prompt: prompt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[PDF Parser] Erro backend:", errorText);
      return [];
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || data.content || data.text || "[]";

    console.log("[PDF Parser] Resposta da IA (primeiros 500 chars):", responseText.substring(0, 500));

    // Tentar extrair JSON da resposta de várias formas
    let transacoes: Array<Record<string, unknown>> = [];

    // 1. Tentar parse direto (caso já seja JSON puro)
    try {
      const parsed = JSON.parse(responseText);
      if (Array.isArray(parsed)) {
        transacoes = parsed;
      }
    } catch {
      // NÍo é JSON puro, tentar extrair
    }

    if (transacoes.length === 0) {
      // 2. Extrair array JSON da resposta (pode estar entre texto)
      const jsonMatch = responseText.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        try {
          transacoes = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error("[PDF Parser] Erro ao parsear JSON extraído:", e);
        }
      }
    }

    if (transacoes.length === 0) {
      // 3. Tentar extrair de bloco markdown ```json ... ```
      const markdownMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (markdownMatch) {
        try {
          transacoes = JSON.parse(markdownMatch[1].trim());
        } catch (e) {
          console.error("[PDF Parser] Erro ao parsear JSON do markdown:", e);
        }
      }
    }

    if (transacoes.length === 0) {
      console.error("[PDF Parser] NÍo encontrou JSON válido na resposta. Resposta completa:", responseText);
      return [];
    }

    console.log(`[PDF Parser] ${transacoes.length} transações encontradas na resposta`);

    for (const t of transacoes) {
      if (t.data && t.descricao && t.valor !== undefined) {
        linhas.push({
          data: String(t.data),
          descricao: String(t.descricao).trim(),
          valor: Math.abs(parseFloat(String(t.valor))),
          tipo: t.tipo === "entrada" ? "entrada" : "saida",
          // Campos adicionais extraídos pela IA
          pessoa_nome: t.favorecido ? String(t.favorecido).trim() : undefined,
          documento: t.documento ? String(t.documento).replace(/\D/g, '') : undefined,
          raw: `[PDF] ${t.descricao}`,
        });
      }
    }

    console.log(`[PDF Parser] ${linhas.length} transações extraídas com favorecidos`);
    return linhas;
  } catch (error) {
    console.error("[PDF Parser] Erro ao chamar IA:", error);
    return [];
  }
}

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

function detectSeparator(line: string): string {
  const separators = [";", ",", "\t", "|"];
  let maxCount = 0;
  let bestSep = ",";

  for (const sep of separators) {
    const count = (
      line.match(new RegExp(sep.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ||
      []
    ).length;
    if (count > maxCount) {
      maxCount = count;
      bestSep = sep;
    }
  }

  return bestSep;
}

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function parseLinhaGenerica(cols: string[]): LinhaExtrato | null {
  // Tentar encontrar data, descriçÍo e valor nas colunas
  let data: string | null = null;
  let descricao: string | null = null;
  let valor: number | null = null;
  let tipo: "entrada" | "saida" = "saida";

  for (const col of cols) {
    // Tentar como data
    if (!data) {
      const parsedDate = parseDataBrasileira(col);
      if (parsedDate) {
        data = parsedDate;
        continue;
      }
    }

    // Tentar como valor
    if (valor === null) {
      const parsedValor = parseValorBrasileiro(col);
      if (parsedValor !== null) {
        valor = Math.abs(parsedValor);
        tipo = parsedValor >= 0 ? "entrada" : "saida";
        continue;
      }
    }

    // O resto é descriçÍo
    if (col.length > 3 && !data && valor === null) {
      descricao = col;
    }
  }

  // Se nÍo encontrou descriçÍo, pegar a coluna mais longa
  if (!descricao) {
    descricao = cols.reduce((a, b) => (a.length > b.length ? a : b), "");
  }

  if (data && descricao && valor !== null) {
    return { data, descricao, valor, tipo };
  }

  return null;
}

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function parseLinhaExcel(row: ExcelRow): LinhaExtrato | null {
  // Padrões comuns de extratos bancários
  // Coluna 0: Data | Coluna 1: DescriçÍo | Coluna 2: Valor ou Débito | Coluna 3: Crédito

  let data: string | null = null;
  let descricao = "";
  let valor: number | null = null;
  let tipo: "entrada" | "saida" = "saida";

  for (let i = 0; i < row.length; i++) {
    const cell = row[i];
    if (cell === null || cell === undefined || cell === "") continue;

    const cellStr = String(cell).trim();

    // Tentar como data
    if (!data) {
      const parsedDate = parseDataBrasileira(cellStr);
      if (parsedDate) {
        data = parsedDate;
        continue;
      }
    }

    // Tentar como valor (usar funçÍo que trata números e strings)
    const parsedValor = extractExcelValue(cell);
    if (parsedValor !== null && Math.abs(parsedValor) > 0) {
      if (valor === null) {
        valor = Math.abs(parsedValor);
        tipo = parsedValor >= 0 ? "entrada" : "saida";
      } else if (parsedValor > 0 && tipo === "saida") {
        // Se já tem valor negativo e esse é positivo, é crédito
        tipo = "entrada";
        valor = parsedValor;
      }
      continue;
    }

    // DescriçÍo (texto mais longo)
    if (cellStr.length > descricao.length && cellStr.length > 5) {
      descricao = cellStr;
    }
  }

  if (data && descricao && valor !== null && valor > 0) {
    return { data, descricao, valor, tipo };
  }

  return null;
}

function parseDataBrasileira(str: string): string | null {
  if (!str) return null;

  const trimmed = String(str).trim();

  // Padrões de data brasileira: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
  const patterns = [
    /^(\d{2})[-/.](\d{2})[-/.](\d{4})$/, // DD/MM/YYYY
    /^(\d{2})[-/.](\d{2})[-/.](\d{2})$/, // DD/MM/YY
    /^(\d{4})[-/.](\d{2})[-/.](\d{2})$/, // YYYY-MM-DD
    /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/, // D/M/YYYY
    /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})$/, // D/M/YY
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) {
      let dia, mes, ano;

      if (pattern === patterns[2]) {
        // YYYY-MM-DD
        [, ano, mes, dia] = match;
      } else {
        [, dia, mes, ano] = match;
        if (ano.length === 2) {
          ano = parseInt(ano) > 50 ? `19${ano}` : `20${ano}`;
        }
      }

      return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
    }
  }

  // Verificar se é número serial do Excel (dias desde 1900-01-01)
  const numValue = parseFloat(trimmed);
  if (!isNaN(numValue) && numValue > 30000 && numValue < 60000) {
    // É provavelmente uma data serial do Excel
    const excelDate = excelSerialToDate(numValue);
    if (excelDate) {
      return excelDate;
    }
  }

  // Tentar parse de Date do JavaScript
  const date = new Date(trimmed);
  if (
    !isNaN(date.getTime()) &&
    date.getFullYear() > 1990 &&
    date.getFullYear() < 2100
  ) {
    return date.toISOString().split("T")[0];
  }

  return null;
}

// Converter número serial do Excel para data
function excelSerialToDate(serial: number): string | null {
  // Excel conta dias desde 1900-01-01, mas com bug do ano bissexto de 1900
  // Ajustar para bug do Excel (conta 29/02/1900 que nÍo existe)
  const utcDays = Math.floor(serial - 25569); // 25569 = dias entre 1900 e 1970
  const utcValue = utcDays * 86400 * 1000;
  const date = new Date(utcValue);

  if (!isNaN(date.getTime())) {
    return date.toISOString().split("T")[0];
  }
  return null;
}

function parseValorBrasileiro(str: string): number | null {
  if (!str) return null;

  // Limpar string
  let cleaned = String(str).trim();

  // Verificar se é negativo (débito)
  // CUIDADO: nÍo usar includes("d") pois pode pegar "d" de descrições
  const isNegative =
    cleaned.startsWith("-") ||
    cleaned.endsWith("-") ||
    cleaned.includes("(") ||
    /\bD\b/.test(cleaned) || // Apenas "D" isolado (débito)
    /débito|debito/i.test(cleaned);

  // Remover caracteres nÍo numéricos exceto vírgula e ponto
  cleaned = cleaned.replace(/[^\d,.-]/g, "");

  if (!cleaned || cleaned === "-" || cleaned === "." || cleaned === ",") return null;

  // ========================================
  // DETECÇÍO INTELIGENTE DO FORMATO
  // ========================================
  // Formato Brasileiro: 1.234.567,89 (ponto = milhar, vírgula = decimal)
  // Formato Americano:  1,234,567.89 (vírgula = milhar, ponto = decimal)
  // ========================================

  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");

  // Encontrar posiçÍo do último separador
  const lastCommaPos = cleaned.lastIndexOf(",");
  const lastDotPos = cleaned.lastIndexOf(".");

  // Contar dígitos após cada separador
  const digitsAfterComma = lastCommaPos >= 0 ? cleaned.length - lastCommaPos - 1 : -1;
  const digitsAfterDot = lastDotPos >= 0 ? cleaned.length - lastDotPos - 1 : -1;

  // CASO 1: Formato brasileiro claro (1.234,56 ou 1234,56)
  // Vírgula seguida de 1-2 dígitos no final = decimal brasileiro
  if (hasComma && digitsAfterComma >= 1 && digitsAfterComma <= 2) {
    // Vírgula é decimal, pontos sÍo milhares
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  }
  // CASO 2: Formato americano claro (1,234.56)
  // Ponto seguido de 1-2 dígitos no final, com vírgula antes = americano
  else if (hasDot && hasComma && lastDotPos > lastCommaPos && digitsAfterDot >= 1 && digitsAfterDot <= 2) {
    // Ponto é decimal, vírgulas sÍo milhares
    cleaned = cleaned.replace(/,/g, "");
  }
  // CASO 3: Apenas pontos (pode ser 1.234.567 brasileiro OU 1234.56 americano)
  else if (hasDot && !hasComma) {
    // Se tem múltiplos pontos, sÍo separadores de milhar brasileiros
    const dotCount = (cleaned.match(/\./g) || []).length;
    if (dotCount > 1) {
      // Múltiplos pontos = milhares brasileiros (1.234.567 = 1234567)
      cleaned = cleaned.replace(/\./g, "");
    }
    // Se único ponto com 3+ dígitos depois, é milhar brasileiro (1.234 = 1234)
    else if (digitsAfterDot === 3) {
      cleaned = cleaned.replace(/\./g, "");
    }
    // Se único ponto com 1-2 dígitos depois, é decimal (1234.56 = 1234.56)
    // NÍo precisa fazer nada, parseFloat já entende
  }
  // CASO 4: Apenas vírgulas (pode ser 1,234,567 americano OU 1234,56 brasileiro)
  else if (hasComma && !hasDot) {
    const commaCount = (cleaned.match(/,/g) || []).length;
    // Se tem múltiplas vírgulas, sÍo separadores americanos (1,234,567)
    if (commaCount > 1) {
      cleaned = cleaned.replace(/,/g, "");
    }
    // Se única vírgula com 1-2 dígitos depois, é decimal brasileiro
    else if (digitsAfterComma >= 1 && digitsAfterComma <= 2) {
      cleaned = cleaned.replace(",", ".");
    }
    // Se única vírgula com 3 dígitos depois, é milhar americano (1,234 = 1234)
    else if (digitsAfterComma === 3) {
      cleaned = cleaned.replace(/,/g, "");
    }
  }

  const valor = parseFloat(cleaned);

  if (isNaN(valor)) return null;

  return isNegative ? -Math.abs(valor) : valor;
}

function hasDateLikeValue(row: ExcelRow): boolean {
  return row.some((cell) => {
    if (!cell) return false;
    const str = String(cell);
    return /\d{2}[-/.]\d{2}[-/.]\d{2,4}/.test(str);
  });
}

function extractOFXTag(text: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}>([^<\\s]+)`, "i");
  const match = text.match(regex);
  return match ? match[1] : null;
}

function formatOFXDate(date: string): string {
  // Formato OFX: YYYYMMDD
  if (date.length >= 8) {
    const year = date.substring(0, 4);
    const month = date.substring(4, 6);
    const day = date.substring(6, 8);
    return `${year}-${month}-${day}`;
  }
  return date;
}

// ========================================
// EXTRACAO DE FAVORECIDO E DOCUMENTO
// ========================================

// Padroes para extrair favorecido da descricao
const PADROES_FAVORECIDO = [
  // PIX enviado/recebido
  /PIX\s+(?:ENVIADO|RECEBIDO)\s+(?:DE\s+|PARA\s+)?(.+?)(?:\s+CPF|\s+CNPJ|\s+-|\s+\d{2}\/\d{2}|\s+\*|$)/i,
  /PIX\s+(.+?)\s+(?:CPF|CNPJ)\s*[:.]?\s*([\d./-]+)/i,
  /PIX\s+(?:TRANSF|TRANSFERENCIA)\s+(.+?)(?:\s+-|$)/i,

  // TED/DOC
  /(?:TED|DOC)\s+(?:PARA|DE|A)\s+(.+?)(?:\s+CPF|\s+CNPJ|\s+-|\s+AG|$)/i,
  /(?:TED|DOC)\s+(.+?)\s+(?:CPF|CNPJ)\s*[:.]?\s*([\d./-]+)/i,

  // Boleto
  /(?:PGTO\s+)?BOLETO\s+(.+?)(?:\s+-|\s+\d{5}|\s+REF|$)/i,
  /PAG\s+TITULO\s+(.+?)(?:\s+-|$)/i,

  // Transferencias gerais
  /(?:TRANSF|TRANSFERENCIA)\s+(?:PARA|DE|P\/)\s+(.+?)(?:\s+-|\s+AG|$)/i,

  // Debito automatico
  /(?:DEB|DEBITO)\s+(?:AUT|AUTO|AUTOMATICO)\s+(.+?)(?:\s+-|\s+REF|$)/i,

  // Pagamento geral
  /(?:PAGAMENTO|PGTO|PAG)\s+(?:A\s+|PARA\s+)?(.+?)(?:\s+-|\s+REF|\s+NF|$)/i,

  // Deposito
  /(?:DEPOSITO|DEP)\s+(?:DE\s+)?(.+?)(?:\s+-|\s+AG|$)/i,

  // Compra
  /COMPRA\s+(?:CARTAO\s+)?(.+?)(?:\s+-|\s+PARC|$)/i,

  // Saque
  /SAQUE\s+(?:24H\s+)?(.+?)(?:\s+-|$)/i,
];

// Padroes para extrair CPF/CNPJ
const PADROES_DOCUMENTO = [
  /CPF\s*[:.]?\s*(\d{3}\.?\d{3}\.?\d{3}-?\d{2})/i,
  /CNPJ\s*[:.]?\s*(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/i,
  // CPF ou CNPJ sem label (11 ou 14 digitos)
  /\b(\d{11})\b/,
  /\b(\d{14})\b/,
  // Formatados
  /(\d{3}\.\d{3}\.\d{3}-\d{2})/,
  /(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/,
];

/**
 * Extrai nome do favorecido da descricao da transacao
 */
export function extrairFavorecido(descricao: string): string | null {
  if (!descricao) return null;

  const descLimpa = descricao.toUpperCase().trim();

  for (const padrao of PADROES_FAVORECIDO) {
    const match = descLimpa.match(padrao);
    if (match && match[1]) {
      let nome = match[1].trim();

      // Limpar caracteres especiais no final
      nome = nome.replace(/[*\-\d/]+$/, "").trim();

      // Remover sufixos comuns de empresa
      nome = nome.replace(/\s+(LTDA|ME|EPP|EIRELI|S\/A|SA|SS)\.?$/i, "").trim();

      // Ignorar se ficou muito curto ou e apenas numero
      if (nome.length >= 3 && !/^\d+$/.test(nome)) {
        return normalizarNomeFavorecido(nome);
      }
    }
  }

  return null;
}

/**
 * Extrai CPF ou CNPJ da descricao
 */
export function extrairDocumento(descricao: string): string | null {
  if (!descricao) return null;

  for (const padrao of PADROES_DOCUMENTO) {
    const match = descricao.match(padrao);
    if (match && match[1]) {
      // Limpar formatacao
      const doc = match[1].replace(/[./-]/g, "");

      // Validar tamanho (11 = CPF, 14 = CNPJ)
      if (doc.length === 11 || doc.length === 14) {
        return doc;
      }
    }
  }

  return null;
}

/**
 * Normaliza nome do favorecido para comparacao
 */
function normalizarNomeFavorecido(nome: string): string {
  return nome
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^A-Z0-9\s]/g, " ") // Remove caracteres especiais
    .replace(/\s+/g, " ") // Normaliza espacos
    .trim();
}

/**
 * Extrai dados bancarios do cabecalho do extrato (OFX/Excel)
 */
export interface DadosBancariosExtrato {
  banco_codigo?: string;
  banco_nome?: string;
  agencia?: string;
  conta?: string;
  cnpj?: string;
}

/**
 * Extrai dados bancarios de texto OFX
 */
export function extrairDadosBancariosOFX(textoOFX: string): DadosBancariosExtrato {
  return {
    banco_codigo: extractOFXTag(textoOFX, "BANKID") || undefined,
    agencia: extractOFXTag(textoOFX, "BRANCHID") || undefined,
    conta: extractOFXTag(textoOFX, "ACCTID") || undefined,
  };
}

/**
 * Processa linhas do extrato adicionando favorecido e documento extraidos
 */
export function enriquecerLinhasComFavorecido(linhas: LinhaExtrato[]): LinhaExtrato[] {
  return linhas.map(linha => {
    // Se ja tem pessoa_nome, nao sobrescrever
    if (linha.pessoa_nome) return linha;

    const favorecido = extrairFavorecido(linha.descricao);
    const documento = extrairDocumento(linha.descricao);

    return {
      ...linha,
      pessoa_nome: favorecido || undefined,
      documento: documento || linha.documento || undefined,
    };
  });
}

// ========================================
// EXPORTAR TIPOS
// ========================================

