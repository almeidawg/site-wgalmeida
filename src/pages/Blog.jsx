import React, { useEffect, useMemo, useRef, useState } from 'react';
import SEO, { schemas } from '@/components/SEO';
import { motion } from '@/lib/motion-lite';
import { Link, useParams } from 'react-router-dom';
import {
  Calendar,
  Clock,
  ArrowRight,
  Tag,
  User,
  BookOpen,
  Ruler,
  Building2,
  Hammer,
  TrendingUp,
  Lightbulb,
  Palette,
  Monitor,
  ChevronRight,
  ShoppingBag,
  ExternalLink,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Copy,
  Check
} from 'lucide-react';
// import ResponsiveWebpImage from '@/components/ResponsiveWebpImage';
import { parseFrontmatter } from '@/utils/frontmatter';
import { useTranslation } from 'react-i18next';
import { withBasePath } from '@/utils/assetPaths';
import {
  getBlogImageAttribution,
  getBlogContextAssets,
  getBlogImageUrl,
} from '@/data/blogImageManifest';
import ICCRILinksBlock from '@/components/ICCRILinksBlock';
import LizAssistant from '@/components/LizAssistant';
import SmartCTA from '@/components/SmartCTA';
import { AnimatedBorder } from '@/components/AnimatedStrokes';
import { normalizeLanguageTag } from '@/i18n';

const rawPostsByLocale = {
  'pt-BR': import.meta.glob('/src/content/blog/*.md', { as: 'raw', eager: true }),
  en: import.meta.glob('/src/content/blog/en/*.md', { as: 'raw', eager: true }),
  es: import.meta.glob('/src/content/blog/es/*.md', { as: 'raw', eager: true }),
};

const toSafeRawString = (rawValue) => {
  if (typeof rawValue === 'string') return rawValue;
  if (typeof rawValue?.default === 'string') return rawValue.default;
  if (rawValue == null) return '';

  try {
    return String(rawValue?.default ?? rawValue);
  } catch {
    return '';
  }
};

const estimateReadingTime = (text) => {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
};

const slugifyHeading = (text) => text
  .toString()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9\s-]/g, '')
  .trim()
  .replace(/\s+/g, '-');

const extractHeadingText = (children) => {
  if (!children) return '';
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) {
    return children.map((child) => {
      if (typeof child === 'string') return child;
      if (child?.props?.children) return extractHeadingText(child.props.children);
      return '';
    }).join('');
  }
  if (children?.props?.children) return extractHeadingText(children.props.children);
  return '';
};

const extractTocHeadings = (markdown) => {
  const lines = markdown.split('\n');
  return lines
    .filter((line) => line.startsWith('## '))
    .map((line) => line.replace(/^##\s+/, '').trim())
    .filter(Boolean)
    .map((text) => ({ text, id: slugifyHeading(text) }));
};

const stripDuplicateTocSection = (markdown) => markdown
  .replace(
    /(^|\n)##\s*(?:Neste artigo|In this article|En este articulo|En este artículo)\s*\n+(?:(?:[-*+]\s+.+|[0-9]+\.\s+.+)\n)+/i,
    '$1'
  )
  .trim();

const stripMarkdownStrongEmphasis = (markdown = '') => markdown
  .replace(/\*\*(.*?)\*\*/g, '$1');

const stripMarkdownToText = (markdown = '') => stripMarkdownStrongEmphasis(markdown)
  .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
  .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
  .replace(/[`*_>#-]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const PRODUCT_IMAGE_HOST_BLOCKLIST = [
  'cdn.leroymerlin.com.br',
];

const getSafeRelatedProductImage = (src) => {
  if (!src || typeof src !== 'string') {
    return withBasePath('/images/placeholder-product.webp');
  }

  try {
    const url = new URL(src);
    if (PRODUCT_IMAGE_HOST_BLOCKLIST.includes(url.hostname.toLowerCase())) {
      return withBasePath('/images/placeholder-product.webp');
    }
  } catch {
    return src;
  }

  return src;
};

const extractFaqFromMarkdown = (markdown = '') => {
  const lines = markdown.split('\n');
  const faqHeaderRegex = /^##\s+(perguntas frequentes|duvidas frequentes|dúvidas frequentes|faq)$/i;
  const faqStartIndex = lines.findIndex((line) => faqHeaderRegex.test(line.trim()));

  if (faqStartIndex === -1) return [];

  const faq = [];
  let currentQuestion = '';
  let answerLines = [];

  for (let i = faqStartIndex + 1; i < lines.length; i += 1) {
    const line = lines[i].trim();

    if (/^##\s+/.test(line)) break;

    const questionMatch = line.match(/^###\s+(.+)$/);
    if (questionMatch) {
      if (currentQuestion && answerLines.length) {
        faq.push({
          question: stripMarkdownToText(currentQuestion),
          answer: stripMarkdownToText(answerLines.join(' ')),
        });
      }
      currentQuestion = questionMatch[1].trim();
      answerLines = [];
      continue;
    }

    if (!currentQuestion || !line || line === '---') continue;
    answerLines.push(line);
  }

  if (currentQuestion && answerLines.length) {
    faq.push({
      question: stripMarkdownToText(currentQuestion),
      answer: stripMarkdownToText(answerLines.join(' ')),
    });
  }

  return faq
    .filter((entry) => entry.question.endsWith('?') && entry.answer.length > 0)
    .slice(0, 8);
};

const resolveArticleDecisionContext = (article) => {
  const searchText = `${article?.slug || ''} ${article?.title || ''} ${article?.excerpt || ''}`.toLowerCase();

  if (/tempo|cronograma|prazo|etapas/.test(searchText)) return 'tempo';
  if (/invest|valoriza|valorizacao|imobili|corretor|banco|avm/.test(searchText)) return 'investimento';
  return 'custo';
};

const splitMarkdownByH2 = (markdown) => {
  const lines = markdown.split('\n');
  const introLines = [];
  const sections = [];
  let currentSection = null;

  lines.forEach((line) => {
    if (/^##\s+/.test(line)) {
      if (currentSection) {
        sections.push({
          ...currentSection,
          markdown: currentSection.markdown.trim()
        });
      }
      const heading = line.replace(/^##\s+/, '').trim();
      currentSection = {
        id: slugifyHeading(heading),
        markdown: `${line}\n`
      };
      return;
    }

    if (currentSection) {
      currentSection.markdown += `${line}\n`;
    } else {
      introLines.push(line);
    }
  });

  if (currentSection) {
    sections.push({
      ...currentSection,
      markdown: currentSection.markdown.trim()
    });
  }

  return {
    intro: introLines.join('\n').trim(),
    sections
  };
};

const promoteIntroLeadParagraphToHeading = (markdown = '') => {
  if (!markdown) return markdown;

  const lines = markdown.split('\n');
  const firstHeadingIndex = lines.findIndex((line) => /^#\s+/.test(line.trim()));
  if (firstHeadingIndex === -1) return markdown;

  let start = firstHeadingIndex + 1;
  while (start < lines.length && !lines[start].trim()) start += 1;
  if (start >= lines.length) return markdown;

  const firstLine = lines[start].trim();
  if (
    /^#{2,}\s+/.test(firstLine)
    || /^[-*]\s+/.test(firstLine)
    || /^\d+\.\s+/.test(firstLine)
    || /^>\s*/.test(firstLine)
    || /^\|/.test(firstLine)
  ) {
    return markdown;
  }

  let end = start;
  while (end < lines.length && lines[end].trim()) end += 1;

  const paragraph = lines.slice(start, end).join(' ').replace(/\s+/g, ' ').trim();
  if (!paragraph) return markdown;

  const nextLines = [...lines];
  nextLines.splice(start, end - start, `### ${paragraph}`);
  return nextLines.join('\n');
};

const parseRawPostEntry = ([path, raw], t) => {
  try {
    const rawString = toSafeRawString(raw);
    const { data, content } = parseFrontmatter(rawString);
    const fallbackSlug = path.split('/').pop()?.replace('.md', '');
    const slugValue = data.slug || fallbackSlug;
    const rawTags = Array.isArray(data.tags)
      ? data.tags
      : typeof data.tags === 'string'
        ? (() => {
            const candidate = data.tags.trim();
            if (candidate.startsWith('[') && candidate.endsWith(']')) {
              try {
                const parsed = JSON.parse(candidate);
                return Array.isArray(parsed) ? parsed : [candidate];
              } catch {
                return [candidate];
              }
            }
            return candidate.split(',');
          })()
        : [];
    const normalizedTags = rawTags
      .flatMap((tag) => {
        const value = String(tag).trim();
        if (!value) return [];
        if (value.startsWith('[') && value.endsWith(']')) {
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [value];
          } catch {
            return [value];
          }
        }
        return [value];
      })
      .map((tag) => String(tag).replace(/^\[+|\]+$/g, '').replace(/^"+|"+$/g, '').trim())
      .filter(Boolean);
    const articleText = stripMarkdownToText(content);

    return {
      title: data.title || t('blogPage.fallback.title'),
      slug: slugValue,
      subtitle: data.subtitle || '',
      excerpt: data.excerpt || '',
      image: resolveBlogImage(data.image, data.category || 'arquitetura', slugValue, 'card'),
      imageCard: resolveBlogImage(data.image, data.category || 'arquitetura', slugValue, 'card'),
      imageHero: resolveBlogImage(data.image, data.category || 'arquitetura', slugValue, 'hero'),
      imageSeo: resolveBlogImage(data.image, data.category || 'arquitetura', slugValue, 'seo'),
      imageCardAttribution: resolveBlogImageAttribution(data.image, data.category || 'arquitetura', slugValue, 'card'),
      imageHeroAttribution: resolveBlogImageAttribution(data.image, data.category || 'arquitetura', slugValue, 'hero'),
      imageSeoAttribution: resolveBlogImageAttribution(data.image, data.category || 'arquitetura', slugValue, 'seo'),
      category: data.category || 'arquitetura',
      author: data.author || t('blogPage.fallback.author'),
      date: data.date || '2025-12-01',
      heroPosition: data.heroPosition || '50% 50%',
      featured: Boolean(data.featured),
      tags: normalizedTags,
      content,
      tempoLeitura: estimateReadingTime(articleText),
    };
  } catch (err) {
    console.error('Error parsing blog post:', path, err);
    return null;
  }
};

const parseArticleCollection = (rawPosts, t) => new Map(
  Object.entries(rawPosts || {})
    .map((entry) => parseRawPostEntry(entry, t))
    .filter(Boolean)
    .map((article) => [article.slug, article])
);

const mergeArticleCollections = (primaryArticles, fallbackArticles) => {
  const merged = new Map(fallbackArticles);

  primaryArticles.forEach((article, slug) => {
    const fallbackArticle = fallbackArticles.get(slug);
    if (!fallbackArticle) {
      merged.set(slug, article);
      return;
    }

    const content = article.content || fallbackArticle.content;

    merged.set(slug, {
      ...fallbackArticle,
      ...article,
      title: article.title || fallbackArticle.title,
      subtitle: article.subtitle || fallbackArticle.subtitle,
      excerpt: article.excerpt || fallbackArticle.excerpt,
      image: article.image || fallbackArticle.image,
      imageCard: article.imageCard || fallbackArticle.imageCard,
      imageHero: article.imageHero || fallbackArticle.imageHero,
      imageSeo: article.imageSeo || fallbackArticle.imageSeo,
      imageCardAttribution: article.imageCardAttribution || fallbackArticle.imageCardAttribution,
      imageHeroAttribution: article.imageHeroAttribution || fallbackArticle.imageHeroAttribution,
      imageSeoAttribution: article.imageSeoAttribution || fallbackArticle.imageSeoAttribution,
      category: article.category || fallbackArticle.category,
      author: article.author || fallbackArticle.author,
      date: article.date || fallbackArticle.date,
      heroPosition: article.heroPosition || fallbackArticle.heroPosition,
      tags: article.tags?.length ? article.tags : fallbackArticle.tags,
      content,
      tempoLeitura: estimateReadingTime(stripMarkdownToText(content)),
    });
  });

  return merged;
};

const editorialScale = {
  kicker: 'text-[11px] font-light uppercase tracking-[0.18em]',
  title: 'text-[22px] leading-tight text-wg-black',
  body: 'text-[15px] leading-[1.65] text-[#4C4C4C]',
  bodyHero: 'text-[17px] md:text-[18px] leading-[1.65]',
  cardTitle: 'text-[20px] leading-[1.3] md:text-[22px]',
  cardExcerpt: 'text-[15px] leading-[1.6]'
};

const ALL_BLOG_BANNERS = [
  '/images/banners/foto-obra-1.jpg',
  '/images/banners/foto-obra-2.jpg',
  '/images/banners/foto-obra-3.jpg',
  '/images/banners/foto-obra-4.jpg',
  '/images/banners/foto-obra-5.jpg',
  '/images/banners/foto-obra-6.jpg',
  '/images/banners/foto-obra-7.jpg',
  '/images/banners/ARQ.webp',
  '/images/banners/ENGENHARIA.webp',
  '/images/banners/MARCENARIA.webp',
];

const CATEGORY_BANNER = {
  arquitetura: '/images/banners/ARQ.webp',
  design: '/images/banners/ARQ.webp',
  engenharia: '/images/banners/ENGENHARIA.webp',
  marcenaria: '/images/banners/MARCENARIA.webp',
  tecnologia: '/images/banners/PROCESSOS.webp',
  tendencias: '/images/banners/SOBRE.webp',
  dicas: '/images/banners/FALECONOSCO.webp',
};

const slugHashBanner = (slug) => {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return withBasePath(ALL_BLOG_BANNERS[h % ALL_BLOG_BANNERS.length]);
};

const getLocalBlogFallbackImage = (category, slug) => (
  slug ? slugHashBanner(slug) : withBasePath(CATEGORY_BANNER[category] || '/images/banners/SOBRE.webp')
);

const isAbsoluteUrl = (value) => /^https?:\/\//i.test(value || '');

const getBlogFallbackImage = (category, slug, variant = 'card') => (
  getBlogImageUrl({ category, slug, variant }) || getLocalBlogFallbackImage(category, slug)
);

const isGenericBannerImage = (image) => image?.startsWith('/images/banners/');

const resolveBlogImage = (image, category, slug, variant = 'card') => {
  if (isAbsoluteUrl(image)) {
    return image;
  }

  if (!image || isGenericBannerImage(image)) {
    return getBlogFallbackImage(category, slug, variant);
  }

  if (image.startsWith('/images/blog/')) {
    return getBlogImageUrl({ category, slug, variant }) || withBasePath(image);
  }

  return withBasePath(image);
};

const resolveBlogImageAttribution = (image, category, slug, variant = 'card') => {
  if (isAbsoluteUrl(image) && !image.includes('unsplash.com')) {
    return null;
  }

  return getBlogImageAttribution({ category, slug, variant });
};

const toAbsoluteSiteUrl = (value) => {
  if (!value) return '';
  if (isAbsoluteUrl(value)) return value;
  return `https://wgalmeida.com.br${value.startsWith('/') ? value : `/${value}`}`;
};

const ICCRI_DATASET_SLUG = 'tabela-precos-reforma-2026-iccri';
const PHASE1_EDITORIAL_ROLLOUT_SLUGS = new Set([
  'como-calcular-custo-de-obra',
  'arquitetos-brasileiros-famosos-legado',
  'custo-marcenaria-planejada',
  'custo-reforma-m2-sao-paulo',
  'quanto-custa-reforma-apartamento-100m2',
  'quanto-tempo-leva-reforma-completa-alto-padrao',
  'quanto-valoriza-apartamento-apos-reforma',
  'evf-estudo-viabilidade-financeira',
  'tabela-precos-reforma-2026-iccri',
]);

const HIDE_READER_CARD_SLUGS = new Set([]);

const buildIccriDatasetSchema = ({ articleUrl, datePublished }) => ({
  '@context': 'https://schema.org',
  '@type': 'Dataset',
  '@id': `${articleUrl}#dataset-iccri-2026`,
  name: 'ICCRI 2026 - Indice de Custo da Construcao e Reforma Inteligente',
  description:
    'Tabela de referencia tecnica do Grupo WG Almeida para custo de reforma e construcao em Sao Paulo, com faixas por padrao, categoria de servico e fatores de ajuste.',
  url: articleUrl,
  creator: {
    '@type': 'Organization',
    '@id': 'https://wgalmeida.com.br/#organization',
    name: 'Grupo WG Almeida',
    url: 'https://wgalmeida.com.br',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Grupo WG Almeida',
    url: 'https://wgalmeida.com.br',
  },
  inLanguage: 'pt-BR',
  isAccessibleForFree: true,
  datePublished,
  dateModified: datePublished,
  temporalCoverage: '2020/2026',
  spatialCoverage: {
    '@type': 'City',
    name: 'Sao Paulo',
  },
  keywords: [
    'ICCRI',
    'custo de reforma 2026',
    'preco m2 reforma',
    'tabela de custos construcao civil',
    'Sao Paulo',
  ],
  variableMeasured: [
    { '@type': 'PropertyValue', name: 'custo_base_m2_reforma_civil' },
    { '@type': 'PropertyValue', name: 'custo_marcenaria_m2_linear' },
    { '@type': 'PropertyValue', name: 'custo_infra_eletrica_hidraulica_m2' },
    { '@type': 'PropertyValue', name: 'fator_localizacao_bairro' },
    { '@type': 'PropertyValue', name: 'fator_complexidade_estrutural' },
  ],
  citation: [
    'https://wgalmeida.com.br/obraeasy',
    'https://wgalmeida.com.br/easy-real-state',
    'https://wgalmeida.com.br/blog/calculadora-preco-m2-corretores-imobiliarias',
  ],
});

const StableBlogImage = ({ src, fallbackSrc, alt, onError, ...props }) => {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc || '');
  const [fallbackApplied, setFallbackApplied] = useState(false);
  const imageRef = useRef(null);

  const applyFallback = () => {
    if (!fallbackSrc || fallbackApplied || currentSrc === fallbackSrc) {
      return false;
    }

    setCurrentSrc(fallbackSrc);
    setFallbackApplied(true);
    return true;
  };

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc || '');
    setFallbackApplied(false);
  }, [src, fallbackSrc]);

  useEffect(() => {
    if (!currentSrc || !fallbackSrc || currentSrc === fallbackSrc) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      const imageElement = imageRef.current;
      if (!imageElement) return;
      if (imageElement.complete && imageElement.naturalWidth === 0) {
        applyFallback();
      }
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [currentSrc, fallbackSrc]);

  return (
    <img
      {...props}
      ref={imageRef}
      src={currentSrc}
      alt={alt}
      onLoad={(event) => {
        if (event.currentTarget.naturalWidth === 0) {
          applyFallback();
        }

        props.onLoad?.(event);
      }}
      onError={(event) => {
        if (applyFallback()) {
          return;
        }

        onError?.(event);
      }}
    />
  );
};

const BlogImageCredit = ({ credit, className = '', tone = 'light' }) => {
  if (!credit?.photographer || !credit?.photographerUrl || !credit?.photoPageUrl) return null;

  const textColor = tone === 'dark' ? 'text-white/70' : 'text-[#6B7280]';
  const linkColor = tone === 'dark' ? 'text-white' : 'text-wg-blue';

  return (
    <p className={`text-[11px] leading-relaxed ${textColor} ${className}`.trim()}>
      Foto: <a href={credit.photographerUrl} target="_blank" rel="noreferrer" className={`underline underline-offset-2 ${linkColor}`}>{credit.photographer}</a>{' '}
      via <a href={credit.photoPageUrl} target="_blank" rel="noreferrer" className={`underline underline-offset-2 ${linkColor}`}>{credit.sourceLabel || 'Unsplash'}</a>
    </p>
  );
};

const MONOCHROME_CONTEXT_SECTION_TITLES = new Set([
  'Lucio Costa (1902-1998)',
  'Ruy Ohtake (1938-2021)',
]);

const ContextImageCard = ({
  asset,
  fallbackSrc,
  fallbackAlt = '',
  layout = 'single',
  onOrientationChange,
  imageIndex = 0,
}) => {
  if (!asset?.src) return null;

  const useMonochromeMask = MONOCHROME_CONTEXT_SECTION_TITLES.has(asset.sectionTitle || '');
  const imageClass = layout === 'pair'
    ? 'mx-auto h-auto max-h-[60vh] w-full object-contain'
    : 'mx-auto h-auto max-h-[68vh] w-full object-contain';

  return (
    <figure className="overflow-hidden rounded-2xl border border-[#E3E3DE] bg-[#FAFAFA] shadow-sm">
      <div className="bg-[#F2F2F0] px-3 py-3 md:px-5 md:py-5">
        <StableBlogImage
          src={asset.src}
          fallbackSrc={fallbackSrc}
          alt={asset.alt || fallbackAlt}
          className={`${imageClass} ${useMonochromeMask ? 'grayscale contrast-[1.02] brightness-[0.98]' : ''}`.trim()}
          loading="lazy"
          decoding="async"
          onLoad={(event) => {
            const { naturalWidth, naturalHeight } = event.currentTarget;
            if (!naturalWidth || !naturalHeight) return;
            onOrientationChange?.(imageIndex, naturalHeight > naturalWidth ? 'portrait' : 'landscape');
          }}
        />
      </div>
      <figcaption className="space-y-2 px-5 py-4">
        {asset.caption ? (
          <p className="text-[13px] leading-relaxed text-[#4B5563]">
            {asset.caption}
          </p>
        ) : null}
        <BlogImageCredit
          credit={asset.source === 'unsplash'
            ? {
              photographer: asset.photographer,
              photographerUrl: asset.photographerUrl,
              photoPageUrl: asset.photoPageUrl,
              sourceLabel: asset.sourceLabel,
            }
            : null}
        />
      </figcaption>
    </figure>
  );
};

const ContextImageGallery = ({ assets = [], fallbackSrc, fallbackAlt = '' }) => {
  const normalizedAssets = assets.filter((asset) => asset?.src);
  const [orientations, setOrientations] = useState({});

  if (!normalizedAssets.length) return null;

  const handleOrientationChange = (index, nextOrientation) => {
    setOrientations((current) => (
      current[index] === nextOrientation
        ? current
        : { ...current, [index]: nextOrientation }
    ));
  };

  const isPortraitPair = normalizedAssets.length === 2
    && orientations[0] === 'portrait'
    && orientations[1] === 'portrait';

  return (
    <div className="my-8 rounded-[28px] bg-[#F2F2F0] p-3 md:p-5">
      <div className={isPortraitPair ? 'grid gap-4 md:grid-cols-2' : 'space-y-4'}>
        {normalizedAssets.map((asset, index) => (
          <ContextImageCard
            key={`${asset.src}-${index}`}
            asset={asset}
            fallbackSrc={fallbackSrc}
            fallbackAlt={fallbackAlt}
            layout={isPortraitPair ? 'pair' : 'single'}
            imageIndex={index}
            onOrientationChange={handleOrientationChange}
          />
        ))}
      </div>
    </div>
  );
};

const SINGLE_CONTEXT_IMAGE_SLUGS = new Set([
  'arquitetos-brasileiros-famosos-legado',
]);

const groupContextImagesForLayout = (images = [], slug = '') => {
  if (SINGLE_CONTEXT_IMAGE_SLUGS.has(slug)) {
    return images.map((image) => [image]);
  }

  const groups = [];
  for (let index = 0; index < images.length; index += 2) {
    groups.push(images.slice(index, index + 2));
  }
  return groups;
};

const DEFAULT_CONTEXT_SECTION_TARGETS = {
  'como-calcular-custo-de-obra': {
    context2: 'onde-entra-o-evf',
    context3: null,
  },
};

const buildSectionImageInsertions = (sections = [], images = [], slug = '') => {
  const insertionMap = new Map();
  const imageGroups = groupContextImagesForLayout(images, slug);
  const sectionsCount = sections.length;
  if (sectionsCount <= 0 || imageGroups.length === 0) return insertionMap;

  const lastIndex = Math.max(0, sectionsCount - 1);
  const usedIndexes = new Set();
  const defaultsBySlot = DEFAULT_CONTEXT_SECTION_TARGETS[slug] || {};

  imageGroups.forEach((imageGroup, index) => {
    const firstAsset = imageGroup[0] || null;
    const slotKey = `context${index + 2}`;
    const hasDefaultTarget = Object.prototype.hasOwnProperty.call(defaultsBySlot, slotKey);
    const defaultTarget = hasDefaultTarget ? defaultsBySlot[slotKey] : '';
    if (hasDefaultTarget && !defaultTarget && !firstAsset?.sectionId && !firstAsset?.sectionTitle) {
      return;
    }
    const explicitTarget = firstAsset?.sectionId
      || (firstAsset?.sectionTitle ? slugifyHeading(firstAsset.sectionTitle) : '')
      || defaultTarget
      || '';
    let targetIndex = explicitTarget
      ? sections.findIndex((section) => section?.id === explicitTarget)
      : Math.round(((index + 1) * sectionsCount) / (imageGroups.length + 1)) - 1;

    if (targetIndex < 0) {
      targetIndex = Math.round(((index + 1) * sectionsCount) / (imageGroups.length + 1)) - 1;
    }

    targetIndex = Math.max(0, Math.min(lastIndex, targetIndex));

    while (usedIndexes.has(targetIndex) && targetIndex < lastIndex) {
      targetIndex += 1;
    }

    while (usedIndexes.has(targetIndex) && targetIndex > 0) {
      targetIndex -= 1;
    }

    usedIndexes.add(targetIndex);
    const bucket = insertionMap.get(targetIndex) || [];
    bucket.push(imageGroup);
    insertionMap.set(targetIndex, bucket);
  });

  return insertionMap;
};

// Componente de Compartilhamento Social
const ShareButtons = ({ title, url }) => {
  const [copied, setCopied] = useState(false);

  const shareOnWhatsApp = () => {
    // Encode a única vez a mensagem completa para evitar exibir %20/%3A no WhatsApp
    const encodedMessage = encodeURIComponent(`${title} ${url}`);
    window.open(`https://api.whatsapp.com/send?text=${encodedMessage}`, '_blank');
  };

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const shareOnTwitter = () => {
    const text = encodeURIComponent(title);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const shareOnLinkedin = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="mr-2 text-sm font-light text-wg-gray">Compartilhar:</span>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={shareOnWhatsApp}
        className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#20BA5A] transition-colors shadow-sm"
        title="Compartilhar no WhatsApp"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
        <span className="font-light">WhatsApp</span>
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={shareOnFacebook}
        className="p-2 bg-[#1877F2] text-white rounded-lg hover:bg-[#166FE5] transition-colors shadow-sm"
        title="Compartilhar no Facebook"
      >
        <Facebook className="w-5 h-5" />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={shareOnTwitter}
        className="p-2 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1A91DA] transition-colors shadow-sm"
        title="Compartilhar no Twitter"
      >
        <Twitter className="w-5 h-5" />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={shareOnLinkedin}
        className="p-2 bg-[#0A66C2] text-white rounded-lg hover:bg-[#095196] transition-colors shadow-sm"
        title="Compartilhar no LinkedIn"
      >
        <Linkedin className="w-5 h-5" />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={copyLink}
        className="p-2 bg-gray-200 text-wg-gray rounded-lg hover:bg-gray-300 transition-colors shadow-sm"
        title="Copiar link"
      >
        {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
      </motion.button>
    </div>
  );
};

// Componente de Produtos Relacionados
const RelatedProducts = ({ category }) => {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { getProducts } = await import('@/api/EcommerceApi');
        const response = await getProducts();
        if (!isMounted) return;
        // Pega 3 produtos aleatórios
        const shuffled = [...response.products].sort(() => 0.5 - Math.random());
        setProducts(shuffled.slice(0, 3));
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, [category]);

  if (loading || products.length === 0) return null;

  return (
    <div className="mt-16 pt-16 border-t border-gray-200">
      <div className="flex items-center gap-3 mb-8">
        <ShoppingBag className="w-6 h-6 text-wg-blue" />
        <h3 className="text-2xl font-inter font-light text-wg-black">
          {t('blogPage.relatedProducts.title', 'Produtos Relacionados')}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
          >
            <Link to={`/product/${product.id}`}>
              <div className="relative h-48 overflow-hidden">
                <StableBlogImage
                  src={getSafeRelatedProductImage(product.image)}
                  fallbackSrc={withBasePath('/images/placeholder-product.webp')}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="p-4">
                <h4 className="mb-2 line-clamp-2 text-sm font-inter font-light text-wg-black transition-colors group-hover:text-wg-blue">
                  {product.title}
                </h4>

                <p className="text-xs text-wg-gray mb-3 line-clamp-1">
                  {product.subtitle || product.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-light text-wg-blue">
                    {product.variants[0]?.price_formatted}
                  </span>

                  <span className="inline-flex items-center gap-1 text-xs font-light text-wg-blue">
                    {t('blogPage.relatedProducts.view', 'Ver')}
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link
          to="/store"
        className="inline-flex items-center gap-2 rounded-lg bg-wg-blue px-6 py-3 font-light text-white transition-all hover:bg-wg-blue/90"
        >
          <ShoppingBag className="w-5 h-5" />
          {t('blogPage.relatedProducts.viewAll', 'Ver Todos os Produtos')}
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
};

const Blog = () => {
  const { t, i18n } = useTranslation();
  const activeLocale = normalizeLanguageTag(i18n.resolvedLanguage || i18n.language);
  const localizedArticles = useMemo(
    () => parseArticleCollection(rawPostsByLocale[activeLocale] || {}, t),
    [activeLocale, t]
  );
  const fallbackArticles = useMemo(
    () => parseArticleCollection(rawPostsByLocale['pt-BR'], t),
    [t]
  );
  const artigos = useMemo(() => (
    Array.from(mergeArticleCollections(localizedArticles, fallbackArticles).values())
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  ), [fallbackArticles, localizedArticles]);
  const categorias = [
    { id: 'todos', label: t('blogPage.categories.all'), icon: BookOpen, color: 'text-wg-blue', bgColor: 'bg-wg-blue' },
    { id: 'arquitetura', label: t('blogPage.categories.architecture'), icon: Ruler, color: 'text-wg-green', bgColor: 'bg-wg-green' },
    { id: 'engenharia', label: t('blogPage.categories.engineering'), icon: Building2, color: 'text-wg-blue', bgColor: 'bg-wg-blue' },
    { id: 'marcenaria', label: t('blogPage.categories.carpentry'), icon: Hammer, color: 'text-wg-brown', bgColor: 'bg-wg-brown' },
    { id: 'design', label: t('blogPage.categories.design'), icon: Palette, color: 'text-wg-green', bgColor: 'bg-wg-green' },
    { id: 'tecnologia', label: t('blogPage.categories.technology'), icon: Monitor, color: 'text-wg-blue', bgColor: 'bg-wg-blue' },
    { id: 'tendencias', label: t('blogPage.categories.trends'), icon: TrendingUp, color: 'text-wg-blue', bgColor: 'bg-wg-blue' },
    { id: 'dicas', label: t('blogPage.categories.tips'), icon: Lightbulb, color: 'text-wg-green', bgColor: 'bg-wg-green' }
  ];
  const [categoriaAtiva, setCategoriaAtiva] = useState('todos');
  const { slug } = useParams();
  const [activeHeadingId, setActiveHeadingId] = useState('');
  const [markdownRuntime, setMarkdownRuntime] = useState(null);
  const [markdownRuntimeError, setMarkdownRuntimeError] = useState(false);

  useEffect(() => {
    if (!slug) {
      setMarkdownRuntime(null);
      setMarkdownRuntimeError(false);
      return undefined;
    }

    let cancelled = false;

    Promise.all([import('react-markdown'), import('remark-gfm')])
      .then(([reactMarkdownModule, remarkGfmModule]) => {
        if (cancelled) return;
        setMarkdownRuntime({
          ReactMarkdown: reactMarkdownModule.default,
          remarkGfm: remarkGfmModule.default,
        });
      })
      .catch((error) => {
        console.error('Erro ao carregar renderer de markdown:', error);
        if (!cancelled) {
          setMarkdownRuntimeError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const artigosFiltrados = categoriaAtiva === 'todos'
    ? artigos
    : artigos.filter(a => a.category === categoriaAtiva);

  // Rotação diária do artigo em destaque
  const getDailyFeaturedIndex = () => {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    // Prioriza artigos marcados como featured, depois rotaciona entre os demais
    const featuredArticles = artigos.filter(a => a.featured);
    if (featuredArticles.length > 0) {
      return artigos.indexOf(featuredArticles[dayOfYear % featuredArticles.length]);
    }
    return dayOfYear % Math.max(1, artigos.length);
  };

  const artigoRecente = artigos[getDailyFeaturedIndex()] || artigos[0];
  const artigoAtual = slug ? artigos.find(a => a.slug === slug) : null;

  useEffect(() => {
    if (!slug) return;
    const headingEls = Array.from(document.querySelectorAll('.wg-prose h2[id]'));
    if (!headingEls.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length) {
          setActiveHeadingId(visible[0].target.id);
        }
      },
      {
        rootMargin: '-30% 0px -55% 0px',
        threshold: [0.2, 0.45, 0.7]
      }
    );

    headingEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [slug, artigoAtual?.slug]);

  useEffect(() => {
    if (!slug) return;
    if (!window.location.hash) return;
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [slug, artigoAtual?.slug]);

  const formatDate = (dateStr) => {
    const localeMap = { 'pt-BR': 'pt-BR', en: 'en-US', es: 'es-ES' };
    const locale = localeMap[activeLocale] || 'pt-BR';
    return new Date(dateStr).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (slug) {
    if (!artigoAtual) {
      return (
        <section className="section-padding bg-white">
          <div className="container-custom max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-inter font-light text-wg-black mb-4">
              {t('blogPage.notFound.title')}
            </h1>
            <p className="text-wg-gray mb-8">
              {t('blogPage.notFound.subtitle')}
            </p>
            <Link to="/blog" className="inline-flex items-center gap-2 font-light text-wg-blue">
              {t('blogPage.notFound.cta')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      );
    }

    const rawBody = artigoAtual.content.replace(/^# .*?\n+/, '').trim();
    const contentBody = stripDuplicateTocSection(rawBody);
    const articleUrl = `https://wgalmeida.com.br/blog/${artigoAtual.slug}`;
    const tocHeadings = extractTocHeadings(contentBody);
    const sectionedContent = splitMarkdownByH2(contentBody);

    // hreflang alternates · verifica se o slug existe em outros idiomas
    const hreflangAlternates = [];
    const BASE = 'https://wgalmeida.com.br';
    const allLocales = { 'pt-BR': rawPostsByLocale['pt-BR'], en: rawPostsByLocale.en, es: rawPostsByLocale.es };
    
    // Mapeamento de locale para o formato esperado pelo Google (ex: pt-BR, en, es)
    const localeToHreflang = { 'pt-BR': 'pt-BR', en: 'en', es: 'es' };

    for (const [locale, posts] of Object.entries(allLocales)) {
      const slugExists = Object.keys(posts || {}).some(p => p.endsWith(`/${artigoAtual.slug}.md`));
      if (slugExists) {
        const hrefLang = localeToHreflang[locale] || locale;
        hreflangAlternates.push({ hrefLang, href: `${BASE}/blog/${artigoAtual.slug}` });
      }
    }

    // og:locale mapping
    const localeToOg = { 'pt-BR': 'pt_BR', en: 'en_US', es: 'es_ES' };
    const currentOgLocale = localeToOg[activeLocale] || 'pt_BR';

    const readerGuideLabel = t('blogPage.readerGuide.title', 'Leitura Guiada');
    const tocTitleLabel = t('blogPage.readerGuide.tocTitle', 'Neste artigo');
    const readingLabel = t('blogPage.readerGuide.reading', 'lendo');
    const categoryMeta = {
      arquitetura: { dotColor: 'bg-wg-green', bgColor: 'bg-wg-green' },
      engenharia: { dotColor: 'bg-wg-blue', bgColor: 'bg-wg-blue' },
      marcenaria: { dotColor: 'bg-wg-brown', bgColor: 'bg-wg-brown' },
      planejamento: { dotColor: 'bg-wg-blue', bgColor: 'bg-wg-blue' },
      'mercado-imobiliario': { dotColor: 'bg-wg-blue', bgColor: 'bg-wg-blue' },
      insights: { dotColor: 'bg-wg-blue', bgColor: 'bg-wg-blue' },
      design: { dotColor: 'bg-wg-green', bgColor: 'bg-wg-green' },
      tecnologia: { dotColor: 'bg-wg-blue', bgColor: 'bg-wg-blue' },
      tendencias: { dotColor: 'bg-wg-blue', bgColor: 'bg-wg-blue' },
      dicas: { dotColor: 'bg-wg-green', bgColor: 'bg-wg-green' }
    };
    const currentCategory = categorias.find(c => c.id === artigoAtual.category);
    const currentCategoryMeta = categoryMeta[artigoAtual.category] || { dotColor: 'bg-wg-blue', bgColor: 'bg-wg-blue' };
    const articleReaderGuideLabelClass =
      currentCategoryMeta.bgColor === 'bg-wg-green'
        ? 'text-wg-green'
        : currentCategoryMeta.bgColor === 'bg-wg-brown'
          ? 'text-wg-brown'
          : 'text-wg-blue';
    const articleAccentBorderClass =
      currentCategoryMeta.bgColor === 'bg-wg-green'
        ? 'border-wg-green'
        : currentCategoryMeta.bgColor === 'bg-wg-brown'
          ? 'border-wg-brown'
          : 'border-wg-blue';
    const articleAccentLeftBorderClass =
      currentCategoryMeta.bgColor === 'bg-wg-green'
        ? 'border-l-wg-green/45'
        : currentCategoryMeta.bgColor === 'bg-wg-brown'
          ? 'border-l-wg-brown/45'
          : 'border-l-wg-blue/45';
    const articleAccentHoverBorderClass =
      currentCategoryMeta.bgColor === 'bg-wg-green'
        ? 'hover:border-wg-green/60'
        : currentCategoryMeta.bgColor === 'bg-wg-brown'
          ? 'hover:border-wg-brown/60'
          : 'hover:border-wg-blue/60';
    const articleAccentTextClass =
      currentCategoryMeta.bgColor === 'bg-wg-green'
        ? 'text-wg-green'
        : currentCategoryMeta.bgColor === 'bg-wg-brown'
          ? 'text-wg-brown'
          : 'text-wg-blue';
    const articleAccentHoverTextClass =
      currentCategoryMeta.bgColor === 'bg-wg-green'
        ? 'group-hover:text-wg-green'
        : currentCategoryMeta.bgColor === 'bg-wg-brown'
          ? 'group-hover:text-wg-brown'
          : 'group-hover:text-wg-blue';
    const articleAccentHoverTextSoftClass =
      currentCategoryMeta.bgColor === 'bg-wg-green'
        ? 'group-hover:text-wg-green/80'
        : currentCategoryMeta.bgColor === 'bg-wg-brown'
          ? 'group-hover:text-wg-brown/80'
          : 'group-hover:text-wg-blue/80';
    const articleAccentShadowClass =
      currentCategoryMeta.bgColor === 'bg-wg-green'
        ? 'shadow-[0_0_0_1px_rgba(92,125,82,0.14)]'
        : currentCategoryMeta.bgColor === 'bg-wg-brown'
          ? 'shadow-[0_0_0_1px_rgba(140,98,57,0.16)]'
          : 'shadow-[0_0_0_1px_rgba(43,69,128,0.14)]';
    const articleContentBulletMarkerClass =
      currentCategoryMeta.bgColor === 'bg-wg-green'
        ? "[&>ul>li]:before:bg-wg-green/70 [&>ol>li::marker]:text-wg-green/70"
        : currentCategoryMeta.bgColor === 'bg-wg-brown'
          ? "[&>ul>li]:before:bg-wg-brown/70 [&>ol>li::marker]:text-wg-brown/70"
          : "[&>ul>li]:before:bg-wg-blue/70 [&>ol>li::marker]:text-wg-blue/70";
    const articleReaderGuideDotClass =
      currentCategoryMeta.bgColor === 'bg-wg-green'
        ? 'bg-wg-green'
        : currentCategoryMeta.bgColor === 'bg-wg-brown'
          ? 'bg-wg-brown'
          : 'bg-wg-blue';
    const articleFallbackImage = getBlogFallbackImage(artigoAtual.category, artigoAtual.slug, 'hero');
    const articleLocalFallbackImage = getLocalBlogFallbackImage(artigoAtual.category, artigoAtual.slug);
    const articleHeroCredit = artigoAtual.imageHeroAttribution || artigoAtual.imageCardAttribution || null;
    const articleHeroSummary = artigoAtual.subtitle || artigoAtual.excerpt;
    const isComoCalcularCostArticle = artigoAtual.slug === 'como-calcular-custo-de-obra';
    const usesApprovedEditorialLayout = PHASE1_EDITORIAL_ROLLOUT_SLUGS.has(artigoAtual.slug);
    const articleReaderCardTitle =
      isComoCalcularCostArticle
        ? artigoAtual.excerpt
        : (artigoAtual.subtitle || artigoAtual.excerpt);
    const articleReaderCardDescription = isComoCalcularCostArticle
      ? artigoAtual.subtitle
      : (artigoAtual.subtitle && artigoAtual.subtitle !== artigoAtual.excerpt ? artigoAtual.excerpt : null);
    const articleReaderTitleClass = editorialScale.title;
    const articleReaderBodyClass = editorialScale.body;
    const usesApprovedReaderCardLayout = usesApprovedEditorialLayout;
    const articleReaderCardDescriptionClass = isComoCalcularCostArticle
      ? 'font-suisse text-[15px] font-light leading-[1.6] text-[#6A6A6A]'
      : articleReaderBodyClass;
    const articleReaderCardTitleClass = usesApprovedReaderCardLayout
      ? 'font-suisse text-[21px] font-light leading-[1.3] text-[#4C4C4C]'
      : editorialScale.title;
    const articleReaderCardShellClass = usesApprovedReaderCardLayout ? 'md:h-[228px]' : 'md:min-h-[188px]';
    const articleReaderCardImageClass = usesApprovedReaderCardLayout ? 'md:h-[228px]' : 'md:h-full md:min-h-[188px]';
    const articleReaderGuideClass = usesApprovedReaderCardLayout ? '-mt-0.5 mb-2' : 'mb-2';
    const articleReaderMainBlockClass = usesApprovedReaderCardLayout
      ? 'flex flex-1 flex-col justify-center pt-3'
      : 'flex flex-1 flex-col justify-center';
    const articleReaderTagsClass = usesApprovedReaderCardLayout
      ? 'mt-auto flex flex-wrap items-center gap-3 pt-6'
      : 'mt-auto flex flex-wrap items-center gap-3 pt-4';
    const articleIntroHeadingClass = usesApprovedEditorialLayout
      ? '[&>h1]:text-[24px] [&>h1]:font-light [&>h1]:tracking-tight [&>h1]:text-wg-black'
      : '[&>h1]:text-[32px] [&>h1]:font-light [&>h1]:tracking-tight [&>h1]:text-wg-black';
    const articleInlineStrongClass = usesApprovedEditorialLayout
      ? '[&_strong]:font-suisse [&_strong]:font-light [&_strong]:text-wg-gray [&_em]:font-suisse [&_em]:font-light [&_em]:text-wg-gray [&_i]:font-suisse [&_i]:font-light [&_i]:text-wg-gray [&_span]:text-inherit [&_mark]:bg-transparent [&_mark]:text-wg-gray'
      : '[&_strong]:font-suisse [&_strong]:font-light [&_strong]:text-wg-blue';
    const articleInlineLinkClass = usesApprovedEditorialLayout
      ? '[&_a]:font-suisse [&_a]:font-light [&_a]:text-[#4C4C4C] [&_a]:no-underline [&_a:hover]:underline [&_a:hover]:decoration-[#B8BEC8] [&_a:hover]:underline-offset-2 [&_a:hover]:text-[#2E2E2E]'
      : '[&_a]:text-wg-blue [&_a]:no-underline [&_a:hover]:underline [&_a]:font-light';
    const articleSectionBodyClass = usesApprovedEditorialLayout
      ? '[&>p]:font-suisse [&>p]:text-[14px] [&>p]:font-light [&>p]:text-wg-gray [&>p]:leading-[1.58] [&>p]:mb-5'
      : '[&>p]:font-suisse [&>p]:text-[16px] [&>p]:font-light [&>p]:text-wg-gray [&>p]:leading-[1.62] [&>p]:mb-5';
    const articleInlineCodeClass = usesApprovedEditorialLayout
      ? '[&_code]:bg-[#F5F5F5] [&_code]:px-2 [&_code]:py-1 [&_code]:rounded [&_code]:text-[13px] [&_code]:font-light [&_code]:text-[#4C4C4C]'
      : '[&_code]:bg-[#F5F5F5] [&_code]:px-2 [&_code]:py-1 [&_code]:rounded [&_code]:text-[13px] [&_code]:text-wg-blue';
    const articleListBodyClass = usesApprovedEditorialLayout
      ? '[&>ul>li]:font-suisse [&>ul>li]:text-[14px] [&>ul>li]:font-light [&>ul>li]:text-wg-gray [&>ul>li]:leading-[1.58] [&>ul>li]:pl-7 [&>ul>li]:relative [&>ul>li]:before:content-[\'\'] [&>ul>li]:before:absolute [&>ul>li]:before:left-0 [&>ul>li]:before:top-[9px] [&>ul>li]:before:w-[6px] [&>ul>li]:before:h-[6px] [&>ul>li]:before:rounded-full [&>ul>li>*]:font-light [&>ul>li>*]:text-wg-gray [&>ul>li>p]:m-0 [&>ul>li>p]:font-light [&>ul>li>p]:text-[14px] [&>ul>li>p]:leading-[1.58] [&>ul>li>strong]:font-light [&>ul>li>strong]:text-wg-gray [&>ul>li>p>strong]:font-light [&>ul>li>p>strong]:text-wg-gray [&>ol>li]:font-suisse [&>ol>li]:text-[14px] [&>ol>li]:font-light [&>ol>li]:text-wg-gray [&>ol>li]:leading-[1.58] [&>ol>li>*]:font-light [&>ol>li>*]:text-wg-gray [&>ol>li>p]:m-0 [&>ol>li>p]:font-light [&>ol>li>p]:text-[14px] [&>ol>li>p]:leading-[1.58] [&>ol>li>strong]:font-light [&>ol>li>strong]:text-wg-gray [&>ol>li>p>strong]:font-light [&>ol>li>p>strong]:text-wg-gray'
      : '[&>ul>li]:font-suisse [&>ul>li]:text-[14px] [&>ul>li]:font-light [&>ul>li]:text-wg-gray [&>ul>li]:leading-[1.58] [&>ul>li]:pl-7 [&>ul>li]:relative [&>ul>li]:before:content-[\'\'] [&>ul>li]:before:absolute [&>ul>li]:before:left-0 [&>ul>li]:before:top-[9px] [&>ul>li]:before:w-[6px] [&>ul>li]:before:h-[6px] [&>ul>li]:before:rounded-full [&>ol>li]:font-suisse [&>ol>li]:text-[14px] [&>ol>li]:font-light [&>ol>li]:text-wg-gray [&>ol>li]:leading-[1.58]';
    const articleBlockquoteAccentClass =
      usesApprovedEditorialLayout
        ? '[&>blockquote]:border-[#D8DEE8]'
        : currentCategoryMeta.bgColor === 'bg-wg-green'
        ? '[&>blockquote]:border-wg-green'
        : currentCategoryMeta.bgColor === 'bg-wg-brown'
          ? '[&>blockquote]:border-wg-brown'
          : '[&>blockquote]:border-wg-blue';
    const articleContextImages = getBlogContextAssets({ slug: artigoAtual.slug });
    const articleSchemaImages = [
      toAbsoluteSiteUrl(artigoAtual.imageSeo || artigoAtual.imageHero || artigoAtual.imageCard || artigoAtual.image),
      ...articleContextImages.map((asset) => toAbsoluteSiteUrl(asset?.src)).filter(Boolean),
    ].filter(Boolean);
    const faqEntries = extractFaqFromMarkdown(contentBody);
    const isIccriDatasetArticle = artigoAtual.slug === ICCRI_DATASET_SLUG;
    const articleSeoSchema = [
      schemas.article(
        artigoAtual.title,
        artigoAtual.excerpt,
        articleUrl,
        artigoAtual.date,
        articleSchemaImages
      ),
      ...(faqEntries.length ? [schemas.faq(faqEntries)] : []),
      ...(isIccriDatasetArticle
        ? [buildIccriDatasetSchema({ articleUrl, datePublished: artigoAtual.date })]
        : []),
    ];
    const articleLeadContextImage = articleContextImages[0] || null;
    const articlePrimarySection = sectionedContent.sections[0] || null;
    const articleLeadContextTarget = articleLeadContextImage?.sectionId
      || (articleLeadContextImage?.sectionTitle ? slugifyHeading(articleLeadContextImage.sectionTitle) : '');
    const articleLeadTargetsPrimarySection = Boolean(
      articleLeadContextImage
      && articlePrimarySection
      && (!articleLeadContextTarget || articleLeadContextTarget === articlePrimarySection.id)
    );
    const articleSectionContextInsertions = buildSectionImageInsertions(
      sectionedContent.sections,
      articleLeadTargetsPrimarySection ? articleContextImages.slice(1) : articleContextImages,
      artigoAtual.slug
    );
    const articleRemainingSections = articlePrimarySection
      ? sectionedContent.sections.slice(1)
      : [];
    const articleIntroMarkdown = usesApprovedEditorialLayout
      ? promoteIntroLeadParagraphToHeading(sectionedContent.intro)
      : sectionedContent.intro;
    const useSideBySideLeadLayout = usesApprovedEditorialLayout && articleLeadTargetsPrimarySection && articlePrimarySection;
    const showReaderCard = !HIDE_READER_CARD_SLUGS.has(artigoAtual.slug);
    const lizContext = resolveArticleDecisionContext(artigoAtual);
    const MarkdownRenderer = markdownRuntime?.ReactMarkdown;
    const markdownRemarkPlugins = markdownRuntime?.remarkGfm ? [markdownRuntime.remarkGfm] : [];
    const markdownRuntimeReady = Boolean(MarkdownRenderer);
    const handleArticleAnchorNavigation = (event, headingId) => {
      if (!headingId) return;
      event.preventDefault();
      const target = document.getElementById(headingId);
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
      setActiveHeadingId(headingId);
    };

    const markdownComponents = {
      h2: ({ children, ...props }) => {
        const headingText = extractHeadingText(children);
        return (
          <h2 id={slugifyHeading(headingText)} {...props}>
            {children}
          </h2>
        );
      },
      h3: ({ children, ...props }) => {
        const headingText = extractHeadingText(children);
        return (
          <h3 id={slugifyHeading(headingText)} {...props}>
            {children}
          </h3>
        );
      },
      h4: ({ children, className = '', ...props }) => {
        const headingText = extractHeadingText(children);
        return (
          <h4
            id={slugifyHeading(headingText)}
            className={`mb-3 mt-6 font-suisse text-[15px] font-light tracking-[0.01em] text-wg-gray ${className}`.trim()}
            {...props}
          >
            {children}
          </h4>
        );
      },
      p: ({ children, className = '', ...props }) => {
        const paragraphText = extractHeadingText(children).trim();
        const isConfidenceNote = paragraphText === 'Se alguma dessas respostas ainda estiver aberta, o número deve ser lido como estimativa inicial, não como fechamento.';
        const isCostWeightNote = paragraphText === 'Esses fatores quase nunca aparecem direito quando alguém tenta fechar o número apenas por faixa de mercado.';
        const isDecisionRiskNote = paragraphText === 'Isso reduz o risco de o cliente tomar decisão com número solto e expectativa errada.';

        return (
          <p
            className={(isConfidenceNote || isCostWeightNote || isDecisionRiskNote)
              ? `font-suisse !text-[14px] font-light !leading-[1.58] text-[#5C5C5C] ${className}`.trim()
              : className}
            {...props}
          >
            {children}
          </p>
        );
      },
      strong: ({ children, ...props }) => (
        <strong
          className={usesApprovedEditorialLayout ? 'font-suisse font-light text-wg-gray' : 'font-suisse font-light text-wg-blue'}
          {...props}
        >
          {children}
        </strong>
      ),
      em: ({ children, ...props }) => (
        <em
          className="font-suisse font-light not-italic text-wg-gray"
          {...props}
        >
          {children}
        </em>
      ),
      i: ({ children, ...props }) => (
        <i
          className="font-suisse font-light not-italic text-wg-gray"
          {...props}
        >
          {children}
        </i>
      ),
      mark: ({ children, ...props }) => (
        <mark
          className="bg-transparent font-suisse font-light text-wg-gray"
          {...props}
        >
          {children}
        </mark>
      ),
      code: ({ children, className = '', ...props }) => (
        <code
          className={`rounded-md bg-[#F3F4F6] px-1.5 py-0.5 font-suisse text-[0.92em] font-light text-wg-gray ${className}`.trim()}
          {...props}
        >
          {children}
        </code>
      ),
      blockquote: ({ children, ...props }) => {
        const text = extractHeadingText(children).trim();
        if (text.startsWith('DESTAQUE:') || text.startsWith('🎯 DESTAQUE:')) {
          return (
            <div
              className={`my-8 rounded-xl border-l-[3px] ${articleAccentLeftBorderClass} bg-gradient-to-r from-[#E3EBF7] via-[#F3F7FC] to-[#FCFDFE] px-5 py-[14px] text-[#4C4C4C] [&>p]:m-0 [&>p]:font-suisse [&>p]:text-[14px] [&>p]:font-light [&>p]:leading-[1.6] [&_strong]:font-light`}
              {...props}
            >
              {children}
            </div>
          );
        }
        if (text.startsWith('DICA:') || text.startsWith('💡 DICA:') || text.startsWith('CHECKLIST:') || text.startsWith('✅ CHECKLIST:')) {
          return (
            <div
              className={`my-8 rounded-xl border-l-[3px] ${articleAccentLeftBorderClass} bg-gradient-to-r from-[#E3EBF7] via-[#F3F7FC] to-[#FCFDFE] px-5 py-[14px] text-[#4C4C4C] [&>p]:m-0 [&>p]:font-suisse [&>p]:text-[14px] [&>p]:font-light [&>p]:leading-[1.6] [&_strong]:font-light`}
              {...props}
            >
              {children}
            </div>
          );
        }
        return <blockquote {...props}>{children}</blockquote>;
      },
      img: ({ src, alt = '', ...props }) => (
        <StableBlogImage
          src={src || articleFallbackImage}
          fallbackSrc={articleLocalFallbackImage}
          alt={alt}
          loading="lazy"
          decoding="async"
          {...props}
        />
      ),
      a: ({ href, children, ...props }) => {
        const isExternal = typeof href === 'string' && /^https?:\/\//i.test(href);
        return (
          <a
            href={href}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            {...props}
          >
            {children}
          </a>
        );
      }
    };

    return (
      <>
        <SEO
          pathname={`/blog/${artigoAtual.slug}`}
          title={artigoAtual.title}
          description={artigoAtual.excerpt}
          url={articleUrl}
          type="article"
          image={articleSchemaImages[0]}
          schema={articleSeoSchema}
          alternates={hreflangAlternates}
        />

        <section className="wg-page-hero wg-page-hero--full hero-under-header items-end bg-wg-black">
          <div
            key={`article-hero-${artigoAtual.slug}`}
            className="absolute inset-0 wg-hero-zoom-in"
          >
            <StableBlogImage
              src={artigoAtual.imageHero || artigoAtual.imageCard || artigoAtual.image}
              fallbackSrc={articleLocalFallbackImage}
              alt={artigoAtual.title}
              className="h-full w-full object-cover will-change-transform"
              style={{ objectPosition: artigoAtual.heroPosition }}
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-wg-black via-wg-black/60 to-transparent" />
          </div>

          <div className="relative z-10 container-custom pb-16 pt-36 md:pb-20 md:pt-44 lg:pt-48">
            <div className="max-w-4xl">
              <span className={`inline-flex items-center gap-2 px-4 py-2 ${currentCategoryMeta.bgColor} text-sm font-light uppercase tracking-wider text-white rounded-full mb-6`}>
                <span className={`inline-block w-2 h-2 rounded-full bg-white/90`} />
                <span>{currentCategory?.label || t('blogPage.fallback.category')}</span>
              </span>

              <h1 className="wg-page-hero-title mb-6">
                {artigoAtual.title}
              </h1>

              {articleHeroSummary ? (
                <p className="mb-6 max-w-3xl font-suisse text-[16px] font-light leading-[1.62] text-white/80 md:text-[17px]">
                  {articleHeroSummary}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-6 text-sm font-light text-white/70">
                <div className="flex items-center gap-2 font-light">
                  <User className="w-4 h-4" />
                  <span>{artigoAtual.author}</span>
                </div>
                <div className="flex items-center gap-2 font-light">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(artigoAtual.date)}</span>
                </div>
                <div className="flex items-center gap-2 font-light">
                  <Clock className="w-4 h-4" />
                  <span>{t('blogPage.readingTime', { minutes: artigoAtual.tempoLeitura })}</span>
                </div>
              </div>
              <BlogImageCredit credit={articleHeroCredit} tone="dark" className="mt-4" />
            </div>
          </div>
        </section>

        <section className="section-padding bg-white">
          <div className="container-custom max-w-3xl">
            {showReaderCard ? (
            <motion.aside
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className={`group -mt-8 mb-7 overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-[#F8F8F8] shadow-sm md:-mt-12 md:mb-8 ${articleReaderCardShellClass}`}
            >
              <div className="grid grid-cols-1 md:grid-cols-[218px_1fr] md:items-stretch md:h-full">
                <div className={`relative h-48 overflow-hidden ${articleReaderCardImageClass}`}>
                  <StableBlogImage
                    src={artigoAtual.imageCard || artigoAtual.imageHero || artigoAtual.image}
                    fallbackSrc={articleLocalFallbackImage}
                    alt={artigoAtual.title}
                    className="block h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    style={{ objectPosition: artigoAtual.heroPosition }}
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/25 to-transparent md:bg-gradient-to-t" />
                </div>
                <div className="flex h-full flex-col overflow-hidden p-5 md:p-6">
                  <BlogImageCredit credit={artigoAtual.imageCardAttribution || articleHeroCredit} className="mb-1" />
                  <p className={`${articleReaderGuideClass} ${articleReaderGuideLabelClass} ${editorialScale.kicker}`}>
                    {readerGuideLabel}
                  </p>
                  <div className={articleReaderMainBlockClass}>
                  {isComoCalcularCostArticle ? (
                    <p className={`mb-3 line-clamp-2 ${articleReaderCardTitleClass}`}>
                      {articleReaderCardTitle}
                    </p>
                  ) : (
                    <h2 className={`mb-3 line-clamp-2 ${articleReaderCardTitleClass}`}>
                      {articleReaderCardTitle}
                    </h2>
                  )}
                  {articleReaderCardDescription ? (
                    <p className={`mb-4 line-clamp-2 ${articleReaderCardDescriptionClass}`}>
                      {articleReaderCardDescription}
                    </p>
                  ) : null}
                  </div>
                  <div className={articleReaderTagsClass}>
                    {tocHeadings.slice(0, 3).map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        onClick={(event) => handleArticleAnchorNavigation(event, item.id)}
                        className={`inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-[#2E2E2E] transition-colors ${articleAccentHoverBorderClass} ${articleAccentHoverTextClass}`}
                      >
                        <span className={`inline-block h-1.5 w-1.5 rounded-full ${articleReaderGuideDotClass}`} />
                        {item.text}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </motion.aside>
            ) : null}

            {tocHeadings.length >= 3 && (
              <nav className="mb-8 rounded-2xl border border-gray-200 bg-[#FAFAFA] p-5">
                <h2 className="mb-4 text-base font-light text-wg-black">{tocTitleLabel}</h2>
                <ul className="space-y-2">
                  {tocHeadings.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        onClick={(event) => handleArticleAnchorNavigation(event, item.id)}
                        className={`group flex items-center justify-between rounded-xl border bg-white px-3.5 py-2.5 text-[13px] transition-all ${
                          activeHeadingId === item.id
                            ? `${articleAccentBorderClass} ${articleAccentShadowClass}`
                            : `border-gray-200 ${articleAccentHoverBorderClass} hover:shadow-sm`
                        }`}
                      >
                        <span className={`inline-block h-1.5 w-1.5 rounded-full transition-colors ${
                          activeHeadingId === item.id ? articleReaderGuideDotClass : `bg-gray-400 ${articleReaderGuideDotClass.replace('bg-', 'group-hover:bg-')}`
                        }`} />
                        <span className={`ml-3 flex-1 text-left font-light ${
                          activeHeadingId === item.id ? 'text-[#2E2E2E]' : 'text-wg-gray group-hover:text-[#2E2E2E]'
                        }`}>
                          {item.text}
                        </span>
                        <span className={`ml-2 text-[10px] font-light uppercase tracking-[0.12em] ${
                          activeHeadingId === item.id ? articleAccentTextClass : `text-gray-400 ${articleAccentHoverTextSoftClass}`
                        }`}>
                          {readingLabel}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            {/* Article Content - Padrao WG Easy 2026 */}
            {sectionedContent.intro && (
              <motion.article
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35 }}
                className={`mb-7 rounded-2xl border border-gray-200 bg-white p-5 transition-all ${articleAccentHoverBorderClass} hover:shadow-md md:p-7`}
              >
                <div className={`wg-prose max-w-none
                  ${articleIntroHeadingClass} [&>h1]:mb-8 [&>h1]:mt-0
                  [&>h3]:font-suisse [&>h3]:text-[17px] [&>h3]:font-light [&>h3]:text-wg-black [&>h3]:mb-4 [&>h3]:mt-10 [&>h3:first-child]:mt-0
                  [&>p]:font-suisse [&>p]:text-[14px] [&>p]:font-light [&>p]:text-wg-gray [&>p]:leading-[1.58] [&>p]:mb-5
                  ${articleInlineStrongClass}
                  ${articleInlineLinkClass}
                  [&>ul]:my-6 [&>ul]:space-y-3 [&>ul]:pl-0 [&>ul]:list-none
                  [&>ol]:my-6 [&>ol]:space-y-2 [&>ol]:pl-6 [&>ol]:list-decimal
                  ${articleListBodyClass}
                  ${articleContentBulletMarkerClass}`}>
                  {markdownRuntimeReady ? (
                    <MarkdownRenderer remarkPlugins={markdownRemarkPlugins} components={markdownComponents}>
                      {articleIntroMarkdown}
                    </MarkdownRenderer>
                  ) : (
                    <p className="text-[15px] leading-[1.65] text-wg-gray">
                      {markdownRuntimeError
                        ? t('blogPage.fallback.contentError', 'Conteudo temporariamente indisponivel.')
                        : t('blogPage.fallback.loading', 'Carregando conteudo...')}
                    </p>
                  )}
                </div>
              </motion.article>
            )}

            {useSideBySideLeadLayout ? (
            <motion.aside
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
                transition={{ duration: 0.35 }}
                className={`group mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-[#F8F8F8] shadow-sm transition-all ${articleAccentHoverBorderClass} hover:shadow-md lg:min-h-[548px]`}
              >
                <div className="grid grid-cols-1 lg:min-h-[548px] lg:grid-cols-[320px_1fr] lg:items-stretch">
                  <div className="relative min-h-[280px] overflow-hidden bg-[#ECECE8] lg:h-full lg:min-h-[548px]">
                    <StableBlogImage
                      src={articleLeadContextImage.src || articleLocalFallbackImage || artigoAtual.imageCard || artigoAtual.imageHero || artigoAtual.image}
                      fallbackSrc={articleLocalFallbackImage}
                      alt={articleLeadContextImage.alt || artigoAtual.title}
                      className="block h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.035]"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent lg:bg-gradient-to-t" />
                  </div>

                  <motion.article
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35 }}
                  className={`flex h-full flex-col overflow-hidden rounded-r-2xl border-l border-transparent p-5 transition-all md:p-7 ${
                    activeHeadingId === articlePrimarySection.id
                      ? `${articleAccentBorderClass} ${articleAccentShadowClass}`
                      : `${articleAccentHoverBorderClass} hover:shadow-md`
                  }`}
                >
                  <div className={`wg-prose max-w-none flex-1
                    [&>h2]:font-suisse [&>h2]:text-[22px] [&>h2]:font-light [&>h2]:tracking-tight [&>h2]:text-wg-black [&>h2]:mb-5 [&>h2]:mt-0
                    [&>h3]:font-suisse [&>h3]:text-[17px] [&>h3]:font-light [&>h3]:text-wg-black [&>h3]:mb-4 [&>h3]:mt-8
                    ${articleSectionBodyClass}
                    ${articleInlineStrongClass}
                    ${articleInlineLinkClass}
                    [&>ul]:my-5 [&>ul]:space-y-2 [&>ul]:pl-0 [&>ul]:list-none
                    [&>ol]:my-5 [&>ol]:space-y-2 [&>ol]:pl-6 [&>ol]:list-decimal
                    ${articleListBodyClass}
                    [&>blockquote]:border-l-4 ${articleBlockquoteAccentClass} [&>blockquote]:pl-6 [&>blockquote]:italic [&>blockquote]:font-light [&>blockquote]:text-wg-gray [&>blockquote]:bg-[#F9F9F9] [&>blockquote]:py-4 [&>blockquote]:pr-4 [&>blockquote]:rounded-r-lg [&>blockquote]:my-8
                    [&>table]:w-full [&>table]:my-8 [&>table]:rounded-xl [&>table]:overflow-hidden [&>table]:shadow-md [&>table]:border [&>table]:border-[#E5E5E5]
                    [&>table>thead]:bg-[#F5F5F5]
                    [&>table>thead>tr>th]:px-5 [&>table>thead>tr>th]:py-4 [&>table>thead>tr>th]:text-left [&>table>thead>tr>th]:text-[12px] [&>table>thead>tr>th]:font-light [&>table>thead>tr>th]:uppercase [&>table>thead>tr>th]:tracking-wide [&>table>thead>tr>th]:text-wg-black [&>table>thead>tr>th]:border-b [&>table>thead>tr>th]:border-[#E5E5E5]
                    [&>table>tbody>tr>td]:font-suisse [&>table>tbody>tr>td]:px-5 [&>table>tbody>tr>td]:py-4 [&>table>tbody>tr>td]:text-[14px] [&>table>tbody>tr>td]:font-light [&>table>tbody>tr>td]:text-wg-gray [&>table>tbody>tr>td]:border-b [&>table>tbody>tr>td]:border-[#E5E5E5]
                    [&>table>tbody>tr]:transition-colors [&>table>tbody>tr:hover]:bg-[#F9F9F9]
                    [&>table>tbody>tr:last-child>td]:border-b-0
                    ${articleInlineCodeClass}
                    [&>pre]:bg-[#1A1A1A] [&>pre]:text-white [&>pre]:p-6 [&>pre]:rounded-lg [&>pre]:overflow-x-auto [&>pre]:my-8
                    [&>img]:mx-auto [&>img]:my-8 [&>img]:max-h-[68vh] [&>img]:max-w-full [&>img]:rounded-lg [&>img]:shadow-md
                    [&>hr]:border-[#E5E5E5] [&>hr]:my-10 ${articleContentBulletMarkerClass}`}>
                    {markdownRuntimeReady ? (
                      <MarkdownRenderer remarkPlugins={markdownRemarkPlugins} components={markdownComponents}>
                        {articlePrimarySection.markdown}
                      </MarkdownRenderer>
                    ) : (
                      <p className="text-[15px] leading-[1.65] text-wg-gray">
                        {markdownRuntimeError
                          ? t('blogPage.fallback.contentError', 'Conteudo temporariamente indisponivel.')
                          : t('blogPage.fallback.loading', 'Carregando conteudo...')}
                      </p>
                    )}
                  </div>
                </motion.article>
                </div>
            </motion.aside>
            ) : articleLeadContextImage ? (
              <ContextImageGallery
                assets={[articleLeadContextImage]}
                fallbackSrc={articleLocalFallbackImage}
                fallbackAlt={artigoAtual.title}
              />
            ) : null}

            <div className="space-y-5">
              {(useSideBySideLeadLayout ? articleRemainingSections : sectionedContent.sections).length > 0 ? (() => {
                const articleSections = useSideBySideLeadLayout ? articleRemainingSections : sectionedContent.sections;
                const integratedSectionIndexes = articleSections.reduce((accumulator, _, sectionIndex) => {
                  const insertionIndex = useSideBySideLeadLayout ? sectionIndex + 1 : sectionIndex;
                  if ((articleSectionContextInsertions.get(insertionIndex) || []).length > 0) {
                    accumulator.push(insertionIndex);
                  }
                  return accumulator;
                }, []);

                return articleSections.map((section, index) => {
                const sectionInsertionIndex = useSideBySideLeadLayout ? index + 1 : index;
                const isFaqSection = section.id === 'perguntas-frequentes';
                const sectionAssetGroups = articleSectionContextInsertions.get(sectionInsertionIndex) || [];
                const useIntegratedSectionImage = usesApprovedEditorialLayout
                  && sectionAssetGroups.length > 0;
                const integratedSectionAssetGroup = useIntegratedSectionImage
                  ? (Array.isArray(sectionAssetGroups[0]) ? sectionAssetGroups[0] : [sectionAssetGroups[0]])
                  : [];
                const integratedSectionAsset = integratedSectionAssetGroup[0] || null;
                const integratedUseMonochromeMask = MONOCHROME_CONTEXT_SECTION_TITLES.has(
                  integratedSectionAsset?.sectionTitle || ''
                );
                const integratedVisualOrder = useIntegratedSectionImage
                  ? (useSideBySideLeadLayout ? 1 : 0) + integratedSectionIndexes.findIndex((value) => value === sectionInsertionIndex) + 1
                  : 0;
                const useImageOnRight = useIntegratedSectionImage && integratedVisualOrder % 2 === 0;
                return (
                <React.Fragment key={section.id || index}>
                  {useIntegratedSectionImage ? (
                    <motion.aside
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35, delay: index * 0.03 }}
                      className={`group overflow-hidden rounded-2xl border bg-gradient-to-br from-white to-[#F8F8F8] shadow-sm transition-all lg:min-h-[548px] ${
                        activeHeadingId === section.id
                          ? `${articleAccentBorderClass} ${articleAccentShadowClass}`
                          : `border-gray-200 ${articleAccentHoverBorderClass} hover:shadow-md`
                      }`}
                    >
                      <div className={`grid grid-cols-1 lg:min-h-[548px] lg:items-stretch ${useImageOnRight ? 'lg:grid-cols-[1fr_320px]' : 'lg:grid-cols-[320px_1fr]'}`}>
                        <div className={`relative min-h-[280px] overflow-hidden bg-[#ECECE8] lg:row-start-1 lg:h-full lg:min-h-[548px] ${useImageOnRight ? 'lg:col-start-2' : ''}`}>
                          <StableBlogImage
                            src={integratedSectionAsset?.src || articleLocalFallbackImage}
                            fallbackSrc={articleLocalFallbackImage}
                            alt={integratedSectionAsset?.alt || artigoAtual.title}
                            className={`block h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.035] ${integratedUseMonochromeMask ? 'grayscale contrast-[1.02] brightness-[0.98]' : ''}`.trim()}
                            loading="lazy"
                            decoding="async"
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent lg:bg-gradient-to-t" />
                        </div>
                        <motion.article
                          initial={{ opacity: 0, y: 16 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.35 }}
                          className={`flex h-full flex-col overflow-hidden border-transparent p-5 transition-all md:p-7 ${
                            useImageOnRight ? 'rounded-l-2xl border-r' : 'rounded-r-2xl border-l'
                          } ${
                            activeHeadingId === section.id
                              ? `${articleAccentBorderClass} ${articleAccentShadowClass}`
                              : `${articleAccentHoverBorderClass} hover:shadow-md`
                          } ${useImageOnRight ? 'lg:col-start-1 lg:row-start-1' : 'lg:row-start-1'}`}
                        >
                          <div className={`wg-prose max-w-none flex-1
                            [&>h2]:font-suisse [&>h2]:text-[22px] [&>h2]:font-light [&>h2]:tracking-tight [&>h2]:text-wg-black [&>h2]:mb-5 [&>h2]:mt-0
                            [&>h3]:font-suisse [&>h3]:text-[17px] [&>h3]:font-light [&>h3]:text-wg-black [&>h3]:mb-4 [&>h3]:mt-8
                            ${articleSectionBodyClass}
                            ${articleInlineStrongClass}
                            ${articleInlineLinkClass}
                            [&>ul]:my-5 [&>ul]:space-y-2 [&>ul]:pl-0 [&>ul]:list-none
                            [&>ol]:my-5 [&>ol]:space-y-2 [&>ol]:pl-6 [&>ol]:list-decimal
                            ${articleListBodyClass}
                            [&>blockquote]:border-l-4 ${articleBlockquoteAccentClass} [&>blockquote]:pl-6 [&>blockquote]:italic [&>blockquote]:font-light [&>blockquote]:text-wg-gray [&>blockquote]:bg-[#F9F9F9] [&>blockquote]:py-4 [&>blockquote]:pr-4 [&>blockquote]:rounded-r-lg [&>blockquote]:my-8
                            [&>table]:w-full [&>table]:my-8 [&>table]:rounded-xl [&>table]:overflow-hidden [&>table]:shadow-md [&>table]:border [&>table]:border-[#E5E5E5]
                            [&>table>thead]:bg-[#F5F5F5]
                            [&>table>thead>tr>th]:px-5 [&>table>thead>tr>th]:py-4 [&>table>thead>tr>th]:text-left [&>table>thead>tr>th]:text-[12px] [&>table>thead>tr>th]:font-light [&>table>thead>tr>th]:uppercase [&>table>thead>tr>th]:tracking-wide [&>table>thead>tr>th]:text-wg-black [&>table>thead>tr>th]:border-b [&>table>thead>tr>th]:border-[#E5E5E5]
                            [&>table>tbody>tr>td]:font-suisse [&>table>tbody>tr>td]:px-5 [&>table>tbody>tr>td]:py-4 [&>table>tbody>tr>td]:text-[14px] [&>table>tbody>tr>td]:font-light [&>table>tbody>tr>td]:text-wg-gray [&>table>tbody>tr>td]:border-b [&>table>tbody>tr>td]:border-[#E5E5E5]
                            [&>table>tbody>tr]:transition-colors [&>table>tbody>tr:hover]:bg-[#F9F9F9]
                            [&>table>tbody>tr:last-child>td]:border-b-0
                            ${articleInlineCodeClass}
                            [&>pre]:bg-[#1A1A1A] [&>pre]:text-white [&>pre]:p-6 [&>pre]:rounded-lg [&>pre]:overflow-x-auto [&>pre]:my-8
                            [&>img]:mx-auto [&>img]:my-8 [&>img]:max-h-[68vh] [&>img]:max-w-full [&>img]:rounded-lg [&>img]:shadow-md
                            [&>hr]:border-[#E5E5E5] [&>hr]:my-10 ${articleContentBulletMarkerClass} ${isFaqSection ? `[&>h3]:rounded-xl [&>h3]:border [&>h3]:border-[#DDE4EE] [&>h3]:bg-gradient-to-r [&>h3]:from-white [&>h3]:to-[#F7F9FC] [&>h3]:px-5 [&>h3]:py-4 [&>h3]:mb-3 [&>h3]:mt-6 [&>p]:relative [&>p]:pl-6 [&>p]:text-[14px] [&>p]:leading-[1.58] [&>p]:mb-6 [&>p]:before:content-['↳'] [&>p]:before:absolute [&>p]:before:left-0 [&>p]:before:top-0 [&>p]:before:font-light ${currentCategoryMeta.bgColor === 'bg-wg-green' ? "[&>p]:before:text-wg-green" : currentCategoryMeta.bgColor === 'bg-wg-brown' ? "[&>p]:before:text-wg-brown" : "[&>p]:before:text-wg-blue"}` : ''}`}>
                            {markdownRuntimeReady ? (
                              <MarkdownRenderer remarkPlugins={markdownRemarkPlugins} components={markdownComponents}>
                                {section.markdown}
                              </MarkdownRenderer>
                            ) : (
                              <p className="text-[15px] leading-[1.65] text-wg-gray">
                                {markdownRuntimeError
                                  ? t('blogPage.fallback.contentError', 'Conteudo temporariamente indisponivel.')
                                  : t('blogPage.fallback.loading', 'Carregando conteudo...')}
                              </p>
                            )}
                          </div>
                        </motion.article>
                      </div>
                    </motion.aside>
                  ) : (
                    <motion.article
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35, delay: index * 0.03 }}
                      className={`rounded-2xl border bg-white p-5 transition-all md:p-7 ${
                        activeHeadingId === section.id
                          ? `${articleAccentBorderClass} ${articleAccentShadowClass}`
                          : `border-gray-200 ${articleAccentHoverBorderClass} hover:shadow-md`
                      }`}
                    >
                      <div className={`wg-prose max-w-none
                        [&>h2]:font-suisse [&>h2]:text-[22px] [&>h2]:font-light [&>h2]:tracking-tight [&>h2]:text-wg-black [&>h2]:mb-5 [&>h2]:mt-0
                        [&>h3]:font-suisse [&>h3]:text-[17px] [&>h3]:font-light [&>h3]:text-wg-black [&>h3]:mb-4 [&>h3]:mt-8
                        ${articleSectionBodyClass}
                        ${articleInlineStrongClass}
                        ${articleInlineLinkClass}
                        [&>ul]:my-5 [&>ul]:space-y-2 [&>ul]:pl-0 [&>ul]:list-none
                        [&>ol]:my-5 [&>ol]:space-y-2 [&>ol]:pl-6 [&>ol]:list-decimal
                        ${articleListBodyClass}
                        [&>blockquote]:border-l-4 ${articleBlockquoteAccentClass} [&>blockquote]:pl-6 [&>blockquote]:italic [&>blockquote]:font-light [&>blockquote]:text-wg-gray [&>blockquote]:bg-[#F9F9F9] [&>blockquote]:py-4 [&>blockquote]:pr-4 [&>blockquote]:rounded-r-lg [&>blockquote]:my-8
                        [&>table]:w-full [&>table]:my-8 [&>table]:rounded-xl [&>table]:overflow-hidden [&>table]:shadow-md [&>table]:border [&>table]:border-[#E5E5E5]
                        [&>table>thead]:bg-[#F5F5F5]
                        [&>table>thead>tr>th]:px-5 [&>table>thead>tr>th]:py-4 [&>table>thead>tr>th]:text-left [&>table>thead>tr>th]:text-[12px] [&>table>thead>tr>th]:font-light [&>table>thead>tr>th]:uppercase [&>table>thead>tr>th]:tracking-wide [&>table>thead>tr>th]:text-wg-black [&>table>thead>tr>th]:border-b [&>table>thead>tr>th]:border-[#E5E5E5]
                        [&>table>tbody>tr>td]:font-suisse [&>table>tbody>tr>td]:px-5 [&>table>tbody>tr>td]:py-4 [&>table>tbody>tr>td]:text-[14px] [&>table>tbody>tr>td]:font-light [&>table>tbody>tr>td]:text-wg-gray [&>table>tbody>tr>td]:border-b [&>table>tbody>tr>td]:border-[#E5E5E5]
                        [&>table>tbody>tr]:transition-colors [&>table>tbody>tr:hover]:bg-[#F9F9F9]
                        [&>table>tbody>tr:last-child>td]:border-b-0
                        ${articleInlineCodeClass}
                        [&>pre]:bg-[#1A1A1A] [&>pre]:text-white [&>pre]:p-6 [&>pre]:rounded-lg [&>pre]:overflow-x-auto [&>pre]:my-8
                        [&>img]:mx-auto [&>img]:my-8 [&>img]:max-h-[68vh] [&>img]:max-w-full [&>img]:rounded-lg [&>img]:shadow-md
                        [&>hr]:border-[#E5E5E5] [&>hr]:my-10 ${articleContentBulletMarkerClass} ${isFaqSection ? `[&>h3]:rounded-xl [&>h3]:border [&>h3]:border-[#DDE4EE] [&>h3]:bg-gradient-to-r [&>h3]:from-white [&>h3]:to-[#F7F9FC] [&>h3]:px-5 [&>h3]:py-4 [&>h3]:mb-3 [&>h3]:mt-6 [&>p]:relative [&>p]:pl-6 [&>p]:text-[14px] [&>p]:leading-[1.58] [&>p]:mb-6 [&>p]:before:content-['↳'] [&>p]:before:absolute [&>p]:before:left-0 [&>p]:before:top-0 [&>p]:before:font-light ${currentCategoryMeta.bgColor === 'bg-wg-green' ? "[&>p]:before:text-wg-green" : currentCategoryMeta.bgColor === 'bg-wg-brown' ? "[&>p]:before:text-wg-brown" : "[&>p]:before:text-wg-blue"}` : ''}`}>
                        {markdownRuntimeReady ? (
                          <MarkdownRenderer remarkPlugins={markdownRemarkPlugins} components={markdownComponents}>
                            {section.markdown}
                          </MarkdownRenderer>
                        ) : (
                          <p className="text-[15px] leading-[1.65] text-wg-gray">
                            {markdownRuntimeError
                              ? t('blogPage.fallback.contentError', 'Conteudo temporariamente indisponivel.')
                              : t('blogPage.fallback.loading', 'Carregando conteudo...')}
                          </p>
                        )}
                      </div>
                    </motion.article>
                  )}

                  {(useIntegratedSectionImage ? sectionAssetGroups.slice(1) : sectionAssetGroups).map((assetGroup, assetIndex) => (
                    <ContextImageGallery
                      key={`${section.id || index}-context-${assetIndex}`}
                      assets={Array.isArray(assetGroup) ? assetGroup : [assetGroup]}
                      fallbackSrc={articleLocalFallbackImage}
                      fallbackAlt={artigoAtual.title}
                    />
                  ))}
                </React.Fragment>
              )});
              })() : (
                <div className="wg-prose max-w-none
                  ${articleSectionBodyClass} ${articleInlineStrongClass}
                  [&>img]:mx-auto [&>img]:my-8 [&>img]:max-h-[68vh] [&>img]:max-w-full [&>img]:rounded-lg [&>img]:shadow-md">
                  {markdownRuntimeReady ? (
                    <MarkdownRenderer remarkPlugins={markdownRemarkPlugins} components={markdownComponents}>
                      {contentBody}
                    </MarkdownRenderer>
                  ) : (
                    <p className="text-[15px] leading-[1.65] text-wg-gray">
                      {markdownRuntimeError
                        ? t('blogPage.fallback.contentError', 'Conteudo temporariamente indisponivel.')
                        : t('blogPage.fallback.loading', 'Carregando conteudo...')}
                    </p>
                  )}
                </div>
              )}
            </div>

            <LizAssistant context={lizContext} className="mt-10" />
            <ICCRILinksBlock context={lizContext} className="mt-8" />

            {/* Tags Section */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-4 h-4 text-wg-gray" />
                <span className="text-sm font-light uppercase tracking-wider text-wg-gray">Tags</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {(artigoAtual.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full border border-[#D8DEE8] bg-gradient-to-r from-wg-blue/8 to-wg-green/8 px-4 py-2 text-sm font-light text-wg-black transition-all hover:border-wg-blue/40 hover:shadow-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Share Section */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Share2 className="w-4 h-4 text-wg-gray" />
                <span className="text-sm font-light uppercase tracking-wider text-wg-gray">Compartilhe</span>
              </div>
              <ShareButtons
                title={artigoAtual.title}
                url={articleUrl}
              />
            </div>

            {/* Seção de Produtos Relacionados */}
            <RelatedProducts category={artigoAtual.category} />

            {/* Smart CTA — próximo passo contextualizado */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm font-light text-wg-gray mb-4 uppercase tracking-wider">Próximo passo</p>
              <SmartCTA showSecondary />
            </div>

            <div className="mt-8">
              <Link to="/blog" className="inline-flex items-center gap-2 font-light text-wg-blue">
                {t('blogPage.backToBlog')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <SEO
        title={t('seo.blog.title')}
        description={t('seo.blog.description')}
        keywords={t('seo.blog.keywords')}
        url="https://wgalmeida.com.br/blog"
      />

      {/* Hero Revista Style */}
      <section className="wg-page-hero wg-page-hero--full hero-under-header items-end bg-wg-black">
        {/* Imagem de Fundo */}
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <StableBlogImage
            src={artigoRecente?.imageHero || artigoRecente?.imageCard || artigoRecente?.image}
            fallbackSrc={getLocalBlogFallbackImage(artigoRecente?.category, artigoRecente?.slug)}
            alt={artigoRecente?.title}
            className="w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-wg-black via-wg-black/60 to-transparent" />
        </motion.div>

        {/* Conteúdo Hero */}
        <div className="relative z-10 container-custom pb-16 pt-36 md:pb-20 md:pt-44 lg:pt-48">
          <div className="max-w-4xl">
            {/* Tag Categoria */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-4"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-light uppercase tracking-wider text-white backdrop-blur-sm">
                <Tag className="w-4 h-4" />
                {t('blogPage.hero.featured')}
              </span>
            </motion.div>

            {/* Título */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="wg-page-hero-title mb-6"
            >
              {artigoRecente?.title}
            </motion.h1>

            {/* Resumo */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className={`${editorialScale.bodyHero} mb-8 max-w-[52rem] text-white/80`}
            >
              {artigoRecente?.excerpt}
            </motion.p>

            {/* Meta Info */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-wrap items-center gap-6 text-white/60 mb-4"
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{artigoRecente?.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{artigoRecente?.date ? formatDate(artigoRecente.date) : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{artigoRecente?.tempoLeitura ? t('blogPage.readingTime', { minutes: artigoRecente.tempoLeitura }) : ''}</span>
              </div>
            </motion.div>
            <BlogImageCredit credit={artigoRecente?.imageHeroAttribution || artigoRecente?.imageCardAttribution} tone="dark" className="mb-8" />

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <Link
                to={`/blog/${artigoRecente?.slug}`}
                className="inline-flex items-center gap-2 rounded-lg border border-white/14 bg-white/10 px-6 py-3 font-light text-white transition-all group hover:bg-white/16 hover:border-white/22 focus:outline-none"
              >
                {t('blogPage.hero.cta')}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Linha Decorativa */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      </section>

      {/* Categorias */}
      <section className="sticky top-20 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="container-custom">
          <div className="flex items-center gap-2 py-4 overflow-x-auto scrollbar-hide">
            {categorias.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaAtiva(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                    categoriaAtiva === cat.id
                      ? 'bg-wg-blue text-white'
                      : 'bg-[#F4F5F7] text-wg-gray hover:bg-[#ECEFF3]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${categoriaAtiva === cat.id ? '' : cat.color || ''}`} />
                  <span className="text-sm font-light">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Grid de Artigos */}
      <section className="section-padding bg-wg-gray-light">
        <div className="container-custom">
          {/* Título da Seção */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-[#D5DBE4] to-transparent" />
              <span className="text-sm font-light uppercase tracking-[0.2em] text-wg-blue">
                {categoriaAtiva === 'todos' ? t('blogPage.section.latest') : categorias.find(c => c.id === categoriaAtiva)?.label}
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-[#D5DBE4] to-transparent" />
            </div>
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black text-center">
              {t('blogPage.section.title')}
            </h2>
          </motion.div>

          {/* Grid Magazine Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {artigosFiltrados.map((artigo, index) => (
              <motion.article
                key={artigo.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 ${
                  index === 0 && categoriaAtiva === 'todos' ? 'md:col-span-2' : ''
                }`}
              >
                <Link to={`/blog/${artigo.slug}`} className="block">
                  {/* Imagem */}
                  <div className="relative overflow-hidden h-48">
                    <StableBlogImage
                      src={artigo.imageCard || artigo.imageHero || artigo.image}
                      fallbackSrc={getLocalBlogFallbackImage(artigo.category, artigo.slug)}
                      alt={artigo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Categoria Badge */}
                    <div className="absolute top-4 left-4">
                      <span className={`inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-light backdrop-blur-sm ${
                        categorias.find(c => c.id === artigo.category)?.color || 'text-wg-gray'
                      }`}>
                        {categorias.find(c => c.id === artigo.category)?.label}
                      </span>
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <div className="p-6">
                    {/* Meta */}
                    <div className="flex items-center gap-4 text-sm text-wg-gray mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(artigo.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {t('blogPage.readingTimeShort', { minutes: artigo.tempoLeitura })}
                      </span>
                    </div>

                    {/* Título */}
                    <h3 className={`mb-3 font-inter font-light text-wg-black transition-colors ${
                      categorias.find(c => c.id === artigo.category)?.color === 'text-wg-green'
                        ? 'group-hover:text-wg-green'
                        : categorias.find(c => c.id === artigo.category)?.color === 'text-wg-brown'
                          ? 'group-hover:text-wg-brown'
                          : 'group-hover:text-wg-blue'
                    } ${index === 0 && categoriaAtiva === 'todos' ? editorialScale.cardTitle : 'text-lg leading-[1.35]'}`}>
                      {artigo.title}
                    </h3>

                    {/* Resumo */}
                    <p className={`text-wg-gray mb-4 line-clamp-2 ${index === 0 && categoriaAtiva === 'todos' ? editorialScale.cardExcerpt : 'text-sm leading-relaxed'}`}>
                      {artigo.excerpt}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {artigo.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-xs text-wg-gray bg-gray-100 px-2 py-1 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Ler Mais */}
                    <div className={`flex items-center gap-2 text-sm font-light ${
                      categorias.find(c => c.id === artigo.category)?.color || 'text-wg-blue'
                    } transition-all group-hover:gap-3`}>
                      <span>{t('blogPage.readMore')}</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
                <div className="px-6 pb-6 -mt-1">
                  <BlogImageCredit credit={artigo.imageCardAttribution || artigo.imageHeroAttribution} />
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

    </>
  );
};

export default Blog;
