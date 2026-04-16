import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion-lite';
import {
  ArrowLeftRight,
  Loader2,
  Check,
  Maximize2,
  X,
  Paintbrush,
  Sofa,
  Square,
  Grid3X3,
  Download,
  Share2,
  Mail,
  Copy,
  Image as ImageIcon,
} from 'lucide-react';
import { buildMoodboardSharePayload, buildMoodboardShareUrl } from '@/utils/moodboardShare';
import { normalizeUnsplashImageUrl } from '@/lib/unsplash';

// ============================================
// CONFIGURAÇÃO DO CLOUDINARY
// ============================================
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'moodboard_unsigned';
const CLOUDINARY_UPLOAD_FOLDER = 'moodboard-ambientes';
const CLOUDINARY_TRANSFORMATION_ATTEMPTS = 8;
const CLOUDINARY_TRANSFORMATION_DELAY = 1500;

// Modo demo - quando Cloudinary não está configurado corretamente
const DEMO_MODE = !import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Elementos que podem ser recoloridos
const RECOLOR_ELEMENTS = [
  { id: 'walls', name: 'Paredes', icon: Square, prompt: 'walls' },
  { id: 'sofa', name: 'Sofá', icon: Sofa, prompt: 'sofa couch' },
  { id: 'curtains', name: 'Cortinas', icon: Grid3X3, prompt: 'curtains drapes' },
  { id: 'carpet', name: 'Tapete', icon: Grid3X3, prompt: 'carpet rug' },
  { id: 'pillows', name: 'Almofadas', icon: Square, prompt: 'pillows cushions' },
  { id: 'bedding', name: 'Roupa de Cama', icon: Square, prompt: 'bedding bed sheets' },
  { id: 'chair', name: 'Cadeira', icon: Sofa, prompt: 'chair armchair' },
  { id: 'cabinets', name: 'Armários', icon: Square, prompt: 'cabinets cupboards furniture' },
  { id: 'wood', name: 'Madeira', icon: Square, prompt: 'wood wooden furniture wood panels' },
  { id: 'table', name: 'Mesa', icon: Square, prompt: 'table tabletop dining table' },
  { id: 'marble', name: 'Mármore', icon: Square, prompt: 'marble countertop stone surface' },
  { id: 'floor', name: 'Piso', icon: Grid3X3, prompt: 'floor flooring wooden floor tiles' },
];

// Paletas de cores predefinidas com círculos
const COLOR_PALETTES = [
  {
    id: 'terrosos',
    name: 'Tons Terrosos',
    colors: ['#8B4513', '#D2691E', '#DEB887', '#F5DEB3', '#CD853F'],
  },
  {
    id: 'azuis',
    name: 'Azuis',
    colors: ['#1E3A5F', '#3498DB', '#5DADE2', '#85C1E9', '#AED6F1'],
  },
  {
    id: 'verdes',
    name: 'Verdes',
    colors: ['#1D4E3C', '#27AE60', '#58D68D', '#82E0AA', '#ABEBC6'],
  },
  {
    id: 'neutros',
    name: 'Neutros',
    colors: ['#2C3E50', '#7F8C8D', '#BDC3C7', '#ECF0F1', '#FDFEFE'],
  },
  {
    id: 'quentes',
    name: 'Tons Quentes',
    colors: ['#922B21', '#E74C3C', '#F39C12', '#F1C40F', '#FAD7A0'],
  },
  {
    id: 'rosa',
    name: 'Rosa & Roxo',
    colors: ['#6C3483', '#9B59B6', '#D7BDE2', '#F5B7B1', '#FADBD8'],
  },
  {
    id: 'oceanico',
    name: 'Oceânico',
    colors: ['#0A3D62', '#1B6CA8', '#48C9B0', '#76D7C4', '#D4EFDF'],
  },
  {
    id: 'mediterraneo',
    name: 'Mediterrâneo',
    colors: ['#1A5276', '#F4D03F', '#FFFFFF', '#E67E22', '#2E86AB'],
  },
  {
    id: 'escandinavo',
    name: 'Escandinavo',
    colors: ['#FFFFFF', '#F5F5F5', '#D5D8DC', '#85929E', '#2C3E50'],
  },
  {
    id: 'tropical',
    name: 'Tropical',
    colors: ['#145A32', '#28B463', '#F4D03F', '#E74C3C', '#F39C12'],
  },
];

// Categorias de ambientes
const AMBIENTE_CATEGORIES = [
  { id: 'all', name: 'Todos' },
  { id: 'salas', name: 'Salas' },
  { id: 'quartos', name: 'Quartos' },
  { id: 'cozinhas', name: 'Cozinhas' },
  { id: 'banheiros', name: 'Banheiros' },
  { id: 'escritorios', name: 'Escritórios' },
  { id: 'externos', name: 'Externos' },
];

// Imagens da plataforma organizadas por categoria
const DEMO_IMAGES = [
  // === SALAS ===
  {
    id: 'sala-moderna',
    name: 'Sala Moderna',
    category: 'salas',
    externalUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=300&h=200&fit=crop',
    suggestedElements: ['walls', 'sofa', 'pillows'],
  },
  {
    id: 'sala-minimalista',
    name: 'Sala Minimalista',
    category: 'salas',
    externalUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=300&h=200&fit=crop',
    suggestedElements: ['walls', 'sofa', 'carpet'],
  },
  {
    id: 'sala-jantar',
    name: 'Sala de Jantar',
    category: 'salas',
    externalUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=300&h=200&fit=crop',
    suggestedElements: ['walls', 'table', 'chair'],
  },
  {
    id: 'sala-tv',
    name: 'Sala de TV',
    category: 'salas',
    externalUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=200&fit=crop',
    suggestedElements: ['walls', 'sofa', 'cabinets'],
  },
  {
    id: 'sala-estar',
    name: 'Sala de Estar',
    category: 'salas',
    externalUrl: 'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=300&h=200&fit=crop',
    suggestedElements: ['walls', 'sofa', 'curtains'],
  },

  // === QUARTOS ===
  {
    id: 'quarto-casal',
    name: 'Quarto Casal',
    category: 'quartos',
    externalUrl: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=300&h=200&fit=crop',
    suggestedElements: ['walls', 'bedding', 'curtains'],
  },
  {
    id: 'quarto-casal-2',
    name: 'Suíte Master',
    category: 'quartos',
    externalUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=300&h=200&fit=crop',
    suggestedElements: ['walls', 'bedding', 'floor'],
  },
  {
    id: 'quarto-menina',
    name: 'Quarto Menina',
    category: 'quartos',
    externalUrl: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=300&h=200&fit=crop',
    suggestedElements: ['walls', 'bedding', 'curtains'],
  },
  {
    id: 'quarto-menino',
    name: 'Quarto Menino',
    category: 'quartos',
    externalUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&h=200&fit=crop',
    suggestedElements: ['walls', 'bedding', 'cabinets'],
  },
  {
    id: 'quarto-bebe',
    name: 'Quarto Bebê',
    category: 'quartos',
    externalUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&h=200&fit=crop',
    suggestedElements: ['walls', 'cabinets', 'curtains'],
  },
  {
    id: 'quarto-hospedes',
    name: 'Quarto Hóspedes',
    category: 'quartos',
    externalUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=300&h=200&fit=crop',
    suggestedElements: ['walls', 'bedding', 'pillows'],
  },

  // === COZINHAS ===
  {
    id: 'cozinha-moderna',
    name: 'Cozinha Moderna',
    category: 'cozinhas',
    externalUrl: 'https://images.unsplash.com/photo-1600489000022-c2086d79f9d4?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1600489000022-c2086d79f9d4?w=300&h=200&fit=crop',
    suggestedElements: ['walls', 'cabinets', 'marble'],
  },
  {
    id: 'cozinha-americana',
    name: 'Cozinha Americana',
    category: 'cozinhas',
    externalUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=200&fit=crop',
    suggestedElements: ['walls', 'cabinets', 'chair'],
  },
  {
    id: 'cozinha-rustica',
    name: 'Cozinha Rústica',
    category: 'cozinhas',
    externalUrl: 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=300&h=200&fit=crop',
    suggestedElements: ['walls', 'wood', 'cabinets'],
  },
  {
    id: 'cozinha-planejada',
    name: 'Cozinha Planejada',
    category: 'cozinhas',
    externalUrl: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=300&h=200&fit=crop',
    suggestedElements: ['cabinets', 'marble', 'floor'],
  },
  {
    id: 'cozinha-industrial',
    name: 'Cozinha Industrial',
    category: 'cozinhas',
    externalUrl: 'https://images.unsplash.com/photo-1556909190-eccf4a8bf97a?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1556909190-eccf4a8bf97a?w=300&h=200&fit=crop',
    suggestedElements: ['walls', 'cabinets', 'wood'],
  },

  // === BANHEIROS ===
  {
    id: 'banheiro-luxo',
    name: 'Banheiro Luxo',
    category: 'banheiros',
    externalUrl: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=300&h=200&fit=crop',
    suggestedElements: ['walls', 'marble', 'cabinets'],
  },
  {
    id: 'banheiro-suite',
    name: 'Banheiro Suíte',
    category: 'banheiros',
    externalUrl: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=300&h=200&fit=crop',
    suggestedElements: ['walls', 'floor', 'cabinets'],
  },
  {
    id: 'banheiro-social',
    name: 'Banheiro Social',
    category: 'banheiros',
    externalUrl: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=300&h=200&fit=crop',
    suggestedElements: ['walls', 'marble', 'floor'],
  },
  {
    id: 'lavabo',
    name: 'Lavabo',
    category: 'banheiros',
    externalUrl: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=300&h=200&fit=crop',
    suggestedElements: ['walls', 'cabinets'],
  },

  // === ESCRITÓRIOS ===
  {
    id: 'home-office',
    name: 'Home Office',
    category: 'escritorios',
    externalUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&h=200&fit=crop',
    suggestedElements: ['walls', 'chair', 'wood'],
  },
  {
    id: 'biblioteca',
    name: 'Biblioteca',
    category: 'escritorios',
    externalUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop',
    suggestedElements: ['walls', 'wood', 'cabinets'],
  },

  // === EXTERNOS ===
  {
    id: 'varanda',
    name: 'Varanda',
    category: 'externos',
    externalUrl: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=300&h=200&fit=crop',
    suggestedElements: ['walls', 'sofa', 'floor'],
  },
  {
    id: 'area-gourmet',
    name: 'Área Gourmet',
    category: 'externos',
    externalUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300&h=200&fit=crop',
    suggestedElements: ['walls', 'cabinets', 'marble'],
  },
  {
    id: 'terraco',
    name: 'Terraço',
    category: 'externos',
    externalUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=300&h=200&fit=crop',
    suggestedElements: ['walls', 'sofa', 'floor'],
  },

  // === OUTROS ===
  {
    id: 'hall-entrada',
    name: 'Hall de Entrada',
    category: 'salas',
    externalUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=300&h=200&fit=crop',
    suggestedElements: ['walls', 'floor', 'cabinets'],
  },
].map((image) => ({
  ...image,
  externalUrl: normalizeUnsplashImageUrl(image.externalUrl, { width: 800, height: 450, quality: 80 }),
  thumbnail: normalizeUnsplashImageUrl(image.thumbnail, { width: 300, height: 200, quality: 70 }),
}));

/**
 * Gera URL do Cloudinary com Generative Recolor para múltiplos elementos
 * Sintaxe: e_gen_recolor:prompt_<objeto>;to-color_<hex>;multiple_true
 */
const generateRecolorUrl = (publicId, elementColorMap, cloudName = CLOUDINARY_CLOUD_NAME) => {
  if (!publicId || Object.keys(elementColorMap).length === 0) {
    return `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
  }

  // Gera transformações para cada elemento com sua cor
  const transformations = Object.entries(elementColorMap)
    .filter(([_, color]) => color) // Só elementos com cor atribuída
    .map(([elementId, color]) => {
      const element = RECOLOR_ELEMENTS.find(e => e.id === elementId);
      if (!element) return null;

      const hexColor = color.replace('#', '');
      return `e_gen_recolor:prompt_${encodeURIComponent(element.prompt)};to-color_${hexColor};multiple_true`;
    })
    .filter(Boolean);

  if (transformations.length === 0) {
    return `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
  }

  // Junta todas as transformações
  const transformationString = transformations.join('/');

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformationString}/${publicId}`;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const checkImageReady = async (url) => {
  try {
    const head = await fetch(url, { method: 'HEAD' });
    if (head.ok) return true;
    if (![403, 405].includes(head.status)) return false;

    const get = await fetch(url, { method: 'GET' });
    return get.ok;
  } catch {
    return false;
  }
};

const waitForCloudinaryImage = async (
  url,
  attempts = CLOUDINARY_TRANSFORMATION_ATTEMPTS,
  interval = CLOUDINARY_TRANSFORMATION_DELAY
) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await checkImageReady(url)) return true;
    await delay(interval);
  }

  return false;
};

// ============================================
// COMPONENTE: Círculo de Cor
// ============================================
const ColorCircle = ({ color, isSelected, onClick, size = 'md', label }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onClick(color)}
        className={`${sizes[size]} rounded-full relative shadow-lg transition-all duration-200 border-4 ${
          isSelected
            ? 'border-wg-orange scale-110'
            : 'border-white hover:border-gray-300'
        }`}
        style={{ backgroundColor: color }}
        title={color}
      >
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Check className="w-5 h-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
          </motion.div>
        )}
      </motion.button>
      {label && <span className="text-xs text-gray-500">{label}</span>}
    </div>
  );
};

// ============================================
// COMPONENTE: Seletor de Elemento com Cor
// ============================================
const ElementColorSelector = ({ element, selectedColor, onColorSelect, availableColors }) => {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = element.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 w-full p-3 rounded-xl border-2 transition-all ${
          selectedColor
            ? 'border-wg-orange bg-wg-orange/5'
            : 'border-gray-200 hover:border-gray-300 bg-white'
        }`}
      >
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            selectedColor ? 'text-white' : 'bg-gray-100 text-gray-500'
          }`}
          style={selectedColor ? { backgroundColor: selectedColor } : {}}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 text-left">
          <p className="font-light text-gray-800">{element.name}</p>
          {selectedColor ? (
            <p className="text-sm text-wg-orange">{selectedColor}</p>
          ) : (
            <p className="text-sm text-gray-400">Clique para escolher cor</p>
          )}
        </div>
        {selectedColor && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onColorSelect(element.id, null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
                onColorSelect(element.id, null);
              }
            }}
            className="p-1 hover:bg-gray-100 rounded-full cursor-pointer"
          >
            <X className="w-4 h-4 text-gray-400" />
          </span>
        )}
      </button>

      {/* Dropdown de cores */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 p-3 bg-white rounded-xl shadow-xl border border-gray-100 z-10"
          >
            <div className="flex flex-wrap gap-2">
              {availableColors.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    onColorSelect(element.id, color);
                    setIsOpen(false);
                  }}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    selectedColor === color ? 'border-wg-orange' : 'border-white'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
// Logo URL para marca d'água
const LOGO_URL = '/images/logo-192.webp';

const ColorTransformer = ({ externalColors = [] }) => {
  // Estados
  const [selectedPalette, setSelectedPalette] = useState(COLOR_PALETTES[0]);
  const [elementColors, setElementColors] = useState({}); // { walls: '#8B4513', sofa: '#3498DB' }
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformedUrl, setTransformedUrl] = useState(null);
  const [originalUrl, setOriginalUrl] = useState(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const containerRef = useRef(null);

  // Filtrar imagens por categoria
  const filteredImages = selectedCategory === 'all'
    ? DEMO_IMAGES
    : DEMO_IMAGES.filter(img => img.category === selectedCategory);

  // Função para baixar imagem com marca d'água do logo
  const downloadWithWatermark = async () => {
    if (!transformedUrl) return;

    setIsDownloading(true);

    try {
      // Criar canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const imgResponse = await fetch(transformedUrl);
      if (!imgResponse.ok) {
        throw new Error('Imagem transformada indisponível para download');
      }
      const imgBlob = await imgResponse.blob();
      const imgBitmapUrl = URL.createObjectURL(imgBlob);

      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imgBitmapUrl;
      });

      // Definir tamanho do canvas
      canvas.width = img.width;
      canvas.height = img.height;

      // Desenhar imagem transformada
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(imgBitmapUrl);

      // Carregar logo
      const logo = new Image();
      await new Promise((resolve, reject) => {
        logo.onload = resolve;
        logo.onerror = reject;
        logo.src = LOGO_URL;
      });

      // Calcular tamanho do logo (proporcional, similar ao header ~120px)
      const logoHeight = Math.min(60, canvas.height * 0.08);
      const logoWidth = (logo.width / logo.height) * logoHeight;

      // Posição: canto inferior direito com margem
      const margin = 20;
      const x = canvas.width - logoWidth - margin;
      const y = canvas.height - logoHeight - margin;

      // Adicionar fundo semi-transparente atrás do logo
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(x - 10, y - 10, logoWidth + 20, logoHeight + 20);

      // Desenhar logo
      ctx.drawImage(logo, x, y, logoWidth, logoHeight);

      // Converter para blob e baixar
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ambiente-transformado-wgalmeida.jpg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsDownloading(false);
      }, 'image/jpeg', 0.95);

    } catch {
      // Fallback: baixar diretamente sem watermark
      try {
        const a = document.createElement('a');
        a.href = transformedUrl;
        a.download = 'ambiente-transformado.jpg';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch {
        setError('Erro ao baixar. Clique com botão direito na imagem e escolha "Salvar imagem".');
      }
      setIsDownloading(false);
    }
  };

  // Função para obter URL com marca d'água para compartilhamento
  const getShareableUrl = () => {
    if (!transformedUrl) return null;

    const payload = buildMoodboardSharePayload({
      transformedUrl,
      originalUrl,
      selectedImage,
      elementColors,
      paletteName: selectedPalette?.name,
      availableColors,
    });

    return buildMoodboardShareUrl(payload) || transformedUrl;
  };

  // Cores disponíveis (externas ou da paleta)
  const availableColors = externalColors.length > 0
    ? externalColors
    : selectedPalette.colors;

  // Selecionar imagem da plataforma e fazer upload para o Cloudinary
  const handleSelectImage = async (demoImage) => {
    if (selectedImage?.id === demoImage.id) {
      // Deselecionar se clicar na mesma imagem
      setSelectedImage(null);
      setTransformedUrl(null);
      setOriginalUrl(null);
      return;
    }

    setIsTransforming(true);
    setError(null);
    setSelectedImage(demoImage);
    setTransformedUrl(null);

    try {
      // Upload da URL externa para o Cloudinary do usuário
      const formData = new FormData();
      formData.append('file', demoImage.externalUrl);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', CLOUDINARY_UPLOAD_FOLDER);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error?.message || 'Erro ao carregar imagem no Cloudinary');
      }

      const data = await response.json();

      // Atualizar imagem selecionada com dados do Cloudinary
      setSelectedImage({
        ...demoImage,
        publicId: data.public_id,
        url: data.secure_url,
      });
      setOriginalUrl(data.secure_url);

      // Auto-selecionar elementos sugeridos se nenhum estiver selecionado
      if (Object.keys(elementColors).length === 0 && demoImage.suggestedElements && availableColors.length > 0) {
        const autoColors = {};
        demoImage.suggestedElements.forEach((elementId, index) => {
          if (availableColors[index]) {
            autoColors[elementId] = availableColors[index];
          }
        });
        setElementColors(autoColors);
      }

    } catch {
      // Se falhar o upload, usar modo simulação
      setSelectedImage({
        ...demoImage,
        publicId: null,
        url: demoImage.externalUrl,
        isDemo: true,
      });
      setOriginalUrl(demoImage.externalUrl);

      // Auto-selecionar elementos sugeridos
      if (Object.keys(elementColors).length === 0 && demoImage.suggestedElements && availableColors.length > 0) {
        const autoColors = {};
        demoImage.suggestedElements.forEach((elementId, index) => {
          if (availableColors[index]) {
            autoColors[elementId] = availableColors[index];
          }
        });
        setElementColors(autoColors);
      }

      setError('Nao foi possivel preparar esta imagem no Cloudinary. Mantivemos o preview em modo demonstracao para voce continuar.');
    } finally {
      setIsTransforming(false);
    }
  };

  // Aplicar transformação
  const handleApplyTransformation = useCallback(async () => {
    if (!selectedImage || Object.keys(elementColors).length === 0) return;

    setIsTransforming(true);
    setError(null);

    try {
      // Verifica se está em modo demo (sem publicId do Cloudinary)
      if (!selectedImage.publicId || selectedImage.isDemo) {
        // Modo simulação - usa overlay visual
        setOriginalUrl(selectedImage.url || selectedImage.externalUrl);
        setTransformedUrl(selectedImage.url || selectedImage.externalUrl);
        setError('Preview demonstrativo ativo para esta imagem. Selecione outro ambiente ou tente novamente para usar a transformacao Cloudinary.');

        await delay(1500);
      } else {
        // Modo real - usa Cloudinary Generative Recolor
        const url = generateRecolorUrl(
          selectedImage.publicId,
          elementColors,
          CLOUDINARY_CLOUD_NAME
        );

        setOriginalUrl(selectedImage.url);

        const isReady = await waitForCloudinaryImage(url);
        if (!isReady) {
          throw new Error('A transformacao Cloudinary ainda nao ficou disponivel');
        }

        setTransformedUrl(url);
      }

    } catch {
      setTransformedUrl(selectedImage.url || selectedImage.externalUrl);
      setError('A transformacao Cloudinary nao ficou pronta a tempo. Mantivemos a imagem original e voce pode tentar novamente.');
    } finally {
      setIsTransforming(false);
    }
  }, [selectedImage, elementColors]);

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

  // Atualiza cor de um elemento
  const handleElementColorSelect = (elementId, color) => {
    setElementColors(prev => {
      if (color === null) {
        const { [elementId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [elementId]: color };
    });
    setTransformedUrl(null); // Reset resultado quando muda cores
  };

  // Conta elementos com cor atribuída
  const assignedElementsCount = Object.keys(elementColors).filter(k => elementColors[k]).length;
  const canApply = selectedImage && assignedElementsCount > 0;

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* ====== HEADER ====== */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6">
        <h2 className="text-2xl font-light flex items-center gap-3">
          <Paintbrush className="w-7 h-7 text-wg-orange" />
          Transformador de Cores Inteligente
        </h2>
        <p className="text-gray-300 mt-1">
          Selecione elementos específicos e aplique cores diferentes em cada um
        </p>
      </div>

      <div className="p-6 space-y-8">
        {/* ====== PASSO 1: ESCOLHER ESTILO ====== */}
        {externalColors.length === 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 rounded-full bg-wg-orange text-white flex items-center justify-center text-sm">
                1
              </span>
              <h3 className="text-lg font-light text-gray-800">
                Escolha um Estilo
              </h3>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Selecione o estilo que combina com seu ambiente
            </p>

            {/* Grid de Estilos */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {COLOR_PALETTES.map((palette) => (
                <button
                  key={palette.id}
                  onClick={() => setSelectedPalette(palette)}
                  className={`group relative p-3 rounded-xl border-2 transition-all ${
                    selectedPalette.id === palette.id
                      ? 'border-wg-orange bg-wg-orange/5 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
                  }`}
                >
                  {/* Preview das cores */}
                  <div className="flex justify-center gap-1 mb-2">
                    {palette.colors.slice(0, 5).map((color, idx) => (
                      <div
                        key={idx}
                        className="w-5 h-5 rounded-full border border-white shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  {/* Nome do estilo */}
                  <p className={`text-xs font-light text-center truncate ${
                    selectedPalette.id === palette.id
                      ? 'text-wg-orange'
                      : 'text-gray-700'
                  }`}>
                    {palette.name}
                  </p>
                  {/* Check indicator */}
                  {selectedPalette.id === palette.id && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-wg-orange rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ====== PASSO 2: PALETA DE CORES ====== */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-full bg-wg-orange text-white flex items-center justify-center text-sm">
              {externalColors.length === 0 ? '2' : '1'}
            </span>
            <h3 className="text-lg font-light text-gray-800">
              Paleta de Cores
            </h3>
            {externalColors.length === 0 && (
              <span className="ml-auto text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {selectedPalette.name}
              </span>
            )}
          </div>

          {/* Círculos de Cores */}
          <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-xl">
            {availableColors.map((color, idx) => (
              <ColorCircle
                key={color}
                color={color}
                isSelected={Object.values(elementColors).includes(color)}
                onClick={() => {}}
                size="lg"
                label={`Cor ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* ====== PASSO 3: ESCOLHER ELEMENTOS E ATRIBUIR CORES ====== */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-full bg-wg-orange text-white flex items-center justify-center text-sm">
              {externalColors.length === 0 ? '3' : '2'}
            </span>
            <h3 className="text-lg font-light text-gray-800">
              Escolha Elementos para Recolorir
            </h3>
            <span className="ml-auto text-sm text-gray-500">
              {assignedElementsCount} selecionado(s)
            </span>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Clique em cada elemento e escolha uma cor da paleta acima
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {RECOLOR_ELEMENTS.map((element) => (
              <ElementColorSelector
                key={element.id}
                element={element}
                selectedColor={elementColors[element.id]}
                onColorSelect={handleElementColorSelect}
                availableColors={availableColors}
              />
            ))}
          </div>
        </div>

        {/* ====== PASSO 4: ESCOLHER AMBIENTE ====== */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-wg-orange text-white flex items-center justify-center text-sm">
                {externalColors.length === 0 ? '4' : '3'}
              </span>
              <h3 className="text-lg font-light text-gray-800 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-wg-orange" />
                Escolha um Ambiente
              </h3>
            </div>
            {selectedImage && (
              <span className="text-sm text-wg-orange font-light">
                {selectedImage.name}
              </span>
            )}
          </div>

          {/* Filtros de Categoria */}
          <div className="flex flex-wrap gap-2 mb-4">
            {AMBIENTE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-light transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-wg-orange text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Grid de Ambientes */}
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {filteredImages.map((img) => (
              <motion.button
                key={img.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectImage(img)}
                disabled={isTransforming}
                className={`relative aspect-square rounded-xl overflow-hidden transition-all ${
                  selectedImage?.id === img.id
                    ? 'ring-3 ring-wg-orange shadow-lg'
                    : 'border-2 border-gray-200 hover:border-gray-400 hover:shadow-md'
                }`}
              >
                <img
                  src={img.thumbnail}
                  alt={img.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-white text-[10px] font-light truncate">{img.name}</p>
                </div>
                {selectedImage?.id === img.id && (
                  <div className="absolute inset-0 bg-wg-orange/30 flex items-center justify-center">
                    <div className="w-8 h-8 bg-wg-orange rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  </div>
                )}
                {isTransforming && selectedImage?.id === img.id && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </motion.button>
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-3">
            Escolha um ambiente para aplicar as cores selecionadas
          </p>
        </div>

        {/* ====== BOTÃO APLICAR ====== */}
        <motion.button
          whileHover={{ scale: canApply ? 1.02 : 1 }}
          whileTap={{ scale: canApply ? 0.98 : 1 }}
          onClick={handleApplyTransformation}
          disabled={!canApply || isTransforming}
          className={`w-full py-4 rounded-xl font-light text-lg flex items-center justify-center gap-3 transition-all ${
            canApply && !isTransforming
              ? 'bg-wg-orange text-white hover:bg-wg-orange/90 shadow-lg shadow-wg-orange/30'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isTransforming ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Processando com IA...
            </>
          ) : (
            <>
              <Paintbrush className="w-6 h-6" />
              Aplicar Cores nos Elementos
            </>
          )}
        </motion.button>

        {!canApply && !isTransforming && (
          <p className="text-center text-sm text-gray-500">
            {!selectedImage
              ? 'Escolha um ambiente primeiro'
              : 'Selecione pelo menos um elemento com cor'}
          </p>
        )}

        {/* Erro */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700">
            <p>{error}</p>
          </div>
        )}

        {/* ====== RESULTADO: SLIDER ANTES/DEPOIS ====== */}
        <AnimatePresence>
          {transformedUrl && originalUrl && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                    <Check className="w-5 h-5" />
                  </span>
                  <h3 className="text-lg font-light text-gray-800">
                    Resultado - Arraste para Comparar
                  </h3>
                </div>
                <button
                  onClick={() => setIsFullscreen(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Maximize2 className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Slider Container */}
              <div
                ref={containerRef}
                className="relative aspect-video rounded-xl overflow-hidden cursor-ew-resize select-none shadow-xl bg-gray-100"
                onMouseDown={() => setIsDragging(true)}
                onTouchStart={() => setIsDragging(true)}
              >
                {/* Imagem Transformada (direita) */}
                <img
                  src={transformedUrl}
                  alt="Transformado"
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = originalUrl;
                    setError('A imagem transformada ficou indisponivel. Exibimos a original para manter a comparacao estavel.');
                  }}
                />

                {/* Imagem Original (esquerda, cortada) */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img
                    src={originalUrl}
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
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center cursor-ew-resize border-4 border-wg-orange">
                    <ArrowLeftRight className="w-5 h-5 text-wg-orange" />
                  </div>
                </div>

                {/* Labels */}
                <div className="absolute bottom-4 left-4 px-4 py-2 bg-black/70 text-white text-sm font-light rounded-lg backdrop-blur-sm">
                  ORIGINAL
                </div>
                <div className="absolute bottom-4 right-4 px-4 py-2 bg-wg-orange text-white text-sm font-light rounded-lg">
                  TRANSFORMADO
                </div>
              </div>

              {/* Cores aplicadas */}
              <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                <p className="text-sm font-light text-gray-700 mb-2">Cores aplicadas:</p>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(elementColors).map(([elementId, color]) => {
                    const element = RECOLOR_ELEMENTS.find(e => e.id === elementId);
                    if (!element || !color) return null;
                    return (
                      <div key={elementId} className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-gray-200">
                        <div
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-sm text-gray-700">{element.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Exportar & Compartilhar */}
              <div className="mt-6 p-4 bg-gradient-to-r from-wg-orange/10 to-orange-50 rounded-xl border border-wg-orange/20">
                <p className="text-sm font-light text-gray-800 mb-3 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-wg-orange" />
                  Exportar & Compartilhar
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={downloadWithWatermark}
                    disabled={isDownloading}
                    className="flex items-center gap-2 px-4 py-2 bg-wg-orange text-white rounded-lg text-sm font-light hover:bg-wg-orange/90 transition-colors disabled:opacity-50"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Preparando...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Baixar Imagem
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      const shareUrl = getShareableUrl();
                      const text = encodeURIComponent(`Confira minha transformação de ambiente com IA da WG Almeida!\n${shareUrl}`);
                      window.open(`https://wa.me/?text=${text}`, '_blank');
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-light hover:bg-green-600 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    WhatsApp
                  </button>
                  <button
                    onClick={() => {
                      const shareUrl = getShareableUrl();
                      const subject = encodeURIComponent('Minha Transformação de Ambiente - WG Almeida');
                      const body = encodeURIComponent(`Olá!\n\nConfira como ficou minha transformação de ambiente com IA:\n${shareUrl}\n\nCriado com a ferramenta WG Almeida Design de Interiores.\nAcesse: https://wgalmeida.com.br`);
                      window.open(`mailto:?subject=${subject}&body=${body}`);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-light hover:bg-blue-600 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </button>
                  <button
                    onClick={async () => {
                      const shareUrl = getShareableUrl();
                      await navigator.clipboard.writeText(shareUrl);
                      alert('Link copiado!');
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-light hover:bg-gray-700 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Copiar Link
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  A imagem baixada inclui a marca WG Almeida
                </p>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ====== MODAL FULLSCREEN ====== */}
      <AnimatePresence>
        {isFullscreen && transformedUrl && originalUrl && (
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
              className="relative w-full max-w-6xl aspect-video cursor-ew-resize select-none overflow-hidden rounded-xl"
              onMouseDown={() => setIsDragging(true)}
              onTouchStart={() => setIsDragging(true)}
            >
              <img
                src={transformedUrl}
                alt="Transformado"
                className="absolute inset-0 w-full h-full object-cover"
              />

              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPosition}%` }}
              >
                <img
                  src={originalUrl}
                  alt="Original"
                  className="w-full h-full object-cover"
                />
              </div>

              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
              >
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-wg-orange">
                  <ArrowLeftRight className="w-6 h-6 text-wg-orange" />
                </div>
              </div>

              <div className="absolute bottom-6 left-6 px-5 py-3 bg-black/70 text-white font-light rounded-lg">
                ORIGINAL
              </div>
              <div className="absolute bottom-6 right-6 px-5 py-3 bg-wg-orange text-white font-light rounded-lg">
                TRANSFORMADO
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ColorTransformer;
