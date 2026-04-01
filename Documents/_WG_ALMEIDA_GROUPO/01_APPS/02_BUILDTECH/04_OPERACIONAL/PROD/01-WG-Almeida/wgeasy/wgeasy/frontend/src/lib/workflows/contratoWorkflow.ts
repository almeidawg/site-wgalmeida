// ============================================================
// WORKFLOW: Contratos
// Orquestracao do fluxo de ativacao e execucao de contratos
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { supabase } from "@/lib/supabaseClient";
import type { Contrato } from "@/types/contratos";
import { gerarPedidoDeContrato } from "@/lib/comprasApi";
import { adicionarHashtagsSeAusente, calcularOrdemExecucaoInteligente, gerarHashtagsFluxo } from "@/lib/cronogramaSmartTags";

// ============================================================
// TIPOS
// ============================================================

export interface AtivarContratoRequest {
  contrato_id: string;
  gerar_financeiro: boolean;
  gerar_compras: boolean;
  gerar_cronograma: boolean;
  configuracao_parcelas?: ConfiguracaoParcelas;
  ativacao_automatica?: boolean; // Pula validacao de assinaturas
}

export interface ConfiguracaoParcelas {
  numero_parcelas: number;
  dia_vencimento: number;
  periodicidade: "mensal" | "quinzenal" | "semanal";
  primeira_parcela_entrada?: boolean;
  valor_entrada?: number;
  percentual_entrada?: number;
}

export interface AtivarContratoResult {
  sucesso: boolean;
  mensagem: string;
  contrato: Contrato;
  financeiro_id?: string;
  parcelas_criadas?: number;
  pedido_compra_id?: string;
  projeto_id?: string;
  tarefas_criadas?: number;
  avisos?: string[];
}

function isMissingColumnError(error: any, column: string): boolean {
  if (!error) return false;
  const code = String(error.code || "");
  const message = String(error.message || error.msg || "");
  return (
    code === "PGRST204" ||
    code === "42703" ||
    message.includes(column) ||
    message.includes(`'${column}'`)
  );
}

/**
 * Rotina automatica: se o contrato esta ativo e ainda nao tem lancamento de entrada,
 * cria um lancamento de entrada (status previsto) com nucleo/pessoa.
 */
export async function garantirFinanceiroContratoAtivo(
  contrato_id: string
): Promise<void> {
  const { data: contrato } = await supabase
    .from("contratos")
    .select("id, numero, status, valor_total, cliente_id, unidade_negocio")
    .eq("id", contrato_id)
    .single();

  if (!contrato || contrato.status !== "ativo") return;

  const { data: entrada } = await supabase
    .from("financeiro_lancamentos")
    .select("id")
    .eq("contrato_id", contrato_id)
    .eq("tipo", "entrada")
    .limit(1)
    .maybeSingle();

  if (entrada) return;

  await supabase.from("financeiro_lancamentos").insert({
    tipo: "entrada",
    status: "pendente",
    descricao: `Receita do contrato ${contrato.numero}${
      contrato.unidade_negocio ? ` - ${contrato.unidade_negocio.toUpperCase()}` : ""
    }`,
    valor_total: contrato.valor_total ?? 0,
    pessoa_id: contrato.cliente_id,
    contrato_id: contrato.id,
    nucleo: contrato.unidade_negocio,
    unidade_negocio: contrato.unidade_negocio,
    categoria_id: null,  // ✅ Categoria opcional
    data_competencia: new Date().toISOString().split("T")[0],
    vencimento: new Date().toISOString().split("T")[0],
  });
}

// ============================================================
// ATIVACAO DE CONTRATO
// ============================================================

export async function ativarContrato(
  request: AtivarContratoRequest
): Promise<AtivarContratoResult> {
  const {
    contrato_id,
    gerar_financeiro,
    gerar_compras,
    gerar_cronograma,
    configuracao_parcelas,
    ativacao_automatica = false,
  } = request;

  const resultado: AtivarContratoResult = {
    sucesso: false,
    mensagem: "",
    contrato: {} as Contrato,
    avisos: [],
  };

  try {
    const { data: contrato, error: contratoError } = await supabase
      .from("contratos")
      .select("*, cliente:pessoas(*), oportunidade:oportunidades(*)")
      .eq("id", contrato_id)
      .single();

    if (contratoError || !contrato) {
      resultado.mensagem = "Contrato nao encontrado";
      return resultado;
    }

    if (!ativacao_automatica) {
      if (!contrato.assinatura_cliente_base64 || !contrato.assinatura_responsavel_base64) {
        resultado.mensagem = "Contrato precisa estar assinado por ambas as partes";
        return resultado;
      }
    }

    const { data: contratoAtualizado, error: updateError } = await supabase
      .from("contratos")
      .update({
        status: "ativo",
        data_ativacao: new Date().toISOString(),
      })
      .eq("id", contrato_id)
      .select()
      .single();

    if (updateError || !contratoAtualizado) {
      resultado.mensagem = "Erro ao ativar contrato";
      return resultado;
    }

    resultado.contrato = contratoAtualizado as any;

    if (gerar_financeiro) {
      try {
        const resultadoFinanceiro = await gerarFinanceiroContrato(
          contrato_id,
          contrato,
          configuracao_parcelas
        );
        resultado.financeiro_id = resultadoFinanceiro.financeiro_id;
        resultado.parcelas_criadas = resultadoFinanceiro.parcelas_criadas;

        // Card/resumo para dashboards financeiros/projetos
        await criarResumoFinanceiroContrato(
          contratoAtualizado,
          configuracao_parcelas
        );
      } catch (error: any) {
        resultado.avisos?.push(`Erro ao gerar financeiro: ${error.message}`);
      }
    }

    // NOVO: Criar registro na tabela obras (para módulo financeiro/obras)
    try {
      await criarObraContrato(contrato_id, contrato);
    } catch (error: any) {
      resultado.avisos?.push(`Erro ao criar obra: ${error.message}`);
    }

    if (gerar_compras) {
      try {
        const pedido = await gerarPedidoDeContrato(contrato_id);
        resultado.pedido_compra_id = pedido.id;
      } catch (error: any) {
        if (error.message.includes("nao possui itens de material")) {
          resultado.avisos?.push("Contrato nao possui materiais para compra");
        } else {
          resultado.avisos?.push(`Erro ao gerar pedido de compra: ${error.message}`);
        }
      }
    }

    if (gerar_cronograma) {
      try {
        const resultadoCronograma = await gerarCronogramaContrato(
          contrato_id,
          contrato
        );
        resultado.projeto_id = resultadoCronograma.projeto_id;
        resultado.tarefas_criadas = resultadoCronograma.tarefas_criadas;
      } catch (error: any) {
        resultado.avisos?.push(`Erro ao gerar cronograma: ${error.message}`);
      }
    }

    resultado.sucesso = true;
    resultado.mensagem = "Contrato ativado com sucesso!";
    return resultado;
  } catch (error: any) {
    resultado.mensagem = `Erro ao ativar contrato: ${error.message}`;
    return resultado;
  }
}

// ============================================================
// GERACAO DE FINANCEIRO (entrada + parcelas separadas)
// ============================================================

async function gerarFinanceiroContrato(
  contrato_id: string,
  contrato: any,
  configuracao?: ConfiguracaoParcelas
): Promise<{ financeiro_id: string; parcelas_criadas: number }> {
  const { data: receitaExistente } = await supabase
    .from("financeiro_lancamentos")
    .select("id")
    .eq("contrato_id", contrato_id)
    .eq("tipo", "entrada")
    .limit(1)
    .maybeSingle();

  if (receitaExistente) {
    throw new Error("Ja existe registro financeiro para este contrato");
  }

  const total = Number(contrato.valor_total || 0);
  const numParcelas = configuracao?.numero_parcelas ?? 0;
  const percEntrada =
    configuracao?.percentual_entrada ?? contrato.percentual_entrada ?? 0;
  const valorEntrada =
    configuracao?.valor_entrada !== undefined
      ? Number(configuracao.valor_entrada)
      : (total * percEntrada) / 100;

  const valorRestante = total - (valorEntrada || 0);
  const valorParcela = numParcelas > 0 ? valorRestante / numParcelas : 0;

  const diaVenc = configuracao?.dia_vencimento || new Date().getDate();
  const baseDate = new Date();
  baseDate.setDate(diaVenc);

  const lancamentos: any[] = [];

  if (valorEntrada > 0) {
    lancamentos.push({
      tipo: "entrada",
      status: "pendente",
      descricao: `Entrada contrato ${contrato.numero}${
        contrato.unidade_negocio ? ` - ${contrato.unidade_negocio.toUpperCase()}` : ""
      }`,
      valor_total: valorEntrada,
      pessoa_id: contrato.cliente_id,
      contrato_id,
      nucleo: contrato.unidade_negocio,
      unidade_negocio: contrato.unidade_negocio,
      categoria_id: null,  // ✅ Categoria opcional
      data_competencia: baseDate.toISOString().split("T")[0],
      vencimento: baseDate.toISOString().split("T")[0],
    });
  }

  for (let i = 0; i < numParcelas; i++) {
    const venc = new Date(baseDate);
    venc.setMonth(venc.getMonth() + i);

    lancamentos.push({
      tipo: "entrada",
      status: "pendente",
      descricao: `Parcela ${i + 1}/${numParcelas} contrato ${contrato.numero}${
        contrato.unidade_negocio ? ` - ${contrato.unidade_negocio.toUpperCase()}` : ""
      }`,
      valor_total: valorParcela,
      pessoa_id: contrato.cliente_id,
      contrato_id,
      nucleo: contrato.unidade_negocio,
      unidade_negocio: contrato.unidade_negocio,
      categoria_id: null,  // ✅ Categoria opcional
      data_competencia: venc.toISOString().split("T")[0],
      vencimento: venc.toISOString().split("T")[0],
    });
  }

  // Se não tem entrada nem parcelas, criar lançamento único com valor total
  if (lancamentos.length === 0 && total > 0) {
    lancamentos.push({
      tipo: "entrada",
      status: "pendente",
      descricao: `Receita contrato ${contrato.numero}${
        contrato.unidade_negocio ? ` - ${contrato.unidade_negocio.toUpperCase()}` : ""
      }`,
      valor_total: total,
      pessoa_id: contrato.cliente_id,
      contrato_id,
      nucleo: contrato.unidade_negocio,
      unidade_negocio: contrato.unidade_negocio,
      categoria_id: null,
      data_competencia: baseDate.toISOString().split("T")[0],
      vencimento: baseDate.toISOString().split("T")[0],
    });
  }

  if (lancamentos.length === 0) {
    throw new Error("Nenhum lancamento gerado (verifique total/parcelas)");
  }

  const { data: inseridos, error: receitaError } = await supabase
    .from("financeiro_lancamentos")
    .insert(lancamentos)
    .select("id, valor_total, vencimento");

  if (receitaError || !inseridos) {
    throw new Error("Erro ao criar registros financeiros");
  }

  // Criar cobranças automáticas para cada lançamento de entrada
  try {
    const nomeCliente =
      contrato.cliente?.nome || contrato.cliente_nome || "Cliente";

    const cobrancas = (inseridos || []).map((lanc: any) => ({
      obra_id: null,
      contrato_id,
      lancamento_id: lanc.id ?? null,
      nucleo: contrato.unidade_negocio ?? null,
      cliente: nomeCliente,
      valor: lanc.valor_total,
      vencimento: lanc.vencimento,
      status: "Pendente",
    }));

    if (cobrancas.length > 0) {
      const { error: insertCobrancaError } = await supabase
        .from("cobrancas")
        .insert(cobrancas);

      if (insertCobrancaError && isMissingColumnError(insertCobrancaError, "lancamento_id")) {
        const cobrancasLegacy = (inseridos || []).map((lanc: any) => ({
          obra_id: null,
          contrato_id,
          nucleo: contrato.unidade_negocio ?? null,
          cliente: nomeCliente,
          valor: lanc.valor_total,
          vencimento: lanc.vencimento,
          status: "Pendente",
          dados_bancarios: { financeiro_lancamento_id: lanc.id },
        }));

        const { error: legacyError } = await supabase
          .from("cobrancas")
          .insert(cobrancasLegacy as any);

        if (legacyError) {
          console.warn("Falha ao criar cobranças automáticas (legacy):", legacyError);
        }
      } else if (insertCobrancaError) {
        console.warn("Falha ao criar cobranças automáticas:", insertCobrancaError);
      }
    }
  } catch (err) {
    // não bloquear ativaçÍo se der erro ao criar cobranças
    console.warn("Falha ao criar cobranças automáticas:", err);
  }

  return {
    financeiro_id: inseridos[0].id,
    parcelas_criadas: numParcelas,
  };
}

// ============================================================
// RESUMO FINANCEIRO/PROJETOS (card)
// ============================================================

async function criarResumoFinanceiroContrato(
  contrato: any,
  config?: ConfiguracaoParcelas
): Promise<void> {
  const valorTotal = Number(contrato.valor_total || 0);
  const percEntrada =
    config?.percentual_entrada ?? contrato.percentual_entrada ?? 0;
  const valorEntrada =
    config?.valor_entrada !== undefined
      ? Number(config.valor_entrada)
      : (valorTotal * percEntrada) / 100;

  const numeroParcelas =
    config?.numero_parcelas ?? contrato.numero_parcelas ?? 0;

  try {
    await supabase.from("financeiro_projetos_resumo").upsert(
      {
        contrato_id: contrato.id,
        cliente_id: contrato.cliente_id,
        cliente_nome: contrato.cliente?.nome || contrato.cliente_nome || "",
        numero: contrato.numero,
        nucleo: contrato.unidade_negocio,
        valor_total: valorTotal,
        valor_entrada: valorEntrada,
        numero_parcelas: numeroParcelas,
        data_inicio: contrato.data_inicio || new Date().toISOString(),
        data_previsao_termino: contrato.data_previsao_termino || null,
        status: contrato.status || "ativo",
      },
      { onConflict: "contrato_id" }
    );
  } catch (err) {
    console.warn("Resumo financeiro não criado:", err);
  }
}

// ============================================================
// GERACAO DE CRONOGRAMA
// ============================================================

/**
 * Extrai o título/nome de um campo que pode ser string ou objeto JSON
 */
function extrairTituloItem(valor: any, fallback: string): string {
  if (!valor) return fallback;

  // Se já é string simples, usa direto
  if (typeof valor === "string") {
    // Verifica se é JSON stringificado
    if (valor.startsWith("{")) {
      try {
        const parsed = JSON.parse(valor);
        return parsed.nome || parsed.descricao || parsed.titulo || fallback;
      } catch {
        return valor.trim() || fallback;
      }
    }
    return valor.trim() || fallback;
  }

  // Se é objeto, extrai o campo relevante
  if (typeof valor === "object" && valor !== null) {
    return valor.nome || valor.descricao || valor.titulo || fallback;
  }

  return fallback;
}

async function gerarCronogramaContrato(
  contrato_id: string,
  contrato: any
): Promise<{ projeto_id: string; tarefas_criadas: number }> {
  // Reaproveitar projeto existente (se houver), sem bloquear reprocessamento
  const { data: projetoExistente } = await supabase
    .from("projetos")
    .select("id")
    .eq("contrato_id", contrato_id)
    .maybeSingle();

  let projetoId = projetoExistente?.id;

  if (!projetoId) {
    const clienteNome = contrato.cliente?.nome || contrato.cliente_nome || "Cliente";
    const { data: projeto, error: projetoError } = await supabase
      .from("projetos")
      .insert({
        nome: `Obra ${contrato.numero} - ${clienteNome}`,
        descricao:
          contrato.descricao || `Projeto gerado do contrato ${contrato.numero}`,
        cliente_id: contrato.cliente_id,
        contrato_id: contrato_id,
        nucleo: contrato.unidade_negocio || "engenharia",
        data_inicio: new Date().toISOString().split("T")[0],
        data_termino: contrato.data_previsao_termino || null,
        status: "em_andamento",
        progresso: 0,
      })
      .select("id")
      .single();

    if (projetoError || !projeto?.id) {
      console.error("Erro ao criar projeto:", projetoError);
      throw new Error("Erro ao criar projeto");
    }
    projetoId = projeto.id;
  }

  if (!projetoId) {
    throw new Error("Projeto não disponível para gerar cronograma");
  }

  const { data: tarefasExistentes } = await supabase
    .from("cronograma_tarefas")
    .select("descricao")
    .eq("projeto_id", projetoId);

  const chavesExistentes = new Set<string>();
  for (const tarefa of tarefasExistentes || []) {
    const descricao = String((tarefa as any).descricao || "");
    const matchContrato = descricao.match(/\[contrato-item:([a-zA-Z0-9-]+)\]/);
    if (matchContrato?.[1]) chavesExistentes.add(`contrato-${matchContrato[1]}`);
    const matchChecklist = descricao.match(/\[checklist-item:([a-zA-Z0-9-]+)\]/);
    if (matchChecklist?.[1]) chavesExistentes.add(`checklist-${matchChecklist[1]}`);
  }

  const { data: itensContrato, error: itensError } = await supabase
    .from("contratos_itens")
    .select("*")
    .eq("contrato_id", contrato_id)
    .order("ordem", { ascending: true });

  if (itensError) {
    throw new Error("Erro ao buscar itens do contrato");
  }

  let tarefas_criadas = 0;
  const dataInicio = new Date();
  const tarefasParaInserir: any[] = [];

  if (itensContrato && itensContrato.length > 0) {
    for (const [index, item] of itensContrato.entries()) {
      const chave = `contrato-${item.id}`;
      if (chavesExistentes.has(chave)) continue;

      const dataInicioTarefa = new Date(dataInicio);
      dataInicioTarefa.setDate(dataInicioTarefa.getDate() + index * 7);

      const dataFimTarefa = new Date(dataInicioTarefa);
      dataFimTarefa.setDate(dataFimTarefa.getDate() + 6);

      const tituloTarefa = extrairTituloItem(item.descricao, `Item ${index + 1}`);

      tarefasParaInserir.push({
        projeto_id: projetoId,
        titulo: tituloTarefa,
        descricao: adicionarHashtagsSeAusente(
          `${item.quantidade || 1} ${item.unidade || "un"} - ${item.tipo || "servico"} [contrato-item:${item.id}]`,
          gerarHashtagsFluxo({
            nucleo: item.nucleo || contrato.unidade_negocio,
            categoria: item.categoria,
            tipo: item.tipo,
            origem: "contrato",
          })
        ),
        nucleo: item.nucleo || contrato.unidade_negocio || "engenharia",
        categoria: item.categoria,
        data_inicio: dataInicioTarefa.toISOString().split("T")[0],
        data_termino: dataFimTarefa.toISOString().split("T")[0],
        progresso: 0,
        status: "pendente",
        ordem: calcularOrdemExecucaoInteligente({
          ordemBase: item.ordem || index + 1,
          nucleo: item.nucleo || contrato.unidade_negocio,
          categoria: item.categoria,
          tipo: item.tipo,
          titulo: tituloTarefa,
          descricao: item.descricao,
        }),
      });
    }
  } else {
    const chavePadrao = "contrato-default";
    if (!chavesExistentes.has(chavePadrao)) {
      const dataFim = new Date(dataInicio);
      dataFim.setDate(dataFim.getDate() + (contrato.prazo_entrega_dias || 30));
      tarefasParaInserir.push({
        projeto_id: projetoId,
        titulo: "Execucao da Obra",
        descricao: adicionarHashtagsSeAusente(
          `${contrato.descricao || "Executar conforme contrato"} [contrato-item:default]`,
          gerarHashtagsFluxo({
            nucleo: contrato.unidade_negocio,
            categoria: "execucao",
            tipo: "servico",
            origem: "contrato",
          })
        ),
        nucleo: contrato.unidade_negocio || "engenharia",
        data_inicio: dataInicio.toISOString().split("T")[0],
        data_termino: dataFim.toISOString().split("T")[0],
        progresso: 0,
        status: "pendente",
        ordem: calcularOrdemExecucaoInteligente({
          ordemBase: 1,
          nucleo: contrato.unidade_negocio,
          categoria: "execucao",
          tipo: "servico",
          titulo: "Execucao da Obra",
          descricao: contrato.descricao,
        }),
      });
    }
  }

  // Complementar com checklist da oportunidade, quando existir vínculo
  if (contrato.oportunidade_id) {
    const { data: checklists } = await supabase
      .from("cliente_checklists")
      .select("cliente_checklist_items(id, texto, ordem, data_inicio, data_fim)")
      .eq("oportunidade_id", contrato.oportunidade_id)
      .order("criado_em", { ascending: true });

    let ordemChecklist = tarefasParaInserir.length + 1;
    for (const checklist of checklists || []) {
      const itensChecklist = ((checklist as any).cliente_checklist_items || []) as Array<{
        id: string;
        texto: string;
        ordem: number;
        data_inicio?: string | null;
        data_fim?: string | null;
      }>;

      for (const item of itensChecklist.sort((a, b) => (a.ordem || 0) - (b.ordem || 0))) {
        if (!item?.id || !item?.texto?.trim()) continue;
        const chave = `checklist-${item.id}`;
        if (chavesExistentes.has(chave)) continue;
        tarefasParaInserir.push({
          projeto_id: projetoId,
          titulo: item.texto.length > 120 ? `${item.texto.slice(0, 117)}...` : item.texto,
          descricao: adicionarHashtagsSeAusente(
            `${item.texto} [checklist-item:${item.id}]`,
            gerarHashtagsFluxo({
              nucleo: contrato.unidade_negocio || "engenharia",
              categoria: "checklist",
              tipo: "tarefa",
              origem: "checklist",
            })
          ),
          nucleo: contrato.unidade_negocio || "engenharia",
          data_inicio: item.data_inicio || dataInicio.toISOString().split("T")[0],
          data_termino:
            item.data_fim ||
            new Date(dataInicio.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          duracao_dias: 1,
          progresso: 0,
          status: "pendente",
          ordem: calcularOrdemExecucaoInteligente({
            ordemBase: ordemChecklist++,
            nucleo: contrato.unidade_negocio || "engenharia",
            categoria: "checklist",
            tipo: "tarefa",
            titulo: item.texto,
            descricao: item.texto,
          }),
        });
      }
    }
  }

  if (tarefasParaInserir.length > 0) {
    const { data: tarefasCriadas, error: tarefasError } = await supabase
      .from("cronograma_tarefas")
      .insert(tarefasParaInserir)
      .select("id");

    if (tarefasError) {
      console.error("Erro ao criar tarefas:", tarefasError);
    } else {
      tarefas_criadas = tarefasCriadas?.length || 0;
    }
  }

  return {
    projeto_id: projetoId,
    tarefas_criadas,
  };
}

// ============================================================
// CANCELAMENTO DE CONTRATO
// ============================================================

export async function cancelarContrato(
  contrato_id: string,
  motivo: string
): Promise<{ sucesso: boolean; mensagem: string }> {
  try {
    const { data: contrato } = await supabase
      .from("contratos")
      .select("status, numero")
      .eq("id", contrato_id)
      .single();

    if (!contrato) {
      return { sucesso: false, mensagem: "Contrato nao encontrado" };
    }

    if (contrato.status === "concluido") {
      return {
        sucesso: false,
        mensagem: "Nao e possivel cancelar contrato ja concluido",
      };
    }

    await supabase
      .from("contratos")
      .update({
        status: "cancelado",
        data_cancelamento: new Date().toISOString(),
        motivo_cancelamento: motivo,
      })
      .eq("id", contrato_id);

    await supabase
      .from("financeiro")
      .update({ status: "cancelado" })
      .eq("contrato_id", contrato_id)
      .eq("tipo", "receita");

    await supabase
      .from("pedidos_compra")
      .update({ status: "cancelado" })
      .eq("contrato_id", contrato_id);

    await supabase
      .from("projetos")
      .update({ status: "cancelado" })
      .eq("contrato_id", contrato_id);

    return {
      sucesso: true,
      mensagem: `Contrato ${contrato.numero} cancelado com sucesso`,
    };
  } catch (error: any) {
    return {
      sucesso: false,
      mensagem: `Erro ao cancelar contrato: ${error.message}`,
    };
  }
}

// ============================================================
// CONCLUSAO DE CONTRATO
// ============================================================

export async function concluirContrato(
  contrato_id: string
): Promise<{ sucesso: boolean; mensagem: string; pendencias?: string[] }> {
  try {
    const pendencias: string[] = [];

    const { data: projeto } = await supabase
      .from("projetos")
      .select("status, id")
      .eq("contrato_id", contrato_id)
      .maybeSingle();

    if (projeto) {
      if (projeto.status !== "concluido") {
        pendencias.push("Projeto ainda nao foi concluido");
      }

      const { data: tarefasPendentes } = await supabase
        .from("cronograma_tarefas")
        .select("id")
        .eq("projeto_id", projeto.id)
        .neq("status", "concluido");

      if (tarefasPendentes && tarefasPendentes.length > 0) {
        pendencias.push(
          `Existem ${tarefasPendentes.length} tarefa(s) pendente(s) no cronograma`
        );
      }
    }

    const { data: financeiro } = await supabase
      .from("financeiro")
      .select("id")
      .eq("contrato_id", contrato_id)
      .eq("tipo", "receita")
      .single();

    if (financeiro) {
      const { data: parcelasPendentes } = await supabase
        .from("financeiro_parcelas")
        .select("id")
        .eq("financeiro_id", financeiro.id)
        .neq("status", "pago");

      if (parcelasPendentes && parcelasPendentes.length > 0) {
        pendencias.push(
          `Existem ${parcelasPendentes.length} parcela(s) financeira(s) pendente(s)`
        );
      }
    }

    if (pendencias.length > 0) {
      return {
        sucesso: false,
        mensagem: "Nao e possivel concluir o contrato devido as pendencias",
        pendencias,
      };
    }

    await supabase
      .from("contratos")
      .update({
        status: "concluido",
        data_conclusao: new Date().toISOString(),
      })
      .eq("id", contrato_id);

    return {
      sucesso: true,
      mensagem: "Contrato concluido com sucesso!",
    };
  } catch (error: any) {
    return {
      sucesso: false,
      mensagem: `Erro ao concluir contrato: ${error.message}`,
    };
  }
}

// ============================================================
// CRIACAO DE OBRA (financeiro/obras)
// ============================================================

/**
 * Criar registro na tabela obras para integraçÍo com módulo financeiro/obras
 */
async function criarObraContrato(
  contrato_id: string,
  contrato: any
): Promise<{ obra_id: string }> {
  // Verificar se já existe obra com o mesmo nome/contrato
  const nomeObra = `Obra ${contrato.numero} - ${contrato.cliente?.nome || contrato.cliente_nome || "Cliente"}`;

  const { data: obraExistente } = await supabase
    .from("obras")
    .select("id")
    .eq("nome", nomeObra)
    .maybeSingle();

  if (obraExistente) {
    console.log(`⚠️ Obra já existe: ${nomeObra}`);
    return { obra_id: obraExistente.id };
  }

  // Obter user_id do criador do contrato
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id || contrato.created_by;

  // Extrair endereço dos dados do imóvel se disponível
  let endereco = contrato.endereco_obra || null;
  if (!endereco && contrato.dados_imovel_json) {
    const dadosImovel = typeof contrato.dados_imovel_json === "string"
      ? JSON.parse(contrato.dados_imovel_json)
      : contrato.dados_imovel_json;
    endereco = dadosImovel?.endereco || dadosImovel?.endereco_completo || null;
  }

  // Criar obra
  const { data: obra, error: obraError } = await supabase
    .from("obras")
    .insert({
      user_id: userId,
      nome: nomeObra,
      endereco: endereco,
      data_prevista_entrega: contrato.data_previsao_termino
        ? contrato.data_previsao_termino.split("T")[0]
        : null,
      status: "em_andamento",
    })
    .select()
    .single();

  if (obraError) {
    console.error("Erro ao criar obra:", obraError);
    throw new Error(`Erro ao criar obra: ${obraError.message}`);
  }

  console.log(`✅ Obra criada: ${obra.nome}`);
  return { obra_id: obra.id };
}


