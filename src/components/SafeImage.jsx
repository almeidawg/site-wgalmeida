import React, { useEffect, useRef, useState } from 'react';

const SafeImage = ({ src, fallbackSrc, alt = '', onError, onLoad, ...props }) => {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc || '');
  const [fallbackApplied, setFallbackApplied] = useState(false);
  const imageRef = useRef(null);

  const applyFallback = () => {
    if (!fallbackSrc || fallbackApplied || currentSrc === fallbackSrc) {
      return false;
    }

    setCurrentSrc(fallbackSrc);
    setFallbackApplied(true);
    return true;
  };

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc || '');
    setFallbackApplied(false);
  }, [src, fallbackSrc]);

  useEffect(() => {
    if (!currentSrc || !fallbackSrc || currentSrc === fallbackSrc) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      const imageElement = imageRef.current;
      if (!imageElement) return;
      if (imageElement.complete && imageElement.naturalWidth === 0) {
        applyFallback();
      }
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [currentSrc, fallbackSrc]);

  return (
    <img
      {...props}
      ref={imageRef}
      src={currentSrc}
      alt={alt}
      onLoad={(event) => {
        if (event.currentTarget.naturalWidth === 0) {
          applyFallback();
        }

        onLoad?.(event);
      }}
      onError={(event) => {
        if (applyFallback()) {
          return;
        }

        onError?.(event);
      }}
    />
  );
};

export default SafeImage;
