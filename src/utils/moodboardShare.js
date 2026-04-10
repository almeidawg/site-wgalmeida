const safeEncode = (value) => {
  if (typeof window === 'undefined' || !window.btoa) return null;
  return window.btoa(unescape(encodeURIComponent(value)));
};

const safeDecode = (value) => {
  if (typeof window === 'undefined' || !window.atob) return null;
  return decodeURIComponent(escape(window.atob(value)));
};

export const buildMoodboardSharePayload = ({
  transformedUrl,
  originalUrl,
  selectedImage,
  elementColors,
  paletteName,
  availableColors,
}) => ({
  transformedUrl,
  originalUrl,
  imageName: selectedImage?.name || 'Ambiente WG Almeida',
  imageCategory: selectedImage?.category || 'ambientes',
  paletteName: paletteName || '',
  elementColors: elementColors || {},
  availableColors: availableColors || [],
  createdAt: new Date().toISOString(),
});

export const encodeMoodboardSharePayload = (payload) => {
  try {
    const encoded = safeEncode(JSON.stringify(payload));
    return encoded ? encodeURIComponent(encoded) : null;
  } catch {
    return null;
  }
};

export const decodeMoodboardSharePayload = (encoded) => {
  if (!encoded) return null;

  try {
    const decoded = safeDecode(decodeURIComponent(encoded));
    return decoded ? JSON.parse(decoded) : null;
  } catch {
    return null;
  }
};

export const buildMoodboardShareUrl = (payload) => {
  if (typeof window === 'undefined') return null;

  const encoded = encodeMoodboardSharePayload(payload);
  if (!encoded) return null;

  return `${window.location.origin}/moodboard/share?data=${encoded}`;
};

export default {
  buildMoodboardSharePayload,
  buildMoodboardShareUrl,
  decodeMoodboardSharePayload,
  encodeMoodboardSharePayload,
};
