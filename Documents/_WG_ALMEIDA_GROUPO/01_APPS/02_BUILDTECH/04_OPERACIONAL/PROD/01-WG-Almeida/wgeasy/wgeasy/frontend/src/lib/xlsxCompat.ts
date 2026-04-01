// Wrapper de compatibilidade: xlsx -> exceljs
// Mantém a API do xlsx mas usa exceljs (seguro) por baixo
import ExcelJS from 'exceljs';

type JsonRow = Record<string, unknown>;

interface SheetToJsonOptions {
  header?: number;
  raw?: boolean;
  defval?: unknown;
}

interface WorksheetCompat {
  _rows: JsonRow[];
  _headers: string[];
  "!cols"?: Array<{ wch?: number }>;
}

interface WorkbookCompat {
  SheetNames: string[];
  Sheets: Record<string, WorksheetCompat>;
  _workbook: ExcelJS.Workbook;
}

// Simula XLSX.utils.json_to_sheet
function json_to_sheet(data: JsonRow[]): WorksheetCompat {
  if (!data || data.length === 0) {
    return { _rows: [], _headers: [] };
  }
  const headers = Object.keys(data[0]);
  return { _rows: data, _headers: headers };
}

// Simula XLSX.utils.aoa_to_sheet
function aoa_to_sheet(data: unknown[][]): WorksheetCompat {
  if (!data || data.length === 0) {
    return { _rows: [], _headers: [] };
  }

  const headers = (data[0] || []).map((value) => String(value ?? ""));
  const rows: JsonRow[] = data.slice(1).map((row) => {
    const rowData: JsonRow = {};
    headers.forEach((header, index) => {
      rowData[header] = row[index] ?? "";
    });
    return rowData;
  });

  return { _rows: rows, _headers: headers };
}

// Simula XLSX.utils.book_new
function book_new(): WorkbookCompat {
  return {
    SheetNames: [],
    Sheets: {},
    _workbook: new ExcelJS.Workbook()
  };
}

// Simula XLSX.utils.book_append_sheet
function book_append_sheet(workbook: WorkbookCompat, worksheet: WorksheetCompat, name: string): void {
  workbook.SheetNames.push(name);
  workbook.Sheets[name] = worksheet;

  const sheet = workbook._workbook.addWorksheet(name);

  // Adiciona headers
  if (worksheet._headers.length > 0) {
    sheet.addRow(worksheet._headers);

    // Estiliza header
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  }

  // Adiciona dados
  worksheet._rows.forEach(row => {
    const values = worksheet._headers.map(h => row[h] ?? '');
    sheet.addRow(values);
  });

  // Define largura de colunas (quando informado), senão aplica valor padrÍo
  if (worksheet["!cols"] && worksheet["!cols"]!.length > 0) {
    worksheet["!cols"]!.forEach((col, index) => {
      const excelCol = sheet.getColumn(index + 1);
      excelCol.width = col.wch ?? 15;
    });
  } else {
    sheet.columns.forEach(column => {
      column.width = 15;
    });
  }
}

// Simula XLSX.utils.sheet_to_json
function sheet_to_json<T = JsonRow>(
  worksheet: ExcelJS.Worksheet | WorksheetCompat,
  options: SheetToJsonOptions = {}
): T[] {
  const defval = options.defval ?? '';

  if ((worksheet as WorksheetCompat)._rows !== undefined) {
    const compat = worksheet as WorksheetCompat;
    if (options.header === 1) {
      const headers = compat._headers.length > 0
        ? compat._headers
        : (compat._rows[0] ? Object.keys(compat._rows[0]) : []);
      const rows = compat._rows.map((row) => headers.map((h) => (row[h] ?? defval)));
      return [headers, ...rows] as unknown as T[];
    }
    return compat._rows as T[];
  }

  const excelSheet = worksheet as ExcelJS.Worksheet;

  if (options.header === 1) {
    const rows: unknown[][] = [];
    excelSheet.eachRow({ includeEmpty: true }, (row) => {
      const rowValues: unknown[] = [];
      const cellCount = Math.max(row.cellCount, row.actualCellCount, 0);
      for (let col = 1; col <= cellCount; col += 1) {
        const value = row.getCell(col).value ?? defval;
        rowValues.push(value);
      }
      rows.push(rowValues);
    });
    return rows as T[];
  }

  const rows: T[] = [];
  const headers: string[] = [];

  excelSheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    if (rowNumber === 1) {
      for (let col = 1; col <= row.cellCount; col += 1) {
        headers.push(String(row.getCell(col).value ?? ''));
      }
    } else {
      const rowData: JsonRow = {};
      for (let col = 1; col <= headers.length; col += 1) {
        const header = headers[col - 1];
        if (header) {
          rowData[header] = row.getCell(col).value ?? defval;
        }
      }
      rows.push(rowData as T);
    }
  });

  return rows;
}

// Simula XLSX.writeFile
async function writeFile(workbook: WorkbookCompat, filename: string): Promise<void> {
  const buffer = await workbook._workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

// Simula XLSX.write (retorna buffer)
async function write(workbook: WorkbookCompat, _opts?: { type?: string; bookType?: string }): Promise<ArrayBuffer> {
  return await workbook._workbook.xlsx.writeBuffer() as ArrayBuffer;
}

// Simula XLSX.read (para leitura de arquivos)
async function read(data: ArrayBuffer | Uint8Array, _opts?: { type?: string }): Promise<WorkbookCompat> {
  const arrayBuffer = data instanceof Uint8Array
    ? data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
    : data;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer as ArrayBuffer);

  const compat: WorkbookCompat = {
    SheetNames: workbook.worksheets.map(ws => ws.name),
    Sheets: {},
    _workbook: workbook
  };

  workbook.worksheets.forEach(ws => {
    const rows = sheet_to_json(ws);
    const headers = rows.length > 0 ? Object.keys(rows[0] as JsonRow) : [];
    compat.Sheets[ws.name] = {
      _rows: rows as JsonRow[],
      _headers: headers
    };
  });

  return compat;
}

// Exporta a mesma API do xlsx
export const utils = {
  json_to_sheet,
  aoa_to_sheet,
  book_new,
  book_append_sheet,
  sheet_to_json
};

export { writeFile, write, read };

// Exporta o ExcelJS original para uso direto quando necessário
export { ExcelJS };

// Default export para import * as XLSX
export default {
  utils,
  writeFile,
  write,
  read
};


