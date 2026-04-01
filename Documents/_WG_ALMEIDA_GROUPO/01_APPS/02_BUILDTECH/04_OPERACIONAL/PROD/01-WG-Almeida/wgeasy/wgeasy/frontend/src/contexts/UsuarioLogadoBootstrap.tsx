// src/contexts/UsuarioLogadoBootstrap.tsx
// Executa useUsuarioLogado UMA VEZ e disponibiliza via contexto.
// Deve envolver toda a aplicaçÍo em main.tsx (dentro de AuthProvider).

import { ReactNode } from "react";
import { useUsuarioLogadoInternal } from "@/hooks/useUsuarioLogado";
import { UsuarioLogadoProvider } from "@/contexts/UsuarioLogadoContext";

export function UsuarioLogadoBootstrap({ children }: { children: ReactNode }) {
  const value = useUsuarioLogadoInternal();
  return <UsuarioLogadoProvider value={value}>{children}</UsuarioLogadoProvider>;
}

