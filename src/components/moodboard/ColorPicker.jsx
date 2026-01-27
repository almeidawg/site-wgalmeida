import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, X, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';

// Paletas predefinidas inspiradas em design de interiores
const PRESET_PALETTES = {
  moderno: ['#2C3E50', '#E74C3C', '#ECF0F1', '#3498DB', '#1ABC9C'],
  classico: ['#8B4513', '#D4AF37', '#F5F5DC', '#800020', '#2F4F4F'],
  minimalista: ['#FFFFFF', '#000000', '#808080', '#F5F5F5', '#333333'],
  tropical: ['#00CED1', '#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3'],
  nordico: ['#E8E8E8', '#B8D4E3', '#F7F3E9', '#A3C1AD', '#5D5C61'],
  industrial: ['#36454F', '#A9A9A9', '#CD7F32', '#2F2F2F', '#708090'],
  rustico: ['#8B4513', '#DEB887', '#F4A460', '#D2691E', '#A0522D'],
  contemporaneo: ['#FF6B35', '#004E89', '#1A1A2E', '#F5F5F5', '#7209B7'],
};

const ColorSwatch = ({ color, isSelected, onClick, onRemove, size = 'md' }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-14 h-14',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className={`${sizes[size]} rounded-full cursor-pointer relative shadow-lg border-4 ${
        isSelected ? 'border-wg-orange' : 'border-white'
      }`}
      style={{ backgroundColor: color }}
      onClick={() => onClick(color)}
    >
      {isSelected && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Check className="w-5 h-5 text-white drop-shadow-lg" />
        </div>
      )}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(color);
          }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 shadow-md"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </motion.div>
  );
};

const ColorPicker = ({
  selectedColors,
  onColorsChange,
  maxColors = 5,
  customImages = [],
  onImagesAdd,
  onRemoveImage,
  maxImages = 6
}) => {
  const [customColor, setCustomColor] = useState('#000000');
  const [activeCategory, setActiveCategory] = useState('moderno');
  const [isUploadingRef, setIsUploadingRef] = useState(false);
  const fileInputRef = useRef(null);

  const handleRefImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - customImages.length;
    if (remainingSlots <= 0) return;

    setIsUploadingRef(true);

    const validFiles = Array.from(files)
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, remainingSlots);

    try {
      const imagePromises = validFiles.map((file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({
              id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              url: e.target.result,
              name: file.name,
              type: 'local',
            });
          };
          reader.readAsDataURL(file);
        });
      });

      const images = await Promise.all(imagePromises);
      if (onImagesAdd) {
        onImagesAdd(images);
      }
    } finally {
      setIsUploadingRef(false);
    }
  };

  const handleColorSelect = (color) => {
    if (selectedColors.includes(color)) {
      onColorsChange(selectedColors.filter((c) => c !== color));
    } else if (selectedColors.length < maxColors) {
      onColorsChange([...selectedColors, color]);
    }
  };

  const handleRemoveColor = (color) => {
    onColorsChange(selectedColors.filter((c) => c !== color));
  };

  const handleAddCustomColor = () => {
    if (!selectedColors.includes(customColor) && selectedColors.length < maxColors) {
      onColorsChange([...selectedColors, customColor]);
    }
  };

  const handleApplyPalette = (paletteName) => {
    onColorsChange(PRESET_PALETTES[paletteName].slice(0, maxColors));
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6 h-full w-full flex flex-col">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Suas Cores Selecionadas ({selectedColors.length}/{maxColors})
        </h3>
        <div className="flex flex-wrap gap-3 min-h-[60px] p-3 bg-gray-50 rounded-lg">
          {selectedColors.length === 0 ? (
            <p className="text-gray-400 text-sm">Selecione cores abaixo ou use uma paleta</p>
          ) : (
            selectedColors.map((color) => (
              <ColorSwatch
                key={color}
                color={color}
                isSelected={false}
                onClick={() => {}}
                onRemove={handleRemoveColor}
                size="lg"
              />
            ))
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Paletas Predefinidas</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.keys(PRESET_PALETTES).map((palette) => (
            <button
              key={palette}
              onClick={() => setActiveCategory(palette)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === palette
                  ? 'bg-wg-orange text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {palette.charAt(0).toUpperCase() + palette.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {PRESET_PALETTES[activeCategory].map((color) => (
              <ColorSwatch
                key={color}
                color={color}
                isSelected={selectedColors.includes(color)}
                onClick={handleColorSelect}
              />
            ))}
          </div>
          <button
            onClick={() => handleApplyPalette(activeCategory)}
            className="ml-4 px-4 py-2 bg-wg-orange text-white rounded-lg text-sm font-medium hover:bg-wg-orange/90 transition-colors"
          >
            Aplicar Paleta
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Cor Personalizada</h3>
        <div className="flex items-center gap-4">
          <input
            type="color"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            className="w-16 h-12 rounded-lg cursor-pointer border-2 border-gray-200"
          />
          <input
            type="text"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg font-mono text-sm w-28"
            placeholder="#000000"
          />
          <button
            onClick={handleAddCustomColor}
            disabled={selectedColors.length >= maxColors}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </button>
        </div>
      </div>

      {/* Adicionar Referências */}
      {onImagesAdd && (
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-wg-orange" />
              Minhas Referências
            </h3>
            <span className="text-sm text-gray-500">
              {customImages.length}/{maxImages}
            </span>
          </div>

          {/* Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleRefImageUpload}
            className="hidden"
          />

          <div className="flex flex-wrap gap-3">
            {/* Reference Images */}
            <AnimatePresence>
              {customImages.map((img) => (
                <motion.div
                  key={img.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="relative w-16 h-16 rounded-lg overflow-hidden group"
                >
                  <img
                    src={img.url}
                    alt={img.name || 'Referência'}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => onRemoveImage?.(img)}
                    className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Add Button */}
            {customImages.length < maxImages && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingRef}
                className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-wg-orange hover:text-wg-orange transition-colors"
              >
                {isUploadingRef ? (
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-wg-orange rounded-full animate-spin" />
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span className="text-[10px] mt-1">Adicionar</span>
                  </>
                )}
              </button>
            )}
          </div>

          <p className="text-xs text-gray-400 mt-2">
            Envie fotos de inspiração para seu projeto
          </p>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
