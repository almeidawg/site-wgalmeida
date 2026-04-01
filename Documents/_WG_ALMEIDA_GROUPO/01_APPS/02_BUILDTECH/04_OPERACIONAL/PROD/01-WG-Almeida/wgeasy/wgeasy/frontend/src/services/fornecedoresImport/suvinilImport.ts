// ============================================================
// Import: Cores Suvinil (Paleta de Tintas)
// Sistema WG Easy 2026 - Grupo WG Almeida
// ============================================================

import { supabase } from "@/lib/supabaseClient";

// ============================================================
// TIPOS
// ============================================================

interface CorSuvinil {
  codigo: string;
  nome: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  familia: string;
  colecao?: string;
}

interface ImportResult {
  sucesso: boolean;
  total_importados: number;
  total_atualizados: number;
  erros: string[];
}

// ============================================================
// PALETA DE CORES SUVINIL
// Cores mais usadas em projetos residenciais
// Organizado por família de cores
// ============================================================

const CORES_SUVINIL: CorSuvinil[] = [
  // ============ BRANCOS E NEUTROS ============
  { codigo: "W001", nome: "Branco Neve", hex: "#FFFFFF", rgb: { r: 255, g: 255, b: 255 }, familia: "Brancos" },
  { codigo: "W002", nome: "Branco Gelo", hex: "#F8F8F8", rgb: { r: 248, g: 248, b: 248 }, familia: "Brancos" },
  { codigo: "W003", nome: "Branco AlgodÍo", hex: "#FAF9F6", rgb: { r: 250, g: 249, b: 246 }, familia: "Brancos" },
  { codigo: "W004", nome: "Branco Pérola", hex: "#F5F5F0", rgb: { r: 245, g: 245, b: 240 }, familia: "Brancos" },
  { codigo: "W005", nome: "Branco Linho", hex: "#F0EBE3", rgb: { r: 240, g: 235, b: 227 }, familia: "Brancos" },
  { codigo: "W006", nome: "Palha", hex: "#EDE6D6", rgb: { r: 237, g: 230, b: 214 }, familia: "Brancos" },

  // ============ CINZAS ============
  { codigo: "G001", nome: "Cinza Névoa", hex: "#E8E8E8", rgb: { r: 232, g: 232, b: 232 }, familia: "Cinzas" },
  { codigo: "G002", nome: "Cinza Claro", hex: "#D3D3D3", rgb: { r: 211, g: 211, b: 211 }, familia: "Cinzas" },
  { codigo: "G003", nome: "Cinza Urbano", hex: "#B0B0B0", rgb: { r: 176, g: 176, b: 176 }, familia: "Cinzas" },
  { codigo: "G004", nome: "Cinza Londres", hex: "#8C8C8C", rgb: { r: 140, g: 140, b: 140 }, familia: "Cinzas" },
  { codigo: "G005", nome: "Cinza Chumbo", hex: "#5E5E5E", rgb: { r: 94, g: 94, b: 94 }, familia: "Cinzas" },
  { codigo: "G006", nome: "Grafite", hex: "#4A4A4A", rgb: { r: 74, g: 74, b: 74 }, familia: "Cinzas" },
  { codigo: "G007", nome: "Cinza Escuro", hex: "#363636", rgb: { r: 54, g: 54, b: 54 }, familia: "Cinzas" },

  // ============ BEGES E MARRONS ============
  { codigo: "B001", nome: "Bege Claro", hex: "#F5E6D3", rgb: { r: 245, g: 230, b: 211 }, familia: "Beges" },
  { codigo: "B002", nome: "Areia", hex: "#E8DCC8", rgb: { r: 232, g: 220, b: 200 }, familia: "Beges" },
  { codigo: "B003", nome: "Camurça", hex: "#D4C4A8", rgb: { r: 212, g: 196, b: 168 }, familia: "Beges" },
  { codigo: "B004", nome: "Cappuccino", hex: "#C4A77D", rgb: { r: 196, g: 167, b: 125 }, familia: "Beges" },
  { codigo: "B005", nome: "Caramelo", hex: "#A67B5B", rgb: { r: 166, g: 123, b: 91 }, familia: "Beges" },
  { codigo: "B006", nome: "Chocolate", hex: "#5C4033", rgb: { r: 92, g: 64, b: 51 }, familia: "Beges" },
  { codigo: "B007", nome: "Marrom Café", hex: "#4A3728", rgb: { r: 74, g: 55, b: 40 }, familia: "Beges" },

  // ============ AZUIS ============
  { codigo: "A001", nome: "Azul Céu", hex: "#E3F2FD", rgb: { r: 227, g: 242, b: 253 }, familia: "Azuis" },
  { codigo: "A002", nome: "Azul Serenidade", hex: "#BBDEFB", rgb: { r: 187, g: 222, b: 251 }, familia: "Azuis" },
  { codigo: "A003", nome: "Azul Claro", hex: "#90CAF9", rgb: { r: 144, g: 202, b: 249 }, familia: "Azuis" },
  { codigo: "A004", nome: "Azul Oceano", hex: "#42A5F5", rgb: { r: 66, g: 165, b: 245 }, familia: "Azuis" },
  { codigo: "A005", nome: "Azul Royal", hex: "#1976D2", rgb: { r: 25, g: 118, b: 210 }, familia: "Azuis" },
  { codigo: "A006", nome: "Azul Marinho", hex: "#0D47A1", rgb: { r: 13, g: 71, b: 161 }, familia: "Azuis" },
  { codigo: "A007", nome: "Azul Petróleo", hex: "#006064", rgb: { r: 0, g: 96, b: 100 }, familia: "Azuis" },
  { codigo: "A008", nome: "Azul Acinzentado", hex: "#607D8B", rgb: { r: 96, g: 125, b: 139 }, familia: "Azuis" },

  // ============ VERDES ============
  { codigo: "V001", nome: "Verde Água", hex: "#E0F2F1", rgb: { r: 224, g: 242, b: 241 }, familia: "Verdes" },
  { codigo: "V002", nome: "Verde Menta", hex: "#B2DFDB", rgb: { r: 178, g: 223, b: 219 }, familia: "Verdes" },
  { codigo: "V003", nome: "Verde Claro", hex: "#80CBC4", rgb: { r: 128, g: 203, b: 196 }, familia: "Verdes" },
  { codigo: "V004", nome: "Verde Jade", hex: "#26A69A", rgb: { r: 38, g: 166, b: 154 }, familia: "Verdes" },
  { codigo: "V005", nome: "Verde Folha", hex: "#4CAF50", rgb: { r: 76, g: 175, b: 80 }, familia: "Verdes" },
  { codigo: "V006", nome: "Verde Musgo", hex: "#558B2F", rgb: { r: 85, g: 139, b: 47 }, familia: "Verdes" },
  { codigo: "V007", nome: "Verde Escuro", hex: "#1B5E20", rgb: { r: 27, g: 94, b: 32 }, familia: "Verdes" },
  { codigo: "V008", nome: "Verde Militar", hex: "#5D6D3F", rgb: { r: 93, g: 109, b: 63 }, familia: "Verdes" },

  // ============ AMARELOS E LARANJAS ============
  { codigo: "Y001", nome: "Amarelo Claro", hex: "#FFF9C4", rgb: { r: 255, g: 249, b: 196 }, familia: "Amarelos" },
  { codigo: "Y002", nome: "Amarelo Pastel", hex: "#FFF59D", rgb: { r: 255, g: 245, b: 157 }, familia: "Amarelos" },
  { codigo: "Y003", nome: "Amarelo Sol", hex: "#FFEB3B", rgb: { r: 255, g: 235, b: 59 }, familia: "Amarelos" },
  { codigo: "Y004", nome: "Amarelo Ouro", hex: "#FFC107", rgb: { r: 255, g: 193, b: 7 }, familia: "Amarelos" },
  { codigo: "O001", nome: "Pêssego", hex: "#FFCCBC", rgb: { r: 255, g: 204, b: 188 }, familia: "Laranjas" },
  { codigo: "O002", nome: "Coral", hex: "#FF8A65", rgb: { r: 255, g: 138, b: 101 }, familia: "Laranjas" },
  { codigo: "O003", nome: "Laranja", hex: "#FF7043", rgb: { r: 255, g: 112, b: 67 }, familia: "Laranjas" },
  { codigo: "O004", nome: "Terracota", hex: "#BF5B3C", rgb: { r: 191, g: 91, b: 60 }, familia: "Laranjas" },

  // ============ ROSAS E VERMELHOS ============
  { codigo: "R001", nome: "Rosa Claro", hex: "#FCE4EC", rgb: { r: 252, g: 228, b: 236 }, familia: "Rosas" },
  { codigo: "R002", nome: "Rosa Antigo", hex: "#F8BBD9", rgb: { r: 248, g: 187, b: 217 }, familia: "Rosas" },
  { codigo: "R003", nome: "Rosa Queimado", hex: "#C48B9F", rgb: { r: 196, g: 139, b: 159 }, familia: "Rosas" },
  { codigo: "R004", nome: "Nude Rosé", hex: "#E8D5D0", rgb: { r: 232, g: 213, b: 208 }, familia: "Rosas" },
  { codigo: "R005", nome: "Vermelho Tomate", hex: "#E53935", rgb: { r: 229, g: 57, b: 53 }, familia: "Vermelhos" },
  { codigo: "R006", nome: "Vermelho Escuro", hex: "#B71C1C", rgb: { r: 183, g: 28, b: 28 }, familia: "Vermelhos" },
  { codigo: "R007", nome: "Bordô", hex: "#7B1F3C", rgb: { r: 123, g: 31, b: 60 }, familia: "Vermelhos" },

  // ============ ROXOS E LILASES ============
  { codigo: "P001", nome: "Lavanda", hex: "#E1BEE7", rgb: { r: 225, g: 190, b: 231 }, familia: "Roxos" },
  { codigo: "P002", nome: "Lilás", hex: "#CE93D8", rgb: { r: 206, g: 147, b: 216 }, familia: "Roxos" },
  { codigo: "P003", nome: "Violeta", hex: "#9C27B0", rgb: { r: 156, g: 39, b: 176 }, familia: "Roxos" },
  { codigo: "P004", nome: "Roxo", hex: "#7B1FA2", rgb: { r: 123, g: 31, b: 162 }, familia: "Roxos" },
  { codigo: "P005", nome: "Berinjela", hex: "#4A148C", rgb: { r: 74, g: 20, b: 140 }, familia: "Roxos" },

  // ============ PRETOS ============
  { codigo: "K001", nome: "Preto Fosco", hex: "#212121", rgb: { r: 33, g: 33, b: 33 }, familia: "Pretos" },
  { codigo: "K002", nome: "Preto Absoluto", hex: "#000000", rgb: { r: 0, g: 0, b: 0 }, familia: "Pretos" },
];

// ============================================================
// FUNÇÕES DE IMPORTAÇÍO
// ============================================================

/**
 * Importar cores Suvinil para a tabela cores_suvinil
 */
export async function importarCoresSuvinil(): Promise<ImportResult> {
  const resultado: ImportResult = {
    sucesso: true,
    total_importados: 0,
    total_atualizados: 0,
    erros: [],
  };

  for (const cor of CORES_SUVINIL) {
    try {
      // Verificar se já existe
      const { data: existente } = await supabase
        .from("cores_suvinil")
        .select("id")
        .eq("codigo", cor.codigo)
        .single();

      const corData = {
        codigo: cor.codigo,
        nome: cor.nome,
        hex: cor.hex,
        rgb: cor.rgb,
        familia: cor.familia,
        colecao: cor.colecao,
      };

      if (existente) {
        // Atualizar
        await supabase
          .from("cores_suvinil")
          .update(corData)
          .eq("id", existente.id);
        resultado.total_atualizados++;
      } else {
        // Inserir
        await supabase.from("cores_suvinil").insert(corData);
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
 * Buscar cores por família
 */
export async function buscarCoresPorFamilia(familia: string): Promise<CorSuvinil[]> {
  const { data, error } = await supabase
    .from("cores_suvinil")
    .select("*")
    .eq("familia", familia)
    .order("nome");

  if (error) throw error;
  return data as CorSuvinil[];
}

/**
 * Buscar todas as cores
 */
export async function buscarTodasCores(): Promise<CorSuvinil[]> {
  const { data, error } = await supabase
    .from("cores_suvinil")
    .select("*")
    .order("familia", { ascending: true })
    .order("nome", { ascending: true });

  if (error) throw error;
  return data as CorSuvinil[];
}

/**
 * Buscar cor por código
 */
export async function buscarCorPorCodigo(codigo: string): Promise<CorSuvinil | null> {
  const { data, error } = await supabase
    .from("cores_suvinil")
    .select("*")
    .eq("codigo", codigo)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data as CorSuvinil | null;
}

/**
 * Buscar cores semelhantes (por hex aproximado)
 */
export function buscarCoresSemelhantes(hexBase: string, limite: number = 5): CorSuvinil[] {
  // Converter hex para RGB
  const r1 = parseInt(hexBase.slice(1, 3), 16);
  const g1 = parseInt(hexBase.slice(3, 5), 16);
  const b1 = parseInt(hexBase.slice(5, 7), 16);

  // Calcular distância de cor e ordenar
  const coresComDistancia = CORES_SUVINIL.map((cor) => {
    const r2 = cor.rgb.r;
    const g2 = cor.rgb.g;
    const b2 = cor.rgb.b;
    const distancia = Math.sqrt(
      Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2)
    );
    return { ...cor, distancia };
  });

  coresComDistancia.sort((a, b) => a.distancia - b.distancia);

  return coresComDistancia.slice(0, limite);
}

/**
 * Listar famílias de cores disponíveis
 */
export function getFamiliasCores(): string[] {
  return [...new Set(CORES_SUVINIL.map((c) => c.familia))];
}

/**
 * Obter cores locais (sem consultar banco)
 */
export function getCoresLocais(): CorSuvinil[] {
  return CORES_SUVINIL;
}

/**
 * Filtrar cores locais por família
 */
export function filtrarCoresLocaisPorFamilia(familia: string): CorSuvinil[] {
  return CORES_SUVINIL.filter((c) => c.familia === familia);
}

