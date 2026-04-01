import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

interface PublicRouteProps {
  children: ReactNode;
}

/**
 * PublicRoute - Rota pública que redireciona usuários logados
 *
 * Usado para páginas como Login, Signup, Reset Password
 * Se o usuário já estiver autenticado, redireciona para o dashboard
 * EXCEÇÍO: A página /login sempre é acessível (para permitir logout/troca de conta)
 */
export default function PublicRoute({ children }: PublicRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Enquanto carrega, mostra loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Permitir acesso à página de login mesmo logado (para logout/troca de conta)
  const isLoginPage = location.pathname === "/login";

  // Se já está logado e não é a página de login, redireciona para home
  if (user && !isLoginPage) {
    return <Navigate to="/" replace />;
  }

  // Se não está logado OU é a página de login, renderiza a página pública
  return <>{children}</>;
}


