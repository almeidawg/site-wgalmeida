// src/utils/gerarPdfMarcenaria.ts

const loadPdfLibs = () => Promise.all([import("jspdf"), import("jspdf-autotable")]);

interface Item {
  ambiente: string;
  descricao: string;
  quantidade: number;
  largura: number;
  altura: number;
  profundidade: number;
  acabamento: string;
  valor_total: number;
}

export function gerarPdfMarcenaria(obraId: string, itens: Item[]) {
  void (async () => {
  const [{ default: jsPDF }, { default: autoTable }] = await loadPdfLibs();
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(`Resumo Marcenaria - Obra #${obraId}`, 14, 20);

  const agrupado = itens.reduce((acc, item) => {
    acc[item.ambiente] = acc[item.ambiente] || [];
    acc[item.ambiente].push(item);
    return acc;
  }, {} as Record<string, Item[]>);

  let y = 30;
  let totalGeral = 0;
  const atualizarY = (cursorY: number | undefined) => {
    y = (cursorY ?? y) + 10;
  };

  for (const ambiente of Object.keys(agrupado)) {
    const grupo = agrupado[ambiente];
    const dados = grupo.map((i) => [
      i.descricao,
      i.quantidade,
      `${i.largura}x${i.altura}x${i.profundidade}`,
      i.acabamento,
      `R$ ${i.valor_total.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Descrição", "Qtd", "Medidas", "Acabamento", "Valor"]],
      body: dados,
      styles: { fontSize: 10 },
      didDrawPage: (d) => atualizarY(d.cursor?.y),
    });

    const totalAmbiente = grupo.reduce((soma, i) => soma + i.valor_total, 0);
    totalGeral += totalAmbiente;

    doc.text(`Subtotal ${ambiente}: R$ ${totalAmbiente.toFixed(2)}`, 14, y);
    y += 10;
  }

  doc.setFontSize(12);
  doc.text(`Total Geral: R$ ${totalGeral.toFixed(2)}`, 14, y + 10);
  doc.save(`marcenaria_obra_${obraId}.pdf`);
  })();
}

