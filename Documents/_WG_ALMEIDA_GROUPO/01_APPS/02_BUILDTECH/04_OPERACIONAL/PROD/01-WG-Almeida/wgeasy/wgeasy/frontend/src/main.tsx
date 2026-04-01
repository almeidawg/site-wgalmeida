import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import App from "./App";
import { AuthProvider } from "@/auth/AuthContext";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { PreviewTipoUsuarioProvider } from "@/hooks/usePreviewTipoUsuario";
import { TenantProvider } from "@/hooks/useTenant";
import { UsuarioLogadoBootstrap } from "@/contexts/UsuarioLogadoBootstrap";
import { startWebVitalsMonitoring } from "@/utils/vitals";

// SEGURANÇA: Desativa console.log em produção
import { disableConsoleInProduction } from "@/lib/logger";
disableConsoleInProduction();

// SEGURANÇA: Valida variáveis de ambiente no startup
import { validateEnv } from "@/lib/envValidation";
validateEnv();

// Query Client setup (TanStack Query)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos padrÍo
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Sentry — monitoramento de erros em produção
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION || "1.0.0",
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    tracesSampleRate: 0.1, // 10% das transações
    replaysOnErrorSampleRate: 1.0, // 100% das sessões com erro
    beforeSend(event) {
      // Não enviar erros de usuário Não autenticado
      if (event.exception?.values?.[0]?.value?.includes("Não autenticado")) {
        return null;
      }
      return event;
    },
  });
}

// Utilitários para admin (disponíveis no console)
import { mesclarPessoas } from "@/lib/pessoasApi";

// Expor função de merge para uso no console do navegador
declare global {
  interface Window {
    mesclarPessoas: typeof mesclarPessoas;
  }
}
window.mesclarPessoas = mesclarPessoas;

// Tailwind
import "@/index.css";

// Estilos do sistema
import "@/styles/wg-system.css";
import "@/styles/wg-sidebar.css";
import "@/styles/wg-avatar.css";
import "@/styles/layout.css";
import "@/styles/touch-targets.css";

const root = document.getElementById("root")!;

async function bootstrap() {
  if (import.meta.env.DEV) {
    const [{ default: axe }, ReactDOMLegacy] = await Promise.all([
      import("@axe-core/react"),
      import("react-dom"),
    ]);
    axe(React, ReactDOMLegacy, 1000);
  }

  if (import.meta.env.PROD) {
    startWebVitalsMonitoring();
  }

  // Remove o loader inicial do HTML assim que o React montar
  document.getElementById("initial-loader")?.remove();

  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <UsuarioLogadoBootstrap>
              <TenantProvider>
                <PreviewTipoUsuarioProvider>
                  <App />
                </PreviewTipoUsuarioProvider>
              </TenantProvider>
            </UsuarioLogadoBootstrap>
          </AuthProvider>
        </ToastProvider>
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </React.StrictMode>
  );
}

void bootstrap();

