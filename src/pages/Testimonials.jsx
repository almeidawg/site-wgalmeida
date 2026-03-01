import React from 'react';
import SEO from '@/components/SEO';
import { motion } from '@/lib/motion-lite';
import { Star, ExternalLink, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ResponsiveWebpImage from '@/components/ResponsiveWebpImage';
import { useTranslation } from 'react-i18next';
import { GOOGLE_WRITE_REVIEW_URL } from '@/constants/googleReviews';
import useGoogleReviews from '@/hooks/useGoogleReviews';

const GOOGLE_MAPS_URL = 'https://maps.google.com/?q=WG+Almeida+Arquitetura+São+Paulo';

// Animações elegantes
const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
};

const Testimonials = () => {
  const { t } = useTranslation();
  const whatsappUrl = `https://wa.me/5511984650002?text=${encodeURIComponent(t('testimonialsPage.cta.whatsappMessage'))}`;
  const { reviews, averageRating, reviewCount, countLabel } = useGoogleReviews();

  // Parceiros reais
  const partners = [
    { name: 'Portobello', logo: '/images/partners/portobello.png' },
    { name: 'Deca', logo: '/images/partners/deca.png' },
    { name: 'Roca', logo: '/images/partners/roca.png' },
    { name: 'Eucatex', logo: '/images/partners/eucatex.png' },
    { name: 'Duratex', logo: '/images/partners/duratex.png' },
    { name: 'Tigre', logo: '/images/partners/tigre.png' },
  ];

  return (
    <>
      <SEO
        pathname="/depoimentos"
        title={t('seo.testimonials.title')}
        description={t('seo.testimonials.description')}
        keywords={t('seo.testimonials.keywords')}
        schema={{
          "@context": "https://schema.org",
          "@type": "ProfessionalService",
          name: "Grupo WG Almeida",
          url: "https://wgalmeida.com.br",
          telephone: "+55-11-98465-0002",
          email: "contato@wgalmeida.com.br",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Sao Paulo",
            addressRegion: "SP",
            addressCountry: "BR",
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "5.0",
            bestRating: "5",
            worstRating: "1",
            ratingCount: String(reviewCount || 50),
          },
        }}
      />

      {/* Hero elegante */}
      <section className="relative h-[50vh] flex items-center justify-center overflow-hidden hero-under-header">
        <motion.div
          className="absolute inset-0 z-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <ResponsiveWebpImage
            className="w-full h-full object-cover"
            alt={t('testimonialsPage.hero.imageAlt')}
            src="/images/banners/DEPOIMENTOS .webp"
            width="1920"
            height="1080"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-wg-black/40 via-wg-black/60 to-wg-black/80"></div>
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
            {t('testimonialsPage.hero.kicker')}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-6xl lg:text-7xl font-inter font-light mb-6 tracking-tight"
          >
            {t('testimonialsPage.hero.title')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl font-light max-w-3xl mx-auto opacity-90"
          >
            {t('testimonialsPage.hero.subtitle')}
          </motion.p>
        </div>
      </section>

      {/* Seção Google Reviews */}
      <section className="section-padding bg-white relative overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-wg-orange rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-wg-green rounded-full blur-3xl" />
        </div>

        <div className="container-custom relative z-10">
          <motion.div
            {...fadeInUp}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="text-wg-orange font-medium tracking-[0.2em] uppercase text-sm mb-4 block">
              {t('testimonialsPage.google.kicker')}
            </span>
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black tracking-tight mb-6">
              {t('testimonialsPage.google.title')}
            </h2>
            <p className="text-lg text-wg-gray mb-8 leading-relaxed">
              {t('testimonialsPage.google.subtitle')}
            </p>

            {/* Card de destaque Google */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-100 mb-12"
            >
              {/* Google Logo + Rating */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-8">
                <div className="flex items-center gap-2">
                  <svg className="w-8 h-8" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-xl font-medium text-gray-700">Google</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-6 h-6 text-wg-orange fill-wg-orange" />
                    ))}
                  </div>
                  <span className="text-2xl font-bold text-wg-black">{averageRating.toFixed(1)}</span>
                </div>
              </div>

              <p className="text-wg-gray text-lg mb-8">
                {t('testimonialsPage.google.note')} {countLabel}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-left">
                {reviews.map((review) => (
                  <article key={review.id} className="rounded-2xl border border-gray-100 bg-wg-gray-light p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-wg-orange/10 text-wg-orange flex items-center justify-center text-sm font-semibold">
                        {review.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-wg-black">{review.name}</p>
                        <p className="text-xs text-wg-gray">{review.date}</p>
                      </div>
                    </div>
                    <p className="text-sm text-wg-gray leading-relaxed">{review.text}</p>
                  </article>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href={GOOGLE_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="btn-apple text-base px-8 py-4 w-full sm:w-auto">
                    <MapPin className="w-5 h-5 mr-2" />
                    {t('testimonialsPage.google.ctaMaps')}
                  </Button>
                </a>
                <a
                  href={GOOGLE_WRITE_REVIEW_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="outline"
                    className="text-base px-8 py-4 border-2 border-wg-orange text-wg-orange hover:bg-wg-orange hover:text-white transition-colors w-full sm:w-auto"
                  >
                    <Star className="w-5 h-5 mr-2" />
                    {t('testimonialsPage.google.ctaReview')}
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </a>
              </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-light text-wg-orange mb-2">14</div>
                <div className="text-sm text-wg-gray">{t('testimonialsPage.stats.0')}</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-light text-wg-orange mb-2">200+</div>
                <div className="text-sm text-wg-gray">{t('testimonialsPage.stats.1')}</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-light text-wg-orange mb-2">100%</div>
                <div className="text-sm text-wg-gray">{t('testimonialsPage.stats.2')}</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Seção de parceiros */}
      <section className="section-padding bg-gradient-to-b from-wg-gray-light to-white">
        <div className="container-custom">
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
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-wg-orange" />
              <div className="w-2 h-2 bg-wg-orange rounded-full" />
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-wg-orange" />
            </motion.div>

            <span className="text-wg-orange font-medium tracking-[0.2em] uppercase text-sm mb-4 block">
              {t('testimonialsPage.partners.kicker')}
            </span>

            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black mb-4 tracking-tight">
              {t('testimonialsPage.partners.title')}
            </h2>
            <p className="text-lg text-wg-gray max-w-2xl mx-auto">
              {t('testimonialsPage.partners.subtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {partners.map((partner, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="group bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 flex items-center justify-center border border-gray-100 hover:border-wg-orange/20 h-24"
              >
                <span className="text-wg-gray font-medium text-center group-hover:text-wg-orange transition-colors duration-300">
                  {partner.name}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-wg-black text-white">
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-inter font-light mb-6 tracking-tight">
              {t('testimonialsPage.cta.title')}
            </h2>
            <p className="text-lg text-white/70 mb-8">
              {t('testimonialsPage.cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={whatsappUrl}>
                <Button className="btn-apple text-lg px-8 py-4">
                  {t('testimonialsPage.cta.whatsapp')}
                </Button>
              </a>
              <a href="/contato">
                <Button
                  variant="outline"
                  className="text-lg px-8 py-4 border border-white/40 text-white bg-white/5 hover:bg-white/15 transition-all"
                >
                  {t('testimonialsPage.cta.message')}
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Testimonials;
