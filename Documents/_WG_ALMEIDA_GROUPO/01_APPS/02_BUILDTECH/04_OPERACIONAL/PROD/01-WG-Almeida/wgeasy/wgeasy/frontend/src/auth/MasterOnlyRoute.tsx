/**
 * 🔒 Rota Ultra-Protegida: MASTER ONLY
 * Garante que apenas o William Almeida (ou perfil Master) acesse o Cérebro SaaS.
 */

import { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useUsuarioLogado } from "@/hooks/useUsuarioLogado";

interface Props {
  children?: ReactNode;
}

export default function MasterOnlyRoute({ children }: Props) {
  const { user } = useAuth();
  const { usuario, loading } = useUsuarioLogado();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F25C26]" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Verificar se é MASTER
  const tipoUsuario = usuario?.tipo_usuario;

  if (tipoUsuario !== "MASTER") {
    console.warn("⚠️ Acesso negado ao SaaS Hub: Usuário não possui privilégios MASTER.");
    return <Navigate to="/" replace />; // Redireciona para o Dashboard padrÍo
  }

  return children ? <>{children}</> : <Outlet />;
}

