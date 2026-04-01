// src/lib/financeiroExport.ts
import { LancamentoFinanceiro } from "./financeiroApi";

const loadPdfLibs = () => Promise.all([import("jspdf"), import("jspdf-autotable")]);
const loadXLSX = () => import("./xlsxCompat");

export async function exportarFinanceiroPDF(lista: LancamentoFinanceiro[]) {
  const [{ default: jsPDF }, { default: autoTable }] = await loadPdfLibs();
  const doc = new jsPDF();
  doc.text("Relatório Financeiro - WG Easy", 14, 16);

  autoTable(doc, {
    startY: 22,
    head: [["DescriçÍo", "Valor", "Tipo", "Status", "Vencimento", "Núcleo"]],
    body: lista.map((l) => [
      l.descricao,
      "R$ " + Number(l.valor_total || 0).toFixed(2),
      l.tipo,
      l.status ?? "-",
      l.vencimento ?? "-",
      l.nucleo ?? "-",
    ]),
  });

  doc.save("financeiro-wg.pdf");
}

export async function exportarFinanceiroExcel(lista: LancamentoFinanceiro[]) {
  const XLSX = await loadXLSX();
  const plain = lista.map((l) => ({
    Descricao: l.descricao,
    Valor: Number(l.valor_total || 0),
    Tipo: l.tipo,
    Status: l.status ?? "",
    Vencimento: l.vencimento ?? "",
    Nucleo: l.nucleo ?? "",
    CategoriaID: l.categoria_id ?? "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(plain);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Financeiro");
  XLSX.writeFile(workbook, "financeiro-wg.xlsx");
}

