// src/hooks/usePlano.ts
// Hook para verificar plano/assinatura ativa da organizaçÍo
// Usado para feature gating em todo o sistema

import { useEffect, useState, useCallback } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

// ============================================================
// TIPOS
// ============================================================

export type PlanoSlug = "starter" | "pro" | "enterprise";
export type StatusAssinatura = "trialing" | "active" | "past_due" | "canceled" | "incomplete" | null;

export interface Plano {
  id: string;
  nome: string;
  slug: PlanoSlug;
  preco_mensal: number;
  descricao: string | null;
  limite_usuarios: number;
  limite_clientes: number;
  permite_ia: boolean;
  permite_relatorios_avancados: boolean;
  permite_integracao_nfe: boolean;
  permite_whatsapp: boolean;
}

export interface AssinaturaAtiva {
  id: string;
  plano: Plano;
  status: StatusAssinatura;
  trial_end: string | null;
  periodo_fim: string | null;
  stripe_subscription_id: string | null;
}

// Recursos que podem ser verificados por feature gating
export type RecursoProtegido =
  | "ia"
  | "relatorios_avancados"
  | "integracao_nfe"
  | "whatsapp"
  | "usuarios_ilimitados"
  | "clientes_ilimitados";

const PLANO_LIVRE: PlanoSlug = "starter"; // plano que todos têm no trial

// ============================================================
// HOOK
// ============================================================

export function usePlano(organizacaoId: string | null | undefined) {
  const [assinatura, setAssinatura] = useState<AssinaturaAtiva | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarAssinatura = useCallback(async () => {
    if (!organizacaoId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/billing/assinatura/${organizacaoId}`);
      if (!res.ok) throw new Error("Erro ao buscar assinatura");
      const data = await res.json();
      setAssinatura(data.assinatura ?? null);
    } catch (err) {
      // Fallback silencioso: se não há billing configurado, não bloqueia o sistema
      setAssinatura(null);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  }, [organizacaoId]);

  useEffect(() => {
    buscarAssinatura();
  }, [buscarAssinatura]);

  // Status derivados
  const estaAtivo = assinatura
    ? ["active", "trialing"].includes(assinatura.status ?? "")
    : true; // sem billing = acesso livre (para não quebrar)

  const estaEmTrial = assinatura?.status === "trialing";

  const diasRestantesTrial = (() => {
    if (!assinatura?.trial_end) return null;
    const diff = new Date(assinatura.trial_end).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  const planoSlug: PlanoSlug = (assinatura?.plano?.slug as PlanoSlug) ?? PLANO_LIVRE;

  // Feature gating
  function podeAcessar(recurso: RecursoProtegido): boolean {
    if (!assinatura) return true; // sem billing = tudo liberado

    const plano = assinatura.plano;
    if (!estaAtivo) return false;

    switch (recurso) {
      case "ia": return plano.permite_ia;
      case "relatorios_avancados": return plano.permite_relatorios_avancados;
      case "integracao_nfe": return plano.permite_integracao_nfe;
      case "whatsapp": return plano.permite_whatsapp;
      case "usuarios_ilimitados": return plano.limite_usuarios === -1;
      case "clientes_ilimitados": return plano.limite_clientes === -1;
      default: return true;
    }
  }

  return {
    assinatura,
    planoSlug,
    isLoading,
    error,
    estaAtivo,
    estaEmTrial,
    diasRestantesTrial,
    podeAcessar,
    recarregar: buscarAssinatura,
  };
}


