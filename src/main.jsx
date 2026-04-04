import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from '@/App';
import '@/index.css';
import '@/i18n'; // Internacionalizacao
import { Toaster } from '@/components/ui/toaster';
import { CartProvider } from '@/hooks/useCart';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Erro inesperado' };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, sans-serif' }}>
          <div style={{ maxWidth: 680 }}>
            <h1 style={{ marginBottom: 12, fontSize: 24 }}>Falha ao carregar a aplicação</h1>
            <p style={{ marginBottom: 12, color: '#4C4C4C' }}>Atualize a página com Ctrl+F5. Se persistir, me envie essa mensagem:</p>
            <pre style={{ whiteSpace: 'pre-wrap', background: '#f3f3f3', padding: 12, borderRadius: 8 }}>{this.state.message}</pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Web Vitals - Monitoramento de Performance
const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then((metrics) => {
      ['onCLS', 'onFCP', 'onLCP', 'onTTFB', 'onINP', 'onFID'].forEach((fnName) => {
        if (typeof metrics?.[fnName] === 'function') {
          metrics[fnName](onPerfEntry);
        }
      });
    });
  }
};

// Função para enviar métricas para o Analytics
const sendToAnalytics = (metric) => {
  const { name, delta, id, value } = metric;
  
  // Envia para o dataLayer (GTM)
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'web_vitals',
    event_category: 'Web Vitals',
    event_label: id,
    value: Math.round(name === 'CLS' ? value * 1000 : value),
    metric_name: name,
    metric_id: id,
    metric_value: value,
    metric_delta: delta,
    non_interaction: true,
  });

  if (import.meta.env.DEV) {
    console.log(`[Web Vitals] ${name}: ${value.toFixed(2)} (ID: ${id})`);
  }
};

// Ativar monitoramento em todos os ambientes (envio condicional via GTM)
reportWebVitals(sendToAnalytics);

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
  <AppErrorBoundary>
    <HelmetProvider>
      <BrowserRouter>
          <CartProvider>
            <App />
            <Toaster />
          </CartProvider>
      </BrowserRouter>
    </HelmetProvider>
  </AppErrorBoundary>
);

// Renderizacao SPA consistente (evita mismatch com fallback SEO estatico no HTML)
if (rootElement.hasChildNodes()) {
  rootElement.innerHTML = '';
}
ReactDOM.createRoot(rootElement).render(app);






