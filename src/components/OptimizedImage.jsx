/**
 * OptimizedImage - Componente com lazy loading + performance optimization
 * Integra: LazyImage, ResponsiveImage, e preload automático
 */

import React, { useState, useEffect, useRef } from "react";
import { useWebpSupport } from "@/utils/ImageOptimization";
import { withBasePath } from "@/utils/assetPaths";

const DEFAULT_FALLBACK = withBasePath("/images/placeholder.webp");

const getFallbackSrc = (src) => {
  if (!src) return DEFAULT_FALLBACK;
  if (src.includes("/images/blog/")) return withBasePath("/images/banners/SOBRE.webp");
  if (src.includes("/images/estilos/")) return withBasePath("/images/banners/MARCENARIA.webp");
  if (src.includes("/images/imagens/") || src.includes("/images/projects/")) return withBasePath("/images/banners/PROJETOS.webp");
  if (src.includes("/images/regions/")) return withBasePath("/images/hero-region.webp");
  return DEFAULT_FALLBACK;
};

export function OptimizedImage({
  src,
  webpSrc,
  alt,
  className = "",
  width,
  height,
  loading = "lazy",
  priority = false,
  onLoad,
  objectFit = "cover",
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const imgRef = useRef(null);
  const supportsWebp = useWebpSupport();

  // Determinar source baseado em suporte WebP
  useEffect(() => {
    const finalSrc = supportsWebp && webpSrc ? webpSrc : src;
    setImageSrc(finalSrc);

    // Preload se priority = true
    if (priority && finalSrc) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = finalSrc;
      document.head.appendChild(link);
    }
  }, [src, webpSrc, supportsWebp, priority]);

  // Lazy loading com Intersection Observer
  useEffect(() => {
    if (!imgRef.current || loading !== "lazy") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.src = imageSrc;
          observer.unobserve(entry.target);
        }
      },
      {
        rootMargin: "50px", // Começar a carregar 50px antes de entrar na view
      }
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [imageSrc, loading]);

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  return (
    <picture>
      {/* WebP com fallback para JPEG */}
      {supportsWebp && webpSrc && <source srcSet={webpSrc} type="image/webp" />}
      <img
        ref={imgRef}
        src={loading === "lazy" ? undefined : imageSrc}
        data-src={loading === "lazy" ? imageSrc : undefined}
        alt={alt}
        className={`transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        } ${className}`}
        style={{
          objectFit,
          width: width || "auto",
          height: height || "auto",
        }}
        onLoad={handleLoad}
        onError={(event) => {
          if (event.currentTarget.dataset.fallbackApplied === "true") return;
          event.currentTarget.dataset.fallbackApplied = "true";
          event.currentTarget.src = getFallbackSrc(imageSrc || src);
        }}
        loading={loading === "lazy" ? "lazy" : "eager"}
        decoding="async"
        width={width}
        height={height}
      />
    </picture>
  );
}

/**
 * LazyImage - Versão simplificada com apenas lazy loading
 */
export function LazyImage({ src, alt, className = "", width, height, onLoad }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.src = src;
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "50px" }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    return () => observer.disconnect();
  }, [src]);

  return (
    <img
      ref={imgRef}
      alt={alt}
      className={`transition-opacity duration-300 ${
        isLoaded ? "opacity-100" : "opacity-0"
      } ${className}`}
      width={width}
      height={height}
      onLoad={() => {
        setIsLoaded(true);
        if (onLoad) onLoad();
      }}
      onError={(event) => {
        if (event.currentTarget.dataset.fallbackApplied === "true") return;
        event.currentTarget.dataset.fallbackApplied = "true";
        event.currentTarget.src = getFallbackSrc(src);
      }}
      loading="lazy"
      decoding="async"
    />
  );
}

/**
 * ResponsiveImage - Imagem responsiva com breakpoints
 */
export function ResponsiveImage({
  webpSrc,
  jpgSrc,
  alt,
  className = "",
  width,
  height,
  objectFit = "cover",
  priority = false,
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const supportsWebp = useWebpSupport();

  // Preload para performance crítica
  useEffect(() => {
    if (priority) {
      const preloadImg = new Image();
      preloadImg.src = supportsWebp ? webpSrc : jpgSrc;
    }
  }, [priority, supportsWebp, webpSrc, jpgSrc]);

  return (
    <picture>
      {supportsWebp && <source srcSet={webpSrc} type="image/webp" />}
      <img
        src={jpgSrc}
        alt={alt}
        className={`transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        } ${className}`}
        style={{ objectFit }}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        onLoad={() => setIsLoaded(true)}
        onError={(event) => {
          if (event.currentTarget.dataset.fallbackApplied === "true") return;
          event.currentTarget.dataset.fallbackApplied = "true";
          event.currentTarget.src = getFallbackSrc(jpgSrc || webpSrc);
        }}
      />
    </picture>
  );
}

export default OptimizedImage;
