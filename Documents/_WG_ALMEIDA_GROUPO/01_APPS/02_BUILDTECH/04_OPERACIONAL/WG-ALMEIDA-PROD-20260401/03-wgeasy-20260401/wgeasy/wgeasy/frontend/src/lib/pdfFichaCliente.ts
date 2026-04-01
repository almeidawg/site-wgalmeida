/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import type jsPDF from "jspdf";
import type { Pessoa, PessoaDocumento } from "@/types/pessoas";
import { obterPessoa, listarDocumentosPessoa } from "@/lib/pessoasApi";
import { formatarTelefone } from "@/utils/formatadores";
import {
  gerarIniciais,
  gerarCorPorNome,
  gerarAvatarUrl,
} from "@/utils/avatarUtils";

interface GerarFichaClienteParams {
  pessoaId: string;
  pessoa?: Pessoa | null;
}

interface AvatarRenderInfo {
  dataUrl?: string | null;
  initials: string;
  color: [number, number, number];
}

const TOP_START_Y = 36;
const PAGE_BOTTOM_MARGIN = 24;
const CARD_RADIUS = 8;
const BRAND_COLOR = [242, 92, 38] as const;
const loadJsPdf = () => import("jspdf");

export async function gerarFichaClientePDF({
  pessoaId,
  pessoa,
}: GerarFichaClienteParams): Promise<void> {
  const { default: JsPdfCtor } = await loadJsPdf();
  const pessoaRegistro = pessoa ?? (await obterPessoa(pessoaId));
  if (!pessoaRegistro) {
    throw new Error("Cadastro do cliente não encontrado.");
  }

  const documentos = await listarDocumentosPessoa(pessoaRegistro.id);
  const avatar = await prepararAvatarParaPdf(pessoaRegistro);

  const doc = new JsPdfCtor({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const leftMargin = 16;
  const rightMargin = 16;
  const contentWidth = pageWidth - leftMargin - rightMargin;

  await aplicarTimbrado(doc, pageWidth);
  adicionarTitulo(doc, pageWidth);

  let cursorY = TOP_START_Y;

  cursorY = ensureSpace(doc, cursorY, 55);
  cursorY = renderHeaderCard(doc, pessoaRegistro, avatar, cursorY, {
    marginX: leftMargin,
    width: contentWidth,
  });

  const infoItens = filtrarItensInformacoes([
    { label: "Cargo / FunçÍo", value: pessoaRegistro.cargo },
    { label: "Unidade", value: pessoaRegistro.unidade },
    { label: "Empresa", value: pessoaRegistro.empresa },
    { label: "CPF", value: pessoaRegistro.cpf },
    { label: "CNPJ", value: pessoaRegistro.cnpj },
    { label: "RG", value: pessoaRegistro.rg },
    { label: "Contato responsável", value: pessoaRegistro.contato_responsavel },
    { label: "PIX", value: pessoaRegistro.pix },
    { label: "Nacionalidade", value: pessoaRegistro.nacionalidade },
    { label: "Estado civil", value: pessoaRegistro.estado_civil },
    { label: "ProfissÍo", value: pessoaRegistro.profissao },
  ]);

  const infoRows = Math.max(1, Math.ceil(infoItens.length / 3));
  cursorY = ensureSpace(doc, cursorY, 26 + infoRows * 14);
  cursorY = renderSection(doc, {
    title: "INFORMAÇÕES GERAIS",
    cursorY,
    marginX: leftMargin,
    width: contentWidth,
    renderBody: (x, y, width) => renderInfoGrid(doc, infoItens, x, y, width, 3),
  });

  const enderecoItens = filtrarItensInformacoes([
    { label: "CEP", value: pessoaRegistro.cep },
    { label: "Logradouro", value: pessoaRegistro.logradouro },
    { label: "Número", value: pessoaRegistro.numero },
    { label: "Complemento", value: pessoaRegistro.complemento },
    { label: "Bairro", value: pessoaRegistro.bairro },
    { label: "Cidade", value: pessoaRegistro.cidade },
    { label: "Estado", value: pessoaRegistro.estado },
    { label: "País", value: pessoaRegistro.pais },
  ]);

  const enderecoRows = Math.max(1, Math.ceil(enderecoItens.length / 3));
  cursorY = ensureSpace(doc, cursorY, 24 + enderecoRows * 14);
  cursorY = renderSection(doc, {
    title: "ENDEREÇO",
    cursorY,
    marginX: leftMargin,
    width: contentWidth,
    renderBody: (x, y, width) =>
      renderInfoGrid(doc, enderecoItens, x, y, width, 3, "Endereço não informado."),
  });

  const obraItens = filtrarItensInformacoes([
    { label: "CEP", value: pessoaRegistro.obra_cep },
    { label: "Logradouro", value: pessoaRegistro.obra_logradouro },
    { label: "Número", value: pessoaRegistro.obra_numero },
    { label: "Complemento", value: pessoaRegistro.obra_complemento },
    { label: "Bairro", value: pessoaRegistro.obra_bairro },
    { label: "Cidade", value: pessoaRegistro.obra_cidade },
    { label: "Estado", value: pessoaRegistro.obra_estado },
  ]);

  if (pessoaRegistro.tipo === "CLIENTE" || obraItens.length > 0) {
    const obraRows = Math.max(1, Math.ceil(Math.max(1, obraItens.length) / 3));
    cursorY = ensureSpace(doc, cursorY, 24 + obraRows * 14);
    cursorY = renderSection(doc, {
      title: "ENDEREÇO DA OBRA",
      cursorY,
      marginX: leftMargin,
      width: contentWidth,
      renderBody: (x, y, width) =>
        renderInfoGrid(
          doc,
          obraItens,
          x,
          y,
          width,
          3,
          "Endereço da obra não informado."
        ),
    });
  }

  const documentosEstimativa = documentos.length > 0 ? 32 + documentos.length * 12 : 32;
  cursorY = ensureSpace(doc, cursorY, documentosEstimativa);
  cursorY = renderSection(doc, {
    title: "DOCUMENTOS",
    cursorY,
    marginX: leftMargin,
    width: contentWidth,
    renderBody: (x, y, width) => renderDocumentos(doc, documentos, x, y, width),
  });

  if (pessoaRegistro.observacoes) {
    const texto = doc.splitTextToSize(pessoaRegistro.observacoes, contentWidth - 16);
    const obsAltura = 24 + texto.length * 4;
    cursorY = ensureSpace(doc, cursorY, obsAltura);
    cursorY = renderSection(doc, {
      title: "OBSERVAÇÕES",
      cursorY,
      marginX: leftMargin,
      width: contentWidth,
      renderBody: (x, y) => {
        doc.setFontSize(9);
        doc.setTextColor(70, 70, 70);
        doc.text(texto, x, y);
        return y + texto.length * 4 + 2;
      },
    });
  }

  const safeNome = pessoaRegistro.nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-\s]/g, "")
    .trim()
    .replace(/\s+/g, "-");

  doc.save(`Ficha-${safeNome || pessoaRegistro.id}.pdf`);
}

async function aplicarTimbrado(doc: jsPDF, pageWidth: number) {
  try {
    const img = await carregarImagem("/timbrado-wg.png");
    if (!img) return;

    const imgHeight = (img.height * pageWidth) / img.width;
    doc.addImage(img, "PNG", 0, 0, pageWidth, imgHeight);
  } catch (error) {
    console.warn("não foi possível carregar o papel timbrado WG:", error);
  }
}

function adicionarTitulo(doc: jsPDF, pageWidth: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(46, 46, 46);
  doc.text("FICHA CADASTRAL DO CLIENTE", pageWidth / 2, 28, {
    align: "center",
  });
}

function ensureSpace(doc: jsPDF, currentY: number, estimatedHeight: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (currentY + estimatedHeight > pageHeight - PAGE_BOTTOM_MARGIN) {
    doc.addPage();
    return TOP_START_Y - 6; // novo topo
  }
  return currentY;
}

function filtrarItensInformacoes(
  itens: { label: string; value?: string | null }[]
): { label: string; value: string }[] {
  return itens
    .filter((item) => item.value && String(item.value).trim().length > 0)
    .map((item) => ({ label: item.label, value: String(item.value).trim() }));
}

function renderSection(
  doc: jsPDF,
  params: {
    title: string;
    cursorY: number;
    marginX: number;
    width: number;
    renderBody: (x: number, y: number, innerWidth: number) => number;
  }
): number {
  const { title, cursorY, marginX, width, renderBody } = params;
  const innerX = marginX + 8;
  const innerWidth = width - 16;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(46, 46, 46);
  doc.text(title, innerX, cursorY + 12);

  let nextY = renderBody(innerX, cursorY + 20, innerWidth);
  const cardHeight = nextY - cursorY + 8;

  doc.setDrawColor(232, 232, 232);
  doc.roundedRect(marginX, cursorY, width, cardHeight, CARD_RADIUS, CARD_RADIUS, "S");

  return cursorY + cardHeight + 10;
}

function renderInfoGrid(
  doc: jsPDF,
  itens: { label: string; value: string }[],
  startX: number,
  startY: number,
  width: number,
  columns = 3,
  emptyFallback = "Campo não informado."
): number {
  if (itens.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(130, 130, 130);
    doc.text(emptyFallback, startX, startY + 2);
    return startY + 6;
  }

  const colWidth = width / columns;
  const rowHeight = 12;
  let maxY = startY;

  itens.forEach((item, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;

    const baseX = startX + col * colWidth;
    const baseY = startY + row * rowHeight;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(140, 140, 140);
    doc.text(item.label.toUpperCase(), baseX, baseY);

    const valorLines = doc.splitTextToSize(item.value, colWidth - 2);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(46, 46, 46);
    doc.text(valorLines, baseX, baseY + 5);

    const altura = baseY + 5 + valorLines.length * 4;
    if (altura > maxY) {
      maxY = altura;
    }
  });

  const totalRows = Math.ceil(itens.length / columns);
  const gridHeight = Math.max(totalRows * rowHeight, maxY - startY);

  return startY + gridHeight + 4;
}

function renderDocumentos(
  doc: jsPDF,
  documentos: PessoaDocumento[],
  startX: number,
  startY: number,
  width: number
): number {
  if (!documentos.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(130, 130, 130);
    doc.text("Nenhum documento cadastrado.", startX, startY + 2);
    return startY + 6;
  }

  let cursor = startY;

  documentos.forEach((documento) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.text(documento.tipo?.toUpperCase() || "DOCUMENTO", startX, cursor);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(46, 46, 46);
    const descricao =
      documento.nome || documento.descricao || "Sem descriçÍo disponível";
    const lines = doc.splitTextToSize(descricao, width - 4);
    doc.text(lines, startX, cursor + 5);
    cursor += lines.length * 4 + 5;

    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    const validade = documento.validade
      ? new Date(documento.validade).toLocaleDateString("pt-BR")
      : "Sem validade";
    doc.text(`Validade: ${validade}`, startX, cursor + 2);
    cursor += 10;

    doc.setDrawColor(238, 238, 238);
    doc.line(startX, cursor, startX + width, cursor);
    cursor += 6;
  });

  return cursor;
}

function renderHeaderCard(
  doc: jsPDF,
  pessoa: Pessoa,
  avatar: AvatarRenderInfo,
  cursorY: number,
  { marginX, width }: { marginX: number; width: number }
): number {
  const padding = 12;
  const avatarSize = 28;
  const innerX = marginX + padding;

  const avatarX = innerX;
  const avatarY = cursorY + padding;

  const labelTipo = pessoa.tipo ? pessoa.tipo.toUpperCase() : "CLIENTE";
  const telefoneFormatado = pessoa.telefone
    ? formatarTelefoneSeguro(pessoa.telefone)
    : null;

  const textX = avatarX + avatarSize + 10;
  let workingY = avatarY + 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2]);
  doc.text("FICHA", innerX, cursorY + 9);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(130, 130, 130);
  doc.text(labelTipo, textX, workingY);
  workingY += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(30, 30, 30);
  const nomeLines = doc.splitTextToSize(pessoa.nome, width - (textX - marginX) - 10);
  doc.text(nomeLines, textX, workingY);
  workingY += nomeLines.length * 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(70, 70, 70);
  if (pessoa.email) {
    const emailLines = doc.splitTextToSize(pessoa.email, width - (textX - marginX) - 10);
    doc.text(emailLines, textX, workingY + 2);
    workingY += emailLines.length * 4 + 2;
  }

  if (telefoneFormatado) {
    doc.text(telefoneFormatado, textX, workingY + 4);
    workingY += 6;
  }

  if (avatar.dataUrl) {
    doc.addImage(avatar.dataUrl, "PNG", avatarX, avatarY, avatarSize, avatarSize);
  } else {
    doc.setFillColor(...avatar.color);
    doc.circle(
      avatarX + avatarSize / 2,
      avatarY + avatarSize / 2,
      avatarSize / 2,
      "F"
    );
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(
      avatar.initials,
      avatarX + avatarSize / 2,
      avatarY + avatarSize / 2 + 3,
      { align: "center" }
    );
  }

  const cardHeight = Math.max(avatarSize + padding * 2, workingY - cursorY + padding);

  doc.setDrawColor(233, 233, 233);
  doc.roundedRect(marginX, cursorY, width, cardHeight, CARD_RADIUS, CARD_RADIUS, "S");

  return cursorY + cardHeight + 12;
}

async function prepararAvatarParaPdf(pessoa: Pessoa): Promise<AvatarRenderInfo> {
  const initials = gerarIniciais(pessoa.nome || "WG");
  const colorHex = gerarCorPorNome(pessoa.nome || "WG");
  const color = hexToRgb(colorHex);

  const candidatos = [
    pessoa.avatar_url,
    pessoa.foto_url,
    (pessoa as any).avatar,
    gerarAvatarUrl(pessoa.nome),
  ].filter(Boolean) as string[];

  for (const raw of candidatos) {
    const url = ajustarFormatoAvatar(raw);
    const dataUrl = await carregarDataUrl(url);
    if (dataUrl) {
      return { dataUrl, initials, color };
    }
  }

  return { initials, color };
}

function formatarTelefoneSeguro(telefone: string): string {
  try {
    return formatarTelefone(telefone);
  } catch {
    return telefone;
  }
}

function ajustarFormatoAvatar(url: string): string {
  if (!url) return url;
  if (url.includes("ui-avatars") && url.includes("format=svg")) {
    return url.replace("format=svg", "format=png");
  }
  return url;
}

async function carregarDataUrl(url?: string | null): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith("data:")) return url;

  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const blob = await resp.blob();
    return await blobToDataUrl(blob);
  } catch (error) {
    console.warn("não foi possível carregar avatar para PDF:", error);
    return null;
  }
}

async function carregarImagem(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}



