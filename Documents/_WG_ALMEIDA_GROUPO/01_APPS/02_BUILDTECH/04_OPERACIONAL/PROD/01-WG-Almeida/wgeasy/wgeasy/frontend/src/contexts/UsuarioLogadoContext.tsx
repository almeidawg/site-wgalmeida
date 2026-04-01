// src/contexts/UsuarioLogadoContext.tsx
// Contexto singleton para dados do usuário logado.
// Garante que vw_usuarios_completo seja buscada UMA VEZ, compartilhada por todos os componentes.

import { createContext, useContext, ReactNode } from "react";
import type { UsuarioLogado } from "@/hooks/useUsuarioLogado";

// Re-exportamos o tipo para quem precisar importar diretamente do contexto
export type { UsuarioLogado };

export interface UsuarioLogadoContextData {
  usuario: UsuarioLogado | null;
  loading: boolean;
  error: string | null;
  isMaster: boolean;
  isAdmin: boolean;
  isComercial: boolean;
  isAtendimento: boolean;
  isColaborador: boolean;
  isCliente: boolean;
  isEspecificador: boolean;
  isFornecedor: boolean;
  isJuridico: boolean;
  isFinanceiro: boolean;
  isAdminOuMaster: boolean;
  isInterno: boolean;
  podeVerValores: boolean;
  podeVerCronograma: boolean;
  podeVerDocumentos: boolean;
  podeVerProposta: boolean;
  podeVerContratos: boolean;
  podeFazerUpload: boolean;
  podeComentarem: boolean;
  refetchPermissions: () => Promise<void>;
  isPermissionsStale: () => boolean;
}

export const UsuarioLogadoContext = createContext<UsuarioLogadoContextData | null>(null);

export function useUsuarioLogadoContext(): UsuarioLogadoContextData {
  const ctx = useContext(UsuarioLogadoContext);
  if (!ctx) {
    throw new Error("useUsuarioLogadoContext must be used within UsuarioLogadoProvider");
  }
  return ctx;
}

// Provider wrapper — recebe os dados do hook real e os disponibiliza
export function UsuarioLogadoProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: UsuarioLogadoContextData;
}) {
  return (
    <UsuarioLogadoContext.Provider value={value}>
      {children}
    </UsuarioLogadoContext.Provider>
  );
}
