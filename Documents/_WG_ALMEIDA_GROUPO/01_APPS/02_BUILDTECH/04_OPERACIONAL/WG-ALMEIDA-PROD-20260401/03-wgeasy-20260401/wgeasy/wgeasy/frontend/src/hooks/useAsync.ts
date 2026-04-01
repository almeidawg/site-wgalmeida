// ============================================================
// HOOK: useAsync
// Gerenciamento de estados async (loading, error, data)
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { useState, useEffect, useCallback, DependencyList } from "react";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  dependencies: DependencyList = []
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });

    try {
      const result = await asyncFunction();
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (error) {
      setState({ data: null, loading: false, error: error as Error });
      throw error;
    }
  }, [asyncFunction]);

  useEffect(() => {
    execute();
    // dependencies array controla reexecuçÍo manual (aceita spreads)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute, ...dependencies]);

  return {
    ...state,
    execute,
  };
}

