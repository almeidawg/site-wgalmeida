import React, { useState } from 'react';
import SEO from '@/components/SEO';
import { motion } from '@/lib/motion-lite';
import { Wrench, ClipboardCheck, Zap, Award, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SCHEMAS } from '@/data/schemaConfig';
import { WG_PRODUCT_MESSAGES } from '@/data/company';
import { normalizeUnsplashImageUrl } from '@/lib/unsplash';
import { getPublicPageImageSrc } from '@/data/publicPageImageCatalog';

// Animações elegantes
const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
};

const ENGINEERING_COMMITMENT_IMAGE = normalizeUnsplashImageUrl('https://images.unsplash.com/photo-1581093196867-ca3dba3c721b', {
  width: 1280,
  height: 900,
  quality: 80,
});
const ENGINEERING_HERO_IMAGE = getPublicPageImageSrc('engineering', '/images/banners/ENGENHARIA.webp');

const Engineering = () => {
  const { t } = useTranslation();

  const services = [
    {
      icon: Wrench,
      title: t('engineeringPage.services.0.title'),
      description: t('engineeringPage.services.0.description'),
    },
    {
      icon: ClipboardCheck,
      title: t('engineeringPage.services.1.title'),
      description: t('engineeringPage.services.1.description'),
    },
    {
      icon: Zap,
      title: t('engineeringPage.services.2.title'),
      description: t('engineeringPage.services.2.description'),
    },
    {
      icon: Award,
      title: t('engineeringPage.services.3.title'),
      description: t('engineeringPage.services.3.description'),
    },
  ];

  const etapas = [
    { title: 'Etapas Iniciais', desc: 'Documentação, alvará, demarcação' },
    { title: 'Mobilização', desc: 'Estruturação do canteiro de obras' },
    { title: 'Limpeza', desc: 'Regularizações e preparação do terreno' },
    { title: 'Marcação', desc: 'Gabarito e demarcação da fundação' },
    { title: 'Fundação', desc: 'Estacas, blocos e estrutura base' },
    { title: 'Estruturas', desc: 'Pilares, vigas, lajes e cobertura' },
    { title: 'Alvenaria', desc: 'Vedações e fechamentos' },
    { title: 'Instalações', desc: 'Elétrica, hidráulica, ar-condicionado' },
    { title: 'Acabamentos', desc: 'Pisos, revestimentos, pintura' },
    { title: 'Marcenaria', desc: 'Mobiliário sob medida' },
    { title: 'Louças e Metais', desc: 'Instalação de equipamentos' },
    { title: 'Entrega', desc: 'Casa pronta para morar' },
  ];

  const [etapaLiberada, setEtapaLiberada] = useState(1);

  return (
    <>
      <SEO
        pathname="/engenharia"
        schema={[SCHEMAS.serviceEngineering, SCHEMAS.breadcrumbEngineering]}
      />

      {/* Hero elegante com cor da unidade */}
      <section className="wg-page-hero wg-page-hero--store hero-under-header">
        <motion.div
          className="absolute inset-0 z-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <img
            className="w-full h-full object-cover"
            alt={t('engineeringPage.hero.imageAlt')}
            src={ENGINEERING_HERO_IMAGE}
            srcSet="/images/banners/ENGENHARIA-640.webp 640w, /images/banners/ENGENHARIA-960-opt.webp 960w, /images/banners/ENGENHARIA-1280.webp 1280w, /images/banners/ENGENHARIA.webp 1920w"
            sizes="100vw"
            width="1920"
            height="1080"
            decoding="async"
            loading="eager"
            fetchpriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-wg-blue/50 via-wg-blue/60 to-wg-black/80"></div>
        </motion.div>

        <div className="container-custom">
          <div className="wg-page-hero-content px-4 pt-8 md:pt-10">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="wg-page-hero-kicker"
          >
            {t('engineeringPage.hero.kicker')}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="wg-page-hero-title"
          >
            {t('engineeringPage.hero.title')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="wg-page-hero-subtitle max-w-3xl"
          >
            {t('engineeringPage.hero.subtitle')}
          </motion.p>

          {/* Badge da unidade */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-7"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3.5 text-sm backdrop-blur-sm md:px-6">
              <Wrench className="w-4 h-4" />
              {t('engineeringPage.hero.badge')}
            </span>
          </motion.div>
          </div>
        </div>
      </section>

      {/* Fluxo interativo de etapas */}
      <section className="section-padding-tight-top bg-wg-gray-light relative overflow-hidden">
        <div className="container-custom relative z-10">
          <motion.div
            {...fadeInUp}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm text-wg-blue font-light shadow-sm">
              Turn Key · Sequência Técnica
            </span>
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black mt-4 mb-3 tracking-tight">
              Empreitada Global (Engenharia)
            </h2>
            <p className="text-lg text-wg-gray max-w-3xl mx-auto">
              Etapas organizadas em ordem lógica. Cada passo precisa de aprovação antes de liberar o próximo.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {etapas.map((etapa, index) => {
              const numero = index + 1;
              const liberada = numero <= etapaLiberada;
              const ehAtual = numero === etapaLiberada;
              return (
                <motion.div
                  key={etapa.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.04 }}
                  className={`group relative rounded-2xl border ${liberada ? 'border-wg-blue/30 bg-white' : 'border-gray-200 bg-white/70'} shadow-sm hover:shadow-lg transition-all duration-300`}
                >
                  <div className="flex items-start gap-3 p-5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-light ${liberada ? 'bg-wg-blue/10 text-wg-blue' : 'bg-gray-100 text-gray-400'}`}>
                      {String(numero).padStart(2, '0')}
                    </div>
                    <div className="flex-1">
                      <p className={`text-base font-light ${liberada ? 'text-wg-black' : 'text-gray-500'}`}>{etapa.title}</p>
                      <p className="text-sm text-wg-gray mt-1">{etapa.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-5 pb-5 text-xs">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${liberada ? 'bg-wg-blue/10 text-wg-blue' : 'bg-gray-100 text-gray-500'}`}>
                      {liberada ? 'Liberado' : 'Bloqueado'}
                    </span>
                    <button
                      disabled={!ehAtual}
                      onClick={() => setEtapaLiberada((prev) => Math.min(prev + 1, etapas.length))}
                      className={`px-3 py-1 rounded-full text-xs font-light transition-colors ${ehAtual ? 'bg-wg-blue text-white hover:bg-wg-blue/90' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                    >
                      {ehAtual ? 'Aprovar etapa' : 'Aguarde etapa anterior'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-padding-tight-top bg-white">
        <div className="container-custom">
          <motion.div
            {...fadeInUp}
            className="rounded-3xl border border-wg-blue/15 bg-gradient-to-br from-wg-blue/5 via-white to-white p-8 md:p-10"
          >
            <div className="max-w-4xl">
              <span className="text-wg-blue font-light tracking-[0.2em] uppercase text-sm mb-4 block">
                Lógica de Obra
              </span>
              <h2 className="text-2xl md:text-3xl font-inter font-light text-wg-black tracking-tight mb-4">
                Engenharia forte não é só execução. É sequência, liberação e controle de frente
              </h2>
              <div className="space-y-3 text-wg-gray leading-relaxed">
                <p>
                  {WG_PRODUCT_MESSAGES.obraeasyPromise}
                </p>
                <p>
                  Em campo, isso significa liberar a obra no momento certo, testar antes de fechar, acionar compras críticas com antecedência e coordenar as frentes que vão para produção paralela.
                </p>
                <p>
                  {WG_PRODUCT_MESSAGES.iccriPositioning}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="section-padding bg-white relative overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-wg-blue rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-wg-blue rounded-full blur-3xl" />
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
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-wg-blue" />
              <div className="w-2 h-2 bg-wg-blue rounded-full" />
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-wg-blue" />
            </motion.div>

            <span className="text-wg-blue font-light tracking-[0.2em] uppercase text-sm mb-4 block">
              {t('engineeringPage.servicesKicker')}
            </span>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-inter font-light text-wg-black mb-4 tracking-tight">
              {t('engineeringPage.servicesTitle')}
            </h2>
            <p className="text-lg text-wg-gray max-w-2xl mx-auto">
              {t('engineeringPage.servicesSubtitle')}
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
                <div className="absolute top-0 left-0 right-0 h-1 bg-wg-blue transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

                {/* Ícone com background */}
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-wg-blue/10 mb-5 group-hover:scale-110 transition-transform duration-300">
                  <service.icon className="w-7 h-7 text-wg-blue" />
                </div>

                <h3 className="text-xl font-inter font-light text-wg-black mb-3 tracking-tight">
                  {service.title}
                </h3>
                <p className="text-wg-gray leading-relaxed">{service.description}</p>

                {/* Elemento decorativo */}
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-wg-blue/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="text-wg-blue font-light tracking-[0.2em] uppercase text-sm mb-4 block">
                {t('engineeringPage.commitment.kicker')}
              </span>

              <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black mb-6 tracking-tight">
                {t('engineeringPage.commitment.title')}
              </h2>

              <div className="space-y-4 text-wg-gray leading-relaxed">
                <p>
                  {t('engineeringPage.commitment.paragraphs.0')}
                </p>
                <p>
                  {t('engineeringPage.commitment.paragraphs.1')}
                </p>
                <p>
                  {t('engineeringPage.commitment.paragraphs.2')}
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
                  <span>{t('engineeringPage.cta')}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              {/* Moldura decorativa */}
              <div className="absolute -inset-4 bg-gradient-to-br from-wg-blue/20 to-transparent rounded-2xl" />
              <img
                className="relative w-full h-[500px] object-cover rounded-xl shadow-2xl"
                alt={t('engineeringPage.commitment.imageAlt')}
                src={ENGINEERING_COMMITMENT_IMAGE}
                width="1280"
                height="900"
                loading="lazy"
                decoding="async"
              />

              {/* Badge flutuante */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl"
              >
                <p className="text-3xl font-inter font-light text-wg-blue">14+</p>
                <p className="text-sm text-wg-gray">{t('engineeringPage.commitment.badge')}</p>
              </motion.div>
            </motion.div>
          </div>

          <motion.div
            {...fadeInUp}
            className="mt-20 rounded-3xl border border-wg-blue/15 bg-gradient-to-br from-wg-blue to-wg-black text-white p-8 md:p-10"
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-10 items-start">
              <div>
                <span className="text-white/65 font-light tracking-[0.2em] uppercase text-sm mb-4 block">
                  Add-on de experiência visual
                </span>
                <h3 className="text-2xl md:text-3xl font-inter font-light tracking-tight mb-4">
                  Engenharia ganha velocidade quando a decisão visual chega mais organizada
                </h3>
                <div className="space-y-3 text-white/75 leading-relaxed">
                  <p>{WG_PRODUCT_MESSAGES.wgExperienceConversion}</p>
                  <p>
                    Em engenharia, essa camada ajuda a consolidar referências, reduzir revisões tardias e conectar expectativa visual com compras, medição e liberação de frente.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  'Antecipação de escolhas que normalmente travam obra ou geram retrabalho.',
                  'Briefing mais claro para compatibilização, aprovações e sequência executiva.',
                  'Entrada assistida para pré-venda, retrofit ou reforma de ticket mais alto.',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <Sparkles className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-white/80 font-light leading-relaxed">{item}</p>
                  </div>
                ))}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link
                    to="/solicite-proposta?service=Sistema%20de%20Experi%C3%AAncia%20Visual&context=engineering"
                    className="btn-primary"
                  >
                    <span>Levar para proposta</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/room-visualizer"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/15 text-white rounded-lg hover:bg-white/5 transition-colors duration-300"
                  >
                    Ver visualização assistida
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

export default Engineering;

