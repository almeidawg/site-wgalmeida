// src/utils/gerarPdfFinanceiro.ts

interface Lancamento {
  descricao: string;
  tipo: string;
  valor: number;
  vencimento: string;
  status: string;
}

export async function gerarPdfFinanceiro(lancamentos: Lancamento[]) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Resumo Financeiro", 14, 20);

  if (lancamentos.length === 0) {
    doc.setFontSize(12);
    doc.text("Nenhum lançamento cadastrado.", 14, 30);
  } else {
    autoTable(doc, {
      startY: 30,
      head: [["Descrição", "Tipo", "Valor", "Vencimento", "Status"]],
      body: lancamentos.map(l => [l.descricao, l.tipo, `R$ ${l.valor.toFixed(2)}`, l.vencimento, l.status]),
      styles: { fontSize: 10 },
    });

    const total = lancamentos.reduce((soma, l) => soma + l.valor, 0);
    doc.setFontSize(12);
    const docWithTable = doc as { lastAutoTable?: { finalY?: number } };
    const finalY = docWithTable.lastAutoTable?.finalY ?? 0;
    doc.text(`Total Geral: R$ ${total.toFixed(2)}`, 14, finalY + 10);
  }

  doc.save("resumo_financeiro.pdf");
}

