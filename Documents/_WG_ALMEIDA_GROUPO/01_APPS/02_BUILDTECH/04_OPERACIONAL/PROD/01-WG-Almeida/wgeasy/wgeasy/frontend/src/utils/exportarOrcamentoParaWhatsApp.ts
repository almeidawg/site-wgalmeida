export async function exportarOrcamentoParaWhatsApp() {
  const el = document.getElementById("orcamento-pdf");
  if (!el) {
    alert("Não foi possível encontrar o conteúdo do orçamento para exportar.");
    return;
  }
  const html2pdfModule = await import("html2pdf.js");
  const html2pdf = (html2pdfModule.default ?? html2pdfModule) as () => any;

  html2pdf()
    .set({
      margin: 0,
      filename: `Orcamento_WG_Easy.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    })
    .from(el)
    .outputPdf('blob')
    .then((blob: Blob) => {
      const file = new File([blob], 'Orcamento_WG_Easy.pdf', { type: 'application/pdf' });
      const dataTransfer =
        typeof window !== "undefined" && "DataTransfer" in window
          ? new window.DataTransfer()
          : null;
      if (dataTransfer) {
        dataTransfer.items.add(file);
      }
      // Tenta abrir o WhatsApp Web com o arquivo (limitação: envio automático só é possível via interação manual)
      window.open('https://web.whatsapp.com/', '_blank');
      // Exibe instrução para o usuário arrastar o PDF para o chat do WhatsApp Web
      setTimeout(() => {
        alert('PDF gerado! Arraste o arquivo "Orcamento_WG_Easy.pdf" para o chat do WhatsApp Web.');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'Orcamento_WG_Easy.pdf';
        a.click();
      }, 1000);
    });
}

