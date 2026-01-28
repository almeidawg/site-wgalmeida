import React from 'react';
import SEO, { schemas } from '@/components/SEO';
import { motion } from 'framer-motion';
import { Wrench, ClipboardCheck, Zap, Award, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Animações elegantes
const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
};

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

  return (
    <>
      <SEO
        title={t('seo.engineering.title')}
        description={t('seo.engineering.description')}
        keywords={t('seo.engineering.keywords')}
        url="https://wgalmeida.com.br/engenharia"
        schema={schemas.service(
          t('engineeringPage.schema.name'),
          t('engineeringPage.schema.description'),
          'https://wgalmeida.com.br/engenharia'
        )}
      />

      {/* Hero elegante com cor da unidade */}
      <section className="relative h-[50vh] flex items-center justify-center overflow-hidden">
        <motion.div
          className="absolute inset-0 z-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <img
            className="w-full h-full object-cover"
            alt={t('engineeringPage.hero.imageAlt')}
            src="/images/banners/ENGENHARIA.webp"
            srcSet="/images/banners/ENGENHARIA-640.webp 640w, /images/banners/ENGENHARIA-960.webp 960w, /images/banners/ENGENHARIA-1280.webp 1280w, /images/banners/ENGENHARIA.webp 1920w"
            sizes="100vw"
            width="1920"
            height="1080"
            decoding="async"
            loading="eager"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-wg-blue/50 via-wg-blue/60 to-wg-black/80"></div>
        </motion.div>

        <div className="relative z-10 container-custom text-center text-white px-4">
          {/* Linha decorativa */}
          <motion.div
            className="flex items-center justify-center gap-4 mb-8"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-white/50" />
            <div className="w-2 h-2 bg-white rounded-full" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-white/50" />
          </motion.div>

          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-white/80 font-medium tracking-[0.3em] uppercase text-sm mb-4 block"
          >
            {t('engineeringPage.hero.kicker')}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-6xl lg:text-7xl font-inter font-light mb-6 tracking-tight"
          >
            {t('engineeringPage.hero.title')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl font-light max-w-3xl mx-auto opacity-90"
          >
            {t('engineeringPage.hero.subtitle')}
          </motion.p>

          {/* Badge da unidade */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-8"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm">
              <Wrench className="w-4 h-4" />
              {t('engineeringPage.hero.badge')}
            </span>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1, repeat: Infinity, repeatType: "reverse" }}
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2" />
          </div>
        </motion.div>
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
            className="text-center mb-16"
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

            <span className="text-wg-blue font-medium tracking-[0.2em] uppercase text-sm mb-4 block">
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

                <h3 className="text-xl font-inter font-semibold text-wg-black mb-3 tracking-tight">
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
              <span className="text-wg-blue font-medium tracking-[0.2em] uppercase text-sm mb-4 block">
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
                  className="inline-flex items-center gap-2 px-6 py-3 bg-wg-blue text-white rounded-lg hover:bg-wg-blue/90 transition-colors duration-300 group"
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
               src="https://images.unsplash.com/photo-1581093196867-ca3dba3c721b" />

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
        </div>
      </section>
    </>
  );
};

export default Engineering;
