// src/hooks/useUsuarioLogado.ts
// Hook para buscar dados completos do usuário logado

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/auth/AuthContext";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";

// VER-004: Intervalo de revalidaçÍo de permissões (5 minutos)
const PERMISSION_REVALIDATION_INTERVAL = 5 * 60 * 1000;

export interface UsuarioLogado {
  id: string;
  auth_user_id: string;
  pessoa_id: string | null;
  tipo_usuario: "MASTER" | "ADMIN" | "COMERCIAL" | "ATENDIMENTO" | "COLABORADOR" | "CLIENTE" | "ESPECIFICADOR" | "FORNECEDOR" | "JURIDICO" | "FINANCEIRO";
  ativo: boolean;
  nucleo_id: string | null;
  // Permissões de cliente
  cliente_pode_ver_valores: boolean;
  cliente_pode_ver_cronograma: boolean;
  cliente_pode_ver_documentos: boolean;
  cliente_pode_ver_proposta: boolean;
  cliente_pode_ver_contratos: boolean;
  cliente_pode_fazer_upload: boolean;
  cliente_pode_comentar: boolean;
  // Dados da pessoa
  nome: string | null;
  email: string | null;
  telefone: string | null;
  avatar_url: string | null;
  foto_url: string | null;
  // Campos adicionais para AreaHeader
  profissao?: string | null;
  cargo: string | null;
  empresa: string | null;
  empresa_id?: string | null;
  data_inicio_wg: string | null;
  // Email do Google Workspace para integraçÍo com Calendar
  google_workspace_email: string | null;
}

// Hook interno — usado APENAS pelo UsuarioLogadoBootstrap para buscar os dados uma vez.
// Use useUsuarioLogado() nos componentes (lê do contexto).
export function useUsuarioLogadoInternal() {
  const { user, loading: authLoading } = useAuth();
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // VER-004: Timestamp da última validaçÍo para detectar permissões stale
  const lastValidationRef = useRef<number>(0);
  const revalidationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // VER-004: FunçÍo de busca extraída para reuso (revalidaçÍo)
  const buscarUsuario = useCallback(async (isRevalidation = false) => {
    if (!user) {
      setUsuario(null);
      if (!isRevalidation) setLoading(false);
      return;
    }

    try {
      // Buscar usuário pela relaçÍo com auth.users
      const { data, error: err } = await supabase
        .from("vw_usuarios_completo")
        .select("*")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (err || !data) {
        // Se não encontrou na view, tentar buscar diretamente
        const { data: usuarioData, error: err2 } = await supabase
          .from("usuarios")
          .select(`
            *,
            pessoas:pessoa_id (
              nome,
              email,
              telefone,
              avatar_url,
              foto_url,
              profissao,
              cargo,
              empresa,
              data_inicio_wg
            )
          `)
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (err2) {
          // SEGURANÇA (VER-030): Log apenas em desenvolvimento
          if (import.meta.env.DEV) {
            console.error("Erro ao buscar usuário:", err2);
          }
          setError("Usuário não encontrado no sistema");
          setUsuario(null);
        } else if (usuarioData) {
          const pessoa = usuarioData.pessoas as any;
          // Prioridade: avatar_url > foto_url
          const avatarFinal = pessoa?.avatar_url || pessoa?.foto_url || null;
          // Google Workspace email: priorizar google_workspace_email, depois email da pessoa se for do domínio
          const googleEmail = (usuarioData as any).google_workspace_email ||
            (pessoa?.email?.endsWith("@wgalmeida.com.br") ? pessoa.email : null);

          // VER-004: Verificar se usuário foi desativado
          if (!usuarioData.ativo) {
            setError("Usuário desativado");
            setUsuario(null);
            return;
          }

          setUsuario({
            ...usuarioData,
            nome: pessoa?.nome || null,
            email: pessoa?.email || user.email || null,
            telefone: pessoa?.telefone || null,
            avatar_url: avatarFinal,
            foto_url: pessoa?.foto_url || null,
            profissao: pessoa?.profissao || null,
            cargo: pessoa?.cargo || null,
            empresa: pessoa?.empresa || null,
            data_inicio_wg: pessoa?.data_inicio_wg || null,
            google_workspace_email: googleEmail,
          } as UsuarioLogado);
          lastValidationRef.current = Date.now();
        }
      } else if (data) {
        // VER-004: Verificar se usuário foi desativado
        if (!(data as any).ativo) {
          setError("Usuário desativado");
          setUsuario(null);
          return;
        }

        // Aplicar fallback: avatar_url > foto_url
        const viewData = data as any;
        const avatarFinal = viewData.avatar_url || viewData.foto_url || null;
        // Google Workspace email: priorizar google_workspace_email, depois email se for do domínio
        const googleEmail = viewData.google_workspace_email ||
          (viewData.email?.endsWith("@wgalmeida.com.br") ? viewData.email : null);
        setUsuario({
          ...viewData,
          avatar_url: avatarFinal,
          profissao: viewData.profissao || null,
          cargo: viewData.cargo || null,
          empresa: viewData.empresa || null,
          data_inicio_wg: viewData.data_inicio_wg || null,
          google_workspace_email: googleEmail,
        } as UsuarioLogado);
        lastValidationRef.current = Date.now();
      }
    } catch (e: any) {
      // SEGURANÇA (VER-030): Log apenas em desenvolvimento
      if (import.meta.env.DEV) {
        console.error("Erro ao buscar usuário:", e);
      }
      setError(e.message);
    } finally {
      if (!isRevalidation) setLoading(false);
    }
  }, [user]);

  // Efeito para carga inicial
  useEffect(() => {
    if (!authLoading) {
      buscarUsuario(false);
    }
  }, [user, authLoading, buscarUsuario]);

  // VER-004: Efeito para revalidaçÍo periódica de permissões
  useEffect(() => {
    if (!user || authLoading) return;

    // Configurar intervalo de revalidaçÍo
    revalidationIntervalRef.current = setInterval(() => {
      // SEGURANÇA (VER-030): Log apenas em desenvolvimento
      if (import.meta.env.DEV) {
        console.log("[Auth] Revalidando permissões...");
      }
      buscarUsuario(true);
    }, PERMISSION_REVALIDATION_INTERVAL);

    return () => {
      if (revalidationIntervalRef.current) {
        clearInterval(revalidationIntervalRef.current);
      }
    };
  }, [user, authLoading, buscarUsuario]);

  // VER-004: FunçÍo para revalidar permissões manualmente (para ações sensíveis)
  const refetchPermissions = useCallback(async () => {
    await buscarUsuario(true);
  }, [buscarUsuario]);

  // VER-004: Verificar se as permissões estÍo stale (mais de 5 minutos)
  const isPermissionsStale = useCallback(() => {
    return Date.now() - lastValidationRef.current > PERMISSION_REVALIDATION_INTERVAL;
  }, []);

  // Helpers
  const isMaster = usuario?.tipo_usuario === "MASTER";
  const isAdmin = usuario?.tipo_usuario === "ADMIN";
  const isComercial = usuario?.tipo_usuario === "COMERCIAL";
  const isAtendimento = usuario?.tipo_usuario === "ATENDIMENTO";
  const isColaborador = usuario?.tipo_usuario === "COLABORADOR";
  const isCliente = usuario?.tipo_usuario === "CLIENTE";
  const isEspecificador = usuario?.tipo_usuario === "ESPECIFICADOR";
  const isFornecedor = usuario?.tipo_usuario === "FORNECEDOR";
  const isJuridico = usuario?.tipo_usuario === "JURIDICO";
  const isFinanceiro = usuario?.tipo_usuario === "FINANCEIRO";

  // Helpers de acesso
  const isAdminOuMaster = isMaster || isAdmin;
  const isInterno = isMaster || isAdmin || isComercial || isAtendimento || isColaborador || isJuridico || isFinanceiro;

  return {
    usuario,
    loading: loading || authLoading,
    error,
    isMaster,
    isAdmin,
    isComercial,
    isAtendimento,
    isColaborador,
    isCliente,
    isEspecificador,
    isFornecedor,
    isJuridico,
    isFinanceiro,
    isAdminOuMaster,
    isInterno,
    // Permissões específicas de cliente
    podeVerValores: usuario?.cliente_pode_ver_valores ?? false,
    podeVerCronograma: usuario?.cliente_pode_ver_cronograma ?? false,
    podeVerDocumentos: usuario?.cliente_pode_ver_documentos ?? false,
    podeVerProposta: usuario?.cliente_pode_ver_proposta ?? false,
    podeVerContratos: usuario?.cliente_pode_ver_contratos ?? false,
    podeFazerUpload: usuario?.cliente_pode_fazer_upload ?? false,
    podeComentarem: usuario?.cliente_pode_comentar ?? false,
    // VER-004: Funções de revalidaçÍo de permissões
    refetchPermissions,
    isPermissionsStale,
  };
}

// Hook público — lê do contexto singleton (UsuarioLogadoBootstrap).
// Zero queries extras: todos os componentes compartilham o mesmo dado.
import { useUsuarioLogadoContext } from "@/contexts/UsuarioLogadoContext";
export function useUsuarioLogado() {
  return useUsuarioLogadoContext();
}


