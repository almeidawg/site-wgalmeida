// ============================================================
// API: Ambientes de Propostas
// ============================================================

import { supabase } from "./supabaseClient";

// ============================================================
// TIPOS
// ============================================================

export interface Ambiente {
  id: string;
  proposta_id: string;
  nucleo_id?: string;
  nome: string;
  largura: number;
  comprimento: number;
  pe_direito: number;
  area_piso: number;
  area_parede: number;
  area_teto: number;
  perimetro: number;
  pavimento?: string | null;
  uso?: string | null;
  area_m2?: number | null;
  perimetro_ml?: number | null;
  pe_direito_m?: number | null;
  ordem?: number;
  observacoes?: string;
  criado_em?: string;
  atualizado_em?: string;
  criado_por?: string;
}

export interface AmbienteInput {
  proposta_id: string;
  nucleo_id?: string;
  nome: string;
  largura: number;
  comprimento: number;
  pe_direito?: number;
  pavimento?: string | null;
  uso?: string | null;
  area_m2?: number | null;
  perimetro_ml?: number | null;
  pe_direito_m?: number | null;
  ordem?: number;
  observacoes?: string;
}

export interface AmbienteResumo extends Ambiente {
  total_itens: number;
  valor_total_itens: number;
  proposta_numero?: string;
  proposta_titulo?: string;
  proposta_status?: string;
}

export interface AmbienteQuantitativo {
  id: string;
  ambiente_id: string;
  tipo: string;
  quantidade: number;
  unidade?: string;
  descricao?: string;
  criado_em?: string;
  atualizado_em?: string;
}

// ============================================================
// FUNÇÕES
// ============================================================

/**
 * Listar todos os ambientes de uma proposta
 */
export async function listarAmbientesPorProposta(
  propostaId: string
): Promise<Ambiente[]> {
  const { data, error } = await supabase
    .from("propostas_ambientes")
    .select("*")
    .eq("proposta_id", propostaId)
    .order("ordem", { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Listar ambientes independente da proposta (usado em visões gerais)
 */
export async function listarAmbientes(): Promise<Ambiente[]> {
  const { data, error } = await supabase
    .from("propostas_ambientes")
    .select("*")
    .order("criado_em", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Listar ambientes com resumo (usando view)
 */
export async function listarAmbientesResumoPorProposta(
  propostaId: string
): Promise<AmbienteResumo[]> {
  const { data, error } = await supabase
    .from("vw_propostas_ambientes_resumo")
    .select("*")
    .eq("proposta_id", propostaId)
    .order("ordem", { ascending: true});

  if (error) throw error;
  return data || [];
}

/**
 * Buscar um ambiente específico
 */
export async function buscarAmbiente(id: string): Promise<Ambiente> {
  const { data, error } = await supabase
    .from("propostas_ambientes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  if (!data) throw new Error("Ambiente não encontrado");

  return data;
}

/**
 * Criar um novo ambiente
 * As áreas sÍo calculadas automaticamente pelo trigger do banco
 */
export async function criarAmbiente(
  ambiente: AmbienteInput
): Promise<Ambiente> {
  const { data, error } = await supabase
    .from("propostas_ambientes")
    .insert({
      proposta_id: ambiente.proposta_id,
      nucleo_id: ambiente.nucleo_id,
      nome: ambiente.nome,
      largura: ambiente.largura,
      comprimento: ambiente.comprimento,
      pe_direito: ambiente.pe_direito || 2.7,
      ordem: ambiente.ordem || 0,
      observacoes: ambiente.observacoes,
      // As áreas serÍo calculadas automaticamente pelo trigger
      area_piso: 0, // Placeholder
      area_parede: 0, // Placeholder
      area_teto: 0, // Placeholder
      perimetro: 0, // Placeholder
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Erro ao criar ambiente");

  return data;
}

/**
 * Criar múltiplos ambientes de uma vez
 */
export async function criarAmbientesEmLote(
  ambientes: AmbienteInput[]
): Promise<Ambiente[]> {
  const ambientesParaInserir = ambientes.map((amb, index) => ({
    proposta_id: amb.proposta_id,
    nucleo_id: amb.nucleo_id,
    nome: amb.nome,
    largura: amb.largura,
    comprimento: amb.comprimento,
    pe_direito: amb.pe_direito || 2.7,
    ordem: amb.ordem ?? index,
    observacoes: amb.observacoes,
    // Placeholders para triggers calcularem
    area_piso: 0,
    area_parede: 0,
    area_teto: 0,
    perimetro: 0,
  }));

  const { data, error } = await supabase
    .from("propostas_ambientes")
    .insert(ambientesParaInserir)
    .select();

  if (error) throw error;
  return data || [];
}

/**
 * Atualizar um ambiente
 */
export async function atualizarAmbiente(
  id: string,
  dados: Partial<AmbienteInput>
): Promise<Ambiente> {
  const { data, error } = await supabase
    .from("propostas_ambientes")
    .update({
      ...dados,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Ambiente não encontrado");

  return data;
}

/**
 * Deletar um ambiente
 */
export async function deletarAmbiente(id: string): Promise<void> {
  const { error } = await supabase
    .from("propostas_ambientes")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/**
 * Deletar todos os ambientes de uma proposta
 */
export async function deletarAmbientesPorProposta(
  propostaId: string
): Promise<void> {
  const { error } = await supabase
    .from("propostas_ambientes")
    .delete()
    .eq("proposta_id", propostaId);

  if (error) throw error;
}

/**
 * Calcular totais de uma lista de ambientes
 */
export function calcularTotaisAmbientes(ambientes: Ambiente[]) {
  return ambientes.reduce(
    (acc, amb) => {
      acc.area_piso_total += amb.area_piso;
      acc.area_parede_total += amb.area_parede;
      acc.area_teto_total += amb.area_teto;
      acc.perimetro_total += amb.perimetro;
      return acc;
    },
    {
      area_piso_total: 0,
      area_parede_total: 0,
      area_teto_total: 0,
      perimetro_total: 0,
    }
  );
}

/**
 * Listar quantitativos de um ambiente
 */
export async function listarQuantitativosAmbiente(
  ambienteId: string
): Promise<AmbienteQuantitativo[]> {
  const { data, error } = await supabase
    .from("ambientes_quantitativos")
    .select("*")
    .eq("ambiente_id", ambienteId);

  if (error) {
    console.error("[listarQuantitativosAmbiente] erro:", error);
    return [];
  }

  return data || [];
}

/**
 * Gerar quantitativos básicos para um ambiente
 */
export async function gerarQuantitativosBasicos(
  ambienteId: string
): Promise<AmbienteQuantitativo[]> {
  const ambiente = await buscarAmbiente(ambienteId);
  if (!ambiente) return [];

  const quantitativos: Partial<AmbienteQuantitativo>[] = [
    {
      ambiente_id: ambienteId,
      tipo: "piso",
      quantidade: ambiente.area_piso,
      unidade: "m2",
      descricao: "Área de piso",
    },
    {
      ambiente_id: ambienteId,
      tipo: "parede",
      quantidade: ambiente.area_parede,
      unidade: "m2",
      descricao: "Área de parede",
    },
    {
      ambiente_id: ambienteId,
      tipo: "teto",
      quantidade: ambiente.area_teto,
      unidade: "m2",
      descricao: "Área de teto",
    },
  ];

  const { data, error } = await supabase
    .from("ambientes_quantitativos")
    .insert(quantitativos as any)
    .select();

  if (error) {
    console.error("[gerarQuantitativosBasicos] erro:", error);
    return [];
  }

  return data || [];
}

/**
 * Recalcular quantitativos de um ambiente
 */
export async function recalcularQuantitativosAmbiente(
  ambienteId: string
): Promise<AmbienteQuantitativo[]> {
  // Deletar quantitativos existentes
  const { error: deleteError } = await supabase
    .from("ambientes_quantitativos")
    .delete()
    .eq("ambiente_id", ambienteId);

  if (deleteError) {
    console.error("[recalcularQuantitativosAmbiente] erro ao deletar:", deleteError);
  }

  // Gerar novos quantitativos
  return gerarQuantitativosBasicos(ambienteId);
}


