import React from 'react';
import { withBasePath } from '@/utils/assetPaths';

const BANNERS = [
  '/images/banners/foto-obra-1.jpg',
  '/images/banners/foto-obra-2.jpg',
  '/images/banners/foto-obra-3.jpg',
  '/images/banners/foto-obra-4.jpg',
  '/images/banners/foto-obra-5.jpg',
  '/images/banners/foto-obra-6.jpg',
  '/images/banners/foto-obra-7.jpg',
  '/images/banners/ARQ.webp',
  '/images/banners/ENGENHARIA.webp',
  '/images/banners/MARCENARIA.webp',
];

const hashIndex = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % BANNERS.length;
};

const getFallbackSrc = (src) => {
  if (!src) return withBasePath(BANNERS[0]);
  // For blog and estilos: use deterministic hash of the path for variety
  if (src.includes('/images/blog/') || src.includes('/images/estilos/')) {
    return withBasePath(BANNERS[hashIndex(src)]);
  }
  if (src.includes('/images/imagens/') || src.includes('/images/projects/')) {
    return withBasePath('/images/banners/PROJETOS.webp');
  }
  if (src.includes('/images/regions/')) return withBasePath('/images/banners/ARQ.webp');
  return withBasePath(BANNERS[hashIndex(src)]);
};

const ResponsiveWebpImage = ({
  src,
  alt = '',
  className = '',
  sizes = '100vw',
  width = 1920,
  height = 1080,
  loading = 'lazy',
  decoding = 'async',
  fetchPriority,
  ...rest
}) => {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading={loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
      onError={(event) => {
        if (event.currentTarget.dataset.fallbackApplied === 'true') return;
        event.currentTarget.dataset.fallbackApplied = 'true';
        event.currentTarget.src = getFallbackSrc(src);
      }}
      {...rest}
    />
  );
};

export default ResponsiveWebpImage;
