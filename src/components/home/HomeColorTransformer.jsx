import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, Check, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

// Configuração do Cloudinary
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'moodboard_unsigned';

// 3 Paletas de cores predefinidas
const COLOR_PALETTES = [
  {
    id: 'terrosos',
    name: 'Tons Terrosos',
    colors: ['#8B4513', '#D2691E', '#DEB887', '#F5DEB3', '#CD853F'],
    element: 'walls',
    mainColor: '#D2691E',
  },
  {
    id: 'azuis',
    name: 'Azuis Modernos',
    colors: ['#1E3A5F', '#3498DB', '#5DADE2', '#85C1E9', '#AED6F1'],
    element: 'walls',
    mainColor: '#3498DB',
  },
  {
    id: 'verdes',
    name: 'Verdes Naturais',
    colors: ['#1D4E3C', '#27AE60', '#58D68D', '#82E0AA', '#ABEBC6'],
    element: 'walls',
    mainColor: '#27AE60',
  },
];

// Imagens de demonstração - Poltrona primeiro
const DEMO_IMAGES = [
  {
    id: 'poltrona',
    name: 'Poltrona',
    externalUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&h=150&fit=crop',
  },
  {
    id: 'sala',
    name: 'Sala',
    externalUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=200&h=150&fit=crop',
  },
  {
    id: 'quarto',
    name: 'Quarto',
    externalUrl: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=200&h=150&fit=crop',
  },
];

// Gera URL com transformação Cloudinary
const generateTransformUrl = (publicId, color, cloudName) => {
  if (!publicId) return null;
  const hexColor = color.replace('#', '');
  return `https://res.cloudinary.com/${cloudName}/image/upload/e_gen_recolor:prompt_walls;to-color_${hexColor};multiple_true/${publicId}`;
};

const HomeColorTransformer = () => {
  const [selectedImage, setSelectedImage] = useState(DEMO_IMAGES[0]);
  const [selectedPalette, setSelectedPalette] = useState(COLOR_PALETTES[0]);
  const [imageData, setImageData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [transformedUrl, setTransformedUrl] = useState(null);

  const containerRef = useRef(null);

  // Upload da imagem para o Cloudinary quando selecionada
  const uploadImage = async (image) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', image.externalUrl);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'home-demo');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );

      if (response.ok) {
        const data = await response.json();
        setImageData({
          publicId: data.public_id,
          url: data.secure_url,
        });
        // Gerar URL transformada
        const url = generateTransformUrl(data.public_id, selectedPalette.mainColor, CLOUDINARY_CLOUD_NAME);
        setTransformedUrl(url);
      } else {
        // Modo demo se falhar
        setImageData({
          publicId: null,
          url: image.externalUrl,
          isDemo: true,
        });
        setTransformedUrl(image.externalUrl);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setImageData({
        publicId: null,
        url: image.externalUrl,
        isDemo: true,
      });
      setTransformedUrl(image.externalUrl);
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar primeira imagem ao montar
  useEffect(() => {
    uploadImage(selectedImage);
  }, []);

  // Atualizar transformação quando mudar paleta
  useEffect(() => {
    if (imageData?.publicId) {
      const url = generateTransformUrl(imageData.publicId, selectedPalette.mainColor, CLOUDINARY_CLOUD_NAME);
      setTransformedUrl(url);
    }
  }, [selectedPalette, imageData?.publicId]);

  // Selecionar nova imagem
  const handleSelectImage = (image) => {
    if (image.id !== selectedImage.id) {
      setSelectedImage(image);
      uploadImage(image);
    }
  };

  // Handler do slider
  const handleSliderMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.min(100, Math.max(0, percentage)));
  }, []);

  // Event listeners para arrastar
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) handleSliderMove(e.clientX);
    };
    const handleTouchMove = (e) => {
      if (isDragging && e.touches[0]) handleSliderMove(e.touches[0].clientX);
    };
    const handleEnd = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, handleSliderMove]);

  return (
    <div className="relative">
      {/* Slider de Comparação */}
      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden shadow-2xl cursor-ew-resize select-none aspect-video bg-gray-800"
        onMouseDown={() => setIsDragging(true)}
        onTouchStart={() => setIsDragging(true)}
      >
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="w-10 h-10 border-4 border-wg-orange border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Imagem Transformada (direita) */}
            <img
              src={transformedUrl || selectedImage.externalUrl}
              alt="Transformado"
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Imagem Original (esquerda, cortada) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              <img
                src={imageData?.url || selectedImage.externalUrl}
                alt="Original"
                className="absolute top-0 left-0 h-full object-cover"
                style={{
                  width: containerRef.current
                    ? `${containerRef.current.offsetWidth}px`
                    : '100%',
                }}
              />
            </div>

            {/* Linha do Slider */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_15px_rgba(0,0,0,0.5)]"
              style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
            >
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center cursor-ew-resize border-2 border-wg-orange">
                <ArrowLeftRight className="w-4 h-4 text-wg-orange" />
              </div>
            </div>

            {/* Labels */}
            <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 text-white text-xs font-medium rounded-lg backdrop-blur-sm">
              ORIGINAL
            </div>
            <div className="absolute top-3 right-3 px-3 py-1 bg-wg-orange text-white text-xs font-medium rounded-lg flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              TRANSFORMADO
            </div>
          </>
        )}

        {/* Paleta de cores flutuante */}
        <div className="absolute bottom-3 left-3 right-3 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/70 mb-1">Paleta: {selectedPalette.name}</p>
              <div className="flex gap-1.5">
                {selectedPalette.colors.map((color, idx) => (
                  <div
                    key={idx}
                    className="w-6 h-6 rounded-full border-2 border-white/50 shadow-lg"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <p className="text-[10px] text-white/50">Arraste para comparar</p>
          </div>
        </div>
      </div>

      {/* Seleção de Paletas */}
      <div className="flex gap-2 mt-4 justify-center">
        {COLOR_PALETTES.map((palette) => (
          <button
            key={palette.id}
            onClick={() => setSelectedPalette(palette)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
              selectedPalette.id === palette.id
                ? 'bg-white/20 ring-2 ring-wg-orange'
                : 'bg-white/10 hover:bg-white/15'
            }`}
          >
            <div className="flex gap-1">
              {palette.colors.slice(0, 3).map((color, idx) => (
                <div
                  key={idx}
                  className="w-4 h-4 rounded-full border border-white/30"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span className="text-xs text-white font-medium hidden sm:inline">{palette.name}</span>
            {selectedPalette.id === palette.id && (
              <Check className="w-3 h-3 text-wg-orange" />
            )}
          </button>
        ))}
      </div>

      {/* Miniaturas de Ambientes */}
      <div className="flex gap-3 mt-4 justify-center">
        {DEMO_IMAGES.map((img) => (
          <button
            key={img.id}
            onClick={() => handleSelectImage(img)}
            className={`relative w-16 h-12 rounded-lg overflow-hidden transition-all ${
              selectedImage.id === img.id
                ? 'ring-2 ring-wg-orange opacity-100'
                : 'border-2 border-white/30 opacity-60 hover:opacity-100'
            }`}
          >
            <img
              src={img.thumbnail}
              alt={img.name}
              className="w-full h-full object-cover"
            />
            {selectedImage.id === img.id && (
              <div className="absolute inset-0 bg-wg-orange/30 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center mt-6">
        <Link
          to="/moodboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-wg-orange text-white rounded-xl font-semibold hover:bg-wg-orange/90 transition-colors shadow-lg"
        >
          Explorar Mais Ambientes
          <ArrowLeftRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default HomeColorTransformer;
