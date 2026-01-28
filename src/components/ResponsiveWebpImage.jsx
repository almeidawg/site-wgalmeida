import React from 'react';

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
      {...rest}
    />
  );
};

export default ResponsiveWebpImage;
