import React, { useState } from 'react';
import SEO from '@/components/SEO';
import { motion, AnimatePresence } from '@/lib/motion-lite';
import { X, ChevronLeft, ChevronRight, ZoomIn, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ResponsiveWebpImage from '@/components/ResponsiveWebpImage';
import { useTranslation } from 'react-i18next';
import { SCHEMAS } from '@/data/schemaConfig';

/**
 * Página de Projetos - Galeria Premium WG Almeida
 * Com fotos reais, molduras elegantes e transições suaves
 */

// Componente de moldura elegante
const PhotoFrame = ({ image, onClick, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
    className="group relative cursor-pointer"
    onClick={onClick}
  >
    <div className="relative bg-white p-2 md:p-3 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500">
      {/* Cantos decorativos */}
      <div className="absolute top-0.5 left-0.5 w-3 h-3 border-t-2 border-l-2 border-wg-orange/40 rounded-tl-lg" />
      <div className="absolute top-0.5 right-0.5 w-3 h-3 border-t-2 border-r-2 border-wg-orange/40 rounded-tr-lg" />
      <div className="absolute bottom-0.5 left-0.5 w-3 h-3 border-b-2 border-l-2 border-wg-orange/40 rounded-bl-lg" />
      <div className="absolute bottom-0.5 right-0.5 w-3 h-3 border-b-2 border-r-2 border-wg-orange/40 rounded-br-lg" />

      <div className="relative overflow-hidden rounded-lg border border-wg-brown/10">
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={image.src}
            alt={image.label}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-wg-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Zoom icon */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <ZoomIn className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* Label */}
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
            <p className="text-white text-sm font-medium">{image.label}</p>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

// Modal Lightbox
const Lightbox = ({ images, currentIndex, onClose, onPrev, onNext }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
    onClick={onClose}
  >
    <button onClick={onClose} className="absolute top-6 right-6 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
      <X className="w-6 h-6 text-white" />
    </button>

    <button onClick={(e) => { e.stopPropagation(); onPrev(); }} className="absolute left-6 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
      <ChevronLeft className="w-8 h-8 text-white" />
    </button>

    <motion.div
      key={currentIndex}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative max-w-5xl max-h-[85vh] mx-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-white p-4 rounded-xl shadow-2xl">
        <div className="border-2 border-wg-brown/20 rounded-lg overflow-hidden">
          <img src={images[currentIndex]?.src} alt={images[currentIndex]?.label} className="max-h-[70vh] w-auto mx-auto object-contain" />
        </div>
        <p className="text-center mt-4 text-wg-black font-medium">{images[currentIndex]?.label}</p>
        <div className="flex justify-center gap-2 mt-3">
          {images.map((_, idx) => (
            <div key={idx} className={`w-2 h-2 rounded-full ${idx === currentIndex ? 'bg-wg-orange' : 'bg-gray-300'}`} />
          ))}
        </div>
      </div>
    </motion.div>

    <button onClick={(e) => { e.stopPropagation(); onNext(); }} className="absolute right-6 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
      <ChevronRight className="w-8 h-8 text-white" />
    </button>

    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-sm">
      {currentIndex + 1} / {images.length}
    </div>
  </motion.div>
);

const Projects = () => {
  const { t } = useTranslation();
  const projects = t('projectsPage.projects', { returnObjects: true });
  const filters = t('projectsPage.filters', { returnObjects: true });
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [lightbox, setLightbox] = useState({ open: false, images: [], index: 0 });

  const filteredProjects = projects.filter(p => selectedFilter === 'all' || p.category === selectedFilter);

  const openLightbox = (images, index) => setLightbox({ open: true, images, index });
  const closeLightbox = () => setLightbox({ ...lightbox, open: false });
  const prevImage = () => setLightbox(s => ({ ...s, index: (s.index - 1 + s.images.length) % s.images.length }));
  const nextImage = () => setLightbox(s => ({ ...s, index: (s.index + 1) % s.images.length }));

  // Keyboard navigation
  React.useEffect(() => {
    const handleKey = (e) => {
      if (!lightbox.open) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightbox.open]);

  return (
    <>
      <SEO pathname="/projetos" schema={SCHEMAS.breadcrumbProjects} />

      {/* Hero Section */}
      <section className="relative h-[50vh] flex items-center justify-center overflow-hidden hero-under-header">
        <div className="absolute inset-0 z-0">
          <ResponsiveWebpImage
            className="w-full h-full object-cover"
            alt={t('projectsPage.hero.imageAlt')}
            src="/images/banners/PROJETOS .webp"
            width="1920"
            height="1080"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-wg-black/70 via-wg-black/50 to-wg-black/70" />
        </div>

        <div className="relative z-10 container-custom text-center text-white px-4">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-wg-orange font-medium text-sm tracking-widest uppercase mb-4 block"
          >
            {t('projectsPage.hero.kicker')}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-inter font-light mb-6 tracking-tight normal-case"
          >
            {t('projectsPage.hero.title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl font-light max-w-3xl mx-auto text-white/80"
          >
            {t('projectsPage.hero.subtitle')}
          </motion.p>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="w-6 h-10 border-2 border-white/40 rounded-full flex items-start justify-center p-2">
            <motion.div className="w-1.5 h-1.5 bg-white rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* Filtros */}
      <section className="py-8 bg-white border-b border-gray-100 sticky top-20 z-40 backdrop-blur-lg bg-white/90">
        <div className="container-custom">
          <div className="flex flex-wrap gap-3 justify-center">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`${
                  selectedFilter === filter.id
                    ? 'wg-btn-pill-primary'
                    : 'wg-btn-pill-secondary'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Projetos */}
      <section className="section-padding bg-wg-gray-light">
        <div className="container-custom space-y-20">
          {filteredProjects.map((project, projectIndex) => (
            <motion.article
              key={project.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-3xl shadow-xl overflow-hidden"
            >
              {/* Header do projeto */}
              <div className="p-8 md:p-12 border-b border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.tags.map((tag, i) => (
                        <span key={i} className="px-3 py-1 bg-wg-orange/10 text-wg-orange text-xs font-medium rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black tracking-tight normal-case mb-2">
                      {project.title}
                    </h2>
                    <p className="text-wg-gray">{project.location}</p>
                  </div>
                  <div className="flex gap-8 text-center">
                    <div>
                      <p className="text-2xl font-medium text-wg-black">{project.area}</p>
                      <p className="text-sm text-wg-gray">{t('projectsPage.meta.area')}</p>
                    </div>
                    <div>
                      <p className="text-2xl font-medium text-wg-black">{project.duration}</p>
                      <p className="text-sm text-wg-gray">{t('projectsPage.meta.duration')}</p>
                    </div>
                  </div>
                </div>
                <p className="mt-6 text-wg-gray leading-relaxed max-w-3xl">{project.description}</p>
              </div>

              {/* Galeria de fotos */}
              <div className="p-8 md:p-12 bg-wg-gray-light/50">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {project.images.map((image, imageIndex) => (
                    <PhotoFrame
                      key={imageIndex}
                      image={image}
                      index={imageIndex}
                      onClick={() => openLightbox(project.images, imageIndex)}
                    />
                  ))}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-wg-black text-white">
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-inter font-light mb-6 normal-case tracking-tight">
              {t('projectsPage.cta.title')}
            </h2>
            <p className="text-white/70 mb-8 max-w-2xl mx-auto">
              {t('projectsPage.cta.subtitle')}
            </p>
            <Link to="/contato" className="inline-flex items-center gap-2 btn-apple text-lg px-8 py-4">
              {t('projectsPage.cta.button')}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox.open && (
          <Lightbox
            images={lightbox.images}
            currentIndex={lightbox.index}
            onClose={closeLightbox}
            onPrev={prevImage}
            onNext={nextImage}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Projects;
