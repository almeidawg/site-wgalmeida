export async function exportarOrcamentoComoPDF() {
  const el = document.getElementById("orcamento-pdf");
  if (!el) {
    alert("Não foi possível encontrar o conteúdo do orçamento para exportar.");
    return;
  }
  // Garante fundo branco
  el.style.background = '#fff';
  // Pequeno delay para garantir renderização de imagens
  setTimeout(async () => {
    const html2pdfModule = await import("html2pdf.js");
    const html2pdf = (html2pdfModule.default ?? html2pdfModule) as () => any;

    html2pdf()
      .set({
        margin: 0,
        filename: `Orcamento_WG_Easy.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 3, useCORS: true, backgroundColor: '#fff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      })
      .from(el)
      .save();
  }, 400);
}

