import React, { useState } from 'react';

const buildSrcSet = (src) => {
  if (!src || !src.endsWith('.webp')) {
    return undefined;
  }

  const base = src.slice(0, -5);
  return `${base}-640.webp 640w, ${base}-960.webp 960w, ${base}-1280.webp 1280w, ${src} 1920w`;
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
  const [useSrcSet, setUseSrcSet] = useState(true);
  const srcSet = useSrcSet ? buildSrcSet(src) : undefined;

  const handleError = (e) => {
    // Se srcSet falhar, desabilita e usa apenas src principal
    if (useSrcSet) {
      setUseSrcSet(false);
      e.target.src = src;
    }
  };

  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading={loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
      onError={handleError}
      {...rest}
    />
  );
};

export default ResponsiveWebpImage;
