import React from 'react';
import SEO from '@/components/SEO';
import { motion } from '@/lib/motion-lite';
import { PenTool, Home, FileCheck, Users, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import ResponsiveWebpImage from '@/components/ResponsiveWebpImage';
import { useTranslation } from 'react-i18next';
import { SCHEMAS } from '@/data/schemaConfig';
import { WG_PRODUCT_MESSAGES } from '@/data/company';
import { PROJECT_SERVICE_HIGHLIGHTS } from '@/utils/cloudinaryProjectPortfolio';
import { getPublicPageImageSrc } from '@/data/publicPageImageCatalog';

// Animações elegantes
const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
};

const ARCHITECTURE_HERO_IMAGE = getPublicPageImageSrc('architecture', '/images/banners/ARQ.webp');

const Architecture = () => {
  const { t } = useTranslation();

  const services = [
    {
      icon: PenTool,
      title: t('architecturePage.services.0.title'),
      description: t('architecturePage.services.0.description'),
    },
    {
      icon: Home,
      title: t('architecturePage.services.1.title'),
      description: t('architecturePage.services.1.description'),
    },
    {
      icon: FileCheck,
      title: t('architecturePage.services.2.title'),
      description: t('architecturePage.services.2.description'),
    },
    {
      icon: Users,
      title: t('architecturePage.services.3.title'),
      description: t('architecturePage.services.3.description'),
    },
  ];

  return (
    <>
      <SEO
        pathname="/arquitetura"
        schema={[SCHEMAS.serviceArchitecture, SCHEMAS.breadcrumbArchitecture]}
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
            alt={t('architecturePage.hero.imageAlt')}
            src={ARCHITECTURE_HERO_IMAGE}
            width="1920"
            height="1080"
            loading="eager"
            decoding="async"
            fetchpriority="high"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-wg-green/50 via-wg-green/60 to-wg-black/80"></div>
        </motion.div>

        <div className="container-custom">
          <div className="wg-page-hero-content px-4 pt-8 md:pt-10">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="wg-page-hero-kicker"
          >
            {t('architecturePage.hero.kicker')}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="wg-page-hero-title"
          >
            {t('architecturePage.hero.title')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="wg-page-hero-subtitle max-w-3xl"
          >
            {t('architecturePage.hero.subtitle')}
          </motion.p>

          {/* Badge da unidade */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-7"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3.5 text-sm backdrop-blur-sm md:px-6">
              <PenTool className="w-4 h-4" />
              {t('architecturePage.hero.badge')}
            </span>
          </motion.div>
          </div>
        </div>
      </section>

      <section className="section-padding-tight-top bg-white relative overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-wg-green rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-wg-green rounded-full blur-3xl" />
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
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-wg-green" />
              <div className="w-2 h-2 bg-wg-green rounded-full" />
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-wg-green" />
            </motion.div>

            <span className="text-wg-green font-light tracking-[0.2em] uppercase text-sm mb-4 block">
              {t('architecturePage.servicesKicker')}
            </span>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-inter font-light text-wg-black mb-4 tracking-tight">
              {t('architecturePage.servicesTitle')}
            </h2>
            <p className="text-lg text-wg-gray max-w-2xl mx-auto">
              {t('architecturePage.servicesSubtitle')}
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
                <div className="absolute top-0 left-0 right-0 h-1 bg-wg-green transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

                {/* Ícone com background */}
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-wg-green/10 mb-5 group-hover:scale-110 transition-transform duration-300">
                  <service.icon className="w-7 h-7 text-wg-green" />
                </div>

                <h3 className="text-xl font-inter font-light text-wg-black mb-3 tracking-tight">
                  {service.title}
                </h3>
                <p className="text-wg-gray leading-relaxed">{service.description}</p>

                {/* Elemento decorativo */}
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-wg-green/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
              </motion.div>
            ))}
          </div>

          <motion.div
            {...fadeInUp}
            className="rounded-3xl border border-wg-green/15 bg-gradient-to-br from-wg-green/5 via-white to-white p-8 md:p-10 mb-20"
          >
            <div className="max-w-4xl">
              <span className="text-wg-green font-light tracking-[0.2em] uppercase text-sm mb-4 block">
                Método Operacional
              </span>
              <h3 className="text-2xl md:text-3xl font-inter font-light text-wg-black tracking-tight mb-4">
                Arquitetura premium precisa organizar decisão antes de organizar acabamento
              </h3>
              <div className="space-y-3 text-wg-gray leading-relaxed">
                <p>
                  {WG_PRODUCT_MESSAGES.obraeasyPromise}
                </p>
                <p>
                  Em arquitetura, isso significa definir layout, materiais, interfaces técnicas e frentes que dependem de aprovação ou medição antes de a obra pressionar prazo e custo.
                </p>
                <p>
                  {WG_PRODUCT_MESSAGES.marketReferences}
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
              <div className="absolute -inset-4 bg-gradient-to-br from-wg-green/20 to-transparent rounded-2xl" />
              <img
                className="relative w-full h-[500px] object-cover rounded-xl shadow-2xl"
                alt={t('architecturePage.commitment.imageAlt')}
               src={PROJECT_SERVICE_HIGHLIGHTS.architecture} />

              {/* Badge flutuante */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="absolute -bottom-6 -right-6 bg-white p-5 rounded-xl shadow-xl max-w-[200px]"
              >
                <p className="text-sm font-inter font-light text-wg-green italic leading-tight">{t('architecturePage.commitment.badge')}</p>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="text-wg-green font-light tracking-[0.2em] uppercase text-sm mb-4 block">
                {t('architecturePage.commitment.kicker')}
              </span>

              <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black mb-6 tracking-tight">
                {t('architecturePage.commitment.title')}
              </h2>

              <div className="space-y-4 text-wg-gray leading-relaxed">
                <p>
                  {t('architecturePage.commitment.paragraphs.0')}
                </p>
                <p>
                  {t('architecturePage.commitment.paragraphs.1')}
                </p>
                <p>
                  {t('architecturePage.commitment.paragraphs.2')}
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
                  className="btn-primary group"
                >
                  <span>{t('architecturePage.cta')}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </motion.div>
          </div>

          <motion.div
            {...fadeInUp}
            className="mt-20 rounded-3xl border border-wg-green/15 bg-wg-black text-white p-8 md:p-10"
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-10 items-start">
              <div>
                <span className="text-white/60 font-light tracking-[0.2em] uppercase text-sm mb-4 block">
                  Add-on de experiência visual
                </span>
                <h3 className="text-2xl md:text-3xl font-inter font-light tracking-tight mb-4">
                  Antes de detalhar tudo, a arquitetura pode entrar com leitura estética guiada
                </h3>
                <div className="space-y-3 text-white/75 leading-relaxed">
                  <p>{WG_PRODUCT_MESSAGES.wgExperienceSystem}</p>
                  <p>
                    Essa camada funciona bem como onboarding de projeto, pré-venda consultiva ou alinhamento entre cliente, arquiteto e família antes de fechar materiais e decisões de maior impacto.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  'Define estilo dominante, paleta e sensação esperada com menos indecisão.',
                  'Reduz retrabalho em briefing, referências desconexas e aprovações subjetivas.',
                  'Cria ponte direta entre moodboard, visualização e proposta assistida.',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <Sparkles className="w-5 h-5 text-wg-green flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-white/80 font-light leading-relaxed">{item}</p>
                  </div>
                ))}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link
                    to="/solicite-proposta?service=Sistema%20de%20Experi%C3%AAncia%20Visual&context=architecture"
                    className="btn-primary"
                  >
                    <span>Adicionar ao projeto</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/moodboard"
                    className="btn-hero-outline"
                  >
                    Ver a jornada visual
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

export default Architecture;

