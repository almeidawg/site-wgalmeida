/**
 * Cloudinary AI Service
 * Serviço para integração com Cloudinary Generative AI APIs
 *
 * Recursos utilizados:
 * - Generative Recolor: Recolorir objetos/superfícies na imagem
 * - Generative Replace: Substituir elementos por outros
 * - Generative Fill: Preencher áreas com conteúdo gerado
 */

// Configuração do Cloudinary (usar variáveis de ambiente)
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'wg_unsigned';

/**
 * Upload de imagem para o Cloudinary
 * @param {File} file - Arquivo de imagem
 * @param {Object} options - Opções de upload
 * @returns {Promise<Object>} - Dados da imagem uploadada
 */
export const uploadImage = async (file, options = {}) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', options.folder || 'room-visualizer');

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Erro no upload da imagem');
    }

    const data = await response.json();
    return {
      publicId: data.public_id,
      url: data.secure_url,
      width: data.width,
      height: data.height,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

/**
 * Gera URL com transformação Generative Recolor
 * @param {string} publicId - Public ID da imagem no Cloudinary
 * @param {Object} options - Opções de recoloração
 * @returns {string} - URL com transformação aplicada
 */
export const generateRecolorUrl = (publicId, options = {}) => {
  const { targetObject = 'walls', color, detectMultiple = true } = options;

  // Converte hex para nome de cor ou formato aceito
  const colorValue = color.replace('#', '');

  // Monta a transformação
  const transformation = [
    `e_gen_recolor:prompt_${encodeURIComponent(targetObject)}`,
    `to-color_${colorValue}`,
    detectMultiple ? 'multiple_true' : '',
  ]
    .filter(Boolean)
    .join(';');

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformation}/${publicId}`;
};

/**
 * Aplica múltiplas cores em diferentes elementos
 * @param {string} publicId - Public ID da imagem
 * @param {Array} colorMappings - Array de { target, color }
 * @returns {string} - URL com transformações
 */
export const applyMultipleRecolors = (publicId, colorMappings) => {
  const transformations = colorMappings.map(({ target, color }) => {
    const colorValue = color.replace('#', '');
    return `e_gen_recolor:prompt_${encodeURIComponent(target)};to-color_${colorValue}`;
  });

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformations.join('/')}/${publicId}`;
};

/**
 * Gera URL com Generative Replace
 * @param {string} publicId - Public ID da imagem
 * @param {Object} options - Opções de substituição
 * @returns {string} - URL com transformação
 */
export const generateReplaceUrl = (publicId, options = {}) => {
  const { from, to, preserveGeometry = true } = options;

  const transformation = [
    `e_gen_replace:from_${encodeURIComponent(from)}`,
    `to_${encodeURIComponent(to)}`,
    preserveGeometry ? 'preserve-geometry_true' : '',
  ]
    .filter(Boolean)
    .join(';');

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformation}/${publicId}`;
};

/**
 * Mapeamento de elementos do ambiente para recoloração
 */
export const ROOM_ELEMENTS = {
  walls: { label: 'Paredes', prompt: 'walls' },
  ceiling: { label: 'Teto', prompt: 'ceiling' },
  floor: { label: 'Piso', prompt: 'floor' },
  furniture: { label: 'Móveis', prompt: 'furniture' },
  sofa: { label: 'Sofá', prompt: 'sofa couch' },
  curtains: { label: 'Cortinas', prompt: 'curtains drapes' },
  cabinet: { label: 'Armários', prompt: 'cabinets cupboards' },
  doors: { label: 'Portas', prompt: 'doors' },
  bed: { label: 'Cama', prompt: 'bed bedding' },
  table: { label: 'Mesa', prompt: 'table' },
};

/**
 * Aplica estilo completo baseado no moodboard
 * @param {string} publicId - Public ID da imagem
 * @param {Object} moodboard - Dados do moodboard
 * @returns {Object} - URLs das diferentes versões
 */
export const applyMoodboardStyle = async (publicId, moodboard) => {
  const { colors = [], primaryElements = ['walls'] } = moodboard;

  // Cria mapeamento de cores para elementos
  const colorMappings = primaryElements.map((element, index) => ({
    target: ROOM_ELEMENTS[element]?.prompt || element,
    color: colors[index % colors.length],
  }));

  // Gera URL com as cores aplicadas
  const styledUrl = applyMultipleRecolors(publicId, colorMappings);

  return {
    original: `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}`,
    styled: styledUrl,
    colorMappings,
  };
};

/**
 * Verifica se a imagem está pronta após transformação
 * (Cloudinary processa de forma assíncrona)
 * @param {string} url - URL da imagem transformada
 * @returns {Promise<boolean>}
 */
export const checkImageReady = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Aguarda a imagem estar pronta com retry
 * @param {string} url - URL da imagem
 * @param {number} maxAttempts - Máximo de tentativas
 * @param {number} delay - Delay entre tentativas (ms)
 * @returns {Promise<boolean>}
 */
export const waitForImage = async (url, maxAttempts = 10, delay = 2000) => {
  for (let i = 0; i < maxAttempts; i++) {
    const ready = await checkImageReady(url);
    if (ready) return true;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  return false;
};

export default {
  uploadImage,
  generateRecolorUrl,
  applyMultipleRecolors,
  generateReplaceUrl,
  applyMoodboardStyle,
  checkImageReady,
  waitForImage,
  ROOM_ELEMENTS,
};
