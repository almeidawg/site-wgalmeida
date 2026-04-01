// src/lib/pessoasApi.ts
// API principal para manipulaçÍo da tabela pessoas
// Usa tipos centralizados de @/types/pessoas

import { supabase } from "./supabaseClient";
import type {
  Pessoa,
  PessoaTipo,
  PessoaStatus,
  PessoaInput,
  PessoaDocumento,
  PessoaAvaliacao,
  PessoaObra,
} from "@/types/pessoas";

// Re-exportar tipos para compatibilidade com componentes antigos
export type {
  Pessoa,
  PessoaTipo,
  PessoaStatus,
  PessoaInput,
  PessoaDocumento,
  PessoaAvaliacao,
  PessoaObra,
} from "@/types/pessoas";

const TABLE = "pessoas";

// Pilar 3 — Auto-setup Drive após criar pessoa
// Fire-and-forget: não bloqueia o retorno para o usuário
function triggerDriveSetup(pessoaId: string): void {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
  const internalKey = import.meta.env.VITE_INTERNAL_API_KEY || "";
  fetch(`${backendUrl}/api/pessoas/${pessoaId}/setup-drive`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-key": internalKey,
    },
  }).catch((err) => {
    // Silencioso — falha não impede criaçÍo da pessoa
    console.warn("[Drive Setup] Falha ao configurar pasta (não crítico):", err.message);
  });
}

function mapFromDb(row: any): Pessoa {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    telefone: row.telefone,
    // Campos opcionais (podem não existir no banco ainda)
    cpf: row.cpf ?? null,
    cnpj: row.cnpj ?? null,
    rg: row.rg ?? null,
    nacionalidade: row.nacionalidade ?? null,
    estado_civil: row.estado_civil ?? null,
    profissao: row.profissao ?? null,
    cargo: row.cargo ?? null,
    empresa: row.empresa ?? null,
    categoria: row.categoria ?? null,
    unidade: row.unidade ?? null,
    tipo: row.tipo,
    // Endereço
    cep: row.cep ?? null,
    logradouro: row.logradouro ?? null,
    numero: row.numero ?? null,
    complemento: row.complemento ?? null,
    bairro: row.bairro ?? null,
    cidade: row.cidade ?? null,
    estado: row.estado ?? null,
    pais: row.pais ?? null,
    // Endereço da obra
    obra_endereco_diferente: row.obra_endereco_diferente ?? false,
    obra_cep: row.obra_cep ?? null,
    obra_logradouro: row.obra_logradouro ?? null,
    obra_numero: row.obra_numero ?? null,
    obra_complemento: row.obra_complemento ?? null,
    obra_bairro: row.obra_bairro ?? null,
    obra_cidade: row.obra_cidade ?? null,
    obra_estado: row.obra_estado ?? null,
    // Dados bancários
    banco: row.banco ?? null,
    agencia: row.agencia ?? null,
    conta: row.conta ?? null,
    tipo_conta: row.tipo_conta ?? null,
    pix: row.pix ?? null,
    // Comissionamento (especificadores)
    categoria_comissao_id: row.categoria_comissao_id ?? null,
    is_master: row.is_master ?? null,
    indicado_por_id: row.indicado_por_id ?? null,
    // Informações adicionais
    contato_responsavel: row.contato_responsavel ?? null,
    observacoes: row.observacoes ?? null,
    drive_link: row.drive_link ?? null,
    avatar: row.avatar ?? null,
    avatar_url: row.avatar_url ?? null,
    foto_url: row.foto_url ?? null,
    status: row.status ?? "ativo",
    ativo: row.ativo ?? true,
    criado_em: row.criado_em,
    atualizado_em: row.atualizado_em,
  };
}

function mapDocumentoFromDb(row: any): PessoaDocumento {
  return {
    id: row.id,
    pessoa_id: row.pessoa_id,
    nome: row.nome ?? row.tipo ?? "Documento",
    tipo: row.tipo ?? "DOCUMENTO",
    url: row.url ?? row.arquivo_url ?? "",
    arquivo_url: row.arquivo_url ?? row.url ?? null,
    descricao: row.descricao ?? null,
    validade: row.validade ?? null,
    criado_em: row.criado_em ?? row.created_at ?? new Date().toISOString(),
  };
}

export async function listarPessoas(params?: {
  tipo?: PessoaTipo;
  ativo?: boolean;
  search?: string;
  status?: PessoaStatus | PessoaStatus[];
  incluirConcluidos?: boolean; // Se true, inclui pessoas com status 'concluido'
}): Promise<Pessoa[]> {
  let query = supabase.from(TABLE).select("*");

  if (params?.tipo) {
    query = query.eq("tipo", params.tipo);
  }

  if (typeof params?.ativo === "boolean") {
    query = query.eq("ativo", params.ativo);
  }

  // Filtro de status - exclui pessoas com status 'concluido' por padrÍo
  if (params?.status) {
    if (Array.isArray(params.status)) {
      query = query.in("status", params.status);
    } else {
      query = query.eq("status", params.status);
    }
  } else if (!params?.incluirConcluidos) {
    // Se não especificou status e não quer incluir concluídos, exclui status 'concluido'
    query = query.or("status.is.null,status.neq.concluido");
  }

  if (params?.search && params.search.trim()) {
    const term = `%${params.search.trim()}%`;
    query = query.or(
      `nome.ilike.${term},email.ilike.${term},telefone.ilike.${term}`
    );
  }

  // PaginaçÍo automática para contornar limite de 1000 rows do Supabase
  const PAGE_SIZE = 1000;
  let allData: any[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await query
      .order("criado_em", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("[listarPessoas] erro:", error);
      throw error;
    }

    const rows = data ?? [];
    allData = allData.concat(rows);
    hasMore = rows.length === PAGE_SIZE;
    page++;
  }

  return allData.map(mapFromDb);
}

export async function obterPessoa(id: string): Promise<Pessoa | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[obterPessoa] erro:", error);
    throw error;
  }

  return data ? mapFromDb(data) : null;
}

export async function listarDocumentosPessoa(
  pessoaId: string
): Promise<PessoaDocumento[]> {
  const { data, error } = await supabase
    .from("pessoas_documentos")
    .select("*")
    .eq("pessoa_id", pessoaId)
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("[listarDocumentosPessoa] erro:", error);
    throw error;
  }

  return (data ?? []).map(mapDocumentoFromDb);
}

export async function criarPessoa(input: PessoaInput): Promise<Pessoa> {
  const payload = {
    ...input,
    ativo: input.ativo ?? true,
  };

  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    console.error("[criarPessoa] erro:", error);
    throw error;
  }

  const pessoa = mapFromDb(data);

  // Pilar 3 — Auto-cria pasta Drive em background (non-blocking)
  if (pessoa.id && !pessoa.drive_link) {
    triggerDriveSetup(pessoa.id);
  }

  return pessoa;
}

export async function atualizarPessoa(
  id: string,
  input: Partial<PessoaInput>
): Promise<Pessoa> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("[atualizarPessoa] erro:", error);
    throw error;
  }

  return mapFromDb(data);
}

export async function desativarPessoa(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({ ativo: false })
    .eq("id", id);

  if (error) {
    console.error("[desativarPessoa] erro:", error);
    throw error;
  }
}

export async function deletarPessoa(id: string): Promise<void> {
  // Verificar se a pessoa é um cliente com oportunidades vinculadas
  const { data: oportunidades, error: oportError } = await supabase
    .from("oportunidades")
    .select("id")
    .eq("cliente_id", id);

  if (oportError) {
    console.error("[deletarPessoa] erro ao verificar oportunidades:", oportError);
    throw oportError;
  }

  if (oportunidades && oportunidades.length > 0) {
    throw new Error(
      `não é possível deletar esta pessoa pois ela possui ${oportunidades.length} oportunidade(s) vinculada(s). ` +
      `Por favor, remova ou transfira as oportunidades antes de deletar.`
    );
  }

  // Se não tem oportunidades, pode deletar
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[deletarPessoa] erro:", error);
    throw error;
  }
}

export async function criarAvaliacao(
  pessoaId: string,
  avaliadorId: string,
  nota: number,
  comentario?: string
): Promise<PessoaAvaliacao> {
  const { data, error } = await supabase
    .from("pessoas_avaliacoes")
    .insert({
      pessoa_id: pessoaId,
      avaliador_id: avaliadorId,
      nota,
      comentario: comentario || null,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[criarAvaliacao] erro:", error);
    throw error;
  }

  return {
    id: data.id,
    pessoa_id: data.pessoa_id,
    avaliador_id: data.avaliador_id,
    nota: data.nota,
    comentario: data.comentario ?? undefined,
    criado_em: data.criado_em ?? data.created_at ?? new Date().toISOString(),
  };
}

/**
 * Listar obras associadas a uma pessoa
 */
export async function listarObrasPessoa(pessoaId: string): Promise<PessoaObra[]> {
  const { data, error } = await supabase
    .from("pessoas_obras")
    .select("*")
    .eq("pessoa_id", pessoaId);

  if (error) {
    console.error("[listarObrasPessoa] erro:", error);
    throw error;
  }

  return data || [];
}

/**
 * Buscar primeiro lançamento financeiro de uma pessoa (data de vínculo)
 */
export async function buscarPrimeiroLancamento(pessoaId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("financeiro_lancamentos")
    .select("data_competencia")
    .eq("pessoa_id", pessoaId)
    .order("data_competencia", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[buscarPrimeiroLancamento] erro:", error);
    return null;
  }

  return data?.data_competencia || null;
}

/**
 * Listar pessoas com data de vínculo (primeiro lançamento financeiro)
 * Para CLIENTES: busca através dos contratos vinculados ou oportunidades
 * Para outros tipos: busca diretamente pelo pessoa_id
 */
export async function listarPessoasComDataVinculo(params?: {
  tipo?: PessoaTipo;
  ativo?: boolean;
  search?: string;
  status?: PessoaStatus | PessoaStatus[];
  incluirConcluidos?: boolean;
}): Promise<(Pessoa & { data_vinculo?: string | null })[]> {
  const chunkArray = <T>(items: T[], size: number): T[][] => {
    if (!items.length) return [];
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
      chunks.push(items.slice(i, i + size));
    }
    return chunks;
  };

  // Primeiro busca as pessoas
  let query = supabase.from(TABLE).select("*");

  if (params?.tipo) {
    query = query.eq("tipo", params.tipo);
  }

  if (typeof params?.ativo === "boolean") {
    query = query.eq("ativo", params.ativo);
  }

  // Filtro de status - exclui pessoas com status 'concluido' por padrÍo
  if (params?.status) {
    if (Array.isArray(params.status)) {
      query = query.in("status", params.status);
    } else {
      query = query.eq("status", params.status);
    }
  } else if (!params?.incluirConcluidos) {
    // Se não especificou status e não quer incluir concluídos, exclui status 'concluido'
    query = query.or("status.is.null,status.neq.concluido");
  }

  if (params?.search?.trim()) {
    const term = `%${params.search.trim()}%`;
    query = query.or(
      `nome.ilike.${term},email.ilike.${term},telefone.ilike.${term},cpf.ilike.${term},cnpj.ilike.${term}`
    );
  }

  const { data: pessoas, error } = await query.order("criado_em", {
    ascending: false,
  });

  if (error) {
    console.error("[listarPessoasComDataVinculo] erro:", error);
    throw error;
  }

  if (!pessoas || pessoas.length === 0) {
    return [];
  }

  const pessoaIds = pessoas.map(p => p.id);
  const dataVinculoPorPessoa: Record<string, string> = {};

  // Para CLIENTES: buscar através de múltiplas fontes
  if (params?.tipo === "CLIENTE") {
    // 1. Buscar contratos dos clientes (com data_inicio e created_at)
    const contratos: Array<{ id: string; cliente_id: string | null; data_inicio: string | null; created_at: string | null }> = [];
    const pessoaChunks = chunkArray(pessoaIds, 200);

    for (const chunk of pessoaChunks) {
      const { data: chunkData, error: contratosError } = await supabase
        .from("contratos")
        .select("id, cliente_id, data_inicio, created_at")
        .in("cliente_id", chunk);

      if (contratosError) {
        console.error("[listarPessoasComDataVinculo] erro contratos:", contratosError);
        continue;
      }

      if (chunkData) {
        contratos.push(...chunkData);
      }
    }

    const contratosPorCliente: Record<string, typeof contratos> = {};
    const contratoIds: string[] = [];

    if (contratos && contratos.length > 0) {
      for (const c of contratos) {
        if (c.cliente_id) {
          if (!contratosPorCliente[c.cliente_id]) {
            contratosPorCliente[c.cliente_id] = [];
          }
          contratosPorCliente[c.cliente_id].push(c);
          contratoIds.push(c.id);
        }
      }

      // 2. Buscar lançamentos financeiros dos contratos
      if (contratoIds.length > 0) {
        const { data: lancamentos, error: lancError } = await supabase
          .from("financeiro_lancamentos")
          .select("contrato_id, data_competencia")
          .in("contrato_id", contratoIds)
          .order("data_competencia", { ascending: true });

        if (lancError) {
          console.error("[listarPessoasComDataVinculo] erro lancamentos:", lancError);
        }

        // Mapear contrato_id → cliente_id
        const contratoParaCliente: Record<string, string> = {};
        for (const c of contratos) {
          if (c.cliente_id) {
            contratoParaCliente[c.id] = c.cliente_id;
          }
        }

        // Primeiro lançamento por cliente (através do contrato) - pegar data mais antiga
        if (lancamentos) {
          for (const lanc of lancamentos) {
            if (lanc.contrato_id && lanc.data_competencia) {
              const clienteId = contratoParaCliente[lanc.contrato_id];
              if (clienteId) {
                const dataAtual = dataVinculoPorPessoa[clienteId];
                if (!dataAtual || lanc.data_competencia < dataAtual) {
                  dataVinculoPorPessoa[clienteId] = lanc.data_competencia;
                }
              }
            }
          }
        }
      }

      // 3. Fallback: usar data_inicio do contrato mais antigo
      for (const clienteId of Object.keys(contratosPorCliente)) {
        if (!dataVinculoPorPessoa[clienteId]) {
          const contratosCliente = contratosPorCliente[clienteId];
          // Ordenar por data_inicio (mais antiga primeiro)
          const contratoMaisAntigo = contratosCliente
            .filter(c => c.data_inicio)
            .sort((a, b) => new Date(a.data_inicio!).getTime() - new Date(b.data_inicio!).getTime())[0];

          if (contratoMaisAntigo?.data_inicio) {
            dataVinculoPorPessoa[clienteId] = contratoMaisAntigo.data_inicio;
          }
        }
      }

      // 4. Último fallback: usar created_at do contrato mais antigo
      for (const clienteId of Object.keys(contratosPorCliente)) {
        if (!dataVinculoPorPessoa[clienteId]) {
          const contratosCliente = contratosPorCliente[clienteId];
          const contratoMaisAntigo = contratosCliente
            .filter(c => c.created_at)
            .sort((a, b) => new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime())[0];

          if (contratoMaisAntigo?.created_at) {
            dataVinculoPorPessoa[clienteId] = contratoMaisAntigo.created_at.split('T')[0];
          }
        }
      }
    }

    // 5. Buscar lançamentos via projeto_id (projetos também têm cliente_id)
    const projetosComId: Array<{ id: string; cliente_id: string | null }> = [];

    for (const chunk of pessoaChunks) {
      const { data: chunkData, error: projetosIdError } = await supabase
        .from("projetos")
        .select("id, cliente_id")
        .in("cliente_id", chunk);

      if (projetosIdError) {
        console.error("[listarPessoasComDataVinculo] erro projetos:", projetosIdError);
        continue;
      }

      if (chunkData) {
        projetosComId.push(...chunkData);
      }
    }

    if (projetosComId && projetosComId.length > 0) {
      const projetoIds = projetosComId.map(p => p.id);
      const projetoParaCliente: Record<string, string> = {};
      for (const p of projetosComId) {
        if (p.cliente_id) {
          projetoParaCliente[p.id] = p.cliente_id;
        }
      }

      // Buscar lançamentos pelos projeto_ids
      const { data: lancamentosProjeto, error: lancProjError } = await supabase
        .from("financeiro_lancamentos")
        .select("projeto_id, data_competencia")
        .in("projeto_id", projetoIds)
        .order("data_competencia", { ascending: true });

      if (lancProjError) {
        console.error("[listarPessoasComDataVinculo] erro lancamentos projeto:", lancProjError);
      }

      if (lancamentosProjeto) {
        for (const lanc of lancamentosProjeto) {
          if (lanc.projeto_id && lanc.data_competencia) {
            const clienteId = projetoParaCliente[lanc.projeto_id];
            // Só atualiza se não tiver data ou se a data for mais antiga
            if (clienteId) {
              const dataAtual = dataVinculoPorPessoa[clienteId];
              if (!dataAtual || lanc.data_competencia < dataAtual) {
                dataVinculoPorPessoa[clienteId] = lanc.data_competencia;
              }
            }
          }
        }
      }
    }

    // 6. Buscar oportunidades (alguns clientes podem ter oportunidade sem contrato)
    let clientesSemData = pessoaIds.filter(id => !dataVinculoPorPessoa[id]);
    if (clientesSemData.length > 0) {
      const oportunidades: Array<{ cliente_id: string | null; criado_em: string | null }> = [];
      const clienteChunks = chunkArray(clientesSemData, 200);

      for (const chunk of clienteChunks) {
        const { data: chunkData, error: oportunidadesError } = await supabase
          .from("oportunidades")
          .select("cliente_id, criado_em")
          .in("cliente_id", chunk)
          .order("criado_em", { ascending: true });

        if (oportunidadesError) {
          console.error("[listarPessoasComDataVinculo] erro oportunidades:", oportunidadesError);
          continue;
        }

        if (chunkData) {
          oportunidades.push(...chunkData);
        }
      }

      for (const oport of oportunidades) {
        if (oport.cliente_id && !dataVinculoPorPessoa[oport.cliente_id] && oport.criado_em) {
          dataVinculoPorPessoa[oport.cliente_id] = oport.criado_em.split('T')[0];
        }
      }
    }

    // 7. Buscar projetos (fallback para created_at)
    clientesSemData = pessoaIds.filter(id => !dataVinculoPorPessoa[id]);
    if (clientesSemData.length > 0) {
      const projetos: Array<{ cliente_id: string | null; created_at: string | null }> = [];
      const clienteChunks = chunkArray(clientesSemData, 200);

      for (const chunk of clienteChunks) {
        const { data: chunkData, error: projetosError } = await supabase
          .from("projetos")
          .select("cliente_id, created_at")
          .in("cliente_id", chunk)
          .order("created_at", { ascending: true });

        if (projetosError) {
          console.error("[listarPessoasComDataVinculo] erro projetos:", projetosError);
          continue;
        }

        if (chunkData) {
          projetos.push(...chunkData);
        }
      }

      for (const proj of projetos) {
        if (proj.cliente_id && !dataVinculoPorPessoa[proj.cliente_id] && proj.created_at) {
          dataVinculoPorPessoa[proj.cliente_id] = proj.created_at.split('T')[0];
        }
      }
    }

    // 8. Buscar análises de projeto
    clientesSemData = pessoaIds.filter(id => !dataVinculoPorPessoa[id]);
    if (clientesSemData.length > 0) {
      const analises: Array<{ cliente_id: string | null; criado_em: string | null }> = [];
      const clienteChunks = chunkArray(clientesSemData, 80);
      let viewDisponivel = true;

      const buscarAnalisesChunk = async (chunk: string[]) => {
        const { data, error } = await supabase
          .from("analises_projeto")
          .select("cliente_id, criado_em")
          .in("cliente_id", chunk)
          .order("criado_em", { ascending: true });

        if (!error) {
          return data || [];
        }

        if (error.code === "42703" && viewDisponivel) {
          const { data: viewData, error: viewError } = await supabase
            .from("vw_analises_projeto_completas")
            .select("cliente_id, criado_em")
            .in("cliente_id", chunk)
            .order("criado_em", { ascending: true });

          if (!viewError) {
            return viewData || [];
          }

          if (
            viewError.code === "42P01" ||
            viewError.code === "42703" ||
            viewError.code === "PGRST116"
          ) {
            viewDisponivel = false;
          }
          console.error("[listarPessoasComDataVinculo] erro analises (view):", viewError);
          return [];
        }

        console.error("[listarPessoasComDataVinculo] erro analises:", error);
        return [];
      };

      for (const chunk of clienteChunks) {
        const chunkData = await buscarAnalisesChunk(chunk);
        analises.push(...chunkData);
      }

      for (const analise of analises) {
        if (analise.cliente_id && !dataVinculoPorPessoa[analise.cliente_id] && analise.criado_em) {
          dataVinculoPorPessoa[analise.cliente_id] = analise.criado_em.split('T')[0];
        }
      }
    }

    // 9. Buscar assistência técnica
    clientesSemData = pessoaIds.filter(id => !dataVinculoPorPessoa[id]);
    if (clientesSemData.length > 0) {
      const assistencias: Array<{ cliente_id: string | null; created_at: string | null }> = [];
      const clienteChunks = chunkArray(clientesSemData, 200);

      for (const chunk of clienteChunks) {
        const { data: chunkData, error: assistenciasError } = await supabase
          .from("assistencia_tecnica")
          .select("cliente_id, created_at")
          .in("cliente_id", chunk)
          .order("created_at", { ascending: true });

        if (assistenciasError) {
          console.error("[listarPessoasComDataVinculo] erro assistencias:", assistenciasError);
          continue;
        }

        if (chunkData) {
          assistencias.push(...chunkData);
        }
      }

      for (const assist of assistencias) {
        if (assist.cliente_id && !dataVinculoPorPessoa[assist.cliente_id] && assist.created_at) {
          dataVinculoPorPessoa[assist.cliente_id] = assist.created_at.split('T')[0];
        }
      }
    }

    // 10. Buscar lançamentos onde cliente é pessoa_id (entradas = recebimentos do cliente)
    // O workflow cria lançamentos de entrada com pessoa_id = cliente_id
    const lancamentosCliente: Array<{ pessoa_id: string | null; data_competencia: string | null; tipo: string | null }> = [];

    for (const chunk of pessoaChunks) {
      const { data: chunkData, error: lancClienteError } = await supabase
        .from("financeiro_lancamentos")
        .select("pessoa_id, data_competencia, tipo")
        .in("pessoa_id", chunk)
        .eq("tipo", "entrada")
        .order("data_competencia", { ascending: true });

      if (lancClienteError) {
        console.error("[listarPessoasComDataVinculo] erro lancamentos cliente:", lancClienteError);
        continue;
      }

      if (chunkData) {
        lancamentosCliente.push(...chunkData);
      }
    }

    for (const lanc of lancamentosCliente) {
      if (lanc.pessoa_id && lanc.data_competencia) {
        const dataAtual = dataVinculoPorPessoa[lanc.pessoa_id];
        if (!dataAtual || lanc.data_competencia < dataAtual) {
          dataVinculoPorPessoa[lanc.pessoa_id] = lanc.data_competencia;
        }
      }
    }

  } else {
    // Para outros tipos: buscar diretamente pelo pessoa_id nos lançamentos
    const lancamentos: Array<{ pessoa_id: string | null; data_competencia: string | null }> = [];
    const pessoaChunks = chunkArray(pessoaIds, 200);

    for (const chunk of pessoaChunks) {
      const { data: chunkData, error: lancError } = await supabase
        .from("financeiro_lancamentos")
        .select("pessoa_id, data_competencia")
        .in("pessoa_id", chunk)
        .order("data_competencia", { ascending: true });

      if (lancError) {
        console.error("[listarPessoasComDataVinculo] erro lancamentos:", lancError);
        continue;
      }

      if (chunkData) {
        lancamentos.push(...chunkData);
      }
    }

    for (const lanc of lancamentos) {
      if (lanc.pessoa_id && lanc.data_competencia) {
        const dataAtual = dataVinculoPorPessoa[lanc.pessoa_id];
        if (!dataAtual || lanc.data_competencia < dataAtual) {
          dataVinculoPorPessoa[lanc.pessoa_id] = lanc.data_competencia;
        }
      }
    }
  }

  // Mapear pessoas com data de vínculo
  const pessoasComVinculo = pessoas.map(row => ({
    ...mapFromDb(row),
    data_vinculo: dataVinculoPorPessoa[row.id] || null,
  }));

  return pessoasComVinculo;
}

/**
 * Mesclar duas pessoas duplicadas
 * Move todos os vínculos do origem para o destino e deleta o origem
 * @param destinoId ID da pessoa que será mantida
 * @param origemId ID da pessoa que será mesclada e deletada
 */
export async function mesclarPessoas(destinoId: string, origemId: string): Promise<{ success: boolean; message: string }> {
  if (destinoId === origemId) {
    throw new Error("IDs de origem e destino devem ser diferentes");
  }

  async function mesclarPessoasObras(): Promise<number> {
    let atualizados = 0;
    const { data: origemRows, error: origemError } = await supabase
      .from("pessoas_obras")
      .select("*")
      .eq("pessoa_id", origemId);
    if (origemError || !origemRows?.length) return 0;

    const { data: destinoRows } = await supabase
      .from("pessoas_obras")
      .select("*")
      .eq("pessoa_id", destinoId);

    const obraIdsDestino = new Set((destinoRows || []).map((r: any) => r.obra_id).filter(Boolean));

    for (const row of origemRows) {
      if (!row.obra_id || obraIdsDestino.has(row.obra_id)) {
        await supabase.from("pessoas_obras").delete().eq("id", row.id);
        continue;
      }
      const payload = { ...row, id: undefined, pessoa_id: destinoId };
      const { error: insertError } = await supabase.from("pessoas_obras").insert(payload as any);
      if (!insertError) {
        atualizados += 1;
      }
      await supabase.from("pessoas_obras").delete().eq("id", row.id);
    }

    return atualizados;
  }

  async function mesclarPessoasDocumentos(): Promise<number> {
    let atualizados = 0;
    const { data: origemRows, error: origemError } = await supabase
      .from("pessoas_documentos")
      .select("*")
      .eq("pessoa_id", origemId);
    if (origemError || !origemRows?.length) return 0;

    const { data: destinoRows } = await supabase
      .from("pessoas_documentos")
      .select("*")
      .eq("pessoa_id", destinoId);

    const assinatura = (row: any) =>
      `${String(row.tipo || "").trim().toLowerCase()}|${String(row.url || row.arquivo_url || "").trim().toLowerCase()}|${String(row.nome || "").trim().toLowerCase()}`;

    const docsDestino = new Set((destinoRows || []).map(assinatura));

    for (const row of origemRows) {
      const sig = assinatura(row);
      if (docsDestino.has(sig)) {
        await supabase.from("pessoas_documentos").delete().eq("id", row.id);
        continue;
      }
      const payload = { ...row, id: undefined, pessoa_id: destinoId };
      const { error: insertError } = await supabase.from("pessoas_documentos").insert(payload as any);
      if (!insertError) {
        atualizados += 1;
        docsDestino.add(sig);
      }
      await supabase.from("pessoas_documentos").delete().eq("id", row.id);
    }

    return atualizados;
  }

  async function mesclarAcessosCliente(): Promise<number> {
    const { data: acessosOrigem } = await supabase
      .from("acessos_cliente")
      .select("*")
      .eq("cliente_id", origemId);
    if (!acessosOrigem?.length) return 0;

    const { data: acessoDestino } = await supabase
      .from("acessos_cliente")
      .select("*")
      .eq("cliente_id", destinoId)
      .maybeSingle();

    // Se não existe acesso no destino, apenas transfere
    if (!acessoDestino) {
      const { error, count } = await supabase
        .from("acessos_cliente")
        .update({ cliente_id: destinoId })
        .eq("cliente_id", origemId);
      if (error) {
        console.warn("[mesclarPessoas] Erro ao transferir acessos_cliente:", error.message);
        return 0;
      }
      return count || 0;
    }

    // Se já existe no destino, mescla dados faltantes e remove origem
    const origem = acessosOrigem[0] as any;
    const destino = acessoDestino as any;
    const camposIgnorados = new Set(["id", "cliente_id", "created_at", "updated_at"]);
    const payload: Record<string, any> = {};

    for (const [campo, valorOrigem] of Object.entries(origem)) {
      if (camposIgnorados.has(campo)) continue;
      const valorDestino = destino[campo];
      const destinoVazio = valorDestino === null || valorDestino === undefined || valorDestino === "";
      if (destinoVazio && valorOrigem !== null && valorOrigem !== undefined && valorOrigem !== "") {
        payload[campo] = valorOrigem;
      }
    }

    if (Object.keys(payload).length > 0) {
      await supabase.from("acessos_cliente").update(payload).eq("id", destino.id);
    }

    await supabase.from("acessos_cliente").delete().eq("cliente_id", origemId);
    return 1;
  }

  // Tabelas que têm referência a pessoa_id ou cliente_id
  const tabelasComPessoaId = [
    { tabela: "financeiro_lancamentos", coluna: "pessoa_id" },
    { tabela: "pessoas_avaliacoes", coluna: "pessoa_id" },
  ];

  const tabelasComClienteId = [
    { tabela: "contratos", coluna: "cliente_id" },
    { tabela: "oportunidades", coluna: "cliente_id" },
    { tabela: "projetos", coluna: "cliente_id" },
    { tabela: "analises_projeto", coluna: "cliente_id" },
    { tabela: "assistencia_tecnica", coluna: "cliente_id" },
    { tabela: "cronogramas", coluna: "cliente_id" },
  ];

  let totalAtualizado = 0;

  // Mesclar dependências especiais primeiro (evita duplicidades e preserva dados)
  totalAtualizado += await mesclarPessoasObras();
  totalAtualizado += await mesclarPessoasDocumentos();
  totalAtualizado += await mesclarAcessosCliente();

  // Atualizar referências pessoa_id
  for (const { tabela, coluna } of tabelasComPessoaId) {
    const { error, count } = await supabase
      .from(tabela)
      .update({ [coluna]: destinoId })
      .eq(coluna, origemId);

    if (error) {
      console.warn(`[mesclarPessoas] Erro ao atualizar ${tabela}.${coluna}:`, error.message);
    } else if (count) {
      totalAtualizado += count;
      console.log(`[mesclarPessoas] ${tabela}: ${count} registros atualizados`);
    }
  }

  // Atualizar referências cliente_id
  for (const { tabela, coluna } of tabelasComClienteId) {
    const { error, count } = await supabase
      .from(tabela)
      .update({ [coluna]: destinoId })
      .eq(coluna, origemId);

    if (error) {
      console.warn(`[mesclarPessoas] Erro ao atualizar ${tabela}.${coluna}:`, error.message);
    } else if (count) {
      totalAtualizado += count;
      console.log(`[mesclarPessoas] ${tabela}: ${count} registros atualizados`);
    }
  }

  // Buscar dados da pessoa origem para mesclar campos vazios
  const { data: origem } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", origemId)
    .single();

  const { data: destino } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", destinoId)
    .single();

  if (origem && destino) {
    // Mesclar campos vazios do destino com dados da origem
    const camposParaMesclar: Partial<PessoaInput> = {};
    const camposTexto = [
      "email", "telefone", "cpf", "cnpj", "rg", "nacionalidade", "estado_civil",
      "profissao", "cargo", "empresa", "unidade", "cep", "logradouro", "numero",
      "complemento", "bairro", "cidade", "estado", "pais", "banco", "agencia",
      "conta", "tipo_conta", "pix", "contato_responsavel", "observacoes",
      "drive_link", "avatar_url", "foto_url"
    ];

    for (const campo of camposTexto) {
      if (!destino[campo] && origem[campo]) {
        (camposParaMesclar as any)[campo] = origem[campo];
      }
    }

    // Se tiver campos para atualizar, fazer o update
    if (Object.keys(camposParaMesclar).length > 0) {
      await supabase
        .from(TABLE)
        .update(camposParaMesclar)
        .eq("id", destinoId);
      console.log(`[mesclarPessoas] Campos mesclados:`, Object.keys(camposParaMesclar));
    }
  }

  // Deletar a pessoa origem
  const { error: deleteError } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", origemId);

  if (deleteError) {
    console.error("[mesclarPessoas] Erro ao deletar origem:", deleteError);
    throw new Error(`Erro ao deletar pessoa origem: ${deleteError.message}`);
  }

  return {
    success: true,
    message: `Mesclagem concluída. ${totalAtualizado} registros transferidos.`
  };
}


