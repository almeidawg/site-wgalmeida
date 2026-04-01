// src/lib/permissoesModuloApi.ts
// API para gerenciamento de permissões por módulo

import { supabase } from "./supabaseClient";

export interface ModuloSistema {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  icone: string | null;
  secao: string;
  path: string | null;
  ordem: number;
  ativo: boolean;
}

export interface PermissaoModulo {
  codigo: string;
  nome: string;
  secao: string;
  path: string;
  pode_visualizar: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
  pode_exportar: boolean;
  pode_importar: boolean;
}

export interface PermissaoTipoUsuario {
  id: string;
  tipo_usuario: string;
  modulo_id: string;
  modulo_codigo?: string;
  modulo_nome?: string;
  pode_visualizar: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
  pode_exportar: boolean;
  pode_importar: boolean;
}

/**
 * Lista todos os módulos do sistema
 */
export async function listarModulos(): Promise<ModuloSistema[]> {
  const { data, error } = await supabase
    .from("sistema_modulos")
    .select("*")
    .eq("ativo", true)
    .order("ordem");

  if (error) {
    console.error("[permissoesModuloApi] Erro ao listar módulos:", error);
    throw error;
  }

  return data || [];
}

/**
 * Lista módulos permitidos para o usuário logado
 */
export async function listarModulosPermitidos(authUserId: string): Promise<PermissaoModulo[]> {
  const { data, error } = await supabase.rpc("listar_modulos_permitidos", {
    p_auth_user_id: authUserId,
  });

  if (error) {
    console.error("[permissoesModuloApi] Erro ao listar módulos permitidos:", error);
    throw error;
  }

  return data || [];
}

/**
 * Verifica se usuário tem permissÍo para um módulo específico
 */
export async function verificarPermissao(
  authUserId: string,
  codigoModulo: string,
  tipoPermissao: "pode_visualizar" | "pode_criar" | "pode_editar" | "pode_excluir" | "pode_exportar" | "pode_importar" = "pode_visualizar"
): Promise<boolean> {
  const { data, error } = await supabase.rpc("verificar_permissao", {
    p_auth_user_id: authUserId,
    p_codigo_modulo: codigoModulo,
    p_tipo_permissao: tipoPermissao,
  });

  if (error) {
    console.error("[permissoesModuloApi] Erro ao verificar permissÍo:", error);
    return false;
  }

  return data === true;
}

/**
 * Lista permissões de um tipo de usuário
 */
export async function listarPermissoesTipoUsuario(tipoUsuario: string): Promise<PermissaoTipoUsuario[]> {
  const { data, error } = await supabase
    .from("permissoes_tipo_usuario")
    .select(`
      *,
      sistema_modulos:modulo_id (
        codigo,
        nome
      )
    `)
    .eq("tipo_usuario", tipoUsuario);

  if (error) {
    console.error("[permissoesModuloApi] Erro ao listar permissões:", error);
    throw error;
  }

  return (data || []).map((p: any) => ({
    ...p,
    modulo_codigo: p.sistema_modulos?.codigo,
    modulo_nome: p.sistema_modulos?.nome,
  }));
}

/**
 * Atualiza permissÍo de um tipo de usuário para um módulo
 */
export async function atualizarPermissao(
  tipoUsuario: string,
  moduloId: string,
  permissoes: Partial<{
    pode_visualizar: boolean;
    pode_criar: boolean;
    pode_editar: boolean;
    pode_excluir: boolean;
    pode_exportar: boolean;
    pode_importar: boolean;
  }>
): Promise<void> {
  const { error } = await supabase
    .from("permissoes_tipo_usuario")
    .upsert(
      {
        tipo_usuario: tipoUsuario,
        modulo_id: moduloId,
        ...permissoes,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: "tipo_usuario,modulo_id" }
    );

  if (error) {
    console.error("[permissoesModuloApi] Erro ao atualizar permissÍo:", error);
    throw error;
  }
}

/**
 * Retorna labels para tipos de usuário
 */
export function getLabelTipoUsuario(tipo: string): string {
  const labels: Record<string, string> = {
    MASTER: "Founder & CEO",
    ADMIN: "Administrador",
    COMERCIAL: "Comercial",
    ATENDIMENTO: "Atendimento",
    COLABORADOR: "Colaborador",
    CLIENTE: "Cliente",
    ESPECIFICADOR: "Especificador",
    FORNECEDOR: "Fornecedor",
  };
  return labels[tipo] || tipo;
}

/**
 * Retorna cor para tipo de usuário
 */
export function getCorTipoUsuario(tipo: string): string {
  const cores: Record<string, string> = {
    MASTER: "purple",
    ADMIN: "blue",
    COMERCIAL: "orange",
    ATENDIMENTO: "teal",
    COLABORADOR: "green",
    CLIENTE: "gray",
    ESPECIFICADOR: "cyan",
    FORNECEDOR: "amber",
  };
  return cores[tipo] || "gray";
}

/**
 * Lista todos os tipos de usuário disponíveis
 */
export const TIPOS_USUARIO = [
  { value: "MASTER", label: "Founder & CEO", descricao: "Controle total do sistema" },
  { value: "ADMIN", label: "Administrador", descricao: "Acesso administrativo" },
  { value: "COMERCIAL", label: "Comercial", descricao: "Vendas e propostas" },
  { value: "ATENDIMENTO", label: "Atendimento", descricao: "Suporte ao cliente" },
  { value: "COLABORADOR", label: "Colaborador", descricao: "Operacional interno" },
  { value: "CLIENTE", label: "Cliente", descricao: "Área do cliente" },
  { value: "ESPECIFICADOR", label: "Especificador", descricao: "Arquitetos e profissionais" },
  { value: "FORNECEDOR", label: "Fornecedor", descricao: "Parceiros externos" },
  { value: "JURIDICO", label: "Jurídico", descricao: "Departamento jurídico" },
  { value: "FINANCEIRO", label: "Financeiro", descricao: "Departamento financeiro" },
];

