// ============================================================
// Import: Catálogo Sudati (MDF e Puxadores)
// Sistema WG Easy 2026 - Grupo WG Almeida
// ============================================================

import { supabase } from "@/lib/supabaseClient";

// ============================================================
// TIPOS
// ============================================================

interface CorMDF {
  codigo: string;
  nome: string;
  hex: string;
  categoria: "liso" | "madeirado" | "metalizado" | "especial";
  imagem_url?: string;
}

interface Puxador {
  codigo: string;
  nome: string;
  estilo: "moderno" | "classico" | "minimalista" | "industrial";
  material: string;
  acabamento: string;
  tamanhos: string[];
  imagem_url?: string;
  preco_referencia?: number;
}

interface ImportResult {
  sucesso: boolean;
  total_importados: number;
  total_atualizados: number;
  erros: string[];
}

// ============================================================
// CATÁLOGO DE CORES MDF - SUDATI
// Cores mais usadas em projetos de marcenaria
// ============================================================

const CORES_MDF_SUDATI: CorMDF[] = [
  // Lisos - Neutros
  { codigo: "SUD-001", nome: "Branco Neve", hex: "#FFFFFF", categoria: "liso" },
  { codigo: "SUD-002", nome: "Branco Ártico", hex: "#F5F5F5", categoria: "liso" },
  { codigo: "SUD-003", nome: "Cinza Claro", hex: "#D3D3D3", categoria: "liso" },
  { codigo: "SUD-004", nome: "Cinza Médio", hex: "#A9A9A9", categoria: "liso" },
  { codigo: "SUD-005", nome: "Cinza Grafite", hex: "#4A4A4A", categoria: "liso" },
  { codigo: "SUD-006", nome: "Preto Fosco", hex: "#1A1A1A", categoria: "liso" },
  { codigo: "SUD-007", nome: "Bege Champagne", hex: "#F5E6D3", categoria: "liso" },
  { codigo: "SUD-008", nome: "Nude Rosé", hex: "#E8D5D0", categoria: "liso" },

  // Madeirados - Claros
  { codigo: "SUD-101", nome: "Carvalho Natural", hex: "#C4A76C", categoria: "madeirado" },
  { codigo: "SUD-102", nome: "Carvalho Mel", hex: "#D4A56A", categoria: "madeirado" },
  { codigo: "SUD-103", nome: "Freijó Natural", hex: "#C9B896", categoria: "madeirado" },
  { codigo: "SUD-104", nome: "Cedro", hex: "#A67B5B", categoria: "madeirado" },
  { codigo: "SUD-105", nome: "Pinus", hex: "#E5D5B5", categoria: "madeirado" },
  { codigo: "SUD-106", nome: "Faia", hex: "#D4BC94", categoria: "madeirado" },

  // Madeirados - Médios
  { codigo: "SUD-111", nome: "Nogueira", hex: "#5D4037", categoria: "madeirado" },
  { codigo: "SUD-112", nome: "Imbuia", hex: "#6D4C41", categoria: "madeirado" },
  { codigo: "SUD-113", nome: "Castanho", hex: "#8B4513", categoria: "madeirado" },
  { codigo: "SUD-114", nome: "Mogno", hex: "#6B3A2E", categoria: "madeirado" },

  // Madeirados - Escuros
  { codigo: "SUD-121", nome: "Tabaco", hex: "#3E2723", categoria: "madeirado" },
  { codigo: "SUD-122", nome: "Wengue", hex: "#2C1A1A", categoria: "madeirado" },
  { codigo: "SUD-123", nome: "Ébano", hex: "#1C1C1C", categoria: "madeirado" },

  // Metalizados
  { codigo: "SUD-201", nome: "Prata Escovado", hex: "#C0C0C0", categoria: "metalizado" },
  { codigo: "SUD-202", nome: "Champagne Metalizado", hex: "#D4AF37", categoria: "metalizado" },
  { codigo: "SUD-203", nome: "Bronze Fosco", hex: "#8B7355", categoria: "metalizado" },
  { codigo: "SUD-204", nome: "Cobre Escovado", hex: "#B87333", categoria: "metalizado" },

  // Especiais
  { codigo: "SUD-301", nome: "Concreto", hex: "#8B8B8B", categoria: "especial" },
  { codigo: "SUD-302", nome: "Mármore Carrara", hex: "#F0EDE8", categoria: "especial" },
  { codigo: "SUD-303", nome: "Terracota", hex: "#CC6B49", categoria: "especial" },
];

// ============================================================
// CATÁLOGO DE PUXADORES - SUDATI
// ============================================================

const PUXADORES_SUDATI: Puxador[] = [
  // Modernos
  {
    codigo: "PUX-M001",
    nome: "Linha Reta",
    estilo: "moderno",
    material: "Alumínio",
    acabamento: "Fosco",
    tamanhos: ["128mm", "160mm", "192mm", "256mm"],
    preco_referencia: 45.00,
  },
  {
    codigo: "PUX-M002",
    nome: "Perfil Slim",
    estilo: "moderno",
    material: "Alumínio",
    acabamento: "Anodizado",
    tamanhos: ["160mm", "192mm", "320mm"],
    preco_referencia: 55.00,
  },
  {
    codigo: "PUX-M003",
    nome: "Cava Embutida",
    estilo: "moderno",
    material: "Alumínio",
    acabamento: "Preto Fosco",
    tamanhos: ["Por metro linear"],
    preco_referencia: 120.00,
  },

  // Minimalistas
  {
    codigo: "PUX-N001",
    nome: "Touch Open",
    estilo: "minimalista",
    material: "N/A",
    acabamento: "Sistema Push-to-Open",
    tamanhos: ["Universal"],
    preco_referencia: 35.00,
  },
  {
    codigo: "PUX-N002",
    nome: "Gola Invisível",
    estilo: "minimalista",
    material: "MDF",
    acabamento: "Mesmo painel",
    tamanhos: ["45mm"],
    preco_referencia: 0, // Incluso no painel
  },

  // Clássicos
  {
    codigo: "PUX-C001",
    nome: "Concha Colonial",
    estilo: "classico",
    material: "Zamac",
    acabamento: "Cromado",
    tamanhos: ["64mm", "96mm"],
    preco_referencia: 38.00,
  },
  {
    codigo: "PUX-C002",
    nome: "BotÍo Redondo",
    estilo: "classico",
    material: "LatÍo",
    acabamento: "Dourado Envelhecido",
    tamanhos: ["25mm", "30mm"],
    preco_referencia: 28.00,
  },

  // Industriais
  {
    codigo: "PUX-I001",
    nome: "Barra Industrial",
    estilo: "industrial",
    material: "Ferro",
    acabamento: "Preto Fosco",
    tamanhos: ["160mm", "256mm", "320mm"],
    preco_referencia: 65.00,
  },
  {
    codigo: "PUX-I002",
    nome: "Tubo Escovado",
    estilo: "industrial",
    material: "Aço Inox",
    acabamento: "Escovado",
    tamanhos: ["192mm", "320mm", "480mm"],
    preco_referencia: 85.00,
  },
];

// ============================================================
// FUNÇÕES DE IMPORTAÇÍO
// ============================================================

/**
 * Buscar ID do fornecedor Sudati
 */
async function getFornecedorSudatiId(): Promise<string | null> {
  const { data, error } = await supabase
    .from("sistema_fornecedores_config")
    .select("id")
    .eq("codigo", "sudati")
    .single();

  if (error || !data) {
    console.error("Fornecedor Sudati nÍo encontrado:", error);
    return null;
  }

  return data.id;
}

/**
 * Importar cores de MDF para o catálogo
 */
export async function importarCoresMDF(): Promise<ImportResult> {
  const resultado: ImportResult = {
    sucesso: true,
    total_importados: 0,
    total_atualizados: 0,
    erros: [],
  };

  const fornecedorId = await getFornecedorSudatiId();
  if (!fornecedorId) {
    resultado.sucesso = false;
    resultado.erros.push("Fornecedor Sudati nÍo encontrado no sistema");
    return resultado;
  }

  for (const cor of CORES_MDF_SUDATI) {
    try {
      // Verificar se já existe
      const { data: existente } = await supabase
        .from("fornecedores_catalogo")
        .select("id")
        .eq("codigo_produto", cor.codigo)
        .eq("fornecedor_id", fornecedorId)
        .single();

      const produtoData = {
        fornecedor_id: fornecedorId,
        codigo_produto: cor.codigo,
        nome: cor.nome,
        categoria: "mdf",
        subcategoria: cor.categoria,
        cores_disponiveis: [{ hex: cor.hex, nome: cor.nome }],
        especificacoes: {
          tipo: "MDF",
          espessuras: ["15mm", "18mm", "25mm"],
          dimensoes_chapa: "2750x1850mm",
        },
        imagem_url: cor.imagem_url,
        ativo: true,
      };

      if (existente) {
        // Atualizar
        await supabase
          .from("fornecedores_catalogo")
          .update(produtoData)
          .eq("id", existente.id);
        resultado.total_atualizados++;
      } else {
        // Inserir
        await supabase.from("fornecedores_catalogo").insert(produtoData);
        resultado.total_importados++;
      }
    } catch (err) {
      resultado.erros.push(`Erro ao importar ${cor.nome}: ${(err as Error).message}`);
    }
  }

  resultado.sucesso = resultado.erros.length === 0;
  return resultado;
}

/**
 * Importar puxadores para o catálogo
 */
export async function importarPuxadores(): Promise<ImportResult> {
  const resultado: ImportResult = {
    sucesso: true,
    total_importados: 0,
    total_atualizados: 0,
    erros: [],
  };

  const fornecedorId = await getFornecedorSudatiId();
  if (!fornecedorId) {
    resultado.sucesso = false;
    resultado.erros.push("Fornecedor Sudati nÍo encontrado no sistema");
    return resultado;
  }

  for (const puxador of PUXADORES_SUDATI) {
    try {
      // Verificar se já existe
      const { data: existente } = await supabase
        .from("fornecedores_catalogo")
        .select("id")
        .eq("codigo_produto", puxador.codigo)
        .eq("fornecedor_id", fornecedorId)
        .single();

      const produtoData = {
        fornecedor_id: fornecedorId,
        codigo_produto: puxador.codigo,
        nome: puxador.nome,
        categoria: "puxadores",
        subcategoria: puxador.estilo,
        preco_referencia: puxador.preco_referencia,
        acabamentos: [puxador.acabamento],
        dimensoes: { tamanhos: puxador.tamanhos },
        especificacoes: {
          material: puxador.material,
          acabamento: puxador.acabamento,
        },
        imagem_url: puxador.imagem_url,
        ativo: true,
      };

      if (existente) {
        // Atualizar
        await supabase
          .from("fornecedores_catalogo")
          .update(produtoData)
          .eq("id", existente.id);
        resultado.total_atualizados++;
      } else {
        // Inserir
        await supabase.from("fornecedores_catalogo").insert(produtoData);
        resultado.total_importados++;
      }
    } catch (err) {
      resultado.erros.push(`Erro ao importar ${puxador.nome}: ${(err as Error).message}`);
    }
  }

  resultado.sucesso = resultado.erros.length === 0;
  return resultado;
}

/**
 * Importar todo o catálogo Sudati
 */
export async function importarCatalogoSudatiCompleto(): Promise<{
  cores: ImportResult;
  puxadores: ImportResult;
}> {
  console.log("Iniciando importaçÍo do catálogo Sudati...");

  const cores = await importarCoresMDF();
  console.log(`Cores MDF: ${cores.total_importados} importadas, ${cores.total_atualizados} atualizadas`);

  const puxadores = await importarPuxadores();
  console.log(`Puxadores: ${puxadores.total_importados} importados, ${puxadores.total_atualizados} atualizados`);

  return { cores, puxadores };
}

/**
 * Listar cores MDF disponíveis (para uso em componentes)
 */
export function getCoreMDFDisponiveis(): CorMDF[] {
  return CORES_MDF_SUDATI;
}

/**
 * Listar puxadores disponíveis (para uso em componentes)
 */
export function getPuxadoresDisponiveis(): Puxador[] {
  return PUXADORES_SUDATI;
}

/**
 * Buscar cor MDF por código
 */
export function getCorMDFPorCodigo(codigo: string): CorMDF | undefined {
  return CORES_MDF_SUDATI.find((c) => c.codigo === codigo);
}

/**
 * Filtrar cores por categoria
 */
export function filtrarCoresPorCategoria(categoria: CorMDF["categoria"]): CorMDF[] {
  return CORES_MDF_SUDATI.filter((c) => c.categoria === categoria);
}

/**
 * Filtrar puxadores por estilo
 */
export function filtrarPuxadoresPorEstilo(estilo: Puxador["estilo"]): Puxador[] {
  return PUXADORES_SUDATI.filter((p) => p.estilo === estilo);
}

