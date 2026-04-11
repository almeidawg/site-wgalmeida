import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from '@/lib/motion-lite';
import { ArrowRight, Building2, Hammer, Ruler, MapPin, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import SEO, { schemas } from '@/components/SEO';
import { buildUnsplashSrcSet, normalizeUnsplashImageUrl } from '@/lib/unsplash';

const RegionTemplate = ({
  regionKey,
  region,
  title,
  metaDescription,
  heroImage,
  intro,
  services,
  highlights,
  cta
}) => {
  const toSlug = (value = '') =>
    value
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '-');

  const { t } = useTranslation();
  const regionContent = regionKey ? t(`regions.${regionKey}`, { returnObjects: true }) : null;
  const regionName = regionContent?.name || region;
  const regionSlug = regionKey || toSlug(regionName);
  const resolvedTitle = title || regionContent?.title;
  const resolvedMetaDescription = metaDescription || regionContent?.metaDescription;
  const canonicalUrl = `https://wgalmeida.com.br/${regionSlug}`;
  const rawHeroImage = heroImage || regionContent?.heroImage || '/images/hero-region.webp';
  const resolvedHeroImage = normalizeUnsplashImageUrl(rawHeroImage, {
    width: 1920,
    height: 1080,
    quality: 80,
  });
  const resolvedHeroSrcSet = buildUnsplashSrcSet(rawHeroImage, [
    { width: 640, height: 360, quality: 70, descriptor: '640w' },
    { width: 960, height: 540, quality: 75, descriptor: '960w' },
    { width: 1280, height: 720, quality: 80, descriptor: '1280w' },
    { width: 1600, height: 900, quality: 80, descriptor: '1600w' },
    { width: 1920, height: 1080, quality: 80, descriptor: '1920w' },
  ]);
  const resolvedIntro = intro || regionContent?.intro || [];
  const resolvedHighlights = highlights || regionContent?.highlights || [];
  const resolvedCta = cta || regionContent?.cta || {};

  const defaultServices = t('regions.defaults.services', { returnObjects: true });
  const servicesData = services || regionContent?.services || defaultServices;
  const serviceIcons = [Ruler, Building2, Hammer];
  const regionHighlightsTitle = (() => {
    const regionLabel = (regionName || '').trim();

    if (['Brooklin', 'Morumbi', 'Itaim', 'Paraiso'].includes(regionLabel)) {
      return `Por que escolher a WG Almeida no ${regionLabel}?`;
    }

    if (['Aclimacao', 'Mooca', 'Moema', 'Vila Mariana', 'Vila Nova Conceição', 'Cidade Jardim'].includes(regionLabel)) {
      return `Por que escolher a WG Almeida na ${regionLabel}?`;
    }

    if (['Jardins', 'Perdizes', 'Pinheiros'].includes(regionLabel)) {
      return `Por que escolher a WG Almeida nos ${regionLabel}?`;
    }

    return t('regions.defaults.highlightsTitle', { region: regionLabel });
  })();

  // Schema LocalBusiness para SEO local
  const localBusinessSchema = schemas.localBusiness(regionName);

  return (
    <>
      <SEO
        pathname={`/${regionSlug}`}
        title={`${resolvedTitle} | Grupo WG Almeida`}
        description={resolvedMetaDescription}
        url={canonicalUrl}
        schema={localBusinessSchema}
        og={{
          image: resolvedHeroImage || 'https://wgalmeida.com.br/images/og-home-1200x630.jpg',
        }}
        twitter={{
          image: resolvedHeroImage || 'https://wgalmeida.com.br/images/og-home-1200x630.jpg',
        }}
      />

      {/* Hero Section */}
      <section className="wg-page-hero hero-under-header bg-wg-black">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src={resolvedHeroImage || '/images/hero-region.webp'}
          srcSet={resolvedHeroSrcSet || undefined}
          sizes="100vw"
          alt={resolvedTitle}
          width="1920"
          height="1080"
          loading="eager"
          decoding="async"
          fetchpriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-wg-black/80 via-wg-black/60 to-wg-black/80" />

        <div className="relative z-10 container-custom text-center text-white px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-wg-orange" />
              <span className="text-wg-orange font-light text-sm tracking-[0.18em] uppercase">
                {regionName}
              </span>
            </div>
            <h1 className="wg-page-hero-title mb-6 normal-case">
              {resolvedTitle}
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Introdução */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <div className="prose prose-lg max-w-none">
              {resolvedIntro.map((paragraph, index) => (
                <p key={index} className="text-lg text-wg-gray leading-relaxed mb-6 font-light">
                  {paragraph}
                </p>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Serviços na Região */}
      <section className="section-padding bg-wg-gray-light">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="text-wg-orange font-light text-sm tracking-[0.18em] uppercase mb-4 block">
              {t('regions.defaults.coverage', { region: regionName })}
            </span>
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black normal-case tracking-tight">
              {t('regions.defaults.servicesTitle')}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {servicesData.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="bg-white rounded-2xl p-8 shadow-lg"
              >
                {React.createElement(serviceIcons[index], { className: 'w-10 h-10 text-wg-orange mb-4' })}
                <h3 className="text-xl font-inter font-light text-wg-black mb-4 normal-case">
                  {service.title}
                </h3>
                <ul className="space-y-2">
                  {service.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-wg-gray">
                      <CheckCircle className="w-4 h-4 text-wg-green flex-shrink-0" />
                      <span className="font-light">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      {resolvedHighlights && resolvedHighlights.length > 0 && (
        <section className="section-padding bg-white">
          <div className="container-custom">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black normal-case tracking-tight">
                {regionHighlightsTitle}
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {resolvedHighlights.map((highlight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-wg-gray-light"
                >
                  <div className="w-8 h-8 bg-wg-orange rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-wg-gray font-light">{highlight}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Quote */}
      <section className="py-16 bg-wg-black text-white">
        <div className="container-custom text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-xl md:text-2xl italic text-wg-orange max-w-3xl mx-auto"
          >
            {resolvedCta?.quote || t('regions.defaults.quote', { region: regionName })}
          </motion.p>
        </div>
      </section>

      {/* CTA Final */}
      <section className="section-padding bg-wg-gray-light">
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-2xl md:text-3xl font-inter font-light text-wg-black mb-6 normal-case tracking-tight">
              {resolvedCta?.title || t('regions.defaults.ctaTitle', { region: regionName })}
            </h2>
            <p className="text-wg-gray mb-8 font-light">
              {resolvedCta?.description || t('regions.defaults.ctaDescription')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contato">
                <Button className="btn-apple">
                  {t('regions.defaults.ctaPrimary')}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/projetos">
                <Button variant="outline" className="rounded-full border border-wg-black/12 bg-white/70 px-6 py-3 text-wg-black hover:border-wg-black/20 hover:bg-white">
                  {t('regions.defaults.ctaSecondary')}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default RegionTemplate;
