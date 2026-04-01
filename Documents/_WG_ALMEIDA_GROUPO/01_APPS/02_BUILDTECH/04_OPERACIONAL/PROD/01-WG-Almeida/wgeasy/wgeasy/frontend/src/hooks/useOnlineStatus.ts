// ============================================================
// HOOK: useOnlineStatus
// Detecta conexÍo de rede em tempo real.
// Exibe banner de offline na MainLayout.
// ============================================================

import { useState, useEffect, useCallback } from "react";

export interface OnlineStatus {
  /** true se conectado à internet */
  isOnline: boolean;
  /** true se voltou a ficar online (transitório — dura 3s) */
  acabouDeVoltar: boolean;
  /** Tipo de conexÍo (se disponível via Network Information API) */
  tipoConexao: string | null;
}

/**
 * Hook para monitorar o status de conexÍo do usuário.
 *
 * @example
 * const { isOnline, acabouDeVoltar } = useOnlineStatus();
 * if (!isOnline) return <OfflineBanner />;
 */
export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [acabouDeVoltar, setAcabouDeVoltar] = useState(false);

  const getTipoConexao = useCallback((): string | null => {
    // Network Information API (Chrome/Android)
    const nav = navigator as Navigator & {
      connection?: { effectiveType?: string };
    };
    return nav.connection?.effectiveType ?? null;
  }, []);

  const [tipoConexao, setTipoConexao] = useState<string | null>(getTipoConexao);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setTipoConexao(getTipoConexao());

      // Mostrar notificaçÍo de "voltou online" por 3s
      setAcabouDeVoltar(true);
      setTimeout(() => setAcabouDeVoltar(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setAcabouDeVoltar(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [getTipoConexao]);

  return { isOnline, acabouDeVoltar, tipoConexao };
}

