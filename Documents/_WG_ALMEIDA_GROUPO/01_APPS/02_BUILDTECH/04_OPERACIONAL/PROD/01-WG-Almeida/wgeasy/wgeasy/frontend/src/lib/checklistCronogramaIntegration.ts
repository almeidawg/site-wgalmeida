import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import { produtividadeService } from "@/lib/sinapiProdutividadeService";
import {
  adicionarHashtagsSeAusente,
  calcularOrdemExecucaoInteligente,
  gerarHashtagsFluxo,
} from "@/lib/cronogramaSmartTags";

interface ChecklistItemCronograma {
  id: string;
  texto: string;
  concluido?: boolean;
  ordem: number;
  data_inicio?: string | null;
  data_fim?: string | null;
}

export interface SincronizarChecklistCronogramaResult {
  projeto_id: string;
  tarefas_criadas: number;
  tarefas_existentes: number;
  tarefas_atualizadas?: number;
  membros_vinculados?: number;
}

export interface SincronizarNotaCronogramaResult {
  projeto_id: string;
  tarefas_criadas: number;
  tarefas_existentes: number;
  tarefas_atualizadas: number;
  membros_vinculados: number;
}

function normalizarDataISO(data?: string | null): string {
  if (!data) return new Date().toISOString().split("T")[0];
  return data.includes("T") ? data.split("T")[0] : data;
}

function adicionarDias(dataBase: Date, dias: number): string {
  const data = new Date(dataBase);
  data.setDate(data.getDate() + dias);
  return normalizarDataISO(data.toISOString());
}

function extrairMencoesIds(texto: string): string[] {
  const regex = /@\[([^\]]+)\]/g;
  const ids: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(texto)) !== null) {
    ids.push(match[1]);
  }
  return [...new Set(ids)];
}

function extrairMencoesNomes(texto: string): string[] {
  const nomes: string[] = [];
  const regex =
    /(^|[\s(])@([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9._-]*(?:\s+[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9._-]*){0,5})/g;
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
  const idsExplicitos = extrairMencoesIds(texto);
  const nomes = extrairMencoesNomes(texto);
  const ids = new Set<string>(idsExplicitos);

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
        if (tokens[0] && nomeCand.startsWith(tokens[0])) score += 20;
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
    if (resolved) ids.add(resolved);
  }

  return [...ids];
}

async function vincularPessoaNoProjeto(projetoId: string, pessoaId: string): Promise<boolean> {
  // Tabela atual usada nas telas de equipe
  const { data: membroExistente, error: erroBuscaEquipe } = await supabase
    .from("projeto_equipe")
    .select("id, ativo")
    .eq("projeto_id", projetoId)
    .eq("pessoa_id", pessoaId)
    .maybeSingle();

  if (!erroBuscaEquipe) {
    if (membroExistente?.id) {
      if (membroExistente.ativo) return false;
      const { error: erroReativar } = await supabase
        .from("projeto_equipe")
        .update({
          ativo: true,
          data_entrada: new Date().toISOString(),
          data_saida: null,
        })
        .eq("id", membroExistente.id);
      return !erroReativar;
    }

    const { data: pessoa } = await supabase
      .from("pessoas")
      .select("cargo, profissao, funcao")
      .eq("id", pessoaId)
      .maybeSingle();

    const funcaoNoProjeto =
      (pessoa as any)?.funcao || (pessoa as any)?.cargo || (pessoa as any)?.profissao || null;

    const { error: erroInsertEquipe } = await supabase
      .from("projeto_equipe")
      .insert({
        projeto_id: projetoId,
        pessoa_id: pessoaId,
        funcao_no_projeto: funcaoNoProjeto,
        ativo: true,
      });
    return !erroInsertEquipe;
  }

  // Fallback: ambientes que usam projeto_equipes
  const { data: membroEquipeV2, error: erroBuscaEquipeV2 } = await supabase
    .from("projeto_equipes")
    .select("id")
    .eq("projeto_id", projetoId)
    .eq("pessoa_id", pessoaId)
    .maybeSingle();

  if (erroBuscaEquipeV2) return false;
  if (membroEquipeV2?.id) return false;

  const { data: pessoaV2 } = await supabase
    .from("pessoas")
    .select("tipo, cargo, profissao, funcao")
    .eq("id", pessoaId)
    .maybeSingle();

  const tipoPessoa = String((pessoaV2 as any)?.tipo || "")
    .toLowerCase()
    .includes("fornecedor")
    ? "fornecedor"
    : "colaborador";
  const funcaoProjeto =
    (pessoaV2 as any)?.funcao || (pessoaV2 as any)?.cargo || (pessoaV2 as any)?.profissao || null;

  const { error: erroInsertEquipeV2 } = await supabase
    .from("projeto_equipes")
    .insert({
      projeto_id: projetoId,
      pessoa_id: pessoaId,
      tipo_pessoa: tipoPessoa,
      funcao: funcaoProjeto,
      is_responsavel: false,
    });
  return !erroInsertEquipeV2;
}

async function vincularMencionadosAoProjeto(
  projetoId: string,
  itens: ChecklistItemCronograma[]
): Promise<number> {
  const cache = new Map<string, string | null>();
  const mencionados = new Set<string>();

  for (const item of itens) {
    const ids = await resolverMencoesParaPessoas(item.texto || "", cache);
    ids.forEach((id) => mencionados.add(id));
  }

  let vinculados = 0;
  for (const pessoaId of mencionados) {
    const vinculou = await vincularPessoaNoProjeto(projetoId, pessoaId);
    if (vinculou) vinculados += 1;
  }

  return vinculados;
}

async function vincularPessoasAoProjeto(
  projetoId: string,
  pessoaIds: string[]
): Promise<number> {
  const unicos = [...new Set((pessoaIds || []).filter(Boolean))];
  let vinculados = 0;
  for (const pessoaId of unicos) {
    const vinculou = await vincularPessoaNoProjeto(projetoId, pessoaId);
    if (vinculou) vinculados += 1;
  }
  return vinculados;
}

// ============================================================
// Reverse Sync: Cronograma → Checklist
// ============================================================

export async function sincronizarCronogramaParaChecklist(params: {
  tarefaId: string;
  descricao: string;
  progresso?: number;
  status?: string;
  data_inicio?: string | null;
  data_termino?: string | null;
}): Promise<{ checklistItemId: string | null; atualizado: boolean }> {
  const match = String(params.descricao || "").match(/\[checklist-item:([a-zA-Z0-9-]+)\]/);
  if (!match?.[1]) {
    return { checklistItemId: null, atualizado: false };
  }

  const itemId = match[1];
  const payload: Record<string, unknown> = {};

  const isConcluido =
    (params.progresso !== undefined && params.progresso >= 100) ||
    params.status === "concluido";

  if (isConcluido) {
    payload.concluido = true;
    payload.concluido_em = new Date().toISOString();
  } else if (params.progresso !== undefined || params.status !== undefined) {
    payload.concluido = false;
    payload.concluido_em = null;
  }

  if (params.data_inicio !== undefined) {
    payload.data_inicio = params.data_inicio || null;
  }
  if (params.data_termino !== undefined) {
    let dataFim = params.data_termino || null;
    if (dataFim && params.data_inicio && dataFim < params.data_inicio) {
      dataFim = params.data_inicio;
    }
    payload.data_fim = dataFim;
  }

  if (Object.keys(payload).length === 0) {
    return { checklistItemId: itemId, atualizado: false };
  }

  const { error } = await supabase
    .from("cliente_checklist_items")
    .update(payload)
    .eq("id", itemId);

  return { checklistItemId: itemId, atualizado: !error };
}

// ============================================================
// Forward Sync: Checklist → Cronograma
// ============================================================

export async function sincronizarChecklistParaCronograma(params: {
  checklistItemId: string;
  concluido: boolean;
  data_inicio?: string | null;
  data_fim?: string | null;
}): Promise<{ tarefaId: string | null; atualizado: boolean }> {
  const { data: tarefas } = await supabase
    .from("cronograma_tarefas")
    .select("id")
    .like("descricao", `%[checklist-item:${params.checklistItemId}]%`)
    .limit(1);

  const tarefa = tarefas?.[0];
  if (!tarefa?.id) {
    return { tarefaId: null, atualizado: false };
  }

  const payload: Record<string, unknown> = {};

  if (params.concluido) {
    payload.status = "concluido";
    payload.progresso = 100;
  } else {
    payload.status = "pendente";
    payload.progresso = 0;
  }

  if (params.data_inicio !== undefined) {
    payload.data_inicio = params.data_inicio || null;
  }
  if (params.data_fim !== undefined) {
    payload.data_termino = params.data_fim || null;
  }

  const { error } = await supabase
    .from("cronograma_tarefas")
    .update(payload)
    .eq("id", tarefa.id);

  return { tarefaId: tarefa.id, atualizado: !error };
}

// ============================================================
// Estimativa de DuraçÍo via SINAPI
// ============================================================

export function estimarDuracaoSINAPI(params: {
  textoItem: string;
  quantidade?: number;
  unidade?: string;
  complexidade?: "baixa" | "media" | "alta";
}): { duracao_dias: number; servico_sinapi?: string; confianca: "alta" | "media" | "baixa" } {
  const resultados = produtividadeService.buscarPorServico(params.textoItem);

  if (resultados.length === 0) {
    return { duracao_dias: 1, confianca: "baixa" };
  }

  const melhorMatch = resultados[0];

  if (params.quantidade && params.quantidade > 0) {
    const calculo = produtividadeService.calcularPrazo(melhorMatch, params.quantidade, {
      complexidade: params.complexidade || "media",
    });
    if (calculo) {
      return {
        duracao_dias: Math.max(1, calculo.prazo_total_dias),
        servico_sinapi: calculo.servico,
        confianca: "alta",
      };
    }
  }

  return {
    duracao_dias: 1,
    servico_sinapi: melhorMatch.servico,
    confianca: "media",
  };
}

async function obterOuCriarProjeto(params: {
  oportunidadeId: string;
  tituloOportunidade: string;
  clienteId: string;
  nucleo: string;
  contratoId?: string | null;
}): Promise<string> {
  const { oportunidadeId, tituloOportunidade, clienteId, nucleo, contratoId } = params;

  if (contratoId) {
    const { data: projetoContrato } = await supabase
      .from("projetos")
      .select("id")
      .eq("contrato_id", contratoId)
      .maybeSingle();

    if (projetoContrato?.id) return projetoContrato.id;
  }

  const { data: projetoExistente } = await supabase
    .from("projetos")
    .select("id")
    .eq("cliente_id", clienteId)
    .eq("nucleo", nucleo)
    .eq("nome", tituloOportunidade)
    .maybeSingle();

  if (projetoExistente?.id) {
    if (contratoId) {
      await supabase
        .from("projetos")
        .update({ contrato_id: contratoId })
        .eq("id", projetoExistente.id)
        .is("contrato_id", null);
    }
    return projetoExistente.id;
  }

  const { data: oportunidade } = await supabase
    .from("oportunidades")
    .select("descricao, data_inicio_projeto, data_inicio_obra, data_fechamento")
    .eq("id", oportunidadeId)
    .maybeSingle();

  const dataInicio = normalizarDataISO(
    oportunidade?.data_inicio_projeto || oportunidade?.data_inicio_obra || oportunidade?.data_fechamento
  );

  const { data: projetoCriado, error } = await supabase
    .from("projetos")
    .insert({
      nome: tituloOportunidade,
      descricao:
        oportunidade?.descricao || `Projeto gerado dos checklists da oportunidade ${tituloOportunidade}`,
      cliente_id: clienteId,
      contrato_id: contratoId || null,
      nucleo,
      data_inicio: dataInicio,
      status: "em_andamento",
      progresso: 0,
    })
    .select("id")
    .single();

  if (error || !projetoCriado?.id) {
    throw new Error(error?.message || "Erro ao criar projeto para cronograma");
  }

  return projetoCriado.id;
}

async function listarItensChecklistOportunidade(
  oportunidadeId: string,
  checklistId?: string | null
): Promise<ChecklistItemCronograma[]> {
  let query = supabase
    .from("cliente_checklists")
    .select(`
      id,
      nome,
      cliente_checklist_items(id, texto, concluido, ordem, data_inicio, data_fim)
    `)
    .eq("oportunidade_id", oportunidadeId);

  if (checklistId) {
    query = query.eq("id", checklistId);
  }

  const { data: checklists, error } = await query.order("criado_em", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const itens: ChecklistItemCronograma[] = [];
  let ordemGlobal = 1;

  for (const checklist of checklists || []) {
    const itensChecklist = ((checklist as any).cliente_checklist_items || []) as ChecklistItemCronograma[];
    const ordenados = itensChecklist.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    for (const item of ordenados) {
      if (!item?.id || !item?.texto?.trim()) continue;
      itens.push({
        id: item.id,
        texto: item.texto.trim(),
        concluido: Boolean(item.concluido),
        ordem: ordemGlobal++,
        data_inicio: item.data_inicio || null,
        data_fim: item.data_fim || null,
      });
    }
  }

  return itens;
}

export async function sincronizarChecklistOportunidadeNoCronograma(params: {
  oportunidadeId: string;
  tituloOportunidade: string;
  clienteId: string;
  nucleo: string;
  contratoId?: string | null;
  checklistId?: string | null;
}): Promise<SincronizarChecklistCronogramaResult> {
  const { oportunidadeId, tituloOportunidade, clienteId, nucleo } = params;
  let contratoId = params.contratoId || null;

  if (!contratoId) {
    const { data: contrato } = await supabase
      .from("contratos")
      .select("id")
      .eq("oportunidade_id", oportunidadeId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    contratoId = contrato?.id || null;
  }

  const projetoId = await obterOuCriarProjeto({
    oportunidadeId,
    tituloOportunidade,
    clienteId,
    nucleo,
    contratoId,
  });

  const itensChecklist = await listarItensChecklistOportunidade(
    oportunidadeId,
    params.checklistId || null
  );

  if (itensChecklist.length === 0) {
    return {
      projeto_id: projetoId,
      tarefas_criadas: 0,
      tarefas_existentes: 0,
    };
  }

  const membrosVinculados = await vincularMencionadosAoProjeto(projetoId, itensChecklist);

  const { data: tarefasExistentes } = await supabase
    .from("cronograma_tarefas")
    .select("id, descricao, data_inicio, data_termino, titulo, ordem")
    .eq("projeto_id", projetoId);

  const tarefaPorChecklistItem = new Map<
    string,
    { id: string; data_inicio?: string | null; data_termino?: string | null; titulo?: string | null; ordem?: number | null }
  >();
  for (const tarefa of tarefasExistentes || []) {
    const match = String(tarefa.descricao || "").match(/\[checklist-item:([a-zA-Z0-9-]+)\]/);
    if (match?.[1]) {
      tarefaPorChecklistItem.set(match[1], tarefa as any);
    }
  }

  const hoje = new Date();
  const tarefasParaAtualizar: Array<{ id: string; payload: Record<string, any> }> = [];
  const itensParaCriar = itensChecklist
    .filter((item, index) => {
      const existente = tarefaPorChecklistItem.get(item.id);
      if (!existente) return true;

      const dataInicio = item.data_inicio
        ? normalizarDataISO(item.data_inicio)
        : normalizarDataISO(existente.data_inicio || adicionarDias(hoje, index));
      const dataTermino = item.data_fim
        ? normalizarDataISO(item.data_fim)
        : normalizarDataISO(existente.data_termino || adicionarDias(hoje, index + 1));
      const titulo = item.texto.length > 120 ? `${item.texto.slice(0, 117)}...` : item.texto;
      const descricao = adicionarHashtagsSeAusente(
        `${item.texto} [checklist-item:${item.id}]`,
        gerarHashtagsFluxo({
          nucleo,
          categoria: "checklist",
          tipo: "tarefa",
          origem: "checklist",
        })
      );
      const ordemInteligente = calcularOrdemExecucaoInteligente({
        ordemBase: item.ordem,
        nucleo,
        categoria: "checklist",
        tipo: "tarefa",
        titulo,
        descricao,
      });

      const precisaAtualizar =
        String(existente.titulo || "") !== titulo ||
        String(existente.ordem ?? 0) !== String(ordemInteligente ?? 0) ||
        normalizarDataISO(existente.data_inicio || null) !== dataInicio ||
        normalizarDataISO(existente.data_termino || null) !== dataTermino ||
        String((tarefasExistentes || []).find((t: any) => t.id === existente.id)?.descricao || "") !== descricao;

      if (precisaAtualizar) {
        tarefasParaAtualizar.push({
          id: existente.id,
          payload: {
            titulo,
            descricao,
            nucleo,
            data_inicio: dataInicio,
            data_termino: dataTermino,
            ordem: ordemInteligente,
          },
        });
      }

      return false;
    });

  // Buscar itens do contrato para obter dados de estimativa
  const itensContratoMap = new Map<string, { quantidade?: number; unidade?: string; producao_diaria?: number; dias_estimados?: number }>();
  if (contratoId) {
    const { data: itensContrato } = await supabase
      .from("contratos_itens")
      .select("nome, descricao, quantidade, unidade, producao_diaria, dias_estimados")
      .eq("contrato_id", contratoId);
    for (const ic of itensContrato || []) {
      const chave = normalizarTexto(ic.nome || ic.descricao || "");
      if (chave) {
        itensContratoMap.set(chave, {
          quantidade: ic.quantidade ?? undefined,
          unidade: ic.unidade ?? undefined,
          producao_diaria: ic.producao_diaria ?? undefined,
          dias_estimados: ic.dias_estimados ?? undefined,
        });
      }
    }
  }

  // Gerar tarefas com datas sequenciais e estimativas SINAPI
  let cumulativeDate = new Date(hoje);
  const tarefasParaCriar = itensParaCriar.map((item) => {
    // Determinar duraçÍo estimada
    let duracaoDias = 1;

    if (!item.data_inicio && !item.data_fim) {
      // Tentar match com item de contrato
      const textoNorm = normalizarTexto(item.texto);
      let matchContrato: { quantidade?: number; unidade?: string; producao_diaria?: number; dias_estimados?: number } | undefined;
      for (const [chave, valor] of itensContratoMap) {
        if (textoNorm.includes(chave) || chave.includes(textoNorm)) {
          matchContrato = valor;
          break;
        }
      }

      if (matchContrato?.dias_estimados && matchContrato.dias_estimados > 0) {
        duracaoDias = matchContrato.dias_estimados;
      } else {
        const estimativa = estimarDuracaoSINAPI({
          textoItem: item.texto,
          quantidade: matchContrato?.quantidade,
          unidade: matchContrato?.unidade,
        });
        duracaoDias = estimativa.duracao_dias;
      }
    }

    const dataInicio = item.data_inicio
      ? normalizarDataISO(item.data_inicio)
      : normalizarDataISO(cumulativeDate.toISOString());
    const dataTermino = item.data_fim
      ? normalizarDataISO(item.data_fim)
      : adicionarDias(new Date(dataInicio + "T12:00:00"), duracaoDias);

    // Avançar data cumulativa para a próxima tarefa
    if (!item.data_fim) {
      cumulativeDate = new Date(dataTermino + "T12:00:00");
    } else {
      cumulativeDate = new Date(normalizarDataISO(item.data_fim) + "T12:00:00");
    }

    const descricao = adicionarHashtagsSeAusente(
      `${item.texto} [checklist-item:${item.id}]`,
      gerarHashtagsFluxo({
        nucleo,
        categoria: "checklist",
        tipo: "tarefa",
        origem: "checklist",
      })
    );
    const ordemInteligente = calcularOrdemExecucaoInteligente({
      ordemBase: item.ordem,
      nucleo,
      categoria: "checklist",
      tipo: "tarefa",
      titulo: item.texto,
      descricao,
    });

    return {
      projeto_id: projetoId,
      titulo: item.texto.length > 120 ? `${item.texto.slice(0, 117)}...` : item.texto,
      descricao,
      nucleo,
      data_inicio: dataInicio,
      data_termino: dataTermino,
      duracao_dias: duracaoDias,
      status: item.concluido ? "concluido" : "pendente",
      progresso: item.concluido ? 100 : 0,
      ordem: ordemInteligente,
    };
  });

  let tarefasAtualizadas = 0;
  for (const tarefa of tarefasParaAtualizar) {
    const { error } = await supabase
      .from("cronograma_tarefas")
      .update(tarefa.payload)
      .eq("id", tarefa.id);
    if (!error) tarefasAtualizadas += 1;
  }

  if (tarefasParaCriar.length > 0) {
    const { error } = await supabase.from("cronograma_tarefas").insert(tarefasParaCriar);
    if (error) {
      throw new Error(error.message);
    }
  }

  return {
    projeto_id: projetoId,
    tarefas_criadas: tarefasParaCriar.length,
    tarefas_existentes: itensChecklist.length - tarefasParaCriar.length,
    tarefas_atualizadas: tarefasAtualizadas,
    membros_vinculados: membrosVinculados,
  };
}

export async function sincronizarNotaClienteNoCronograma(params: {
  notaId: string;
  clienteId: string;
  tituloProjeto: string;
  nucleo: string;
  oportunidadeId?: string | null;
  contratoId?: string | null;
}): Promise<SincronizarNotaCronogramaResult> {
  const {
    notaId,
    clienteId,
    tituloProjeto,
    nucleo,
    oportunidadeId = null,
    contratoId = null,
  } = params;

  const projetoId = await obterOuCriarProjeto({
    oportunidadeId: oportunidadeId || "00000000-0000-0000-0000-000000000000",
    tituloOportunidade: tituloProjeto,
    clienteId,
    nucleo,
    contratoId,
  });

  const { data: itensNota, error: erroItensNota } = await supabase
    .from("notas_sistema_itens")
    .select("id, texto, checked, ordem, mencionado_id")
    .eq("nota_id", notaId)
    .order("ordem", { ascending: true });

  if (erroItensNota) {
    throw new Error(erroItensNota.message);
  }

  const itensValidos = (itensNota || [])
    .filter((item: any) => String(item?.texto || "").trim().length > 0)
    .map((item: any, index: number) => ({
      id: String(item.id),
      texto: String(item.texto || "").trim(),
      checked: Boolean(item.checked),
      ordem: Number(item.ordem ?? index + 1),
      mencionado_id: item.mencionado_id ? String(item.mencionado_id) : null,
    }));

  if (itensValidos.length === 0) {
    return {
      projeto_id: projetoId,
      tarefas_criadas: 0,
      tarefas_existentes: 0,
      tarefas_atualizadas: 0,
      membros_vinculados: 0,
    };
  }

  const mencionados = itensValidos
    .map((item) => item.mencionado_id)
    .filter((id): id is string => Boolean(id));
  const membrosVinculados = await vincularPessoasAoProjeto(projetoId, mencionados);

  const { data: tarefasExistentes } = await supabase
    .from("cronograma_tarefas")
    .select("id, descricao, titulo, ordem, status, progresso")
    .eq("projeto_id", projetoId);

  const tarefaPorNotaItem = new Map<string, any>();
  for (const tarefa of tarefasExistentes || []) {
    const match = String(tarefa.descricao || "").match(/\[nota-item:([a-zA-Z0-9-]+)\]/);
    if (match?.[1]) {
      tarefaPorNotaItem.set(match[1], tarefa);
    }
  }

  const hoje = normalizarDataISO(new Date().toISOString());
  const amanha = adicionarDias(new Date(), 1);
  const tarefasParaCriar: Array<Record<string, any>> = [];
  const tarefasParaAtualizar: Array<{ id: string; payload: Record<string, any> }> = [];

  for (const item of itensValidos) {
    const titulo = item.texto.length > 120 ? `${item.texto.slice(0, 117)}...` : item.texto;
    const descricao = adicionarHashtagsSeAusente(
      `${item.texto} [nota-item:${item.id}]`,
      gerarHashtagsFluxo({
        nucleo,
        categoria: "nota",
        tipo: "tarefa",
        origem: "nota",
      })
    );
    const ordemInteligente = calcularOrdemExecucaoInteligente({
      ordemBase: item.ordem,
      nucleo,
      categoria: "nota",
      tipo: "tarefa",
      titulo,
      descricao,
    });
    const status = item.checked ? "concluido" : "pendente";
    const progresso = item.checked ? 100 : 0;
    const existente = tarefaPorNotaItem.get(item.id);

    if (!existente) {
      tarefasParaCriar.push({
        projeto_id: projetoId,
        titulo,
        descricao,
        nucleo,
        data_inicio: hoje,
        data_termino: amanha,
        duracao_dias: 1,
        status,
        progresso,
        ordem: ordemInteligente,
      });
      continue;
    }

    const precisaAtualizar =
      String(existente.titulo || "") !== titulo ||
      String(existente.descricao || "") !== descricao ||
      String(existente.ordem ?? 0) !== String(ordemInteligente ?? 0) ||
      String(existente.status || "") !== status ||
      Number(existente.progresso ?? 0) !== progresso;

    if (precisaAtualizar) {
      tarefasParaAtualizar.push({
        id: existente.id,
        payload: {
          titulo,
          descricao,
          nucleo,
          ordem: ordemInteligente,
          status,
          progresso,
        },
      });
    }
  }

  if (tarefasParaCriar.length > 0) {
    const { error } = await supabase.from("cronograma_tarefas").insert(tarefasParaCriar);
    if (error) throw new Error(error.message);
  }

  let tarefasAtualizadas = 0;
  for (const tarefa of tarefasParaAtualizar) {
    const { error } = await supabase
      .from("cronograma_tarefas")
      .update(tarefa.payload)
      .eq("id", tarefa.id);
    if (!error) tarefasAtualizadas += 1;
  }

  return {
    projeto_id: projetoId,
    tarefas_criadas: tarefasParaCriar.length,
    tarefas_existentes: itensValidos.length - tarefasParaCriar.length,
    tarefas_atualizadas: tarefasAtualizadas,
    membros_vinculados: membrosVinculados,
  };
}

