// ============================================================
// API: Comentários de Tasks do Cronograma
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { supabase } from "@/lib/supabaseClient";

// ============================================================
// TIPOS
// ============================================================

export interface TaskComentario {
  id: string;
  task_id: string;
  usuario_id: string;
  usuario_nome: string;
  usuario_avatar?: string;
  comentario: string;
  mencoes?: string[]; // IDs de usuários mencionados
  editado: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskComentarioCompleto extends TaskComentario {
  task?: {
    id: string;
    titulo: string;
    project_id: string;
  };
}

export interface ComentarioFormData {
  task_id: string;
  comentario: string;
  mencoes?: string[];
}

export interface ComentarioNotificacao {
  id: string;
  usuario_id: string;
  comentario_id: string;
  lida: boolean;
  created_at: string;
}

// ============================================================
// CRUD DE COMENTÁRIOS
// ============================================================

/**
 * Listar comentários de uma task
 * Retorna array vazio se a tabela não existir
 */
export async function listarComentariosTask(
  task_id: string
): Promise<TaskComentarioCompleto[]> {
  const { data, error } = await supabase
    .from("project_tasks_comentarios")
    .select("*")
    .eq("task_id", task_id)
    .order("created_at", { ascending: true });

  if (error) {
    // Tabela não existe ainda - retornar vazio silenciosamente
    if (error.code === "PGRST205") return [];
    throw error;
  }
  return data as any;
}

/**
 * Buscar comentário por ID
 */
export async function buscarComentario(
  id: string
): Promise<TaskComentarioCompleto> {
  const { data, error } = await supabase
    .from("project_tasks_comentarios")
    .select(
      `
      *,
      task:project_tasks (
        id,
        titulo,
        project_id
      )
    `
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as any;
}

/**
 * Criar comentário
 */
export async function criarComentario(
  payload: ComentarioFormData
): Promise<TaskComentario> {
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    throw new Error("Usuário não autenticado");
  }

  const { data, error } = await supabase
    .from("project_tasks_comentarios")
    .insert({
      task_id: payload.task_id,
      usuario_id: userData.user.id,
      usuario_nome: userData.user.email || "Usuário",
      comentario: payload.comentario,
      mencoes: payload.mencoes || [],
      editado: false,
    })
    .select()
    .single();

  if (error) throw error;

  // Criar notificações para menções
  if (payload.mencoes && payload.mencoes.length > 0) {
    await criarNotificacoesMencoes(data.id, payload.mencoes);
  }

  return data as any;
}

/**
 * Atualizar comentário
 */
export async function atualizarComentario(
  id: string,
  comentario: string,
  mencoes?: string[]
): Promise<TaskComentario> {
  const { data: userData } = await supabase.auth.getUser();

  // Verificar se é o autor
  const { data: comentarioAtual } = await supabase
    .from("project_tasks_comentarios")
    .select("usuario_id")
    .eq("id", id)
    .single();

  if (comentarioAtual?.usuario_id !== userData?.user?.id) {
    throw new Error("Apenas o autor pode editar o comentário");
  }

  const { data, error } = await supabase
    .from("project_tasks_comentarios")
    .update({
      comentario,
      mencoes: mencoes || [],
      editado: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  // Atualizar notificações de menções
  if (mencoes && mencoes.length > 0) {
    // Remover notificações antigas
    await supabase
      .from("comentarios_notificacoes")
      .delete()
      .eq("comentario_id", id);

    // Criar novas notificações
    await criarNotificacoesMencoes(id, mencoes);
  }

  return data as any;
}

/**
 * Deletar comentário
 */
export async function deletarComentario(id: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();

  // Verificar se é o autor
  const { data: comentarioAtual } = await supabase
    .from("project_tasks_comentarios")
    .select("usuario_id")
    .eq("id", id)
    .single();

  if (comentarioAtual?.usuario_id !== userData?.user?.id) {
    throw new Error("Apenas o autor pode deletar o comentário");
  }

  // Deletar notificações relacionadas
  await supabase.from("comentarios_notificacoes").delete().eq("comentario_id", id);

  // Deletar comentário
  const { error } = await supabase
    .from("project_tasks_comentarios")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// ============================================================
// NOTIFICAÇÕES E MENÇÕES
// ============================================================

/**
 * Criar notificações para usuários mencionados
 */
async function criarNotificacoesMencoes(
  comentario_id: string,
  mencoes: string[]
): Promise<void> {
  const notificacoes = mencoes.map((usuario_id) => ({
    comentario_id,
    usuario_id,
    lida: false,
  }));

  await supabase.from("comentarios_notificacoes").insert(notificacoes);
}

/**
 * Listar notificações de comentários do usuário
 * Retorna array vazio se as tabelas não existirem
 */
export async function listarNotificacoesUsuario(): Promise<
  Array<ComentarioNotificacao & { comentario: TaskComentarioCompleto }>
> {
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    throw new Error("Usuário não autenticado");
  }

  const { data, error } = await supabase
    .from("comentarios_notificacoes")
    .select(
      `
      *,
      comentario:project_tasks_comentarios (
        *,
        task:project_tasks (
          id,
          titulo,
          project_id
        )
      )
    `
    )
    .eq("usuario_id", userData.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    // Tabela não existe ainda - retornar vazio silenciosamente
    if (error.code === "PGRST205") return [];
    throw error;
  }
  return data as any;
}

/**
 * Marcar notificaçÍo como lida
 */
export async function marcarNotificacaoLida(id: string): Promise<void> {
  const { error } = await supabase
    .from("comentarios_notificacoes")
    .update({ lida: true })
    .eq("id", id);

  if (error) throw error;
}

/**
 * Marcar todas as notificações como lidas
 */
export async function marcarTodasNotificacoesLidas(): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    throw new Error("Usuário não autenticado");
  }

  const { error } = await supabase
    .from("comentarios_notificacoes")
    .update({ lida: true })
    .eq("usuario_id", userData.user.id)
    .eq("lida", false);

  if (error) throw error;
}

/**
 * Contar notificações não lidas
 * Retorna 0 se a tabela não existir
 */
export async function contarNotificacoesNaoLidas(): Promise<number> {
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    return 0;
  }

  const { count, error } = await supabase
    .from("comentarios_notificacoes")
    .select("*", { count: "exact", head: true })
    .eq("usuario_id", userData.user.id)
    .eq("lida", false);

  if (error) {
    // Tabela não existe ainda - retornar 0 silenciosamente
    if (error.code === "PGRST205") return 0;
    throw error;
  }
  return count || 0;
}

// ============================================================
// BUSCA E FILTROS
// ============================================================

/**
 * Buscar comentários por texto
 * Retorna array vazio se a tabela não existir
 */
export async function buscarComentariosPorTexto(
  texto: string,
  project_id?: string
): Promise<TaskComentarioCompleto[]> {
  let query = supabase
    .from("project_tasks_comentarios")
    .select(
      `
      *,
      task:project_tasks (
        id,
        titulo,
        project_id
      )
    `
    )
    .ilike("comentario", `%${texto}%`)
    .order("created_at", { ascending: false });

  if (project_id) {
    query = query.eq("task.project_id", project_id);
  }

  const { data, error } = await query;

  if (error) {
    // Tabela não existe ainda - retornar vazio silenciosamente
    if (error.code === "PGRST205") return [];
    throw error;
  }
  return data as any;
}

/**
 * Listar comentários de um projeto
 * Retorna array vazio se a tabela não existir
 */
export async function listarComentariosProjeto(
  project_id: string
): Promise<TaskComentarioCompleto[]> {
  const { data, error } = await supabase
    .from("project_tasks_comentarios")
    .select(
      `
      *,
      task:project_tasks!inner (
        id,
        titulo,
        project_id
      )
    `
    )
    .eq("task.project_id", project_id)
    .order("created_at", { ascending: false });

  if (error) {
    // Tabela não existe ainda - retornar vazio silenciosamente
    if (error.code === "PGRST205") return [];
    throw error;
  }
  return data as any;
}

/**
 * Listar comentários do usuário
 * Retorna array vazio se a tabela não existir
 */
export async function listarComentariosUsuario(
  usuario_id?: string
): Promise<TaskComentarioCompleto[]> {
  let userId = usuario_id;

  if (!userId) {
    const { data: userData } = await supabase.auth.getUser();
    userId = userData?.user?.id;
  }

  if (!userId) {
    throw new Error("Usuário não especificado");
  }

  const { data, error } = await supabase
    .from("project_tasks_comentarios")
    .select(
      `
      *,
      task:project_tasks (
        id,
        titulo,
        project_id
      )
    `
    )
    .eq("usuario_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    // Tabela não existe ainda - retornar vazio silenciosamente
    if (error.code === "PGRST205") return [];
    throw error;
  }
  return data as any;
}

// ============================================================
// ESTATÍSTICAS
// ============================================================

/**
 * Obter estatísticas de comentários de uma task
 */
export async function obterEstatisticasTask(task_id: string): Promise<{
  total_comentarios: number;
  usuarios_unicos: number;
  ultimo_comentario?: TaskComentario;
}> {
  const comentarios = await listarComentariosTask(task_id);

  const usuarios_unicos = new Set(
    comentarios.map((c) => c.usuario_id)
  ).size;

  return {
    total_comentarios: comentarios.length,
    usuarios_unicos,
    ultimo_comentario: comentarios[comentarios.length - 1],
  };
}

/**
 * Obter atividade recente de comentários
 * Retorna array vazio se a tabela não existir
 */
export async function obterAtividadeRecente(
  dias: number = 7
): Promise<TaskComentarioCompleto[]> {
  const dataInicio = new Date();
  dataInicio.setDate(dataInicio.getDate() - dias);

  const { data, error } = await supabase
    .from("project_tasks_comentarios")
    .select(
      `
      *,
      task:project_tasks (
        id,
        titulo,
        project_id
      )
    `
    )
    .gte("created_at", dataInicio.toISOString())
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    // Tabela não existe ainda - retornar vazio silenciosamente
    if (error.code === "PGRST205") return [];
    throw error;
  }
  return data as any;
}

// ============================================================
// UTILITÁRIOS
// ============================================================

/**
 * Extrair menções de um texto
 * Formato esperado: @[usuario_id] ou @username
 */
export function extrairMencoes(texto: string): string[] {
  const regex = /@\[([^\]]+)\]/g;
  const mencoes: string[] = [];
  let match;

  while ((match = regex.exec(texto)) !== null) {
    mencoes.push(match[1]);
  }

  return [...new Set(mencoes)]; // Remover duplicatas
}

/**
 * Formatar texto com menções para exibiçÍo
 */
export function formatarMencoes(
  texto: string,
  usuarios: Array<{ id: string; nome: string }>
): string {
  let textoFormatado = texto;

  usuarios.forEach((usuario) => {
    const regex = new RegExp(`@\\[${usuario.id}\\]`, "g");
    textoFormatado = textoFormatado.replace(
      regex,
      `<span class="mention">@${usuario.nome}</span>`
    );
  });

  return textoFormatado;
}

/**
 * Calcular tempo decorrido desde o comentário
 */
export function calcularTempoDecorrido(data: string): string {
  const agora = new Date();
  const comentario = new Date(data);
  const diffMs = agora.getTime() - comentario.getTime();
  const diffMinutos = Math.floor(diffMs / 60000);
  const diffHoras = Math.floor(diffMinutos / 60);
  const diffDias = Math.floor(diffHoras / 24);

  if (diffMinutos < 1) {
    return "agora";
  } else if (diffMinutos < 60) {
    return `${diffMinutos}m atrás`;
  } else if (diffHoras < 24) {
    return `${diffHoras}h atrás`;
  } else if (diffDias < 7) {
    return `${diffDias}d atrás`;
  } else {
    return comentario.toLocaleDateString("pt-BR");
  }
}


