import React, { useState, useEffect, useRef } from 'react';
import { HERO_MEDIA } from '@/utils/cloudinaryMedia';
import { withBasePath } from '@/utils/assetPaths';

const HERO_POSTER_SRCSET = [
  `${withBasePath('/images/hero-poster-640.webp')} 640w`,
  `${withBasePath('/images/hero-poster-960-opt.webp')} 960w`,
  `${withBasePath('/images/hero-poster-1280.webp')} 1280w`,
].join(', ');

const HeroVideo = () => {
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [allowVideo, setAllowVideo] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const videoRef = useRef(null);

  const bindMediaQueryChange = (mq, fn) => {
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', fn);
      return () => mq.removeEventListener('change', fn);
    }
    mq.addListener(fn);
    return () => mq.removeListener(fn);
  };

  useEffect(() => {
    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const check = () => {
      const saveData = Boolean(navigator.connection?.saveData);
      const effectiveType = navigator.connection?.effectiveType || '';
      const slow = ['slow-2g', '2g', '3g'].includes(effectiveType);
      setAllowVideo(!reduceMotionQuery.matches && !saveData && !slow);
    };
    check();
    return bindMediaQueryChange(reduceMotionQuery, check);
  }, []);

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 767px)');
    const syncViewport = () => setIsMobileViewport(mobileQuery.matches);
    syncViewport();
    return bindMediaQueryChange(mobileQuery, syncViewport);
  }, []);

  useEffect(() => {
    if (!allowVideo) {
      setShouldLoadVideo(false);
      return;
    }
    const timer = setTimeout(() => setShouldLoadVideo(true), 180);
    return () => {
      clearTimeout(timer);
    };
  }, [allowVideo]);

  useEffect(() => {
    if (!shouldLoadVideo || !videoRef.current) return;
    const video = videoRef.current;
    video.muted = isMuted;
    video.load();
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => setShouldLoadVideo(false));
    }
  }, [shouldLoadVideo, isMuted, isMobileViewport]);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !isMuted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const canPlay = allowVideo;
  const activeVideoSrc = isMobileViewport ? HERO_MEDIA.mobile : HERO_MEDIA.desktop;

  return (
    <div className="absolute inset-0 z-0 w-full h-full overflow-hidden bg-wg-black">
      <img
        src={HERO_MEDIA.poster}
        srcSet={HERO_POSTER_SRCSET}
        sizes="100vw"
        alt="Grupo WG Almeida - Arquitetura, Engenharia e Marcenaria de Alto Padrão em São Paulo"
        className={'absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ' + (isVideoReady && canPlay ? 'opacity-0' : 'opacity-100')}
        width="1280"
        height="720"
        loading="eager"
        decoding="async"
        fetchpriority="high"
      />

      {canPlay && shouldLoadVideo && (
        <video
          ref={videoRef}
          key={activeVideoSrc}
          className={'absolute inset-0 z-[5] h-full w-full object-cover object-center md:object-center transition-opacity duration-1000 ' + (isVideoReady ? 'opacity-100' : 'opacity-0')}
          src={activeVideoSrc}
          poster={HERO_MEDIA.poster}
          autoPlay
          muted={isMuted}
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          onCanPlay={() => setIsVideoReady(true)}
          onLoadedData={() => setIsVideoReady(true)}
          onError={() => {
            setIsVideoReady(false);
            setShouldLoadVideo(false);
          }}
        />
      )}

      {canPlay && shouldLoadVideo && (
        <button
          onClick={toggleMute}
          aria-label={isMuted ? 'Ativar som' : 'Desativar som'}
          title={isMuted ? 'Ativar som' : 'Desativar som'}
          className="absolute bottom-6 right-6 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white hover:bg-black/55 transition-all"
        >
          {isMuted ? (
            /* volume-x */
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
            </svg>
          ) : (
            /* volume-2 */
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
          )}
        </button>
      )}
    </div>
  );
};

export default HeroVideo;

