import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './SupabaseAuthContext';
import roomVisualizerService, { GENERATION_STATUS } from '@/services/roomVisualizerService';

const RoomVisualizerContext = createContext(null);

export const RoomVisualizerProvider = ({ children }) => {
  const { user } = useAuth();

  // Estado do formulário
  const [roomType, setRoomType] = useState(null);
  const [customRoomName, setCustomRoomName] = useState('');
  const [photo, setPhoto] = useState(null);
  const [importedColors, setImportedColors] = useState([]);
  const [importedStyles, setImportedStyles] = useState([]);

  // Estado da geração
  const [generationStatus, setGenerationStatus] = useState(GENERATION_STATUS.IDLE);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationError, setGenerationError] = useState(null);

  // Resultado
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  // Importar moodboard
  const importMoodboard = useCallback((moodboardData) => {
    setImportedColors(moodboardData.colors || []);
    setImportedStyles(moodboardData.styles || []);
  }, []);

  const clearImportedMoodboard = useCallback(() => {
    setImportedColors([]);
    setImportedStyles([]);
  }, []);

  // Handler de progresso
  const handleProgress = useCallback((progressData) => {
    setGenerationStatus(progressData.status);
    setGenerationProgress(progressData.progress);
    if (progressData.error) {
      setGenerationError(progressData.error);
    }
  }, []);

  // Gerar visualização
  const generateVisualization = useCallback(async () => {
    if (!photo || !roomType) {
      setGenerationError('Foto e tipo de ambiente são obrigatórios');
      return null;
    }

    if (importedColors.length === 0 && importedStyles.length === 0) {
      setGenerationError('Importe um moodboard primeiro');
      return null;
    }

    setGenerationError(null);
    setResult(null);

    try {
      const visualizationResult = await roomVisualizerService.processRoomVisualization(
        {
          photo,
          moodboard: {
            colors: importedColors,
            styles: importedStyles,
          },
          roomInfo: {
            roomType,
            customRoomName,
          },
          userId: user?.id,
        },
        handleProgress
      );

      setResult(visualizationResult);
      return visualizationResult;
    } catch (error) {
      setGenerationError(error.message);
      return null;
    }
  }, [photo, roomType, customRoomName, importedColors, importedStyles, user, handleProgress]);

  // Regenerar
  const regenerate = useCallback(async () => {
    setResult(null);
    return generateVisualization();
  }, [generateVisualization]);

  // Carregar histórico
  const loadHistory = useCallback(async () => {
    if (!user?.id) return;

    const userHistory = await roomVisualizerService.getUserHistory(user.id);
    setHistory(userHistory);
  }, [user]);

  // Deletar do histórico
  const deleteFromHistory = useCallback(async (visualizationId) => {
    if (!user?.id) return;

    const success = await roomVisualizerService.deleteVisualization(user.id, visualizationId);
    if (success) {
      setHistory((prev) => prev.filter((v) => v.id !== visualizationId));
    }
    return success;
  }, [user]);

  // Reset
  const reset = useCallback(() => {
    setRoomType(null);
    setCustomRoomName('');
    setPhoto(null);
    setGenerationStatus(GENERATION_STATUS.IDLE);
    setGenerationProgress(0);
    setGenerationError(null);
    setResult(null);
  }, []);

  // Validação
  const canGenerate = photo && roomType && (importedColors.length > 0 || importedStyles.length > 0);
  const isGenerating = ![GENERATION_STATUS.IDLE, GENERATION_STATUS.COMPLETED, GENERATION_STATUS.ERROR].includes(generationStatus);

  const value = {
    // Form state
    roomType,
    setRoomType,
    customRoomName,
    setCustomRoomName,
    photo,
    setPhoto,
    importedColors,
    importedStyles,

    // Actions
    importMoodboard,
    clearImportedMoodboard,
    generateVisualization,
    regenerate,
    loadHistory,
    deleteFromHistory,
    reset,

    // Generation state
    generationStatus,
    generationProgress,
    generationError,
    isGenerating,
    canGenerate,

    // Result
    result,
    history,
  };

  return (
    <RoomVisualizerContext.Provider value={value}>
      {children}
    </RoomVisualizerContext.Provider>
  );
};

export const useRoomVisualizer = () => {
  const context = useContext(RoomVisualizerContext);
  if (!context) {
    throw new Error('useRoomVisualizer deve ser usado dentro de RoomVisualizerProvider');
  }
  return context;
};

export default RoomVisualizerContext;
