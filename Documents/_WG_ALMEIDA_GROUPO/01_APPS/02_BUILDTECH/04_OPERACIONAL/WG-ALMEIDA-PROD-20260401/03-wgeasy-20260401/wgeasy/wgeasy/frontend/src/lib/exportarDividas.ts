// src/lib/exportarDividas.ts
// ExportaçÍo de relatórios de Dívidas — PDF e Excel
import { formatarMoeda, formatarData } from "./utils";
import { sanitizarTextoPDF } from "./pdfHelpers";
import type { Divida, StatusDivida } from "./dividasApi";
import type { EmpresaGrupo, SocioEmpresa } from "@/types/empresas";
import { formatarCNPJ, formatarCPF } from "@/types/empresas";

const loadPdfLibs = () => Promise.all([import("jspdf"), import("jspdf-autotable")]);
const loadXLSX = () => import("./xlsxCompat");

// ============================================================
// TIPOS
// ============================================================

export type ModoExportacao = "geral" | "por_empresa" | "por_socio";

export interface GrupoDividas {
  label: string;
  sublabel?: string;
  dividas: Divida[];
  subtotalOriginal: number;
  subtotalNegociado: number;
}

// ============================================================
// HELPERS
// ============================================================

const STATUS_LABELS: Record<StatusDivida, string> = {
  pendente: "Pendente",
  em_negociacao: "Em Negociacao",
  acordo: "Acordo",
  paga: "Paga",
  protestada: "Protestada",
  prescrita: "Prescrita",
  cancelada: "Cancelada",
};

function nomeDevedor(d: Divida): string {
  if (d.devedor_tipo === "empresa") {
    return d.empresa?.nome_fantasia || d.empresa?.razao_social || "—";
  }
  return d.socio?.nome || "—";
}

function nomeCredor(d: Divida): string {
  return d.credor?.nome || "—";
}

function calcDesconto(d: Divida): string {
  const orig = Number(d.valor_original || 0);
  const neg = Number(d.valor_divida || 0);
  if (orig > 0 && neg < orig) {
    return ((orig - neg) / orig * 100).toFixed(1) + "%";
  }
  return "";
}

function calcResumo(dividas: Divida[]) {
  const hoje = new Date().toISOString().split("T")[0];
  const statusAtivos: StatusDivida[] = ["pendente", "em_negociacao", "acordo", "protestada"];

  const ativas = dividas.filter(d => statusAtivos.includes(d.status));
  const protestadas = dividas.filter(d => d.protestada && d.status !== "paga" && d.status !== "cancelada");
  const vencidas = dividas.filter(d =>
    statusAtivos.includes(d.status) &&
    d.data_vencimento_original &&
    d.data_vencimento_original < hoje
  );
  const totalOriginal = dividas.reduce((s, d) => s + Number(d.valor_original || 0), 0);
  const totalNegociado = dividas.reduce((s, d) => s + Number(d.valor_divida || 0), 0);

  return {
    ativas: ativas.length,
    protestadas: protestadas.length,
    vencidas: vencidas.length,
    totalOriginal,
    totalNegociado,
    total: dividas.length,
  };
}

// Sanitize for PDF (strips accents for Helvetica font)
const s = sanitizarTextoPDF;

// PDF-safe money format (avoids non-breaking spaces from Intl)
function fmtMoeda(valor: number): string {
  return formatarMoeda(valor).replace(/\u00a0/g, " ");
}

// ============================================================
// AGRUPAMENTO
// ============================================================

export function agruparPorEmpresa(dividas: Divida[], empresas: EmpresaGrupo[]): GrupoDividas[] {
  const map = new Map<string, Divida[]>();
  const semEmpresa: Divida[] = [];

  dividas.forEach(d => {
    if (d.devedor_tipo === "empresa" && d.empresa_id) {
      const arr = map.get(d.empresa_id) || [];
      arr.push(d);
      map.set(d.empresa_id, arr);
    } else {
      semEmpresa.push(d);
    }
  });

  const grupos: GrupoDividas[] = [];

  map.forEach((divs, empresaId) => {
    const emp = empresas.find(e => e.id === empresaId);
    grupos.push({
      label: emp?.nome_fantasia || emp?.razao_social || "Empresa desconhecida",
      sublabel: emp?.cnpj ? formatarCNPJ(emp.cnpj) : undefined,
      dividas: divs,
      subtotalOriginal: divs.reduce((acc, d) => acc + Number(d.valor_original || 0), 0),
      subtotalNegociado: divs.reduce((acc, d) => acc + Number(d.valor_divida || 0), 0),
    });
  });

  if (semEmpresa.length > 0) {
    grupos.push({
      label: "Socios PF / Sem empresa",
      dividas: semEmpresa,
      subtotalOriginal: semEmpresa.reduce((acc, d) => acc + Number(d.valor_original || 0), 0),
      subtotalNegociado: semEmpresa.reduce((acc, d) => acc + Number(d.valor_divida || 0), 0),
    });
  }

  return grupos.sort((a, b) => a.label.localeCompare(b.label));
}

export function agruparPorSocio(dividas: Divida[], socios: SocioEmpresa[]): GrupoDividas[] {
  const map = new Map<string, Divida[]>();
  const semSocio: Divida[] = [];

  dividas.forEach(d => {
    if (d.devedor_tipo === "socio" && d.socio_id) {
      const arr = map.get(d.socio_id) || [];
      arr.push(d);
      map.set(d.socio_id, arr);
    } else {
      semSocio.push(d);
    }
  });

  const grupos: GrupoDividas[] = [];

  map.forEach((divs, socioId) => {
    const soc = socios.find(si => si.id === socioId);
    grupos.push({
      label: soc?.nome || "Socio desconhecido",
      sublabel: soc?.cpf ? formatarCPF(soc.cpf) : undefined,
      dividas: divs,
      subtotalOriginal: divs.reduce((acc, d) => acc + Number(d.valor_original || 0), 0),
      subtotalNegociado: divs.reduce((acc, d) => acc + Number(d.valor_divida || 0), 0),
    });
  });

  if (semSocio.length > 0) {
    grupos.push({
      label: "Empresas / Sem socio",
      dividas: semSocio,
      subtotalOriginal: semSocio.reduce((acc, d) => acc + Number(d.valor_original || 0), 0),
      subtotalNegociado: semSocio.reduce((acc, d) => acc + Number(d.valor_divida || 0), 0),
    });
  }

  return grupos.sort((a, b) => a.label.localeCompare(b.label));
}

// ============================================================
// PDF EXPORT
// ============================================================

const HEAD_COLS = ["No", "Descricao", "Credor", "Devedor", "Valor Original", "Valor Negociado", "Desc.%", "Status", "Vencimento"];

function dividaToRowPDF(d: Divida): string[] {
  return [
    d.numero || "",
    s(d.descricao || ""),
    s(nomeCredor(d)),
    s(nomeDevedor(d)),
    fmtMoeda(Number(d.valor_original || 0)),
    fmtMoeda(Number(d.valor_divida || 0)),
    calcDesconto(d) || "—",
    STATUS_LABELS[d.status] || d.status,
    d.data_vencimento_original ? formatarData(d.data_vencimento_original) : "—",
  ];
}

export function exportarDividasPDF(
  dividas: Divida[],
  empresas: EmpresaGrupo[],
  socios: SocioEmpresa[],
  modo: ModoExportacao
) {
  void (async () => {
  const [{ default: jsPDF }, { default: autoTable }] = await loadPdfLibs();
  const doc = new jsPDF({ orientation: "landscape" });
  const dataEmissao = new Date().toLocaleDateString("pt-BR");

  const titulos: Record<ModoExportacao, string> = {
    geral: "Relatorio de Dividas - WG Almeida",
    por_empresa: "Relatorio de Dividas por Empresa - WG Almeida",
    por_socio: "Relatorio de Dividas por Socio - WG Almeida",
  };

  // Title
  doc.setFontSize(16);
  doc.text(titulos[modo], 14, 16);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Emitido em: ${dataEmissao}`, 14, 22);
  doc.setTextColor(0);

  // Resumo
  const resumo = calcResumo(dividas);
  doc.setFontSize(10);
  doc.text(
    `Total: ${resumo.total} dividas | Ativas: ${resumo.ativas} | Protestadas: ${resumo.protestadas} | Vencidas: ${resumo.vencidas}`,
    14, 28
  );
  doc.text(
    `Valor Original: ${fmtMoeda(resumo.totalOriginal)} | Valor Negociado: ${fmtMoeda(resumo.totalNegociado)}`,
    14, 33
  );

  let startY = 38;

  if (modo === "geral") {
    autoTable(doc, {
      startY,
      head: [HEAD_COLS],
      body: dividas.map(dividaToRowPDF),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [22, 163, 74], textColor: 255, fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });
  } else {
    const grupos = modo === "por_empresa"
      ? agruparPorEmpresa(dividas, empresas)
      : agruparPorSocio(dividas, socios);

    grupos.forEach((grupo) => {
      // New page if near bottom
      if (startY > 170) {
        doc.addPage();
        startY = 14;
      }

      // Group header
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(
        s(grupo.label) + (grupo.sublabel ? ` (${grupo.sublabel})` : ""),
        14, startY
      );
      doc.setFont("helvetica", "normal");
      startY += 5;

      autoTable(doc, {
        startY,
        head: [HEAD_COLS],
        body: grupo.dividas.map(dividaToRowPDF),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [22, 163, 74], textColor: 255, fontSize: 8 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      // Get final Y after autoTable
      startY = (doc as any).lastAutoTable?.finalY || startY + 20;

      // Subtotal
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(
        `Subtotal: Original ${fmtMoeda(grupo.subtotalOriginal)} | Negociado ${fmtMoeda(grupo.subtotalNegociado)}`,
        14, startY + 5
      );
      doc.setFont("helvetica", "normal");
      startY += 12;
    });

    // Total geral
    if (startY > 180) {
      doc.addPage();
      startY = 14;
    }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(
      `TOTAL GERAL: Original ${fmtMoeda(resumo.totalOriginal)} | Negociado ${fmtMoeda(resumo.totalNegociado)}`,
      14, startY + 2
    );
    doc.setFont("helvetica", "normal");
  }

  const nomeArquivo = `dividas-${modo.replace("_", "-")}-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(nomeArquivo);
  })();
}

// ============================================================
// EXCEL EXPORT
// ============================================================

function dividaToRowExcel(d: Divida): unknown[] {
  return [
    d.numero || "",
    d.descricao || "",
    nomeCredor(d),
    nomeDevedor(d),
    Number(d.valor_original || 0),
    Number(d.valor_divida || 0),
    calcDesconto(d),
    STATUS_LABELS[d.status] || d.status,
    d.data_vencimento_original ? formatarData(d.data_vencimento_original) : "",
  ];
}

export async function exportarDividasExcel(
  dividas: Divida[],
  empresas: EmpresaGrupo[],
  socios: SocioEmpresa[],
  modo: ModoExportacao
) {
  const XLSX = await loadXLSX();
  const workbook = XLSX.utils.book_new();
  const HEADER = ["No", "Descricao", "Credor", "Devedor", "Valor Original", "Valor Negociado", "Desc.%", "Status", "Vencimento"];
  const COL_WIDTHS = [
    { wch: 10 }, { wch: 30 }, { wch: 25 }, { wch: 25 },
    { wch: 16 }, { wch: 16 }, { wch: 8 }, { wch: 15 }, { wch: 12 },
  ];

  if (modo === "geral") {
    const rows: unknown[][] = [HEADER];

    dividas.forEach(d => rows.push(dividaToRowExcel(d)));

    const resumo = calcResumo(dividas);
    rows.push([]);
    rows.push(["TOTAL", "", "", "", resumo.totalOriginal, resumo.totalNegociado, "", `${resumo.total} dividas`, ""]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = COL_WIDTHS;
    XLSX.utils.book_append_sheet(workbook, ws, "Dividas");
  } else {
    const grupos = modo === "por_empresa"
      ? agruparPorEmpresa(dividas, empresas)
      : agruparPorSocio(dividas, socios);

    const rows: unknown[][] = [HEADER];

    grupos.forEach((grupo) => {
      // Group header as a data row
      rows.push([grupo.label + (grupo.sublabel ? ` (${grupo.sublabel})` : ""), "", "", "", "", "", "", "", ""]);

      grupo.dividas.forEach(d => rows.push(dividaToRowExcel(d)));

      rows.push(["Subtotal", "", "", "", grupo.subtotalOriginal, grupo.subtotalNegociado, "", "", ""]);
      rows.push(["", "", "", "", "", "", "", "", ""]);
    });

    const resumo = calcResumo(dividas);
    rows.push(["TOTAL GERAL", "", "", "", resumo.totalOriginal, resumo.totalNegociado, "", `${resumo.total} dividas`, ""]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = COL_WIDTHS;
    const sheetName = modo === "por_empresa" ? "Por Empresa" : "Por Socio";
    XLSX.utils.book_append_sheet(workbook, ws, sheetName);
  }

  const nomeArquivo = `dividas-${modo.replace("_", "-")}-${new Date().toISOString().split("T")[0]}.xlsx`;
  await XLSX.writeFile(workbook, nomeArquivo);
}

