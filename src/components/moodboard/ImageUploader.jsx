import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, Link as LinkIcon, Loader2 } from 'lucide-react';

const ImageUploader = ({ onImagesAdd, maxImages = 6, currentCount = 0 }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [error, setError] = useState('');

  const remainingSlots = maxImages - currentCount;

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFiles = async (files) => {
    if (remainingSlots <= 0) {
      setError(`Limite de ${maxImages} imagens atingido`);
      return;
    }

    setIsLoading(true);
    setError('');

    const validFiles = Array.from(files)
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, remainingSlots);

    if (validFiles.length === 0) {
      setError('Por favor, selecione apenas arquivos de imagem');
      setIsLoading(false);
      return;
    }

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
      onImagesAdd(images);
    } catch (err) {
      setError('Erro ao processar imagens');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      processFiles(e.dataTransfer.files);
    },
    [remainingSlots]
  );

  const handleFileSelect = (e) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleUrlAdd = () => {
    if (!urlInput.trim()) {
      setError('Por favor, insira uma URL válida');
      return;
    }

    if (remainingSlots <= 0) {
      setError(`Limite de ${maxImages} imagens atingido`);
      return;
    }

    // Validação básica de URL de imagem
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const isImageUrl = imageExtensions.some((ext) =>
      urlInput.toLowerCase().includes(ext)
    ) || urlInput.includes('unsplash.com') || urlInput.includes('cloudinary.com');

    if (!isImageUrl && !urlInput.startsWith('data:image')) {
      setError('URL não parece ser uma imagem válida');
      return;
    }

    const newImage = {
      id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: urlInput,
      name: 'Imagem da URL',
      type: 'url',
    };

    onImagesAdd([newImage]);
    setUrlInput('');
    setShowUrlInput(false);
    setError('');
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-4 h-full w-full flex flex-col">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-wg-orange" />
          Adicionar Referências
        </h3>
        <span className="text-sm text-gray-500">
          {currentCount}/{maxImages} imagens
        </span>
      </div>

      {/* Drop Zone */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        animate={{
          borderColor: isDragging ? '#FF6B35' : '#E5E7EB',
          backgroundColor: isDragging ? 'rgba(255, 107, 53, 0.05)' : 'transparent',
        }}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          remainingSlots <= 0 ? 'opacity-50 pointer-events-none' : 'cursor-pointer'
        }`}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          disabled={remainingSlots <= 0 || isLoading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-10 h-10 text-wg-orange animate-spin" />
            <p className="text-sm text-gray-600">Processando imagens...</p>
          </div>
        ) : (
          <>
            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">
              Arraste imagens aqui ou clique para selecionar
            </p>
            <p className="text-sm text-gray-400 mt-1">
              PNG, JPG, WEBP (máx. {remainingSlots} {remainingSlots === 1 ? 'imagem' : 'imagens'})
            </p>
          </>
        )}
      </motion.div>

      {/* URL Input Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-wg-orange transition-colors"
        >
          <LinkIcon className="w-4 h-4" />
          Adicionar por URL
        </button>
      </div>

      {/* URL Input */}
      <AnimatePresence>
        {showUrlInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex gap-2"
          >
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://exemplo.com/imagem.jpg"
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-wg-orange focus:border-transparent"
            />
            <button
              onClick={handleUrlAdd}
              className="px-4 py-2 bg-wg-orange text-white rounded-lg hover:bg-wg-orange/90 transition-colors"
            >
              Adicionar
            </button>
            <button
              onClick={() => {
                setShowUrlInput(false);
                setUrlInput('');
              }}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm text-red-500"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImageUploader;
