import React from 'react';
import { withBasePath } from '@/utils/assetPaths';

const BRAND_ICON_SRC = withBasePath('/images/icone.webp');

// Ícone institucional (substitui estrelas padrão)
export const BrandRating = ({ count = 5, className = 'w-5 h-5', alt = '' }) => (
  <div className="flex items-center gap-1" aria-label={`${count} indicadores institucionais`}>
    {Array.from({ length: count }).map((_, index) => (
      <img
        key={index}
        src={BRAND_ICON_SRC}
        alt={alt}
        aria-hidden={alt ? undefined : 'true'}
        className={`inline-block object-contain ${className}`}
        loading="lazy"
        decoding="async"
      />
    ))}
  </div>
);

const BrandStar = ({ className = 'w-6 h-6', alt = 'WG Almeida rating icon' }) => (
  <img
    src={BRAND_ICON_SRC}
    alt={alt}
    className={`inline-block object-contain ${className}`}
    loading="lazy"
    decoding="async"
  />
);

export default BrandStar;
