const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dwukfmgrd';

const joinTransformations = (transformations = []) =>
  transformations.filter(Boolean).join('/');

export const buildCloudinaryImageUrl = (publicId, transformations = []) => {
  const parts = joinTransformations(transformations);
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${parts}/${publicId}`;
};

export const buildCloudinaryVideoUrl = (publicId, transformations = []) => {
  const parts = joinTransformations(transformations);
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload/${parts}/${publicId}`;
};

export const HERO_MEDIA = {
  poster: '/images/hero-poster-1280.webp',
  mobile: buildCloudinaryVideoUrl('h6zftberxzqzf4mqpyyr', [
    'f_auto',
    'q_auto:good',
    'vc_auto',
    'so_0',
    'ar_16:9',
    'c_fill',
    'g_auto',
    'w_1280',
  ]),
  desktop: buildCloudinaryVideoUrl('h6zftberxzqzf4mqpyyr', [
    'f_auto',
    'q_auto:good',
    'vc_auto',
    'so_0',
    'ar_16:9',
    'c_fill',
    'g_auto',
    'w_1920',
  ]),
};

export default {
  buildCloudinaryImageUrl,
  buildCloudinaryVideoUrl,
  HERO_MEDIA,
};
