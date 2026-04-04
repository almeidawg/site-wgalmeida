import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion-lite';
import {
  ArrowLeftRight,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Palette,
  Sparkles,
} from 'lucide-react';

// Imagens de ambientes de demonstração (Unsplash - alta qualidade)
const DEMO_ROOMS = [
  {
    id: 'sala-moderna',
    name: 'Sala de Estar Moderna',
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200',
    category: 'sala',
  },
  {
    id: 'quarto-classico',
    name: 'Quarto Clássico',
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1200',
    category: 'quarto',
  },
  {
    id: 'cozinha-contemporanea',
    name: 'Cozinha Contemporânea',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200',
    category: 'cozinha',
  },
  {
    id: 'sala-minimalista',
    name: 'Sala Minimalista',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200',
    category: 'sala',
  },
  {
    id: 'quarto-luxo',
    name: 'Suíte de Luxo',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200',
    category: 'quarto',
  },
  {
    id: 'escritorio-home',
    name: 'Home Office',
    image: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=1200',
    category: 'escritorio',
  },
];

// Configuração do Cloudinary
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo';

/**
 * Gera URL do Cloudinary com Generative Recolor
 * @param {string} imageUrl - URL da imagem original
 * @param {string[]} colors - Array de cores hex
 * @returns {string} - URL transformada
 */
const generateRecolorUrl = (imageUrl, colors) => {
  if (!colors || colors.length === 0) return imageUrl;

  // Para demo, usa a cor primária nas paredes
  const primaryColor = colors[0]?.replace('#', '') || 'FFFFFF';

  // Se for uma URL externa, usa fetch + upload no Cloudinary
  // Para simplificar, retornamos a imagem com overlay de cor
  // Em produção, usar a API de Generative Recolor

  // Transformação com overlay de cor (simulação)
  // Em produção: e_gen_recolor:prompt_walls;to-color_${primaryColor}
  return imageUrl;
};

const InteractivePreview = ({ colors = [], styles = [] }) => {
  const [selectedRoom, setSelectedRoom] = useState(DEMO_ROOMS[0]);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [transformedUrl, setTransformedUrl] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  // Simula transformação de imagem
  useEffect(() => {
    if (colors.length > 0 && selectedRoom) {
      setIsLoading(true);

      // Simula delay de processamento da IA
      const timer = setTimeout(() => {
        // Em produção, chamar API do Cloudinary aqui
        setTransformedUrl(generateRecolorUrl(selectedRoom.image, colors));
        setIsLoading(false);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [colors, selectedRoom]);

  // Handler do slider
  const handleSliderMove = useCallback(
    (clientX) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      setSliderPosition(Math.min(100, Math.max(0, percentage)));
    },
    []
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (isDragging) {
        handleSliderMove(e.clientX);
      }
    },
    [isDragging, handleSliderMove]
  );

  const handleTouchMove = useCallback(
    (e) => {
      if (isDragging && e.touches[0]) {
        handleSliderMove(e.touches[0].clientX);
      }
    },
    [isDragging, handleSliderMove]
  );

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', () => setIsDragging(false));
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', () => setIsDragging(false));
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', () => setIsDragging(false));
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', () => setIsDragging(false));
    };
  }, [isDragging, handleMouseMove, handleTouchMove]);

  const handlePrevRoom = () => {
    const currentIndex = DEMO_ROOMS.findIndex((r) => r.id === selectedRoom.id);
    const prevIndex = currentIndex === 0 ? DEMO_ROOMS.length - 1 : currentIndex - 1;
    setSelectedRoom(DEMO_ROOMS[prevIndex]);
  };

  const handleNextRoom = () => {
    const currentIndex = DEMO_ROOMS.findIndex((r) => r.id === selectedRoom.id);
    const nextIndex = currentIndex === DEMO_ROOMS.length - 1 ? 0 : currentIndex + 1;
    setSelectedRoom(DEMO_ROOMS[nextIndex]);
  };

  const hasColors = colors.length > 0;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-wg-orange" />
            Preview Interativo
          </h3>
          {hasColors && (
            <button
              onClick={() => setIsFullscreen(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Arraste a barra para comparar antes e depois das suas cores aplicadas
        </p>
      </div>

      {/* Room Selector */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevRoom}
            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-2">
              {DEMO_ROOMS.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedRoom.id === room.id
                      ? 'bg-wg-orange text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-wg-orange'
                  }`}
                >
                  {room.name}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleNextRoom}
            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="relative">
        {!hasColors ? (
          /* Empty State */
          <div className="aspect-video bg-gray-100 flex flex-col items-center justify-center p-8 text-center">
            <Palette className="w-16 h-16 text-gray-300 mb-4" />
            <h4 className="text-lg font-medium text-gray-600 mb-2">
              Selecione cores para ver o preview
            </h4>
            <p className="text-sm text-gray-500 max-w-sm">
              Escolha cores na paleta ao lado e veja como elas ficam aplicadas neste ambiente
            </p>
          </div>
        ) : (
          /* Slider Compare */
          <div
            ref={containerRef}
            className="relative aspect-video cursor-ew-resize select-none overflow-hidden"
            onMouseDown={() => setIsDragging(true)}
            onTouchStart={() => setIsDragging(true)}
          >
            {/* Transformed Image (Background - Right side) */}
            <div className="absolute inset-0">
              {isLoading ? (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-10 h-10 text-wg-orange animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Aplicando suas cores...</p>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-full">
                  <img
                    src={selectedRoom.image}
                    alt="Transformado"
                    className="w-full h-full object-cover"
                  />
                  {/* Color Overlay - Simula aplicação de cores */}
                  <div
                    className="absolute inset-0 mix-blend-overlay opacity-40"
                    style={{
                      background: `linear-gradient(135deg, ${colors[0] || '#transparent'} 0%, ${
                        colors[1] || colors[0] || 'transparent'
                      } 100%)`,
                    }}
                  />
                </div>
              )}
            </div>

            {/* Original Image (Foreground - Left side, clipped) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              <img
                src={selectedRoom.image}
                alt="Original"
                className="w-full h-full object-cover"
                style={{
                  width: `${100 / (sliderPosition / 100 || 1)}%`,
                  maxWidth: 'none',
                }}
              />
            </div>

            {/* Slider Handle */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.3)]"
              style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
            >
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center cursor-ew-resize">
                <ArrowLeftRight className="w-5 h-5 text-gray-600" />
              </div>
            </div>

            {/* Labels */}
            <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/60 text-white text-sm font-medium rounded-lg">
              Original
            </div>
            <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-wg-orange text-white text-sm font-medium rounded-lg">
              Com suas cores
            </div>

            {/* Selected Colors Preview */}
            <div className="absolute top-4 right-4 flex gap-1">
              {colors.slice(0, 5).map((color, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {hasColors && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              <span className="font-medium">{colors.length}</span> cor(es) aplicada(s)
              {styles.length > 0 && (
                <>
                  {' • '}
                  <span className="font-medium">{styles.length}</span> estilo(s)
                </>
              )}
            </p>
            <button
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => setIsLoading(false), 1500);
              }}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-wg-orange hover:bg-wg-orange/10 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center p-4"
          >
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            <div
              ref={containerRef}
              className="relative w-full max-w-6xl aspect-video cursor-ew-resize select-none overflow-hidden rounded-xl"
              onMouseDown={() => setIsDragging(true)}
              onTouchStart={() => setIsDragging(true)}
            >
              {/* Same slider content as above */}
              <div className="absolute inset-0">
                <div className="relative w-full h-full">
                  <img
                    src={selectedRoom.image}
                    alt="Transformado"
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute inset-0 mix-blend-overlay opacity-40"
                    style={{
                      background: `linear-gradient(135deg, ${colors[0] || 'transparent'} 0%, ${
                        colors[1] || colors[0] || 'transparent'
                      } 100%)`,
                    }}
                  />
                </div>
              </div>

              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPosition}%` }}
              >
                <img
                  src={selectedRoom.image}
                  alt="Original"
                  className="w-full h-full object-cover"
                  style={{
                    width: `${100 / (sliderPosition / 100 || 1)}%`,
                    maxWidth: 'none',
                  }}
                />
              </div>

              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.3)]"
                style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
              >
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center">
                  <ArrowLeftRight className="w-6 h-6 text-gray-600" />
                </div>
              </div>

              <div className="absolute bottom-6 left-6 px-4 py-2 bg-black/60 text-white font-medium rounded-lg">
                Original
              </div>
              <div className="absolute bottom-6 right-6 px-4 py-2 bg-wg-orange text-white font-medium rounded-lg">
                Com suas cores
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InteractivePreview;
