import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from '@/lib/motion-lite';
import { ArrowLeft, ArrowRight, X, ZoomIn, Instagram } from "lucide-react";
import { LazyImage, OptimizedImage } from "./OptimizedImage";
import { useTranslation } from 'react-i18next';

// Galeria de fotos dos projetos WG Almeida - Organizadas por projeto
const galleryImages = [
  // Brooklin - ARQ + ENG + MARC
  {
    id: 1,
    src: "/images/imagens/ARQ-ENG-MARC-BOORKLIN (1).webp",
    titleKey: "projectGallery.titles.apartmentBrooklin",
    categoryKey: "projectGallery.categories.integratedLiving",
  },
  {
    id: 2,
    src: "/images/imagens/ARQ-ENG-MARC-BOORKLIN (2).webp",
    titleKey: "projectGallery.titles.apartmentBrooklin",
    categoryKey: "projectGallery.categories.livingRoom",
  },
  {
    id: 3,
    src: "/images/imagens/ARQ-ENG-MARC-BOORKLIN (3).webp",
    titleKey: "projectGallery.titles.apartmentBrooklin",
    categoryKey: "projectGallery.categories.kitchen",
  },
  {
    id: 4,
    src: "/images/imagens/ARQ-ENG-MARC-BOORKLIN (4).webp",
    titleKey: "projectGallery.titles.apartmentBrooklin",
    categoryKey: "projectGallery.categories.suite",
  },
  // Corporativo Alphaville
  {
    id: 5,
    src: "/images/imagens/ARQ-ENG-MARC-CORPORATIVO- ALPHAVILLE (1).webp",
    titleKey: "projectGallery.titles.corporateAlphaville",
    categoryKey: "projectGallery.categories.reception",
  },
  {
    id: 6,
    src: "/images/imagens/ARQ-ENG-MARC-CORPORATIVO- ALPHAVILLE (2).webp",
    titleKey: "projectGallery.titles.corporateAlphaville",
    categoryKey: "projectGallery.categories.meetingRoom",
  },
  {
    id: 7,
    src: "/images/imagens/ARQ-ENG-MARC-CORPORATIVO- ALPHAVILLE (3).webp",
    titleKey: "projectGallery.titles.corporateAlphaville",
    categoryKey: "projectGallery.categories.office",
  },
  {
    id: 8,
    src: "/images/imagens/ARQ-ENG-MARC-CORPORATIVO- ALPHAVILLE (4).webp",
    titleKey: "projectGallery.titles.corporateAlphaville",
    categoryKey: "projectGallery.categories.workspace",
  },
  // Vila Nova Conceição
  {
    id: 9,
    src: "/images/imagens/ARQ-VILANOVACONCEICAO (1).webp",
    titleKey: "projectGallery.titles.vilaNovaConceicao",
    categoryKey: "projectGallery.categories.living",
  },
  {
    id: 10,
    src: "/images/imagens/ARQ-VILANOVACONCEICAO (2).webp",
    titleKey: "projectGallery.titles.vilaNovaConceicao",
    categoryKey: "projectGallery.categories.diningRoom",
  },
  {
    id: 11,
    src: "/images/imagens/ARQ-VILANOVACONCEICAO (3).webp",
    titleKey: "projectGallery.titles.vilaNovaConceicao",
    categoryKey: "projectGallery.categories.gourmetKitchen",
  },
  {
    id: 12,
    src: "/images/imagens/ARQ-VILANOVACONCEICAO (4).webp",
    titleKey: "projectGallery.titles.vilaNovaConceicao",
    categoryKey: "projectGallery.categories.masterSuite",
  },
  // Casa Home Resort Guarujá
  {
    id: 13,
    src: "/images/imagens/CASAHOMERESORT-ACAPULCO-GURARUJA (1).webp",
    titleKey: "projectGallery.titles.guarujaHome",
    categoryKey: "projectGallery.categories.facade",
  },
  {
    id: 14,
    src: "/images/imagens/CASAHOMERESORT-ACAPULCO-GURARUJA (2).webp",
    titleKey: "projectGallery.titles.guarujaHome",
    categoryKey: "projectGallery.categories.outdoorArea",
  },
  {
    id: 15,
    src: "/images/imagens/CASAHOMERESORT-ACAPULCO-GURARUJA (3).webp",
    titleKey: "projectGallery.titles.guarujaHome",
    categoryKey: "projectGallery.categories.pool",
  },
  {
    id: 16,
    src: "/images/imagens/CASAHOMERESORT-ACAPULCO-GURARUJA (4).webp",
    titleKey: "projectGallery.titles.guarujaHome",
    categoryKey: "projectGallery.categories.living",
  },
  // Condomínio Porta do Sol
  {
    id: 17,
    src: "/images/imagens/ARQ-COND-POTADOSOL-MARINQUE (2).webp",
    titleKey: "projectGallery.titles.portaDoSol",
    categoryKey: "projectGallery.categories.facade",
  },
  {
    id: 18,
    src: "/images/imagens/ARQ-COND-POTADOSOL-MARINQUE (3).webp",
    titleKey: "projectGallery.titles.portaDoSol",
    categoryKey: "projectGallery.categories.commonArea",
  },
  {
    id: 19,
    src: "/images/imagens/ARQ-COND-POTADOSOL-MARINQUE (4).webp",
    titleKey: "projectGallery.titles.portaDoSol",
    categoryKey: "projectGallery.categories.leisure",
  },
  {
    id: 20,
    src: "/images/imagens/ARQ-COND-POTADOSOL-MARINQUE (5).webp",
    titleKey: "projectGallery.titles.portaDoSol",
    categoryKey: "projectGallery.categories.landscaping",
  },
];

const CARDS_PER_VIEW = 4;

const ProjectGallery = () => {
  const { t } = useTranslation();
  const [startIndex, setStartIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const intervalRef = useRef(null);

  const maxIndex = Math.max(0, galleryImages.length - CARDS_PER_VIEW);

  // Auto-play carousel
  useEffect(() => {
    if (isAutoPlaying) {
      intervalRef.current = setInterval(() => {
        setStartIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
      }, 4000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isAutoPlaying, maxIndex]);

  const handlePrev = () => {
    setIsAutoPlaying(false);
    setStartIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setStartIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  // Fechar modal com ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setSelectedImage(null);
      if (e.key === "ArrowLeft" && selectedImage) {
        const currentIdx = galleryImages.findIndex(
          (img) => img.id === selectedImage.id
        );
        const prevIdx =
          (currentIdx - 1 + galleryImages.length) % galleryImages.length;
        setSelectedImage(galleryImages[prevIdx]);
      }
      if (e.key === "ArrowRight" && selectedImage) {
        const currentIdx = galleryImages.findIndex(
          (img) => img.id === selectedImage.id
        );
        const nextIdx = (currentIdx + 1) % galleryImages.length;
        setSelectedImage(galleryImages[nextIdx]);
      }
    };

    if (selectedImage) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [selectedImage]);

  const visibleImages = galleryImages.slice(
    startIndex,
    startIndex + CARDS_PER_VIEW
  );

  return (
    <>
      <section className="section-padding bg-white">
        <div className="container-custom">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-wg-gray flex items-center gap-2">
                <Instagram className="w-4 h-4" />
                {t('projectGallery.kicker')}
              </p>
              <h2 className="text-3xl font-oswald text-wg-black">
                @grupowgalmeida
              </h2>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handlePrev}
                disabled={startIndex === 0}
                className={`rounded-full border border-gray-200 bg-white p-3 transition hover:border-wg-orange focus:outline-none ${
                  startIndex === 0 ? "opacity-40 cursor-not-allowed" : ""
                }`}
                aria-label={t('projectGallery.previous')}
              >
                <ArrowLeft className="h-5 w-5 text-wg-black" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={startIndex >= maxIndex}
                className={`rounded-full border border-gray-200 bg-white p-3 transition hover:border-wg-orange focus:outline-none ${
                  startIndex >= maxIndex ? "opacity-40 cursor-not-allowed" : ""
                }`}
                aria-label={t('projectGallery.next')}
              >
                <ArrowRight className="h-5 w-5 text-wg-black" />
              </button>
            </div>
          </div>

          {/* Cards Grid com moldura elegante */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {visibleImages.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="relative aspect-square overflow-hidden rounded-2xl cursor-pointer group"
                onClick={() => setSelectedImage(image)}
              >
                {/* Moldura elegante */}
                <div className="absolute inset-0 border-4 border-white/20 rounded-2xl z-10 pointer-events-none group-hover:border-wg-orange/40 transition-colors duration-300" />

                <LazyImage
                  src={image.src}
                  alt={`${t(image.titleKey)} - ${t(image.categoryKey)}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  width={400}
                  height={400}
                />

                {/* Overlay no hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Info no hover */}
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-white font-medium text-sm">
                    {t(image.titleKey)}
                  </p>
                  <p className="text-white/70 text-xs">{t(image.categoryKey)}</p>
                </div>

                {/* Ícone de zoom */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                    <ZoomIn className="w-5 h-5 text-wg-orange" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Indicadores de página - Otimizados para touch (min 44x44px) e animações compostas */}
          <div className="flex justify-center gap-3 mt-6">
            {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setIsAutoPlaying(false);
                  setStartIndex(idx);
                }}
                className={`relative h-11 w-11 flex items-center justify-center rounded-full transition-transform duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-wg-orange focus:ring-offset-2`}
                aria-label={t('projectGallery.goToPage', { page: idx + 1 })}
                aria-current={idx === startIndex ? "true" : undefined}
              >
                {/* Indicador visual interno - usa transform/opacity para animações compostas */}
                <span
                  className={`block rounded-full transition-all duration-300 ${
                    idx === startIndex
                      ? "bg-wg-orange w-6 h-3"
                      : "bg-gray-300 w-3 h-3 hover:bg-gray-400"
                  }`}
                  style={{
                    transform: idx === startIndex ? 'scaleX(2)' : 'scaleX(1)',
                    transition: 'transform 300ms ease, opacity 300ms ease'
                  }}
                />
              </button>
            ))}
          </div>

          {/* Link para Instagram */}
          <div className="text-center mt-8">
            <a
              href="https://www.instagram.com/grupowgalmeida"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-wg-black hover:text-wg-orange transition-colors font-medium"
            >
              <Instagram className="w-5 h-5" />
              {t('projectGallery.viewInstagram')}
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Modal de Zoom */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
            onClick={() => setSelectedImage(null)}
          >
            {/* Botão fechar */}
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label={t('projectGallery.close')}
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Navegação */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const currentIdx = galleryImages.findIndex(
                  (img) => img.id === selectedImage.id
                );
                const prevIdx =
                  (currentIdx - 1 + galleryImages.length) %
                  galleryImages.length;
                setSelectedImage(galleryImages[prevIdx]);
              }}
              className="absolute left-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label={t('projectGallery.previousPhoto')}
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const currentIdx = galleryImages.findIndex(
                  (img) => img.id === selectedImage.id
                );
                const nextIdx = (currentIdx + 1) % galleryImages.length;
                setSelectedImage(galleryImages[nextIdx]);
              }}
              className="absolute right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label={t('projectGallery.nextPhoto')}
            >
              <ArrowRight className="w-6 h-6 text-white" />
            </button>

            {/* Imagem */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative max-w-5xl max-h-[85vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage.src}
                alt={`${t(selectedImage.titleKey)} - ${t(selectedImage.categoryKey)}`}
                className="w-full h-full object-contain rounded-lg"
                width={1280}
                height={720}
                loading="lazy"
                decoding="async"
              />

              {/* Info */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg">
                <p className="text-white text-xl font-medium">
                  {t(selectedImage.titleKey)}
                </p>
                <p className="text-white/70">{t(selectedImage.categoryKey)}</p>
              </div>
            </motion.div>

            {/* Contador */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
              {galleryImages.findIndex((img) => img.id === selectedImage.id) +
                1}{" "}
              / {galleryImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ProjectGallery;
