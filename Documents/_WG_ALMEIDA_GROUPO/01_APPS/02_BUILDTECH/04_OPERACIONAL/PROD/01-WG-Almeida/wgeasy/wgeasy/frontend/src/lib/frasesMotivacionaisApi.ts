// ============================================================
// API: Frases Motivacionais
// Sistema WG Easy - Grupo WG Almeida
// ============================================================
//
// SUPABASE STUDIO - TABELA:
// - frases_motivacionais: https://supabase.com/dashboard/project/ahlqzzkxuutwoepirpzr/editor/frases_motivacionais
//
// ============================================================

import { supabase } from "./supabaseClient";

// ============================================================
// TIPOS
// ============================================================

export type CategoriaFrase = "lideranca" | "sucesso" | "equipe" | "cliente" | "excelencia";

export interface FraseMotivacional {
  id: string;
  frase: string;
  autor: string;
  categoria: CategoriaFrase | null;
  ativo: boolean;
  created_at: string;
}

// ============================================================
// CACHE LOCAL
// Para evitar múltiplas requisições no mesmo dia
// ============================================================

let cacheData: {
  frases: FraseMotivacional[];
  fraseDoDia: FraseMotivacional | null;
  dataCache: string | null;
} = {
  frases: [],
  fraseDoDia: null,
  dataCache: null,
};

// ============================================================
// FUNÇÕES
// ============================================================

/**
 * Buscar todas as frases ativas
 */
export async function listarFrases(): Promise<FraseMotivacional[]> {
  // Verificar cache
  const hoje = new Date().toISOString().split("T")[0];
  if (cacheData.dataCache === hoje && cacheData.frases.length > 0) {
    return cacheData.frases;
  }

  const { data, error } = await supabase
    .from("frases_motivacionais")
    .select("*")
    .eq("ativo", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[listarFrases] Erro:", error);
    return [];
  }

  // Atualizar cache
  cacheData.frases = data || [];
  cacheData.dataCache = hoje;

  return data || [];
}

/**
 * Obter a frase do dia
 * Usa o dia do ano como seed para consistência durante o dia
 */
export async function obterFraseDoDia(): Promise<FraseMotivacional | null> {
  // Verificar cache
  const hoje = new Date().toISOString().split("T")[0];
  if (cacheData.dataCache === hoje && cacheData.fraseDoDia) {
    return cacheData.fraseDoDia;
  }

  const frases = await listarFrases();

  if (frases.length === 0) {
    return null;
  }

  // Usar o dia do ano como índice (consistente durante todo o dia)
  const agora = new Date();
  const inicioAno = new Date(agora.getFullYear(), 0, 0);
  const diff = agora.getTime() - inicioAno.getTime();
  const diaDoAno = Math.floor(diff / (1000 * 60 * 60 * 24));

  // Selecionar frase baseada no dia do ano
  const indice = diaDoAno % frases.length;
  const fraseDoDia = frases[indice];

  // Atualizar cache
  cacheData.fraseDoDia = fraseDoDia;
  cacheData.dataCache = hoje;

  return fraseDoDia;
}

/**
 * Obter frase aleatória
 */
export async function obterFraseAleatoria(): Promise<FraseMotivacional | null> {
  const frases = await listarFrases();

  if (frases.length === 0) {
    return null;
  }

  const indice = Math.floor(Math.random() * frases.length);
  return frases[indice];
}

/**
 * Buscar frases por categoria
 */
export async function buscarFrasesPorCategoria(
  categoria: CategoriaFrase
): Promise<FraseMotivacional[]> {
  const { data, error } = await supabase
    .from("frases_motivacionais")
    .select("*")
    .eq("ativo", true)
    .eq("categoria", categoria)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[buscarFrasesPorCategoria] Erro:", error);
    return [];
  }

  return data || [];
}

/**
 * Limpar cache (útil para forçar refresh)
 */
export function limparCache(): void {
  cacheData = {
    frases: [],
    fraseDoDia: null,
    dataCache: null,
  };
}

// ============================================================
// FRASES FALLBACK (caso o banco esteja vazio)
// ============================================================

export const FRASES_FALLBACK: FraseMotivacional[] = [
  // Filósofos
  {
    id: "fallback-1",
    frase: "Excelência não é um ato, é um hábito.",
    autor: "Aristóteles",
    categoria: "excelencia",
    ativo: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "fallback-2",
    frase: "A única coisa que sei é que nada sei.",
    autor: "Sócrates",
    categoria: "lideranca",
    ativo: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "fallback-3",
    frase: "O homem é a medida de todas as coisas.",
    autor: "Protágoras",
    categoria: "lideranca",
    ativo: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "fallback-4",
    frase: "Penso, logo existo.",
    autor: "René Descartes",
    categoria: "excelencia",
    ativo: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "fallback-5",
    frase: "Aquele que tem um porquê para viver pode suportar quase qualquer como.",
    autor: "Friedrich Nietzsche",
    categoria: "sucesso",
    ativo: true,
    created_at: new Date().toISOString(),
  },
  // Cientistas
  {
    id: "fallback-6",
    frase: "A imaginaçÍo é mais importante que o conhecimento.",
    autor: "Albert Einstein",
    categoria: "excelencia",
    ativo: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "fallback-7",
    frase: "Gênio é 1% inspiraçÍo e 99% transpiraçÍo.",
    autor: "Thomas Edison",
    categoria: "sucesso",
    ativo: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "fallback-8",
    frase: "Se vi mais longe, foi por estar sobre ombros de gigantes.",
    autor: "Isaac Newton",
    categoria: "equipe",
    ativo: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "fallback-9",
    frase: "A ciência nunca resolve um problema sem criar pelo menos outros dez.",
    autor: "George Bernard Shaw",
    categoria: "lideranca",
    ativo: true,
    created_at: new Date().toISOString(),
  },
  // Líderes e Estadistas
  {
    id: "fallback-10",
    frase: "O sucesso é ir de fracasso em fracasso sem perder o entusiasmo.",
    autor: "Winston Churchill",
    categoria: "sucesso",
    ativo: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "fallback-11",
    frase: "Seja a mudança que você quer ver no mundo.",
    autor: "Mahatma Gandhi",
    categoria: "lideranca",
    ativo: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "fallback-12",
    frase: "Eu tenho um sonho.",
    autor: "Martin Luther King Jr.",
    categoria: "cliente",
    ativo: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "fallback-13",
    frase: "A educaçÍo é a arma mais poderosa que você pode usar para mudar o mundo.",
    autor: "Nelson Mandela",
    categoria: "lideranca",
    ativo: true,
    created_at: new Date().toISOString(),
  },
  // Artistas e Escritores
  {
    id: "fallback-14",
    frase: "A simplicidade é o último grau de sofisticaçÍo.",
    autor: "Leonardo da Vinci",
    categoria: "excelencia",
    ativo: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "fallback-15",
    frase: "A arte é a mentira que nos permite conhecer a verdade.",
    autor: "Pablo Picasso",
    categoria: "excelencia",
    ativo: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "fallback-16",
    frase: "Há mais coisas entre o céu e a terra do que sonha nossa filosofia.",
    autor: "William Shakespeare",
    categoria: "cliente",
    ativo: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "fallback-17",
    frase: "A felicidade não é algo pronto. Ela vem das suas próprias ações.",
    autor: "Dalai Lama",
    categoria: "sucesso",
    ativo: true,
    created_at: new Date().toISOString(),
  },
  // Empreendedores Modernos
  {
    id: "fallback-18",
    frase: "Sua marca é o que as pessoas dizem sobre você quando você não está na sala.",
    autor: "Jeff Bezos",
    categoria: "cliente",
    ativo: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "fallback-19",
    frase: "Fique faminto, fique tolo.",
    autor: "Steve Jobs",
    categoria: "sucesso",
    ativo: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "fallback-20",
    frase: "Se você quer algo que nunca teve, precisa fazer algo que nunca fez.",
    autor: "Thomas Jefferson",
    categoria: "lideranca",
    ativo: true,
    created_at: new Date().toISOString(),
  },
  // Pensadores Brasileiros
  {
    id: "fallback-21",
    frase: "A liberdade é um bem supremo porque sem ela todas as outras sÍo vÍs.",
    autor: "Rui Barbosa",
    categoria: "lideranca",
    ativo: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "fallback-22",
    frase: "Ensinar não é transferir conhecimento, mas criar as possibilidades para a sua produçÍo.",
    autor: "Paulo Freire",
    categoria: "equipe",
    ativo: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "fallback-23",
    frase: "O correr da vida embrulha tudo. A vida é assim: esquenta e esfria.",
    autor: "GuimarÍes Rosa",
    categoria: "cliente",
    ativo: true,
    created_at: new Date().toISOString(),
  },
  // Mais Filósofos
  {
    id: "fallback-24",
    frase: "Conhece-te a ti mesmo.",
    autor: "Oráculo de Delfos",
    categoria: "excelencia",
    ativo: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "fallback-25",
    frase: "A vida sem exame não vale a pena ser vivida.",
    autor: "PlatÍo",
    categoria: "lideranca",
    ativo: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "fallback-26",
    frase: "A persistência é o caminho do êxito.",
    autor: "Charles Chaplin",
    categoria: "sucesso",
    ativo: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "fallback-27",
    frase: "Grandes mentes discutem ideias; mentes médias discutem eventos; mentes pequenas discutem pessoas.",
    autor: "Eleanor Roosevelt",
    categoria: "lideranca",
    ativo: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "fallback-28",
    frase: "O único modo de fazer um excelente trabalho é amar o que você faz.",
    autor: "Steve Jobs",
    categoria: "excelencia",
    ativo: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "fallback-29",
    frase: "não é a espécie mais forte que sobrevive, mas a que melhor se adapta às mudanças.",
    autor: "Charles Darwin",
    categoria: "sucesso",
    ativo: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "fallback-30",
    frase: "O segredo para avançar é começar.",
    autor: "Mark Twain",
    categoria: "sucesso",
    ativo: true,
    created_at: new Date().toISOString(),
  },
];

/**
 * Obter frase do dia com fallback
 * Agora retorna frase aleatória para mais variedade
 */
export async function obterFraseDoDiaComFallback(): Promise<FraseMotivacional> {
  // Tentar buscar do banco primeiro
  const frases = await listarFrases();

  // Se tem frases no banco, retorna aleatória
  if (frases.length > 0) {
    const indice = Math.floor(Math.random() * frases.length);
    return frases[indice];
  }

  // Usar fallback se o banco estiver vazio - também aleatório
  const indice = Math.floor(Math.random() * FRASES_FALLBACK.length);
  return FRASES_FALLBACK[indice];
}


