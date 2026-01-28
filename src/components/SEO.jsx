import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

const defaultMeta = {
  title: 'Grupo WG Almeida | Arquitetura, Engenharia e Marcenaria Premium em São Paulo',
  description: 'Grupo WG Almeida - 14 anos de excelência em arquitetura, engenharia e marcenaria de alto padrão em São Paulo. Sistema Turn Key Premium. Projetos residenciais e comerciais.',
  keywords: 'arquitetura alto padrão são paulo, engenharia turn key, marcenaria sob medida, reforma residencial, projeto arquitetônico, construção premium, WG Almeida',
  image: 'https://wgalmeida.com.br/images/og-image.jpg',
  url: 'https://wgalmeida.com.br',
  type: 'website'
};

export default function SEO({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  noindex = false,
  schema
}) {
  const { i18n } = useTranslation();
  const language = i18n.language || 'pt-BR';
  const localeMap = {
    'pt-BR': 'pt_BR',
    'en': 'en_US',
    'es': 'es_ES',
  };
  const ogLocale = localeMap[language] || 'pt_BR';

  const seo = {
    title: title ? `${title} | Grupo WG Almeida` : defaultMeta.title,
    description: description || defaultMeta.description,
    keywords: keywords || defaultMeta.keywords,
    image: image || defaultMeta.image,
    url: url || defaultMeta.url,
    type: type
  };

  return (
    <Helmet>
      <html lang={language} />
      {/* Titulo */}
      <title>{seo.title}</title>

      {/* Meta Tags Basicas */}
      <meta name="description" content={seo.description} />
      <meta name="keywords" content={seo.keywords} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Canonical URL */}
      <link rel="canonical" href={seo.url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={seo.type} />
      <meta property="og:url" content={seo.url} />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:image" content={seo.image} />
      <meta property="og:locale" content={ogLocale} />
      <meta property="og:site_name" content="Grupo WG Almeida" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={seo.url} />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={seo.image} />

      {/* Schema.org JSON-LD customizado */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
}

// Schemas prontos para reutilizar
export const schemas = {
  // Schema para pagina de servico
  service: (name, description, url) => ({
    "@context": "https://schema.org",
    "@type": "Service",
    "name": name,
    "description": description,
    "url": url,
    "provider": {
      "@type": "Organization",
      "name": "Grupo WG Almeida",
      "url": "https://wgalmeida.com.br"
    },
    "areaServed": {
      "@type": "City",
      "name": "São Paulo"
    }
  }),

  // Schema para pagina de bairro/regiao
  localBusiness: (neighborhood) => ({
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": `Arquitetura Alto Padrão ${neighborhood} - Grupo WG Almeida`,
    "description": `Serviços de arquitetura, engenharia e marcenaria de alto padrão em ${neighborhood}, São Paulo.`,
    "url": `https://wgalmeida.com.br/${neighborhood.toLowerCase().replace(/\s+/g, '-')}`,
    "telephone": "+55-11-98465-0002",
    "email": "contato@wgalmeida.com.br",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "São Paulo",
      "addressRegion": "SP",
      "addressCountry": "BR"
    },
    "areaServed": {
      "@type": "Neighborhood",
      "name": neighborhood,
      "containedInPlace": {
        "@type": "City",
        "name": "São Paulo"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5.0",
      "reviewCount": "47"
    }
  }),

  // Schema para artigo de blog
  article: (title, description, url, datePublished, image) => ({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "url": url,
    "datePublished": datePublished,
    "image": image,
    "author": {
      "@type": "Organization",
      "name": "Grupo WG Almeida"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Grupo WG Almeida",
      "logo": {
        "@type": "ImageObject",
        "url": "https://wgalmeida.com.br/images/logo.png"
      }
    }
  }),

  // Schema para FAQ
  faq: (questions) => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": questions.map(q => ({
      "@type": "Question",
      "name": q.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": q.answer
      }
    }))
  })
};
