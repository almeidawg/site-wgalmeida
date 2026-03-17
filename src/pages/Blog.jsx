import React, { useState, useEffect } from 'react';
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
  Sparkles,
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
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { parseFrontmatter } from '@/utils/frontmatter';
import { useTranslation } from 'react-i18next';
import { getProducts } from '@/api/EcommerceApi';

const rawPostsByLocale = {
  'pt-BR': import.meta.glob('/src/content/blog/*.md', { as: 'raw', eager: true }),
  en: import.meta.glob('/src/content/blog/en/*.md', { as: 'raw', eager: true }),
  es: import.meta.glob('/src/content/blog/es/*.md', { as: 'raw', eager: true }),
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

const editorialScale = {
  kicker: 'text-[11px] font-semibold uppercase tracking-[0.18em]',
  title: 'text-[22px] leading-tight text-wg-black',
  body: 'text-[15px] leading-[1.65] text-[#4C4C4C]',
  bodyHero: 'text-[17px] md:text-[18px] leading-[1.65]',
  cardTitle: 'text-[20px] leading-[1.3] md:text-[22px]',
  cardExcerpt: 'text-[15px] leading-[1.6]'
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
      <span className="text-sm text-wg-gray font-medium mr-2">Compartilhar:</span>

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
        <span className="font-medium">WhatsApp</span>
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
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await getProducts();
        // Pega 3 produtos aleatórios
        const shuffled = response.products.sort(() => 0.5 - Math.random());
        setProducts(shuffled.slice(0, 3));
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category]);

  if (loading || products.length === 0) return null;

  return (
    <div className="mt-16 pt-16 border-t border-gray-200">
      <div className="flex items-center gap-3 mb-8">
        <ShoppingBag className="w-6 h-6 text-wg-orange" />
        <h3 className="text-2xl font-inter font-semibold text-wg-black">
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
                <img
                  src={product.image || '/images/placeholder-product.webp'}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="p-4">
                <h4 className="font-inter font-semibold text-wg-black text-sm mb-2 line-clamp-2 group-hover:text-wg-orange transition-colors">
                  {product.title}
                </h4>

                <p className="text-xs text-wg-gray mb-3 line-clamp-1">
                  {product.subtitle || product.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-wg-orange">
                    {product.variants[0]?.price_formatted}
                  </span>

                  <span className="inline-flex items-center gap-1 text-xs text-wg-orange font-medium">
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
          className="inline-flex items-center gap-2 px-6 py-3 bg-wg-orange text-white rounded-lg font-medium hover:bg-wg-orange/90 transition-all"
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
  const localeKey = i18n.language in rawPostsByLocale ? i18n.language : 'pt-BR';
  const rawPosts = rawPostsByLocale[localeKey] || {};
  const effectiveRawPosts = Object.keys(rawPosts).length ? rawPosts : rawPostsByLocale['pt-BR'];
  const artigos = Object.entries(effectiveRawPosts)
    .map(([path, raw]) => {
      try {
        const { data, content } = parseFrontmatter(raw);
        const fallbackSlug = path.split('/').pop()?.replace('.md', '');
        const slugValue = data.slug || fallbackSlug;

        return {
          title: data.title || t('blogPage.fallback.title'),
          slug: slugValue,
          subtitle: data.subtitle || '',
          excerpt: data.excerpt || '',
          image: data.image || '/images/banners/SOBRE.webp',
          category: data.category || 'arquitetura',
          author: data.author || t('blogPage.fallback.author'),
          date: data.date || '2025-12-01',
          heroPosition: data.heroPosition || '50% 50%',
          featured: Boolean(data.featured),
          tags: Array.isArray(data.tags) ? data.tags : [],
          content,
          tempoLeitura: estimateReadingTime(content),
        };
      } catch (err) {
        console.error('Error parsing blog post:', path, err);
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const categorias = [
    { id: 'todos', label: t('blogPage.categories.all'), icon: BookOpen, bgColor: 'bg-wg-orange' },
    { id: 'arquitetura', label: t('blogPage.categories.architecture'), icon: Ruler, color: 'text-wg-green', bgColor: 'bg-wg-green' },
    { id: 'engenharia', label: t('blogPage.categories.engineering'), icon: Building2, color: 'text-wg-blue', bgColor: 'bg-wg-blue' },
    { id: 'marcenaria', label: t('blogPage.categories.carpentry'), icon: Hammer, color: 'text-wg-brown', bgColor: 'bg-wg-brown' },
    { id: 'design', label: t('blogPage.categories.design'), icon: Sparkles, color: 'text-wg-orange', bgColor: 'bg-wg-orange' },
    { id: 'tecnologia', label: t('blogPage.categories.technology'), icon: Monitor, color: 'text-wg-blue', bgColor: 'bg-wg-blue' },
    { id: 'tendencias', label: t('blogPage.categories.trends'), icon: TrendingUp, color: 'text-wg-orange', bgColor: 'bg-wg-orange' },
    { id: 'dicas', label: t('blogPage.categories.tips'), icon: Lightbulb, color: 'text-wg-orange', bgColor: 'bg-wg-orange' }
  ];
  const [categoriaAtiva, setCategoriaAtiva] = useState('todos');
  const { slug } = useParams();
  const [activeHeadingId, setActiveHeadingId] = useState('');

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

  const formatDate = (dateStr) => {
    const localeMap = { 'pt-BR': 'pt-BR', en: 'en-US', es: 'es-ES' };
    const locale = localeMap[i18n.language] || 'pt-BR';
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
            <Link to="/blog" className="text-wg-orange font-medium inline-flex items-center gap-2">
              {t('blogPage.notFound.cta')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      );
    }

    const rawBody = artigoAtual.content.replace(/^# .*?\\n+/, '').trim();
    const contentBody = stripDuplicateTocSection(rawBody);
    const articleUrl = `https://wgalmeida.com.br/blog/${artigoAtual.slug}`;
    const tocHeadings = extractTocHeadings(contentBody);
    const sectionedContent = splitMarkdownByH2(contentBody);

    // hreflang alternates — verifica se o slug existe em outros idiomas
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
    const currentOgLocale = localeToOg[i18n.language] || 'pt_BR';

    const readerGuideLabel = t('blogPage.readerGuide.title', 'Leitura Guiada');
    const tocTitleLabel = t('blogPage.readerGuide.tocTitle', 'Neste artigo');
    const readingLabel = t('blogPage.readerGuide.reading', 'lendo');
    const categoryMeta = {
      arquitetura: { dotColor: 'bg-wg-green', bgColor: 'bg-wg-green' },
      engenharia: { dotColor: 'bg-wg-blue', bgColor: 'bg-wg-blue' },
      marcenaria: { dotColor: 'bg-wg-brown', bgColor: 'bg-wg-brown' },
      insights: { dotColor: 'bg-wg-orange', bgColor: 'bg-wg-orange' },
      design: { dotColor: 'bg-wg-orange', bgColor: 'bg-wg-orange' },
      tecnologia: { dotColor: 'bg-wg-orange', bgColor: 'bg-wg-orange' },
      tendencias: { dotColor: 'bg-wg-orange', bgColor: 'bg-wg-orange' },
      dicas: { dotColor: 'bg-wg-orange', bgColor: 'bg-wg-orange' }
    };
    const currentCategory = categorias.find(c => c.id === artigoAtual.category);
    const currentCategoryMeta = categoryMeta[artigoAtual.category] || { dotColor: 'bg-wg-orange', bgColor: 'bg-wg-orange' };
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
      blockquote: ({ children, ...props }) => {
        const text = extractHeadingText(children).trim();
        if (text.startsWith('DESTAQUE:') || text.startsWith('🎯 DESTAQUE:')) {
          return (
            <div
              className="my-8 rounded-lg border-l-4 border-wg-orange bg-wg-orange/10 p-5 text-[15px] leading-[1.65] text-[#2E2E2E]"
              {...props}
            >
              {children}
            </div>
          );
        }
        if (text.startsWith('DICA:') || text.startsWith('💡 DICA:') || text.startsWith('CHECKLIST:') || text.startsWith('✅ CHECKLIST:')) {
          return (
            <div
              className="my-8 rounded-lg border-l-4 border-wg-blue bg-wg-blue/10 p-5 text-[15px] leading-[1.65] text-[#2E2E2E]"
              {...props}
            >
              {children}
            </div>
          );
        }
        return <blockquote {...props}>{children}</blockquote>;
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
          image={`https://wgalmeida.com.br${artigoAtual.image}`}
          schema={schemas.article(
            artigoAtual.title,
            artigoAtual.excerpt,
            articleUrl,
            artigoAtual.date,
            `https://wgalmeida.com.br${artigoAtual.image}`
          )}
          alternates={hreflangAlternates}
        />

        <section className="hero-under-header relative min-h-[50vh] flex items-end overflow-hidden bg-wg-black">
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <img
              src={artigoAtual.image}
              alt={artigoAtual.title}
              className="w-full h-full object-cover"
              style={{ objectPosition: artigoAtual.heroPosition }}
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-wg-black via-wg-black/60 to-transparent" />
          </motion.div>

          <div className="relative z-10 container-custom pb-16 pt-32">
            <div className="max-w-3xl">
              <span className={`inline-flex items-center gap-2 px-4 py-2 ${currentCategoryMeta.bgColor} text-white rounded-full text-sm font-medium uppercase tracking-wider mb-6`}>
                <span className={`inline-block w-2 h-2 rounded-full bg-white/90`} />
                <span>{currentCategory?.label || t('blogPage.fallback.category')}</span>
              </span>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-inter font-light text-white mb-6 leading-tight">
                {artigoAtual.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-white/70">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{artigoAtual.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(artigoAtual.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{t('blogPage.readingTime', { minutes: artigoAtual.tempoLeitura })}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-padding bg-white">
          <div className="container-custom max-w-3xl">
            <motion.aside
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="-mt-8 mb-7 overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-[#F8F8F8] shadow-sm md:-mt-12 md:mb-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]">
                <div className="relative h-44 md:h-full">
                  <img
                    src={artigoAtual.image}
                    alt={artigoAtual.title}
                    className="h-full w-full object-cover"
                    style={{ objectPosition: artigoAtual.heroPosition }}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/25 to-transparent md:bg-gradient-to-t" />
                </div>
                <div className="p-6 md:p-7">
                  <p className={`mb-2 text-wg-gray ${editorialScale.kicker}`}>
                    {readerGuideLabel}
                  </p>
                  <h2 className={`mb-3 ${editorialScale.title}`}>
                    {artigoAtual.subtitle || artigoAtual.excerpt}
                  </h2>
                  <p className={`mb-5 ${editorialScale.body}`}>
                    {artigoAtual.excerpt}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    {tocHeadings.slice(0, 3).map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-[#2E2E2E] transition-colors hover:border-wg-orange hover:text-wg-orange"
                      >
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-wg-orange" />
                        {item.text}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </motion.aside>

            {tocHeadings.length >= 3 && (
              <nav className="mb-8 rounded-2xl border border-gray-200 bg-[#FAFAFA] p-5">
                <h2 className="mb-4 text-base font-semibold text-wg-black">{tocTitleLabel}</h2>
                <ul className="space-y-2">
                  {tocHeadings.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className={`group flex items-center justify-between rounded-xl border bg-white px-3.5 py-2.5 text-[13px] transition-all ${
                          activeHeadingId === item.id
                            ? 'border-wg-orange shadow-[0_0_0_1px_rgba(242,92,38,0.15)]'
                            : 'border-gray-200 hover:border-wg-orange/80 hover:shadow-sm'
                        }`}
                      >
                        <span className={`inline-block h-1.5 w-1.5 rounded-full transition-colors ${
                          activeHeadingId === item.id ? 'bg-wg-orange' : 'bg-gray-400 group-hover:bg-wg-orange'
                        }`} />
                        <span className={`ml-3 flex-1 text-left ${
                          activeHeadingId === item.id ? 'text-[#2E2E2E]' : 'text-wg-gray group-hover:text-[#2E2E2E]'
                        }`}>
                          {item.text}
                        </span>
                        <span className={`ml-2 text-[10px] font-medium uppercase tracking-[0.12em] ${
                          activeHeadingId === item.id ? 'text-wg-orange' : 'text-gray-400 group-hover:text-wg-orange/80'
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
              <div className="wg-prose mb-7 max-w-none
                [&>h1]:text-[32px] [&>h1]:font-light [&>h1]:tracking-tight [&>h1]:text-[#1A1A1A] [&>h1]:mb-8 [&>h1]:mt-0
                [&>h3]:text-[18px] [&>h3]:font-medium [&>h3]:text-[#1F2937] [&>h3]:mb-4 [&>h3]:mt-10
                [&>p]:text-[16px] [&>p]:text-[#334155] [&>p]:leading-[1.58] [&>p]:mb-5
                [&_strong]:text-[#1A1A1A] [&_strong]:font-medium
                [&_a]:text-[#F25C26] [&_a]:no-underline [&_a:hover]:underline [&_a]:font-medium
                [&>ul]:my-6 [&>ul]:space-y-3 [&>ul]:pl-0 [&>ul]:list-none
                [&>ul>li]:text-[15px] [&>ul>li]:text-[#334155] [&>ul>li]:leading-[1.48] [&>ul>li]:pl-7 [&>ul>li]:relative [&>ul>li]:before:content-[''] [&>ul>li]:before:absolute [&>ul>li]:before:left-0 [&>ul>li]:before:top-[8px] [&>ul>li]:before:w-2 [&>ul>li]:before:h-2 [&>ul>li]:before:rounded-full [&>ul>li]:before:bg-wg-orange
                [&>ol]:my-6 [&>ol]:space-y-2 [&>ol]:pl-6 [&>ol]:list-decimal
                [&>ol>li]:text-[15px] [&>ol>li]:text-[#334155] [&>ol>li]:leading-[1.48]
                [&>ol>li::marker]:text-[#64748B]">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {sectionedContent.intro}
                </ReactMarkdown>
              </div>
            )}

            <div className="space-y-5">
              {sectionedContent.sections.length > 0 ? sectionedContent.sections.map((section, index) => (
                <motion.article
                  key={section.id || index}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: index * 0.03 }}
                  className={`rounded-2xl border bg-white p-5 transition-all md:p-7 ${
                    activeHeadingId === section.id
                      ? 'border-wg-orange shadow-[0_0_0_1px_rgba(242,92,38,0.15)]'
                      : 'border-gray-200 hover:border-wg-orange/80 hover:shadow-md'
                  }`}
                >
                  <div className="wg-prose max-w-none
                    [&>h2]:text-[24px] [&>h2]:font-light [&>h2]:tracking-tight [&>h2]:text-[#111827] [&>h2]:mb-5 [&>h2]:mt-0
                    [&>h3]:text-[18px] [&>h3]:font-medium [&>h3]:text-[#1F2937] [&>h3]:mb-4 [&>h3]:mt-8
                    [&>p]:text-[16px] [&>p]:text-[#334155] [&>p]:leading-[1.58] [&>p]:mb-5
                    [&_strong]:text-[#1A1A1A] [&_strong]:font-medium
                    [&_a]:text-[#F25C26] [&_a]:no-underline [&_a:hover]:underline [&_a]:font-medium
                    [&>ul]:my-5 [&>ul]:space-y-2 [&>ul]:pl-0 [&>ul]:list-none
                    [&>ul>li]:text-[15px] [&>ul>li]:text-[#334155] [&>ul>li]:leading-[1.48] [&>ul>li]:pl-7 [&>ul>li]:relative [&>ul>li]:before:content-[''] [&>ul>li]:before:absolute [&>ul>li]:before:left-0 [&>ul>li]:before:top-[8px] [&>ul>li]:before:w-2 [&>ul>li]:before:h-2 [&>ul>li]:before:rounded-full [&>ul>li]:before:bg-wg-orange
                    [&>ol]:my-5 [&>ol]:space-y-2 [&>ol]:pl-6 [&>ol]:list-decimal
                    [&>ol>li]:text-[15px] [&>ol>li]:text-[#334155] [&>ol>li]:leading-[1.48]
                    [&>ol>li::marker]:text-[#64748B]
                    [&>blockquote]:border-l-4 [&>blockquote]:border-[#F25C26] [&>blockquote]:pl-6 [&>blockquote]:italic [&>blockquote]:text-[#4C4C4C] [&>blockquote]:bg-[#F9F9F9] [&>blockquote]:py-4 [&>blockquote]:pr-4 [&>blockquote]:rounded-r-lg [&>blockquote]:my-8
                    [&>table]:w-full [&>table]:my-8 [&>table]:rounded-xl [&>table]:overflow-hidden [&>table]:shadow-md [&>table]:border [&>table]:border-[#E5E5E5]
                    [&>table>thead]:bg-[#F5F5F5]
                    [&>table>thead>tr>th]:px-5 [&>table>thead>tr>th]:py-4 [&>table>thead>tr>th]:text-left [&>table>thead>tr>th]:text-[12px] [&>table>thead>tr>th]:font-medium [&>table>thead>tr>th]:uppercase [&>table>thead>tr>th]:tracking-wide [&>table>thead>tr>th]:text-[#2E2E2E] [&>table>thead>tr>th]:border-b [&>table>thead>tr>th]:border-[#E5E5E5]
                    [&>table>tbody>tr>td]:px-5 [&>table>tbody>tr>td]:py-4 [&>table>tbody>tr>td]:text-[14px] [&>table>tbody>tr>td]:text-[#4C4C4C] [&>table>tbody>tr>td]:border-b [&>table>tbody>tr>td]:border-[#E5E5E5]
                    [&>table>tbody>tr]:transition-colors [&>table>tbody>tr:hover]:bg-[#F9F9F9]
                    [&>table>tbody>tr:last-child>td]:border-b-0
                    [&_code]:bg-[#F5F5F5] [&_code]:px-2 [&_code]:py-1 [&_code]:rounded [&_code]:text-[13px] [&_code]:text-[#F25C26]
                    [&>pre]:bg-[#1A1A1A] [&>pre]:text-white [&>pre]:p-6 [&>pre]:rounded-lg [&>pre]:overflow-x-auto [&>pre]:my-8
                    [&>img]:rounded-lg [&>img]:shadow-md [&>img]:my-8
                    [&>hr]:border-[#E5E5E5] [&>hr]:my-10">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {section.markdown}
                    </ReactMarkdown>
                  </div>
                </motion.article>
              )) : (
                <div className="wg-prose max-w-none
                  [&>p]:text-[16px] [&>p]:text-[#4C4C4C] [&>p]:leading-[1.65] [&>p]:mb-5">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {contentBody}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            {/* Tags Section */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-4 h-4 text-wg-gray" />
                <span className="text-sm font-medium text-wg-gray uppercase tracking-wider">Tags</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {(artigoAtual.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-wg-orange/10 to-wg-orange/5 text-wg-black border border-wg-orange/20 hover:border-wg-orange hover:shadow-sm transition-all"
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
                <span className="text-sm font-medium text-wg-gray uppercase tracking-wider">Compartilhe</span>
              </div>
              <ShareButtons
                title={artigoAtual.title}
                url={articleUrl}
              />
            </div>

            {/* Seção de Produtos Relacionados */}
            <RelatedProducts category={artigoAtual.category} />

            <div className="mt-12">
              <Link to="/blog" className="text-wg-orange font-medium inline-flex items-center gap-2">
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
      <section className="relative min-h-[50vh] flex items-end overflow-hidden bg-wg-black hero-under-header">
        {/* Imagem de Fundo */}
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <img
            src={artigoRecente?.image}
            alt={artigoRecente?.title}
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-wg-black via-wg-black/60 to-transparent" />
        </motion.div>

        {/* Conteúdo Hero */}
        <div className="relative z-10 container-custom pb-16 pt-32">
          <div className="max-w-3xl">
            {/* Tag Categoria */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-4"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-wg-orange text-white rounded-full text-sm font-medium uppercase tracking-wider">
                <Tag className="w-4 h-4" />
                {t('blogPage.hero.featured')}
              </span>
            </motion.div>

            {/* Título */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl md:text-5xl lg:text-6xl font-inter font-light text-white mb-6 leading-tight"
            >
              {artigoRecente?.title}
            </motion.h1>

            {/* Resumo */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className={`${editorialScale.bodyHero} text-white/80 mb-8 max-w-3xl`}
            >
              {artigoRecente?.excerpt}
            </motion.p>

            {/* Meta Info */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-wrap items-center gap-6 text-white/60 mb-8"
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

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <Link
                to={`/blog/${artigoRecente?.slug}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-wg-orange text-white rounded-lg font-medium hover:bg-wg-orange/90 transition-all group"
              >
                {t('blogPage.hero.cta')}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Linha Decorativa */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-wg-orange via-wg-green to-wg-blue" />
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
                      ? 'bg-wg-orange text-white'
                      : 'bg-gray-100 text-wg-gray hover:bg-gray-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${categoriaAtiva === cat.id ? '' : cat.color || ''}`} />
                  <span className="font-medium text-sm">{cat.label}</span>
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
              <div className="h-px flex-1 bg-gradient-to-r from-wg-orange to-transparent" />
              <span className="text-wg-orange font-medium tracking-[0.2em] uppercase text-sm">
                {categoriaAtiva === 'todos' ? t('blogPage.section.latest') : categorias.find(c => c.id === categoriaAtiva)?.label}
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-wg-orange to-transparent" />
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
                    <img
                      src={artigo.image}
                      alt={artigo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Categoria Badge */}
                    <div className="absolute top-4 left-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-white/90 backdrop-blur-sm ${
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
                    <h3 className={`font-inter font-semibold text-wg-black mb-3 group-hover:text-wg-orange transition-colors ${index === 0 && categoriaAtiva === 'todos' ? editorialScale.cardTitle : 'text-lg leading-[1.35]'}`}>
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
                    <div className="flex items-center gap-2 text-wg-orange font-medium text-sm group-hover:gap-3 transition-all">
                      <span>{t('blogPage.readMore')}</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

    </>
  );
};

export default Blog;
