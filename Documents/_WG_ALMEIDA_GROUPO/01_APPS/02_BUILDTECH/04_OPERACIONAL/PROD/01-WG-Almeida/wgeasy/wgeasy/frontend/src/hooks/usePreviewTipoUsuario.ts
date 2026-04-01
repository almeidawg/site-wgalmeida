// src/hooks/usePreviewTipoUsuario.ts
// Hook para permitir que MASTER visualize o sistema como outro tipo de usuário
// Usado na Planta do Sistema para validaçÍo de permissões

import React, { useState, useCallback, createContext, useContext, type ReactNode } from "react";
import type { TipoUsuario } from "@/types/usuarios";

interface PreviewTipoUsuarioContextType {
  previewTipo: TipoUsuario | null;
  isPreviewMode: boolean;
  startPreview: (tipo: TipoUsuario) => void;
  stopPreview: () => void;
}

const STORAGE_KEY = "wg_preview_tipo_usuario";

const PreviewTipoUsuarioContext = createContext<PreviewTipoUsuarioContextType | null>(null);

/**
 * Provider para o contexto de preview de tipo de usuário
 */
export function PreviewTipoUsuarioProvider({ children }: { children: ReactNode }) {
  const [previewTipo, setPreviewTipo] = useState<TipoUsuario | null>(() => {
    // Carregar do sessionStorage ao inicializar
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored as TipoUsuario | null;
    }
    return null;
  });

  const isPreviewMode = previewTipo !== null;

  const startPreview = useCallback((tipo: TipoUsuario) => {
    setPreviewTipo(tipo);
    sessionStorage.setItem(STORAGE_KEY, tipo);
    console.log("[Preview] Iniciando visualizaçÍo como:", tipo);
  }, []);

  const stopPreview = useCallback(() => {
    setPreviewTipo(null);
    sessionStorage.removeItem(STORAGE_KEY);
    console.log("[Preview] Finalizando visualizaçÍo");
  }, []);

  return React.createElement(
    PreviewTipoUsuarioContext.Provider,
    {
      value: {
        previewTipo,
        isPreviewMode,
        startPreview,
        stopPreview,
      }
    },
    children
  );
}

/**
 * Hook para consumir o contexto de preview
 */
export function usePreviewTipoUsuario(): PreviewTipoUsuarioContextType {
  const context = useContext(PreviewTipoUsuarioContext);

  // Se não estiver dentro do provider, retornar estado padrÍo
  if (!context) {
    return {
      previewTipo: null,
      isPreviewMode: false,
      startPreview: () => {},
      stopPreview: () => {},
    };
  }

  return context;
}

// Labels para cada tipo de usuário
export const LABELS_TIPO_USUARIO: Record<TipoUsuario, string> = {
  MASTER: "Founder & CEO",
  ADMIN: "Administrador",
  COMERCIAL: "Comercial",
  ATENDIMENTO: "Atendimento",
  COLABORADOR: "Colaborador",
  CLIENTE: "Cliente",
  ESPECIFICADOR: "Especificador",
  FORNECEDOR: "Fornecedor",
  JURIDICO: "Jurídico",
  FINANCEIRO: "Financeiro",
};

// Descrições para cada tipo
export const DESCRICOES_TIPO_USUARIO: Record<TipoUsuario, string> = {
  MASTER: "Acesso total ao sistema, todas as funcionalidades",
  ADMIN: "Gerencia usuários e configurações do sistema",
  COMERCIAL: "Acesso a propostas, contratos e área comercial",
  ATENDIMENTO: "Acesso a atendimento e suporte ao cliente",
  COLABORADOR: "Acesso à área do colaborador (projetos, solicitações)",
  CLIENTE: "Área exclusiva do cliente (WGXperience)",
  ESPECIFICADOR: "Área do especificador (comissões, contratos)",
  FORNECEDOR: "Área do fornecedor (cotações, serviços)",
  JURIDICO: "Acesso exclusivo ao módulo jurídico",
  FINANCEIRO: "Acesso exclusivo ao módulo financeiro",
};


