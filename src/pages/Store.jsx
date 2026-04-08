import React, { lazy, Suspense } from 'react';
import { motion } from '@/lib/motion-lite';
import { ShoppingBag, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SEO from '@/components/SEO';
import { SCHEMAS } from '@/data/schemaConfig';

const ProductsList = lazy(() => import('@/components/ProductsList'));
// Animações elegantes
const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
};

const Store = () => {
  const { t } = useTranslation();

  return (
    <>
      <SEO pathname="/store" schema={SCHEMAS.breadcrumbStore} />

      {/* Hero elegante */}
      <section className="relative h-[50vh] flex items-center justify-center overflow-hidden hero-under-header">
        <motion.div
          className="absolute inset-0 z-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          {/* Imagem de luminárias/decoração */}
          <img
            className="w-full h-full object-cover"
            alt={t('storePage.hero.imageAlt')}
            src="https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=1920&q=80"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-wg-black/40 via-wg-black/50 to-wg-black/70"></div>
        </motion.div>

        <div className="relative z-10 container-custom text-center text-white px-4">
          {/* Linha decorativa */}
          <motion.div
            className="flex items-center justify-center gap-4 mb-8"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-wg-orange" />
            <div className="w-2 h-2 bg-wg-orange rounded-full" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-wg-orange" />
          </motion.div>

          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-wg-orange font-medium tracking-[0.3em] uppercase text-sm mb-4 block"
          >
            {t('storePage.hero.kicker')}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-6xl lg:text-7xl font-inter font-light mb-6 tracking-tight"
          >
            {t('storePage.hero.title')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl font-light max-w-3xl mx-auto opacity-90"
          >
            {t('storePage.hero.subtitle')}
          </motion.p>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-8"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm">
              <Sparkles className="w-4 h-4" />
              {t('storePage.hero.badge')}
            </span>
          </motion.div>
        </div>
      </section>

      {/* Seção de produtos */}
      <section className="section-padding bg-wg-gray-light relative overflow-hidden">
        {/* Elementos decorativos circulares */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 border border-wg-orange rounded-full" />
          <div className="absolute top-40 right-20 w-96 h-96 border border-wg-green rounded-full" />
          <div className="absolute bottom-20 left-1/4 w-64 h-64 border border-wg-blue rounded-full" />
          <div className="absolute bottom-40 right-10 w-48 h-48 border border-wg-brown rounded-full" />
        </div>

        {/* Gradientes decorativos */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-wg-orange rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-wg-green rounded-full blur-3xl" />
        </div>

        <div className="container-custom relative z-10">
          {/* Título da seção */}
          <motion.div
            {...fadeInUp}
            className="text-center mb-12"
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

            <span className="text-wg-orange font-medium tracking-[0.2em] uppercase text-sm mb-4 block">
              {t('storePage.catalog.kicker')}
            </span>

            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black mb-4 tracking-tight">
              {t('storePage.catalog.title')}
            </h2>
            <p className="text-lg text-wg-gray max-w-2xl mx-auto">
              {t('storePage.catalog.subtitle')}
            </p>

            {/* Tags das unidades */}
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-wg-green/10 text-wg-green rounded-full text-sm font-medium border border-wg-green/20">
                <span className="w-2 h-2 bg-wg-green rounded-full"></span>
                {t('storePage.catalog.tags.architecture')}
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-wg-blue/10 text-wg-blue rounded-full text-sm font-medium border border-wg-blue/20">
                <span className="w-2 h-2 bg-wg-blue rounded-full"></span>
                {t('storePage.catalog.tags.engineering')}
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-wg-brown/10 text-wg-brown rounded-full text-sm font-medium border border-wg-brown/20">
                <span className="w-2 h-2 bg-wg-brown rounded-full"></span>
                {t('storePage.catalog.tags.carpentry')}
              </span>
            </div>
          </motion.div>

          <Suspense fallback={null}>
            <ProductsList />
          </Suspense>
        </div>
      </section>
    </>
  );
};

export default Store;






