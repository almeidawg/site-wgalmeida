// src/hooks/useImpersonation.ts
// Hook para permitir que usuários MASTER/ADMIN acessem como outro usuário
// Usado para acessar área do cliente, fornecedor, colaborador, etc.

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useUsuarioLogado } from "./useUsuarioLogado";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";

export interface ImpersonatedUser {
  id: string;
  nome: string;
  tipo: string;
  email?: string;
  telefone?: string;
  avatar_url?: string;
}

interface UseImpersonationReturn {
  // Estado
  isImpersonating: boolean;
  impersonatedUser: ImpersonatedUser | null;
  loading: boolean;
  error: string | null;

  // Ações
  canImpersonate: boolean;
  startImpersonation: (pessoaId: string) => Promise<void>;
  stopImpersonation: () => void;

  // Dados efetivos (pessoa real ou impersonada)
  effectiveUserId: string | null;
  effectiveUserName: string | null;
}

/**
 * Hook para impersonaçÍo de usuários
 * Permite que MASTER/ADMIN acessem áreas como se fossem outro usuário
 *
 * Uso:
 * - Na URL: ?cliente_id=xxx ou ?pessoa_id=xxx
 * - Automaticamente detecta e carrega os dados do usuário impersonado
 */
export function useImpersonation(): UseImpersonationReturn {
  const [searchParams, setSearchParams] = useSearchParams();
  const { usuario, isAdminOuMaster, loading: userLoading } = useUsuarioLogado();

  const [impersonatedUser, setImpersonatedUser] = useState<ImpersonatedUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // IDs que podem ser passados na URL
  const clienteIdParam = searchParams.get("cliente_id");
  const pessoaIdParam = searchParams.get("pessoa_id");
  const fornecedorIdParam = searchParams.get("fornecedor_id");
  const colaboradorIdParam = searchParams.get("colaborador_id");

  // ID a ser impersonado (prioridade: cliente > pessoa > fornecedor > colaborador)
  const targetId = clienteIdParam || pessoaIdParam || fornecedorIdParam || colaboradorIdParam;

  // Pode impersonar se for master/admin
  const canImpersonate = isAdminOuMaster;

  // Está impersonando se tiver ID na URL e for master/admin
  const isImpersonating = !!targetId && canImpersonate && !!impersonatedUser;

  // Ref para evitar múltiplas chamadas
  const loadingRef = useRef(false);
  const lastTargetIdRef = useRef<string | null>(null);

  // Carregar dados do usuário impersonado
  const loadImpersonatedUser = useCallback(async (pessoaId: string) => {
    // Evitar chamadas duplicadas
    if (loadingRef.current || pessoaId === lastTargetIdRef.current) {
      return;
    }

    if (!canImpersonate) {
      setError("Sem permissÍo para acessar como outro usuário");
      return;
    }

    loadingRef.current = true;
    lastTargetIdRef.current = pessoaId;
    setLoading(true);
    setError(null);

    try {
      // Buscar dados da pessoa
      const { data: pessoa, error: err } = await supabase
        .from("pessoas")
        .select("id, nome, tipo, email, telefone, avatar_url")
        .eq("id", pessoaId)
        .maybeSingle();

      if (err) throw err;

      if (!pessoa) {
        setError("Usuário não encontrado");
        setImpersonatedUser(null);
        return;
      }

      setImpersonatedUser({
        id: pessoa.id,
        nome: pessoa.nome,
        tipo: pessoa.tipo || "CLIENTE",
        email: pessoa.email,
        telefone: pessoa.telefone,
        avatar_url: pessoa.avatar_url,
      });

      // SEGURANÇA (VER-030): Log apenas em desenvolvimento
      if (import.meta.env.DEV) {
        console.log("[Impersonation] Acessando como:", pessoa.nome);
      }
    } catch (e: any) {
      console.error("[Impersonation] Erro:", e);
      setError(e.message || "Erro ao carregar usuário");
      setImpersonatedUser(null);
      lastTargetIdRef.current = null; // Permitir retry em caso de erro
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [canImpersonate]);

  // Efeito para carregar automaticamente quando tem ID na URL
  useEffect(() => {
    if (userLoading) return;

    if (targetId && canImpersonate) {
      loadImpersonatedUser(targetId);
    } else if (!targetId) {
      setImpersonatedUser(null);
      lastTargetIdRef.current = null;
    }
  }, [targetId, canImpersonate, userLoading, loadImpersonatedUser]);

  // Iniciar impersonaçÍo manualmente
  const startImpersonation = async (pessoaId: string) => {
    lastTargetIdRef.current = null; // Reset para permitir nova carga
    await loadImpersonatedUser(pessoaId);

    // Adicionar ID na URL
    const newParams = new URLSearchParams(searchParams);
    newParams.set("pessoa_id", pessoaId);
    setSearchParams(newParams);
  };

  // Parar impersonaçÍo
  const stopImpersonation = () => {
    setImpersonatedUser(null);
    lastTargetIdRef.current = null;

    // Remover IDs da URL
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("cliente_id");
    newParams.delete("pessoa_id");
    newParams.delete("fornecedor_id");
    newParams.delete("colaborador_id");
    setSearchParams(newParams);
  };

  // Dados efetivos (impersonado ou real)
  const effectiveUserId = isImpersonating
    ? impersonatedUser?.id || null
    : usuario?.pessoa_id || null;

  const effectiveUserName = isImpersonating
    ? impersonatedUser?.nome || null
    : usuario?.nome || null;

  return {
    isImpersonating,
    impersonatedUser,
    loading: loading || userLoading,
    error,
    canImpersonate,
    startImpersonation,
    stopImpersonation,
    effectiveUserId,
    effectiveUserName,
  };
}

/**
 * Componente de barra de impersonaçÍo
 * Mostra quando um admin está acessando como outro usuário
 */
export { default as ImpersonationBar } from "@/components/ui/ImpersonationBar";


