import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

const DEFAULT_AVERAGE = 5.0;
const DEFAULT_COUNT = 50;

const unique = (items) => [...new Set(items.filter(Boolean))];

const formatDate = (value, locale) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(locale || 'pt-BR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const normalizeReview = (review, locale) => ({
  id: review.id || `${review.name || 'cliente'}-${review.date || ''}`.toLowerCase().replace(/\s+/g, '-'),
  name: review.name || 'Cliente WG',
  rating: Number(review.rating || 0),
  date: formatDate(review.date, locale),
  text: review.text || '',
  avatar: review.avatar || (review.name ? review.name.trim().slice(0, 1).toUpperCase() : 'W'),
});

const parsePayload = (payload, locale) => {
  if (!payload || !Array.isArray(payload.reviews) || payload.reviews.length === 0) return null;

  const reviews = payload.reviews.map((item) => normalizeReview(item, locale)).slice(0, 3);
  const averageFromPayload = Number(payload.averageRating);
  const averageFromReviews = reviews.reduce((sum, item) => sum + (item.rating || 0), 0) / reviews.length;
  const averageRating = Number(
    (Number.isFinite(averageFromPayload) && averageFromPayload > 0 ? averageFromPayload : averageFromReviews || DEFAULT_AVERAGE).toFixed(1)
  );

  const reviewCount = Number(payload.reviewCount || payload.userRatingsTotal || reviews.length || DEFAULT_COUNT);

  return {
    reviews,
    summary: {
      averageRating,
      reviewCount,
    },
  };
};

export const useGoogleReviews = () => {
  const { t, i18n } = useTranslation();

  const fallbackReviews = t('googleReviews.reviews', { returnObjects: true }) || [];
  const fallbackSummary = useMemo(
    () => ({
      averageRating: DEFAULT_AVERAGE,
      reviewCount: DEFAULT_COUNT,
    }),
    []
  );

  const [remoteReviews, setRemoteReviews] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const configuredUrl = import.meta.env.VITE_GOOGLE_REVIEWS_URL;
    const candidateUrls = unique([
      configuredUrl,
      '/api/google-reviews',
      '/data/google-reviews.json',
    ]);

    const run = async () => {
      for (const url of candidateUrls) {
        try {
          const response = await fetch(url, { headers: { Accept: 'application/json' } });
          if (!response.ok) continue;

          const payload = await response.json();
          const parsed = parsePayload(payload, i18n.language);
          if (!parsed || !isMounted) continue;

          setRemoteReviews(parsed.reviews);
          setSummary(parsed.summary);
          return;
        } catch {
          // silently fallback to next source
        }
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [i18n.language]);

  const reviews = remoteReviews ?? fallbackReviews;
  const currentSummary = summary ?? fallbackSummary;

  return {
    reviews: Array.isArray(reviews) ? reviews.slice(0, 3) : [],
    averageRating: Number(currentSummary.averageRating || DEFAULT_AVERAGE),
    reviewCount: Number(currentSummary.reviewCount || DEFAULT_COUNT),
    countLabel: t('googleReviews.countWithValue', { count: Number(currentSummary.reviewCount || DEFAULT_COUNT) }),
    isRemote: Boolean(remoteReviews),
  };
};

export default useGoogleReviews;
