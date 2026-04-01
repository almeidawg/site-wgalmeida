// src/auth/ClienteProtectedRoute.tsx
// Rota protegida que redireciona CLIENTES para área exclusiva

import { ReactNode, useCallback, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

interface ClienteProtectedRouteProps {
  children: ReactNode;
}

export default function ClienteProtectedRoute({
  children,
}: ClienteProtectedRouteProps) {
  const { user, loading: authLoading, logout } = useAuth();
  const location = useLocation();
  const [tipoUsuario, setTipoUsuario] = useState<string | null>(null);
  const [pessoaId, setPessoaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [erroTipo, setErroTipo] = useState<string | null>(null);

  const userId = user?.id ?? null;

  const verificarTipoUsuario = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setErroTipo(null);

    try {
      // Buscar tipo do usuário
      const { data, error } = await supabase
        .from("usuarios")
        .select("tipo_usuario, pessoa_id")
        .eq("auth_user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar tipo de usuário:", error);
        setErroTipo("não foi possível validar seu perfil agora.");
        return;
      }

      if (!data) {
        setErroTipo("Seu perfil ainda não foi vinculado ao sistema.");
        return;
      }

      setTipoUsuario(data.tipo_usuario);
      setPessoaId(data.pessoa_id);
    } catch (e) {
      console.error("Erro ao verificar tipo de usuário:", e);
      setErroTipo("Falha inesperada ao validar seu perfil.");
    } finally {
      setLoading(false);
    }
  }, [userId]); // depende apenas do ID — token refresh não recria o callback

  useEffect(() => {
    if (!authLoading) {
      setLoading(true);
      verificarTipoUsuario();
    }
  }, [authLoading, verificarTipoUsuario]);

  // Loading
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // não logado
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Usuário sem perfil conhecido não deve acessar o sistema
  if (!tipoUsuario || erroTipo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white border border-gray-100 rounded-2xl p-6 shadow-sm text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Acesso em validaçÍo
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            {erroTipo ||
              "Seu acesso ainda está sendo validado. Tente novamente em alguns instantes."}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                verificarTipoUsuario();
              }}
              className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition"
            >
              Tentar novamente
            </button>
            <button
              type="button"
              onClick={async () => {
                await logout();
              }}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Validar redirecionamentos por tipo de usuário
  // NOTA: MASTER e ADMIN podem acessar todas as áreas, mas ainda passam pela validaçÍo
  const isAdminOrMaster = tipoUsuario === "MASTER" || tipoUsuario === "ADMIN";

  if (tipoUsuario === "CLIENTE") {
    const isAreaCliente = location.pathname.startsWith("/wgx");
    if (!isAreaCliente) {
      const redirectUrl = pessoaId ? `/wgx?cliente_id=${pessoaId}` : "/wgx";
      return <Navigate to={redirectUrl} replace />;
    }
  }

  if (tipoUsuario === "FORNECEDOR") {
    const isFornecedor = location.pathname.startsWith("/fornecedor");
    if (!isFornecedor && !isAdminOrMaster) {
      return <Navigate to="/fornecedor" replace />;
    }
  }

  if (tipoUsuario === "COLABORADOR") {
    const isColaborador = location.pathname.startsWith("/colaborador");
    if (!isColaborador && !isAdminOrMaster) {
      return <Navigate to="/colaborador" replace />;
    }
  }

  if (tipoUsuario === "JURIDICO") {
    const isJuridico = location.pathname.startsWith("/juridico");
    if (!isJuridico && !isAdminOrMaster) {
      return <Navigate to="/juridico" replace />;
    }
  }

  if (tipoUsuario === "FINANCEIRO") {
    const isFinanceiro = location.pathname.startsWith("/financeiro");
    if (!isFinanceiro && !isAdminOrMaster) {
      return <Navigate to="/financeiro" replace />;
    }
  }

  if (tipoUsuario === "ESPECIFICADOR") {
    const isEspecificador = location.pathname.startsWith("/especificador");
    if (!isEspecificador && !isAdminOrMaster) {
      return <Navigate to="/especificador" replace />;
    }
  }

  return children;
}

// Rota exclusiva para clientes - só permite acesso de CLIENTES
// Verifica também se o cliente já confirmou seus dados (NO BANCO DE DADOS)
export function ClienteOnlyRoute({ children }: ClienteProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [tipoUsuario, setTipoUsuario] = useState<string | null>(null);
  const [dadosConfirmados, setDadosConfirmados] = useState<boolean | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verificarTipoUsuario() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Buscar tipo do usuário E status de confirmaçÍo de dados do BANCO
        const { data, error } = await supabase
          .from("usuarios")
          .select("tipo_usuario, pessoa_id, dados_confirmados")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Erro ao buscar tipo de usuário:", error);
        } else if (data) {
          setTipoUsuario(data.tipo_usuario);

          // Verificar se os dados foram confirmados (BANCO DE DADOS - mais seguro)
          if (data.pessoa_id && data.tipo_usuario === "CLIENTE") {
            // Prioriza o banco de dados, fallback para localStorage (migraçÍo)
            const confirmadoBanco = (data as { dados_confirmados?: boolean }).dados_confirmados;
            if (confirmadoBanco !== undefined && confirmadoBanco !== null) {
              setDadosConfirmados(confirmadoBanco === true);
            } else {
              // Fallback: verificar localStorage (para clientes que confirmaram antes da migraçÍo)
              const confirmadoLocal = localStorage.getItem(
                `dados_confirmados_${data.pessoa_id}`
              );
              setDadosConfirmados(confirmadoLocal === "true");
            }
          } else {
            // não é cliente, não precisa confirmar
            setDadosConfirmados(true);
          }
        }
      } catch (e) {
        console.error("Erro ao verificar tipo de usuário:", e);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      verificarTipoUsuario();
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se é CLIENTE e ainda não confirmou os dados, redirecionar para confirmaçÍo
  // Exceto se já estiver na página de confirmaçÍo
  const isConfirmacaoPage = location.pathname === "/wgx/confirmar-dados";

  if (
    tipoUsuario === "CLIENTE" &&
    dadosConfirmados === false &&
    !isConfirmacaoPage
  ) {
    return <Navigate to="/wgx/confirmar-dados" replace />;
  }

  // Admins e colaboradores também podem acessar (para suporte)
  // Mas clientes só veem a área deles
  return children;
}


