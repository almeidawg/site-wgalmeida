import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Only bundle the primary language synchronously (saves ~174 KB from initial bundle)
import ptBR from './locales/pt-BR.json';

const resources = {
  'pt-BR': { translation: ptBR },
};

// Lazy loaders for secondary languages (loaded on demand)
const lazyBundles = {
  en: () => import('./locales/en.json'),
  es: () => import('./locales/es.json'),
};

// Resolve any locale key to its base bundle key
function resolveKey(lng) {
  if (!lng) return 'pt-BR';
  if (lng.startsWith('pt')) return 'pt-BR';
  const base = lng.split('-')[0];
  return lazyBundles[base] ? base : 'pt-BR';
}

// Load a secondary language bundle on demand
async function ensureBundle(lng) {
  const key = resolveKey(lng);
  if (key === 'pt-BR') return; // already in initial bundle
  if (i18n.hasResourceBundle(key, 'translation')) return; // already loaded
  const loader = lazyBundles[key];
  if (!loader) return;
  try {
    const mod = await loader();
    i18n.addResourceBundle(key, 'translation', mod.default || mod, true, true);
  } catch (e) {
    console.warn('Failed to load language bundle:', key, e);
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt-BR',
    debug: false,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    },
    react: {
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'em', 'i', 'b', 'span', 'p', 'a', 'ul', 'li', 'ol']
    }
  });

// When language changes, ensure the bundle is loaded before rendering
i18n.on('languageChanged', (lng) => {
  ensureBundle(lng);
});

// If localStorage already has a non-PT language, preload it now
const savedLng = typeof localStorage !== 'undefined' && localStorage.getItem('i18nextLng');
if (savedLng && resolveKey(savedLng) !== 'pt-BR') {
  ensureBundle(savedLng);
}

export default i18n;
