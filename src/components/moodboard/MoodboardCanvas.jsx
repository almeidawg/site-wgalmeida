import React, { useRef } from 'react';
import { motion } from '@/lib/motion-lite';
import { Image, Palette, Type, Trash2, Move } from 'lucide-react';

const MoodboardCanvas = ({ colors, styles, customImages = [], onRemoveImage }) => {
  const canvasRef = useRef(null);

  const hasContent = colors.length > 0 || styles.length > 0 || customImages.length > 0;

  return (
    <div
      ref={canvasRef}
      id="moodboard-canvas"
      className="bg-white rounded-2xl shadow-xl p-6 min-h-[500px] h-full w-full relative overflow-hidden"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              'radial-gradient(circle, #000 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
      </div>

      {!hasContent ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
          <Image className="w-16 h-16 mb-4 opacity-50" />
          <h3 className="text-xl font-medium mb-2">Seu Moodboard está vazio</h3>
          <p className="text-sm text-center max-w-sm">
            Selecione cores e estilos ao lado para começar a criar sua visão de
            design
          </p>
        </div>
      ) : (
        <div className="relative z-10 space-y-8">
          {/* Header */}
          <div className="text-center pb-4 border-b border-gray-100">
            <h2 className="text-2xl font-light text-gray-800">Meu Moodboard</h2>
          </div>

          {/* Color Palette Section */}
          {colors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 text-gray-700">
                <Palette className="w-5 h-5" />
                <h3 className="font-semibold">Paleta de Cores</h3>
              </div>
              <div className="flex gap-4 flex-wrap">
                {colors.map((color, index) => (
                  <motion.div
                    key={color}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div
                      className="w-20 h-20 rounded-xl shadow-lg"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs font-mono text-gray-500 uppercase">
                      {color}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Styles Section */}
          {styles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 text-gray-700">
                <Type className="w-5 h-5" />
                <h3 className="font-semibold">Estilos de Referência</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {styles.map((style, index) => (
                  <motion.div
                    key={style.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.15 }}
                    className="relative rounded-xl overflow-hidden shadow-lg aspect-video group"
                  >
                    <img
                      src={style.image}
                      alt={style.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h4 className="text-white font-medium">{style.name}</h4>
                      <div className="flex gap-1 mt-1">
                        {style.tags?.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-2 py-0.5 bg-white/20 text-white rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Custom Images Section */}
          {customImages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 text-gray-700">
                <Image className="w-5 h-5" />
                <h3 className="font-semibold">Minhas Referências</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {customImages.map((img, index) => (
                  <motion.div
                    key={img.id || index}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative rounded-xl overflow-hidden shadow-lg aspect-square group"
                  >
                    <img
                      src={img.url}
                      alt={img.name || 'Referência'}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => onRemoveImage?.(img)}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Decorative elements showing color palette applied */}
          {colors.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 pt-6 border-t border-gray-100"
            >
              <p className="text-sm text-gray-500 mb-4">Preview da paleta aplicada:</p>
              <div className="flex gap-2 h-4">
                {colors.map((color, index) => (
                  <div
                    key={color}
                    className="flex-1 rounded-full"
                    style={{
                      backgroundColor: color,
                      flex: index === 0 ? 3 : index === 1 ? 2 : 1,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

export default MoodboardCanvas;
