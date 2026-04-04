import React, { useState, useEffect, useRef } from 'react';

const YT_VIDEO_ID = '1Bjn8eG72CA';

const HeroVideo = () => {
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [allowVideo, setAllowVideo]     = useState(true);
  const [batteryOk, setBatteryOk]       = useState(true);
  const [performanceOk, setPerformanceOk] = useState(true);
  const [isMuted, setIsMuted]           = useState(true);
  const playerRef = useRef(null);
  const ytPlayerRef = useRef(null);

  const bindMediaQueryChange = (mq, fn) => {
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', fn);
      return () => mq.removeEventListener('change', fn);
    }
    mq.addListener(fn);
    return () => mq.removeListener(fn);
  };

  // conexão / prefers-reduced-motion
  useEffect(() => {
    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const check = () => {
      const saveData      = Boolean(navigator.connection?.saveData);
      const effectiveType = navigator.connection?.effectiveType || '';
      const slow          = ['slow-2g', '2g', '3g'].includes(effectiveType);
      setAllowVideo(!reduceMotionQuery.matches && !saveData && !slow);
    };
    check();
    return bindMediaQueryChange(reduceMotionQuery, check);
  }, []);

  // bateria e hardware
  useEffect(() => {
    let cleanup;
    if (navigator.getBattery) {
      navigator.getBattery().then((battery) => {
        const update = () => setBatteryOk(battery.level > 0.2);
        update();
        battery.addEventListener('levelchange', update);
        battery.addEventListener('chargingchange', update);
        cleanup = () => {
          battery.removeEventListener('levelchange', update);
          battery.removeEventListener('chargingchange', update);
        };
      }).catch(() => setBatteryOk(true));
    }
    const mem   = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    setPerformanceOk(mem >= 2 && cores >= 4);
    return () => { if (cleanup) cleanup(); };
  }, []);

  // lazy-load: inicia após 2 s ou primeira interação
  useEffect(() => {
    if (!allowVideo || !batteryOk || !performanceOk) return;
    const load   = () => setShouldLoadVideo(true);
    const timer  = setTimeout(load, 2000);
    const events = ['scroll', 'click', 'touchstart', 'mousemove'];
    events.forEach(e => window.addEventListener(e, load, { once: true, passive: true }));
    return () => {
      clearTimeout(timer);
      events.forEach(e => window.removeEventListener(e, load));
    };
  }, [allowVideo, batteryOk, performanceOk]);

  // YouTube IFrame API — instancia player quando iframe já existe
  useEffect(() => {
    if (!shouldLoadVideo) return;

    const initPlayer = () => {
      if (!window.YT?.Player || !playerRef.current) return;
      ytPlayerRef.current = new window.YT.Player(playerRef.current, {
        events: {
          onReady: (e) => {
            e.target.mute();
            e.target.playVideo();
          },
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prev) prev();
        initPlayer();
      };
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const s    = document.createElement('script');
        s.src      = 'https://www.youtube.com/iframe_api';
        s.async    = true;
        document.head.appendChild(s);
      }
    }
  }, [shouldLoadVideo]);

  const toggleMute = () => {
    const p = ytPlayerRef.current;
    if (!p) return;
    if (isMuted) { p.unMute(); } else { p.mute(); }
    setIsMuted(!isMuted);
  };

  const canPlay = allowVideo && batteryOk && performanceOk;

  return (
    <div className="absolute inset-0 z-0 w-full h-full overflow-hidden bg-wg-black">
      {/* Poster — aparece enquanto o vídeo não carrega */}
      <img
        src="/images/hero-poster-1280.webp"
        srcSet="/images/hero-poster-640.webp 640w, /images/hero-poster-960-opt.webp 960w, /images/hero-poster-1280.webp 1280w"
        sizes="100vw"
        alt="Grupo WG Almeida - Arquitetura, Engenharia e Marcenaria de Alto Padrão em São Paulo"
        className={'absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ' + (shouldLoadVideo && canPlay ? 'opacity-0' : 'opacity-100')}
        width="1280"
        height="720"
        loading="eager"
        decoding="async"
        fetchPriority="high"
      />

      {/* Overlay escuro */}
      <div className="absolute inset-0 bg-black/40 z-10" />

      {/* YouTube iframe — carregado lazily */}
      {canPlay && shouldLoadVideo && (
        <iframe
          ref={playerRef}
          id="wg-hero-yt"
          src={`https://www.youtube.com/embed/${YT_VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${YT_VIDEO_ID}&controls=0&showinfo=0&rel=0&playsinline=1&enablejsapi=1&modestbranding=1`}
          allow="autoplay; fullscreen"
          allowFullScreen
          aria-hidden="true"
          tabIndex={-1}
          title="Vídeo background hero"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '177.78vh',   /* 16/9 * 100vh */
            minWidth: '100%',
            height: '56.25vw',   /* 9/16 * 100vw */
            minHeight: '100%',
            transform: 'translate(-50%, -50%)',
            border: 'none',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        />
      )}

      {/* Botão mute/unmute */}
      {canPlay && shouldLoadVideo && (
        <button
          onClick={toggleMute}
          aria-label={isMuted ? 'Ativar som' : 'Desativar som'}
          title={isMuted ? 'Ativar som' : 'Desativar som'}
          className="absolute bottom-6 right-6 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-black/50 border border-white/30 text-white hover:bg-black/70 transition-all"
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
