import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion-lite';
import { Camera, Upload, X, RotateCw, ZoomIn, Loader2, AlertCircle } from 'lucide-react';

const PhotoUploader = ({ photo, onPhotoChange, isProcessing = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  const validateImage = (file) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!validTypes.includes(file.type)) {
      return 'Formato não suportado. Use JPG, PNG ou WEBP.';
    }

    if (file.size > maxSize) {
      return 'Imagem muito grande. Máximo 10MB.';
    }

    return null;
  };

  const processFile = useCallback(async (file) => {
    const validationError = validateImage(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = {
        file,
        url: e.target.result,
        name: file.name,
        size: file.size,
        type: file.type,
      };
      setPreview(e.target.result);
      onPhotoChange(imageData);
    };
    reader.readAsDataURL(file);
  }, [onPhotoChange]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onPhotoChange(null);
    setError('');
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Implementar modal de captura de câmera se necessário
      stream.getTracks().forEach(track => track.stop());
    } catch {
      setError('Não foi possível acessar a câmera');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <Camera className="w-5 h-5 text-wg-orange" />
        Foto do Seu Espaço
      </h3>
      <p className="text-sm text-gray-500">
        Envie uma foto do ambiente que deseja visualizar com as suas escolhas de design
      </p>

      {!preview ? (
        <>
          {/* Upload Zone */}
          <motion.div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            animate={{
              borderColor: isDragging ? '#FF6B35' : '#E5E7EB',
              backgroundColor: isDragging ? 'rgba(255, 107, 53, 0.05)' : 'transparent',
            }}
            className="relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors"
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium mb-2">
              Arraste sua foto aqui ou clique para selecionar
            </p>
            <p className="text-sm text-gray-400">
              JPG, PNG ou WEBP • Máximo 10MB
            </p>
          </motion.div>

          {/* Camera Option */}
          <button
            onClick={handleCameraCapture}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Camera className="w-5 h-5" />
            Tirar foto com a câmera
          </button>

          {/* Tips */}
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-sm font-medium text-blue-800 mb-2">Dicas para melhores resultados:</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Fotografe o ambiente com boa iluminação</li>
              <li>• Enquadre todo o espaço na foto</li>
              <li>• Evite fotos muito escuras ou com flash forte</li>
              <li>• Prefira ângulos frontais do ambiente</li>
            </ul>
          </div>
        </>
      ) : (
        /* Preview */
        <div className="relative">
          <div className="relative rounded-xl overflow-hidden aspect-video">
            <img
              src={preview}
              alt="Preview do ambiente"
              className="w-full h-full object-cover"
            />

            {isProcessing && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-center text-white">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto mb-3" />
                  <p className="font-medium">Processando sua imagem...</p>
                  <p className="text-sm opacity-80">Isso pode levar alguns segundos</p>
                </div>
              </div>
            )}
          </div>

          {!isProcessing && (
            <div className="absolute top-3 right-3 flex gap-2">
              <button
                onClick={handleRemove}
                className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                title="Remover foto"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          )}

          {!isProcessing && photo && (
            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
              <span>{photo.name}</span>
              <span>{(photo.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg"
          >
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhotoUploader;
