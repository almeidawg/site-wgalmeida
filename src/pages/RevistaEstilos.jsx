import React, { useState, useEffect } from 'react';
import { motion } from '@/lib/motion-lite';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEO from '@/components/SEO';
import ResponsiveWebpImage from '@/components/ResponsiveWebpImage';
import {
  Palette,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Heart,
  Eye,
  BookOpen
} from 'lucide-react';
import { parseFrontmatter } from '@/utils/frontmatter';

// Import all style markdown files
const estilosFiles = import.meta.glob('/src/content/estilos/*.md', { as: 'raw', eager: true });

// Component for Style Card
const StyleCard = ({ estilo, index }) => {
  const isEven = index % 2 === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className={`group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 ${
        index === 0 ? 'col-span-1 md:col-span-2 row-span-2' : 'col-span-1'
      }`}
    >
      <Link to={`/estilos/${estilo.slug}`}>
        {/* Image */}
        <div className="relative h-full min-h-[400px] overflow-hidden">
          <ResponsiveWebpImage
            src={estilo.image}
            alt={estilo.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            loading={index < 2 ? "eager" : "lazy"}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />

          {/* Featured Badge */}
          {estilo.featured && (
            <div className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-wg-orange text-white rounded-full text-xs font-semibold uppercase tracking-wider shadow-lg">
              <Sparkles className="w-4 h-4" />
              <span>Destaque</span>
            </div>
          )}

          {/* Color Palette */}
          <div className="absolute top-6 left-6 flex gap-2">
            {estilo.colors.slice(0, 4).map((color, idx) => (
              <div
                key={idx}
                className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-8 text-white">
          {/* Quote */}
          {estilo.quote && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mb-6 italic text-sm md:text-base opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            >
              "{estilo.quote}"
              {estilo.author && <span className="block mt-2 text-xs not-italic">— {estilo.author}</span>}
            </motion.div>
          )}

          {/* Title */}
          <h3 className={`font-playfair font-bold text-white mb-3 ${
            index === 0 ? 'text-4xl md:text-5xl' : 'text-2xl md:text-3xl'
          }`}>
            {estilo.title}
          </h3>

          {/* Excerpt */}
          <p className={`text-white/90 leading-relaxed mb-4 ${
            index === 0 ? 'text-base md:text-lg' : 'text-sm'
          }`}>
            {estilo.excerpt}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {estilo.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-white/20 backdrop-blur-sm text-xs rounded-full border border-white/30"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-2 text-wg-orange font-semibold group-hover:gap-4 transition-all duration-300">
            <span>Explorar Estilo</span>
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const RevistaEstilos = () => {
  const { t } = useTranslation();
  const [estilos, setEstilos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEstilos = () => {
      const estilosData = Object.entries(estilosFiles).map(([path, raw]) => {
        const { data, content } = parseFrontmatter(raw);
        const slug = path.split('/').pop().replace('.md', '');

        return {
          slug,
          title: data.title || '',
          excerpt: data.excerpt || '',
          image: data.image || '/images/placeholder.webp',
          quote: data.quote || '',
          author: data.author || '',
          featured: Boolean(data.featured),
          tags: Array.isArray(data.tags) ? data.tags : [],
          colors: Array.isArray(data.colors) ? data.colors : ['#000000'],
          content
        };
      });

      // Sort: featured first, then alphabetically
      estilosData.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return a.title.localeCompare(b.title);
      });

      setEstilos(estilosData);
      setLoading(false);
    };

    loadEstilos();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Palette className="w-16 h-16 text-wg-orange animate-spin mx-auto mb-4" />
          <p className="text-wg-gray">Carregando estilos...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        pathname="/revista-estilos"
        title="Revista de Estilos | Descubra seu Estilo Ideal - WG Almeida"
        description="Explore nossa revista de estilos: Minimalismo, Clássico, Moderno, Vintage, Tropical, Boho e mais. Descubra qual estilo combina com você."
        keywords="estilos de decoração, design de interiores, minimalismo, clássico, moderno, vintage, tropical, boho, revista de estilos"
      />

      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden bg-wg-black">
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <ResponsiveWebpImage
            src="/images/banners/SOBRE.webp"
            alt="Revista de Estilos"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-wg-black/60 via-wg-black/70 to-wg-black" />
        </motion.div>

        <div className="relative z-10 container-custom text-center text-white px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <Palette className="w-8 h-8 text-wg-orange" />
              <span className="text-wg-orange font-semibold uppercase tracking-widest text-sm">
                Revista de Estilos
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-playfair font-bold mb-6 leading-tight">
              Qual é o Seu Estilo?
            </h1>

            <p className="text-xl md:text-2xl text-white/90 leading-relaxed mb-8">
              Explore nossa curadoria de estilos para ambientes residenciais.
              Descubra qual deles reflete sua personalidade e transforme seu espaço em um lar único.
            </p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-4"
            >
              <div className="flex items-center gap-2 text-white/70">
                <BookOpen className="w-5 h-5" />
                <span>{estilos.length} Estilos</span>
              </div>
              <div className="w-px h-6 bg-white/30" />
              <div className="flex items-center gap-2 text-white/70">
                <Eye className="w-5 h-5" />
                <span>Guia Completo</span>
              </div>
              <div className="w-px h-6 bg-white/30" />
              <div className="flex items-center gap-2 text-white/70">
                <Heart className="w-5 h-5" />
                <span>Inspiração</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 1, repeat: Infinity, repeatType: "reverse" }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <ChevronRight className="w-8 h-8 text-white rotate-90" />
        </motion.div>
      </section>

      {/* Styles Grid */}
      <section className="section-padding bg-gradient-to-b from-white to-gray-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-playfair font-bold text-wg-black mb-4">
              Explore Nossos Estilos
            </h2>
            <p className="text-lg text-wg-gray max-w-2xl mx-auto">
              Cada estilo conta uma história. Encontre aquele que fala com você.
            </p>
          </motion.div>

          {/* Masonry Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-auto">
            {estilos.map((estilo, index) => (
              <StyleCard key={estilo.slug} estilo={estilo} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-wg-black text-white">
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <Sparkles className="w-12 h-12 text-wg-orange mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-playfair font-bold mb-6">
              Pronto para Transformar seu Espaço?
            </h2>
            <p className="text-xl text-white/80 mb-8">
              Nossa equipe de arquitetos e designers está pronta para criar o ambiente dos seus sonhos,
              no estilo que mais combina com você.
            </p>
            <Link
              to="/solicite-proposta"
              className="inline-flex items-center gap-3 px-8 py-4 bg-wg-orange text-white rounded-lg font-semibold hover:bg-wg-orange-dark transition-colors shadow-lg hover:shadow-xl"
            >
              <span>Solicite uma Consultoria Gratuita</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default RevistaEstilos;
