import { useCallback, useState } from 'react';
import html2canvas from 'html2canvas';

/**
 * Hook para exportar moodboard como imagem ou PDF
 * Usa API nativa de impressão para PDF (mais compatível)
 */
const useMoodboardExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Exporta o moodboard como imagem PNG
   */
  const exportAsImage = useCallback(async (elementId = 'moodboard-canvas') => {
    setIsExporting(true);
    setError(null);

    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Elemento do moodboard não encontrado');
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      // Cria link de download
      const link = document.createElement('a');
      link.download = `moodboard-wg-almeida-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      return true;
    } catch (err) {
      setError(err.message);
      console.error('Erro ao exportar imagem:', err);
      return false;
    } finally {
      setIsExporting(false);
    }
  }, []);

  /**
   * Exporta o moodboard como PDF usando a API de impressão nativa
   * Mais compatível e não requer bibliotecas externas problemáticas
   */
  const exportAsPDF = useCallback(async (elementId = 'moodboard-canvas') => {
    setIsExporting(true);
    setError(null);

    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Elemento do moodboard não encontrado');
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      // Abre janela de impressão com a imagem (usuário pode salvar como PDF)
      const imgData = canvas.toDataURL('image/png');

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Moodboard - WG Almeida</title>
              <style>
                body { margin: 0; padding: 20px; display: flex; justify-content: center; }
                img { max-width: 100%; height: auto; }
                @media print {
                  body { padding: 0; }
                  img { max-width: 100%; page-break-inside: avoid; }
                }
              </style>
            </head>
            <body>
              <img src="${imgData}" alt="Moodboard WG Almeida" />
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.print();
                  }, 500);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }

      return true;
    } catch (err) {
      setError(err.message);
      console.error('Erro ao exportar PDF:', err);
      return false;
    } finally {
      setIsExporting(false);
    }
  }, []);

  /**
   * Gera URL compartilhável (base64)
   */
  const generateShareableUrl = useCallback(async (moodboardData) => {
    try {
      const encoded = btoa(JSON.stringify(moodboardData));
      const url = `${window.location.origin}/moodboard/share?data=${encoded}`;
      return url;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  /**
   * Copia imagem para clipboard
   */
  const copyToClipboard = useCallback(async (elementId = 'moodboard-canvas') => {
    setIsExporting(true);
    setError(null);

    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Elemento do moodboard não encontrado');
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      canvas.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
        }
      });

      return true;
    } catch (err) {
      setError(err.message);
      console.error('Erro ao copiar:', err);
      return false;
    } finally {
      setIsExporting(false);
    }
  }, []);

  return {
    exportAsImage,
    exportAsPDF,
    generateShareableUrl,
    copyToClipboard,
    isExporting,
    error,
  };
};

export default useMoodboardExport;
