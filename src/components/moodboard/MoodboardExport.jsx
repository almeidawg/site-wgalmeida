import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Share2, Link, Mail, Copy, Check, FileImage, FileText } from 'lucide-react';

const MoodboardExport = ({ colors, styles, onExport, moodboardId }) => {
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const shareUrl = moodboardId
    ? `${window.location.origin}/moodboard/share/${moodboardId}`
    : null;

  const handleCopyLink = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportImage = async () => {
    setExporting(true);
    try {
      // Captura o canvas do moodboard como imagem
      const canvas = document.getElementById('moodboard-canvas');
      if (canvas && onExport) {
        await onExport('image');
      }
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      if (onExport) {
        await onExport('pdf');
      }
    } finally {
      setExporting(false);
    }
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent('Meu Moodboard - WG Almeida');
    const body = encodeURIComponent(
      `Confira meu moodboard de design de interiores!\n\nCores selecionadas: ${colors.join(', ')}\nEstilos: ${styles.map((s) => s.name).join(', ')}\n\n${shareUrl || 'Acesse o site para ver mais.'}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Confira meu moodboard de design de interiores na WG Almeida! ${shareUrl || window.location.href}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const canExport = colors.length > 0 || styles.length > 0;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-4 h-full w-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <Download className="w-5 h-5 text-wg-orange" />
        Exportar & Compartilhar
      </h3>

      {!canExport ? (
        <p className="text-sm text-gray-500">
          Adicione cores e estilos ao seu moodboard para poder exportar.
        </p>
      ) : (
        <>
          {/* Export Options */}
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportImage}
              disabled={exporting}
              className="flex items-center justify-center gap-2 p-4 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
            >
              <FileImage className="w-5 h-5 text-gray-700" />
              <span className="text-sm font-medium text-gray-700">
                {exporting ? 'Exportando...' : 'Salvar Imagem'}
              </span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportPDF}
              disabled={exporting}
              className="flex items-center justify-center gap-2 p-4 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
            >
              <FileText className="w-5 h-5 text-gray-700" />
              <span className="text-sm font-medium text-gray-700">
                {exporting ? 'Exportando...' : 'Salvar PDF'}
              </span>
            </motion.button>
          </div>

          {/* Share Options */}
          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600 mb-3">Compartilhar:</p>

            <div className="flex flex-wrap gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Link className="w-4 h-4" />
                    Copiar Link
                  </>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShareWhatsApp}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm"
              >
                <Share2 className="w-4 h-4" />
                WhatsApp
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShareEmail}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"
              >
                <Mail className="w-4 h-4" />
                Email
              </motion.button>
            </div>
          </div>

          {/* Summary */}
          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600 mb-2">Resumo do Moodboard:</p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• {colors.length} cor(es) selecionada(s)</li>
              <li>• {styles.length} estilo(s) de referência</li>
            </ul>
          </div>
        </>
      )}

      {/* CTA for logged in features */}
      <div className="pt-4 border-t border-gray-100">
        <div className="bg-wg-orange/10 rounded-xl p-4">
          <p className="text-sm font-medium text-gray-800 mb-2">
            Quer ver esse moodboard aplicado no seu espaço?
          </p>
          <p className="text-xs text-gray-600 mb-3">
            Use nossa ferramenta para visualizar seu ambiente com as cores e estilos que você escolheu!
          </p>
          <a
            href="/room-visualizer"
            className="inline-flex items-center gap-2 px-5 py-3 bg-wg-orange text-white rounded-xl text-sm font-semibold hover:bg-wg-orange/90 transition-colors shadow-lg"
          >
            Vivencie esta Experiência!
          </a>
        </div>
      </div>
    </div>
  );
};

export default MoodboardExport;
