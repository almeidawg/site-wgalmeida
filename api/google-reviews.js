// Google Reviews — Places API (New)
// Projeto: 318929072546 | Place ID: ChIJA6dposNQzpQRNOLWlYgmF7c

const GOOGLE_MAPS_URL =
  'https://www.google.com/maps/place/Grupo+WG+Almeida/@-23.6175,-46.6927,17z/data=!4m8!3m7!1s0x94ce50c3a269a703:0xb717268895d6e234!8m2!3d-23.617!4d-46.6927!9m1!1b1';

const fallback = {
  averageRating: 4.6,
  reviewCount: 53,
  source: 'fallback',
  sourceUrl: GOOGLE_MAPS_URL,
  reviews: [
    {
      id: 'felipe-rossi',
      name: 'Felipe Rossi',
      rating: 5,
      date: '2 meses atrás',
      text: 'WG Almeida fez minha obra com muita qualidade e atenção nos detalhes. Os prestadores de serviço são muito dedicados e prestaram uma execução de alto nível. Estou bem feliz com a entrega.',
      avatar: 'F',
    },
    {
      id: 'renata-sunega',
      name: 'Renata Sunega',
      rating: 5,
      date: 'um ano atrás',
      text: 'Contratamos a empresa para a produção de cenografia e mobiliário expositivo da nossa exposição. A equipe é excelente, cumpriram os prazos acordados e estavam sempre dispostos a ajudar. Super recomendo.',
      avatar: 'R',
    },
    {
      id: 'cliente-wg',
      name: 'Cliente WG',
      rating: 5,
      date: '3 meses atrás',
      text: 'Sou cliente há anos e a empresa nunca me decepciona. Já usei os serviços de marcenaria, de reforma, elétrica e hidráulica, são impecáveis!',
      avatar: 'C',
    },
  ],
};

const normalizeReview = (review, index) => ({
  id: review.name
    ? review.name.split('/').pop().slice(0, 24)
    : `review-${index + 1}`,
  name: review.authorAttribution?.displayName || 'Cliente WG',
  rating: Number(review.rating || 0),
  date: review.relativePublishTimeDescription || '',
  text: review.text?.text || review.originalText?.text || '',
  avatar: review.authorAttribution?.displayName
    ? review.authorAttribution.displayName.trim().slice(0, 1).toUpperCase()
    : 'W',
  photoUrl: review.authorAttribution?.photoUri || null,
});

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=86400');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const placeId = process.env.GOOGLE_PLACE_ID?.trim();
  const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();

  if (!placeId || !apiKey) {
    return res.status(200).json(fallback);
  }

  const endpoint = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=pt-BR`;

  try {
    const response = await fetch(endpoint, {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'id,rating,userRatingCount,reviews,displayName',
      },
    });

    if (!response.ok) {
      console.error('Places API error:', response.status, await response.text());
      return res.status(200).json(fallback);
    }

    const data = await response.json();

    const reviews = Array.isArray(data.reviews)
      ? data.reviews.map(normalizeReview).slice(0, 5)
      : [];

    if (!reviews.length) {
      return res.status(200).json(fallback);
    }

    return res.status(200).json({
      averageRating: Number(data.rating || fallback.averageRating),
      reviewCount: Number(data.userRatingCount || reviews.length),
      source: 'google_places_new_api',
      sourceUrl: GOOGLE_MAPS_URL,
      reviews,
    });
  } catch (err) {
    console.error('google-reviews handler error:', err);
    return res.status(200).json(fallback);
  }
}
