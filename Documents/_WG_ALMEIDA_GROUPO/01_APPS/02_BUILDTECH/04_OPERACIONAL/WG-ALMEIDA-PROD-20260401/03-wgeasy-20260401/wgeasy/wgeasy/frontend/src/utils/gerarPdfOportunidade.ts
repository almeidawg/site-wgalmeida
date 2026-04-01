// ============================================================
// UTIL: gerarPdfOportunidade
// Gera PDF oficial da Oportunidade — WG EASY
// ============================================================

import { obterAvatarUrl, gerarCorPorNome } from "@/utils/avatarUtils";

const loadPdfLibs = () => Promise.all([import("jspdf"), import("jspdf-autotable")]);

interface ClientePDF {
  nome?: string;
  email?: string;
  telefone?: string;
  cargo?: string;
  unidade?: string;
  avatar_url?: string | null;
  foto_url?: string | null;
  avatar?: string | null;
}

interface OportunidadePDFData {
  titulo?: string;
  id?: string;
  estagio?: string;
  origem?: string;
  valor_estimado?: number;
  previsao_fechamento?: string;
  descricao?: string;
  observacoes?: string;
  nucleos?: Array<{ nucleo?: string; valor?: number }>;
}

interface OportunidadePDF {
  oportunidade: OportunidadePDFData;
  cliente: ClientePDF;
}

export async function gerarPdfOportunidade({ oportunidade, cliente }: OportunidadePDF) {
  const [{ default: jsPDF }, { default: autoTable }] = await loadPdfLibs();
  const doc = new jsPDF();
  const docWithTable = doc as { lastAutoTable?: { finalY?: number } };
  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const avatarUrl = obterAvatarUrl(
    cliente?.nome || "Cliente",
    cliente?.avatar_url,
    cliente?.foto_url,
    cliente?.avatar,
    gerarCorPorNome(cliente?.nome || "")
  );

  // ======================
  // TIMBRADO - HEADER
  // ======================
  // Adicionar imagem de timbrado (se disponível)
  try {
    const timbradoImg = new Image();
    timbradoImg.crossOrigin = "anonymous"; // Evita problemas de CORS
    timbradoImg.src = '/timbrado-wg.png';

    // Aguardar carregamento da imagem
    await new Promise<void>((resolve, reject) => {
      timbradoImg.onload = () => resolve();
      timbradoImg.onerror = () => reject(new Error('Falha ao carregar timbrado'));
      setTimeout(() => reject(new Error('Timeout')), 3000); // timeout de 3s
    });

    // Adicionar imagem ao PDF (plano de fundo)
    doc.addImage(timbradoImg, "PNG", 0, 0, pageWidth, pageHeight);
  } catch (e) {
    console.warn('Timbrado Não carregou, usando fallback:', e);
    // Fallback: desenhar cabeçalho manualmente
    doc.setFillColor(43, 69, 128); // Cor azul WG
    doc.rect(0, 0, pageWidth, 35, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("WG EASY", margin, 15);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Sistema de GestÍo Empresarial", margin, 22);
  }

  // Resetar cor do texto
  doc.setTextColor(0, 0, 0);

  // ======================
  // TÍTULO DO DOCUMENTO
  // ======================
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Ficha da Oportunidade", margin, 45);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Título: ${oportunidade.titulo}`, margin, 53);

  // Avatar (imagem do cliente)
  try {
    doc.addImage(avatarUrl, "JPEG", 160, 40, 30, 30);
  } catch (e) {
    console.warn("Avatar Não carregou no PDF", e);
  }

  // Linha separadora
  doc.setDrawColor(43, 69, 128);
  doc.setLineWidth(0.5);
  doc.line(margin, 58, pageWidth - margin, 58);

  // ======================
  // DADOS DO CLIENTE
  // ======================
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(43, 69, 128);
  doc.text("Cliente", margin, 68);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");

  autoTable(doc, {
    startY: 72,
    margin: { left: margin },
    styles: { fontSize: 10 },
    head: [["Campo", "Valor"]],
    headStyles: { fillColor: [43, 69, 128], fontStyle: "bold" },
    body: [
      ["Nome", cliente?.nome || ""],
      ["E-mail", cliente?.email || ""],
      ["Telefone", cliente?.telefone || ""],
      ["Cargo", cliente?.cargo || ""],
      ["Unidade", cliente?.unidade || ""],
    ],
  });

  // ======================
  // DADOS DA OPORTUNIDADE
  // ======================
  let y = (docWithTable.lastAutoTable?.finalY ?? 0) + 10;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(43, 69, 128);
  doc.text("Oportunidade", margin, y);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");

  autoTable(doc, {
    startY: y + 4,
    margin: { left: margin },
    styles: { fontSize: 10 },
    head: [["Campo", "Valor"]],
    headStyles: { fillColor: [43, 69, 128], fontStyle: "bold" },
    body: [
      ["Estágio", oportunidade.estagio || ""],
      ["Origem", oportunidade.origem || ""],
      [
        "Valor Total",
        oportunidade.valor_estimado
          ? `R$ ${oportunidade.valor_estimado.toLocaleString("pt-BR")}`
          : "",
      ],
      ["PrevisÍo Fechamento", oportunidade.previsao_fechamento || ""],
      ["Descrição", oportunidade.descricao || ""],
      ["Observações", oportunidade.observacoes || ""],
    ],
  });

  // ======================
  // NÚCLEOS
  // ======================
  if (oportunidade.nucleos?.length) {
    y = (docWithTable.lastAutoTable?.finalY ?? 0) + 10;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(43, 69, 128);
    doc.text("Núcleos", margin, y);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");

    const nucleoRows = oportunidade.nucleos.map((n) => [
      n.nucleo,
      n.valor ? `R$ ${n.valor.toLocaleString("pt-BR")}` : "",
    ]) as string[][];

    autoTable(doc, {
      startY: y + 4,
      margin: { left: margin },
      styles: { fontSize: 10 },
      head: [["Núcleo", "Valor"]],
      body: nucleoRows,
      headStyles: { fillColor: [43, 69, 128] }
    });
  }

  // ======================
  // RODAPÉ PROFISSIONAL
  // ======================
  const footerY = pageHeight - 25;

  // Linha superior do rodapé
  doc.setDrawColor(43, 69, 128);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  // Informações do rodapé
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("WG EASY - Sistema de GestÍo Empresarial", margin, footerY + 5);
  doc.text("www.wgeasy.com.br | contato@wgeasy.com.br", margin, footerY + 10);

  // Data de geração
  const dataGeracao = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Documento gerado em ${dataGeracao}`, margin, footerY + 15);

  doc.save(`Oportunidade_${oportunidade.titulo}_${oportunidade.id}.pdf`);
}

