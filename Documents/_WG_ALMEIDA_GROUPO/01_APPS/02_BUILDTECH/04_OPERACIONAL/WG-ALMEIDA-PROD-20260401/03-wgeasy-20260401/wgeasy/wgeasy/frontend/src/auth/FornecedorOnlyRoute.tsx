/**
 * Rota protegida para fornecedores
 * Redireciona outros tipos de usuário para suas respectivas áreas
 */

import { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useUsuarioLogado } from "@/hooks/useUsuarioLogado";

interface Props {
  children?: ReactNode;
}

export default function FornecedorOnlyRoute({ children }: Props) {
  const { user } = useAuth();
  const { usuario, loading } = useUsuarioLogado();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F25C26]" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Verificar se é fornecedor
  const tipoUsuario = usuario?.tipo_usuario;

  if (tipoUsuario === "CLIENTE") {
    return <Navigate to="/wgx" replace />;
  }

  if (tipoUsuario === "COLABORADOR") {
    return <Navigate to="/colaborador" replace />;
  }

  // Internos (MASTER, ADMIN) podem acessar área de fornecedor também para gestÍo
  if (tipoUsuario === "FORNECEDOR" || ["MASTER", "ADMIN"].includes(tipoUsuario || "")) {
    return children ? <>{children}</> : <Outlet />;
  }

  // Outros usuários vÍo para o dashboard principal
  return <Navigate to="/" replace />;
}

