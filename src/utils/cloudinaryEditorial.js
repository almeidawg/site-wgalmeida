const DEFAULT_CLOUDINARY_CLOUD = 'dwukfmgrd';

const EDITORIAL_VARIANTS = {
  hero: { width: 1600, height: 900, crop: 'fill' },
  card: { width: 960, height: 640, crop: 'fill' },
  thumb: { width: 720, height: 480, crop: 'fill' },
  seo: { width: 1200, height: 630, crop: 'fill' },
  square: { width: 720, height: 720, crop: 'fill' },
};

export const getCloudinaryEditorialCloudName = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CLOUDINARY_CLOUD_NAME) {
    return import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  }

  return DEFAULT_CLOUDINARY_CLOUD;
};

export const buildCloudinaryEditorialUrl = (publicId, variant = 'card') => {
  if (!publicId) return null;

  const cloudName = getCloudinaryEditorialCloudName();
  const { width, height, crop } = EDITORIAL_VARIANTS[variant] || EDITORIAL_VARIANTS.card;

  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto:good,dpr_auto,c_${crop},g_auto,w_${width},h_${height}/${publicId}`;
};

export default {
  buildCloudinaryEditorialUrl,
  getCloudinaryEditorialCloudName,
};
