import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from '@/lib/motion-lite';
import { ExternalLink, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GOOGLE_REVIEW_URL } from '@/constants/googleReviews';
import useGoogleReviews from '@/hooks/useGoogleReviews';
import AnimatedStrokes from '@/components/AnimatedStrokes';

// Componente de Card de Avaliação - Versão Compacta
const ReviewCard = ({ review, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 h-full flex flex-col"
    >
      {/* Header compacto */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-wg-orange/10 flex items-center justify-center">
          <span className="text-sm font-light text-wg-orange">{review.avatar}</span>
        </div>
        <div className="flex-1">
          <p className="font-light text-wg-black text-sm">{review.name}</p>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-5 w-5 text-wg-orange fill-wg-orange" />
              ))}
            </div>
            <span className="text-xs text-wg-gray">{review.date}</span>
          </div>
        </div>
      </div>

      {/* Review text */}
      <p className="text-wg-gray text-xs leading-relaxed flex-1">{review.text}</p>
    </motion.div>
  );
};

const SummaryCard = ({ averageRating, countLabel }) => {
  const ratingValue = Number.isFinite(averageRating) ? averageRating.toFixed(1) : '5.0';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 h-full flex flex-col justify-center"
    >
      <div className="flex items-center gap-3">
        <svg className="w-7 h-7 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-5 w-5 text-wg-orange fill-wg-orange" />
              ))}
            </div>
            <span className="text-lg font-light text-wg-black">{ratingValue}</span>
          </div>
          <span className="text-sm text-wg-gray">{countLabel}</span>
        </div>
      </div>
    </motion.div>
  );
};

const GoogleReviewsBadge = () => {
  const { t } = useTranslation();
  const { reviews, averageRating, reviewCount, countLabel } = useGoogleReviews();
  const visibleReviews = (Array.isArray(reviews) ? reviews : []).slice(0, 3);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Grupo WG Almeida | Arquitetura | Engenharia | Marcenaria',
    description: t('googleReviews.description'),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: String(averageRating || 5.0),
      reviewCount: String(reviewCount || 50),
      bestRating: '5',
      worstRating: '1',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'São Paulo',
      addressRegion: 'SP',
      addressCountry: 'BR',
    },
    url: 'https://www.wgalmeida.com.br',
    sameAs: [
      GOOGLE_REVIEW_URL,
    ],
    priceRange: '$$$',
    image: 'https://wgalmeida.com.br/images/logo-192.webp',
    review: (Array.isArray(reviews) ? reviews : []).map(review => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: review.name },
      reviewRating: { '@type': 'Rating', ratingValue: review.rating, bestRating: 5 },
      reviewBody: review.text,
    })),
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <section className="py-12 bg-wg-gray-light relative overflow-hidden">
        <AnimatedStrokes
          variant="horizontal"
          count={4}
          strokeWidth={1}
          opacity={0.12}
          className="mix-blend-screen"
        />
        <div className="container-custom">
          {/* Grid de avaliações + resumo (4 cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 max-w-5xl mx-auto">
            <SummaryCard averageRating={averageRating} countLabel={countLabel} />
            {visibleReviews.map((review, index) => (
              <ReviewCard key={review.id} review={review} index={index + 1} />
            ))}
          </div>

          {/* CTA discreto */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-center"
          >
            <a
              href={GOOGLE_REVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-wg-gray hover:text-wg-orange transition-colors"
            >
              {t('googleReviews.viewAll')}
              <ExternalLink className="h-5 w-5" />
            </a>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default GoogleReviewsBadge;
