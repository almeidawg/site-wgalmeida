// utils/supabasePagination.ts
// Utilitário padrÍo para buscar TODOS os registros do Supabase
// sem ser limitado pelo max_rows (1000) do PostgREST.
//
// REGRA: Toda função listar*() que pode retornar >1000 rows
// DEVE usar fetchAllRows() ao invés de query direta.

import { supabaseRaw as supabase } from "@/lib/supabaseClient";

const PAGE_SIZE = 1000;

type SupabaseTable = Parameters<typeof supabase.from>[0];

interface FetchAllOptions {
  table: SupabaseTable;
  select?: string;
  order?: { column: string; ascending?: boolean; nullsFirst?: boolean };
  filters?: (query: any) => any;
}

/**
 * Busca TODOS os registros de uma tabela Supabase com paginação automática.
 * Contorna o limite de 1000 rows do PostgREST fazendo requests em lotes.
 *
 * @example
 * const pessoas = await fetchAllRows({
 *   table: "pessoas",
 *   select: "id, nome, tipo",
 *   order: { column: "nome" },
 *   filters: (q) => q.eq("ativo", true),
 * });
 */
export async function fetchAllRows<T = any>(options: FetchAllOptions): Promise<T[]> {
  const { table, select = "*", order, filters } = options;
  let allData: T[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase.from(table).select(select).range(from, to);

    if (filters) {
      query = filters(query);
    }

    if (order) {
      query = query.order(order.column, {
        ascending: order.ascending ?? true,
        nullsFirst: order.nullsFirst,
      });
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Erro ao buscar ${table} (page ${page}):`, error);
      throw error;
    }

    const rows = (data || []) as T[];
    allData = allData.concat(rows);
    hasMore = rows.length === PAGE_SIZE;
    page++;
  }

  return allData;
}

