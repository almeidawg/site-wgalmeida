import React, { useRef, useState } from 'react';
import SEO from '@/components/SEO';
import { motion } from '@/lib/motion-lite';
import { Target, Eye, Award, Users, Clock, CheckCircle, Building, Play, Pause, Quote } from 'lucide-react';
import ResponsiveWebpImage from '@/components/ResponsiveWebpImage';
import { Trans, useTranslation } from 'react-i18next';
import { SCHEMAS } from '@/data/schemaConfig';
import { withBasePath } from '@/utils/assetPaths';

const valueStyles = {
  'wg-orange': {
    line: 'bg-wg-orange',
    iconWrap: 'bg-wg-orange/10',
    icon: 'text-wg-orange',
    halo: 'bg-wg-orange/5',
  },
  'wg-green': {
    line: 'bg-wg-green',
    iconWrap: 'bg-wg-green/10',
    icon: 'text-wg-green',
    halo: 'bg-wg-green/5',
  },
  'wg-blue': {
    line: 'bg-wg-blue',
    iconWrap: 'bg-wg-blue/10',
    icon: 'text-wg-blue',
    halo: 'bg-wg-blue/5',
  },
  'wg-brown': {
    line: 'bg-wg-brown',
    iconWrap: 'bg-wg-brown/10',
    icon: 'text-wg-brown',
    halo: 'bg-wg-brown/5',
  },
};

// Animações elegantes
const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
};

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.15 } },
  viewport: { once: true }
};

const ABOUT_FALLBACK_SRC = withBasePath('/images/banners/SOBRE.webp');
const ABOUT_WILLIAM_IMAGE_SRC = withBasePath('/images/about/william-almeida-1200.webp');
const ABOUT_WILLIAM_IMAGE_SRCSET = [
  `${withBasePath('/images/about/william-almeida-800.webp')} 800w`,
  `${ABOUT_WILLIAM_IMAGE_SRC} 1200w`,
].join(', ');

const About = () => {
  const { t } = useTranslation();

  const values = [
    {
      icon: Target,
      title: t('aboutPage.values.mission.title'),
      description: t('aboutPage.values.mission.description'),
      color: 'wg-orange',
    },
    {
      icon: Eye,
      title: t('aboutPage.values.vision.title'),
      description: t('aboutPage.values.vision.description'),
      color: 'wg-green',
    },
    {
      icon: Award,
      title: t('aboutPage.values.values.title'),
      description: t('aboutPage.values.values.description'),
      color: 'wg-blue',
    },
    {
      icon: Users,
      title: t('aboutPage.values.purpose.title'),
      description: t('aboutPage.values.purpose.description'),
      color: 'wg-brown',
    },
  ];

  const stats = [
    { number: '14', label: t('aboutPage.stats.years'), icon: Clock },
    { number: '400+', label: t('aboutPage.stats.projects'), icon: CheckCircle },
    { number: '3', label: t('aboutPage.stats.units'), icon: Building },
    { number: '✓', label: t('aboutPage.stats.method'), icon: Target },
  ];

  return (
    <>
      <SEO
        pathname="/sobre"
        schema={[SCHEMAS.knowledgeGraph, SCHEMAS.personWilliam, SCHEMAS.breadcrumbAbout]}
      />

      {/* Hero com parallax sutil */}
      <section className="wg-page-hero wg-page-hero--store hero-under-header">
        <motion.div
          className="absolute inset-0 z-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <ResponsiveWebpImage
            className="w-full h-full object-cover"
            alt={t('aboutPage.hero.imageAlt')}
            src="/images/banners/SOBRE.webp"
            width="1920"
            height="1080"
            loading="eager"
            decoding="async"
            fetchpriority="high"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-wg-black/40 via-wg-black/60 to-wg-black/80"></div>
        </motion.div>

        <div className="container-custom">
          <div className="wg-page-hero-content px-4 pt-8 md:pt-10">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="wg-page-hero-kicker text-wg-orange"
          >
            {t('aboutPage.hero.kicker')}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="wg-page-hero-title"
          >
            {t('aboutPage.hero.title')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="wg-page-hero-subtitle max-w-3xl"
          >
            {t('aboutPage.hero.subtitle')}
          </motion.p>
          </div>
        </div>
      </section>

      {/* Estatísticas */}
      <section className="section-padding-tight-top bg-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-wg-orange rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-wg-green rounded-full blur-3xl" />
        </div>

        <div className="container-custom relative z-10">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="text-center group"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-wg-gray-light mb-4 group-hover:bg-wg-orange/10 transition-colors duration-300">
                  <stat.icon className="w-8 h-8 text-wg-orange" />
                </div>
                <motion.p
                  className="text-4xl md:text-5xl font-inter font-light text-wg-black mb-2"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                >
                  {stat.number}
                </motion.p>
                <p className="text-wg-gray text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-stretch mb-20">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black mb-6">
                {t('aboutPage.story.title')}
              </h2>
              <p className="text-lg text-wg-gray font-inter leading-relaxed mb-4">
                {t('aboutPage.story.paragraphs.0')}
              </p>
              <p className="text-lg text-wg-gray font-inter leading-relaxed mb-4">
                {t('aboutPage.story.paragraphs.1')}
              </p>
              <p className="text-lg text-wg-gray font-inter leading-relaxed">
                {t('aboutPage.story.paragraphs.2')}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative rounded-2xl overflow-hidden shadow-2xl h-full min-h-[360px]"
            >
              <ResponsiveWebpImage
                src="/images/hero-poster-1280.webp"
                alt={t('aboutPage.hero.imageAlt')}
                className="w-full h-full min-h-[360px] object-cover"
                loading="lazy"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-wg-black/30 to-transparent pointer-events-none" />
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const palette = valueStyles[value.color] || valueStyles['wg-orange'];
              return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="group relative bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden"
              >
                {/* Borda colorida no topo */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${palette.line} transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500`} />

                {/* Ícone com background */}
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${palette.iconWrap} mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <value.icon className={`w-7 h-7 ${palette.icon}`} />
                </div>

                <h3 className="text-xl font-inter font-light text-wg-black mb-3 tracking-tight">
                  {value.title}
                </h3>
                <p className="text-wg-gray leading-relaxed text-sm">{value.description}</p>

                {/* Elemento decorativo */}
                <div className={`absolute -bottom-4 -right-4 w-24 h-24 ${palette.halo} rounded-full group-hover:scale-150 transition-transform duration-700`} />
              </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========== SEÇÃO CEO WILLIAM ALMEIDA ========== */}
      <section className="section-padding bg-wg-black text-white relative overflow-hidden">
        {/* Background decorativo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-wg-orange rounded-full blur-[200px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-wg-blue rounded-full blur-[150px]" />
        </div>

        <div className="container-custom relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Foto do CEO */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="relative">
                {/* Moldura decorativa */}
                <div className="absolute -top-4 -left-4 w-full h-full border-2 border-wg-orange/30 rounded-2xl" />
                <div className="absolute -bottom-4 -right-4 w-full h-full border-2 border-wg-orange/20 rounded-2xl" />

                {/* Foto */}
                <div className="relative rounded-2xl overflow-hidden">
                  <picture>
                    <source
                      srcSet={ABOUT_WILLIAM_IMAGE_SRCSET}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      type="image/webp"
                    />
                    <img
                      src={ABOUT_WILLIAM_IMAGE_SRC}
                      alt={t('aboutPage.ceo.imageAlt')}
                      className="w-full h-[500px] lg:h-[600px] object-cover"
                      loading="lazy"
                      decoding="async"
                      width="1200"
                      height="1500"
                      onError={(event) => {
                        if (event.currentTarget.dataset.fallbackApplied === 'true') return;
                        event.currentTarget.dataset.fallbackApplied = 'true';
                        event.currentTarget.src = ABOUT_FALLBACK_SRC;
                      }}
                    />
                  </picture>
                  <div className="absolute inset-0 bg-gradient-to-t from-wg-black/60 via-transparent to-transparent" />

                  {/* Nome e cargo sobre a foto */}
                  <div className="absolute bottom-0 left-0 right-0 p-8">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 }}
                    >
                      <span className="text-wg-orange text-sm tracking-[0.2em] uppercase mb-2 block">
                        {t('aboutPage.ceo.role')}
                      </span>
                      <h3 className="text-3xl md:text-4xl font-inter font-light tracking-tight">
                        {t('aboutPage.ceo.name')}
                      </h3>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Storytelling */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Aspas decorativas */}
              <Quote className="w-12 h-12 text-wg-orange/30 mb-6" />

              <div className="space-y-6">
                <p className="text-lg md:text-xl text-white/90 font-light leading-relaxed">
                  <Trans i18nKey="aboutPage.ceo.paragraphs.0">
                    Antes de ser grupo, estrutura ou metodo, existia um desafio comum: <span className="text-wg-orange">decisoes sem dados claros</span>.
                  </Trans>
                </p>

                <p className="text-lg text-white/80 font-light leading-relaxed">
                  <Trans i18nKey="aboutPage.ceo.paragraphs.1">
                    A resposta nunca foi improvisada. <span className="text-white">Foi estrutura.</span>
                  </Trans>
                </p>

                <p className="text-base text-white/70 leading-relaxed">
                  {t('aboutPage.ceo.paragraphs.2')}
                </p>

                <p className="text-base text-white/70 leading-relaxed">
                  <Trans i18nKey="aboutPage.ceo.paragraphs.3">
                    Nesse contexto surgiu o <span className="text-wg-orange">WG Easy</span>.
                  </Trans>
                </p>

                <div className="pt-6 border-t border-white/10">
                  <p className="text-lg text-white/90 font-light leading-relaxed">
                    <Trans i18nKey="aboutPage.ceo.paragraphs.4">
                      O Grupo WG Almeida se consolida como uma estrutura que une <span className="text-wg-orange">visao executiva</span>.
                    </Trans>
                  </p>
                </div>

                {/* Assinatura */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-4 pt-6"
                >
                  <div className="w-12 h-0.5 bg-wg-orange" />
                  <span className="text-wg-orange tracking-wide">{t('aboutPage.ceo.signature')}</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-gradient-to-b from-wg-gray-light to-white relative overflow-hidden">
        {/* Padrão decorativo de fundo */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute top-20 left-20 w-64 h-64 border border-wg-black rounded-full" />
          <div className="absolute bottom-20 right-20 w-48 h-48 border border-wg-black rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-wg-black rounded-full" />
        </div>

        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Linha decorativa */}
            <motion.div
              className="flex items-center justify-center gap-4 mb-8"
              initial={{ opacity: 0, scaleX: 0 }}
              whileInView={{ opacity: 1, scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-wg-orange" />
              <div className="w-2 h-2 bg-wg-orange rounded-full" />
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-wg-orange" />
            </motion.div>

            <span className="text-wg-orange tracking-[0.2em] uppercase text-sm mb-4 block">
              {t('aboutPage.differential.kicker')}
            </span>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-inter font-light text-wg-black mb-8 tracking-tight">
              {t('aboutPage.differential.title')}
            </h2>

            <p className="text-lg md:text-xl text-wg-gray leading-relaxed mb-12">
              {t('aboutPage.differential.paragraph')}
            </p>

            {/* Citação elegante */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative"
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-8xl text-wg-orange/10 font-serif">"</div>
              <blockquote className="text-2xl md:text-3xl font-inter font-light italic text-wg-black relative z-10 px-8">
                {t('aboutPage.differential.quote')}
              </blockquote>
              <div className="w-16 h-1 bg-wg-orange mx-auto mt-8" />
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default About;

