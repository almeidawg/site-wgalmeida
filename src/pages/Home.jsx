import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import SEO from '@/components/SEO';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from '@/lib/motion-lite';
import {
  ArrowRight,
  Building2,
  Hammer,
  Ruler,
  MessageSquare,
  FileText,
  Calculator,
  HardHat,
  Sofa,
  CheckCircle2,
  Monitor,
  Lock,
  Wine,
  Calendar,
  Camera,
  MessagesSquare,
  FolderOpen,
  Palette
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import AnimatedStrokes from '@/components/AnimatedStrokes';

import HeroVideo from '@/components/HeroVideo';
import SanfonaHero from '@/components/home/SanfonaHero';
// Lazy load PremiumCinematicIntro para reduzir TBT (Total Blocking Time)
const PremiumCinematicIntro = lazy(() => import('@/components/PremiumCinematicIntro'));
const ProjectGallery = lazy(() => import('@/components/ProjectGallery'));
const HomeColorTransformer = lazy(() => import('@/components/home/HomeColorTransformer'));
const GoogleReviewsBadge = lazy(() => import('@/components/GoogleReviewsBadge'));
import { useEstatisticasWG } from '@/hooks/useEstatisticasWG';
import { Trans, useTranslation } from 'react-i18next';
import { SCHEMAS } from '@/data/schemaConfig';

const editorialScale = {
  kicker: 'text-[11px] font-semibold uppercase tracking-[0.18em]',
  title: 'text-[22px] leading-tight text-wg-black md:text-[28px]',
  body: 'text-[15px] leading-[1.75] text-[#4C4C4C]'
};

const logosNucleos = [
  { src: '/Logos/logo-arquitetura-84.webp', alt: 'Logo Arquitetura' },
  { src: '/Logos/logo-engenharia-84.webp', alt: 'Logo Engenharia' },
  { src: '/Logos/logo-marcenaria-84.webp', alt: 'Logo Marcenaria' }
];

const Home = () => {
  const { t } = useTranslation();
  const impactPhrases = t('home.impactPhrases', { returnObjects: true });

  // Intro inicia desativada para não competir com renderização crítica do hero.
  const [showIntro, setShowIntro] = useState(false);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const statsSectionRef = useRef(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const projectGalleryRef = useRef(null);
  const [projectGalleryVisible, setProjectGalleryVisible] = useState(false);
  const reviewsRef = useRef(null);
  const [reviewsVisible, setReviewsVisible] = useState(false);
  const [statsAnimated, setStatsAnimated] = useState(false);
  const [displayStats, setDisplayStats] = useState({
    projetosAndamento: 0,
    clientesAtendidos: 0,
    metrosRevestimentos: 0,
    horasProjetando: 0
  });

  // Hook para estatísticas dinâmicas do sistema
  const estatisticas = useEstatisticasWG({ enabled: statsVisible });

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasSaveData = Boolean(navigator.connection?.saveData);
    const deviceMem = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    const perfOk = deviceMem >= 2 && cores >= 4;

    const enableIntroNow = () => {
      setShowIntro(true);
      sessionStorage.setItem('wg-intro-triggered', 'true');
    };

    const runWithBatteryCheck = async () => {
      if (prefersReducedMotion || hasSaveData || !perfOk) return;
      try {
        const battery = await navigator.getBattery?.();
        if (battery && battery.level <= 0.2) return;
      } catch (_) {
        // sem suporte, segue
      }
      enableIntroNow();
    };

    let timeoutId;
    const enableIntro = () => {
      timeoutId = window.setTimeout(runWithBatteryCheck, 800);
    };

    if (typeof window.requestIdleCallback === 'function') {
      const idleId = window.requestIdleCallback(enableIntro, { timeout: 1500 });
      return () => {
        window.cancelIdleCallback(idleId);
        window.clearTimeout(timeoutId);
      };
    }

    enableIntro();
    return () => window.clearTimeout(timeoutId);
  }, []);

  // Rotação automática das frases
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhraseIndex((prev) => (prev + 1) % impactPhrases.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [impactPhrases.length]);

  useEffect(() => {
    if (!statsSectionRef.current || statsVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setStatsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(statsSectionRef.current);
    return () => observer.disconnect();
  }, [statsVisible]);

  useEffect(() => {
    if (!projectGalleryRef.current || projectGalleryVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setProjectGalleryVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '320px 0px', threshold: 0.01 }
    );

    observer.observe(projectGalleryRef.current);
    return () => observer.disconnect();
  }, [projectGalleryVisible]);

  useEffect(() => {
    if (!reviewsRef.current || reviewsVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setReviewsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '320px 0px', threshold: 0.01 }
    );

    observer.observe(reviewsRef.current);
    return () => observer.disconnect();
  }, [reviewsVisible]);

  useEffect(() => {
    if (!statsVisible || estatisticas.loading) return;

    const targetStats = {
      projetosAndamento: estatisticas.projetosAndamento,
      clientesAtendidos: estatisticas.clientesAtendidos,
      metrosRevestimentos: estatisticas.metrosRevestimentos >= 1000
        ? Math.floor(estatisticas.metrosRevestimentos / 1000)
        : estatisticas.metrosRevestimentos,
      horasProjetando: estatisticas.horasProjetando >= 1000
        ? Math.floor(estatisticas.horasProjetando / 1000)
        : estatisticas.horasProjetando
    };

    if (statsAnimated) {
      setDisplayStats(targetStats);
      return;
    }

    let animationFrame;
    let startTime;
    const duration = 1400;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;

      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      setDisplayStats({
        projetosAndamento: Math.round(targetStats.projetosAndamento * easedProgress),
        clientesAtendidos: Math.round(targetStats.clientesAtendidos * easedProgress),
        metrosRevestimentos: Math.round(targetStats.metrosRevestimentos * easedProgress),
        horasProjetando: Math.round(targetStats.horasProjetando * easedProgress)
      });

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(animate);
      } else {
        setStatsAnimated(true);
      }
    };

    animationFrame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [
    statsVisible,
    statsAnimated,
    estatisticas.loading,
    estatisticas.projetosAndamento,
    estatisticas.clientesAtendidos,
    estatisticas.metrosRevestimentos,
    estatisticas.horasProjetando
  ]);

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyHeight = document.body.style.height;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.height = previousBodyHeight;
    };
  }, []);

  return (
    <>
      <SEO
        pathname="/"
        schema={[SCHEMAS.organization, SCHEMAS.localBusiness, SCHEMAS.breadcrumbHome]}
      />
      <SanfonaHero />
    </>
  );

  // Unidades (antes "Serviços")
  const nucleos = [
    {
      title: t('home.units.architecture.title'),
      path: '/arquitetura',
      icon: Ruler,
      description: t('home.units.architecture.description'),
      highlight: t('home.units.architecture.highlight'),
      color: 'wg-green',
    },
    {
      title: t('home.units.engineering.title'),
      path: '/engenharia',
      icon: Building2,
      description: t('home.units.engineering.description'),
      highlight: t('home.units.engineering.highlight'),
      color: 'wg-blue',
    },
    {
      title: t('home.units.carpentry.title'),
      path: '/marcenaria',
      icon: Hammer,
      description: t('home.units.carpentry.description'),
      highlight: t('home.units.carpentry.highlight'),
      color: 'wg-brown',
    },
    {
      title: 'WG Build Tech',
      path: '/buildtech',
      icon: Monitor,
      description: 'Consultoria de IA e tecnologia para construção e gestão de projetos.',
      highlight: 'Tecnologia + Construção',
      color: 'wg-blue',
    },
    {
      title: 'WG EasyLocker',
      path: '/easylocker',
      icon: Lock,
      description: 'Armários inteligentes com acesso por app para condomínios e empresas.',
      highlight: 'IoT + Segurança',
      color: 'wg-orange',
    },
    {
      title: 'Wno Mas Vinhos & Cia',
      path: '/wnomasvinho',
      icon: Wine,
      description: 'Curadoria de vinhos, clube de assinatura e experiências exclusivas.',
      highlight: 'Vinhos + Experiências',
      color: 'wg-brown',
    },
  ];

  // Etapas do processo / Metodologia
  const metodologia = [
    { icon: MessageSquare, title: t('home.methodology.steps.0.title'), desc: t('home.methodology.steps.0.desc') },
    { icon: FileText, title: t('home.methodology.steps.1.title'), desc: t('home.methodology.steps.1.desc') },
    { icon: Calculator, title: t('home.methodology.steps.2.title'), desc: t('home.methodology.steps.2.desc') },
    { icon: HardHat, title: t('home.methodology.steps.3.title'), desc: t('home.methodology.steps.3.desc') },
    { icon: Sofa, title: t('home.methodology.steps.4.title'), desc: t('home.methodology.steps.4.desc') },
    { icon: CheckCircle2, title: t('home.methodology.steps.5.title'), desc: t('home.methodology.steps.5.desc') },
  ];

  // Funcionalidades da área do cliente
  const clientAreaFeatures = [
    { icon: Calendar, title: t('home.dashboard.features.0') },
    { icon: Monitor, title: t('home.dashboard.features.1') },
    { icon: Camera, title: t('home.dashboard.features.2') },
    { icon: MessagesSquare, title: t('home.dashboard.features.3') },
    { icon: FolderOpen, title: t('home.dashboard.features.4') },
  ];

  return (
    <>
      <SEO
        pathname="/"
        schema={[SCHEMAS.organization, SCHEMAS.localBusiness, SCHEMAS.breadcrumbHome]}
      />

      {/* ========== APRESENTAÇÃO CINEMATOGRÁFICA ========== */}
      {showIntro && (
        <Suspense fallback={null}>
          <PremiumCinematicIntro onComplete={handleIntroComplete} />
        </Suspense>
      )}

      {/* ========== SANFONA DE EMPRESAS ========== */}
      <SanfonaHero />

      {/* ========== HERO SECTION COM VÍDEO ========== */}
      <section className="relative min-h-[calc(100vh-var(--header-height))] md:h-[calc(100vh-var(--header-height))] flex items-center justify-center overflow-hidden bg-wg-black pb-16 sm:pb-20 hero-under-header">
        <HeroVideo />
        <div className="absolute inset-0 bg-gradient-to-b from-wg-black/70 via-wg-black/50 to-wg-black/70 z-10"></div>

        <div className="relative z-20 container-custom w-full max-w-[1500px] mx-auto text-center text-white px-4 sm:px-6 lg:px-8">
          {/* H1 Principal - Responsivo para mobile */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: showIntro ? 0 : 1, y: showIntro ? 40 : 0 }}
            transition={{ duration: 1, delay: showIntro ? 0 : 0.3, ease: "easeOut" }}
            className="wg-heading-display text-2xl sm:text-3xl md:text-4xl lg:text-[44px] xl:text-[48px] 2xl:text-[50px] mb-6 leading-tight tracking-tight"
          >
            Arquitetura, engenharia e marcenaria de alto padrão.
          </motion.h1>

          {/* Subtítulo */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: showIntro ? 0 : 1, y: showIntro ? 30 : 0 }}
            transition={{ duration: 1, delay: showIntro ? 0 : 0.6, ease: "easeOut" }}
            className="text-base sm:text-xl md:text-2xl lg:text-3xl font-light mb-4 text-white/90 px-2"
          >
            {t('home.hero.subtitle')}
          </motion.p>

          {/* H2 Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: showIntro ? 0 : 1, y: showIntro ? 30 : 0 }}
            transition={{ duration: 1, delay: showIntro ? 0 : 0.9, ease: "easeOut" }}
            className="text-base md:text-lg lg:text-xl font-light mb-8 max-w-3xl mx-auto text-white/70 leading-relaxed"
          >
            {t('home.hero.subheadline')}
          </motion.p>

          {/* Frases de impacto rotativas */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: showIntro ? 0 : 1 }}
            transition={{ duration: 1, delay: showIntro ? 0 : 1.2 }}
            className="h-12 mb-10"
          >
            <AnimatePresence mode="wait">
              <motion.p
                key={currentPhraseIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6 }}
                className="text-lg md:text-xl lg:text-2xl font-light italic text-wg-orange"
              >
                {impactPhrases[currentPhraseIndex]}
              </motion.p>
            </AnimatePresence>
          </motion.div>
          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: showIntro ? 0 : 1, y: showIntro ? 30 : 0 }}
            transition={{ duration: 1, delay: showIntro ? 0 : 1.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/sobre">
              <Button className="wg-btn-pill-primary">
                {t('home.hero.ctaPrimary')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/processo">
              <Button className="h-auto px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 bg-white/5 text-white border border-white/40 hover:bg-white/15 hover:text-white">
                {t('home.hero.ctaSecondary')}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ========== BLOCO DE NÚMEROS / RESULTADOS - DINÂMICO ========== */}
      <section ref={statsSectionRef} className="py-6 bg-wg-gray-light">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {/* Projetos em Andamento - Contratos Ativos +1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0 }}
              className="text-center"
            >
              <div className="text-3xl md:text-4xl lg:text-5xl font-inter font-light text-wg-orange mb-1">
                {displayStats.projetosAndamento}<span className="text-xl md:text-2xl">+</span>
              </div>
              <p className="text-sm md:text-base text-wg-gray font-light">
                <Trans i18nKey="home.stats.inProgress">
                  Projetos em<br />andamento
                </Trans>
              </p>
            </motion.div>

            {/* Clientes Atendidos - Soma quando contrato ativa */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center"
            >
              <div className="text-3xl md:text-4xl lg:text-5xl font-inter font-light text-wg-orange mb-1">
                +{displayStats.clientesAtendidos}
              </div>
              <p className="text-sm md:text-base text-wg-gray font-light">
                <Trans i18nKey="home.stats.clients">
                  Clientes<br />atendidos
                </Trans>
              </p>
            </motion.div>

            {/* Metros de Revestimentos - Soma de contratos ativos */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <div className="text-3xl md:text-4xl lg:text-5xl font-inter font-light text-wg-orange mb-1">
                +{displayStats.metrosRevestimentos}
                <span className="text-xl md:text-2xl">{estatisticas.metrosRevestimentos >= 1000 ? 'mil' : ''}</span>
              </div>
              <p className="text-sm md:text-base text-wg-gray font-light">
                <Trans i18nKey="home.stats.coverings">
                  Metros de revestimentos<br />assentados
                </Trans>
              </p>
            </motion.div>

            {/* Horas Projetando - Automático desde o primeiro CNPJ */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center"
            >
              <div className="text-3xl md:text-4xl lg:text-5xl font-inter font-light text-wg-orange mb-1">
                {displayStats.horasProjetando}
                <span className="text-xl md:text-2xl">{estatisticas.horasProjetando >= 1000 ? 'mil' : ''}</span>
              </div>
              <p className="text-sm md:text-base text-wg-gray font-light">
                <Trans i18nKey="home.stats.hours">
                  Horas projetando<br />e construindo historias
                </Trans>
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== CARDS DE ESTILOS EM DESTAQUE ========== */}
      <section className="pt-6 pb-0 bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="wg-heading-display text-2xl md:text-3xl text-wg-black mb-2">
              Estilos em Destaque
            </h2>
            <p className="wg-text-body">Encontre o estilo que combina com você</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Minimalismo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
            >
              <Link to="/estilos/minimalismo" className="group block">
                <div className="relative aspect-[4/5] rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                  <img
                    src="https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=400&h=500&q=58&fm=webp"
                    srcSet="https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=240&h=300&q=50&fm=webp 240w, https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=320&h=400&q=55&fm=webp 320w, https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=400&h=500&q=58&fm=webp 400w"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 30vw, 20vw"
                    width="400"
                    height="500"
                    alt="Estilo Minimalismo"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex gap-1 mb-2">
                      {['#FFFFFF', '#000000', '#808080'].map((color, idx) => (
                        <div key={idx} className="w-4 h-4 rounded-full border border-white/50" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                    <h3 className="text-white font-semibold text-lg">Minimalismo</h3>
                    <p className="text-white/70 text-xs line-clamp-2">Menos é mais. Linhas retas e elegância.</p>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Moderno */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Link to="/estilos/moderno" className="group block">
                <div className="relative aspect-[4/5] rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                  <img
                    src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&h=500&q=58&fm=webp"
                    srcSet="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=240&h=300&q=50&fm=webp 240w, https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=320&h=400&q=55&fm=webp 320w, https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&h=500&q=58&fm=webp 400w"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 30vw, 20vw"
                    width="400"
                    height="500"
                    alt="Estilo Moderno"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex gap-1 mb-2">
                      {['#2C3E50', '#ECF0F1', '#3498DB'].map((color, idx) => (
                        <div key={idx} className="w-4 h-4 rounded-full border border-white/50" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                    <h3 className="text-white font-semibold text-lg">Moderno</h3>
                    <p className="text-white/70 text-xs line-clamp-2">Design contemporâneo e tecnologia.</p>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Industrial */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Link to="/estilos/industrial" className="group block">
                <div className="relative aspect-[4/5] rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                  <img
                    src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=400&h=500&q=58&fm=webp"
                    srcSet="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=240&h=300&q=50&fm=webp 240w, https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=320&h=400&q=55&fm=webp 320w, https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=400&h=500&q=58&fm=webp 400w"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 30vw, 20vw"
                    width="400"
                    height="500"
                    alt="Estilo Industrial"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex gap-1 mb-2">
                      {['#2C2C2C', '#B87333', '#708090'].map((color, idx) => (
                        <div key={idx} className="w-4 h-4 rounded-full border border-white/50" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                    <h3 className="text-white font-semibold text-lg">Industrial</h3>
                    <p className="text-white/70 text-xs line-clamp-2">Estética urbana e estruturas expostas.</p>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Contemporâneo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <Link to="/estilos/contemporaneo" className="group block">
                <div className="relative aspect-[4/5] rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                  <img
                    src="https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=400&h=500&q=58&fm=webp"
                    srcSet="https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=240&h=300&q=50&fm=webp 240w, https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=320&h=400&q=55&fm=webp 320w, https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=400&h=500&q=58&fm=webp 400w"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 30vw, 20vw"
                    width="400"
                    height="500"
                    alt="Estilo Contemporâneo"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex gap-1 mb-2">
                      {['#2F4F4F', '#FFFFFF', '#DAA520'].map((color, idx) => (
                        <div key={idx} className="w-4 h-4 rounded-full border border-white/50" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                    <h3 className="text-white font-semibold text-lg">Contemporâneo</h3>
                    <p className="text-white/70 text-xs line-clamp-2">Flexível, eclético e sempre atual.</p>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Japandi */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <Link to="/estilos/japandi" className="group block">
                <div className="relative aspect-[4/5] rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                  <img
                    src="https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=400&h=500&q=58&fm=webp"
                    srcSet="https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=240&h=300&q=50&fm=webp 240w, https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=320&h=400&q=55&fm=webp 320w, https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=400&h=500&q=58&fm=webp 400w"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 30vw, 16vw"
                    width="400"
                    height="500"
                    alt="Estilo Japandi"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex gap-1 mb-2">
                      {['#F5F5DC', '#2F4F4F', '#D4C5B9'].map((color, idx) => (
                        <div key={idx} className="w-4 h-4 rounded-full border border-white/50" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                    <h3 className="text-white font-semibold text-lg">Japandi</h3>
                    <p className="text-white/70 text-xs line-clamp-2">Fusão zen japonesa e escandinava.</p>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Novo Card: Clássico */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
            >
              <Link to="/estilos/classico" className="group block">
                <div className="relative aspect-[4/5] rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                  <img
                    src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&h=500&q=58&fm=webp"
                    srcSet="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=240&h=300&q=50&fm=webp 240w, https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=320&h=400&q=55&fm=webp 320w, https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&h=500&q=58&fm=webp 400w"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 30vw, 16vw"
                    width="400"
                    height="500"
                    alt="Estilo Clássico"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex gap-1 mb-2">
                      {['#E5C07B', '#A67C52', '#FFFFFF'].map((color, idx) => (
                        <div key={idx} className="w-4 h-4 rounded-full border border-white/50" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                    <h3 className="text-white font-semibold text-lg">Clássico</h3>
                    <p className="text-white/70 text-xs line-clamp-2">Elegância atemporal e detalhes sofisticados.</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>

          {/* Espaço entre cards e link */}
          <div className="h-6 md:h-8" />
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-0 mb-0"
          >
            <Link
              to="/revista-estilos"
              className="inline-flex items-center gap-2 text-wg-orange hover:text-wg-brown font-medium transition-colors"
              style={{ marginBottom: 0, paddingBottom: 0 }}
            >
              Ver todos os 30 estilos
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      <div className="wg-neon-divider" aria-hidden="true" />

      {/* ========== BLOCO TURN KEY PREMIUM ========== */}
      <section className="py-[68px] bg-wg-black text-white relative overflow-hidden">
        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <span className="text-wg-orange font-medium text-sm tracking-widest uppercase mb-4 block">
              {t('home.turnKey.kicker')}
            </span>
            <h2 className="wg-heading-display text-3xl md:text-4xl lg:text-5xl mb-8 leading-tight">
              {t('home.turnKey.title')}
            </h2>

            <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-12 mb-10">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-wg-green rounded-full"></div>
                <span className="text-xl font-light">{t('home.turnKey.points.0')}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-wg-blue rounded-full"></div>
                <span className="text-xl font-light">{t('home.turnKey.points.1')}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-wg-orange rounded-full"></div>
                <span className="text-xl font-light">{t('home.turnKey.points.2')}</span>
              </div>
            </div>

            <p className="text-lg text-white/70 leading-relaxed max-w-3xl mx-auto mb-8 font-light">
              {t('home.turnKey.paragraph')}
            </p>

            <p className="text-xl italic text-wg-orange">
              {t('home.turnKey.quote')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ========== BLOCO INSTITUCIONAL - QUEM SOMOS ========== */}
      <section className="pt-8 pb-8 bg-white relative overflow-hidden">
        {/* Efeito neon atrás do bloco, mas sem sobrepor o conteúdo */}
        <div className="absolute inset-0 z-0 pointer-events-none select-none">
          <AnimatedStrokes variant="colorCycle" opacity={0.08} count={5} duration={4} />
        </div>
        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="wg-card-editorial">
              <div className="p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-[72px_1fr] gap-6 md:gap-8">
                  <div className="md:h-full">
                    <div className="grid grid-cols-3 md:grid-cols-1 md:grid-rows-3 gap-2 md:gap-0 h-full">
                      {logosNucleos.map((logo, index) => (
                        <div
                          key={logo.src}
                          className={`flex justify-center ${index === 0 ? 'md:items-start' : index === 2 ? 'md:items-end' : 'md:items-center'}`}
                        >
                          <img
                            src={logo.src}
                            alt={logo.alt}
                            width="84"
                            height="84"
                            loading="lazy"
                            decoding="async"
                            className="w-12 md:w-full h-auto max-h-14 object-contain opacity-70 scale-[1.45]"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="md:grid md:grid-rows-[auto_auto_auto] md:gap-4">
                    <div>
                      <p className={`mb-2 text-wg-gray ${editorialScale.kicker}`}>{t('home.about.kicker', { years: estatisticas.anosExperiencia })}</p>
                      <h2 className={`mb-4 normal-case tracking-tight font-semibold ${editorialScale.title}`}>{t('home.about.title')}</h2>
                    </div>
                    <p className={editorialScale.body}>
                      {t('home.about.paragraphs.0')}
                    </p>
                    <p className={editorialScale.body}>
                      <Trans i18nKey="home.about.paragraphs.1">
                        Entregamos <strong className="font-medium text-wg-black">controle, previsibilidade e tranquilidade</strong> para quem valoriza excelencia.
                      </Trans>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========== BLOCO FERRAMENTA MOODBOARD ========== */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
        {/* Background decorativo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-wg-orange blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-wg-blue blur-3xl"></div>
        </div>

        <div className="container-custom relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Conteúdo */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="wg-heading-display text-3xl md:text-4xl lg:text-5xl mb-6 leading-tight">
                Crie seu <span className="text-wg-orange">Moodboard</span> e visualize suas cores no ambiente
              </h2>

              <p className="text-lg text-white/70 leading-relaxed mb-8 font-light">
                Selecione paletas de cores, escolha estilos de decoração e veja como ficam aplicados em ambientes reais. Transforme paredes, sofás, cortinas e muito mais.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 text-white/80">
                  <CheckCircle2 className="w-5 h-5 text-wg-orange" />
                  <span className="text-sm">10 paletas de cores</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <CheckCircle2 className="w-5 h-5 text-wg-orange" />
                  <span className="text-sm">12 estilos de decoração</span>
                </div>
              </div>

              <Link to="/moodboard">
                <Button className="wg-btn-pill-primary">
                  <Palette className="w-5 h-5 mr-2" />
                  Criar Meu Moodboard
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </motion.div>

            {/* Interactive Color Transformer */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <Suspense fallback={<div className="aspect-video rounded-2xl bg-white/5 border border-white/10" />}>
                <HomeColorTransformer />
              </Suspense>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== BLOCO DESTAQUE - UNIDADE DE ENGENHARIA TURN KEY ========== */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-stretch">
            {/* Bloco Visual - Imagem com overlay */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative h-[400px] lg:h-auto lg:min-h-[500px] overflow-hidden rounded-t-2xl lg:rounded-l-2xl lg:rounded-tr-none"
            >
              <img
                src="/images/banners/ENGENHARIA.webp"
                srcSet="/images/banners/ENGENHARIA-640.webp 640w, /images/banners/ENGENHARIA-960-opt.webp 960w, /images/banners/ENGENHARIA-1280.webp 1280w, /images/banners/ENGENHARIA.webp 1920w"
                sizes="(max-width: 1024px) 100vw, 50vw"
                alt={t('home.turnKeyBlock.imageAlt')}
                className="w-full h-full object-cover"
                width="1920"
                height="1080"
                loading="lazy"
                decoding="async"
                fetchPriority="low"
              />
              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-wg-blue/90 via-wg-blue/70 to-transparent" />

              {/* Badge Turn Key */}
              <div className="absolute bottom-8 left-8 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 lg:left-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-wg-blue" />
                    </div>
                    <div>
                      <p className="text-white/70 text-xs uppercase tracking-wider">{t('home.turnKeyBadge.label')}</p>
                      <p className="text-white font-inter font-medium text-lg">{t('home.turnKeyBadge.unit')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-wg-orange rounded-full animate-pulse" />
                    <span className="text-white/90 text-sm font-light">{t('home.turnKeyBadge.tag')}</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Bloco Conteúdo */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-wg-blue text-white p-8 lg:p-12 rounded-b-2xl lg:rounded-r-2xl lg:rounded-bl-none flex flex-col justify-center"
            >
              <span className="text-wg-orange font-medium text-sm tracking-widest uppercase mb-4 block">
                {t('home.turnKeyBlock.kicker')}
              </span>

              <h2 className="text-2xl md:text-3xl lg:text-4xl font-inter font-light mb-6 leading-tight tracking-tight">
                <Trans i18nKey="home.turnKeyBlock.title">
                  Do projeto a entrega,<br />
                  <span className="text-white/70">sem ruidos.</span>
                </Trans>
              </h2>

              <p className="text-white/80 leading-relaxed mb-6 font-light">
                {t('home.turnKeyBlock.paragraph')}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-wg-orange" />
                  </div>
                  <span className="text-sm text-white/90">{t('home.turnKeyBlock.benefits.0')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-wg-orange" />
                  </div>
                  <span className="text-sm text-white/90">{t('home.turnKeyBlock.benefits.1')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-wg-orange" />
                  </div>
                  <span className="text-sm text-white/90">{t('home.turnKeyBlock.benefits.2')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-wg-orange" />
                  </div>
                  <span className="text-sm text-white/90">{t('home.turnKeyBlock.benefits.3')}</span>
                </div>
              </div>

              <p className="text-lg italic text-wg-orange mb-8">
                {t('home.turnKeyBlock.quote')}
              </p>

              <Link to="/engenharia" className="inline-flex items-center gap-2 text-white font-medium group">
                {t('home.turnKeyBlock.cta')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== BLOCO METODOLOGIA (antes PROCESSO) ========== */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <span className="text-wg-orange font-medium text-sm tracking-widest uppercase mb-4 block">
              {t('home.methodology.kicker')}
            </span>
            <h2 className="wg-heading-display text-3xl md:text-4xl lg:text-5xl text-wg-black mb-4">
              {t('home.methodology.title')}
            </h2>
            <p className="wg-text-body max-w-2xl mx-auto">
              {t('home.methodology.subtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {metodologia.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center group"
              >
                <div className="relative mb-4">
                  <div className="w-16 h-16 mx-auto bg-wg-gray-light rounded-2xl flex items-center justify-center group-hover:bg-wg-orange transition-colors duration-300">
                    <step.icon className="w-7 h-7 text-wg-black group-hover:text-white transition-colors duration-300" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-wg-orange text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {index + 1}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-wg-black mb-1 normal-case">
                  {step.title}
                </h3>
                <p className="text-xs text-wg-gray font-light">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center mt-12"
          >
            <p className="text-xl italic text-wg-orange">
              {t('home.methodology.quote')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ========== GALERIA DE PROJETOS ========== */}
      <section ref={projectGalleryRef} aria-label="Galeria de projetos">
        {projectGalleryVisible ? (
          <Suspense fallback={<div className="h-[560px] bg-wg-gray-light" aria-hidden="true" />}>
            <ProjectGallery />
          </Suspense>
        ) : (
          <div className="h-[560px] bg-wg-gray-light" aria-hidden="true" />
        )}
      </section>
      {/* ========== BLOCO EXPERIÊNCIA & TECNOLOGIA ========== */}
      <section className="py-12 md:py-16 relative overflow-hidden bg-gradient-to-br from-white via-wg-gray-light to-white">
        <div className="absolute -top-24 -right-20 h-72 w-72 rounded-full bg-wg-orange/10 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-wg-blue/10 blur-3xl"></div>
        <div className="container-custom relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <span className="text-wg-orange font-poppins text-xs tracking-[0.35em] uppercase mb-4 block">
                {t('home.dashboard.kicker')}
              </span>
              <h2 className="wg-heading-display text-3xl md:text-5xl text-wg-black mb-6 leading-tight">
                {t('home.dashboard.title')}
              </h2>
              <p className="wg-text-body mb-8">
                {t('home.dashboard.paragraph')}
              </p>

              <div className="flex flex-wrap gap-3 mb-8">
                {clientAreaFeatures.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: index * 0.08 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur border border-wg-black/5 shadow-sm"
                  >
                    <feature.icon className="w-4 h-4 text-wg-orange" />
                    <span className="text-xs font-medium text-wg-black">{feature.title}</span>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white/90 border border-wg-black/5 p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-wg-gray">{t('home.dashboard.cards.0.label')}</p>
                  <p className="text-base font-medium text-wg-black mt-2">
                    {t('home.dashboard.cards.0.value')}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/90 border border-wg-black/5 p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-wg-gray">{t('home.dashboard.cards.1.label')}</p>
                  <p className="text-base font-medium text-wg-black mt-2">
                    {t('home.dashboard.cards.1.value')}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="absolute -inset-6 rounded-3xl bg-wg-black/5 blur-2xl"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl p-5 md:p-7 border border-wg-black/5">
                <div className="bg-wg-black rounded-2xl p-4 mb-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-wg-orange"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <span className="text-white text-xs font-poppins tracking-[0.2em] uppercase">WG Easy</span>
                  </div>
                  <div className="mt-3 text-white/60 text-xs font-mono">{t('home.dashboard.systemUrl')}</div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="rounded-xl bg-wg-gray-light p-3">
                    <p className="text-[11px] text-wg-gray uppercase tracking-[0.2em]">{t('home.dashboard.panel.phase.label')}</p>
                    <p className="text-sm font-semibold text-wg-black mt-1">{t('home.dashboard.panel.phase.value')}</p>
                  </div>
                  <div className="rounded-xl bg-wg-gray-light p-3">
                    <p className="text-[11px] text-wg-gray uppercase tracking-[0.2em]">{t('home.dashboard.panel.deadline.label')}</p>
                    <p className="text-sm font-semibold text-wg-black mt-1">{t('home.dashboard.panel.deadline.value')}</p>
                  </div>
                  <div className="rounded-xl bg-wg-gray-light p-3">
                    <p className="text-[11px] text-wg-gray uppercase tracking-[0.2em]">{t('home.dashboard.panel.control.label')}</p>
                    <p className="text-sm font-semibold text-wg-black mt-1">{t('home.dashboard.panel.control.value')}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-wg-gray-light rounded-xl">
                    <span className="text-sm font-medium">{t('home.dashboard.panel.items.0.label')}</span>
                    <span className="text-xs text-white bg-green-500 px-2 py-1 rounded">{t('home.dashboard.panel.items.0.status')}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-wg-gray-light rounded-xl">
                    <span className="text-sm font-medium">{t('home.dashboard.panel.items.1.label')}</span>
                    <span className="text-xs text-white bg-wg-orange px-2 py-1 rounded">{t('home.dashboard.panel.items.1.status')}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-wg-gray-light rounded-xl">
                    <span className="text-sm font-medium">{t('home.dashboard.panel.items.2.label')}</span>
                    <span className="text-xs text-wg-gray bg-gray-200 px-2 py-1 rounded">{t('home.dashboard.panel.items.2.status')}</span>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-wg-black px-4 py-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/60">{t('home.dashboard.panel.status.label')}</p>
                      <p className="text-sm font-medium mt-1">{t('home.dashboard.panel.status.value')}</p>
                      <p className="text-xs text-white/70 mt-1">{t('home.dashboard.panel.status.helper')}</p>
                    </div>
                    <div className="relative h-14 w-14">
                      <div className="absolute inset-0 rounded-full bg-white/10"></div>
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: 'conic-gradient(#F25C26 0deg, #F25C26 240deg, rgba(255,255,255,0.15) 240deg 360deg)'
                        }}
                      ></div>
                      <div className="absolute inset-2 rounded-full bg-wg-black flex items-center justify-center text-[11px] font-semibold">
                        67%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== GOOGLE REVIEWS ========== */}
      <section ref={reviewsRef} aria-label="Avaliações Google">
        {reviewsVisible ? (
          <Suspense fallback={<div className="h-[160px] bg-white" aria-hidden="true" />}>
            <GoogleReviewsBadge />
          </Suspense>
        ) : (
          <div className="h-[160px] bg-white" aria-hidden="true" />
        )}
      </section>

      {/* ========== ASSISTENTE IA - LIZ ========== */}
      {/* <LizAssistant /> */} {/* DESATIVADO - Manter apenas WhatsApp */}

      {/* ========== ENCERRAMENTO INSTITUCIONAL ========== */}
      <section className="relative overflow-hidden py-14 md:py-20 bg-wg-black text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 20% 10%, rgba(242,92,38,0.18), transparent 45%), radial-gradient(circle at 80% 90%, rgba(255,255,255,0.08), transparent 40%)",
          }}
        />
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative max-w-2xl mx-auto"
          >
            <h2 className="text-2xl md:text-3xl lg:text-3xl font-inter font-medium mb-5 leading-tight normal-case tracking-tight [text-wrap:balance] [text-shadow:0_8px_32px_rgba(0,0,0,0.35)] [&>span:first-of-type]:bg-gradient-to-r [&>span:first-of-type]:from-white/90 [&>span:first-of-type]:to-white/70 [&>span:first-of-type]:bg-clip-text [&>span:first-of-type]:text-transparent [&>span:last-of-type]:bg-gradient-to-r [&>span:last-of-type]:from-wg-orange [&>span:last-of-type]:to-wg-orange [&>span:last-of-type]:bg-clip-text [&>span:last-of-type]:text-transparent">
              <Trans i18nKey="home.closing.title">
                Grupo WG Almeida.<br />
                <span className="text-white/70">Onde ideias ganham forma, processos ganham controle</span><br />
                <span className="text-wg-orange">e espacos ganham alma.</span>
              </Trans>
            </h2>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-7">
              <Link to="/contato" className="inline-flex items-center justify-center wg-btn-pill-primary">
                {t('home.closing.ctaPrimary')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link to="/projetos" className="inline-flex items-center justify-center wg-btn-pill-secondary">
                {t('home.closing.ctaSecondary')}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Home;



