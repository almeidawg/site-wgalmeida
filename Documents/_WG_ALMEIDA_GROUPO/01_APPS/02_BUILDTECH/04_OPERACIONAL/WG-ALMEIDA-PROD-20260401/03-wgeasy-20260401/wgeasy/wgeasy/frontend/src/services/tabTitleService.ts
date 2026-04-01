// ============================================================
// SERVIÇO DE TÍTULOS DE ABAS
// Busca nomes reais dos registros para exibir nas abas
// ============================================================

import { supabase } from "../lib/supabaseClient";

// Cache para evitar múltiplas requisições
const cache = new Map<string, string>();

// Mapeamento de rotas para configurações de busca
const rotaConfig: Record<string, { tabela: string; campo: string }> = {
  "pessoas/clientes": { tabela: "pessoas", campo: "nome" },
  "pessoas/colaboradores": { tabela: "pessoas", campo: "nome" },
  "pessoas/fornecedores": { tabela: "pessoas", campo: "nome" },
  "pessoas/especificadores": { tabela: "pessoas", campo: "nome" },
  "contratos": { tabela: "contratos", campo: "numero_contrato" },
  "cronograma/projects": { tabela: "projetos", campo: "nome" },
  "cronograma/projeto": { tabela: "projetos", campo: "nome" },
  "orcamentos": { tabela: "orcamentos", campo: "titulo" },
  "compras": { tabela: "compras", campo: "descricao" },
  "assistencia": { tabela: "assistencias", campo: "titulo" },
  "usuarios": { tabela: "vw_usuarios_completo", campo: "nome" },
  "tarefas": { tabela: "cronograma_tarefas", campo: "titulo" },
  "obras": { tabela: "obras", campo: "nome" },
};

// Fallback de nomes para quando nÍo encontrar no banco
const fallbackNomes: Record<string, string> = {
  "pessoas/clientes": "Cliente",
  "pessoas/colaboradores": "Colaborador",
  "pessoas/fornecedores": "Fornecedor",
  "pessoas/especificadores": "Especificador",
  "contratos": "Contrato",
  "cronograma/projects": "Projeto",
  "cronograma/projeto": "Projeto",
  "orcamentos": "Orçamento",
  "compras": "Compra",
  "assistencia": "Assistência",
  "usuarios": "Usuário",
  "tarefas": "Tarefa",
  "obras": "Obra",
};

/**
 * Busca o nome real de um registro para usar como título da aba
 * @param rotaBase - A rota base (ex: "pessoas/clientes")
 * @param uuid - O UUID do registro
 * @returns O nome do registro ou um fallback
 */
export async function buscarTituloRegistro(
  rotaBase: string,
  uuid: string
): Promise<string> {
  // Verificar cache primeiro
  const cacheKey = `${rotaBase}:${uuid}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  const config = rotaConfig[rotaBase];
  if (!config) {
    return fallbackNomes[rotaBase] || "Detalhes";
  }

  try {
    const { data, error } = await supabase
      .from(config.tabela)
      .select(config.campo)
      .eq("id", uuid)
      .single();

    if (error || !data) {
      console.warn(`[TabTitle] NÍo encontrou registro: ${rotaBase}/${uuid}`);
      return fallbackNomes[rotaBase] || "Detalhes";
    }

    const nome = String(((data as unknown as Record<string, unknown>)[config.campo]) ?? "");

    // Truncar nomes muito longos
    const nomeFormatado = nome && nome.length > 25 ? nome.substring(0, 22) + "..." : nome || fallbackNomes[rotaBase] || "Detalhes";

    // Salvar no cache
    cache.set(cacheKey, nomeFormatado);

    return nomeFormatado;
  } catch (err) {
    console.error(`[TabTitle] Erro ao buscar título:`, err);
    return fallbackNomes[rotaBase] || "Detalhes";
  }
}

/**
 * Limpa o cache de títulos
 */
export function limparCacheTitulos(): void {
  cache.clear();
}

/**
 * Remove um item específico do cache
 */
export function removerDoCache(rotaBase: string, uuid: string): void {
  const cacheKey = `${rotaBase}:${uuid}`;
  cache.delete(cacheKey);
}

