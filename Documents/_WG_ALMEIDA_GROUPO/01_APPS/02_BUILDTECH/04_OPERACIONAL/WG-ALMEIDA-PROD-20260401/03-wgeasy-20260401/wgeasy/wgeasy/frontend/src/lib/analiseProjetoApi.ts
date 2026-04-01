// ============================================================
// API: Análise de Projeto (Pré-Proposta)
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { supabase } from "./supabaseClient";
import type {
  AnaliseProjeto,
  AnaliseProjetoAmbiente,
  AnaliseProjetoCompleta,
  AnaliseProjetoFormData,
  AnaliseAmbienteFormData,
  StatusAnaliseProjeto,
  AnaliseIAResultado,
} from "@/types/analiseProjeto";

function isAuthError(error: any): boolean {
  if (!error) return false;
  const status = Number(error?.status || 0);
  const code = String(error?.code || "").toUpperCase();
  const message = String(error?.message || "").toLowerCase();
  const details = String(error?.details || "").toLowerCase();

  if (status === 401 || status === 403) return true;
  if (code === "PGRST301" || code === "42501") return true;

  return (
    message.includes("jwt") ||
    message.includes("unauthorized") ||
    message.includes("not authenticated") ||
    message.includes("permission denied") ||
    details.includes("jwt")
  );
}

function toFriendlyAuthError(operacao: string): Error {
  return new Error(`SessÍo expirada ou sem permissÍo para ${operacao}. Faça login novamente e tente de novo.`);
}

async function ensureSession(operacao: string): Promise<void> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data?.session?.access_token) {
    throw toFriendlyAuthError(operacao);
  }
}

// ============================================================
// ANÁLISES DE PROJETO
// ============================================================

/**
 * Listar todas as análises de projeto
 */
export async function listarAnalises(): Promise<AnaliseProjetoCompleta[]> {
  // PaginaçÍo automática (contorna limite 1000 rows Supabase)
  const PAGE_SIZE = 1000;
  let allData: any[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data: pageData, error } = await supabase
      .from("analises_projeto")
      .select("*")
      .order("criado_em", { ascending: false })
      .range(from, to);

    if (error) throw error;
    const rows = pageData ?? [];
    allData = allData.concat(rows);
    hasMore = rows.length === PAGE_SIZE;
    page++;
  }

  const data = allData;
  if (data.length === 0) return [];

  // Buscar dados dos clientes separadamente
  const clienteIds = [...new Set(data.map(a => a.cliente_id).filter(Boolean))];
  let clientesMap: Record<string, { nome: string; email: string; telefone: string }> = {};

  if (clienteIds.length > 0) {
    const { data: clientes } = await supabase
      .from("pessoas")
      .select("id, nome, email, telefone")
      .in("id", clienteIds);

    if (clientes) {
      clientesMap = Object.fromEntries(
        clientes.map(c => [c.id, { nome: c.nome, email: c.email || "", telefone: c.telefone || "" }])
      );
    }
  }

  return data.map((row: any) => ({
    ...row,
    cliente_nome: row.cliente_id ? clientesMap[row.cliente_id]?.nome || "Cliente não encontrado" : "Cliente não encontrado",
    cliente_email: row.cliente_id ? clientesMap[row.cliente_id]?.email || "" : "",
    cliente_telefone: row.cliente_id ? clientesMap[row.cliente_id]?.telefone || "" : "",
    plantas_urls: row.plantas_urls || [],
  }));
}

/**
 * Listar análises por cliente
 */
export async function listarAnalisesPorCliente(clienteId: string): Promise<AnaliseProjetoCompleta[]> {
  // Buscar análises
  const { data, error } = await supabase
    .from("analises_projeto")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("criado_em", { ascending: false });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  // Buscar dados do cliente
  const { data: cliente } = await supabase
    .from("pessoas")
    .select("nome, email, telefone")
    .eq("id", clienteId)
    .single();

  return data.map((row: any) => ({
    ...row,
    cliente_nome: cliente?.nome || "Cliente não encontrado",
    cliente_email: cliente?.email || "",
    cliente_telefone: cliente?.telefone || "",
    plantas_urls: row.plantas_urls || [],
  }));
}

/**
 * Listar análises disponíveis para vincular a propostas
 * Mostra todas as análises do cliente que podem ser usadas em propostas:
 * - "analisado": análise concluída pela IA
 * - "aprovado": análise revisada e aprovada
 * - "vinculado": já tem proposta, mas pode ser re-usada
 * não inclui "rascunho" ou "analisando" pois não estÍo completas
 */
export async function listarAnalisesAprovadas(clienteId?: string): Promise<AnaliseProjetoCompleta[]> {
  console.log(`[listarAnalisesAprovadas] Iniciando busca com cliente_id: "${clienteId || "TODOS"}"`);

  // Construir query de forma mais explícita
  const statusValidos = ["analisado", "aprovado", "vinculado"];

  let data: any[] | null = null;
  let error: any = null;

  // Helper que tenta a tabela e, se faltar coluna, cai para a view completa (que costuma ter cliente_id)
  const executarBusca = async (fonte: "analises_projeto" | "vw_analises_projeto_completas") => {
    console.log(`[listarAnalisesAprovadas] Fonte: ${fonte}`);
    if (clienteId) {
      return await supabase
        .from(fonte)
        .select("*")
        .eq("cliente_id", clienteId)
        .in("status", statusValidos)
        .order("criado_em", { ascending: false });
    }
    return await supabase
      .from(fonte)
      .select("*")
      .in("status", statusValidos)
      .order("criado_em", { ascending: false });
  };

  let resultado = await executarBusca("analises_projeto");
  data = resultado.data;
  error = resultado.error;

  // Se der erro de coluna inexistente (42703), tentar a view
  if (error && String(error.code) === "42703") {
    console.warn("[listarAnalisesAprovadas] Coluna cliente_id não existe em analises_projeto, tentando view vw_analises_projeto_completas");
    resultado = await executarBusca("vw_analises_projeto_completas");
    data = resultado.data;
    error = resultado.error;
  }

  console.log(`[listarAnalisesAprovadas] Resultado: ${data?.length || 0} análises encontradas`);
  if (data && data.length > 0) {
    console.log(`[listarAnalisesAprovadas] Análises retornadas:`, data.map(a => ({
      id: a.id,
      titulo: a.titulo,
      cliente_id: a.cliente_id,
      status: a.status,
    })));

    // Verificar se há análises de outros clientes (debug)
    if (clienteId) {
      const analisesOutrosClientes = data.filter(a => a.cliente_id !== clienteId);
      if (analisesOutrosClientes.length > 0) {
        console.warn(`[listarAnalisesAprovadas] ALERTA: ${analisesOutrosClientes.length} análises de OUTROS clientes retornadas!`,
          analisesOutrosClientes.map(a => ({ id: a.id, titulo: a.titulo, cliente_id: a.cliente_id })));
      }
    }
  }

  if (error) {
    console.error(`[listarAnalisesAprovadas] Erro na query:`, error);
    throw error;
  }
  if (!data || data.length === 0) return [];

  // Buscar dados dos clientes separadamente
  const clienteIds = [...new Set(data.map(a => a.cliente_id).filter(Boolean))];
  let clientesMap: Record<string, string> = {};

  if (clienteIds.length > 0) {
    const { data: clientes } = await supabase
      .from("pessoas")
      .select("id, nome")
      .in("id", clienteIds);

    if (clientes) {
      clientesMap = Object.fromEntries(clientes.map(c => [c.id, c.nome]));
    }
  }

  return data.map((row: any) => ({
    ...row,
    cliente_nome: row.cliente_id ? clientesMap[row.cliente_id] || "Cliente não encontrado" : "Cliente não encontrado",
    plantas_urls: row.plantas_urls || [],
  }));
}

/**
 * Buscar análise por ID (com ambientes)
 */
export async function buscarAnalise(id: string): Promise<AnaliseProjetoCompleta> {
  // Buscar análise principal (sem joins)
  const { data: analise, error: analiseError } = await supabase
    .from("analises_projeto")
    .select("*")
    .eq("id", id)
    .single();

  if (analiseError) throw analiseError;
  if (!analise) throw new Error("Análise não encontrada");

  // Buscar dados do cliente separadamente
  let clienteData: { nome: string; email: string; telefone: string } | null = null;
  if (analise.cliente_id) {
    const { data: cliente } = await supabase
      .from("pessoas")
      .select("nome, email, telefone")
      .eq("id", analise.cliente_id)
      .single();
    clienteData = cliente;
  }

  // Buscar dados da proposta separadamente
  let propostaData: { titulo: string; numero: string } | null = null;
  if (analise.proposta_id) {
    const { data: proposta } = await supabase
      .from("propostas")
      .select("titulo, numero")
      .eq("id", analise.proposta_id)
      .single();
    propostaData = proposta;
  }

  // Adicionar dados do cliente e proposta ao objeto
  (analise as any).pessoas = clienteData;
  (analise as any).propostas = propostaData;

  // Buscar ambientes
  const { data: ambientes, error: ambientesError } = await supabase
    .from("analises_projeto_ambientes")
    .select("*")
    .eq("analise_id", id)
    .order("ordem", { ascending: true });

  if (ambientesError) throw ambientesError;

  // Buscar acabamentos da análise (se existir a tabela)
  let acabamentos: any[] = [];
  try {
    const { data: acabamentosData, error: acabamentosError } = await supabase
      .from("analises_projeto_acabamentos")
      .select("*")
      .eq("analise_id", id);

    if (!acabamentosError && acabamentosData) {
      acabamentos = acabamentosData;
    }
  } catch (err) {
    // Tabela pode não existir ainda
    console.warn("Tabela de acabamentos não encontrada:", err);
  }

  let oportunidadeTitulo: string | null = null;
  if (analise.oportunidade_id) {
    try {
      const { data: oportunidade } = await supabase
        .from("oportunidades")
        .select("titulo")
        .eq("id", analise.oportunidade_id)
        .single();
      oportunidadeTitulo = oportunidade?.titulo || null;
    } catch (err) {
      console.warn("Tabela de oportunidades não encontrada:", err);
    }
  }

  return {
    ...analise,
    cliente_nome: analise.pessoas?.nome || "Cliente não encontrado",
    cliente_email: analise.pessoas?.email || "",
    cliente_telefone: analise.pessoas?.telefone || "",
    oportunidade_titulo: oportunidadeTitulo,
    proposta_titulo: analise.propostas?.titulo || null,
    proposta_numero: analise.propostas?.numero || null,
    plantas_urls: analise.plantas_urls || [],
    ambientes: (ambientes || []).map((amb: any) => ({
      ...amb,
      portas: amb.portas || [],
      janelas: amb.janelas || [],
      vaos: [], // não existe na tabela - manter vazio
      envidracamentos: [], // não existe na tabela - manter vazio
      tomadas_especiais: [], // não existe na tabela - manter vazio
      circuitos: [], // não existe na tabela - manter vazio
      tubulacao_seca: [], // não existe na tabela - manter vazio
      alertas: [], // não existe na tabela - manter vazio
    })),
    acabamentos: acabamentos.map((acab: any) => ({
      tipo: acab.tipo || "revestimento",
      ambiente: acab.ambiente || "",
      material: acab.material || "",
      area: acab.area || 0,
      metragem_linear: acab.metragem_linear || 0,
      quantidade: acab.quantidade || 0,
      descricao: acab.descricao || "",
    })),
  };
}

/**
 * Criar nova análise de projeto
 */
export async function criarAnalise(dados: AnaliseProjetoFormData): Promise<AnaliseProjeto> {
  await ensureSession("criar análise");

  const payloadBase = {
    cliente_id: dados.cliente_id,
    oportunidade_id: dados.oportunidade_id || null,
    titulo: dados.titulo,
    descricao: dados.descricao || null,
    tipo_projeto: dados.tipo_projeto || "reforma",
    tipo_imovel: dados.tipo_imovel || null,
    area_total: dados.area_total || null,
    pe_direito_padrao: dados.pe_direito_padrao || 2.7,
    endereco_obra: dados.endereco_obra || null,
    padrao_construtivo: dados.padrao_construtivo || null,
    plantas_urls: dados.plantas_urls || [],
    memorial_descritivo: dados.memorial_descritivo || null,
    contrato_texto: dados.contrato_texto || null,
  };

  let data: any = null;
  let error: any = null;
  let payloadAtual: Record<string, any> = { ...payloadBase };

  const maxTentativas = Object.keys(payloadAtual).length + 1;
  let tentativa = 0;
  while (tentativa < maxTentativas) {
    tentativa += 1;
    ({ data, error } = await supabase
      .from("analises_projeto")
      .insert(payloadAtual)
      .select()
      .single());

    if (!error) break;
    if (isAuthError(error)) throw toFriendlyAuthError("criar análise");

    const matchColuna = String(error.message || "").match(/'([^']+)'/);
    const coluna = matchColuna?.[1];
    if (!coluna || !(coluna in payloadAtual)) break;

    const { [coluna]: _omit, ...resto } = payloadAtual;
    payloadAtual = resto;
  }

  if (error) {
    if (isAuthError(error)) throw toFriendlyAuthError("criar análise");
    throw error;
  }
  if (!data) throw new Error("Erro ao criar análise");

  return data;
}

/**
 * Atualizar análise de projeto
 */
export async function atualizarAnalise(
  id: string,
  dados: Partial<AnaliseProjetoFormData>
): Promise<AnaliseProjeto> {
  await ensureSession("atualizar análise");

  const payloadBase = {
    ...dados,
    atualizado_em: new Date().toISOString(),
  };

  let data: any = null;
  let error: any = null;
  let payloadAtual: Record<string, any> = { ...payloadBase };

  const maxTentativas = Object.keys(payloadAtual).length + 1;
  let tentativa = 0;
  while (tentativa < maxTentativas) {
    tentativa += 1;
    ({ data, error } = await supabase
      .from("analises_projeto")
      .update(payloadAtual)
      .eq("id", id)
      .select()
      .single());

    if (!error) break;
    if (isAuthError(error)) throw toFriendlyAuthError("atualizar análise");

    const matchColuna = String(error.message || "").match(/'([^']+)'/);
    const coluna = matchColuna?.[1];
    if (!coluna || !(coluna in payloadAtual)) break;

    const { [coluna]: _omit, ...resto } = payloadAtual;
    payloadAtual = resto;
  }

  if (error) {
    if (isAuthError(error)) throw toFriendlyAuthError("atualizar análise");
    throw error;
  }
  if (!data) throw new Error("Análise não encontrada");

  return data;
}

/**
 * Atualizar status da análise
 */
export async function atualizarStatusAnalise(
  id: string,
  status: StatusAnaliseProjeto
): Promise<AnaliseProjeto> {
  await ensureSession("atualizar status da análise");

  const { data, error } = await supabase
    .from("analises_projeto")
    .update({
      status,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (isAuthError(error)) throw toFriendlyAuthError("atualizar status da análise");
    throw error;
  }
  if (!data) throw new Error("Análise não encontrada");

  return data;
}

/**
 * Salvar resultado da análise IA
 */
export async function salvarResultadoAnaliseIA(
  id: string,
  resultado: AnaliseIAResultado,
  provedor: "openai" | "anthropic" | "sistema",
  modelo: string,
  tempoMs: number,
  promptUtilizado?: string
): Promise<void> {
  await ensureSession("salvar resultado da análise");

  // Atualizar análise com resultado
  const { error: analiseError } = await supabase
    .from("analises_projeto")
    .update({
      analise_ia: resultado,
      provedor_ia: provedor,
      modelo_ia: modelo,
      tempo_processamento_ms: tempoMs,
      prompt_utilizado: promptUtilizado || null,
      status: "analisado",
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id);

  if (analiseError) {
    if (isAuthError(analiseError)) throw toFriendlyAuthError("salvar resultado da análise");
    throw analiseError;
  }

  // Criar ambientes a partir do resultado
  if (resultado.ambientes && resultado.ambientes.length > 0) {
    // Buscar area_total e pe_direito_padrao do projeto para fallback
    let areaTotalProjeto = 0;
    let peDireitoProjeto = 2.7;
    try {
      const { data: analiseData } = await supabase
        .from("analises_projeto")
        .select("area_total, pe_direito_padrao")
        .eq("id", id)
        .single();
      if (analiseData?.area_total) areaTotalProjeto = Number(analiseData.area_total);
      if (analiseData?.pe_direito_padrao) peDireitoProjeto = Number(analiseData.pe_direito_padrao);
    } catch { /* ignorar */ }

    // Proporções típicas de área por tipo de ambiente (para distribuiçÍo inteligente)
    const PESOS_AREA: Record<string, number> = {
      sala: 3.0, sala_estar: 3.0, sala_jantar: 2.5, living: 3.5,
      quarto: 2.0, suite: 2.5, suite_master: 3.0, dormitorio: 2.0,
      cozinha: 1.8, copa: 1.2,
      banheiro: 0.8, lavabo: 0.5, wc: 0.5,
      lavanderia: 0.8, area_servico: 0.8,
      varanda: 1.2, sacada: 1.0, terraco: 1.5,
      escritorio: 1.5, closet: 1.0,
      corredor: 0.6, hall: 0.5, circulacao: 0.6,
      garagem: 2.0, deposito: 0.5,
      outro: 1.0, geral: 1.0,
    };

    const obterPesoAmbiente = (nome: string, tipo?: string): number => {
      const nomeLower = nome.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9 ]/g, " ");
      // Verificar por tipo primeiro
      if (tipo && PESOS_AREA[tipo]) return PESOS_AREA[tipo];
      // Verificar por palavras-chave no nome
      for (const [chave, peso] of Object.entries(PESOS_AREA)) {
        const chaveLimpa = chave.replace(/_/g, " ");
        if (nomeLower.includes(chaveLimpa)) return peso;
      }
      return 1.0;
    };

    const ambientesParaInserir = resultado.ambientes.map((amb, index) => {
      const peDireito = amb.pe_direito || peDireitoProjeto;

      // PRIORIDADE ABSOLUTA: usar área informada pela IA
      let areaPiso = amb.area || 0;
      let largura = amb.largura || 0;
      let comprimento = amb.comprimento || 0;
      let perimetro = 0;

      if (areaPiso > 0) {
        if (largura > 0 && comprimento > 0) {
          perimetro = 2 * (largura + comprimento);
        } else {
          const lado = Math.sqrt(areaPiso);
          largura = Math.round(lado * 100) / 100;
          comprimento = Math.round(lado * 100) / 100;
          perimetro = 4 * lado;
        }
      } else if (largura > 0 && comprimento > 0) {
        areaPiso = largura * comprimento;
        perimetro = 2 * (largura + comprimento);
      }

      const areaParedesBruta = perimetro * peDireito;

      return {
        analise_id: id,
        nome: amb.nome,
        tipo: amb.tipo || null,
        largura: largura || null,
        comprimento: comprimento || null,
        pe_direito: peDireito,
        area_piso: areaPiso,
        area_teto: areaPiso,
        perimetro: perimetro || null,
        area_paredes_bruta: areaParedesBruta || null,
        area_paredes_liquida: areaParedesBruta || null,
        portas: [],
        janelas: [],
        area_vaos_total: 0,
        tomadas_110v: 0,
        tomadas_220v: 0,
        pontos_iluminacao: 0,
        interruptores_simples: 0,
        pontos_agua_fria: 0,
        pontos_agua_quente: 0,
        pontos_esgoto: 0,
        pontos_gas: 0,
        ordem: index,
        observacoes: amb.descricao || null,
        origem: "ia" as const,
        editado_manualmente: false,
      };
    });

    // REGRA: Se nenhum ambiente tem área mas o projeto tem area_total, distribuir proporcionalmente
    const temAlgumaArea = ambientesParaInserir.some(a => a.area_piso > 0);
    if (!temAlgumaArea && areaTotalProjeto > 0 && ambientesParaInserir.length > 0) {
      console.log(`[salvarResultadoAnaliseIA] Distribuindo area_total=${areaTotalProjeto} m² entre ${ambientesParaInserir.length} ambientes`);

      // Calcular pesos totais
      const pesos = ambientesParaInserir.map(amb =>
        obterPesoAmbiente(amb.nome, amb.tipo || undefined)
      );
      const pesoTotal = pesos.reduce((sum, p) => sum + p, 0);

      ambientesParaInserir.forEach((amb, i) => {
        const proporcao = pesos[i] / pesoTotal;
        const areaPiso = Math.round(areaTotalProjeto * proporcao * 100) / 100;
        const peDireito = amb.pe_direito || peDireitoProjeto;
        const lado = Math.sqrt(areaPiso);
        const largura = Math.round(lado * 100) / 100;
        const comprimento = Math.round(lado * 100) / 100;
        const perimetro = Math.round(4 * lado * 100) / 100;
        const areaParedesBruta = Math.round(perimetro * peDireito * 100) / 100;

        // Estimar vÍos: ~1 porta (0.9x2.1=1.89m²) + janelas proporcionais
        const numPortas = Math.max(1, Math.floor(perimetro / 4));
        const nomeL = amb.nome.toLowerCase();
        const ehBanheiro = nomeL.includes("banheiro") || nomeL.includes("lavabo") || nomeL.includes("wc");
        const numJanelas = ehBanheiro ? 1 : Math.max(0, Math.floor(perimetro / 5));
        const areaPortas = numPortas * 1.89;
        const areaJanelas = numJanelas * (ehBanheiro ? 0.36 : 1.44); // 0.6x0.6 ou 1.2x1.2
        const areaVaosTotal = Math.round((areaPortas + areaJanelas) * 100) / 100;
        const areaParedesLiquida = Math.max(0, Math.round((areaParedesBruta - areaVaosTotal) * 100) / 100);

        amb.area_piso = areaPiso;
        amb.area_teto = areaPiso;
        amb.largura = largura;
        amb.comprimento = comprimento;
        amb.perimetro = perimetro;
        amb.area_paredes_bruta = areaParedesBruta;
        amb.area_paredes_liquida = areaParedesLiquida;
        amb.area_vaos_total = areaVaosTotal;
      });
    }

    // Remover ambientes anteriores (se houver)
    await supabase
      .from("analises_projeto_ambientes")
      .delete()
      .eq("analise_id", id);

    // Inserir novos ambientes
    const { error: ambientesError } = await supabase
      .from("analises_projeto_ambientes")
      .insert(ambientesParaInserir);

    if (ambientesError) {
      console.error("Erro ao salvar ambientes:", ambientesError);
    }

    // Atualizar totais do projeto
    const totalAreaPiso = ambientesParaInserir.reduce((s, a) => s + (a.area_piso || 0), 0);
    const totalAreaParedes = ambientesParaInserir.reduce((s, a) => s + (a.area_paredes_liquida || a.area_paredes_bruta || 0), 0);
    const totalPerimetro = ambientesParaInserir.reduce((s, a) => s + (a.perimetro || 0), 0);

    await supabase
      .from("analises_projeto")
      .update({
        total_ambientes: ambientesParaInserir.length,
        total_area_piso: Math.round(totalAreaPiso * 100) / 100,
        total_area_paredes: Math.round(totalAreaParedes * 100) / 100,
        total_perimetro: Math.round(totalPerimetro * 100) / 100,
      })
      .eq("id", id);
  }

  // Salvar elementos em tabela separada (se existir)
  if (resultado.elementos && resultado.elementos.length > 0) {
    const elementosParaInserir = resultado.elementos.map((elem) => ({
      analise_id: id,
      tipo: elem.tipo,
      descricao: elem.descricao || null,
      quantidade: elem.quantidade || 1,
      largura: elem.medidas?.largura || null,
      altura: elem.medidas?.altura || null,
      origem: "ia",
    }));

    const { error: elementosError } = await supabase
      .from("analises_projeto_elementos")
      .insert(elementosParaInserir);

    if (elementosError) {
      console.error("Erro ao salvar elementos:", elementosError);
    }
  }

  // Salvar acabamentos em tabela separada (se existir)
  if (resultado.acabamentos && resultado.acabamentos.length > 0) {
    const acabamentosParaInserir = resultado.acabamentos.map((acab) => ({
      analise_id: id,
      tipo: acab.tipo,
      material: acab.material || null,
      descricao: acab.descricao || null,
      area_m2: acab.area || null,
      metragem_linear: acab.metragem_linear || null,
      quantidade: acab.quantidade || null,
      origem: "ia",
    }));

    const { error: acabamentosError } = await supabase
      .from("analises_projeto_acabamentos")
      .insert(acabamentosParaInserir);

    if (acabamentosError) {
      console.error("Erro ao salvar acabamentos:", acabamentosError);
    }
  }

  // Salvar servicos em tabela separada (NOVO - para propostas)
  console.log(`[salvarResultadoAnaliseIA] Verificando serviços: ${resultado.servicos?.length || 0} encontrados`);

  if (resultado.servicos && resultado.servicos.length > 0) {
    console.log(`[salvarResultadoAnaliseIA] Salvando ${resultado.servicos.length} serviços...`);

    // Remover servicos anteriores (se houver)
    await supabase
      .from("analises_projeto_servicos")
      .delete()
      .eq("analise_id", id);

    const servicosParaInserir = resultado.servicos.map((srv, index) => ({
      analise_id: id,
      categoria: srv.categoria || "geral",
      tipo: srv.tipo || null,
      descricao: srv.descricao || "",
      unidade: srv.unidade || "un",
      quantidade: srv.quantidade || null,
      area: srv.area || null,
      metragem_linear: srv.metragem_linear || null,
      especificacoes: srv.especificacoes || {},
      termo_busca: srv.vinculo_pricelist?.termo_busca || null,
      palavras_chave: srv.vinculo_pricelist?.palavras_chave || [],
      categoria_sugerida: srv.vinculo_pricelist?.categoria_sugerida || null,
      ambiente_nome: srv.ambiente || null,
      ambientes_nomes: srv.ambientes || [],
      ordem: index,
      origem: "ia",
      selecionado: true,
      importado_para_proposta: false,
    }));

    const { error: servicosError } = await supabase
      .from("analises_projeto_servicos")
      .insert(servicosParaInserir);

    if (servicosError) {
      console.error("Erro ao salvar servicos:", servicosError);
    } else {
      console.log(`✅ ${servicosParaInserir.length} servicos salvos para analise ${id}`);
    }
  }
}

/**
 * Deletar análise de projeto
 */
export async function deletarAnalise(id: string): Promise<void> {
  const { error } = await supabase
    .from("analises_projeto")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/**
 * Duplicar análise de projeto (com todos os ambientes, serviços e acabamentos)
 */
export async function duplicarAnalise(id: string): Promise<AnaliseProjeto> {
  // 1. Buscar análise original com ambientes
  const analiseOriginal = await buscarAnalise(id);

  // 2. Gerar novo título com sufixo (Cópia)
  const novoTitulo = `${analiseOriginal.titulo} (Cópia)`;

  // 3. Criar nova análise (sem id, numero, proposta_id)
  const { data: novaAnalise, error: erroAnalise } = await supabase
    .from("analises_projeto")
    .insert({
      cliente_id: analiseOriginal.cliente_id,
      titulo: novoTitulo,
      descricao: analiseOriginal.descricao,
      tipo_projeto: analiseOriginal.tipo_projeto,
      tipo_imovel: analiseOriginal.tipo_imovel,
      padrao_construtivo: analiseOriginal.padrao_construtivo,
      area_total: analiseOriginal.area_total,
      pe_direito_padrao: analiseOriginal.pe_direito_padrao,
      endereco_obra: analiseOriginal.endereco_obra,
      plantas_urls: analiseOriginal.plantas_urls,
      status: "rascunho", // Sempre começa como rascunho
      total_ambientes: analiseOriginal.total_ambientes,
      total_area_piso: analiseOriginal.total_area_piso,
      total_area_paredes: analiseOriginal.total_area_paredes,
      total_perimetro: analiseOriginal.total_perimetro,
    })
    .select()
    .single();

  if (erroAnalise) throw erroAnalise;

  // Mapear IDs antigos para novos (para manter referências)
  const ambienteIdMap: Record<string, string> = {};

  // 4. Duplicar ambientes (se existirem)
  if (analiseOriginal.ambientes && analiseOriginal.ambientes.length > 0) {
    for (let index = 0; index < analiseOriginal.ambientes.length; index++) {
      const amb = analiseOriginal.ambientes[index];
      const { data: novoAmbiente, error: erroAmbiente } = await supabase
        .from("analises_projeto_ambientes")
        .insert({
          analise_id: novaAnalise.id,
          nome: amb.nome,
          tipo: amb.tipo,
          codigo: amb.codigo,
          largura: amb.largura,
          comprimento: amb.comprimento,
          pe_direito: amb.pe_direito,
          area_piso: amb.area_piso,
          area_teto: amb.area_teto,
          perimetro: amb.perimetro,
          area_paredes_bruta: amb.area_paredes_bruta,
          area_paredes_liquida: amb.area_paredes_liquida,
          portas: amb.portas || [],
          janelas: amb.janelas || [],
          area_vaos_total: amb.area_vaos_total || 0,
          tomadas_110v: amb.tomadas_110v || 0,
          tomadas_220v: amb.tomadas_220v || 0,
          tomadas_especiais: amb.tomadas_especiais || [],
          pontos_iluminacao: amb.pontos_iluminacao || 0,
          interruptores_simples: amb.interruptores_simples || 0,
          interruptores_paralelo: amb.interruptores_paralelo || 0,
          interruptores_intermediario: amb.interruptores_intermediario || 0,
          circuitos: amb.circuitos || [],
          pontos_agua_fria: amb.pontos_agua_fria || 0,
          pontos_agua_quente: amb.pontos_agua_quente || 0,
          pontos_esgoto: amb.pontos_esgoto || 0,
          pontos_gas: amb.pontos_gas || 0,
          tubulacao_seca: amb.tubulacao_seca || [],
          piso_tipo: amb.piso_tipo,
          piso_area: amb.piso_area,
          parede_tipo: amb.parede_tipo,
          parede_area: amb.parede_area,
          teto_tipo: amb.teto_tipo,
          teto_area: amb.teto_area,
          rodape_tipo: amb.rodape_tipo,
          rodape_ml: amb.rodape_ml,
          ordem: index,
          observacoes: amb.observacoes,
          alertas: amb.alertas || [],
          origem: "manual",
          editado_manualmente: true,
        })
        .select()
        .single();

      if (!erroAmbiente && novoAmbiente) {
        ambienteIdMap[amb.id] = novoAmbiente.id;
      } else if (erroAmbiente) {
        console.error("Erro ao duplicar ambiente:", erroAmbiente);
      }
    }
  }

  // 5. Duplicar serviços (se existirem)
  try {
    const { data: servicos } = await supabase
      .from("analises_projeto_servicos")
      .select("*")
      .eq("analise_id", id)
      .order("ordem", { ascending: true });

    if (servicos && servicos.length > 0) {
      const servicosDuplicados = servicos.map((serv, index) => ({
        analise_id: novaAnalise.id,
        ambiente_id: serv.ambiente_id ? ambienteIdMap[serv.ambiente_id] || null : null,
        categoria: serv.categoria,
        tipo: serv.tipo,
        descricao: serv.descricao,
        unidade: serv.unidade,
        quantidade: serv.quantidade,
        area: serv.area,
        metragem_linear: serv.metragem_linear,
        especificacoes: serv.especificacoes,
        termo_busca: serv.termo_busca,
        palavras_chave: serv.palavras_chave,
        categoria_sugerida: serv.categoria_sugerida,
        pricelist_item_id: serv.pricelist_item_id,
        pricelist_match_score: serv.pricelist_match_score,
        ambiente_nome: serv.ambiente_nome,
        ambientes_nomes: serv.ambientes_nomes,
        ordem: index,
        origem: serv.origem,
        selecionado: serv.selecionado,
        importado_para_proposta: false, // Sempre false na cópia
      }));

      const { error: erroServicos } = await supabase
        .from("analises_projeto_servicos")
        .insert(servicosDuplicados);

      if (erroServicos) {
        console.error("Erro ao duplicar serviços:", erroServicos);
      }
    }
  } catch (err) {
    console.warn("Erro ao buscar/duplicar serviços:", err);
  }

  // 6. Duplicar acabamentos (se existirem)
  try {
    const { data: acabamentos } = await supabase
      .from("analises_projeto_acabamentos")
      .select("*")
      .eq("analise_id", id);

    if (acabamentos && acabamentos.length > 0) {
      const acabamentosDuplicados = acabamentos.map((acab) => ({
        analise_id: novaAnalise.id,
        ambiente_id: acab.ambiente_id ? ambienteIdMap[acab.ambiente_id] || null : null,
        tipo: acab.tipo,
        ambiente: acab.ambiente,
        material: acab.material,
        area: acab.area,
        metragem_linear: acab.metragem_linear,
        quantidade: acab.quantidade,
        descricao: acab.descricao,
      }));

      const { error: erroAcabamentos } = await supabase
        .from("analises_projeto_acabamentos")
        .insert(acabamentosDuplicados);

      if (erroAcabamentos) {
        console.error("Erro ao duplicar acabamentos:", erroAcabamentos);
      }
    }
  } catch (err) {
    console.warn("Tabela de acabamentos não encontrada:", err);
  }

  return novaAnalise;
}

/**
 * Vincular análise a uma proposta
 */
export async function vincularAnaliseAProposta(
  analiseId: string,
  propostaId: string
): Promise<void> {
  // Usar funçÍo SQL se disponível
  const { error: rpcError } = await supabase.rpc("vincular_analise_proposta", {
    p_analise_id: analiseId,
    p_proposta_id: propostaId,
  });

  if (rpcError) {
    // Fallback: fazer manualmente
    const { error: updateError } = await supabase
      .from("analises_projeto")
      .update({
        proposta_id: propostaId,
        status: "vinculado",
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", analiseId);

    if (updateError) throw updateError;
  }
}

// ============================================================
// AMBIENTES
// ============================================================

/**
 * Listar ambientes de uma análise
 */
export async function listarAmbientes(analiseId: string): Promise<AnaliseProjetoAmbiente[]> {
  const { data, error } = await supabase
    .from("analises_projeto_ambientes")
    .select("*")
    .eq("analise_id", analiseId)
    .order("ordem", { ascending: true });

  if (error) throw error;

  return (data || []).map((amb: any) => ({
    ...amb,
    portas: amb.portas || [],
    janelas: amb.janelas || [],
    vaos: [], // não existe na tabela - manter vazio
    envidracamentos: [], // não existe na tabela - manter vazio
    tomadas_especiais: [], // não existe na tabela - manter vazio
    circuitos: [], // não existe na tabela - manter vazio
    tubulacao_seca: [], // não existe na tabela - manter vazio
    alertas: [], // não existe na tabela - manter vazio
  }));
}

/**
 * Criar ambiente (suporta todos os campos incluindo arrays)
 */
export async function criarAmbiente(dados: Partial<AnaliseProjetoAmbiente> & { analise_id: string; nome: string }): Promise<AnaliseProjetoAmbiente> {
  // FunçÍo auxiliar para limpar arrays
  const limparArray = (arr: any[] | undefined) => {
    if (!arr || !Array.isArray(arr)) return [];
    return arr.map((item: any) => {
      if (typeof item === 'object' && item !== null) {
        const cleanItem: any = {};
        for (const key in item) {
          if (item[key] !== undefined) {
            cleanItem[key] = item[key];
          }
        }
        return cleanItem;
      }
      return item;
    });
  };

  // Campos permitidos na tabela (evitar enviar campos extras que causam erro 400)
  // NOTA: Muitos campos JSONB não existem na tabela real - apenas portas e janelas
  const insertData: any = {
    analise_id: dados.analise_id,
    nome: dados.nome,
    tipo: dados.tipo || null,
    codigo: dados.codigo || null,
    largura: dados.largura || null,
    comprimento: dados.comprimento || null,
    pe_direito: dados.pe_direito || 2.7,
    area_piso: dados.area_piso || null,
    area_teto: dados.area_teto || null,
    perimetro: dados.perimetro || null,
    area_paredes_bruta: dados.area_paredes_bruta || null,
    area_paredes_liquida: dados.area_paredes_liquida || null,
    // Arrays - apenas portas e janelas existem na tabela
    portas: limparArray(dados.portas),
    janelas: limparArray(dados.janelas),
    // vaos, envidracamentos, alertas não existem na tabela
    area_vaos_total: dados.area_vaos_total || 0,
    tomadas_110v: dados.tomadas_110v || 0,
    tomadas_220v: dados.tomadas_220v || 0,
    pontos_iluminacao: dados.pontos_iluminacao || 0,
    interruptores_simples: dados.interruptores_simples || 0,
    interruptores_paralelo: dados.interruptores_paralelo || 0,
    interruptores_intermediario: dados.interruptores_intermediario || 0,
    pontos_agua_fria: dados.pontos_agua_fria || 0,
    pontos_agua_quente: dados.pontos_agua_quente || 0,
    pontos_esgoto: dados.pontos_esgoto || 0,
    pontos_gas: dados.pontos_gas || 0,
    piso_tipo: dados.piso_tipo || null,
    piso_area: dados.piso_area || null,
    parede_tipo: dados.parede_tipo || null,
    parede_area: dados.parede_area || null,
    teto_tipo: dados.teto_tipo || null,
    teto_area: dados.teto_area || null,
    rodape_tipo: dados.rodape_tipo || null,
    rodape_ml: dados.rodape_ml || null,
    observacoes: dados.observacoes || null,
    ordem: dados.ordem || 0,
    origem: dados.origem || "manual",
    editado_manualmente: dados.editado_manualmente !== false,
  };

  console.log(`Criando ambiente:`, JSON.stringify(insertData, null, 2));

  const { data, error } = await supabase
    .from("analises_projeto_ambientes")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error(`Erro Supabase ao criar ambiente:`, error);
    throw error;
  }
  if (!data) throw new Error("Erro ao criar ambiente");

  return {
    ...data,
    portas: data.portas || [],
    janelas: data.janelas || [],
    vaos: [], // não existe na tabela - manter vazio
    envidracamentos: [], // não existe na tabela - manter vazio
    tomadas_especiais: [], // não existe na tabela - manter vazio
    circuitos: [], // não existe na tabela - manter vazio
    tubulacao_seca: [], // não existe na tabela - manter vazio
    alertas: [], // não existe na tabela - manter vazio
  };
}

/**
 * Atualizar ambiente (suporta todos os campos incluindo arrays)
 */
export async function atualizarAmbiente(
  id: string,
  dados: Partial<AnaliseProjetoAmbiente>
): Promise<AnaliseProjetoAmbiente> {
  // Campos permitidos na tabela (evitar enviar campos extras que causam erro 400)
  // NOTA: Muitos campos JSONB não existem na tabela real - apenas portas e janelas
  const camposPermitidos = [
    "nome", "tipo", "codigo", "largura", "comprimento", "pe_direito",
    "area_piso", "area_teto", "perimetro", "area_paredes_bruta", "area_paredes_liquida",
    "portas", "janelas", "area_vaos_total",
    "tomadas_110v", "tomadas_220v",
    "pontos_iluminacao", "interruptores_simples", "interruptores_paralelo", "interruptores_intermediario",
    "pontos_agua_fria", "pontos_agua_quente", "pontos_esgoto", "pontos_gas",
    "piso_tipo", "piso_area", "parede_tipo", "parede_area",
    "teto_tipo", "teto_area", "rodape_tipo", "rodape_ml",
    "observacoes", "ordem", "origem", "editado_manualmente",
  ];

  // Filtrar apenas campos permitidos e remover undefined/null desnecessários
  const updateData: any = {
    editado_manualmente: true,
  };

  for (const campo of camposPermitidos) {
    if (campo in dados && dados[campo as keyof typeof dados] !== undefined) {
      // Garantir que arrays sÍo arrays válidos
      const valor = dados[campo as keyof typeof dados];
      if (Array.isArray(valor)) {
        // Limpar objetos com valores undefined dentro dos arrays
        updateData[campo] = valor.map((item: any) => {
          if (typeof item === 'object' && item !== null) {
            const cleanItem: any = {};
            for (const key in item) {
              if (item[key] !== undefined) {
                cleanItem[key] = item[key];
              }
            }
            return cleanItem;
          }
          return item;
        });
      } else {
        updateData[campo] = valor;
      }
    }
  }

  console.log(`Atualizando ambiente ${id}:`, JSON.stringify(updateData, null, 2));

  const { data, error } = await supabase
    .from("analises_projeto_ambientes")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Erro Supabase ao atualizar ambiente ${id}:`, error);
    throw error;
  }
  if (!data) throw new Error("Ambiente não encontrado");

  return {
    ...data,
    portas: data.portas || [],
    janelas: data.janelas || [],
    vaos: [], // não existe na tabela - manter vazio
    envidracamentos: [], // não existe na tabela - manter vazio
    tomadas_especiais: [], // não existe na tabela - manter vazio
    circuitos: [], // não existe na tabela - manter vazio
    tubulacao_seca: [], // não existe na tabela - manter vazio
    alertas: [], // não existe na tabela - manter vazio
  };
}

/**
 * Deletar ambiente
 */
export async function deletarAmbiente(id: string): Promise<void> {
  const { error } = await supabase
    .from("analises_projeto_ambientes")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/**
 * Reordenar ambientes
 */
export async function reordenarAmbientes(
  ambientes: { id: string; ordem: number }[]
): Promise<void> {
  const updates = ambientes.map((amb) =>
    supabase
      .from("analises_projeto_ambientes")
      .update({ ordem: amb.ordem })
      .eq("id", amb.id)
  );

  await Promise.all(updates);
}

// ============================================================
// SERVIÇOS (NOVO - para Propostas)
// ============================================================

/**
 * Interface para serviço extraído da análise
 */
export interface ServicoAnalise {
  id: string;
  analise_id: string;
  ambiente_id?: string;
  categoria: string;
  tipo?: string;
  descricao: string;
  unidade: string;
  quantidade?: number;
  area?: number;
  metragem_linear?: number;
  especificacoes?: Record<string, any>;
  termo_busca?: string;
  palavras_chave?: string[];
  categoria_sugerida?: string;
  pricelist_item_id?: string;
  pricelist_match_score?: number;
  ambiente_nome?: string;
  ambientes_nomes?: string[];
  ordem: number;
  origem: string;
  selecionado: boolean;
  importado_para_proposta: boolean;
  criado_em: string;
  atualizado_em: string;
  // Dados do pricelist vinculado (populados via JOIN)
  pricelist_item?: {
    tipo: string;
    nome: string;
  } | null;
}

/**
 * Listar serviços de uma análise
 * Se houver pricelist_item_id, busca dados do pricelist em uma segunda query
 */
export async function listarServicos(analiseId: string): Promise<ServicoAnalise[]> {
  const { data, error } = await supabase
    .from("analises_projeto_servicos")
    .select("*")
    .eq("analise_id", analiseId)
    .order("ordem", { ascending: true });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  // Buscar tipos dos itens do pricelist vinculados
  const pricelistIds = data
    .map(s => s.pricelist_item_id)
    .filter((id): id is string => !!id);

  if (pricelistIds.length > 0) {
    const { data: pricelistItens } = await supabase
      .from("pricelist_itens")
      .select("id, tipo, nome")
      .in("id", pricelistIds);

    if (pricelistItens) {
      const pricelistMap = new Map(pricelistItens.map(p => [p.id, { tipo: p.tipo, nome: p.nome }]));
      return data.map(s => ({
        ...s,
        pricelist_item: s.pricelist_item_id ? pricelistMap.get(s.pricelist_item_id) || null : null,
      }));
    }
  }

  return data.map(s => ({ ...s, pricelist_item: null }));
}

/**
 * Listar serviços selecionados (para importar para proposta)
 * Se houver pricelist_item_id, busca dados do pricelist em uma segunda query
 */
export async function listarServicosSelecionados(analiseId: string): Promise<ServicoAnalise[]> {
  const { data, error } = await supabase
    .from("analises_projeto_servicos")
    .select("*")
    .eq("analise_id", analiseId)
    .eq("selecionado", true)
    .order("ordem", { ascending: true });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  // Buscar tipos dos itens do pricelist vinculados
  const pricelistIds = data
    .map(s => s.pricelist_item_id)
    .filter((id): id is string => !!id);

  if (pricelistIds.length > 0) {
    const { data: pricelistItens } = await supabase
      .from("pricelist_itens")
      .select("id, tipo, nome")
      .in("id", pricelistIds);

    if (pricelistItens) {
      const pricelistMap = new Map(pricelistItens.map(p => [p.id, { tipo: p.tipo, nome: p.nome }]));
      return data.map(s => ({
        ...s,
        pricelist_item: s.pricelist_item_id ? pricelistMap.get(s.pricelist_item_id) || null : null,
      }));
    }
  }

  return data.map(s => ({ ...s, pricelist_item: null }));
}

/**
 * Atualizar seleçÍo de serviço
 */
export async function atualizarSelecaoServico(id: string, selecionado: boolean): Promise<void> {
  const { error } = await supabase
    .from("analises_projeto_servicos")
    .update({ selecionado, atualizado_em: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

/**
 * Vincular serviço ao pricelist
 */
export async function vincularServicoAoPricelist(
  servicoId: string,
  pricelistItemId: string,
  matchScore?: number
): Promise<void> {
  const { error } = await supabase
    .from("analises_projeto_servicos")
    .update({
      pricelist_item_id: pricelistItemId,
      pricelist_match_score: matchScore || null,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", servicoId);

  if (error) throw error;
}

/**
 * Marcar serviços como importados para proposta
 */
export async function marcarServicosComoImportados(servicoIds: string[]): Promise<void> {
  const { error } = await supabase
    .from("analises_projeto_servicos")
    .update({
      importado_para_proposta: true,
      atualizado_em: new Date().toISOString(),
    })
    .in("id", servicoIds);

  if (error) throw error;
}

/**
 * Adicionar serviço manualmente
 */
export async function adicionarServico(dados: Partial<ServicoAnalise> & { analise_id: string; descricao: string }): Promise<ServicoAnalise> {
  const { data, error } = await supabase
    .from("analises_projeto_servicos")
    .insert({
      analise_id: dados.analise_id,
      categoria: dados.categoria || "geral",
      tipo: dados.tipo || null,
      descricao: dados.descricao,
      unidade: dados.unidade || "un",
      quantidade: dados.quantidade || null,
      area: dados.area || null,
      metragem_linear: dados.metragem_linear || null,
      especificacoes: dados.especificacoes || {},
      termo_busca: dados.termo_busca || null,
      palavras_chave: dados.palavras_chave || [],
      ambiente_nome: dados.ambiente_nome || null,
      ordem: dados.ordem || 0,
      origem: "manual",
      selecionado: true,
      importado_para_proposta: false,
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Erro ao criar serviço");

  return data;
}

/**
 * Deletar serviço
 */
export async function deletarServico(id: string): Promise<void> {
  const { error } = await supabase
    .from("analises_projeto_servicos")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// ============================================================
// ESTATÍSTICAS
// ============================================================

/**
 * Buscar estatísticas gerais das análises
 */
export async function buscarEstatisticas(): Promise<{
  total: number;
  rascunhos: number;
  analisadas: number;
  aprovadas: number;
  vinculadas: number;
}> {
  const { data, error } = await supabase
    .from("analises_projeto")
    .select("status");

  if (error) throw error;

  const stats = {
    total: data?.length || 0,
    rascunhos: 0,
    analisadas: 0,
    aprovadas: 0,
    vinculadas: 0,
  };

  (data || []).forEach((row: any) => {
    switch (row.status) {
      case "rascunho":
      case "analisando":
        stats.rascunhos++;
        break;
      case "analisado":
        stats.analisadas++;
        break;
      case "aprovado":
        stats.aprovadas++;
        break;
      case "vinculado":
        stats.vinculadas++;
        break;
    }
  });

  return stats;
}

// ============================================================
// EXPORTAR TIPOS
// ============================================================

export type {
  AnaliseProjeto,
  AnaliseProjetoAmbiente,
  AnaliseProjetoCompleta,
  AnaliseProjetoFormData,
  AnaliseAmbienteFormData,
};


