import React, { useState, useEffect, useRef } from 'react';

const HeroVideo = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [allowVideo, setAllowVideo] = useState(true);
  const [batteryOk, setBatteryOk] = useState(true);
  const [performanceOk, setPerformanceOk] = useState(true);
  const videoRef = useRef(null);

  const bindMediaQueryChange = (mediaQuery, handler) => {
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  };

  // Usar matchMedia para evitar Forced Reflow (melhora TBT)
  useEffect(() => {
    // matchMedia nao causa layout thrashing como innerWidth/innerHeight
    const mobileQuery = window.matchMedia('(max-width: 767px)');
    const portraitQuery = window.matchMedia('(orientation: portrait)');
    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const checkMobile = () => {
      setIsMobile(mobileQuery.matches || portraitQuery.matches);
    };

    const checkMotionAndConnection = () => {
      const saveData = Boolean(navigator.connection?.saveData);
      const effectiveType = navigator.connection?.effectiveType || "";
      const slowConnection = ["slow-2g", "2g", "3g"].includes(effectiveType);
      setAllowVideo(!reduceMotionQuery.matches && !saveData && !slowConnection);
    };

    checkMobile();
    checkMotionAndConnection();

    const unbindMobile = bindMediaQueryChange(mobileQuery, checkMobile);
    const unbindPortrait = bindMediaQueryChange(portraitQuery, checkMobile);
    const unbindMotion = bindMediaQueryChange(reduceMotionQuery, checkMotionAndConnection);

    return () => {
      unbindMobile();
      unbindPortrait();
      unbindMotion();
    };
  }, []);

  // Bateria e performance: se bateria muito baixa ou device muito fraco, preferimos poster estático
  useEffect(() => {
    let cleanupBattery;
    if (navigator.getBattery) {
      navigator.getBattery().then((battery) => {
        const updateBattery = () => {
          const lowLevel = battery.level <= 0.2;
          const savingMode = battery.dischargingTime === Infinity; // modo economia em alguns devices
          setBatteryOk(!lowLevel && !savingMode);
        };
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
        cleanupBattery = () => {
          battery.removeEventListener('levelchange', updateBattery);
          battery.removeEventListener('chargingchange', updateBattery);
        };
      }).catch(() => setBatteryOk(true));
    }

    const deviceMem = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    setPerformanceOk(deviceMem >= 2 && cores >= 4);

    return () => {
      if (cleanupBattery) cleanupBattery();
    };
  }, []);

  // Carregar video apos 2s ou interacao do usuario (melhora LCP)
  useEffect(() => {
    if (!allowVideo || !batteryOk || !performanceOk) return;

    const loadVideo = () => setShouldLoadVideo(true);
    
    const timer = setTimeout(loadVideo, 2000);
    const events = ['scroll', 'click', 'touchstart', 'mousemove'];
    
    events.forEach(e => window.addEventListener(e, loadVideo, { once: true, passive: true }));
    
    return () => {
      clearTimeout(timer);
      events.forEach(e => window.removeEventListener(e, loadVideo));
    };
  }, [allowVideo, batteryOk, performanceOk]);

  const videoUrl = isMobile
    ? '/videos/hero/VERTICAL_compressed.mp4'
    : '/videos/hero/HORIZONTAL_compressed.mp4';

  return (
    <div className="absolute inset-0 z-0 w-full h-full overflow-hidden bg-wg-black">
      <img
        src="/images/hero-poster-1280.webp"
        srcSet="/images/hero-poster-640.webp 640w, /images/hero-poster-960-opt.webp 960w, /images/hero-poster-1280.webp 1280w"
        sizes="100vw"
        alt=""
        aria-hidden="true"
        className={'absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ' + (isLoaded ? 'opacity-0' : 'opacity-100')}
        width="1280"
        height="720"
        loading="eager"
        decoding="async"
        fetchPriority="high"
      />

      <div className="absolute inset-0 bg-black/40 z-10" />

      {allowVideo && batteryOk && performanceOk && shouldLoadVideo && !videoFailed && (
        <video
          ref={videoRef}
          className={'absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ' + (isLoaded ? 'opacity-100' : 'opacity-0')}
          style={{ zIndex: 5 }}
          src={videoUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          poster="/images/hero-poster-960-opt.webp"
          onCanPlay={() => setIsLoaded(true)}
          onError={() => {
            setVideoFailed(true);
            setIsLoaded(false);
          }}
          aria-hidden="true"
        >
          <track kind="captions" src="/videos/hero/descricao.vtt" srcLang="pt-BR" label="Português" />
        </video>
      )}
    </div>
  );
};

export default HeroVideo;









