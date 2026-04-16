import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ptBR from './locales/pt-BR.json';
import en from './locales/en.json';
import es from './locales/es.json';

export const SUPPORTED_LANGUAGES = ['pt-BR', 'en', 'es'];

export function normalizeLanguageTag(lng) {
  if (!lng) return 'pt-BR';

  const normalized = String(lng).trim();
  if (!normalized) return 'pt-BR';
  if (normalized.toLowerCase().startsWith('pt')) return 'pt-BR';

  const base = normalized.split('-')[0].toLowerCase();
  if (base === 'en' || base === 'es') return base;

  return 'pt-BR';
}

function decorateWithFlatKeys(bundle, prefix = '', flatEntries = {}) {
  if (!bundle || typeof bundle !== 'object') {
    if (prefix) {
      flatEntries[prefix] = bundle;
    }
    return flatEntries;
  }

  if (prefix) {
    flatEntries[prefix] = bundle;
  }

  Object.entries(bundle).forEach(([key, value]) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object') {
      decorateWithFlatKeys(value, nextPrefix, flatEntries);
    } else {
      flatEntries[nextPrefix] = value;
    }
  });

  return {
    ...bundle,
    ...flatEntries,
  };
}

const resources = {
  'pt-BR': { translation: decorateWithFlatKeys(ptBR) },
  en: { translation: decorateWithFlatKeys(en) },
  es: { translation: decorateWithFlatKeys(es) },
};

const i18n = createInstance();

// Resolve any locale key to its base bundle key
function resolveKey(lng) {
  return normalizeLanguageTag(lng);
}

async function ensureBundle(lng) {
  const key = resolveKey(lng);
  if (i18n.hasResourceBundle(key, 'translation')) return;
}

function resolveTranslationValue(key, options = {}) {
  if (typeof key !== 'string' || !key) return undefined;

  const requestedLanguage = normalizeLanguageTag(options.lng || i18n.resolvedLanguage || i18n.language);
  const candidates = [...new Set([requestedLanguage, 'pt-BR'])];

  for (const lng of candidates) {
    const value = i18n.getResource(lng, 'translation', key);
    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
}

function patchedTranslate(key, options = {}) {
  const normalizedOptions = options && typeof options === 'object' ? options : {};
  const resolvedValue = resolveTranslationValue(key, normalizedOptions);

  if (resolvedValue === undefined) {
    return normalizedOptions.defaultValue ?? key;
  }

  if (normalizedOptions.returnObjects || typeof resolvedValue !== 'string') {
    return resolvedValue;
  }

  return i18n.services.interpolator.interpolate(
    resolvedValue,
    normalizedOptions,
    normalizeLanguageTag(normalizedOptions.lng || i18n.resolvedLanguage || i18n.language),
    normalizedOptions
  );
}

function patchedExists(key, options = {}) {
  return resolveTranslationValue(key, options) !== undefined;
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    ns: ['translation'],
    defaultNS: 'translation',
    keySeparator: false,
    nsSeparator: false,
    supportedLngs: SUPPORTED_LANGUAGES,
    nonExplicitSupportedLngs: true,
    load: 'currentOnly',
    fallbackLng: 'pt-BR',
    debug: false,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      convertDetectedLanguage: (lng) => normalizeLanguageTag(lng),
    },
    react: {
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'em', 'i', 'b', 'span', 'p', 'a', 'ul', 'li', 'ol']
    }
  });

i18n.t = patchedTranslate;
i18n.exists = patchedExists;

if (i18n.translator) {
  i18n.translator.translate = patchedTranslate;
  i18n.translator.exists = patchedExists;
}

// When language changes, ensure the bundle is loaded before rendering
i18n.on('languageChanged', (lng) => {
  const normalized = normalizeLanguageTag(lng);
  if (normalized !== lng) {
    i18n.changeLanguage(normalized);
    return;
  }

  ensureBundle(normalized);

  if (typeof document !== 'undefined') {
    document.documentElement.lang = normalized;
  }
});

// If localStorage already has a non-PT language, preload it now
const savedLng = typeof localStorage !== 'undefined' && localStorage.getItem('i18nextLng');
if (savedLng && resolveKey(savedLng) !== 'pt-BR') {
  ensureBundle(savedLng);
}

export default i18n;
