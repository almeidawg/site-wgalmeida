import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion-lite';
import { ArrowLeft, ArrowRight, X, Instagram, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Posts do Instagram - códigos reais do @grupowgalmeida
// Para adicionar novos: abrir post no Instagram > copiar URL > pegar o código após /p/ ou /reel/
const instagramPosts = [
  { id: 1, code: 'DQq6gjlkX2R', type: 'p' },
  { id: 2, code: 'DQq6XsPEUa1', type: 'p' },
  { id: 3, code: 'DQq6WXFkf0h', type: 'p' },
  { id: 4, code: 'DQn0C2bjLWn', type: 'p' },
  { id: 5, code: 'DQn0BU8DLdd', type: 'p' },
  { id: 6, code: 'DQnz_PRDFcB', type: 'p' },
  { id: 7, code: 'DQnz7IODL8m', type: 'p' },
  { id: 8, code: 'DQnz41OjMvx', type: 'p' },
  { id: 9, code: 'DQnz1hTDM6Y', type: 'p' },
  { id: 10, code: 'C_Ovy8PCcQ-', type: 'reel' },
  { id: 11, code: 'Cthl8uZsiip', type: 'reel' },
  { id: 12, code: 'Ct-LaJdLgHH', type: 'reel' },
];

// Gerar URL da imagem do Instagram (thumbnail)
const getInstagramImageUrl = (post) => {
  return `https://www.instagram.com/p/${post.code}/media/?size=l`;
};

// Gerar URL do post
const getInstagramPostUrl = (post) => {
  const type = post.type || 'p';
  return `https://www.instagram.com/${type}/${post.code}/`;
};

const CARDS_PER_VIEW = 4;

const InstagramGallery = () => {
  const { t } = useTranslation();
  const [startIndex, setStartIndex] = useState(0);
  const [selectedPost, setSelectedPost] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [imageErrors, setImageErrors] = useState({});

  // Quantidade máxima de slides
  const maxIndex = Math.max(0, instagramPosts.length - CARDS_PER_VIEW);

  const handlePrev = () => {
    setStartIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setStartIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  // Suporte a touch/swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  // Fechar modal com ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedPost(null);
      }
    };

    if (selectedPost) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [selectedPost]);

  // Posts visíveis atualmente
  const visiblePosts = instagramPosts.slice(startIndex, startIndex + CARDS_PER_VIEW);

  // Fallback image handler
  const handleImageError = (postId) => {
    setImageErrors(prev => ({ ...prev, [postId]: true }));
  };

  return (
    <>
      <section className="section-padding bg-white">
        <div className="container-custom">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-wg-apple-muted flex items-center gap-2">
                <Instagram className="w-4 h-4" />
                {t('instagramGallery.kicker')}
              </p>
              <h2 className="text-3xl font-oswald text-wg-apple-accent">
                @grupowgalmeida
              </h2>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handlePrev}
                disabled={startIndex === 0}
                className={`rounded-full border border-wg-apple-highlight bg-white p-3 transition hover:border-wg-apple-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-wg-apple-accent ${
                  startIndex === 0 ? 'opacity-40 cursor-not-allowed' : ''
                }`}
                aria-label={t('instagramGallery.previous')}
              >
                <ArrowLeft className="h-5 w-5 text-wg-apple-accent" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={startIndex >= maxIndex}
                className={`rounded-full border border-wg-apple-highlight bg-white p-3 transition hover:border-wg-apple-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-wg-apple-accent ${
                  startIndex >= maxIndex ? 'opacity-40 cursor-not-allowed' : ''
                }`}
                aria-label={t('instagramGallery.next')}
              >
                <ArrowRight className="h-5 w-5 text-wg-apple-accent" />
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {visiblePosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="relative aspect-square overflow-hidden rounded-2xl cursor-pointer group bg-gray-100"
                onClick={() => setSelectedPost(post)}
              >
                {!imageErrors[post.id] ? (
                  <img
                    src={getInstagramImageUrl(post)}
                    alt={t('instagramGallery.postAlt', { id: post.id })}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    width={400}
                    height={400}
                    loading="lazy"
                    decoding="async"
                    onError={() => handleImageError(post.id)}
                  />
                ) : (
                  // Fallback - mostrar placeholder com link para o post
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 text-white p-4">
                    <Instagram className="w-12 h-12 mb-2" />
                    <span className="text-sm font-medium text-center">{t('instagramGallery.viewOnInstagram')}</span>
                  </div>
                )}
                {/* Overlay no hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {/* Ícone de zoom */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                    <svg
                      className="w-6 h-6 text-wg-apple-accent"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                      />
                    </svg>
                  </div>
                </div>
                {/* Instagram icon no canto */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Instagram className="w-5 h-5 text-white drop-shadow-lg" />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Indicadores de página */}
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setStartIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === startIndex
                    ? 'bg-wg-apple-accent w-8'
                    : 'bg-wg-apple-highlight/50 w-2 hover:bg-wg-apple-highlight'
                }`}
                aria-label={t('instagramGallery.goToPage', { page: idx + 1 })}
              />
            ))}
          </div>

          {/* Link para Instagram */}
          <div className="text-center mt-8">
            <a
              href="https://www.instagram.com/grupowgalmeida"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-wg-apple-accent hover:text-wg-orange transition-colors font-medium"
            >
              <Instagram className="w-5 h-5" />
              {t('instagramGallery.viewMore')}
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Modal de Zoom com Embed do Instagram */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={() => setSelectedPost(null)}
          >
            {/* Botão fechar */}
            <button
              type="button"
              onClick={() => setSelectedPost(null)}
              className="absolute top-4 right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label={t('instagramGallery.close')}
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Navegação esquerda no modal */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const currentIdx = instagramPosts.findIndex(p => p.id === selectedPost.id);
                const prevIdx = (currentIdx - 1 + instagramPosts.length) % instagramPosts.length;
                setSelectedPost(instagramPosts[prevIdx]);
              }}
              className="absolute left-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label={t('instagramGallery.previousPhoto')}
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>

            {/* Navegação direita no modal */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const currentIdx = instagramPosts.findIndex(p => p.id === selectedPost.id);
                const nextIdx = (currentIdx + 1) % instagramPosts.length;
                setSelectedPost(instagramPosts[nextIdx]);
              }}
              className="absolute right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label={t('instagramGallery.nextPhoto')}
            >
              <ArrowRight className="w-6 h-6 text-white" />
            </button>

            {/* Conteúdo do modal */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative max-w-3xl max-h-[85vh] w-full bg-white rounded-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Imagem ampliada */}
              <div className="relative aspect-square bg-gray-100">
                {!imageErrors[selectedPost.id] ? (
                  <img
                    src={getInstagramImageUrl(selectedPost)}
                    alt={t('instagramGallery.postAlt', { id: selectedPost.id })}
                    className="w-full h-full object-contain"
                    width={800}
                    height={800}
                    loading="lazy"
                    decoding="async"
                    onError={() => handleImageError(selectedPost.id)}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 text-white">
                    <Instagram className="w-16 h-16 mb-4" />
                    <span className="text-lg font-medium">{t('instagramGallery.openOnInstagram')}</span>
                  </div>
                )}
              </div>

              {/* Footer do modal */}
              <div className="p-4 bg-white border-t flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                    <Instagram className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">@grupowgalmeida</p>
                    <p className="text-sm text-gray-600">Grupo WG Almeida</p>
                  </div>
                </div>
                <a
                  href={getInstagramPostUrl(selectedPost)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  <ExternalLink className="w-4 h-4" />
                  {t('instagramGallery.viewOnInstagram')}
                </a>
              </div>
            </motion.div>

            {/* Contador de fotos */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
              {instagramPosts.findIndex(p => p.id === selectedPost.id) + 1} / {instagramPosts.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default InstagramGallery;
