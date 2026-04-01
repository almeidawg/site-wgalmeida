// ============================================================
// VALIDAÇÍO DE VARIÁVEIS DE AMBIENTE
// Valida no startup se as VITE_* críticas estÍo definidas
// ============================================================

interface EnvVar {
  key: string;
  required: boolean;
  description: string;
}

const ENV_VARS: EnvVar[] = [
  { key: "VITE_SUPABASE_URL",     required: true,  description: "URL do projeto Supabase" },
  { key: "VITE_SUPABASE_ANON_KEY",required: true,  description: "Chave anon do Supabase" },
  { key: "VITE_BACKEND_URL",      required: false, description: "URL da API backend" },
  { key: "VITE_SENTRY_DSN",       required: false, description: "DSN do Sentry (monitoramento de erros)" },
  { key: "VITE_ASAAS_API_KEY",    required: false, description: "API Key do Asaas (pagamentos)" },
];

/**
 * Valida variáveis de ambiente críticas no startup.
 * Em DEV: exibe avisos no console.
 * Em PROD: lança erro se variável obrigatória ausente.
 */
export function validateEnv(): void {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const envVar of ENV_VARS) {
    const value = import.meta.env[envVar.key];
    if (!value || value.trim() === "") {
      if (envVar.required) {
        missing.push(`${envVar.key}: ${envVar.description}`);
      } else {
        warnings.push(`${envVar.key}: ${envVar.description}`);
      }
    }
  }

  if (warnings.length > 0 && import.meta.env.DEV) {
    console.warn(
      "[WGEasy] ⚠️ Variáveis opcionais não configuradas:\n" +
        warnings.map((w) => `  - ${w}`).join("\n")
    );
  }

  if (missing.length > 0) {
    const msg =
      "[WGEasy] ❌ Variáveis obrigatórias ausentes:\n" +
      missing.map((m) => `  - ${m}`).join("\n") +
      "\n\nConfigure no arquivo .env.local";

    if (import.meta.env.DEV) {
      console.error(msg);
    } else {
      throw new Error(msg);
    }
  }
}


