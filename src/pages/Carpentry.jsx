import React from 'react';
import SEO from '@/components/SEO';
import { motion } from '@/lib/motion-lite';
import { Hammer, Package, Ruler, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import ResponsiveWebpImage from '@/components/ResponsiveWebpImage';
import { getPublicPageImageSrc } from '@/data/publicPageImageCatalog';
import { useTranslation } from 'react-i18next';
import { SCHEMAS } from '@/data/schemaConfig';
import { WG_PRODUCT_MESSAGES } from '@/data/company';
import { PROJECT_SERVICE_HIGHLIGHTS } from '@/utils/cloudinaryProjectPortfolio';

// Animações elegantes
const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
};

const CARPENTRY_HERO_IMAGE = getPublicPageImageSrc('carpentry', '/images/banners/MARCENARIA.webp');

const Carpentry = () => {
  const { t } = useTranslation();

  const services = [
    {
      icon: Ruler,
      title: t('carpentryPage.services.0.title'),
      description: t('carpentryPage.services.0.description'),
    },
    {
      icon: Hammer,
      title: t('carpentryPage.services.1.title'),
      description: t('carpentryPage.services.1.description'),
    },
    {
      icon: Package,
      title: t('carpentryPage.services.2.title'),
      description: t('carpentryPage.services.2.description'),
    },
    {
      icon: Package,
      title: t('carpentryPage.services.3.title'),
      description: t('carpentryPage.services.3.description'),
    },
  ];

  return (
    <>
      <SEO
        pathname="/marcenaria"
        schema={[SCHEMAS.serviceWoodworking, SCHEMAS.breadcrumbWoodworking]}
      />

      {/* Hero elegante com cor da unidade */}
      <section className="wg-page-hero wg-page-hero--store hero-under-header">
        <motion.div
          className="absolute inset-0 z-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <ResponsiveWebpImage
            className="w-full h-full object-cover"
            alt={t('carpentryPage.hero.imageAlt')}
            src={CARPENTRY_HERO_IMAGE}
            width="1920"
            height="1080"
            loading="eager"
            decoding="async"
            fetchpriority="high"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-wg-brown/50 via-wg-brown/60 to-wg-black/80"></div>
        </motion.div>

        <div className="container-custom">
          <div className="wg-page-hero-content px-4 pt-8 md:pt-10">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="wg-page-hero-kicker"
          >
            {t('carpentryPage.hero.kicker')}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="wg-page-hero-title"
          >
            {t('carpentryPage.hero.title')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="wg-page-hero-subtitle max-w-3xl"
          >
            {t('carpentryPage.hero.subtitle')}
          </motion.p>

          {/* Badge da unidade */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-7"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3.5 text-sm backdrop-blur-sm md:px-6">
              <Package className="w-4 h-4" />
              {t('carpentryPage.hero.badge')}
            </span>
          </motion.div>
          </div>
        </div>
      </section>

      <section className="section-padding-tight-top bg-white relative overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-wg-brown rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-wg-brown rounded-full blur-3xl" />
        </div>

        <div className="container-custom relative z-10">
          <motion.div
            {...fadeInUp}
            className="text-center mb-10"
          >
            {/* Linha decorativa */}
            <motion.div
              className="flex items-center justify-center gap-4 mb-8"
              initial={{ opacity: 0, scaleX: 0 }}
              whileInView={{ opacity: 1, scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-wg-brown" />
              <div className="w-2 h-2 bg-wg-brown rounded-full" />
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-wg-brown" />
            </motion.div>

            <span className="text-wg-brown font-light tracking-[0.2em] uppercase text-sm mb-4 block">
              {t('carpentryPage.servicesKicker')}
            </span>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-inter font-light text-wg-black mb-4 tracking-tight">
              {t('carpentryPage.servicesTitle')}
            </h2>
            <p className="text-lg text-wg-gray max-w-2xl mx-auto">
              {t('carpentryPage.servicesSubtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="group relative bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden"
              >
                {/* Borda colorida no topo */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-wg-brown transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

                {/* Ícone com background */}
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-wg-brown/10 mb-5 group-hover:scale-110 transition-transform duration-300">
                  <service.icon className="w-7 h-7 text-wg-brown" />
                </div>

                <h3 className="text-xl font-inter font-light text-wg-black mb-3 tracking-tight">
                  {service.title}
                </h3>
                <p className="text-wg-gray leading-relaxed">{service.description}</p>

                {/* Elemento decorativo */}
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-wg-brown/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
              </motion.div>
            ))}
          </div>

          <motion.div
            {...fadeInUp}
            className="rounded-3xl border border-wg-brown/15 bg-gradient-to-br from-wg-brown/5 via-white to-white p-8 md:p-10 mb-20"
          >
            <div className="max-w-4xl">
              <span className="text-wg-brown font-light tracking-[0.2em] uppercase text-sm mb-4 block">
                Producao Paralela
              </span>
              <h3 className="text-2xl md:text-3xl font-inter font-light text-wg-black tracking-tight mb-4">
                Marcenaria nao entra apenas no fim. Ela precisa ser medida, aprovada e produzida no tempo certo
              </h3>
              <div className="space-y-3 text-wg-gray leading-relaxed">
                <p>
                  Em obras bem coordenadas, marcenaria funciona como frente de producao, com janela propria de medicao, aprovacao, fabricacao e montagem.
                </p>
                <p>
                  {WG_PRODUCT_MESSAGES.obraeasyPromise}
                </p>
                <p>
                  {WG_PRODUCT_MESSAGES.iccriPositioning}
                </p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              {/* Moldura decorativa */}
              <div className="absolute -inset-4 bg-gradient-to-br from-wg-brown/20 to-transparent rounded-2xl" />
              <img
                className="relative w-full h-[500px] object-cover rounded-xl shadow-2xl"
                alt={t('carpentryPage.commitment.imageAlt')}
               src={PROJECT_SERVICE_HIGHLIGHTS.carpentry} />

              {/* Badge flutuante */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="absolute -bottom-6 -right-6 bg-white p-5 rounded-xl shadow-xl max-w-[200px]"
              >
                <p className="text-sm font-inter font-light text-wg-brown italic leading-tight">{t('carpentryPage.commitment.badge')}</p>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="text-wg-brown font-light tracking-[0.2em] uppercase text-sm mb-4 block">
                {t('carpentryPage.commitment.kicker')}
              </span>

              <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black mb-6 tracking-tight">
                {t('carpentryPage.commitment.title')}
              </h2>

              <div className="space-y-4 text-wg-gray leading-relaxed">
                <p>
                  {t('carpentryPage.commitment.paragraphs.0')}
                </p>
                <p>
                  {t('carpentryPage.commitment.paragraphs.1')}
                </p>
                <p>
                  {t('carpentryPage.commitment.paragraphs.2')}
                </p>
              </div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-8"
              >
                <Link
                  to="/contato"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-wg-brown text-white rounded-lg hover:bg-wg-brown/90 transition-colors duration-300 group"
                >
                  <span>{t('carpentryPage.cta')}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </motion.div>
          </div>

          <motion.div
            {...fadeInUp}
            className="mt-20 rounded-3xl border border-wg-brown/15 bg-wg-black text-white p-8 md:p-10"
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-10 items-start">
              <div>
                <span className="text-white/60 font-light tracking-[0.2em] uppercase text-sm mb-4 block">
                  Add-on de experiencia visual
                </span>
                <h3 className="text-2xl md:text-3xl font-inter font-light tracking-tight mb-4">
                  Marcenaria performa melhor quando a aprovacao visual acontece antes da producao
                </h3>
                <div className="space-y-3 text-white/75 leading-relaxed">
                  <p>{WG_PRODUCT_MESSAGES.wgExperienceAddon}</p>
                  <p>
                    A camada de experiencia visual ajuda a organizar linguagem, atmosfera e uso antes de medicao final, desenho executivo e fabricacao sob medida.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  'Aprova materiais, acabamentos e sensacao do conjunto com menos ruído.',
                  'Melhora alinhamento entre cliente, arquiteto e equipe de producao.',
                  'Cria base mais clara para detalhamento, montagem e entrega final.',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <Sparkles className="w-5 h-5 text-wg-brown flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-white/80 font-light leading-relaxed">{item}</p>
                  </div>
                ))}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link
                    to="/solicite-proposta?service=Sistema%20de%20Experi%C3%AAncia%20Visual&context=carpentry"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-wg-brown text-white rounded-lg hover:bg-wg-brown/90 transition-colors duration-300"
                  >
                    <span>Adicionar ao escopo</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/moodboard-generator"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/15 text-white rounded-lg hover:bg-white/5 transition-colors duration-300"
                  >
                    Montar moodboard
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Carpentry;

