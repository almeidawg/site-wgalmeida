import { formatarMoeda } from "@/lib/utils";

interface OrcamentoPDF {
  id?: string;
  titulo?: string;
  criado_em?: string;
  atualizado_em?: string;
  valor_total?: number;
  margem?: number;
  imposto?: number;
  status?: string;
}

interface ItemPDF {
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  subtotal: number;
  grupo?: string;
}

interface ClientePDF {
  nome: string;
  email?: string;
  telefone?: string;
}

export async function gerarPdfOrcamento(
  orcamento: OrcamentoPDF,
  itens: ItemPDF[],
  cliente: ClientePDF | null
) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const colWidth = (pageWidth - margin * 2) / 3;

  // Cores WG
  const corLaranja = "#F25C26";
  const corCinzaEscuro = "#333333";
  const corCinzaClaro = "#666666";

  // ========== CABEÇALHO ==========
  // Título centralizado
  doc.setFontSize(24);
  doc.setTextColor(corCinzaEscuro);
  doc.setFont("helvetica", "bold");
  const titulo = orcamento?.titulo || "Orçamento";
  const tituloWidth = doc.getTextWidth(titulo);
  doc.text(titulo, (pageWidth - tituloWidth) / 2, 25);

  // Data de criação
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(corCinzaClaro);
  const dataCriacao = `Criado em ${
    orcamento?.criado_em
      ? new Date(orcamento.criado_em).toLocaleDateString("pt-BR")
      : "-"
  }`;
  const dataWidth = doc.getTextWidth(dataCriacao);
  doc.text(dataCriacao, (pageWidth - dataWidth) / 2, 33);

  // Linha separadora
  doc.setDrawColor(230, 230, 230);
  doc.line(margin, 40, pageWidth - margin, 40);

  // ========== SEÇÃO DE 3 COLUNAS ==========
  let yPos = 50;
  const boxHeight = 45;

  // COLUNA 1: CLIENTE
  doc.setFontSize(8);
  doc.setTextColor(corCinzaClaro);
  doc.setFont("helvetica", "bold");
  doc.text("CLIENTE", margin, yPos);

  doc.setFontSize(12);
  doc.setTextColor(corCinzaEscuro);
  doc.setFont("helvetica", "bold");
  doc.text(cliente?.nome || "Não informado", margin, yPos + 10);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(corCinzaClaro);
  if (cliente?.email) {
    doc.text(cliente.email, margin, yPos + 18);
  }
  if (cliente?.telefone) {
    doc.text(cliente.telefone, margin, yPos + 25);
  }

  // COLUNA 2: INFORMAÇÕES
  const col2X = margin + colWidth;
  doc.setFontSize(8);
  doc.setTextColor(corCinzaClaro);
  doc.setFont("helvetica", "bold");
  doc.text("INFORMAÇÕES", col2X, yPos);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(corCinzaClaro);
  doc.text("Título", col2X, yPos + 10);

  doc.setTextColor(corCinzaEscuro);
  doc.setFont("helvetica", "bold");
  const tituloTruncado = (orcamento?.titulo || "Sem título").substring(0, 30);
  doc.text(tituloTruncado, col2X, yPos + 16);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(corCinzaClaro);
  doc.text("Data de Criação", col2X, yPos + 26);

  doc.setTextColor(corCinzaEscuro);
  doc.setFont("helvetica", "bold");
  doc.text(
    orcamento?.criado_em
      ? new Date(orcamento.criado_em).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "-",
    col2X,
    yPos + 32
  );

  // COLUNA 3: VALOR TOTAL (com fundo laranja)
  const col3X = margin + colWidth * 2;
  const boxWidth = colWidth - 5;

  // Fundo laranja
  doc.setFillColor(242, 92, 38);
  doc.roundedRect(col3X, yPos - 5, boxWidth, boxHeight, 3, 3, "F");

  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("VALOR TOTAL", col3X + 5, yPos + 3);

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(formatarMoeda(orcamento?.valor_total || 0), col3X + 5, yPos + 18);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`${itens.length} itens incluídos`, col3X + 5, yPos + 28);

  // ========== TABELA DE ITENS ==========
  yPos = yPos + boxHeight + 15;

  doc.setFontSize(12);
  doc.setTextColor(corCinzaEscuro);
  doc.setFont("helvetica", "bold");
  doc.text(`Itens do Orçamento (${itens.length})`, margin, yPos);

  autoTable(doc, {
    startY: yPos + 5,
    head: [["Descrição", "Qtd", "Valor Unit.", "Subtotal"]],
    body: itens.map((item) => [
      item.descricao,
      String(item.quantidade),
      formatarMoeda(item.valor_unitario),
      formatarMoeda(item.subtotal),
    ]),
    headStyles: {
      fillColor: [51, 51, 51],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [51, 51, 51],
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 35, halign: "right" },
      3: { cellWidth: 35, halign: "right" },
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248],
    },
    margin: { left: margin, right: margin },
  });

  // ========== RODAPÉ ==========
  const finalY = (doc as any).lastAutoTable.finalY + 15;

  // Linha de total
  doc.setDrawColor(230, 230, 230);
  doc.line(pageWidth - 100, finalY, pageWidth - margin, finalY);

  doc.setFontSize(10);
  doc.setTextColor(corCinzaClaro);
  doc.setFont("helvetica", "normal");
  doc.text("Total:", pageWidth - 100, finalY + 8);

  doc.setFontSize(14);
  doc.setTextColor(corLaranja);
  doc.setFont("helvetica", "bold");
  const valorTotal = formatarMoeda(orcamento?.valor_total || 0);
  const valorWidth = doc.getTextWidth(valorTotal);
  doc.text(valorTotal, pageWidth - margin - valorWidth, finalY + 8);

  // Rodapé da página
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(corCinzaClaro);
  doc.setFont("helvetica", "normal");

  const rodape = "Grupo WG Almeida - Arquitetura, Engenharia e Marcenaria Premium";
  const rodapeWidth = doc.getTextWidth(rodape);
  doc.text(rodape, (pageWidth - rodapeWidth) / 2, pageHeight - 15);

  const site = "www.wgalmeida.com.br";
  const siteWidth = doc.getTextWidth(site);
  doc.text(site, (pageWidth - siteWidth) / 2, pageHeight - 10);

  // Salvar PDF
  const nomeArquivo = `Orcamento_${(orcamento?.titulo || "").replaceAll(/\s+/g, "_")}_${
    new Date().toISOString().split("T")[0]
  }.pdf`;
  doc.save(nomeArquivo);
}

