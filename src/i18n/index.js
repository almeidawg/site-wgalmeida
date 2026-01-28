import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importar traducoes
import ptBR from './locales/pt-BR.json';
import en from './locales/en.json';
import es from './locales/es.json';

const resources = {
  'pt-BR': { translation: ptBR },
  'en': { translation: en },
  'es': { translation: es }
};

// Custom language detector baseado em IP (geolocalização)
const ipLanguageDetector = {
  name: 'ipDetector',

  async: true,

  async detect(callback) {
    try {
      // Usa ipapi.co para detecção de país (gratuito, 30k requests/mês)
      const response = await fetch('https://ipapi.co/json/', {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        const countryCode = data.country_code; // Ex: 'BR', 'US', 'ES'

        // Mapeia país para idioma
        const languageMap = {
          'BR': 'pt-BR',
          'PT': 'pt-BR',
          'US': 'en',
          'GB': 'en',
          'CA': 'en',
          'AU': 'en',
          'ES': 'es',
          'MX': 'es',
          'AR': 'es',
          'CO': 'es',
          'CL': 'es'
        };

        const detectedLanguage = languageMap[countryCode] || 'pt-BR';
        callback(detectedLanguage);
      } else {
        callback('pt-BR'); // Fallback para português
      }
    } catch (error) {
      console.warn('IP language detection failed, using fallback', error);
      callback('pt-BR'); // Fallback para português
    }
  },

  cacheUserLanguage() {
    // Não precisamos cachear aqui, o localStorage já faz isso
  }
};

i18n
  .use({
    type: 'languageDetector',
    ...ipLanguageDetector
  })
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt-BR',
    debug: false,
    interpolation: {
      escapeValue: false
    },
    detection: {
      // Ordem de prioridade: localStorage > detecção IP > navegador > htmlTag
      order: ['localStorage', 'ipDetector', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    },
    react: {
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'em', 'i', 'b', 'span', 'p', 'a', 'ul', 'li', 'ol']
    }
  });

export default i18n;
