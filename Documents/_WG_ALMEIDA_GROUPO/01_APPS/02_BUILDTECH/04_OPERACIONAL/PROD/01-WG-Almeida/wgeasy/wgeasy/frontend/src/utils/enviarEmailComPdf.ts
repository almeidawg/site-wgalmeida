import emailjs from "@emailjs/browser";

const loadPdfLibs = () => Promise.all([import("jspdf"), import("jspdf-autotable")]);

interface Arquivo {
  nome: string;
  url: string;
}

interface Obra {
  id: number;
  cliente: string;
  endereco: string;
  status: string;
  previsaoEntrega: string;
}

export async function enviarEmailComPdf(
  obra: Obra,
  arquivos: Arquivo[],
  destinatario: string
) {
  const [{ default: jsPDF }, { default: autoTable }] = await loadPdfLibs();
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Ficha Técnica da Obra", 14, 20);

  doc.setFontSize(12);
  doc.text(`ID: ${obra.id}`, 14, 30);
  doc.text(`Cliente: ${obra.cliente}`, 14, 37);
  doc.text(`Endereço: ${obra.endereco}`, 14, 44);
  doc.text(`Status: ${obra.status}`, 14, 51);
  doc.text(
    `PrevisÍo de Entrega: ${new Date(obra.previsaoEntrega).toLocaleDateString("pt-BR")}`,
    14,
    58
  );

  if (arquivos.length > 0) {
    autoTable(doc, {
      startY: 70,
      head: [["Arquivo", "Link"]],
      body: arquivos.map((a) => [a.nome, a.url]),
      styles: { fontSize: 10 },
      columnStyles: { 1: { cellWidth: 100 } },
    });
  }

  const pdfBlob = doc.output("blob");
  const _arquivoGerado = pdfBlob;

  const templateParams = {
    to_email: destinatario,
    subject: `Ficha da Obra #${obra.id}`,
    message: "Segue em anexo a ficha técnica da obra.",
    attachment_name: `obra_${obra.id}_ficha.pdf`,
  };

  try {
    const result = await emailjs.send(
      "YOUR_SERVICE_ID",
      "YOUR_TEMPLATE_ID",
      templateParams,
      "YOUR_PUBLIC_KEY"
    );

    alert("E-mail enviado com sucesso!");
    return result;
  } catch (error) {
    alert("Erro ao enviar e-mail.");
    console.error(error);
  }
}

