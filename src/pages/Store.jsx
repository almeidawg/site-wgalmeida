import React, { lazy, Suspense } from 'react';
import { motion } from '@/lib/motion-lite';
import { ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SEO from '@/components/SEO';
import { SCHEMAS } from '@/data/schemaConfig';
import { normalizeUnsplashImageUrl } from '@/lib/unsplash';

const ProductsList = lazy(() => import('@/components/ProductsList'));

const STORE_HERO_IMAGE = normalizeUnsplashImageUrl('https://images.unsplash.com/photo-1507473885765-e6ed057f782c', {
  width: 1920,
  height: 1080,
  quality: 80,
});

const Store = () => {
  const { t } = useTranslation();

  return (
    <>
      <SEO pathname="/store" schema={SCHEMAS.breadcrumbStore} />

      {/* Hero elegante */}
      <section className="wg-page-hero wg-page-hero--store hero-under-header">
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
            src={STORE_HERO_IMAGE}
            width="1920"
            height="1080"
            decoding="async"
            loading="eager"
            fetchpriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-wg-black/40 via-wg-black/50 to-wg-black/70"></div>
        </motion.div>

        <div className="container-custom">
          <div className="wg-page-hero-content px-4 pt-8 md:pt-10">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="wg-page-hero-title"
          >
            {t('storePage.hero.title')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="wg-page-hero-subtitle max-w-3xl"
          >
            {t('storePage.hero.subtitle')}
          </motion.p>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-7"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3.5 text-sm backdrop-blur-sm md:px-6">
              <ShoppingBag className="w-4 h-4" />
              {t('storePage.hero.badge')}
            </span>
          </motion.div>
          </div>
        </div>
      </section>

      {/* Seção de produtos */}
      <section className="relative overflow-hidden bg-[#F6F4EF] pb-16 pt-8 md:pb-20">
        <div className="container-custom relative z-10">
          <Suspense fallback={null}>
            <ProductsList />
          </Suspense>
        </div>
      </section>
    </>
  );
};

export default Store;






