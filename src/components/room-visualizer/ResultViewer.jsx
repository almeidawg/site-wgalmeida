import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Share2,
  RefreshCw,
  ZoomIn,
  Maximize2,
  ArrowLeftRight,
  Save,
  Heart,
  X,
} from 'lucide-react';

const ResultViewer = ({
  originalImage,
  generatedImage,
  onRegenerate,
  onSave,
  onDownload,
  onShare,
  isLoading = false,
}) => {
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'original' | 'generated' | 'slider'
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async () => {
    await onSave?.();
    setIsSaved(true);
  };

  const handleSliderMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.min(100, Math.max(0, percentage)));
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Resultado</h3>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'split'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              Dividido
            </button>
            <button
              onClick={() => setViewMode('slider')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'slider'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              Slider
            </button>
          </div>

          <button
            onClick={() => setIsFullscreen(true)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Image Viewer */}
      <div className="relative">
        {viewMode === 'split' && (
          <div className="grid grid-cols-2 gap-1">
            <div className="relative aspect-video">
              <img
                src={originalImage}
                alt="Original"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
                Original
              </span>
            </div>
            <div className="relative aspect-video">
              <img
                src={generatedImage}
                alt="Gerado"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2 right-2 px-2 py-1 bg-wg-orange text-white text-xs rounded">
                Visualização IA
              </span>
            </div>
          </div>
        )}

        {viewMode === 'slider' && (
          <div
            className="relative aspect-video cursor-ew-resize select-none"
            onMouseMove={handleSliderMove}
            onTouchMove={(e) => {
              const touch = e.touches[0];
              const rect = e.currentTarget.getBoundingClientRect();
              const x = touch.clientX - rect.left;
              const percentage = (x / rect.width) * 100;
              setSliderPosition(Math.min(100, Math.max(0, percentage)));
            }}
          >
            {/* Generated Image (Full) */}
            <img
              src={generatedImage}
              alt="Gerado"
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Original Image (Clipped) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              <img
                src={originalImage}
                alt="Original"
                className="w-full h-full object-cover"
                style={{ width: `${100 / (sliderPosition / 100)}%` }}
              />
            </div>

            {/* Slider Handle */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                <ArrowLeftRight className="w-4 h-4 text-gray-600" />
              </div>
            </div>

            {/* Labels */}
            <span className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
              Original
            </span>
            <span className="absolute bottom-2 right-2 px-2 py-1 bg-wg-orange text-white text-xs rounded">
              Visualização IA
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 bg-gray-50 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRegenerate}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Gerar Novamente
          </motion.button>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isSaved
                ? 'bg-green-100 text-green-700'
                : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {isSaved ? (
              <>
                <Heart className="w-4 h-4 fill-current" />
                Salvo
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar
              </>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDownload}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onShare}
            className="flex items-center gap-2 px-4 py-2 bg-wg-orange text-white rounded-lg text-sm font-medium hover:bg-wg-orange/90 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Compartilhar
          </motion.button>
        </div>
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          >
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <img
              src={generatedImage}
              alt="Visualização IA"
              className="max-w-full max-h-full object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResultViewer;
