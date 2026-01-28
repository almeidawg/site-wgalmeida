/**
 * Stability AI Service
 * Serviço para integração com Stability AI para geração de imagens fotorrealistas
 *
 * Modelos disponíveis:
 * - SDXL 1.0: Alta qualidade, bom para interiores
 * - Stable Diffusion 3: Melhor para texto e detalhes
 * - Image-to-Image: Transforma imagens existentes
 */

const STABILITY_API_KEY = import.meta.env.VITE_STABILITY_API_KEY;
const STABILITY_API_URL = 'https://api.stability.ai/v1';

/**
 * Estilos de interior para prompts
 */
export const INTERIOR_STYLE_PROMPTS = {
  moderno: 'modern contemporary interior design, clean lines, minimalist furniture, neutral colors, large windows, open space',
  classico: 'classic traditional interior design, ornate details, elegant furniture, rich textures, crown molding, warm lighting',
  industrial: 'industrial loft interior design, exposed brick, metal fixtures, raw materials, open ceiling, vintage elements',
  escandinavo: 'scandinavian interior design, hygge, light wood, white walls, cozy textiles, functional furniture, natural light',
  rustico: 'rustic farmhouse interior design, reclaimed wood, natural materials, warm earth tones, comfortable furniture',
  minimalista: 'minimalist interior design, zen, clean surfaces, essential furniture only, monochromatic, serene atmosphere',
  bohemio: 'bohemian eclectic interior design, colorful textiles, plants, layered patterns, global influences, artistic',
  luxo: 'luxury high-end interior design, premium materials, designer furniture, sophisticated lighting, marble accents',
  tropical: 'tropical interior design, indoor plants, natural materials, bright colors, rattan furniture, resort style',
  japones: 'japanese inspired interior design, zen minimalism, natural materials, tatami, shoji screens, harmony',
  artdeco: 'art deco interior design, geometric patterns, gold accents, luxurious materials, glamorous, 1920s elegance',
  mediterraneo: 'mediterranean interior design, terracotta, arched doorways, warm earth tones, rustic elegance, natural textures',
};

/**
 * Prompts para tipos de ambiente
 */
export const ROOM_TYPE_PROMPTS = {
  sala: 'spacious living room, comfortable seating area',
  quarto: 'cozy bedroom, comfortable bed, relaxing atmosphere',
  cozinha: 'modern kitchen, functional layout, quality appliances',
  banheiro: 'elegant bathroom, clean design, spa-like atmosphere',
  escritorio: 'home office, productive workspace, organized desk',
  infantil: 'playful children bedroom, fun and safe design',
  academia: 'home gym, fitness equipment, motivating space',
  varanda: 'outdoor terrace, comfortable seating, garden view',
};

/**
 * Gera prompt completo para a IA
 * @param {Object} options - Opções do prompt
 * @returns {string} - Prompt formatado
 */
export const buildPrompt = (options) => {
  const {
    roomType,
    styles = [],
    colors = [],
    additionalDetails = '',
    quality = 'photorealistic',
  } = options;

  const parts = [];

  // Base quality prompt
  if (quality === 'photorealistic') {
    parts.push('ultra realistic interior photography, 8k, professional architectural photography, cinematic lighting, ray tracing');
  }

  // Room type
  if (roomType && ROOM_TYPE_PROMPTS[roomType]) {
    parts.push(ROOM_TYPE_PROMPTS[roomType]);
  }

  // Styles
  styles.forEach((style) => {
    if (INTERIOR_STYLE_PROMPTS[style]) {
      parts.push(INTERIOR_STYLE_PROMPTS[style]);
    } else if (typeof style === 'object' && style.name) {
      parts.push(INTERIOR_STYLE_PROMPTS[style.id] || style.name);
    }
  });

  // Colors
  if (colors.length > 0) {
    const colorDescriptions = colors.map((c) => hexToColorName(c)).join(', ');
    parts.push(`color palette featuring ${colorDescriptions}`);
  }

  // Additional details
  if (additionalDetails) {
    parts.push(additionalDetails);
  }

  // Quality enhancers
  parts.push('highly detailed, sharp focus, beautiful composition');

  return parts.join(', ');
};

/**
 * Converte hex para nome de cor aproximado
 * @param {string} hex - Cor em hexadecimal
 * @returns {string} - Nome da cor
 */
const hexToColorName = (hex) => {
  const colors = {
    '#FFFFFF': 'white',
    '#000000': 'black',
    '#808080': 'gray',
    '#FF0000': 'red',
    '#00FF00': 'green',
    '#0000FF': 'blue',
    '#FFFF00': 'yellow',
    '#FF6B35': 'warm orange',
    '#2C3E50': 'dark blue gray',
    '#E74C3C': 'coral red',
    '#3498DB': 'sky blue',
    '#1ABC9C': 'teal',
    '#8B4513': 'saddle brown',
    '#D4AF37': 'gold',
    '#F5F5DC': 'beige',
  };

  // Busca cor exata ou retorna o hex
  return colors[hex.toUpperCase()] || `${hex} toned`;
};

/**
 * Gera imagem usando text-to-image
 * @param {string} prompt - Prompt de geração
 * @param {Object} options - Opções adicionais
 * @returns {Promise<Object>} - Imagem gerada
 */
export const generateImage = async (prompt, options = {}) => {
  const {
    width = 1024,
    height = 1024,
    samples = 1,
    steps = 30,
    cfgScale = 7,
    style = 'photographic',
  } = options;

  try {
    const response = await fetch(`${STABILITY_API_URL}/generation/stable-diffusion-xl-1024-v1-0/text-to-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STABILITY_API_KEY}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        text_prompts: [
          {
            text: prompt,
            weight: 1,
          },
          {
            text: 'blurry, low quality, distorted, ugly, bad architecture, unrealistic',
            weight: -1,
          },
        ],
        cfg_scale: cfgScale,
        width,
        height,
        samples,
        steps,
        style_preset: style,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro na geração da imagem');
    }

    const data = await response.json();

    // Retorna as imagens em base64
    return data.artifacts.map((artifact) => ({
      base64: artifact.base64,
      seed: artifact.seed,
      finishReason: artifact.finishReason,
    }));
  } catch (error) {
    console.error('Stability AI error:', error);
    throw error;
  }
};

/**
 * Transforma imagem existente (image-to-image)
 * @param {File|Blob|string} image - Imagem de entrada
 * @param {string} prompt - Prompt de transformação
 * @param {Object} options - Opções adicionais
 * @returns {Promise<Object>} - Imagem transformada
 */
export const transformImage = async (image, prompt, options = {}) => {
  const {
    strength = 0.35, // Quanto manter da imagem original (0-1)
    steps = 30,
    cfgScale = 7,
    style = 'photographic',
  } = options;

  const formData = new FormData();

  // Adiciona a imagem
  if (typeof image === 'string' && image.startsWith('data:')) {
    // Base64
    const blob = await fetch(image).then((r) => r.blob());
    formData.append('init_image', blob);
  } else if (image instanceof File || image instanceof Blob) {
    formData.append('init_image', image);
  }

  formData.append('text_prompts[0][text]', prompt);
  formData.append('text_prompts[0][weight]', '1');
  formData.append('text_prompts[1][text]', 'blurry, low quality, distorted, ugly');
  formData.append('text_prompts[1][weight]', '-1');
  formData.append('image_strength', String(1 - strength));
  formData.append('cfg_scale', String(cfgScale));
  formData.append('steps', String(steps));
  formData.append('style_preset', style);

  try {
    const response = await fetch(`${STABILITY_API_URL}/generation/stable-diffusion-xl-1024-v1-0/image-to-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STABILITY_API_KEY}`,
        'Accept': 'application/json',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro na transformação da imagem');
    }

    const data = await response.json();

    return data.artifacts.map((artifact) => ({
      base64: artifact.base64,
      seed: artifact.seed,
      finishReason: artifact.finishReason,
    }));
  } catch (error) {
    console.error('Stability AI transform error:', error);
    throw error;
  }
};

/**
 * Gera visualização de ambiente com moodboard
 * @param {File} roomPhoto - Foto do ambiente
 * @param {Object} moodboard - Dados do moodboard
 * @param {Object} roomInfo - Informações do ambiente
 * @returns {Promise<Object>} - Resultado da geração
 */
export const generateRoomVisualization = async (roomPhoto, moodboard, roomInfo) => {
  const { colors = [], styles = [] } = moodboard;
  const { roomType, customRoomName } = roomInfo;

  // Monta o prompt
  const prompt = buildPrompt({
    roomType: roomType?.id || 'sala',
    styles: styles.map((s) => s.id || s),
    colors,
    additionalDetails: customRoomName || '',
    quality: 'photorealistic',
  });

  // Transforma a imagem
  const results = await transformImage(roomPhoto, prompt, {
    strength: 0.4, // Mantém 60% da estrutura original
    steps: 40,
    cfgScale: 8,
    style: 'photographic',
  });

  return {
    prompt,
    images: results,
    moodboard,
    roomInfo,
  };
};

/**
 * Verifica créditos/status da API
 * @returns {Promise<Object>} - Status da conta
 */
export const checkAccountStatus = async () => {
  try {
    const response = await fetch(`${STABILITY_API_URL}/user/balance`, {
      headers: {
        'Authorization': `Bearer ${STABILITY_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao verificar status');
    }

    return response.json();
  } catch (error) {
    console.error('Status check error:', error);
    throw error;
  }
};

export default {
  generateImage,
  transformImage,
  generateRoomVisualization,
  buildPrompt,
  checkAccountStatus,
  INTERIOR_STYLE_PROMPTS,
  ROOM_TYPE_PROMPTS,
};
