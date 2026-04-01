import { supabase } from "./supabaseClient";

/**
 * Obtém o papel (role) do usuário autenticado a partir da tabela de usuários.
 * Caso não exista registro vinculado retorna null para deixar a UI livre.
 */
export async function obterPermissaoUsuario(authUserId: string): Promise<string | null> {
  if (!authUserId) return null;

  const { data, error } = await supabase
    .from("usuarios")
    .select("tipo_usuario")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    console.error("[permissoesApi] erro ao carregar permissões:", error);
    return null;
  }

  return data?.tipo_usuario ?? null;
}


