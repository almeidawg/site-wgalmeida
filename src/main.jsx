import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Buffer } from 'buffer';
import App from '@/App';
import '@/index.css';
import '@/i18n'; // Internacionalizacao
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { CartProvider } from '@/hooks/useCart';

// Polyfill para Buffer (necessário para gray-matter no browser)
window.Buffer = Buffer;

// Web Vitals - Monitoramento de Performance
const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB, onINP }) => {
      onCLS(onPerfEntry);
      onFID(onPerfEntry);
      onFCP(onPerfEntry);
      onLCP(onPerfEntry);
      onTTFB(onPerfEntry);
      onINP(onPerfEntry);
    });
  }
};

// Reportar metricas em producao (pode integrar com analytics)
if (import.meta.env.PROD) {
  reportWebVitals((metric) => {
    // Log apenas em desenvolvimento ou enviar para analytics
    if (import.meta.env.DEV) {
      console.log(`[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)}`);
    }
  });
}

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        // SW registrado com sucesso
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nova versao disponivel - pode notificar usuario
              }
            });
          }
        });
      })
      .catch(() => {
        // Falha silenciosa - SW nao e critico
      });
  });
}

const rootElement = document.getElementById('root');

const app = (
  <HelmetProvider>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <App />
          <Toaster />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </HelmetProvider>
);

// Suporte para react-snap (pre-rendering)
if (rootElement.hasChildNodes()) {
  ReactDOM.hydrateRoot(rootElement, app);
} else {
  ReactDOM.createRoot(rootElement).render(app);
}