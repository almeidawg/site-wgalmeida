import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from '@/lib/motion-lite';
import { useTranslation } from 'react-i18next';
import SEO from '@/components/SEO';
import ResponsiveWebpImage from '@/components/ResponsiveWebpImage';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft,
  ArrowRight,
  Palette,
  Tag,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Copy,
  Check,
  BookOpen,
} from 'lucide-react';
import { styleCatalog } from '@/utils/styleCatalog';
import { getStyleImageUrl } from '@/data/styleImageManifest';

const slugifyHeading = (text) => text
  .toString().toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '')
  .trim().replace(/\s+/g, '-');

const extractTocHeadings = (markdown) =>
  markdown.split('\n').filter((l) => l.startsWith('## '))
    .map((l) => l.replace(/^##\s+/, '').trim())
    .filter(Boolean).map((text) => ({ text, id: slugifyHeading(text) }));

const splitMarkdownByH2 = (markdown) => {
  const lines = markdown.split('\n');
  const introLines = [];
  const sections = [];
  let current = null;
  lines.forEach((line) => {
    if (/^##\s+/.test(line)) {
      if (current) sections.push({ ...current, markdown: current.markdown.trim() });
      const heading = line.replace(/^##\s+/, '').trim();
      current = { id: slugifyHeading(heading), markdown: `${line}\n` };
      return;
    }
    if (current) current.markdown += `${line}\n`;
    else introLines.push(line);
  });
  if (current) sections.push({ ...current, markdown: current.markdown.trim() });
  return { intro: introLines.join('\n').trim(), sections };
};

const markdownComponents = {
  h1: () => null,
  strong: ({ node, className, ...props }) => (
    <strong className={`font-suisse font-light text-inherit ${className || ''}`.trim()} {...props} />
  ),
  em: ({ node, className, ...props }) => (
    <em className={`font-light text-inherit ${className || ''}`.trim()} {...props} />
  ),
  a: ({ node, className, ...props }) => (
    <a
      className={`font-light text-wg-gray underline decoration-black/20 underline-offset-4 transition-colors hover:text-wg-black hover:decoration-black/40 ${className || ''}`.trim()}
      {...props}
    />
  ),
};

// Share Buttons Component
const ShareButtons = ({ title, url }) => {
  const [copied, setCopied] = useState(false);

  const shareOnWhatsApp = () => {
    // Encode a única vez a mensagem completa para evitar caracteres % na prévia do WhatsApp
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
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-2 text-sm font-light text-wg-gray">Compartilhar:</span>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={shareOnWhatsApp}
        className="inline-flex items-center gap-2 rounded-full border border-wg-black/8 bg-white px-4 py-2 text-sm text-wg-black transition-colors hover:border-black/14 hover:text-wg-black"
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
        className="rounded-full border border-wg-black/8 bg-white p-2 text-wg-black transition-colors hover:border-black/14 hover:text-wg-black"
        title="Compartilhar no Facebook"
      >
        <Facebook className="w-5 h-5" />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={shareOnTwitter}
        className="rounded-full border border-wg-black/8 bg-white p-2 text-wg-black transition-colors hover:border-black/14 hover:text-wg-black"
        title="Compartilhar no Twitter"
      >
        <Twitter className="w-5 h-5" />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={shareOnLinkedin}
        className="rounded-full border border-wg-black/8 bg-white p-2 text-wg-black transition-colors hover:border-black/14 hover:text-wg-black"
        title="Compartilhar no LinkedIn"
      >
        <Linkedin className="w-5 h-5" />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={copyLink}
        className="rounded-full border border-wg-black/8 bg-white p-2 text-wg-gray transition-colors hover:border-black/14 hover:text-wg-black"
        title="Copiar link"
      >
        {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
      </motion.button>
    </div>
  );
};

const EstiloDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [estilo, setEstilo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allEstilos, setAllEstilos] = useState([]);
  const [activeHeadingId, setActiveHeadingId] = useState(null);

  useEffect(() => {
    const loadEstilo = () => {
      const estilosData = styleCatalog;

      setAllEstilos(estilosData);

      // Find current style
      const currentEstilo = estilosData.find(e => e.slug === slug);
      setEstilo(currentEstilo);
      setLoading(false);

      // Scroll to top
      window.scrollTo(0, 0);
    };

    loadEstilo();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Palette className="w-16 h-16 text-wg-gray animate-spin mx-auto mb-4" />
          <p className="text-wg-gray">Carregando estilo...</p>
        </div>
      </div>
    );
  }

  if (!estilo) {
    return (
      <section className="section-padding bg-white">
        <div className="container-custom max-w-3xl text-center">
          <h1 className="text-3xl md:text-4xl font-inter font-light text-wg-black mb-4">
            Estilo Não Encontrado
          </h1>
          <p className="text-wg-gray mb-8">
            O estilo que você procura não foi encontrado.
          </p>
          <Link to="/revista-estilos" className="inline-flex items-center gap-2 font-light text-wg-black transition-all hover:gap-3">
            Voltar para Revista de Estilos <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    );
  }

  const heroImg = getStyleImageUrl({ slug: estilo.slug, variant: 'hero' }) || estilo.image;
  const cardImg = getStyleImageUrl({ slug: estilo.slug, variant: 'card' }) || estilo.image;
  const contentBody = estilo.content.replace(/^\s*#\s+.*(?:\r?\n)+/, '').trim();
  const articleUrl = `https://wgalmeida.com.br/estilos/${estilo.slug}`;
  const tocHeadings = extractTocHeadings(contentBody);
  const sectionedContent = splitMarkdownByH2(contentBody);

  // Get other styles for recommendations
  const otherEstilos = allEstilos.filter(e => e.slug !== slug).slice(0, 3);

  return (
    <>
      <SEO
        title={`${estilo.title} - Guia Completo de Estilo | WG Almeida`}
        description={estilo.excerpt}
        url={articleUrl}
        image={heroImg?.startsWith('http') ? heroImg : `https://wgalmeida.com.br${heroImg}`}
        keywords={`${estilo.title.toLowerCase()}, estilo decoracao, design interiores, decoracao ${estilo.title.toLowerCase()}, ambientes ${estilo.title.toLowerCase()}`}
        schema={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: `${estilo.title} - Guia Completo de Estilo`,
          description: estilo.excerpt,
          url: articleUrl,
          image: heroImg?.startsWith('http') ? heroImg : `https://wgalmeida.com.br${heroImg}`,
          author: {
            "@type": "Organization",
            name: "Grupo WG Almeida",
          },
          publisher: {
            "@type": "Organization",
            name: "Grupo WG Almeida",
            logo: {
              "@type": "ImageObject",
              url: "https://wgalmeida.com.br/images/logo-96.webp",
            },
          },
        }}
      />

      {/* Hero Banner */}
      <section className="wg-page-hero hero-under-header items-end bg-wg-black">
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <ResponsiveWebpImage
            src={heroImg}
            alt={estilo.title}
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-wg-black via-wg-black/60 to-transparent" />
        </motion.div>

        <div className="relative z-10 container-custom pb-16 md:pb-20 pt-28 md:pt-32 lg:pt-36">
          <div className="max-w-5xl">
            {/* Color Palette */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-wrap items-center gap-3 mb-6"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/8 px-4 py-2 text-[rgba(255,255,255,0.78)] font-light uppercase tracking-[0.22em] text-[11px] backdrop-blur-sm">
                <Palette className="h-4 w-4 text-[rgba(255,255,255,0.78)]" />
                Guia de Estilo
              </span>
              <div className="flex gap-2">
                {estilo.colors.map((color, idx) => (
                  <div
                    key={idx}
                    className="h-5 w-5 rounded-full border border-white/60 shadow-[0_10px_24px_rgba(0,0,0,0.16)]"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="wg-page-hero-title mb-6 max-w-4xl"
            >
              {estilo.title}
            </motion.h1>

            {/* Quote */}
            {estilo.quote && (
              <motion.blockquote
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mb-4 max-w-3xl text-lg font-light leading-relaxed text-[rgba(255,255,255,0.84)] md:text-[1.45rem]"
              >
                "{estilo.quote}"
                {estilo.author && <cite className="mt-3 block text-sm font-light not-italic uppercase tracking-[0.18em] text-[rgba(255,255,255,0.6)]">- {estilo.author}</cite>}
              </motion.blockquote>
            )}

            {/* Excerpt */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="max-w-2xl text-base font-light leading-relaxed text-[rgba(255,255,255,0.78)] md:text-xl"
            >
              {estilo.excerpt}
            </motion.p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="section-padding bg-white">
        <div className="container-custom max-w-3xl">
          {/* Reader guide card */}
          <motion.aside
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="-mt-8 mb-7 overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-[#F8F8F8] shadow-sm md:-mt-12 md:mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr]">
              <div className="relative h-40 md:h-full">
                <ResponsiveWebpImage
                  src={cardImg}
                  alt={estilo.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent md:bg-gradient-to-t" />
              </div>
              <div className="p-6">
                <p className="mb-2 text-[11px] font-light uppercase tracking-[0.18em] text-wg-gray">
                  <BookOpen className="inline w-3.5 h-3.5 mr-1" />Guia de Estilo
                </p>
                <h2 className="text-[20px] leading-tight text-wg-black mb-3 font-light">{estilo.title}</h2>
                <p className="text-[15px] leading-[1.65] text-wg-gray mb-4">{estilo.excerpt}</p>
                {tocHeadings.slice(0, 3).map((item) => (
                  <a key={item.id} href={`#${item.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1 text-xs text-wg-black mr-2 mb-2 hover:border-black/20 hover:text-wg-black transition-colors">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-wg-orange/60" />{item.text}
                  </a>
                ))}
              </div>
            </div>
          </motion.aside>

          {/* TOC */}
          {tocHeadings.length >= 3 && (
            <nav className="mb-8 rounded-2xl border border-gray-200 bg-[#FAFAFA] p-5">
              <h2 className="mb-4 text-base font-light text-wg-black">Neste guia</h2>
              <ul className="space-y-2">
                {tocHeadings.map((item) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`}
                      className={`group flex items-center gap-3 rounded-xl border bg-white px-3.5 py-2.5 text-[13px] font-light transition-all ${
                        activeHeadingId === item.id
                          ? 'border-black/12 shadow-[0_0_0_1px_rgba(46,46,46,0.08)]'
                          : 'border-gray-200 hover:border-black/12 hover:shadow-sm'
                      }`}>
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${activeHeadingId === item.id ? 'bg-wg-orange' : 'bg-gray-400 group-hover:bg-wg-orange/80'}`} />
                      <span className={`flex-1 font-light ${activeHeadingId === item.id ? 'text-wg-black' : 'text-wg-gray group-hover:text-wg-black'}`}>{item.text}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {/* Article sectioned */}
          {sectionedContent.intro && (
            <div className="wg-prose mb-7 max-w-none
              [&>p]:text-[14px] [&>p]:font-light [&>p]:text-wg-gray [&>p]:leading-[1.58] [&>p]:mb-5
              [&_strong]:text-wg-gray [&_strong]:font-light
              [&_a]:text-wg-gray [&_a]:underline [&_a]:decoration-black/20 [&_a]:underline-offset-4 hover:[&_a]:text-wg-black hover:[&_a]:decoration-black/40
              [&>ul]:my-6 [&>ul]:space-y-3 [&>ul]:pl-0 [&>ul]:list-none
              [&>ul>li]:text-[14px] [&>ul>li]:font-light [&>ul>li]:text-wg-gray [&>ul>li]:leading-[1.58] [&>ul>li]:pl-7 [&>ul>li]:relative [&>ul>li]:before:content-[''] [&>ul>li]:before:absolute [&>ul>li]:before:left-0 [&>ul>li]:before:top-[9px] [&>ul>li]:before:w-[6px] [&>ul>li]:before:h-[6px] [&>ul>li]:before:rounded-full [&>ul>li]:before:bg-wg-orange/60">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{sectionedContent.intro}</ReactMarkdown>
            </div>
          )}

          <div className="space-y-5">
            {sectionedContent.sections.length > 0 ? sectionedContent.sections.map((section, index) => (
              <motion.article key={section.id || index}
                id={section.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.03 }}
                className="rounded-2xl border border-gray-200 bg-white p-5 md:p-7 hover:border-black/10 hover:shadow-md transition-all">
                <div className="wg-prose max-w-none
                  [&>h2]:text-[22px] [&>h2]:font-light [&>h2]:tracking-tight [&>h2]:text-wg-black [&>h2]:mb-5 [&>h2]:mt-0
                  [&>h3]:text-[16px] [&>h3]:font-light [&>h3]:text-wg-black [&>h3]:mb-4 [&>h3]:mt-8
                  [&>h4]:text-[15px] [&>h4]:font-light [&>h4]:text-wg-gray [&>h4]:mb-3 [&>h4]:mt-6
                  [&>p]:text-[14px] [&>p]:font-light [&>p]:text-wg-gray [&>p]:leading-[1.58] [&>p]:mb-5
                  [&_strong]:text-wg-gray [&_strong]:font-light
                  [&_a]:text-wg-gray [&_a]:underline [&_a]:decoration-black/20 [&_a]:underline-offset-4 hover:[&_a]:text-wg-black hover:[&_a]:decoration-black/40
                  [&>ul]:my-5 [&>ul]:space-y-2 [&>ul]:pl-0 [&>ul]:list-none
                  [&>ul>li]:text-[14px] [&>ul>li]:font-light [&>ul>li]:text-wg-gray [&>ul>li]:leading-[1.58] [&>ul>li]:pl-7 [&>ul>li]:relative [&>ul>li]:before:content-[''] [&>ul>li]:before:absolute [&>ul>li]:before:left-0 [&>ul>li]:before:top-[9px] [&>ul>li]:before:w-[6px] [&>ul>li]:before:h-[6px] [&>ul>li]:before:rounded-full [&>ul>li]:before:bg-wg-orange/60
                  [&>blockquote]:border-l-2 [&>blockquote]:border-wg-orange/25 [&>blockquote]:pl-5 [&>blockquote]:font-light [&>blockquote]:text-wg-gray [&>blockquote]:bg-gradient-to-r [&>blockquote]:from-[#f4efe8] [&>blockquote]:to-[#fcfbf9] [&>blockquote]:py-[14px] [&>blockquote]:pr-4 [&>blockquote]:rounded-r-lg [&>blockquote]:my-8">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{section.markdown}</ReactMarkdown>
                </div>
              </motion.article>
            )) : (
              <div className="wg-prose max-w-none [&>p]:text-[14px] [&>p]:font-light [&>p]:text-wg-gray [&>p]:leading-[1.58] [&>p]:mb-5 [&_strong]:text-wg-gray [&_strong]:font-light [&_a]:text-wg-gray [&_a]:underline [&_a]:decoration-black/20 [&_a]:underline-offset-4 hover:[&_a]:text-wg-black hover:[&_a]:decoration-black/40">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{contentBody}</ReactMarkdown>
              </div>
            )}
          </div>

          {/* Tags Section */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-4 h-4 text-wg-gray" />
              <span className="text-sm font-light uppercase tracking-wider text-wg-gray">Tags</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {estilo.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center rounded-full border border-black/8 bg-[#f6f6f4] px-4 py-2 text-sm font-light text-wg-black transition-all hover:border-black/14 hover:shadow-sm"
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
              title={estilo.title}
              url={articleUrl}
            />
          </div>

          {/* CTA */}
          <div className="mt-12 rounded-[28px] border border-black/6 bg-[#f7f4ef] p-8 shadow-[0_18px_60px_rgba(30,24,20,0.05)]">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/80 text-wg-black/70">
                <Palette className="w-6 h-6" />
              </div>
              <div>
                <h3 className="mb-3 text-2xl font-inter font-light text-wg-black">
                  Gostou deste estilo?
                </h3>
                <p className="mb-6 font-light leading-relaxed text-wg-gray">
                  Nossa equipe pode traduzir essa linguagem para o seu ambiente com curadoria, projeto e execução integrada.
                </p>
                <Link
                  to="/solicite-proposta"
                  className="inline-flex items-center gap-2 rounded-full bg-wg-black px-6 py-3 text-sm font-light text-white transition-colors hover:bg-wg-black/92 focus:outline-none"
                >
                  <span>Solicitar Consultoria</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-12 pt-8 border-t border-gray-200 flex items-center justify-between">
            <Link
              to="/revista-estilos"
              className="inline-flex items-center gap-2 text-wg-gray hover:text-wg-black transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-light">Voltar para Revista</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Other Styles */}
      {otherEstilos.length > 0 && (
        <section className="section-padding bg-gray-50">
          <div className="container-custom">
            <h2 className="text-3xl font-inter font-light text-wg-black mb-8 text-center">
              Explore Outros Estilos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {otherEstilos.map((otherEstilo, index) => (
                <motion.div
                  key={otherEstilo.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Link
                    to={`/estilos/${otherEstilo.slug}`}
                    className="group block relative h-80 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all"
                  >
                    <ResponsiveWebpImage
                      src={getStyleImageUrl({ slug: otherEstilo.slug, variant: 'card' }) || otherEstilo.image}
                      alt={otherEstilo.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                      <h3 className="text-2xl font-inter font-light mb-2">{otherEstilo.title}</h3>
                      <p className="text-sm text-white/80 line-clamp-2">{otherEstilo.excerpt}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default EstiloDetail;
