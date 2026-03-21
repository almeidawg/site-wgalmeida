import React from 'react';

// Ícone institucional (substitui estrelas padrão)
const BrandStar = ({ className = 'w-6 h-6', alt = 'WG Almeida rating icon' }) => (
  <img
    src="/images/icone.webp"
    alt={alt}
    className={`inline-block object-contain ${className}`}
    loading="lazy"
    decoding="async"
  />
);

export default BrandStar;
