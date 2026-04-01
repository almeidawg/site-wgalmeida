// ============================================================
// API: Tipos de Ambiente
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { supabaseRaw as supabase } from "@/lib/supabaseClient";

// ============================================================
// Tipos
// ============================================================

export interface TipoAmbienteDB {
  id: string;
  codigo: string;
  nome: string;
  ordem: number;
  ativo: boolean;
  criado_por: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface TipoAmbienteInput {
  codigo: string;
  nome: string;
  ordem?: number;
}

// ============================================================
// Funções CRUD
// ============================================================

/**
 * Listar todos os tipos de ambiente ativos
 */
export async function listarTiposAmbiente(): Promise<TipoAmbienteDB[]> {
  const { data, error } = await supabase
    .from("tipos_ambiente")
    .select("*")
    .eq("ativo", true)
    .order("nome", { ascending: true }); // OrdenaçÍo alfabética

  if (error) {
    console.error("[tiposAmbienteApi] Erro ao listar tipos:", error);
    throw error;
  }

  return data || [];
}

/**
 * Buscar tipo de ambiente por código
 */
export async function buscarTipoAmbientePorCodigo(codigo: string): Promise<TipoAmbienteDB | null> {
  const { data, error } = await supabase
    .from("tipos_ambiente")
    .select("*")
    .eq("codigo", codigo)
    .maybeSingle();

  if (error) {
    console.error("[tiposAmbienteApi] Erro ao buscar tipo:", error);
    throw error;
  }

  return data;
}

/**
 * Criar novo tipo de ambiente
 * Apenas MASTER pode criar
 */
export async function criarTipoAmbiente(input: TipoAmbienteInput): Promise<TipoAmbienteDB> {
  // Normalizar código
  const codigoNormalizado = input.codigo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

  // Buscar maior ordem existente se não fornecida
  let ordem = input.ordem;
  if (ordem === undefined) {
    const { data: maxOrdem } = await supabase
      .from("tipos_ambiente")
      .select("ordem")
      .order("ordem", { ascending: false })
      .limit(1)
      .maybeSingle();
    ordem = (maxOrdem?.ordem || 0) + 1;
  }

  const { data, error } = await supabase
    .from("tipos_ambiente")
    .insert({
      codigo: codigoNormalizado,
      nome: input.nome.trim(),
      ordem,
      ativo: true,
    })
    .select()
    .single();

  if (error) {
    console.error("[tiposAmbienteApi] Erro ao criar tipo:", error);
    throw error;
  }

  return data;
}

/**
 * Atualizar tipo de ambiente
 * Apenas MASTER pode atualizar
 */
export async function atualizarTipoAmbiente(
  id: string,
  input: Partial<TipoAmbienteInput>
): Promise<TipoAmbienteDB> {
  const updateData: Record<string, any> = {};

  if (input.nome !== undefined) {
    updateData.nome = input.nome.trim();
  }

  if (input.ordem !== undefined) {
    updateData.ordem = input.ordem;
  }

  // não permitir alterar o código para evitar quebrar referências
  // Se precisar alterar código, criar novo tipo e desativar o antigo

  const { data, error } = await supabase
    .from("tipos_ambiente")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[tiposAmbienteApi] Erro ao atualizar tipo:", error);
    throw error;
  }

  return data;
}

/**
 * Desativar tipo de ambiente (soft delete)
 * Apenas MASTER pode desativar
 */
export async function desativarTipoAmbiente(id: string): Promise<void> {
  const { error } = await supabase
    .from("tipos_ambiente")
    .update({ ativo: false })
    .eq("id", id);

  if (error) {
    console.error("[tiposAmbienteApi] Erro ao desativar tipo:", error);
    throw error;
  }
}

/**
 * Verificar se o usuário atual é MASTER
 */
export async function verificarUsuarioMaster(): Promise<boolean> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session?.user?.id) return false;

  const { data, error } = await supabase
    .from("usuarios")
    .select("tipo_usuario")
    .eq("auth_user_id", session.session.user.id)
    .maybeSingle();

  if (error || !data) return false;

  return data.tipo_usuario === "MASTER";
}


