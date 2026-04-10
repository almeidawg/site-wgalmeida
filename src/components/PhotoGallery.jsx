import React, { useState } from "react";
import { motion, AnimatePresence } from '@/lib/motion-lite';
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { LazyImage } from "./OptimizedImage";
import { useTranslation } from 'react-i18next';
import { resolvePhotoGalleryProjects } from '@/utils/cloudinaryProjectPortfolio';

/**
 * Galeria de Fotos Moderna com Molduras Elegantes
 * Estilo premium para projetos WG Almeida
 */

// Projetos com fotos antes/depois e detalhes
const PROJECTS_FALLBACK_IMAGE = '/images/banners/PROJETOS.webp';

const galleryProjects = [
  {
    id: 1,
    titleKey: "photoGallery.projects.brooklin.title",
    categoryKey: "photoGallery.projects.brooklin.category",
    images: [
      { labelKey: "photoGallery.projects.brooklin.images.livingRoom" },
      { labelKey: "photoGallery.projects.brooklin.images.gourmetKitchen" },
      { labelKey: "photoGallery.projects.brooklin.images.leisureArea" },
    ],
  },
  {
    id: 2,
    titleKey: "photoGallery.projects.itaim.title",
    categoryKey: "photoGallery.projects.itaim.category",
    images: [
      { labelKey: "photoGallery.projects.itaim.images.integratedLiving" },
      { labelKey: "photoGallery.projects.itaim.images.masterSuite" },
      { labelKey: "photoGallery.projects.itaim.images.homeOffice" },
    ],
  },
  {
    id: 3,
    titleKey: "photoGallery.projects.jardins.title",
    categoryKey: "photoGallery.projects.jardins.category",
    images: [
      { labelKey: "photoGallery.projects.jardins.images.walkInCloset" },
      { labelKey: "photoGallery.projects.jardins.images.library" },
      { labelKey: "photoGallery.projects.jardins.images.gourmetCounter" },
    ],
  },
  {
    id: 4,
    titleKey: "photoGallery.projects.vilaNova.title",
    categoryKey: "photoGallery.projects.vilaNova.category",
    images: [
      { labelKey: "photoGallery.projects.vilaNova.images.terrace" },
      { labelKey: "photoGallery.projects.vilaNova.images.pool" },
      { labelKey: "photoGallery.projects.vilaNova.images.outdoorLounge" },
    ],
  },
];

// Componente de moldura elegante para cada foto
const PhotoFrame = ({ image, project, index, onClick }) => {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group relative cursor-pointer"
      onClick={onClick}
    >
      <div className="relative bg-white p-3 rounded-lg shadow-lg hover:shadow-2xl transition-all duration-500">
        <div className="relative overflow-hidden rounded-md border border-wg-brown/20">
          <div className="relative aspect-[4/3] overflow-hidden">
            <LazyImage
              src={image.thumbSrc || image.src}
              alt={t(image.labelKey)}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              width={600}
              height={450}
              fallbackSrc={PROJECTS_FALLBACK_IMAGE}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-wg-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <ZoomIn className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
              <p className="text-white text-sm font-medium">{t(image.labelKey)}</p>
            </div>
          </div>
        </div>

        <div className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-wg-orange/30 rounded-tl-lg" />
        <div className="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 border-wg-orange/30 rounded-tr-lg" />
        <div className="absolute bottom-1 left-1 w-4 h-4 border-b-2 border-l-2 border-wg-orange/30 rounded-bl-lg" />
        <div className="absolute bottom-1 right-1 w-4 h-4 border-b-2 border-r-2 border-wg-orange/30 rounded-br-lg" />
      </div>
    </motion.div>
  );
};

const LightboxModal = ({ images, currentIndex, onClose, onPrev, onNext }) => {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
        onClick={onClose}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-6 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        >
          <ChevronLeft className="w-8 h-8 text-white" />
        </button>

        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="relative max-w-6xl max-h-[85vh] mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white p-4 rounded-xl shadow-2xl">
            <div className="border-2 border-wg-brown/20 rounded-lg overflow-hidden">
              <img
                src={images[currentIndex]?.fullSrc || images[currentIndex]?.src}
                alt={images[currentIndex]?.labelKey ? t(images[currentIndex]?.labelKey) : ''}
                className="max-h-[75vh] w-auto mx-auto object-contain"
                width={1280}
                height={720}
                loading="lazy"
                decoding="async"
                onError={(event) => {
                  if (event.currentTarget.dataset.fallbackApplied === 'true') return;
                  event.currentTarget.dataset.fallbackApplied = 'true';
                  event.currentTarget.src = PROJECTS_FALLBACK_IMAGE;
                }}
              />
            </div>

            <p className="text-center mt-4 text-wg-black font-medium">
              {images[currentIndex]?.labelKey ? t(images[currentIndex]?.labelKey) : ''}
            </p>

            <div className="flex justify-center gap-2 mt-3">
              {images.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === currentIndex ? "bg-wg-orange" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-6 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        >
          <ChevronRight className="w-8 h-8 text-white" />
        </button>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const PhotoGallery = ({
  projects = galleryProjects,
  title,
}) => {
  const { t } = useTranslation();
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [allImages, setAllImages] = useState([]);
  const resolvedProjects = resolvePhotoGalleryProjects(projects);

  const openLightbox = (projectImages, imageIndex) => {
    setAllImages(projectImages);
    setLightboxIndex(imageIndex);
    setShowLightbox(true);
  };

  const closeLightbox = () => {
    setShowLightbox(false);
  };

  const prevImage = () => {
    setLightboxIndex(
      (prev) => (prev - 1 + allImages.length) % allImages.length
    );
  };

  const nextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % allImages.length);
  };

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showLightbox) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showLightbox, allImages.length]);

  return (
    <section className="section-padding bg-wg-gray-light">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-wg-orange font-medium text-sm tracking-widest uppercase mb-4 block">
            {t('photoGallery.kicker')}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-inter font-light text-wg-black mb-4 normal-case tracking-tight">
            {title || t('photoGallery.title')}
          </h2>
          <p className="text-lg text-wg-gray max-w-2xl mx-auto font-light">
            {t('photoGallery.subtitle')}
          </p>
        </motion.div>

        <div className="space-y-16">
          {resolvedProjects.map((project, projectIndex) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: projectIndex * 0.1 }}
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-wg-orange/30 to-transparent" />
                <div className="text-center">
                  <h3 className="text-2xl font-inter font-medium text-wg-black normal-case tracking-tight">
                    {project.titleKey ? t(project.titleKey) : ''}
                  </h3>
                  <p className="text-sm text-wg-gray mt-1">
                    {project.categoryKey ? t(project.categoryKey) : ''}
                  </p>
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-wg-orange/30 to-transparent" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {project.images.map((image, imageIndex) => (
                  <PhotoFrame
                    key={imageIndex}
                    image={image}
                    project={project}
                    index={imageIndex}
                    onClick={() => openLightbox(project.images, imageIndex)}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {showLightbox && (
          <LightboxModal
            images={allImages}
            currentIndex={lightboxIndex}
            onClose={closeLightbox}
            onPrev={prevImage}
            onNext={nextImage}
          />
        )}
      </div>
    </section>
  );
};

export default PhotoGallery;
