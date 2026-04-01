/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// API DE NOTAS DO SISTEMA
// Sistema WG Easy - Grupo WG Almeida
// Notas colaborativas com checklist e menções
// ============================================================

import { supabase } from "./supabaseClient";
import { sincronizarNotaClienteNoCronograma } from "./checklistCronogramaIntegration";

// ============================================================
// TIPOS
// ============================================================

export interface NotaSistemaItem {
  id: string;
  nota_id: string;
  texto: string;
  checked: boolean;
  checked_by?: string | null;
  checked_em?: string | null;
  ordem: number;
  mencionado_id?: string | null;
  mencionado_nome?: string | null;
  criado_em: string;
  // Campos novos para checklist interno
  deadline?: string | null;
  prioridade?: 'baixa' | 'media' | 'alta';
  // Campos para aprovacao cliente (preparacao - desativado)
  requer_aprovacao_cliente?: boolean;
  aprovado_em?: string | null;
  aprovado_por?: string | null;
  notificar_email?: boolean;
  notificar_whatsapp?: boolean;
  cliente_vinculado_id?: string | null;
}

export interface NotaSistema {
  id: string;
  titulo: string;
  descricao?: string | null;
  cor: string;
  criado_por: string;
  criado_por_nome?: string;
  criado_em: string;
  atualizado_em: string;
  arquivada: boolean;
  itens?: NotaSistemaItem[];
  // Campos novos para vinculo
  vinculo_tipo?: 'cliente' | 'projeto' | 'oportunidade' | 'contrato' | null;
  vinculo_id?: string | null;
  visibilidade?: 'privada' | 'equipe' | 'publica';
}

export interface NotaSistemaCompartilhamento {
  id: string;
  nota_id: string;
  pessoa_id: string;
  pode_editar: boolean;
  pode_marcar: boolean;
  criado_em: string;
}

export interface CriarNotaPayload {
  titulo: string;
  descricao?: string;
  cor?: string;
  vinculo_tipo?: 'cliente' | 'projeto' | 'oportunidade' | 'contrato';
  vinculo_id?: string;
  visibilidade?: 'privada' | 'equipe' | 'publica';
  itens?: Array<{
    texto: string;
    mencionado_id?: string;
    deadline?: string;
    prioridade?: 'baixa' | 'media' | 'alta';
  }>;
}

export interface CriarItemPayload {
  nota_id: string;
  texto: string;
  mencionado_id?: string;
  deadline?: string;
  prioridade?: 'baixa' | 'media' | 'alta';
  cliente_vinculado_id?: string;
}

// Cores disponíveis para notas (estilo Keep)
export const CORES_NOTAS = {
  amarelo: "#FFF9C4",
  laranja: "#FFE0B2",
  rosa: "#F8BBD9",
  roxo: "#E1BEE7",
  azul: "#BBDEFB",
  verde: "#C8E6C9",
  cinza: "#F5F5F5",
  branco: "#FFFFFF",
} as const;

// ============================================================
// FUNÇÕES DA API
// ============================================================

/**
 * Listar notas visíveis para o usuário
 */
export async function listarNotas(usuarioId?: string, pessoaId?: string): Promise<NotaSistema[]> {
  try {
    // Buscar notas criadas pelo usuário ou compartilhadas com ele
    let query = supabase
      .from("notas_sistema")
      .select(`
        *,
        criador:pessoas!notas_sistema_criado_por_fkey(nome),
        itens:notas_sistema_itens(
          id,
          nota_id,
          texto,
          checked,
          checked_by,
          checked_em,
          ordem,
          mencionado_id,
          criado_em
        )
      `)
      .eq("arquivada", false)
      .order("atualizado_em", { ascending: false });

    // Filtrar por criador ou compartilhamento
    if (pessoaId) {
      query = query.or(`criado_por.eq.${pessoaId}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao listar notas:", error);
      return [];
    }

    // Formatar dados
    return (data || []).map((nota) => ({
      ...nota,
      criado_por_nome: nota.criador?.nome || "Usuário",
      itens: (nota.itens || []).sort((a: NotaSistemaItem, b: NotaSistemaItem) => a.ordem - b.ordem),
    }));
  } catch (error) {
    console.error("Erro ao listar notas:", error);
    return [];
  }
}

/**
 * Listar itens onde o usuário foi mencionado
 */
export async function listarItensMencionados(pessoaId: string): Promise<NotaSistemaItem[]> {
  try {
    const { data, error } = await supabase
      .from("notas_sistema_itens")
      .select(`
        *,
        nota:notas_sistema(id, titulo, cor, criado_por)
      `)
      .eq("mencionado_id", pessoaId)
      .order("criado_em", { ascending: false });

    if (error) {
      console.error("Erro ao listar itens mencionados:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Erro ao listar itens mencionados:", error);
    return [];
  }
}

/**
 * Criar nova nota
 */
export async function criarNota(payload: CriarNotaPayload, criadorId: string): Promise<NotaSistema | null> {
  try {
    // Criar nota
    const { data: nota, error: notaError } = await supabase
      .from("notas_sistema")
      .insert({
        titulo: payload.titulo,
        descricao: payload.descricao || null,
        cor: payload.cor || CORES_NOTAS.amarelo,
        criado_por: criadorId || null,
        arquivada: false,
        vinculo_tipo: payload.vinculo_tipo || null,
        vinculo_id: payload.vinculo_id || null,
        visibilidade: payload.visibilidade || 'privada',
      })
      .select()
      .single();

    if (notaError || !nota) {
      console.error("Erro ao criar nota:", notaError);
      return null;
    }

    // Criar itens se houver
    if (payload.itens && payload.itens.length > 0) {
      const itensParaInserir = payload.itens.map((item, index) => ({
        nota_id: nota.id,
        texto: item.texto,
        checked: false,
        ordem: index,
        mencionado_id: item.mencionado_id || null,
        deadline: item.deadline || null,
        prioridade: item.prioridade || 'media',
      }));

      const { error: itensError } = await supabase
        .from("notas_sistema_itens")
        .insert(itensParaInserir);

      if (itensError) {
        console.error("Erro ao criar itens:", itensError);
      }

      // Criar notificações para mencionados
      const mencionados = payload.itens
        .filter((item) => item.mencionado_id)
        .map((item) => item.mencionado_id!);

      if (mencionados.length > 0) {
        await criarNotificacoesMencao(
          nota.id,
          nota.titulo,
          mencionados,
          criadorId
        );
      }
    }

    // Retornar nota completa
    return listarNotaPorId(nota.id);
  } catch (error) {
    console.error("Erro ao criar nota:", error);
    return null;
  }
}

/**
 * Buscar nota por ID
 */
export async function listarNotaPorId(notaId: string): Promise<NotaSistema | null> {
  try {
    const { data, error } = await supabase
      .from("notas_sistema")
      .select(`
        *,
        criador:pessoas!notas_sistema_criado_por_fkey(nome),
        itens:notas_sistema_itens(
          id,
          nota_id,
          texto,
          checked,
          checked_by,
          checked_em,
          ordem,
          mencionado_id,
          criado_em
        )
      `)
      .eq("id", notaId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      ...data,
      criado_por_nome: data.criador?.nome || "Usuário",
      itens: (data.itens || []).sort((a: NotaSistemaItem, b: NotaSistemaItem) => a.ordem - b.ordem),
    };
  } catch (error) {
    console.error("Erro ao buscar nota:", error);
    return null;
  }
}

/**
 * Adicionar item a uma nota
 */
export async function adicionarItem(payload: CriarItemPayload, criadorId: string): Promise<NotaSistemaItem | null> {
  try {
    // Obter próxima ordem
    const { data: ultimoItem } = await supabase
      .from("notas_sistema_itens")
      .select("ordem")
      .eq("nota_id", payload.nota_id)
      .order("ordem", { ascending: false })
      .limit(1)
      .single();

    const proximaOrdem = (ultimoItem?.ordem ?? -1) + 1;

    const { data, error } = await supabase
      .from("notas_sistema_itens")
      .insert({
        nota_id: payload.nota_id,
        texto: payload.texto,
        checked: false,
        ordem: proximaOrdem,
        mencionado_id: payload.mencionado_id || null,
        deadline: payload.deadline || null,
        prioridade: payload.prioridade || 'media',
        cliente_vinculado_id: payload.cliente_vinculado_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao adicionar item:", error);
      return null;
    }

    // Atualizar timestamp da nota
    await supabase
      .from("notas_sistema")
      .update({ atualizado_em: new Date().toISOString() })
      .eq("id", payload.nota_id);

    // Criar notificaçÍo se houver mençÍo
    if (payload.mencionado_id) {
      const { data: nota } = await supabase
        .from("notas_sistema")
        .select("titulo")
        .eq("id", payload.nota_id)
        .single();

      await criarNotificacoesMencao(
        payload.nota_id,
        nota?.titulo || "Nota",
        [payload.mencionado_id],
        criadorId
      );
    }

    return data;
  } catch (error) {
    console.error("Erro ao adicionar item:", error);
    return null;
  }
}

/**
 * Adicionar múltiplos itens (colar texto linha por linha)
 */
export async function adicionarItensEmLote(
  notaId: string,
  textos: string[],
  criadorId: string
): Promise<NotaSistemaItem[]> {
  try {
    // Obter próxima ordem
    const { data: ultimoItem } = await supabase
      .from("notas_sistema_itens")
      .select("ordem")
      .eq("nota_id", notaId)
      .order("ordem", { ascending: false })
      .limit(1)
      .single();

    const ordemInicial = (ultimoItem?.ordem ?? -1) + 1;

    const itensParaInserir = textos.map((texto, index) => ({
      nota_id: notaId,
      texto: texto.trim(),
      checked: false,
      ordem: ordemInicial + index,
      mencionado_id: null,
    }));

    const { data, error } = await supabase
      .from("notas_sistema_itens")
      .insert(itensParaInserir)
      .select();

    if (error) {
      console.error("Erro ao adicionar itens em lote:", error);
      return [];
    }

    // Atualizar timestamp da nota
    await supabase
      .from("notas_sistema")
      .update({ atualizado_em: new Date().toISOString() })
      .eq("id", notaId);

    return data || [];
  } catch (error) {
    console.error("Erro ao adicionar itens em lote:", error);
    return [];
  }
}

/**
 * Marcar/desmarcar item como concluído
 */
export async function toggleItemCheck(
  itemId: string,
  checked: boolean,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notas_sistema_itens")
      .update({
        checked,
        checked_by: checked ? (userId || null) : null,
        checked_em: checked ? new Date().toISOString() : null,
      })
      .eq("id", itemId);

    if (error) {
      console.error("Erro ao atualizar item:", error);
      return false;
    }

    // Atualizar timestamp da nota
    const { data: item } = await supabase
      .from("notas_sistema_itens")
      .select("nota_id")
      .eq("id", itemId)
      .single();

    if (item?.nota_id) {
      await supabase
        .from("notas_sistema")
        .update({ atualizado_em: new Date().toISOString() })
        .eq("id", item.nota_id);
    }

    return true;
  } catch (error) {
    console.error("Erro ao atualizar item:", error);
    return false;
  }
}

/**
 * Excluir item
 */
export async function excluirItem(itemId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notas_sistema_itens")
      .delete()
      .eq("id", itemId);

    if (error) {
      console.error("Erro ao excluir item:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Erro ao excluir item:", error);
    return false;
  }
}

/**
 * Atualizar nota
 */
export async function atualizarNota(
  notaId: string,
  payload: Partial<Pick<NotaSistema, "titulo" | "descricao" | "cor">>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notas_sistema")
      .update({
        ...payload,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", notaId);

    if (error) {
      console.error("Erro ao atualizar nota:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Erro ao atualizar nota:", error);
    return false;
  }
}

/**
 * Arquivar nota
 */
export async function arquivarNota(notaId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notas_sistema")
      .update({
        arquivada: true,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", notaId);

    if (error) {
      console.error("Erro ao arquivar nota:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Erro ao arquivar nota:", error);
    return false;
  }
}

/**
 * Excluir nota e todos os itens
 */
export async function excluirNota(notaId: string): Promise<boolean> {
  try {
    // Excluir itens primeiro
    await supabase
      .from("notas_sistema_itens")
      .delete()
      .eq("nota_id", notaId);

    // Excluir nota
    const { error } = await supabase
      .from("notas_sistema")
      .delete()
      .eq("id", notaId);

    if (error) {
      console.error("Erro ao excluir nota:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Erro ao excluir nota:", error);
    return false;
  }
}

/**
 * Criar notificações de mençÍo
 */
async function criarNotificacoesMencao(
  notaId: string,
  tituloNota: string,
  mencionadosIds: string[],
  autorId: string
): Promise<void> {
  try {
    const isUuid = (value: string): boolean =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

    const destinatariosValidos = [...new Set((mencionadosIds || []).filter((id) => isUuid(id)))];
    if (destinatariosValidos.length === 0) return;

    // Buscar nome do autor
    const { data: autor } = await supabase
      .from("pessoas")
      .select("nome")
      .eq("id", autorId)
      .maybeSingle();

    const autorNome = autor?.nome || "Alguém";

    // Criar notificações
    const notificacoes = destinatariosValidos.map((pessoaId) => ({
      tipo: "mencao",
      titulo: `${autorNome} mencionou você`,
      mensagem: `Você foi mencionado na nota: ${tituloNota}`,
      referencia_tipo: "nota_sistema",
      referencia_id: notaId,
      destinatario_id: pessoaId,
      para_todos_admins: false,
      url_acao: "/colaborador",
      texto_acao: "Ver nota",
    }));

    const { error } = await supabase.from("notificacoes_sistema").insert(notificacoes);
    if (error) {
      console.error("Erro ao inserir notificações de mençÍo:", {
        error,
        notaId,
        total: notificacoes.length,
      });
    }
  } catch (error) {
    console.error("Erro ao criar notificações de mençÍo:", error);
  }
}

/**
 * Extrair menções do texto (formato @[id])
 */
export function extrairMencoes(texto: string): string[] {
  const regex = /@\[([^\]]+)\]/g;
  const mencoes: string[] = [];
  let match;

  while ((match = regex.exec(texto)) !== null) {
    mencoes.push(match[1]);
  }

  return [...new Set(mencoes)];
}

function extrairNomesMencao(texto: string): string[] {
  const nomes: string[] = [];
  const regex = /(^|[\s(])@([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9._-]*(?:\s+[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9._-]*){0,5})/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(texto)) !== null) {
    const nomeLimpo = String(match[2] || "")
      .trim()
      .replace(/[.,;:!?]+$/, "");
    if (nomeLimpo) nomes.push(nomeLimpo);
  }

  return [...new Set(nomes)];
}

function normalizarTexto(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function limparTokensMencao(nome: string): string[] {
  const blacklist = new Set([
    "colaborador",
    "fornecedor",
    "cliente",
    "usuario",
    "usuário",
    "admin",
    "master",
  ]);

  return normalizarTexto(nome)
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !blacklist.has(t));
}

async function resolverMencoesParaPessoas(
  texto: string,
  cache: Map<string, string | null>
): Promise<string[]> {
  const idsExplicitos = extrairMencoes(texto);
  const nomes = extrairNomesMencao(texto);
  const idsResolvidos = new Set<string>(idsExplicitos);

  for (const nome of nomes) {
    const chave = nome.toLowerCase();

    if (!cache.has(chave)) {
      let pessoaId: string | null = null;
      const tokens = limparTokensMencao(nome);
      const primeiroToken = tokens[0] || nome.split(/\s+/)[0] || nome;
      const { data: candidatos } = await supabase
        .from("pessoas")
        .select("id, nome")
        .ilike("nome", `%${primeiroToken}%`)
        .limit(100);

      const alvo = normalizarTexto(nome);
      let melhor: { id: string; score: number } | null = null;
      for (const candidato of (candidatos || []) as Array<{ id: string; nome: string | null }>) {
        const nomeCand = normalizarTexto(candidato.nome || "");
        if (!nomeCand) continue;

        let score = 0;
        if (nomeCand === alvo) score += 100;
        if (nomeCand.includes(alvo)) score += 50;
        if (nomeCand.startsWith(tokens[0] || "")) score += 20;
        for (const token of tokens) {
          if (nomeCand.includes(token)) score += 15;
        }

        if (!melhor || score > melhor.score) {
          melhor = { id: candidato.id, score };
        }
      }

      if (melhor && melhor.score >= 30) {
        pessoaId = melhor.id;
      }

      cache.set(chave, pessoaId);
    }

    const resolved = cache.get(chave);
    if (resolved) idsResolvidos.add(resolved);
  }

  return [...idsResolvidos];
}

// ============================================================
// FUNCOES PARA CHECKLIST INTERNO (VISIBILIDADE HIERARQUICA)
// ============================================================

export type TipoUsuarioChecklist = 'MASTER' | 'ADMIN' | 'COLABORADOR' | 'CLIENTE' | string;
export type FiltroChecklist = 'minhas' | 'mencionado' | 'por_cliente' | 'todas';

interface ListarNotasHierarquicoParams {
  usuarioId: string;
  pessoaId: string;
  tipoUsuario: TipoUsuarioChecklist;
  filtro?: FiltroChecklist;
  clienteId?: string;
  /** UUID do auth.users (supabase auth) — usado como fallback no filtro "minhas"
   *  para encontrar notas criadas antes da correçÍo auth_user_id→pessoa_id */
  authUserId?: string;
}

/**
 * Listar notas com visibilidade hierarquica
 * - MASTER/ADMIN: Ve todas as notas
 * - Outros: Ve apenas suas notas e onde foi mencionado
 */
export async function listarNotasHierarquico({
  usuarioId,
  pessoaId,
  tipoUsuario,
  filtro = 'minhas',
  clienteId,
  authUserId,
}: ListarNotasHierarquicoParams): Promise<NotaSistema[]> {
  try {
    const isAdminOuMaster = tipoUsuario === 'MASTER' || tipoUsuario === 'ADMIN';

    let query = supabase
      .from("notas_sistema")
      .select(`
        *,
        criador:pessoas!notas_sistema_criado_por_fkey(nome),
        itens:notas_sistema_itens(
          id,
          nota_id,
          texto,
          checked,
          checked_by,
          checked_em,
          ordem,
          mencionado_id,
          criado_em,
          deadline,
          prioridade,
          cliente_vinculado_id
        )
      `)
      .eq("arquivada", false)
      .order("atualizado_em", { ascending: false });

    // Aplicar filtros baseado no tipo de usuario e filtro selecionado
    if (isAdminOuMaster && filtro === 'todas') {
      // Admin/Master vendo todas - sem filtro adicional
    } else if (filtro === 'por_cliente' && clienteId) {
      // Filtrar por cliente vinculado
      query = query.eq('vinculo_id', clienteId);
    } else if (filtro === 'mencionado') {
      // Buscar notas onde o usuario foi mencionado em algum item
      // Isso requer uma abordagem diferente - buscar primeiro os itens
      const idsMencao = authUserId && authUserId !== pessoaId
        ? [pessoaId, authUserId]
        : [pessoaId];

      const { data: itensMencionados } = await supabase
        .from("notas_sistema_itens")
        .select("nota_id")
        .in("mencionado_id", idsMencao);

      if (itensMencionados && itensMencionados.length > 0) {
        const notaIds = [...new Set(itensMencionados.map(i => i.nota_id))];
        query = query.in('id', notaIds);
      } else {
        return []; // Sem mencoes
      }
    } else {
      // Filtro padrao: area do colaborador
      // Inclui:
      // - notas criadas por ele (pessoa_id e legado auth_user_id)
      // - notas de equipe/publicas (marcadas para aparecer na area do colaborador)
      const filtrosMinhas = [
        `criado_por.eq.${pessoaId}`,
        "visibilidade.eq.equipe",
        "visibilidade.eq.publica",
      ];

      if (authUserId && authUserId !== pessoaId) {
        filtrosMinhas.push(`criado_por.eq.${authUserId}`);
      }

      query = query.or(filtrosMinhas.join(","));
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao listar notas hierarquico:", error);
      return [];
    }

    // Formatar dados
    return (data || []).map((nota) => ({
      ...nota,
      criado_por_nome: nota.criador?.nome || "Usuario",
      itens: (nota.itens || []).sort((a: NotaSistemaItem, b: NotaSistemaItem) => a.ordem - b.ordem),
    }));
  } catch (error) {
    console.error("Erro ao listar notas hierarquico:", error);
    return [];
  }
}

/**
 * Listar itens com deadline proximo (para notificacoes)
 */
export async function listarItensComDeadlineProximo(diasAntecedencia: number = 1): Promise<NotaSistemaItem[]> {
  try {
    const hoje = new Date();
    const limite = new Date();
    limite.setDate(hoje.getDate() + diasAntecedencia);

    const { data, error } = await supabase
      .from("notas_sistema_itens")
      .select(`
        *,
        nota:notas_sistema(id, titulo, criado_por)
      `)
      .eq("checked", false)
      .not("deadline", "is", null)
      .lte("deadline", limite.toISOString())
      .gte("deadline", hoje.toISOString())
      .order("deadline", { ascending: true });

    if (error) {
      console.error("Erro ao listar itens com deadline:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Erro ao listar itens com deadline:", error);
    return [];
  }
}

/**
 * Atualizar item com deadline
 */
export async function atualizarItemDeadline(
  itemId: string,
  deadline: string | null,
  prioridade?: 'baixa' | 'media' | 'alta'
): Promise<boolean> {
  try {
    const updateData: Record<string, unknown> = { deadline };
    if (prioridade) {
      updateData.prioridade = prioridade;
    }

    const { error } = await supabase
      .from("notas_sistema_itens")
      .update(updateData)
      .eq("id", itemId);

    if (error) {
      console.error("Erro ao atualizar deadline:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Erro ao atualizar deadline:", error);
    return false;
  }
}

/**
 * Atualizar texto de um item
 */
export async function atualizarItemTexto(
  itemId: string,
  texto: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notas_sistema_itens")
      .update({ texto })
      .eq("id", itemId);

    if (error) {
      console.error("Erro ao atualizar texto do item:", error);
      return false;
    }

    // Atualizar timestamp da nota
    const { data: item } = await supabase
      .from("notas_sistema_itens")
      .select("nota_id")
      .eq("id", itemId)
      .single();

    if (item?.nota_id) {
      await supabase
        .from("notas_sistema")
        .update({ atualizado_em: new Date().toISOString() })
        .eq("id", item.nota_id);
    }

    return true;
  } catch (error) {
    console.error("Erro ao atualizar texto do item:", error);
    return false;
  }
}

/**
 * Resolver menções por nome e criar notificações
 * Retorna Set com IDs dos itens que tiveram menções reconhecidas
 */
export async function resolverMencoesENotificar(
  notaTitulo: string,
  itens: Array<{ id: string; texto: string }>,
  autorId: string
): Promise<Set<string>> {
  const cacheMencoes = new Map<string, string | null>();
  const mencionadosPorItem: Array<{ itemId: string; pessoaId: string }> = [];

  for (const item of itens) {
    const ids = await resolverMencoesParaPessoas(item.texto || "", cacheMencoes);
    ids.forEach((pessoaId) => mencionadosPorItem.push({ itemId: item.id, pessoaId }));
  }

  if (mencionadosPorItem.length === 0) return new Set<string>();

  try {
    // Buscar nome do autor
    const { data: autor } = await supabase
      .from("pessoas")
      .select("nome")
      .eq("id", autorId)
      .maybeSingle();

    const autorNome = autor?.nome || "Alguém";

    const isUuid = (value: string): boolean =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

    const notificacoes = mencionadosPorItem
      .filter((mencao) => isUuid(mencao.pessoaId))
      .map((mencao) => ({
        tipo: "mencao",
        titulo: `${autorNome} mencionou você em um checklist`,
        mensagem: `Checklist: ${notaTitulo}`,
        referencia_tipo: "nota_sistema",
        referencia_id: mencao.itemId,
        destinatario_id: mencao.pessoaId,
        para_todos_admins: false,
        url_acao: "/colaborador/notificacoes",
        texto_acao: "Ver notificações",
      }));

    if (notificacoes.length === 0) return new Set<string>();

    const { error } = await supabase.from("notificacoes_sistema").insert(notificacoes);
    if (error) {
      console.error("Erro ao inserir notificações de mençÍo:", error);
      return new Set<string>();
    }

    return new Set(
      mencionadosPorItem
        .filter((m) => isUuid(m.pessoaId))
        .map((m) => m.itemId)
    );
  } catch (error) {
    console.error("Erro ao criar notificações de mençÍo:", error);
    return new Set<string>();
  }
}

// Flags de ativacao para funcionalidades futuras
export const FEATURES_CHECKLIST = {
  NOTIFICACAO_EMAIL_ATIVO: false,
  NOTIFICACAO_WHATSAPP_ATIVO: false,
};

// ============================================================
// FUNCOES PARA AREA DO CLIENTE
// ============================================================

export interface TarefaClienteResumo {
  id: string;
  titulo: string;
  descricao?: string | null;
  cor: string;
  criado_em: string;
  total_itens: number;
  itens_concluidos: number;
  itens_pendentes: number;
  progresso: number;
  status: 'pendente' | 'em_andamento' | 'concluida';
  itens: NotaSistemaItem[];
}

function ehSeparadorChecklist(texto?: string | null): boolean {
  const valor = String(texto || "").trim();
  return /^[-—]{2,}\s*.+\s*[-—]{2,}$/.test(valor);
}

/**
 * Listar tarefas vinculadas a um cliente (para area do cliente)
 */
export async function listarTarefasPorCliente(clienteId: string): Promise<TarefaClienteResumo[]> {
  try {
    const { data, error } = await supabase
      .from("notas_sistema")
      .select(`
        id,
        titulo,
        descricao,
        cor,
        criado_em,
        itens:notas_sistema_itens(
          id,
          nota_id,
          texto,
          checked,
          checked_em,
          ordem,
          deadline,
          prioridade,
          criado_em
        )
      `)
      .eq("vinculo_tipo", "cliente")
      .eq("vinculo_id", clienteId)
      .eq("arquivada", false)
      .order("criado_em", { ascending: false });

    if (error) {
      console.error("Erro ao listar tarefas do cliente:", error);
      return [];
    }

    // Processar dados para formato de resumo
    return (data || []).map((nota) => {
      const itens = (nota.itens || [])
        .sort((a, b) => a.ordem - b.ordem)
        .filter((i) => !ehSeparadorChecklist(i.texto));
      const totalItens = itens.length;
      const itensConcluidos = itens.filter((i) => i.checked).length;
      const itensPendentes = totalItens - itensConcluidos;
      const progresso = totalItens > 0 ? Math.round((itensConcluidos / totalItens) * 100) : 0;

      let status: 'pendente' | 'em_andamento' | 'concluida' = 'pendente';
      if (itensConcluidos === totalItens && totalItens > 0) {
        status = 'concluida';
      } else if (itensConcluidos > 0) {
        status = 'em_andamento';
      }

      return {
        id: nota.id,
        titulo: nota.titulo,
        descricao: nota.descricao,
        cor: nota.cor,
        criado_em: nota.criado_em,
        total_itens: totalItens,
        itens_concluidos: itensConcluidos,
        itens_pendentes: itensPendentes,
        progresso,
        status,
        itens,
      };
    });
  } catch (error) {
    console.error("Erro ao listar tarefas do cliente:", error);
    return [];
  }
}

/**
 * Obter estatisticas de tarefas de um cliente (para dashboard)
 */
export async function obterEstatisticasTarefasCliente(clienteId: string): Promise<{
  total: number;
  pendentes: number;
  em_andamento: number;
  concluidas: number;
  itens_totais: number;
  itens_concluidos: number;
  progresso_geral: number;
}> {
  try {
    const tarefas = await listarTarefasPorCliente(clienteId);
    const total = tarefas.reduce((acc, t) => acc + t.total_itens, 0);
    const concluidas = tarefas.reduce((acc, t) => acc + t.itens_concluidos, 0);
    const pendentes = tarefas.reduce((acc, t) => {
      if (t.status === 'pendente') return acc + t.itens_pendentes;
      return acc;
    }, 0);
    const em_andamento = tarefas.reduce((acc, t) => {
      if (t.status === 'em_andamento') return acc + t.itens_pendentes;
      return acc;
    }, 0);

    const itens_totais = tarefas.reduce((acc, t) => acc + t.total_itens, 0);
    const itens_concluidos = tarefas.reduce((acc, t) => acc + t.itens_concluidos, 0);
    const progresso_geral = itens_totais > 0 ? Math.round((itens_concluidos / itens_totais) * 100) : 0;

    return {
      total,
      pendentes,
      em_andamento,
      concluidas,
      itens_totais,
      itens_concluidos,
      progresso_geral,
    };
  } catch (error) {
    console.error("Erro ao obter estatisticas de tarefas:", error);
    return {
      total: 0,
      pendentes: 0,
      em_andamento: 0,
      concluidas: 0,
      itens_totais: 0,
      itens_concluidos: 0,
      progresso_geral: 0,
    };
  }
}

// ============================================================
// INTEGRACAO: CHECKLIST OPORTUNIDADE → NOTA DO CLIENTE
// ============================================================

/**
 * Cria uma nota vinculada ao cliente com os itens do checklist da oportunidade.
 * Se já existe nota vinculada à oportunidade, retorna a existente.
 */
export async function criarNotaComChecklistOportunidade(
  oportunidadeId: string,
  clienteId: string,
  tituloOportunidade: string
): Promise<NotaSistema | null> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id || null;
    let criadorPessoaId = userId;

    if (userId) {
      const { data: usuarioSistema } = await supabase
        .from("usuarios")
        .select("pessoa_id")
        .eq("auth_user_id", userId)
        .maybeSingle();
      criadorPessoaId = (usuarioSistema as any)?.pessoa_id || userId;
    }

    // 1. Verificar se já existe nota vinculada a esta oportunidade para este cliente
    const { data: notaExistente } = await supabase
      .from("notas_sistema")
      .select("id")
      .eq("vinculo_tipo", "cliente")
      .eq("vinculo_id", clienteId)
      .ilike("titulo", `%${tituloOportunidade}%`)
      .limit(1);

    const notaExistenteId = notaExistente && notaExistente.length > 0 ? notaExistente[0].id : null;

    // 1b. Corrigir criado_por legado (auth UUID → pessoa_id) se necessário
    if (notaExistenteId && criadorPessoaId && criadorPessoaId !== userId) {
      await supabase
        .from("notas_sistema")
        .update({ criado_por: criadorPessoaId })
        .eq("id", notaExistenteId)
        .eq("criado_por", userId); // só corrige se ainda tem o auth UUID errado
    }

    // 2. Buscar checklists e itens da oportunidade
    const { data: checklists, error: checklistError } = await supabase
      .from("cliente_checklists")
      .select(`
        id,
        nome,
        cliente_checklist_items(id, texto, concluido, ordem)
      `)
      .eq("oportunidade_id", oportunidadeId)
      .order("criado_em", { ascending: true });

    if (checklistError) {
      console.error("Erro ao buscar checklists:", checklistError);
      return null;
    }

    // 3. Montar lista de itens a partir dos checklists
    const itensParaNota: Array<{ texto: string; checked: boolean; ordem: number; mencionado_id?: string | null }> = [];
    let ordemGlobal = 0;
    let totalItensReaisChecklist = 0;
    const cacheMencoes = new Map<string, string | null>();
    const mencoesParaNotificar = new Set<string>();

    for (const checklist of (checklists || [])) {
      const items = (checklist.cliente_checklist_items as Array<{
        id: string;
        texto: string;
        concluido: boolean;
        ordem: number;
      }> || []).sort((a, b) => a.ordem - b.ordem);

      for (const item of items) {
        totalItensReaisChecklist += 1;
        const mencoes = await resolverMencoesParaPessoas(item.texto || "", cacheMencoes);
        mencoes.forEach((id) => mencoesParaNotificar.add(id));
        itensParaNota.push({
          texto: item.texto,
          checked: item.concluido,
          ordem: ordemGlobal++,
          mencionado_id: mencoes.length > 0 ? mencoes[0] : null,
        });
      }
    }

    // Se não há itens de checklist, criar comentário automático da jornada
    if (itensParaNota.length === 0) {
      itensParaNota.push({
        texto: "Comentário automático: jornada do cliente iniciada. Sem itens de checklist no momento.",
        checked: false,
        ordem: 0,
      });
    }

    let notaId = notaExistenteId;

    // 4. Criar nota vinculada ao cliente, se ainda não existir
    if (!notaId) {
      const { data: nota, error: notaError } = await supabase
        .from("notas_sistema")
        .insert({
          titulo: `Jornada: ${tituloOportunidade}`,
          descricao:
            totalItensReaisChecklist > 0
              ? "Itens do checklist da oportunidade importados automaticamente"
              : "Comentário automático da jornada do cliente (sem itens de checklist no momento).",
          cor: CORES_NOTAS.laranja,
          criado_por: criadorPessoaId || clienteId,
          arquivada: false,
          vinculo_tipo: "cliente",
          vinculo_id: clienteId,
          visibilidade: "equipe",
        })
        .select("id")
        .single();

      if (notaError || !nota?.id) {
        console.error("Erro ao criar nota:", notaError);
        return null;
      }
      notaId = nota.id;
    }

    // 5. Sincronizar itens: inserir novos + atualizar checked/mencionado dos existentes
    const { data: itensExistentes } = await supabase
      .from("notas_sistema_itens")
      .select("id, texto, checked, ordem, mencionado_id")
      .eq("nota_id", notaId);

    const mapExistentes = new Map<string, { id: string; checked: boolean; mencionado_id: string | null }>();
    for (const ie of (itensExistentes || []) as Array<{ id: string; texto: string; checked: boolean; mencionado_id: string | null }>) {
      mapExistentes.set(String(ie.texto || "").trim(), { id: ie.id, checked: ie.checked, mencionado_id: ie.mencionado_id });
    }

    const itensNovos = itensParaNota.filter((item) => !mapExistentes.has(item.texto.trim()));

    // 5a. Atualizar checked e mencionado_id dos itens existentes
    for (const item of itensParaNota) {
      const existente = mapExistentes.get(item.texto.trim());
      if (!existente) continue;

      const updates: Record<string, unknown> = {};
      if (existente.checked !== item.checked) {
        updates.checked = item.checked;
        updates.checked_em = item.checked ? new Date().toISOString() : null;
      }
      if (item.mencionado_id && existente.mencionado_id !== item.mencionado_id) {
        updates.mencionado_id = item.mencionado_id;
      }
      if (Object.keys(updates).length > 0) {
        await supabase
          .from("notas_sistema_itens")
          .update(updates)
          .eq("id", existente.id);
      }
    }

    // 5b. Inserir itens novos
    if (itensNovos.length > 0) {
      const maiorOrdem =
        (itensExistentes || []).reduce((max: number, item: any) => {
          const ordem = Number(item?.ordem ?? -1);
          return ordem > max ? ordem : max;
        }, -1) + 1;
      const itensInsert = itensNovos.map((item, index) => ({
        nota_id: notaId,
        texto: item.texto,
        checked: item.checked,
        ordem: maiorOrdem + index,
        prioridade: "media",
        mencionado_id: item.mencionado_id || null,
      }));

      const { error: itensError } = await supabase
        .from("notas_sistema_itens")
        .insert(itensInsert);

      if (itensError) {
        console.error("Erro ao criar itens da nota:", itensError);
      }
    }

    // 5c. Notificar mencionados (apenas novos)
    const mencionados = [...mencoesParaNotificar];
    if (mencionados.length > 0 && criadorPessoaId && itensNovos.length > 0) {
      await criarNotificacoesMencao(
        notaId,
        `Jornada: ${tituloOportunidade}`,
        mencionados,
        criadorPessoaId
      );
    }

    // 6. Sincronizar nota no cronograma (cada item da nota vira tarefa)
    try {
      const { data: contrato } = await supabase
        .from("contratos")
        .select("id, unidade_negocio")
        .eq("oportunidade_id", oportunidadeId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: oportunidade } = await supabase
        .from("oportunidades")
        .select("nucleos")
        .eq("id", oportunidadeId)
        .maybeSingle();

      const nucleoOportunidade =
        ((oportunidade as any)?.nucleos?.[0]?.nucleo as string | undefined) ||
        (contrato as any)?.unidade_negocio ||
        "engenharia";

      await sincronizarNotaClienteNoCronograma({
        notaId,
        clienteId,
        tituloProjeto: tituloOportunidade,
        nucleo: String(nucleoOportunidade).toLowerCase(),
        oportunidadeId,
        contratoId: (contrato as any)?.id || null,
      });
    } catch (erroCronograma) {
      console.error("Erro ao sincronizar nota no cronograma:", erroCronograma);
    }

    // 7. Retornar nota completa
    return listarNotaPorId(notaId);
  } catch (error) {
    console.error("Erro ao criar nota com checklist:", error);
    return null;
  }
}


