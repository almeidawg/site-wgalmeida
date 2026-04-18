import React from 'react';
import SEO from '@/components/SEO';
import { motion } from '@/lib/motion-lite';
import { Link } from 'react-router-dom';
import {
  Palette, Type, Target, Heart, Lightbulb, Users, Ruler, Building2, Hammer,
  ArrowRight, CheckCircle2, Eye, Flag, Award, Shield, Zap,
  Clock, Users2, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ResponsiveWebpImage from '@/components/ResponsiveWebpImage';
import { useTranslation } from 'react-i18next';
import { withBasePath } from '@/utils/assetPaths';
import { getPublicPageImageSrc } from '@/data/publicPageImageCatalog';

const BRAND_LOGO_SRC = withBasePath('/images/logo-192.webp');
const A_MARCA_HERO_IMAGE = getPublicPageImageSrc('aMarca', withBasePath('/images/banners/ARQ.webp'));

const AMarca = () => {
  const { t } = useTranslation();
  const brandColors = t('brandPage.colors', { returnObjects: true });
  const brandValues = t('brandPage.values', { returnObjects: true });
  const nucleos = t('brandPage.nuclei.items', { returnObjects: true });
  const turnKeySteps = t('brandPage.turnKey.steps', { returnObjects: true });

  const valueIcons = [Target, Heart, Zap, Users2, TrendingUp, Shield, Lightbulb, Award];
  const nucleusIcons = [Ruler, Building2, Hammer];

  return (
    <div className="min-h-screen bg-white">
      <SEO
        pathname="/a-marca"
        keywords="marca wg almeida, identidade arquitetura, posicionamento premium, arquitetura alto padrao sp"
      />

      {/* Hero Banner com Imagem */}
      <section className="wg-page-hero wg-page-hero--store hero-under-header">
        <motion.div
          className="absolute inset-0 z-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <ResponsiveWebpImage
            className="w-full h-full object-cover"
            alt="Marca WG Almeida - Arquitetura, Engenharia e Marcenaria Premium"
            src={A_MARCA_HERO_IMAGE}
            width="1920"
            height="1080"
            loading="eager"
            decoding="async"
            fetchpriority="high"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-wg-black/35 via-wg-black/60 to-wg-black/80"></div>
        </motion.div>

        <div className="container-custom">
          <div className="wg-page-hero-content px-4 pt-8 md:pt-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="wg-page-hero-kicker text-white/78">
              {t('brandPage.hero.kicker')}
            </span>
            <h1 className="wg-page-hero-title">
              A Marca WG Almeida
            </h1>
            <p className="wg-page-hero-subtitle max-w-3xl">
              Nossa marca traduz uma operação integrada entre arquitetura, engenharia e marcenaria, com mais previsibilidade, clareza e excelência na entrega.
            </p>
          </motion.div>
          </div>
        </div>
      </section>

      {/* Proposito Section */}
      <section className="section-padding-tight-top bg-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-stretch">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-wg-orange/10 rounded-xl flex items-center justify-center">
                  <Palette className="w-7 h-7 text-wg-orange" />
                </div>
                <span className="text-sm text-wg-orange uppercase tracking-wider">{t('brandPage.purpose.kicker')}</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-inter font-light tracking-tight text-wg-black mb-6">
                {t('brandPage.purpose.title')}
              </h2>
              <div className="space-y-4 text-wg-gray text-lg leading-relaxed">
                <p>{t('brandPage.purpose.paragraphs.0')}</p>
                <p>{t('brandPage.purpose.paragraphs.1')}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative h-full"
            >
              <div className="rounded-2xl h-full min-h-[320px] bg-[#faf7f3] p-12 flex items-center justify-center shadow-sm">
                <img
                  src={BRAND_LOGO_SRC}
                  alt="Logo Grupo WG Almeida"
                  className="max-w-[70%] h-auto mx-auto"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-wg-orange/10 rounded-full -z-10" />
              <div className="absolute -top-4 -left-4 w-16 h-16 bg-wg-green/10 rounded-full -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Missao e Visao Section */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Missao */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 shadow-sm h-full"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 bg-wg-green/10 rounded-xl flex items-center justify-center">
                  <Flag className="w-7 h-7 text-wg-green" />
                </div>
                <h3 className="text-2xl font-inter font-light tracking-tight text-wg-black">{t('brandPage.mission.title')}</h3>
              </div>
              <p className="text-wg-gray text-lg mb-6">{t('brandPage.mission.paragraphs.0')}</p>
              <p className="text-wg-gray mb-6">{t('brandPage.mission.paragraphs.1')}</p>
              <div className="bg-wg-green/5 rounded-xl p-4 border-l-4 border-wg-green">
                <p className="text-sm text-wg-gray italic">{t('brandPage.mission.quote')}</p>
              </div>
            </motion.div>

            {/* Visao */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-8 shadow-sm h-full"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 bg-wg-blue/10 rounded-xl flex items-center justify-center">
                  <Eye className="w-7 h-7 text-wg-blue" />
                </div>
                <h3 className="text-2xl font-inter font-light tracking-tight text-wg-black">{t('brandPage.vision.title')}</h3>
              </div>
              <p className="text-wg-gray text-lg mb-6">{t('brandPage.vision.paragraphs.0')}</p>
              <p className="text-wg-gray">{t('brandPage.vision.paragraphs.1')}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {t('brandPage.vision.tags', { returnObjects: true }).map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-wg-blue/10 text-wg-blue text-sm rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Valores Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <Award className="w-12 h-12 text-wg-orange mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-inter font-light tracking-tight text-wg-black mb-4">
              {t('brandPage.valuesSection.title')}
            </h2>
            <p className="text-wg-gray max-w-2xl mx-auto">
              {t('brandPage.valuesSection.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {brandValues.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="bg-gray-50 p-6 rounded-xl hover:bg-white hover:shadow-lg transition-all group h-full"
              >
                <div className="w-12 h-12 bg-wg-orange/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-wg-orange transition-colors">
                  {React.createElement(valueIcons[index], { className: 'w-6 h-6 text-wg-orange group-hover:text-white transition-colors' })}
                </div>
                  <h3 className="font-inter text-lg font-light text-wg-black mb-2">
                    {value.title}
                  </h3>
                <p className="text-sm text-wg-gray">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Color Palette Section */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <Palette className="w-12 h-12 text-wg-orange mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-inter font-light tracking-tight text-wg-black mb-4">
              {t('brandPage.colorsSection.title')}
            </h2>
            <p className="text-wg-gray max-w-2xl mx-auto">
              {t('brandPage.colorsSection.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {brandColors.map((color, index) => (
              <motion.div
                key={color.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
              >
                <div
                  className="h-32 w-full"
                  style={{ backgroundColor: color.hex }}
                />
                <div className="p-6">
                    <h3 className="font-inter font-light text-wg-black mb-2">
                      {color.name}
                    </h3>
                  <div className="space-y-1 text-sm text-wg-gray mb-4">
                    <p className="font-mono">{color.hex}</p>
                    <p className="font-mono text-xs">{color.rgb}</p>
                  </div>
                  <p className="text-sm text-wg-gray mb-3">
                    {color.meaning}
                  </p>
                  <div className="flex items-center text-xs text-wg-gray">
                    <CheckCircle2 className="w-4 h-4 mr-2 text-wg-green" />
                    {color.usage}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Typography Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Type className="w-12 h-12 text-wg-blue mb-4" />
              <h2 className="text-3xl md:text-4xl font-inter font-light tracking-tight text-wg-black mb-6">
                {t('brandPage.typography.title')}
              </h2>
              <p className="text-wg-gray mb-8">
                {t('brandPage.typography.subtitle')}
              </p>

              <div className="space-y-6">
                <div className="p-6 bg-gray-50 rounded-xl">
                  <p className="text-sm text-wg-gray mb-2">{t('brandPage.typography.titleLabel')}</p>
                  <p className="text-3xl font-inter font-light tracking-tight text-wg-black">
                    Inter Light
                  </p>
                  <p className="text-sm text-wg-gray mt-2">
                    {t('brandPage.typography.titleDesc')}
                  </p>
                </div>

                <div className="p-6 bg-gray-50 rounded-xl">
                  <p className="text-sm text-wg-gray mb-2">{t('brandPage.typography.bodyLabel')}</p>
                  <p className="text-xl font-inter text-wg-black">
                    Inter Regular
                  </p>
                  <p className="text-sm text-wg-gray mt-2">
                    {t('brandPage.typography.bodyDesc')}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-wg-black to-gray-800 rounded-2xl p-8 text-white">
                <h3 className="font-inter font-light text-3xl mb-4 tracking-tight">
                  {t('brandPage.typography.sampleTitle')}
                </h3>
                <p className="font-inter text-gray-300 mb-6">
                  {t('brandPage.typography.sampleText')}
                </p>
                <div className="flex gap-2">
                  {brandColors.map((color) => (
                    <div
                      key={color.hex}
                      className="w-8 h-8 rounded-full"
                      style={{ backgroundColor: color.hex }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Three Nuclei Section */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl md:text-4xl font-inter font-light tracking-tight text-wg-black mb-4">
              {t('brandPage.nuclei.title')}
            </h2>
            <p className="text-wg-gray max-w-2xl mx-auto">
              {t('brandPage.nuclei.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {nucleos.map((nucleo, index) => (
              <motion.div
                key={nucleo.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative group"
              >
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: nucleo.color + '10' }}
                />
                <div className="relative bg-white rounded-2xl p-8 text-center shadow-sm group-hover:shadow-lg transition-all">
                  <div
                    className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6"
                    style={{ backgroundColor: nucleo.color + '15' }}
                  >
                    {React.createElement(nucleusIcons[index], {
                      className: 'w-10 h-10',
                      style: { color: nucleo.color }
                    })}
                  </div>
                  <h3 className="font-inter font-light text-2xl text-wg-black mb-4 tracking-tight">
                    {nucleo.name}
                  </h3>
                  <p className="text-wg-gray mb-6">
                    {nucleo.description}
                  </p>
                  <div
                    className="w-16 h-1 mx-auto rounded-full"
                    style={{ backgroundColor: nucleo.color }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Empreitada Global Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-2 bg-wg-blue/10 text-wg-blue rounded-full text-sm mb-4 font-light">
                {t('brandPage.turnKey.badge')}
              </span>
              <h2 className="text-3xl md:text-4xl font-inter font-light tracking-tight text-wg-black mb-4">
                {t('brandPage.turnKey.title')}
              </h2>
              <p className="text-wg-gray text-lg">
                {t('brandPage.turnKey.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {turnKeySteps.map((fase, index) => (
                <motion.div
                  key={fase.num}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl hover:bg-wg-orange/5 transition-colors group"
                >
                  <span className="text-2xl font-inter font-light tracking-tight text-wg-orange/30 group-hover:text-wg-orange transition-colors">
                    {fase.num}
                  </span>
                  <div>
                    <p className="font-inter text-wg-black text-sm">{fase.title}</p>
                    <p className="text-xs text-wg-gray">{fase.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-wg-black relative overflow-hidden">

        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-inter font-light tracking-tight text-white mb-6">
              {t('brandPage.cta.title')}
            </h2>
            <p className="text-gray-300 mb-8 text-lg">
              {t('brandPage.cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contato">
                <Button className="bg-wg-orange text-white px-6 py-3 rounded-md hover:bg-wg-orange/90 transition-all duration-300 hover:shadow-lg">
                  {t('brandPage.cta.primary')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/projetos">
                <Button className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-md hover:bg-white hover:text-wg-black transition-all duration-300">
                  {t('brandPage.cta.secondary')}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AMarca;

