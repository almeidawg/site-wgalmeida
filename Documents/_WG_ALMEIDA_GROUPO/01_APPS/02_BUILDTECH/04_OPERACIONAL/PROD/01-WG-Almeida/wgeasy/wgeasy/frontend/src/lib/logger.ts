// ============================================================
// LOGGER SEGURO - Substitui console.log em produçÍo
// Só exibe logs em ambiente de desenvolvimento
// ============================================================

const IS_DEV = import.meta.env.DEV || import.meta.env.MODE === "development";
const LOG_LEVEL =
  import.meta.env.VITE_LOG_LEVEL || (IS_DEV ? "debug" : "error");

type LogLevel = "debug" | "info" | "warn" | "error" | "none";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4,
};

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[LOG_LEVEL as LogLevel];
}

/**
 * Logger seguro que não exibe logs em produçÍo
 */
export const logger = {
  /**
   * Log de debug - apenas em desenvolvimento
   */
  debug: (...args: unknown[]) => {
    if (shouldLog("debug")) {
      console.log("[DEBUG]", ...args);
    }
  },

  /**
   * Log de informaçÍo
   */
  info: (...args: unknown[]) => {
    if (shouldLog("info")) {
      console.info("[INFO]", ...args);
    }
  },

  /**
   * Log de aviso
   */
  warn: (...args: unknown[]) => {
    if (shouldLog("warn")) {
      console.warn("[WARN]", ...args);
    }
  },

  /**
   * Log de erro - sempre exibido
   */
  error: (...args: unknown[]) => {
    if (shouldLog("error")) {
      console.error("[ERROR]", ...args);
    }
  },

  /**
   * Log com contexto de componente
   */
  component: (componentName: string, action: string, data?: unknown) => {
    if (shouldLog("debug")) {
      console.log(`[${componentName}] ${action}`, data || "");
    }
  },

  /**
   * Log de API calls
   */
  api: (method: string, url: string, data?: unknown) => {
    if (shouldLog("debug")) {
      console.log(`[API] ${method} ${url}`, data || "");
    }
  },

  /**
   * Log de performance
   */
  perf: (label: string, startTime: number) => {
    if (shouldLog("debug")) {
      const duration = Date.now() - startTime;
      console.log(`[PERF] ${label}: ${duration}ms`);
    }
  },
};

/**
 * Desativa console.log em produçÍo
 * Chame esta funçÍo no início do app
 */
export function disableConsoleInProduction(): void {
  if (!IS_DEV) {
    console.log = () => {};
    console.debug = () => {};
    console.info = () => {};
    // Mantém warn e error para diagnóstico
  }
}

export default logger;


