// src/lib/exportFinanceiro.ts
import { LancamentoFinanceiro } from "./financeiroApi";

const loadPdfLibs = () => Promise.all([import("jspdf"), import("jspdf-autotable")]);
const loadXLSX = () => import("./xlsxCompat");

export async function exportarPDF(lista: LancamentoFinanceiro[]) {
  const [{ default: jsPDF }, { default: autoTable }] = await loadPdfLibs();
  const doc = new jsPDF();

  doc.text("Relatório Financeiro - WG Easy", 14, 16);

  autoTable(doc, {
    startY: 22,
    head: [["DescriçÍo", "Valor", "Tipo", "Status", "Vencimento"]],
    body: lista.map(l => [
      l.descricao ?? "",
      "R$ " + Number(l.valor_total ?? 0).toFixed(2),
      l.tipo ?? "",
      l.status ?? "",
      l.vencimento ?? ""
    ]),
  });

  doc.save("financeiro-wg.pdf");
}

export async function exportarExcel(lista: LancamentoFinanceiro[]) {
  const XLSX = await loadXLSX();
  const rows = lista.map((l) => ({
    descricao: l.descricao ?? "",
    valor_total: Number(l.valor_total ?? 0),
    tipo: l.tipo ?? "",
    status: l.status ?? "",
    vencimento: l.vencimento ?? "",
  }));
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Financeiro");

  XLSX.writeFile(workbook, "financeiro-wg.xlsx");
}

