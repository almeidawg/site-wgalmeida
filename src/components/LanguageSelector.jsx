import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from '@/lib/motion-lite';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { normalizeLanguageTag } from '@/i18n';

const languages = [
  { code: 'pt-BR', name: 'Português', flag: '🇧🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' }
];

const LanguageSelector = ({ variant = 'default' }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const activeLanguageCode = normalizeLanguageTag(i18n.resolvedLanguage || i18n.language);

  const currentLanguage = languages.find((lang) => lang.code === activeLanguageCode) || languages[0];

  const changeLanguage = async (langCode) => {
    const nextLanguage = normalizeLanguageTag(langCode);
    await i18n.changeLanguage(nextLanguage);
    setIsOpen(false);

    // React-i18next neste projeto nao recompõe toda a arvore com consistencia
    // em todas as rotas; forçar reload preserva o idioma selecionado e evita
    // header/blog mistos apos a troca.
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  // Variante compacta para mobile
  if (variant === 'compact') {
    return (
      <div className="flex gap-2">
        {languages.map((lang) => (
          <button
            type="button"
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
              activeLanguageCode === lang.code
                ? 'bg-wg-orange text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
            title={lang.name}
            aria-label={`Selecionar idioma: ${lang.name}`}
          >
            {lang.flag}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
          variant === 'navbar'
            ? 'text-white/80 hover:text-white hover:bg-white/10'
            : 'text-wg-gray hover:text-wg-black hover:bg-gray-100'
        }`}
        aria-label={`Idioma atual: ${currentLanguage.name}. Abrir seletor de idioma`}
        aria-expanded={isOpen}
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium hidden sm:inline">{currentLanguage.flag}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay para fechar ao clicar fora */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50"
            >
              {languages.map((lang) => (
                <button
                type="button"
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    activeLanguageCode === lang.code
                      ? 'bg-wg-orange/10 text-wg-orange'
                      : 'hover:bg-gray-50 text-wg-gray'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="text-sm font-medium flex-1">{lang.name}</span>
                  {activeLanguageCode === lang.code && (
                    <Check className="w-4 h-4 text-wg-orange" />
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSelector;
