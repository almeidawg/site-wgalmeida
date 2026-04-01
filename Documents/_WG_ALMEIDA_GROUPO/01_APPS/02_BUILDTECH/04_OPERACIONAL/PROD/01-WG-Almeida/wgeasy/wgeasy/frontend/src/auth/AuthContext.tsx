import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
} from "react";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";

const AUDITORIA_RPC_TIMEOUT_MS = 4000;

function isErroTransitórioDeRede(error: unknown): boolean {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : String(error ?? "");

  const networkMarkers = [
    "Failed to fetch",
    "ERR_CONNECTION_TIMED_OUT",
    "NetworkError",
    "Load failed",
    "AbortError",
    "timeout",
  ];

  return networkMarkers.some((marker) => message.includes(marker));
}

// FunçÍo para registrar acesso ao sistema via RPC (com policies RLS adequadas)
async function registrarAcessoSistema(user: User) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    const rpcPromise = supabase.rpc("registrar_acesso_sistema", {
      p_email: user.email,
      p_user_agent: navigator.userAgent,
      p_acao: "login",
    });
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(
        () =>
          reject(
            new Error(
              `registrar_acesso_sistema timeout após ${AUDITORIA_RPC_TIMEOUT_MS}ms`
            )
          ),
        AUDITORIA_RPC_TIMEOUT_MS
      );
    });

    const { error } = await Promise.race([rpcPromise, timeoutPromise]);
    clearTimeout(timeoutId); // RPC venceu — limpa o timer órfÍo
    if (error) {
      // não bloquear login por falha de auditoria de acesso.
      if (isErroTransitórioDeRede(error)) return;
      console.warn("[Auth] Falha ao registrar acesso:", error.message);
    }
  } catch (error) {
    clearTimeout(timeoutId); // Timeout disparou ou erro — garante limpeza
    // Erros de conectividade/timeout sÍo esperados em cenários instáveis.
    if (isErroTransitórioDeRede(error)) return;
    console.warn("[Auth] Falha inesperada ao registrar acesso:", error);
  }
}

interface UsuarioCompleto {
  id: string;
  nome: string;
  email: string;
  pessoa_id?: string | null;
  tipo: string;           // tipo_usuario do sistema (MASTER, ADMIN, CLIENTE, etc.)
  tipo_pessoa?: string;   // tipo da pessoa (FISICA, JURIDICA)
  avatar_url?: string;
  cargo?: string;
  empresa?: string;
  orgId?: string | null;  // Multi-tenant: ID da organizaçÍo do usuário
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  usuarioCompleto: UsuarioCompleto | null;
  orgId: string | null;   // Atalho para usuarioCompleto?.orgId
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [usuarioCompleto, setUsuarioCompleto] =
    useState<UsuarioCompleto | null>(null);
  const testSessionApplied = useRef(false);

  const TEST_SESSION_KEY = "sb-test-auth-token";

  async function aplicarSessaoDeTeste() {
    if (testSessionApplied.current) return;
    try {
      const raw = localStorage.getItem(TEST_SESSION_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        access_token?: string;
        refresh_token?: string;
      };
      if (parsed?.access_token && parsed?.refresh_token) {
        const { data, error } = await supabase.auth.setSession({
          access_token: parsed.access_token,
          refresh_token: parsed.refresh_token,
        });
        if (!error && data?.session) {
          testSessionApplied.current = true;
          // SEGURANÇA (VER-030): Log apenas em desenvolvimento
          if (import.meta.env.DEV) {
            console.log("[Auth] SessÍo de teste aplicada");
          }
        }
      }
    } catch (err) {
      console.warn("[Auth] Falha ao aplicar sessÍo de teste", err);
    }
  }

  // FunçÍo de logout
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUsuarioCompleto(null);
  };

  // Carregar dados completos do usuário via view que une usuarios + pessoas
  const carregarUsuarioCompleto = async (authUser: User) => {
    try {
      const { data: usuario, error: usuarioError } = await supabase
        .from("vw_usuarios_completo")
        .select("id, auth_user_id, pessoa_id, tipo_usuario, tipo_pessoa, nome, email, avatar_url, cargo, empresa")
        .eq("auth_user_id", authUser.id)
        .maybeSingle();

      if (usuarioError) {
        // Pode ser bloqueio de RLS ou view inexistente — não bloquear o login
        console.warn("[Auth] Erro ao buscar usuário completo (RLS?):", usuarioError.message);
      }

      // Buscar org_id do usuário (multi-tenant)
      const { data: orgUser, error: orgError } = await supabase
        .from("org_usuarios")
        .select("org_id")
        .eq("auth_user_id", authUser.id)
        .eq("ativo", true)
        .limit(1)
        .maybeSingle();

      if (orgError) {
        console.warn("[Auth] Erro ao buscar org do usuário:", orgError.message);
      }

      if (usuario) {
        setUsuarioCompleto({
          id: usuario.id,
          pessoa_id: usuario.pessoa_id,
          nome: usuario.nome,
          email: usuario.email,
          tipo: usuario.tipo_usuario,       // papel real do sistema (MASTER, ADMIN, CLIENTE...)
          tipo_pessoa: usuario.tipo_pessoa, // tipo da pessoa (FISICA, JURIDICA)
          avatar_url: usuario.avatar_url,
          cargo: usuario.cargo,
          empresa: usuario.empresa,
          orgId: orgUser?.org_id ?? null,
        });
      }
    } catch (err) {
      console.warn("[Auth] Erro ao carregar dados completos do usuário:", err);
    }
  };

  useEffect(() => {
    let cleanupTimer: ReturnType<typeof setTimeout> | undefined;
    let isMounted = true;

    async function loadSession() {
      try {
        await aplicarSessaoDeTeste();

        // Primeiro, verifica se há um hash na URL (retorno do OAuth)
        const hashParams = window.location.hash;
        if (hashParams && hashParams.includes("access_token")) {
          // SEGURANÇA (VER-030): Log apenas em desenvolvimento
          if (import.meta.env.DEV) {
            console.log("[Auth] Detectado retorno OAuth, processando...");
          }
          // O Supabase vai processar automaticamente o hash com detectSessionInUrl: true
          // Limpa o hash da URL após processar
          cleanupTimer = setTimeout(() => {
            window.history.replaceState(null, "", window.location.pathname);
          }, 100);
        }

        // Aguarda um pouco para o Supabase processar o hash
        await new Promise((resolve) => setTimeout(resolve, 200));

        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("[Auth] Erro ao carregar sessÍo:", error);
        }

        if (!isMounted) return;
        setUser(data.session?.user || null);

        if (data.session?.user) {
          // SEGURANÇA (VER-030): não logar emails em produçÍo
          if (import.meta.env.DEV) {
            console.log("[Auth] Usuário autenticado:", data.session.user.email);
          }
          await carregarUsuarioCompleto(data.session.user);
        }
      } catch (err) {
        console.error("[Auth] Erro inesperado:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // SEGURANÇA (VER-030): não logar informações de sessÍo em produçÍo
        if (import.meta.env.DEV) {
          console.log("[Auth] Estado alterado:", event, session?.user?.email);
        }
        setUser(session?.user || null);

        // Se for um login via OAuth, redireciona para a home
        if (event === "SIGNED_IN" && session?.user) {
          // Remove o hash da URL se existir
          if (window.location.hash) {
            window.history.replaceState(
              null,
              "",
              window.location.pathname || "/"
            );
          }

          // Registrar notificaçÍo de acesso ao sistema
          registrarAcessoSistema(session.user);

          // Carregar dados completos do usuário
          carregarUsuarioCompleto(session.user);
        }

        // Limpar dados ao fazer logout
        if (event === "SIGNED_OUT") {
          setUsuarioCompleto(null);
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(cleanupTimer);
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, logout, usuarioCompleto, orgId: usuarioCompleto?.orgId ?? null }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}


