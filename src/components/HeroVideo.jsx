import React, { useState, useEffect, useRef } from 'react';

const HeroVideo = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const videoRef = useRef(null);

  // Usar matchMedia para evitar Forced Reflow (melhora TBT)
  useEffect(() => {
    // matchMedia nao causa layout thrashing como innerWidth/innerHeight
    const mobileQuery = window.matchMedia('(max-width: 767px)');
    const portraitQuery = window.matchMedia('(orientation: portrait)');

    const checkMobile = () => {
      setIsMobile(mobileQuery.matches || portraitQuery.matches);
    };

    checkMobile();

    // Usar addEventListener ao inves de addListener (deprecated)
    mobileQuery.addEventListener('change', checkMobile);
    portraitQuery.addEventListener('change', checkMobile);

    return () => {
      mobileQuery.removeEventListener('change', checkMobile);
      portraitQuery.removeEventListener('change', checkMobile);
    };
  }, []);

  // Carregar video apos 2s ou interacao do usuario (melhora LCP)
  useEffect(() => {
    const loadVideo = () => setShouldLoadVideo(true);
    
    const timer = setTimeout(loadVideo, 2000);
    const events = ['scroll', 'click', 'touchstart', 'mousemove'];
    
    events.forEach(e => window.addEventListener(e, loadVideo, { once: true, passive: true }));
    
    return () => {
      clearTimeout(timer);
      events.forEach(e => window.removeEventListener(e, loadVideo));
    };
  }, []);

  // Cloudinary com otimizacoes de qualidade e formato
  const videoUrl = isMobile 
    ? 'https://res.cloudinary.com/dkkj9mpqv/video/upload/q_auto,f_auto/wgalmeida/hero-vertical.mp4'
    : 'https://res.cloudinary.com/dkkj9mpqv/video/upload/q_auto,f_auto/wgalmeida/hero-horizontal.mp4';

  return (
    <div className="absolute inset-0 z-0 w-full h-full overflow-hidden bg-wg-black">
      <img
        src="/images/hero-poster.webp"
        srcSet="/images/hero-poster-640.webp 640w, /images/hero-poster-960.webp 960w, /images/hero-poster-1280.webp 1280w, /images/hero-poster.webp 1920w"
        sizes="100vw"
        alt=""
        aria-hidden="true"
        className={'absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ' + (isLoaded ? 'opacity-0' : 'opacity-100')}
        width="1920"
        height="1080"
        loading="eager"
        decoding="async"
        fetchPriority="high"
      />

      <div className="absolute inset-0 bg-black/40 z-10" />

      {shouldLoadVideo && (
        <video
          ref={videoRef}
          className={'absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ' + (isLoaded ? 'opacity-100' : 'opacity-0')}
          style={{ zIndex: 5 }}
          src={videoUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onCanPlay={() => setIsLoaded(true)}
        />
      )}
    </div>
  );
};

export default HeroVideo;
