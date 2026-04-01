import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary global — captura erros de render e exibe UI amigável
 * em vez de tela branca. Usar no App.tsx e em módulos críticos.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
    // Em produçÍo, enviar para serviço de monitoramento (ex: Sentry)
    if (import.meta.env.PROD) {
      console.error("[ErrorBoundary]", error.message, errorInfo.componentStack);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#FAFAFA] p-6">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </div>

            <div>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Algo deu errado
              </h1>
              <p className="text-sm text-gray-500">
                Ocorreu um erro inesperado. Nossa equipe foi notificada.
              </p>
              {import.meta.env.DEV && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                    Detalhes técnicos (dev)
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 rounded p-3 overflow-auto max-h-40 text-red-600">
                    {this.state.error.message}
                    {"\n\n"}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-[#d94f1f] transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar novamente
              </button>
              <button
                onClick={() => { window.location.href = "/"; }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <Home className="w-4 h-4" />
                Ir ao início
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

