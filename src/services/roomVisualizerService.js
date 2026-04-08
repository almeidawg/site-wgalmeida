/**
 * Room Visualizer Service
 * Orquestra Cloudinary AI + Stability AI para gerar visualizações
 */

import cloudinaryAI from './cloudinaryAI';
import stabilityAI from './stabilityAI';
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Status de geração
 */
export const GENERATION_STATUS = {
  IDLE: 'idle',
  UPLOADING: 'uploading',
  ANALYZING: 'analyzing',
  APPLYING_COLORS: 'applying_colors',
  APPLYING_STYLE: 'applying_style',
  RENDERING: 'rendering',
  COMPLETED: 'completed',
  ERROR: 'error',
};

/**
 * Processa a visualização completa do ambiente
 * @param {Object} params - Parâmetros da geração
 * @param {Function} onProgress - Callback de progresso
 * @returns {Promise<Object>} - Resultado da visualização
 */
export const processRoomVisualization = async (params, onProgress = () => {}) => {
  const { photo, moodboard, roomInfo, userId } = params;
  const { colors = [] } = moodboard;

  try {
    // 1. Upload da imagem para Cloudinary
    onProgress({ status: GENERATION_STATUS.UPLOADING, progress: 10 });

    const uploadResult = await cloudinaryAI.uploadImage(photo.file, {
      folder: `room-visualizer/${userId || 'anonymous'}`,
    });

    // 2. Análise do ambiente (simulado - Cloudinary faz automaticamente)
    onProgress({ status: GENERATION_STATUS.ANALYZING, progress: 25 });
    await delay(1000); // Simula tempo de análise

    // 3. Aplicar cores usando Cloudinary Generative Recolor
    onProgress({ status: GENERATION_STATUS.APPLYING_COLORS, progress: 40 });

    let coloredImageUrl = uploadResult.url;

    if (colors.length > 0) {
      // Define quais elementos recolorir baseado no tipo de ambiente
      const elementsToRecolor = getElementsForRoomType(roomInfo.roomType?.id);

      const colorMappings = elementsToRecolor.map((element, index) => ({
        target: element.prompt,
        color: colors[index % colors.length],
      }));

      coloredImageUrl = cloudinaryAI.applyMultipleRecolors(
        uploadResult.publicId,
        colorMappings
      );

      // Aguarda a imagem estar pronta
      await cloudinaryAI.waitForImage(coloredImageUrl, 5, 2000);
    }

    // 4. Aplicar estilo usando Stability AI
    onProgress({ status: GENERATION_STATUS.APPLYING_STYLE, progress: 60 });

    // Busca a imagem recolorida para transformar
    const coloredImageBlob = await fetch(coloredImageUrl).then(r => r.blob());

    // 5. Renderização final
    onProgress({ status: GENERATION_STATUS.RENDERING, progress: 80 });

    const renderResult = await stabilityAI.generateRoomVisualization(
      coloredImageBlob,
      moodboard,
      roomInfo
    );

    // 6. Conclusão
    onProgress({ status: GENERATION_STATUS.COMPLETED, progress: 100 });

    const result = {
      id: generateId(),
      originalImage: uploadResult.url,
      coloredImage: coloredImageUrl,
      generatedImage: `data:image/png;base64,${renderResult.images[0].base64}`,
      prompt: renderResult.prompt,
      moodboard,
      roomInfo,
      createdAt: new Date().toISOString(),
    };

    // Salva no histórico do usuário se estiver logado
    if (userId) {
      await saveToHistory(userId, result);
    }

    return result;
  } catch (error) {
    onProgress({ status: GENERATION_STATUS.ERROR, progress: 0, error: error.message });
    throw error;
  }
};

/**
 * Retorna elementos a recolorir baseado no tipo de ambiente
 */
const getElementsForRoomType = (roomType) => {
  const elementsByRoom = {
    sala: [
      cloudinaryAI.ROOM_ELEMENTS.walls,
      cloudinaryAI.ROOM_ELEMENTS.sofa,
      cloudinaryAI.ROOM_ELEMENTS.curtains,
    ],
    quarto: [
      cloudinaryAI.ROOM_ELEMENTS.walls,
      cloudinaryAI.ROOM_ELEMENTS.bed,
      cloudinaryAI.ROOM_ELEMENTS.curtains,
    ],
    cozinha: [
      cloudinaryAI.ROOM_ELEMENTS.walls,
      cloudinaryAI.ROOM_ELEMENTS.cabinet,
    ],
    banheiro: [
      cloudinaryAI.ROOM_ELEMENTS.walls,
    ],
    escritorio: [
      cloudinaryAI.ROOM_ELEMENTS.walls,
      cloudinaryAI.ROOM_ELEMENTS.furniture,
    ],
    default: [
      cloudinaryAI.ROOM_ELEMENTS.walls,
      cloudinaryAI.ROOM_ELEMENTS.furniture,
    ],
  };

  return elementsByRoom[roomType] || elementsByRoom.default;
};

/**
 * Salva resultado no histórico do usuário
 */
const saveToHistory = async (userId, result) => {
  try {
    const { error } = await supabase
      .from('room_visualizations')
      .insert({
        user_id: userId,
        original_image_url: result.originalImage,
        generated_image_url: result.generatedImage,
        moodboard_data: result.moodboard,
        room_info: result.roomInfo,
        prompt_used: result.prompt,
      });

    if (error) {
      console.error('Erro ao salvar histórico:', error);
    }
  } catch (err) {
    console.error('Erro ao salvar:', err);
  }
};

/**
 * Busca histórico de visualizações do usuário
 */
export const getUserHistory = async (userId, limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('room_visualizations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Erro ao buscar histórico:', err);
    return [];
  }
};

/**
 * Deleta uma visualização
 */
export const deleteVisualization = async (userId, visualizationId) => {
  try {
    const { error } = await supabase
      .from('room_visualizations')
      .delete()
      .eq('id', visualizationId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Erro ao deletar:', err);
    return false;
  }
};

// Helpers
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const generateId = () => `viz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export default {
  processRoomVisualization,
  getUserHistory,
  deleteVisualization,
  GENERATION_STATUS,
};
