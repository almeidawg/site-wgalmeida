// ============================================================
// SUPABASE CLIENT – WG EASY (Custom Wrapper)
// Este cliente adiciona:
// - Tratamento de erros
// - Logs de auditoria
// - Retry automático
// - Timeout
// - Identidade WG Almeida via headers
// - Wrapper seguro para SELECT / INSERT / UPDATE / DELETE
// ============================================================

import { createClient, PostgrestError } from "@supabase/supabase-js";

// ------------------------------------------------------------
// CONFIGURAÇÍO BASE (usa o mesmo supabaseUrl e anonKey do projeto)
// ------------------------------------------------------------

// Detecta ambiente: Vite (browser) ou Node.js
function getEnvVar(key: string, fallback?: string): string | undefined {
  // If running under Jest, always use process.env
  if (typeof process !== "undefined" && process.env && (process.env.JEST_WORKER_ID || process.env.NODE_ENV === 'test')) {
    return process.env[key] || fallback;
  }
  // Vite
  if (typeof import.meta !== "undefined" && import.meta.env && key in import.meta.env) {
    return import.meta.env[key] || fallback;
  }
  // Node.js
  if (typeof process !== "undefined" && process.env && key in process.env) {
    return process.env[key] || fallback;
  }
  return fallback;
}

export const supabaseUrl =
  getEnvVar("VITE_SUPABASE_URL", "https://ahlqzzkxuutwoepirpzr.supabase.co") || "https://ahlqzzkxuutwoepirpzr.supabase.co";
const supabaseAnon = getEnvVar("VITE_SUPABASE_ANON_KEY");

if (!supabaseAnon) {
  throw new Error(
    [
      "VITE_SUPABASE_ANON_KEY não foi definido.",
      "Crie ou atualize o arquivo .env com a chave pública do Supabase:",
      'VITE_SUPABASE_ANON_KEY="sua-chave-publica"',
      "Em seguida reinicie o servidor (npm run dev ou npm run test).",
    ].join(" ")
  );
}

if (!supabaseUrl) {
  console.warn(
    "VITE_SUPABASE_URL não definido — usando fallback. Verifique variáveis de ambiente."
  );
}

export const supabaseRaw = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // Detecta token OAuth na URL automaticamente
    flowType: "pkce", // PKCE é mais seguro que implicit (tokens não vazam na URL)
  },
  global: {
    headers: {
      "X-WG-App": "WGEASY",
      "X-WG-Version": "1.0.0",
    },
  },
});

// Alias para compatibilidade com imports existentes
export const supabase = supabaseRaw;

// ------------------------------------------------------------
// TIMEOUT — garante que requisições travadas nunca bloqueiem a UI
// ------------------------------------------------------------
function promiseWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 8000
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error("Request timeout")), timeoutMs);
  });
  return Promise.race([
    promise.finally(() => clearTimeout(timeout)),
    timeoutPromise,
  ]);
}

// ------------------------------------------------------------
// RETRY INTELIGENTE (3 tentativas, delay progressivo)
// ------------------------------------------------------------
async function retry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 300
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries === 0) throw err;
    await new Promise((r) => setTimeout(r, delay));
    return retry(fn, retries - 1, delay * 1.5);
  }
}

// ------------------------------------------------------------
// HANDLER DE ERROS – PadrÍo WG
// ------------------------------------------------------------
function handleError(error: PostgrestError | null, context: string) {
  if (error) {
    console.error(
      `%c❌ SUPABASE ERROR (${context})`,
      "background:#ff2d2d;color:white;padding:4px;",
      error
    );
    throw new Error(error.message || "Erro desconhecido");
  }
}

// ------------------------------------------------------------
// WRAPPERS SEGUROS – SELECT / INSERT / UPDATE / DELETE
// ------------------------------------------------------------

// Type for Supabase query result
interface QueryResult<T> {
  data: T | null;
  error: PostgrestError | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PostgrestBuilder = Record<string, any>;

export const db = {
  async select<T = Record<string, unknown>>(
    table: string,
    columns: string = "*",
    query?: (builder: PostgrestBuilder) => PostgrestBuilder
  ): Promise<T[]> {
    return retry(async () => {
      const builder = supabaseRaw.from(table).select(columns);

      const rq = query ? query(builder) : builder;
      const result = await promiseWithTimeout<QueryResult<T[]>>(rq as Promise<QueryResult<T[]>>);
      const { data, error } = result;

      handleError(error, `SELECT -> ${table}`);
      return data as T[];
    });
  },

  async selectOne<T = Record<string, unknown>>(
    table: string,
    columns: string = "*",
    query?: (builder: PostgrestBuilder) => PostgrestBuilder
  ): Promise<T | null> {
    return retry(async () => {
      const builder = supabaseRaw.from(table).select(columns).single();

      const rq = query ? query(builder) : builder;
      const result = await promiseWithTimeout<QueryResult<T>>(rq as Promise<QueryResult<T>>);
      const { data, error } = result;

      handleError(error, `SELECT ONE -> ${table}`);
      return data as T;
    });
  },

  async insert<T = Record<string, unknown>>(table: string, payload: Record<string, unknown> | Record<string, unknown>[]): Promise<T[]> {
    return retry(async () => {
      const result = await promiseWithTimeout<QueryResult<T[]>>(
        supabaseRaw.from(table).insert(payload).select() as unknown as Promise<QueryResult<T[]>>
      );
      const { data, error } = result;

      handleError(error, `INSERT -> ${table}`);
      return data as T[];
    });
  },

  async update<T = Record<string, unknown>>(
    table: string,
    payload: Record<string, unknown>,
    query: (builder: PostgrestBuilder) => PostgrestBuilder
  ): Promise<T[]> {
    return retry(async () => {
      const builder = supabaseRaw.from(table).update(payload);

      const rq = query(builder).select();
      const result = await promiseWithTimeout<QueryResult<T[]>>(rq as Promise<QueryResult<T[]>>);
      const { data, error } = result;

      handleError(error, `UPDATE -> ${table}`);
      return data as T[];
    });
  },

  async remove(table: string, query: (builder: PostgrestBuilder) => PostgrestBuilder): Promise<boolean> {
    return retry(async () => {
      const builder = supabaseRaw.from(table).delete();
      const rq = query(builder);

      const result = await promiseWithTimeout<QueryResult<null>>(rq as Promise<QueryResult<null>>);
      const { error } = result;
      handleError(error, `DELETE -> ${table}`);

      return true;
    });
  },
};

// ------------------------------------------------------------
// APA da AutenticaçÍo
// ------------------------------------------------------------
export const auth = {
  session: () => supabaseRaw.auth.getSession(),
  user: () => supabaseRaw.auth.getUser(),
  login: (email: string, pass: string) =>
    supabaseRaw.auth.signInWithPassword({ email, password: pass }),
  logout: () => supabaseRaw.auth.signOut(),
};

// ------------------------------------------------------------
// Auditoria WG — loga tudo no console (área Dev)
// ------------------------------------------------------------
export function logWG(...params: unknown[]) {
  console.log(
    "%cWG LOG",
    "background:#000;color:#F25C26;padding:4px",
    ...params
  );
}


