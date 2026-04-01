// ============================================================
// HOOK: useUsageMetering
// Controla limites de uso por plano (feature gating avançado)
// Complementa usePlano.ts com contadores em tempo real
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";

export interface UsageStats {
  clientes: { usado: number; limite: number };
  usuarios: { usado: number; limite: number };
  projetos: { usado: number; limite: number };
  armazenamentoMb: { usado: number; limite: number };
}

export interface UseUsageMeteringReturn {
  stats: UsageStats | null;
  carregando: boolean;
  /** Verifica se o uso atual excede o limite do plano */
  excedeUso: (recurso: keyof UsageStats) => boolean;
  /** Percentual de uso (0–100) */
  percentualUso: (recurso: keyof UsageStats) => number;
  /** true se qualquer recurso está >80% do limite */
  proxDeLimite: boolean;
  /** true se qualquer recurso atingiu 100% */
  limitAtingido: boolean;
  /** Atualiza os contadores */
  atualizar: () => void;
}

// Limites por plano slug (espelha usePlano.ts)
const LIMITES_PADRAO: Record<string, Partial<UsageStats>> = {
  starter: {
    clientes: { usado: 0, limite: 20 },
    usuarios: { usado: 0, limite: 3 },
    projetos: { usado: 0, limite: 10 },
    armazenamentoMb: { usado: 0, limite: 500 },
  },
  pro: {
    clientes: { usado: 0, limite: 200 },
    usuarios: { usado: 0, limite: 15 },
    projetos: { usado: 0, limite: 100 },
    armazenamentoMb: { usado: 0, limite: 5000 },
  },
  enterprise: {
    clientes: { usado: 0, limite: 99999 },
    usuarios: { usado: 0, limite: 99999 },
    projetos: { usado: 0, limite: 99999 },
    armazenamentoMb: { usado: 0, limite: 50000 },
  },
};

const STATS_CACHE_KEY = "wgeasy-usage-stats";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

interface CachedStats {
  stats: UsageStats;
  ts: number;
}

/**
 * Hook para monitorar uso de recursos em relaçÍo ao plano contratado.
 * Emite notificações via Zustand quando próximo do limite.
 *
 * @example
 * const { stats, excedeUso, proxDeLimite } = useUsageMetering("pro");
 * if (excedeUso("clientes")) return <UpgradePrompt />;
 */
export function useUsageMetering(planoSlug: string = "starter"): UseUsageMeteringReturn {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [carregando, setCarregando] = useState(false);
  const adicionarNotificacao = useAppStore((s) => s.adicionarNotificacao);

  const limites = LIMITES_PADRAO[planoSlug] ?? LIMITES_PADRAO.starter;

  const carregarStats = useCallback(async () => {
    // Verificar cache
    try {
      const cached = sessionStorage.getItem(STATS_CACHE_KEY);
      if (cached) {
        const parsed: CachedStats = JSON.parse(cached);
        if (Date.now() - parsed.ts < CACHE_TTL_MS) {
          setStats(parsed.stats);
          return;
        }
      }
    } catch {
      // Cache inválido — continuar
    }

    setCarregando(true);
    try {
      // Em produçÍo, estes dados viriam do Supabase
      // Aqui usamos os limites do plano como placeholder até integraçÍo completa
      const mockStats: UsageStats = {
        clientes: { usado: 0, limite: limites.clientes?.limite ?? 20 },
        usuarios: { usado: 0, limite: limites.usuarios?.limite ?? 3 },
        projetos: { usado: 0, limite: limites.projetos?.limite ?? 10 },
        armazenamentoMb: { usado: 0, limite: limites.armazenamentoMb?.limite ?? 500 },
      };

      setStats(mockStats);
      sessionStorage.setItem(
        STATS_CACHE_KEY,
        JSON.stringify({ stats: mockStats, ts: Date.now() })
      );

      // Alertar se próximo do limite
      const recursos = Object.entries(mockStats) as [keyof UsageStats, { usado: number; limite: number }][];
      for (const [recurso, { usado, limite }] of recursos) {
        const pct = limite > 0 ? (usado / limite) * 100 : 0;
        if (pct >= 90) {
          adicionarNotificacao({
            tipo: "aviso",
            titulo: `Limite de ${recurso} quase atingido`,
            mensagem: `Você usou ${pct.toFixed(0)}% do seu plano ${planoSlug}.`,
          });
        }
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error("[useUsageMetering]", err);
    } finally {
      setCarregando(false);
    }
  }, [planoSlug, limites, adicionarNotificacao]);

  useEffect(() => {
    void carregarStats();
  }, [carregarStats]);

  const excedeUso = useCallback(
    (recurso: keyof UsageStats): boolean => {
      if (!stats) return false;
      const { usado, limite } = stats[recurso];
      return limite > 0 && usado >= limite;
    },
    [stats]
  );

  const percentualUso = useCallback(
    (recurso: keyof UsageStats): number => {
      if (!stats) return 0;
      const { usado, limite } = stats[recurso];
      if (limite === 0) return 0;
      return Math.min(100, Math.round((usado / limite) * 100));
    },
    [stats]
  );

  const proxDeLimite = stats
    ? Object.values(stats).some(({ usado, limite }) => limite > 0 && usado / limite >= 0.8)
    : false;

  const limitAtingido = stats
    ? Object.values(stats).some(({ usado, limite }) => limite > 0 && usado >= limite)
    : false;

  return {
    stats,
    carregando,
    excedeUso,
    percentualUso,
    proxDeLimite,
    limitAtingido,
    atualizar: () => {
      sessionStorage.removeItem(STATS_CACHE_KEY);
      void carregarStats();
    },
  };
}

