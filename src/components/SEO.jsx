import { Helmet } from 'react-helmet-async';
import { getSEOConfig } from '@/data/seoConfig';
import { COMPANY } from '@/data/company';

/**
 * Componente SEO - gerencia meta tags, canonical e JSON-LD por rota.
 * Compatível com o uso antigo (title/description/url) e com a nova
 * configuração centralizada (pathname).
 */

/**
 * Gera BreadcrumbList JSON-LD a partir do pathname.
 * Ex: /blog/etapas-reforma => Home > Blog > Etapas Reforma
 */
function buildBreadcrumbs(pathname) {
  const BASE = 'https://wgalmeida.com.br';
  const segments = pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
  const items = [{ name: 'Home', url: `${BASE}/` }];

  const labelMap = {
    sobre: 'Sobre', processo: 'Processo', projetos: 'Projetos',
    blog: 'Blog', store: 'Loja', arquitetura: 'Arquitetura',
    engenharia: 'Engenharia', marcenaria: 'Marcenaria', contato: 'Contato',
    depoimentos: 'Depoimentos', faq: 'FAQ', 'a-marca': 'A Marca',
    'solicite-proposta': 'Solicite Proposta',
  };

  let path = '';
  for (const seg of segments) {
    path += `/${seg}`;
    const label = labelMap[seg] || seg.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    items.push({ name: label, url: `${BASE}${path}` });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url
    }))
  };
}

export function SEO({
  pathname = '/',
  schema = null,
  title,
  description,
  keywords,
  url,
  canonical,
  og = {},
  twitter = {},
  robots,
  noindex = false,
  lang = 'pt-BR',
  alternates = []
}) {
  const normalizePathname = (input = '/') => {
    let value = input || '/';
    if (!value.startsWith('/')) value = `/${value}`;
    value = value.replace(/\/{2,}/g, '/');
    if (value.length > 1 && value.endsWith('/')) value = value.slice(0, -1);
    return value;
  };

  const resolvePathname = () => {
    if (pathname && pathname !== '/') return pathname;
    if (!url) return pathname || '/';
    try {
      const parsed = new URL(url);
      return parsed.pathname || '/';
    } catch {
      return pathname || '/';
    }
  };

  const resolvedPathname = normalizePathname(resolvePathname());
  const config = getSEOConfig(resolvedPathname);
  const resolvedCanonical = canonical || url || config.canonical || `https://wgalmeida.com.br${resolvedPathname}`;
  const resolvedTitle = title || config.title;
  const resolvedDescription = description || config.description;

  const meta = {
    title: resolvedTitle,
    description: resolvedDescription,
    keywords: Array.isArray(keywords) ? keywords.join(', ') : (keywords || ''),
    canonical: resolvedCanonical,
    robots: noindex ? 'noindex, nofollow' : robots || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    og: {
      ...config.og,
      title: resolvedTitle,
      description: resolvedDescription,
      url: resolvedCanonical,
      ...og,
    },
    twitter: {
      ...config.twitter,
      title: resolvedTitle,
      description: resolvedDescription,
      ...twitter,
    }
  };

  const schemas = Array.isArray(schema) ? schema : schema ? [schema] : [];

  // Adiciona BreadcrumbList automaticamente se pathname tem segmentos
  if (resolvedPathname !== '/') {
    schemas.push(buildBreadcrumbs(resolvedPathname));
  }

  return (
    <Helmet>
      <html lang={lang} />

      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <meta name="robots" content={meta.robots} />

      <link rel="canonical" href={meta.canonical} />

      {/* hreflang alternates para conteúdo multilingual */}
      {alternates.map(({ hrefLang, href }) => (
        <link key={hrefLang} rel="alternate" hrefLang={hrefLang} href={href} />
      ))}
      {alternates.length > 0 && (
        <link rel="alternate" hrefLang="x-default" href={meta.canonical} />
      )}

      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="language" content="Portuguese" />
      <meta httpEquiv="content-language" content="pt-BR" />
      <meta name="author" content="Grupo WG Almeida" />
      <meta name="contact" content={COMPANY.email} />
      <meta name="theme-color" content="#1a1a1a" />

      {/* Open Graph */}
      <meta property="og:locale" content="pt_BR" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={meta.og.title} />
      <meta property="og:description" content={meta.og.description} />
      <meta property="og:image" content={meta.og.image} />
      <meta property="og:image:alt" content={meta.og.title} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:url" content={meta.og.url} />
      <meta property="og:site_name" content="Grupo WG Almeida" />

      {/* Twitter */}
      <meta name="twitter:card" content={meta.twitter.card || 'summary_large_image'} />
      <meta name="twitter:title" content={meta.twitter.title} />
      <meta name="twitter:description" content={meta.twitter.description} />
      <meta name="twitter:image" content={meta.twitter.image} />
      <meta name="twitter:image:alt" content={meta.twitter.title} />

      {/* JSON-LD */}
      {schemas.map((item, idx) => (
        <script key={idx} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}

      {/* DNS-prefetch para trackers carregados sob demanda */}
      <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
    </Helmet>
  );
}

// Mantém compatibilidade com imports default existentes
export default SEO;

// Helpers antigos preservados para compatibilidade com páginas que os utilizam
export const schemas = {
  service: (name, description, url) => ({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    url,
    provider: {
      '@type': 'Organization',
      name: 'Grupo WG Almeida',
      url: 'https://wgalmeida.com.br'
    },
    areaServed: {
      '@type': 'City',
      name: 'São Paulo'
    }
  }),

  localBusiness: (neighborhood) => ({
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: `Arquitetura Alto Padrão ${neighborhood} - Grupo WG Almeida`,
    description: `Serviços de arquitetura, engenharia e marcenaria de alto padrão em ${neighborhood}, São Paulo.`,
    url: `https://wgalmeida.com.br/${neighborhood
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '-')}`,
    telephone: COMPANY.phoneRaw,
    email: COMPANY.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'São Paulo',
      addressRegion: 'SP',
      addressCountry: 'BR'
    },
    areaServed: {
      '@type': 'Neighborhood',
      name: neighborhood,
      containedInPlace: {
        '@type': 'City',
        name: 'São Paulo'
      }
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5.0',
      reviewCount: '50'
    }
  }),

  article: (title, description, url, datePublished, image) => ({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url,
    datePublished,
    image: Array.isArray(image) ? image.filter(Boolean) : image,
    author: {
      '@type': 'Organization',
      name: 'Grupo WG Almeida'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Grupo WG Almeida',
      logo: {
        '@type': 'ImageObject',
        url: 'https://wgalmeida.com.br/images/logo-192.webp'
      }
    }
  }),

  faq: (questions) => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer
      }
    }))
  })
};
