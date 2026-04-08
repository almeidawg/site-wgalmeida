import React from "react";

/**
 * Utility para Lazy Loading de Imagens
 * Carrega imagens sob demanda usando Intersection Observer
 */

export const LazyImage = ({
  src,
  alt = "",
  className = "",
  placeholder = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
  onLoad = () => {},
  onError = () => {},
}) => {
  const [imageSrc, setImageSrc] = React.useState(placeholder);
  const [imageRef, setImageRef] = React.useState(null);
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    let observer;

    if (imageRef && imageSrc === placeholder) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setImageSrc(src);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(imageRef);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [imageRef, imageSrc, placeholder, src]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad();
  };

  const handleError = () => {
    onError();
  };

  return (
    <img
      ref={setImageRef}
      src={imageSrc}
      alt={alt}
      className={`${className} ${
        isLoaded ? "opacity-100" : "opacity-50"
      } transition-opacity duration-300`}
      onLoad={handleLoad}
      onError={handleError}
      loading="lazy"
    />
  );
};

/**
 * Componente Picture para WebP + Fallback
 */
export const ResponsiveImage = ({
  webpSrc,
  jpgSrc,
  alt = "",
  className = "",
  width,
  height,
  srcSet = "",
}) => {
  return (
    <picture>
      {/* WebP - Moderno, menor tamanho */}
      <source srcSet={webpSrc} type="image/webp" />
      {/* Fallback - JPG/PNG */}
      <img
        src={jpgSrc}
        alt={alt}
        className={className}
        width={width}
        height={height}
        loading="lazy"
        srcSet={srcSet}
      />
    </picture>
  );
};

/**
 * Hook para detectar suporte a WebP
 */
export const useWebpSupport = () => {
  const [supportsWebp, setSupportsWebp] = React.useState(false);

  React.useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;

    try {
      const webp = canvas.toDataURL("image/webp");
      setSupportsWebp(webp.indexOf("image/webp") === 5);
    } catch (e) {
      setSupportsWebp(false);
    }
  }, []);

  return supportsWebp;
};

/**
 * Preload de imagens (para hero images)
 */
export const preloadImage = (src) => {
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "image";
  link.href = src;
  document.head.appendChild(link);
};

/**
 * Exemplo de uso:
 *
 * // Lazy loading simples
 * <LazyImage src="/image.jpg" alt="Descrição" className="w-full" />
 *
 * // Com WebP + Fallback
 * <ResponsiveImage
 *   webpSrc="/image.webp"
 *   jpgSrc="/image.jpg"
 *   alt="Descrição"
 *   className="w-full h-auto"
 * />
 *
 * // Preload hero image
 * useEffect(() => {
 *   preloadImage('/hero.jpg');
 * }, []);
 */
