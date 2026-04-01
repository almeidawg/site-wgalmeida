/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// UTILIDADES: GeraçÍo de PDF de Dados Bancários da Empresa
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import type { EmpresaGrupo, ContaBancaria } from "@/types/empresas";
import {
  formatarCNPJ,
  formatarAgencia,
  formatarConta,
  formatarBanco,
  formatarChavePix,
  getTipoContaLabel,
  getTipoChavePixLabel,
} from "@/types/empresas";

const loadJsPdf = () => import("jspdf");

interface PdfOptions {
  exibir_empresa?: boolean;
  exibir_endereco?: boolean;
  exibir_contato?: boolean;
  exibir_dados_bancarios?: boolean;
  titulo?: string;
  mensagem_rodape?: string;
}

/**
 * Gera PDF com dados bancários da empresa
 * Pode ser usado para compartilhamento ou impressÍo interna
 */
export async function gerarEmpresaPDF(
  empresa: EmpresaGrupo,
  conta: ContaBancaria,
  options: PdfOptions = {}
) {
  const { default: jsPDF } = await loadJsPdf();
  const {
    exibir_empresa = true,
    exibir_endereco = true,
    exibir_contato = true,
    exibir_dados_bancarios = true,
    titulo = "DADOS BANCÁRIOS",
    mensagem_rodape = "Documento gerado automaticamente pelo Sistema WG Easy",
  } = options;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // Adicionar timbrado se existir
  try {
    const img = new Image();
    img.src = "/timbrado-wg.png";

    await new Promise((resolve, reject) => {
      img.onload = () => {
        const imgWidth = pageWidth;
        const imgHeight = (img.height * imgWidth) / img.width;
        doc.addImage(img, "PNG", 0, 0, imgWidth, imgHeight);
        resolve(true);
      };
      img.onerror = () => resolve(false); // Continua sem timbrado
    });
  } catch (error) {
    console.warn("Timbrado não disponível");
  }

  let yPos = 45;

  // TÍTULO
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(242, 92, 38);
  doc.text(titulo, pageWidth / 2, yPos, { align: "center" });
  yPos += 15;

  // DADOS DA EMPRESA
  if (exibir_empresa) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(46, 46, 46);
    doc.text("EMPRESA", margin, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // RazÍo Social
    doc.setFont("helvetica", "bold");
    doc.text("RazÍo Social:", margin, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(empresa.razao_social, margin + 35, yPos);
    yPos += 6;

    // Nome Fantasia
    if (empresa.nome_fantasia !== empresa.razao_social) {
      doc.setFont("helvetica", "bold");
      doc.text("Nome Fantasia:", margin, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(empresa.nome_fantasia, margin + 35, yPos);
      yPos += 6;
    }

    // CNPJ
    doc.setFont("helvetica", "bold");
    doc.text("CNPJ:", margin, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(formatarCNPJ(empresa.cnpj), margin + 35, yPos);
    yPos += 6;

    // Inscrições
    if (empresa.inscricao_estadual) {
      doc.setFont("helvetica", "bold");
      doc.text("InscriçÍo Estadual:", margin, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(empresa.inscricao_estadual, margin + 35, yPos);
      yPos += 6;
    }

    if (empresa.inscricao_municipal) {
      doc.setFont("helvetica", "bold");
      doc.text("InscriçÍo Municipal:", margin, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(empresa.inscricao_municipal, margin + 35, yPos);
      yPos += 6;
    }

    yPos += 5;
  }

  // ENDEREÇO
  if (exibir_endereco && empresa.logradouro) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(46, 46, 46);
    doc.text("ENDEREÇO", margin, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const enderecoCompleto = [
      empresa.logradouro,
      empresa.numero ? `nº ${empresa.numero}` : null,
      empresa.complemento,
    ]
      .filter(Boolean)
      .join(", ");

    doc.text(enderecoCompleto, margin, yPos);
    yPos += 6;

    if (empresa.bairro || empresa.cidade || empresa.estado) {
      const localidade = [empresa.bairro, empresa.cidade, empresa.estado]
        .filter(Boolean)
        .join(" - ");
      doc.text(localidade, margin, yPos);
      yPos += 6;
    }

    if (empresa.cep) {
      doc.text(`CEP: ${empresa.cep}`, margin, yPos);
      yPos += 6;
    }

    yPos += 5;
  }

  // CONTATO
  if (exibir_contato && (empresa.email || empresa.telefone)) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(46, 46, 46);
    doc.text("CONTATO", margin, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    if (empresa.email) {
      doc.setFont("helvetica", "bold");
      doc.text("E-mail:", margin, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(empresa.email, margin + 20, yPos);
      yPos += 6;
    }

    if (empresa.telefone) {
      doc.setFont("helvetica", "bold");
      doc.text("Telefone:", margin, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(empresa.telefone, margin + 20, yPos);
      yPos += 6;
    }

    yPos += 5;
  }

  // DADOS BANCÁRIOS
  if (exibir_dados_bancarios) {
    // Linha de separaçÍo
    doc.setDrawColor(242, 92, 38);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(242, 92, 38);
    doc.text("DADOS BANCÁRIOS", margin, yPos);
    yPos += 10;

    // Caixa com fundo cinza claro
    const boxY = yPos;
    const boxHeight = 60;

    doc.setFillColor(245, 245, 245);
    doc.rect(margin, boxY, pageWidth - margin * 2, boxHeight, "F");

    yPos = boxY + 8;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(46, 46, 46);

    // Banco
    doc.setFont("helvetica", "bold");
    doc.text("Banco:", margin + 5, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(formatarBanco(conta.banco_codigo, conta.banco_nome), margin + 25, yPos);
    yPos += 8;

    // Agência
    doc.setFont("helvetica", "bold");
    doc.text("Agência:", margin + 5, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(formatarAgencia(conta.agencia, conta.agencia_digito), margin + 25, yPos);
    yPos += 8;

    // Conta
    doc.setFont("helvetica", "bold");
    doc.text("Conta:", margin + 5, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${formatarConta(conta.conta, conta.conta_digito)} (${getTipoContaLabel(conta.tipo_conta)})`,
      margin + 25,
      yPos
    );
    yPos += 8;

    // PIX (se houver)
    if (conta.pix_tipo && conta.pix_chave) {
      doc.setFont("helvetica", "bold");
      doc.text("PIX:", margin + 5, yPos);
      doc.setFont("helvetica", "normal");
      const pixTexto = `${getTipoChavePixLabel(conta.pix_tipo)}: ${formatarChavePix(
        conta.pix_tipo,
        conta.pix_chave
      )}`;
      doc.text(pixTexto, margin + 25, yPos);
      yPos += 8;
    }

    // Apelido (se houver)
    if (conta.apelido) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`(${conta.apelido})`, margin + 5, yPos);
    }

    yPos = boxY + boxHeight + 10;
  }

  // RODAPÉ
  const footerY = pageHeight - 20;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(mensagem_rodape, pageWidth / 2, footerY, { align: "center" });
  doc.text(
    `Emitido em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString(
      "pt-BR",
      { hour: "2-digit", minute: "2-digit" }
    )}`,
    pageWidth / 2,
    footerY + 4,
    { align: "center" }
  );

  // Salvar PDF
  const fileName = `Dados_Bancarios_${empresa.nome_fantasia.replace(/\s+/g, "_")}_${new Date().getTime()}.pdf`;
  doc.save(fileName);
}

/**
 * Gera PDF para compartilhamento (sem informações sensíveis opcionais)
 */
export async function gerarEmpresaPDFCompartilhamento(
  empresa: EmpresaGrupo,
  conta: ContaBancaria,
  destinatario?: string
) {
  const titulo = destinatario
    ? `DADOS BANCÁRIOS - ${destinatario.toUpperCase()}`
    : "DADOS BANCÁRIOS PARA PAGAMENTO";

  await gerarEmpresaPDF(empresa, conta, {
    exibir_empresa: true,
    exibir_endereco: true,
    exibir_contato: true,
    exibir_dados_bancarios: true,
    titulo,
    mensagem_rodape: "Utilize estes dados para realizar pagamentos ou transferências bancárias.",
  });
}

/**
 * Gera PDF completo (uso interno)
 */
export async function gerarEmpresaPDFCompleto(empresa: EmpresaGrupo, conta: ContaBancaria) {
  await gerarEmpresaPDF(empresa, conta, {
    exibir_empresa: true,
    exibir_endereco: true,
    exibir_contato: true,
    exibir_dados_bancarios: true,
    titulo: "DADOS COMPLETOS DA EMPRESA",
    mensagem_rodape: "Documento confidencial - Uso interno - Sistema WG Easy",
  });
}



