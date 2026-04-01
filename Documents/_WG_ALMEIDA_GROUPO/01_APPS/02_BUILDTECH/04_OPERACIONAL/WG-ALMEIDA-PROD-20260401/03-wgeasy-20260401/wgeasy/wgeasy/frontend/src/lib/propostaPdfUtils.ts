// ============================================================
// UTILIDADES: GeraçÍo de PDF de Propostas Comerciais - NOVO LAYOUT
// Sistema WG Easy - Grupo WG Almeida
// Baseado no layout "Ambientes.pdf" - Organizado por Núcleos
// ============================================================

import type { PropostaCompleta } from "@/types/propostas";
import { getFormaPagamentoLabel } from "@/types/propostas";
import { sanitizarTextoPDF } from "./pdfHelpers";

const loadPdfLibs = () => Promise.all([import("jspdf"), import("jspdf-autotable")]);

export type DadosBancariosNucleo = {
  banco?: string | null;
  agencia?: string | null;
  conta?: string | null;
  tipo_conta?: string | null;
  pix_chave?: string | null;
  pix_tipo?: string | null;
  nome?: string | null;
};

/**
 * Gera PDF da proposta comercial com novo layout por núcleos
 */
export async function gerarPropostaPDF(
  proposta: PropostaCompleta,
  dadosBancarios?: DadosBancariosNucleo | null
) {
  const [{ default: jsPDF }, { default: autoTable }] = await loadPdfLibs();
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const marginRight = 25; // Margem direita maior para nao sobrepor logos
  const contentWidth = pageWidth - margin - marginRight;
  const formatarMoeda = (valor: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);

  let yPos = margin;

  // ============================================================
  // 1. LOGO
  // ============================================================
  let logoImg: HTMLImageElement | null = null;
  const logoWidth = 26;
  let logoHeight = 0;
  const headerTop = yPos;
  const logoX = (pageWidth - logoWidth) / 2;
  const overlineText = "WG Easy · Proposta & Contrato";

  function adicionarTimbrado() {
    if (logoImg) {
      const logoXTimbrado = (pageWidth - logoWidth) / 2;
      doc.addImage(logoImg, "PNG", logoXTimbrado, margin, logoWidth, logoHeight);
    }
  }

  try {
    const logo = new Image();
    logo.src = "/imagens/logoscomfundotransparente/logogrupoWgAlmeida.png";

    await new Promise((resolve, reject) => {
      logo.onload = () => {
        logoImg = logo;
        logoHeight = (logo.height * logoWidth) / logo.width;
        doc.addImage(logo, "PNG", logoX, headerTop, logoWidth, logoHeight);
        resolve(true);
      };
      logo.onerror = reject;
    });
  } catch (error) {
    console.warn("não foi possível carregar o logo:", error);
  }

  const overlineY = headerTop + (logoHeight > 0 ? logoHeight + 2.5 : 6);
  doc.setFontSize(6.8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(overlineText, pageWidth / 2, overlineY, { align: "center" });

  const headerHeight = Math.max(logoHeight + 5, 12);
  yPos = headerTop + headerHeight + 5.5;

  // ============================================================
  // 2. TÍTULO
  // ============================================================
  const tituloProposta = proposta.titulo || "Proposta comercial";
  doc.setFontSize(12.4);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(43, 42, 40);
  doc.text(sanitizarTextoPDF(tituloProposta), margin, yPos);
  yPos += 4.5;

  // Data da proposta logo abaixo do título
  doc.setFontSize(7.6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  const dataAtual = new Date(proposta.criado_em).toLocaleDateString("pt-BR");
  const numeroTexto = proposta.numero ? `Numero: ${proposta.numero}` : "";
  const statusTexto = proposta.status ? `Status: ${proposta.status}` : "";
  const linhaSubtitulo = [`Criado em ${dataAtual}`, numeroTexto, statusTexto]
    .filter(Boolean)
    .join(" · ");
  doc.text(sanitizarTextoPDF(linhaSubtitulo), margin, yPos);
  yPos += 8.5;

  // ============================================================
  // 3. CLIENTE E VALOR (mockup)
  // ============================================================
  const cardGap = 6;
  const leftCardWidth = contentWidth * 0.6;
  const rightCardWidth = contentWidth - leftCardWidth - cardGap;
  const cardHeight = 50;
  const cardY = yPos;

  const totalItens = proposta.itens?.length || 0;

  const clienteEmail = (proposta as any).cliente_email || (proposta as any).email;
  const clienteTelefone = (proposta as any).cliente_telefone || (proposta as any).telefone;
  const clienteNome = proposta.cliente_nome || "Cliente";

  const enderecoObra =
    (proposta as any).endereco_obra ||
    (proposta as any).endereco ||
    (proposta as any).cliente_endereco;

  const nucleoLabel = proposta.nucleo
    ? proposta.nucleo.charAt(0).toUpperCase() + proposta.nucleo.slice(1)
    : null;

  const getIniciais = (nome: string) => {
    const partes = nome.trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return "WG";
    const primeira = partes[0][0] || "";
    const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
    return `${primeira}${ultima}`.toUpperCase();
  };

  let avatarImg: HTMLImageElement | null = null;
  let avatarFormato: "PNG" | "JPEG" = "PNG";
  if (proposta.cliente_avatar_url) {
    try {
      const avatar = new Image();
      avatar.src = proposta.cliente_avatar_url;
      avatarFormato = /\.jpe?g$/i.test(proposta.cliente_avatar_url) ? "JPEG" : "PNG";
      await new Promise((resolve, reject) => {
        avatar.onload = () => {
          avatarImg = avatar;
          resolve(true);
        };
        avatar.onerror = reject;
      });
    } catch {
      avatarImg = null;
    }
  }

  // Card Cliente e Projeto (esquerda)
  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, cardY, leftCardWidth, cardHeight, 4, 4, "FD");

  let textoY = cardY + 5.5;
  doc.setFontSize(7.6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(242, 92, 38);
  doc.text("CLIENTE & PROJETO", margin + 5, textoY);
  textoY += 5.5;

  const avatarRaio = 6.6;
  const avatarX = margin + 9;
  const avatarY = textoY + 2;
  doc.setFillColor(233, 236, 239);
  doc.circle(avatarX, avatarY, avatarRaio, "F");
  if (avatarImg) {
    doc.addImage(
      avatarImg,
      avatarFormato,
      avatarX - avatarRaio,
      avatarY - avatarRaio,
      avatarRaio * 2,
      avatarRaio * 2
    );
  } else {
    doc.setFontSize(7.2);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(getIniciais(clienteNome), avatarX, avatarY + 2, { align: "center" });
  }

  doc.setFontSize(7.8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(46, 46, 46);
  const clienteTextoX = avatarX + avatarRaio + 4;
  let clienteTextoY = avatarY - 2;
  doc.text(sanitizarTextoPDF(clienteNome), clienteTextoX, clienteTextoY);

  doc.setFontSize(6.9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  if (clienteEmail) {
    clienteTextoY += 4;
    doc.text(sanitizarTextoPDF(clienteEmail), clienteTextoX, clienteTextoY);
  }
  if (clienteTelefone) {
    clienteTextoY += 4;
    doc.text(sanitizarTextoPDF(clienteTelefone), clienteTextoX, clienteTextoY);
  }

  if (enderecoObra) {
    const enderecoY = cardY + 28.5;
    doc.setFontSize(6.8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text("Endereco da obra", margin + 5, enderecoY);
    doc.setFontSize(7.1);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 55, 48);
    const enderecoQuebrado = doc.splitTextToSize(sanitizarTextoPDF(enderecoObra), leftCardWidth - 10);
    doc.text(enderecoQuebrado, margin + 5, enderecoY + 4);
  }

  const badgeItens: string[] = [];
  if (nucleoLabel) {
    badgeItens.push(`Nucleo: ${nucleoLabel}`);
  }
  if (proposta.prazo_execucao_dias) {
    badgeItens.push(`Prazo de execucao: ${proposta.prazo_execucao_dias} dias`);
  }

  let badgeX = margin + 5;
  const badgeY = cardY + cardHeight - 9;
  doc.setFontSize(6.6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(110, 101, 90);
  badgeItens.forEach((badge) => {
    const badgeText = sanitizarTextoPDF(badge);
    const badgeWidth = doc.getTextWidth(badgeText) + 6;
    doc.setDrawColor(239, 230, 218);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(badgeX, badgeY - 4, badgeWidth, 6.5, 3, 3, "FD");
    doc.text(badgeText, badgeX + 3, badgeY);
    badgeX += badgeWidth + 4;
  });

  doc.setFontSize(6.8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(242, 92, 38);
  doc.text("Ver perfil completo >", margin + 5, cardY + cardHeight - 1.6);

  // Card Valor (direita)
  const rightX = margin + leftCardWidth + cardGap;
  doc.setDrawColor(240, 214, 201);
  doc.setFillColor(242, 92, 38);
  doc.roundedRect(rightX, cardY, rightCardWidth, cardHeight, 4, 4, "FD");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.2);
  doc.setFont("helvetica", "normal");
  doc.text("VALOR TOTAL", rightX + 4, cardY + 7);

  doc.setFontSize(12.6);
  doc.setFont("helvetica", "normal");
  const valorTotalTexto = proposta.exibir_valores
    ? formatarMoeda(proposta.valor_total || 0)
    : "Sob consulta";
  doc.text(valorTotalTexto, rightX + rightCardWidth - 4, cardY + 11.5, { align: "right" });

  doc.setFontSize(6.8);
  doc.setFont("helvetica", "normal");
  const validadeLabel = proposta.validade_dias ? ` · Validade ${proposta.validade_dias} dias` : "";
  const resumoItens = `${totalItens} itens incluidos${validadeLabel}`;
  doc.text(resumoItens, rightX + 4, cardY + 22.5);

  const linhasPagamento: Array<{ label: string; valor: string }> = [];
  if (proposta.exibir_valores && proposta.percentual_entrada) {
    const valorEntrada = (proposta.valor_total * proposta.percentual_entrada) / 100;
    linhasPagamento.push({
      label: `Entrada ${proposta.percentual_entrada}%`,
      valor: formatarMoeda(valorEntrada),
    });
  }
  if (proposta.exibir_valores && proposta.numero_parcelas) {
    const valorRestante =
      proposta.valor_total -
      (proposta.percentual_entrada
        ? (proposta.valor_total * proposta.percentual_entrada) / 100
        : 0);
    const valorParcela = valorRestante / proposta.numero_parcelas;
    linhasPagamento.push({
      label: `Saldo ${proposta.numero_parcelas}x`,
      valor: formatarMoeda(valorParcela),
    });
  }

  doc.setFontSize(6.8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(255, 255, 255);
  let pagamentoY = cardY + 30.5;
  const pagamentoValorX = rightX + rightCardWidth - 4;
  linhasPagamento.forEach((linha) => {
    doc.text(sanitizarTextoPDF(linha.label), rightX + 4, pagamentoY);
    doc.text(sanitizarTextoPDF(linha.valor), pagamentoValorX, pagamentoY, { align: "right" });
    pagamentoY += 4;
  });

  const baseUrl = globalThis.location.origin;
  const botaoAltura = 5.6;
  const botaoGap = 2;
  const botaoX = rightX + 5;
  const botaoLargura = (rightCardWidth - 10 - botaoGap) / 2;
  const botaoY = cardY + cardHeight - 15;

  doc.setFontSize(6.8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(255, 255, 255);
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.3);

  doc.roundedRect(botaoX, botaoY, botaoLargura, botaoAltura, 3, 3, "S");
  doc.text("RECUSAR", botaoX + botaoLargura / 2, botaoY + 3.8, { align: "center" });
  doc.roundedRect(botaoX + botaoLargura + botaoGap, botaoY, botaoLargura, botaoAltura, 3, 3, "S");
  doc.text("REVISAR", botaoX + botaoLargura + botaoGap + botaoLargura / 2, botaoY + 3.8, {
    align: "center",
  });

  const aprovarY = botaoY + botaoAltura + 1.8;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(botaoX, aprovarY, rightCardWidth - 10, botaoAltura + 1, 3.5, 3.5, "FD");
  doc.setTextColor(194, 69, 31);
  doc.text("APROVAR", botaoX + (rightCardWidth - 10) / 2, aprovarY + 4, { align: "center" });

  doc.link(botaoX, botaoY, botaoLargura, botaoAltura, {
    url: `${baseUrl}/proposta/${proposta.id}/recusar`,
  });
  doc.link(botaoX, aprovarY, rightCardWidth - 10, botaoAltura + 1, {
    url: `${baseUrl}/proposta/${proposta.id}/aprovar`,
  });

  doc.setTextColor(46, 46, 46);
  doc.setFont("helvetica", "normal");

  yPos = cardY + cardHeight + 16;

  // ============================================================
  // 4. ITENS DO ORCAMENTO
  // ============================================================
  const itensOrdenados = [...(proposta.itens ?? [])].sort((a, b) => a.ordem - b.ordem);
  const tableData = itensOrdenados.map((item) => {
    const descricao = item.descricao_customizada || item.descricao || item.nome;
    const quantidade = `${item.quantidade} ${item.unidade || "un"}`;
    const valorUnitario = proposta.exibir_valores ? formatarMoeda(item.valor_unitario) : "-";
    const subtotal = proposta.exibir_valores ? formatarMoeda(item.valor_subtotal) : "-";

    return [
      sanitizarTextoPDF(descricao),
      sanitizarTextoPDF(quantidade),
      valorUnitario,
      subtotal,
    ];
  });

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(43, 42, 40);
  doc.text(`Itens do Orcamento (${totalItens})`, margin, yPos);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(138, 129, 118);
  doc.text("Organizado por categoria", pageWidth - marginRight, yPos, { align: "right" });
  yPos += 6;

  const tableContainerY = yPos + 4;
  const tablePadding = 6;
  const tableStartY = tableContainerY + tablePadding;

  autoTable(doc, {
    startY: tableStartY,
    head: [["Descricao", "Qtd", "Valor unit.", "Subtotal"]],
    body: tableData,
    theme: "plain",
    styles: {
      fontSize: 7.2,
      textColor: [58, 52, 45],
      lineWidth: 0,
      cellPadding: { top: 2.6, right: 1.5, bottom: 2.6, left: 1.5 },
      minCellHeight: 6.6,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [156, 148, 140],
      fontStyle: "normal",
      fontSize: 7.2,
    },
    bodyStyles: {
      fontStyle: "normal",
    },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.56 },
      1: { cellWidth: contentWidth * 0.14 },
      2: { cellWidth: contentWidth * 0.15, halign: "right" },
      3: { cellWidth: contentWidth * 0.15, halign: "right" },
    },
    margin: { left: margin, right: marginRight, top: margin + logoHeight + 6 },
    didDrawCell: (data) => {
      if (data.section === "head" && data.column.index === 0) {
        const lineY = data.cell.y + data.cell.height;
        const tableData = data.table as any;
        const tableLeft = tableData?.startX ?? margin;
        const tableWidth = tableData?.width ?? contentWidth;
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.2);
        if (Number.isFinite(tableLeft) && Number.isFinite(tableWidth) && Number.isFinite(lineY)) {
          doc.line(tableLeft, lineY, tableLeft + tableWidth, lineY);
        }
      }
    },
    didDrawPage: () => {
      adicionarTimbrado();
    },
  });

  const tableFinalY = (doc as any).lastAutoTable?.finalY ?? tableStartY;
  const tableContainerHeight = tableFinalY - tableStartY + tablePadding * 2;

  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.35);
  doc.roundedRect(margin, tableContainerY, contentWidth, tableContainerHeight, 5, 5, "S");

  yPos = tableContainerY + tableContainerHeight + 8;

  const escopoItens = proposta.descricao
    ? proposta.descricao
        .split(/\r?\n|\s*;\s*/)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  const condicoesItens: string[] = [];
  if (proposta.forma_pagamento) {
    condicoesItens.push(`Forma: ${getFormaPagamentoLabel(proposta.forma_pagamento)}`);
  }
  if (proposta.percentual_entrada && proposta.exibir_valores) {
    const valorEntrada = (proposta.valor_total * proposta.percentual_entrada) / 100;
    condicoesItens.push(`Entrada ${proposta.percentual_entrada}%: ${formatarMoeda(valorEntrada)}`);
  }
  if (proposta.numero_parcelas && proposta.exibir_valores) {
    const valorRestante =
      proposta.valor_total -
      (proposta.percentual_entrada
        ? (proposta.valor_total * proposta.percentual_entrada) / 100
        : 0);
    const valorParcela = valorRestante / proposta.numero_parcelas;
    condicoesItens.push(`Saldo ${proposta.numero_parcelas}x: ${formatarMoeda(valorParcela)}`);
  }
  if (proposta.prazo_execucao_dias) {
    condicoesItens.push(`Prazo de execucao: ${proposta.prazo_execucao_dias} dias`);
  }
  if (proposta.validade_dias) {
    condicoesItens.push(`Validade: ${proposta.validade_dias} dias`);
  }

  const dadosBancariosItens: string[] = [];
  if (dadosBancarios?.banco) {
    dadosBancariosItens.push(`Banco: ${dadosBancarios.banco}`);
  }
  if (dadosBancarios?.agencia) {
    dadosBancariosItens.push(`Agencia: ${dadosBancarios.agencia}`);
  }
  if (dadosBancarios?.conta) {
    dadosBancariosItens.push(`Conta: ${dadosBancarios.conta}`);
  }
  if (dadosBancarios?.tipo_conta) {
    dadosBancariosItens.push(`Tipo: ${dadosBancarios.tipo_conta}`);
  }
  if (dadosBancarios?.pix_chave) {
    const pixLabel = dadosBancarios.pix_tipo
      ? `Pix (${dadosBancarios.pix_tipo})`
      : "Pix";
    dadosBancariosItens.push(`${pixLabel}: ${dadosBancarios.pix_chave}`);
  }

  const desenharBloco = (titulo: string, itens: string[]) => {
    if (itens.length === 0) return;

    const padding = 5;
    const lineHeight = 4;
    const blocoAltura = padding * 2 + 5 + itens.length * lineHeight;

    if (yPos > pageHeight - blocoAltura - 15) {
      doc.addPage();
      adicionarTimbrado();
      yPos = margin + logoHeight + 8;
    }

    doc.setDrawColor(231, 222, 210);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, yPos, contentWidth, blocoAltura, 3, 3, "FD");

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(43, 42, 40);
    doc.text(sanitizarTextoPDF(titulo), margin + padding, yPos + padding + 2);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(92, 81, 72);

    itens.forEach((item, index) => {
      const linhaY = yPos + padding + 6 + index * lineHeight;
      doc.text(`- ${sanitizarTextoPDF(item)}`, margin + padding, linhaY);
    });

    yPos += blocoAltura + 8;
  };

  const desenharBlocoColunas = (
    titulo: string,
    itensEsquerda: string[],
    itensDireita: string[],
    tituloDireita?: string
  ) => {
    if (itensEsquerda.length === 0 && itensDireita.length === 0) return;

    const padding = 5;
    const lineHeight = 4;
    const headerHeight = 5;
    const leftHeight = itensEsquerda.length * lineHeight;
    const rightHeight = itensDireita.length * lineHeight;
    const blocoAltura = padding * 2 + headerHeight + Math.max(leftHeight, rightHeight);

    if (yPos > pageHeight - blocoAltura - 15) {
      doc.addPage();
      adicionarTimbrado();
      yPos = margin + logoHeight + 8;
    }

    const colunaGap = 10;
    const colunaWidth = (contentWidth - colunaGap) / 2;
    const esquerdaX = margin + padding;
    const direitaX = margin + colunaWidth + colunaGap + padding;
    const baseY = yPos + padding + 6;

    doc.setDrawColor(231, 222, 210);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, yPos, contentWidth, blocoAltura, 3, 3, "FD");

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(43, 42, 40);
    doc.text(sanitizarTextoPDF(titulo), esquerdaX, yPos + padding + 2);

    if (tituloDireita) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 120, 120);
      doc.text(sanitizarTextoPDF(tituloDireita), direitaX, yPos + padding + 2);
    }

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(92, 81, 72);

    itensEsquerda.forEach((item, index) => {
      const linhaY = baseY + index * lineHeight;
      doc.text(`- ${sanitizarTextoPDF(item)}`, esquerdaX, linhaY);
    });

    itensDireita.forEach((item, index) => {
      const linhaY = baseY + index * lineHeight;
      doc.text(`- ${sanitizarTextoPDF(item)}`, direitaX, linhaY);
    });

    yPos += blocoAltura + 8;
  };

  // ============================================================
  // 5. ESCOPO E CONDICOES
  // ============================================================
  desenharBloco("ESCOPO E ENTREGAVEIS", escopoItens);
  if (dadosBancariosItens.length > 0) {
    desenharBlocoColunas("CONDICOES COMERCIAIS", condicoesItens, dadosBancariosItens, "DADOS BANCARIOS");
  } else {
    desenharBloco("CONDICOES COMERCIAIS", condicoesItens);
  }

  // ============================================================
  // 15. RODAPE
  // ============================================================
  const footerY = pageHeight - 15;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(
    "Esta proposta e valida conforme prazo especificado e esta sujeita a disponibilidade.",
    pageWidth / 2,
    footerY,
    { align: "center" }
  );
  doc.text(
    "Grupo WG Almeida - Arquitetura, Engenharia e Marcenaria",
    pageWidth / 2,
    footerY + 4,
    { align: "center" }
  );

  // ============================================================
  // 15. SALVAR PDF
  // ============================================================
  const fileName = `Proposta_${proposta.numero || proposta.id}_${Date.now()}.pdf`;
  doc.save(fileName);
}


