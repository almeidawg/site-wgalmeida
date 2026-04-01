// ============================================================
// API: Checklist Diário do CEO/Founder
// Sistema WG Easy - Grupo WG Almeida
// ============================================================
//
// SUPABASE STUDIO - TABELAS:
// - ceo_checklist_diario: https://supabase.com/dashboard/project/ahlqzzkxuutwoepirpzr/editor/ceo_checklist_diario
// - ceo_checklist_itens:  https://supabase.com/dashboard/project/ahlqzzkxuutwoepirpzr/editor/ceo_checklist_itens
// - Menções (comentários): https://supabase.com/dashboard/project/ahlqzzkxuutwoepirpzr/editor/project_tasks_comentarios
//
// ============================================================

import { supabase } from "./supabaseClient";

// ============================================================
// TIPOS
// ============================================================

export type PrioridadeItem = "alta" | "media" | "baixa";
export type FonteItem = "manual" | "mencao" | "automatico" | "recorrente";

export interface CEOChecklistItem {
  id: string;
  checklist_id: string;
  texto: string;
  prioridade: PrioridadeItem;
  concluido: boolean;
  concluido_em: string | null;
  ordem: number;
  fonte: FonteItem;
  referencia_id: string | null;
  created_at: string;
}

export interface CEOChecklist {
  id: string;
  data: string;
  usuario_id: string;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  itens?: CEOChecklistItem[];
}

export interface NovoItemInput {
  texto: string;
  prioridade?: PrioridadeItem;
  ordem?: number;
  fonte?: FonteItem;
  referencia_id?: string;
  criado_por?: string;
}

// ============================================================
// FUNÇÕES
// ============================================================

/**
 * Obter ou criar o checklist do dia atual
 * Se não existir, copia itens não concluídos do dia anterior
 */
export async function obterChecklistDiario(usuarioId: string): Promise<CEOChecklist | null> {
  const hoje = new Date().toISOString().split("T")[0];
  const ontem = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  // Tentar buscar checklist de hoje
  let { data: checklist, error } = await supabase
    .from("ceo_checklist_diario")
    .select("*, itens:ceo_checklist_itens(*)")
    .eq("usuario_id", usuarioId)
    .eq("data", hoje)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("[obterChecklistDiario] Erro ao buscar:", error);
    throw error;
  }

  // Se não existe, criar novo checklist
  if (!checklist) {
    // Primeiro, criar o checklist de hoje
    const { data: novoChecklist, error: createError } = await supabase
      .from("ceo_checklist_diario")
      .insert({ data: hoje, usuario_id: usuarioId })
      .select()
      .single();

    if (createError) {
      console.error("[obterChecklistDiario] Erro ao criar:", createError);
      throw createError;
    }

    checklist = { ...novoChecklist, itens: [] };

    // Copiar itens não concluídos do dia anterior
    await copiarItensNaoConcluidos(usuarioId, ontem, hoje);

    // Buscar novamente com os itens copiados
    const { data: checklistAtualizado } = await supabase
      .from("ceo_checklist_diario")
      .select("*, itens:ceo_checklist_itens(*)")
      .eq("id", checklist.id)
      .single();

    if (checklistAtualizado) {
      checklist = checklistAtualizado;
    }
  }

  // Ordenar itens por ordem (mais recente primeiro)
  if (checklist?.itens) {
    checklist.itens.sort((a: CEOChecklistItem, b: CEOChecklistItem) => b.ordem - a.ordem);
  }

  return checklist;
}

/**
 * Copiar itens não concluídos de um dia para outro
 */
async function copiarItensNaoConcluidos(
  usuarioId: string,
  dataOrigem: string,
  dataDestino: string
): Promise<void> {
  // Buscar checklist de origem
  const { data: checklistOrigem } = await supabase
    .from("ceo_checklist_diario")
    .select("id")
    .eq("usuario_id", usuarioId)
    .eq("data", dataOrigem)
    .single();

  if (!checklistOrigem) return;

  // Buscar checklist de destino
  const { data: checklistDestino } = await supabase
    .from("ceo_checklist_diario")
    .select("id")
    .eq("usuario_id", usuarioId)
    .eq("data", dataDestino)
    .single();

  if (!checklistDestino) return;

  // Buscar itens não concluídos do dia anterior
  const { data: itensNaoConcluidos } = await supabase
    .from("ceo_checklist_itens")
    .select("texto, prioridade, ordem")
    .eq("checklist_id", checklistOrigem.id)
    .eq("concluido", false);

  if (!itensNaoConcluidos || itensNaoConcluidos.length === 0) return;

  // Buscar itens já existentes no destino para evitar duplicatas
  const { data: itensExistentes } = await supabase
    .from("ceo_checklist_itens")
    .select("texto")
    .eq("checklist_id", checklistDestino.id);

  const textosExistentes = new Set(itensExistentes?.map((i) => i.texto) || []);

  // Filtrar apenas itens que não existem no destino
  const itensParaCopiar = itensNaoConcluidos.filter(
    (item) => !textosExistentes.has(item.texto)
  );

  if (itensParaCopiar.length === 0) return;

  // Inserir itens copiados
  const { error } = await supabase.from("ceo_checklist_itens").insert(
    itensParaCopiar.map((item) => ({
      checklist_id: checklistDestino.id,
      texto: item.texto,
      prioridade: item.prioridade,
      ordem: item.ordem,
      fonte: "recorrente" as FonteItem,
    }))
  );

  if (error) {
    console.error("[copiarItensNaoConcluidos] Erro:", error);
  }
}

/**
 * Adicionar novo item ao checklist
 */
export async function adicionarItem(
  checklistId: string,
  item: NovoItemInput
): Promise<CEOChecklistItem> {
  // Buscar menor ordem (não usar .single() pois pode não haver itens)
  const { data: itensOrdem } = await supabase
    .from("ceo_checklist_itens")
    .select("ordem")
    .eq("checklist_id", checklistId)
    .order("ordem", { ascending: true })
    .limit(1);

  const primeiroItem = itensOrdem?.[0];
  const ordemInicial = typeof primeiroItem?.ordem === "number" ? primeiroItem.ordem - 1 : 1;

  // Montar objeto de insert (criado_por é opcional pois a coluna pode não existir)
  const insertData: Record<string, any> = {
    checklist_id: checklistId,
    texto: item.texto,
    prioridade: item.prioridade || "media",
    ordem: item.ordem ?? ordemInicial,
    fonte: item.fonte || "manual",
    referencia_id: item.referencia_id || null,
  };

  // Adicionar criado_por apenas se fornecido
  if (item.criado_por) {
    insertData.criado_por = item.criado_por;
  }

  const { data, error } = await supabase
    .from("ceo_checklist_itens")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("[adicionarItem] Erro:", error);
    throw error;
  }

  return data;
}

/**
 * Marcar item como concluído/não concluído
 */
export async function toggleItemConcluido(
  itemId: string,
  concluido: boolean
): Promise<CEOChecklistItem> {
  const { data, error } = await supabase
    .from("ceo_checklist_itens")
    .update({
      concluido,
      concluido_em: concluido ? new Date().toISOString() : null,
    })
    .eq("id", itemId)
    .select()
    .single();

  if (error) {
    console.error("[toggleItemConcluido] Erro:", error);
    throw error;
  }

  return data;
}

/**
 * Atualizar texto ou prioridade de um item
 */
export async function atualizarItem(
  itemId: string,
  updates: Partial<Pick<CEOChecklistItem, "texto" | "prioridade" | "ordem">>
): Promise<CEOChecklistItem> {
  const { data, error } = await supabase
    .from("ceo_checklist_itens")
    .update(updates)
    .eq("id", itemId)
    .select()
    .single();

  if (error) {
    console.error("[atualizarItem] Erro:", error);
    throw error;
  }

  return data;
}

/**
 * Remover item do checklist
 */
export async function removerItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from("ceo_checklist_itens")
    .delete()
    .eq("id", itemId);

  if (error) {
    console.error("[removerItem] Erro:", error);
    throw error;
  }
}

/**
 * Calcular progresso do checklist (percentual de itens concluídos)
 */
export function calcularProgresso(itens: CEOChecklistItem[]): number {
  if (!itens || itens.length === 0) return 0;
  const concluidos = itens.filter((i) => i.concluido).length;
  return Math.round((concluidos / itens.length) * 100);
}

/**
 * Buscar menções do usuário em comentários de tarefas
 * Retorna tarefas onde o usuário foi @mencionado
 *
 * NOTA: Funcionalidade de menções ainda não implementada no sistema.
 * O sistema atual usa task_comments que não possui campo de menções.
 * Esta funçÍo retorna array vazio até que a funcionalidade seja implementada.
 */
export async function buscarMencoesUsuario(
  _usuarioId: string,
  _dias: number = 7
): Promise<any[]> {
  // Funcionalidade de menções não implementada no sistema atual
  // O sistema usa task_comments (cronogramaApi) que não tem campo "mencoes"
  // Retornar vazio até implementaçÍo futura
  return [];
}

/**
 * Importar mençÍo como item do checklist
 */
export async function importarMencaoParaChecklist(
  checklistId: string,
  mencaoId: string,
  texto: string
): Promise<CEOChecklistItem> {
  return adicionarItem(checklistId, {
    texto,
    prioridade: "alta",
    fonte: "mencao",
    referencia_id: mencaoId,
  });
}

// ============================================================
// SISTEMA DE MENÇÕES (@usuario)
// ============================================================

export interface UsuarioParaMencao {
  id: string;
  nome: string;
  tipo_usuario: string;
  avatar_url: string | null;
}

export interface ChecklistMencao {
  id: string;
  item_id: string;
  usuario_mencionado_id: string;
  usuario_autor_id: string;
  lido: boolean;
  created_at: string;
  // Dados expandidos
  item?: CEOChecklistItem;
  autor_nome?: string;
}

/**
 * Extrair menções do texto
 * Suporta dois formatos:
 * - @[uuid] - formato do MentionInput (ID direto)
 * - @nome - formato manual (nome do usuário)
 */
export function extrairMencoes(texto: string): { ids: string[]; nomes: string[] } {
  const ids: string[] = [];
  const nomes: string[] = [];

  // Formato 1: @[uuid] - ID direto do MentionInput
  const idRegex = /@\[([^\]]+)\]/g;
  let match;
  while ((match = idRegex.exec(texto)) !== null) {
    ids.push(match[1]);
  }

  // Formato 2: @nome - nome manual (excluindo os que já sÍo @[...])
  const textoSemIds = texto.replace(/@\[[^\]]+\]/g, ""); // Remove @[uuid] para não duplicar
  const nomeRegex = /@([a-zA-ZÀ-ÿ]+(?:\s+[a-zA-ZÀ-ÿ]+)?)/gi;
  while ((match = nomeRegex.exec(textoSemIds)) !== null) {
    nomes.push(match[1].toLowerCase());
  }

  return {
    ids: [...new Set(ids)],
    nomes: [...new Set(nomes)],
  };
}

/**
 * Buscar usuários para autocomplete de menções
 * Busca por nome ou email
 */
export async function buscarUsuariosParaMencao(termo: string): Promise<UsuarioParaMencao[]> {
  if (!termo || termo.length < 2) return [];

  const { data, error } = await supabase
    .from("usuarios")
    .select(`
      id,
      tipo_usuario,
      pessoas:pessoa_id (
        nome,
        avatar_url,
        foto_url
      )
    `)
    .eq("ativo", true)
    .limit(10);

  if (error) {
    console.error("[buscarUsuariosParaMencao] Erro:", error);
    return [];
  }

  // Filtrar e mapear resultados
  const termoLower = termo.toLowerCase();
  return (data || [])
    .filter((u: any) => {
      const nome = u.pessoas?.nome?.toLowerCase() || "";
      return nome.includes(termoLower);
    })
    .map((u: any) => ({
      id: u.id,
      nome: u.pessoas?.nome || "Sem nome",
      tipo_usuario: u.tipo_usuario,
      avatar_url: u.pessoas?.avatar_url || u.pessoas?.foto_url || null,
    }));
}

/**
 * Buscar usuário por nome (para resolver @mençÍo)
 * Busca primeiro em usuarios, depois em pessoas (para permitir menções de qualquer pessoa)
 */
export async function buscarUsuarioPorNome(nome: string): Promise<UsuarioParaMencao | null> {
  const nomeLower = nome.toLowerCase().trim();

  // 1. Primeiro buscar em usuarios (tem login)
  const { data: usuariosData } = await supabase
    .from("usuarios")
    .select(`
      id,
      tipo_usuario,
      pessoas:pessoa_id (
        nome,
        avatar_url,
        foto_url
      )
    `)
    .eq("ativo", true);

  if (usuariosData && usuariosData.length > 0) {
    const usuario = usuariosData.find((u: any) => {
      const nomeUsuario = u.pessoas?.nome?.toLowerCase() || "";
      const primeiroNome = nomeUsuario.split(" ")[0];
      // Match primeiro nome, nome parcial ou nome completo
      return primeiroNome === nomeLower ||
             nomeUsuario.includes(nomeLower) ||
             nomeUsuario.startsWith(nomeLower);
    });

    if (usuario) {
      return {
        id: (usuario as any).id,
        nome: (usuario as any).pessoas?.nome || "Sem nome",
        tipo_usuario: (usuario as any).tipo_usuario,
        avatar_url: (usuario as any).pessoas?.avatar_url || (usuario as any).pessoas?.foto_url || null,
      };
    }
  }

  // 2. Se não encontrou em usuarios, buscar em pessoas (qualquer pessoa do sistema)
  const { data: pessoasData } = await supabase
    .from("pessoas")
    .select("id, nome, avatar_url, foto_url")
    .eq("ativo", true);

  if (pessoasData && pessoasData.length > 0) {
    const pessoa = pessoasData.find((p: any) => {
      const nomePessoa = p.nome?.toLowerCase() || "";
      const primeiroNome = nomePessoa.split(" ")[0];
      return primeiroNome === nomeLower ||
             nomePessoa.includes(nomeLower) ||
             nomePessoa.startsWith(nomeLower);
    });

    if (pessoa) {
      return {
        id: pessoa.id,
        nome: pessoa.nome || "Sem nome",
        tipo_usuario: "PESSOA" as any, // Marca como pessoa sem login
        avatar_url: pessoa.avatar_url || pessoa.foto_url || null,
      };
    }
  }

  return null;
}

/**
 * Criar menções para um item do checklist
 * Detecta @nomes no texto e cria registros na tabela de menções
 */
export async function criarMencoesDoItem(
  itemId: string,
  texto: string,
  autorId: string
): Promise<void> {
  const { usuarios, invalidas } = await validarMencoesDoTexto(texto, autorId);
  if (invalidas.length > 0) {
    console.warn("[criarMencoesDoItem] Menções inválidas:", invalidas);
  }
  await criarMencoesParaUsuarios(itemId, usuarios, texto, autorId);
}

/**
 * Buscar usuário por ID (para menções @[uuid])
 */
async function buscarUsuarioPorId(id: string): Promise<UsuarioParaMencao | null> {
  // 1. Buscar em usuarios
  const { data: usuarioData } = await supabase
    .from("usuarios")
    .select(`
      id,
      tipo_usuario,
      pessoas:pessoa_id (
        nome,
        avatar_url,
        foto_url
      )
    `)
    .eq("id", id)
    .eq("ativo", true)
    .maybeSingle();

  if (usuarioData) {
    return {
      id: usuarioData.id,
      nome: (usuarioData as any).pessoas?.nome || "Sem nome",
      tipo_usuario: usuarioData.tipo_usuario,
      avatar_url: (usuarioData as any).pessoas?.avatar_url || (usuarioData as any).pessoas?.foto_url || null,
    };
  }

  // 2. Buscar em pessoas
  const { data: pessoaData } = await supabase
    .from("pessoas")
    .select("id, nome, avatar_url, foto_url")
    .eq("id", id)
    .eq("ativo", true)
    .maybeSingle();

  if (pessoaData) {
    return {
      id: pessoaData.id,
      nome: pessoaData.nome || "Sem nome",
      tipo_usuario: "PESSOA" as any,
      avatar_url: pessoaData.avatar_url || pessoaData.foto_url || null,
    };
  }

  return null;
}

async function validarMencoesDoTexto(
  texto: string,
  autorId: string
): Promise<{ usuarios: UsuarioParaMencao[]; invalidas: string[] }> {
  const mencoes = extrairMencoes(texto);
  const usuarios: UsuarioParaMencao[] = [];
  const invalidas: string[] = [];

  // Se não tem menções, retornar vazio
  if (mencoes.ids.length === 0 && mencoes.nomes.length === 0) {
    return { usuarios, invalidas };
  }

  // 1. Processar menções por ID (@[uuid] do MentionInput)
  for (const id of mencoes.ids) {
    if (id === autorId) continue; // não mencionar a si mesmo
    const usuario = await buscarUsuarioPorId(id);
    if (usuario) {
      usuarios.push(usuario);
    } else {
      invalidas.push(`ID:${id.substring(0, 8)}`);
    }
  }

  // 2. Processar menções por nome (@nome manual)
  for (const nome of mencoes.nomes) {
    const usuario = await buscarUsuarioPorNome(nome);
    if (!usuario || usuario.id === autorId) {
      if (!usuario) invalidas.push(nome);
      continue;
    }
    // Evitar duplicatas (caso mesmo usuário mencionado por ID e nome)
    if (!usuarios.some(u => u.id === usuario.id)) {
      usuarios.push(usuario);
    }
  }

  return { usuarios, invalidas };
}

async function criarMencoesParaUsuarios(
  itemId: string,
  usuarios: UsuarioParaMencao[],
  texto: string,
  autorId: string
): Promise<void> {
  if (usuarios.length === 0) return;

  for (const usuario of usuarios) {
    const { error } = await supabase
      .from("ceo_checklist_mencoes")
      .insert({
        item_id: itemId,
        usuario_mencionado_id: usuario.id,
        usuario_autor_id: autorId,
      });

    if (error && error.code !== "23505") {
      console.error("[criarMencoesDoItem] Erro ao criar mençÍo:", error);
    }

    await criarTarefaParaMencionado(usuario.id, texto, autorId, itemId);
  }
}

/**
 * Criar tarefa no checklist do usuário mencionado
 */
async function criarTarefaParaMencionado(
  usuarioMencionadoId: string,
  texto: string,
  autorId: string,
  itemOriginalId: string
): Promise<void> {
  const hoje = new Date().toISOString().split("T")[0];

  // Buscar ou criar checklist do usuario mencionado
  let { data: checklist } = await supabase
    .from("ceo_checklist_diario")
    .select("id")
    .eq("usuario_id", usuarioMencionadoId)
    .eq("data", hoje)
    .single();

  if (!checklist) {
    // Criar checklist para o usuario
    const { data: novoChecklist, error } = await supabase
      .from("ceo_checklist_diario")
      .insert({ data: hoje, usuario_id: usuarioMencionadoId })
      .select("id")
      .single();

    if (error) {
      console.error("[criarTarefaParaMencionado] Erro ao criar checklist:", error);
      return;
    }
    checklist = novoChecklist;
  }

  // Buscar nome do autor
  const { data: autorData } = await supabase
    .from("usuarios")
    .select("pessoas:pessoa_id(nome)")
    .eq("id", autorId)
    .single();

  const autorNome = (autorData as any)?.pessoas?.nome || "Alguem";

  // Criar o item no checklist do mencionado
  try {
    await adicionarItem(checklist!.id, {
      texto: `[Alerta] ${autorNome}: ${texto}`,
      prioridade: "alta",
      fonte: "mencao",
      referencia_id: itemOriginalId,
      criado_por: autorId,
    });
  } catch (error) {
    console.error("[criarTarefaParaMencionado] Erro ao criar item:", error);
  }
}

/**
 * Buscar tarefas onde o usuário foi mencionado (não lidas)
 */
export async function buscarTarefasMencionadas(usuarioId: string): Promise<ChecklistMencao[]> {
  const { data, error } = await supabase
    .from("ceo_checklist_mencoes")
    .select(`
      *,
      item:ceo_checklist_itens(*),
      autor:usuario_autor_id(
        pessoas:pessoa_id(nome)
      )
    `)
    .eq("usuario_mencionado_id", usuarioId)
    .eq("lido", false)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[buscarTarefasMencionadas] Erro:", error);
    return [];
  }

  return (data || []).map((m: any) => ({
    ...m,
    autor_nome: m.autor?.pessoas?.nome || "Desconhecido",
  }));
}

/**
 * Marcar mençÍo como lida
 */
export async function marcarMencaoComoLida(mencaoId: string): Promise<void> {
  const { error } = await supabase
    .from("ceo_checklist_mencoes")
    .update({ lido: true })
    .eq("id", mencaoId);

  if (error) {
    console.error("[marcarMencaoComoLida] Erro:", error);
  }
}

/**
 * Adicionar item com suporte a menções
 * Wrapper do adicionarItem que processa @menções
 * Menções não encontradas sÍo ignoradas (não bloqueiam a criaçÍo)
 */
export async function adicionarItemComMencoes(
  checklistId: string,
  item: NovoItemInput,
  autorId: string
): Promise<CEOChecklistItem> {
  if (!autorId) {
    throw new Error("Autor não identificado para validar menções.");
  }

  const { usuarios, invalidas } = await validarMencoesDoTexto(item.texto, autorId);

  // Apenas log de aviso, não bloqueia a criaçÍo
  if (invalidas.length > 0) {
    console.warn(`[adicionarItemComMencoes] Menções não encontradas (ignoradas): ${invalidas.join(", ")}`);
  }

  // Criar o item com criado_por incluído diretamente
  const novoItem = await adicionarItem(checklistId, {
    ...item,
    criado_por: autorId,
  });

  // Processar menções válidas no texto
  if (usuarios.length > 0) {
    await criarMencoesParaUsuarios(novoItem.id, usuarios, item.texto, autorId);
  }

  return novoItem;
}


