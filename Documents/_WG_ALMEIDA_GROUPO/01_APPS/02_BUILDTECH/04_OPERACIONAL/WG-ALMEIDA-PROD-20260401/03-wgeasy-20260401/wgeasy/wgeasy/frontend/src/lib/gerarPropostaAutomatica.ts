// ============================================================
// GERADOR AUTOMÁTICO DE PROPOSTAS
// Sistema WG Easy - Grupo WG Almeida
// Cruza dados da análise de projeto com o pricelist para gerar
// propostas automaticamente com quantitativos calculados
// ============================================================

import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import type { ItemProposta, Ambiente, ItemPricelist } from "@/modules/propostas-v2/types";
import type { NucleoItem } from "@/types/propostas";

// ============================================================
// TIPOS
// ============================================================

export interface ServicoBase {
  id: string;
  nome: string;
  descricao?: string;
  categoria: string;
  unidade: "m2" | "m" | "un" | "vb" | "ponto" | "kg";
  tipoCalculo: "area_piso" | "area_parede" | "area_teto" | "perimetro" | "quantidade" | "fixo";
  multiplicador?: number;
  nucleo: NucleoItem;
  prioridade: number;
}

export interface ServicoCalculado extends ServicoBase {
  ambiente_id: string;
  ambiente_nome: string;
  quantidade: number;
  itemPricelist?: ItemPricelist;
  scoreMatch?: number;
}

export interface PropostaGerada {
  itens: ItemProposta[];
  resumo: {
    totalMaterial: number;
    totalMaoObra: number;
    totalServico: number;
    totalProduto: number;
    totalGeral: number;
    ambientesProcessados: number;
    itensGerados: number;
    itensNaoEncontrados: string[];
  };
}

// ============================================================
// CATÁLOGO DE SERVIÇOS PADRÍO POR TIPO DE AMBIENTE
// ============================================================

const SERVICOS_POR_AMBIENTE: Record<string, string[]> = {
  // Banheiros
  banheiro: [
    "demolicao_revestimento_piso",
    "demolicao_revestimento_parede",
    "regularizacao_piso",
    "regularizacao_parede",
    "impermeabilizacao_box",
    "revestimento_piso_porcelanato",
    "revestimento_parede_porcelanato",
    "rejunte_piso",
    "rejunte_parede",
    "instalacao_box",
    "instalacao_loucas",
    "instalacao_metais",
    "ponto_eletrico",
    "ponto_hidraulico",
    "pintura_teto",
  ],
  lavabo: [
    "demolicao_revestimento_piso",
    "demolicao_revestimento_parede",
    "revestimento_piso_porcelanato",
    "revestimento_parede_porcelanato",
    "rejunte_piso",
    "rejunte_parede",
    "instalacao_loucas",
    "instalacao_metais",
    "ponto_eletrico",
    "ponto_hidraulico",
    "pintura_teto",
  ],
  // Quartos/Suítes
  suite: [
    "demolicao_piso",
    "regularizacao_piso",
    "piso_laminado",
    "rodape",
    "pintura_parede",
    "pintura_teto",
    "ponto_eletrico",
    "forro_gesso",
  ],
  quarto: [
    "demolicao_piso",
    "regularizacao_piso",
    "piso_laminado",
    "rodape",
    "pintura_parede",
    "pintura_teto",
    "ponto_eletrico",
    "forro_gesso",
  ],
  // Sala
  sala: [
    "demolicao_piso",
    "regularizacao_piso",
    "piso_porcelanato",
    "rejunte_piso",
    "rodape",
    "pintura_parede",
    "pintura_teto",
    "ponto_eletrico",
    "forro_gesso",
  ],
  // Cozinha
  cozinha: [
    "demolicao_revestimento_piso",
    "demolicao_revestimento_parede",
    "regularizacao_piso",
    "regularizacao_parede",
    "revestimento_piso_porcelanato",
    "revestimento_parede_porcelanato",
    "rejunte_piso",
    "rejunte_parede",
    "ponto_eletrico",
    "ponto_hidraulico",
    "pintura_teto",
    "forro_gesso",
  ],
  // Área de serviço
  lavanderia: [
    "demolicao_revestimento_piso",
    "regularizacao_piso",
    "revestimento_piso_porcelanato",
    "rejunte_piso",
    "pintura_parede",
    "pintura_teto",
    "ponto_eletrico",
    "ponto_hidraulico",
  ],
  // Área externa
  terraco: [
    "regularizacao_piso",
    "impermeabilizacao",
    "piso_porcelanato_externo",
    "rejunte_piso",
    "pintura_parede",
    "pintura_teto",
  ],
  varanda: [
    "regularizacao_piso",
    "piso_porcelanato",
    "rejunte_piso",
    "pintura_parede",
    "pintura_teto",
    "forro_gesso",
  ],
  // CirculaçÍo
  circulacao: [
    "demolicao_piso",
    "regularizacao_piso",
    "piso_porcelanato",
    "rejunte_piso",
    "rodape",
    "pintura_parede",
    "pintura_teto",
  ],
  hall: [
    "demolicao_piso",
    "regularizacao_piso",
    "piso_porcelanato",
    "rejunte_piso",
    "rodape",
    "pintura_parede",
    "pintura_teto",
  ],
  // Home Office
  home_office: [
    "demolicao_piso",
    "regularizacao_piso",
    "piso_laminado",
    "rodape",
    "pintura_parede",
    "pintura_teto",
    "ponto_eletrico",
    "forro_gesso",
  ],
  // Área técnica
  area_tecnica: [
    "pintura_parede",
    "pintura_teto",
  ],
};

// ============================================================
// DEFINIÇÕES DE SERVIÇOS COM CÁLCULO
// ============================================================

const SERVICOS_DEFINICAO: Record<string, ServicoBase> = {
  // DEMOLIÇÍO
  demolicao_piso: {
    id: "demolicao_piso",
    nome: "DemoliçÍo de piso",
    categoria: "demolicao",
    unidade: "m2",
    tipoCalculo: "area_piso",
    nucleo: "engenharia",
    prioridade: 1,
  },
  demolicao_revestimento_piso: {
    id: "demolicao_revestimento_piso",
    nome: "DemoliçÍo de revestimento de piso",
    categoria: "demolicao",
    unidade: "m2",
    tipoCalculo: "area_piso",
    nucleo: "engenharia",
    prioridade: 1,
  },
  demolicao_revestimento_parede: {
    id: "demolicao_revestimento_parede",
    nome: "DemoliçÍo de revestimento de parede",
    categoria: "demolicao",
    unidade: "m2",
    tipoCalculo: "area_parede",
    nucleo: "engenharia",
    prioridade: 1,
  },
  // REGULARIZAÇÍO
  regularizacao_piso: {
    id: "regularizacao_piso",
    nome: "RegularizaçÍo de piso",
    categoria: "regularizacao",
    unidade: "m2",
    tipoCalculo: "area_piso",
    nucleo: "engenharia",
    prioridade: 2,
  },
  regularizacao_parede: {
    id: "regularizacao_parede",
    nome: "RegularizaçÍo de parede",
    categoria: "regularizacao",
    unidade: "m2",
    tipoCalculo: "area_parede",
    nucleo: "engenharia",
    prioridade: 2,
  },
  // IMPERMEABILIZAÇÍO
  impermeabilizacao: {
    id: "impermeabilizacao",
    nome: "ImpermeabilizaçÍo",
    categoria: "impermeabilizacao",
    unidade: "m2",
    tipoCalculo: "area_piso",
    nucleo: "engenharia",
    prioridade: 3,
  },
  impermeabilizacao_box: {
    id: "impermeabilizacao_box",
    nome: "ImpermeabilizaçÍo de box",
    categoria: "impermeabilizacao",
    unidade: "m2",
    tipoCalculo: "area_piso",
    multiplicador: 0.5, // Apenas área do box
    nucleo: "engenharia",
    prioridade: 3,
  },
  // REVESTIMENTO PISO
  piso_porcelanato: {
    id: "piso_porcelanato",
    nome: "Assentamento de porcelanato piso",
    categoria: "revestimento_piso",
    unidade: "m2",
    tipoCalculo: "area_piso",
    nucleo: "engenharia",
    prioridade: 4,
  },
  revestimento_piso_porcelanato: {
    id: "revestimento_piso_porcelanato",
    nome: "Revestimento de piso porcelanato",
    categoria: "revestimento_piso",
    unidade: "m2",
    tipoCalculo: "area_piso",
    nucleo: "engenharia",
    prioridade: 4,
  },
  piso_porcelanato_externo: {
    id: "piso_porcelanato_externo",
    nome: "Assentamento de porcelanato externo antiderrapante",
    categoria: "revestimento_piso",
    unidade: "m2",
    tipoCalculo: "area_piso",
    nucleo: "engenharia",
    prioridade: 4,
  },
  piso_laminado: {
    id: "piso_laminado",
    nome: "InstalaçÍo de piso laminado",
    categoria: "revestimento_piso",
    unidade: "m2",
    tipoCalculo: "area_piso",
    nucleo: "engenharia",
    prioridade: 4,
  },
  // REVESTIMENTO PAREDE
  revestimento_parede_porcelanato: {
    id: "revestimento_parede_porcelanato",
    nome: "Revestimento de parede porcelanato",
    categoria: "revestimento_parede",
    unidade: "m2",
    tipoCalculo: "area_parede",
    nucleo: "engenharia",
    prioridade: 4,
  },
  // REJUNTE
  rejunte_piso: {
    id: "rejunte_piso",
    nome: "Rejunte de piso",
    categoria: "rejunte",
    unidade: "m2",
    tipoCalculo: "area_piso",
    nucleo: "engenharia",
    prioridade: 5,
  },
  rejunte_parede: {
    id: "rejunte_parede",
    nome: "Rejunte de parede",
    categoria: "rejunte",
    unidade: "m2",
    tipoCalculo: "area_parede",
    nucleo: "engenharia",
    prioridade: 5,
  },
  // RODAPÉ
  rodape: {
    id: "rodape",
    nome: "InstalaçÍo de rodapé",
    categoria: "rodape",
    unidade: "m",
    tipoCalculo: "perimetro",
    nucleo: "engenharia",
    prioridade: 6,
  },
  // PINTURA
  pintura_parede: {
    id: "pintura_parede",
    nome: "Pintura de parede",
    categoria: "pintura",
    unidade: "m2",
    tipoCalculo: "area_parede",
    nucleo: "engenharia",
    prioridade: 7,
  },
  pintura_teto: {
    id: "pintura_teto",
    nome: "Pintura de teto",
    categoria: "pintura",
    unidade: "m2",
    tipoCalculo: "area_teto",
    nucleo: "engenharia",
    prioridade: 7,
  },
  // FORRO
  forro_gesso: {
    id: "forro_gesso",
    nome: "Forro de gesso",
    categoria: "forro",
    unidade: "m2",
    tipoCalculo: "area_teto",
    nucleo: "engenharia",
    prioridade: 6,
  },
  // INSTALAÇÕES
  ponto_eletrico: {
    id: "ponto_eletrico",
    nome: "Ponto elétrico",
    categoria: "instalacoes_eletricas",
    unidade: "ponto",
    tipoCalculo: "quantidade",
    multiplicador: 4, // Média de pontos por ambiente
    nucleo: "engenharia",
    prioridade: 5,
  },
  ponto_hidraulico: {
    id: "ponto_hidraulico",
    nome: "Ponto hidráulico",
    categoria: "instalacoes_hidraulicas",
    unidade: "ponto",
    tipoCalculo: "quantidade",
    multiplicador: 2, // Média de pontos por ambiente molhado
    nucleo: "engenharia",
    prioridade: 5,
  },
  // LOUÇAS E METAIS
  instalacao_loucas: {
    id: "instalacao_loucas",
    nome: "InstalaçÍo de louças sanitárias",
    categoria: "loucas_metais",
    unidade: "un",
    tipoCalculo: "quantidade",
    multiplicador: 2, // Vaso + pia
    nucleo: "produtos",
    prioridade: 8,
  },
  instalacao_metais: {
    id: "instalacao_metais",
    nome: "InstalaçÍo de metais",
    categoria: "loucas_metais",
    unidade: "un",
    tipoCalculo: "quantidade",
    multiplicador: 3, // Torneira, chuveiro, registro
    nucleo: "produtos",
    prioridade: 8,
  },
  instalacao_box: {
    id: "instalacao_box",
    nome: "InstalaçÍo de box",
    categoria: "vidracaria",
    unidade: "un",
    tipoCalculo: "fixo",
    multiplicador: 1,
    nucleo: "produtos",
    prioridade: 9,
  },
};

// ============================================================
// FUNÇÍO PRINCIPAL: GERAR PROPOSTA AUTOMÁTICA
// ============================================================

export async function gerarPropostaAutomatica(
  ambientes: Ambiente[],
  itensPricelist: ItemPricelist[],
  opcoes?: {
    incluirDemolicao?: boolean;
    incluirRegularizacao?: boolean;
    incluirPintura?: boolean;
    incluirForro?: boolean;
    incluirMateriais?: boolean;
  }
): Promise<PropostaGerada> {
  const config = {
    incluirDemolicao: true,
    incluirRegularizacao: true,
    incluirPintura: true,
    incluirForro: true,
    incluirMateriais: true,
    ...opcoes,
  };

  const servicosCalculados: ServicoCalculado[] = [];
  const itensNaoEncontrados: string[] = [];

  // Para cada ambiente, identificar serviços aplicáveis
  for (const ambiente of ambientes) {
    const tipoAmbiente = identificarTipoAmbiente(ambiente.nome);
    const servicosDoAmbiente = SERVICOS_POR_AMBIENTE[tipoAmbiente] || SERVICOS_POR_AMBIENTE.circulacao;

    for (const servicoId of servicosDoAmbiente) {
      const definicao = SERVICOS_DEFINICAO[servicoId];
      if (!definicao) continue;

      // Filtrar por opções
      if (!config.incluirDemolicao && definicao.categoria === "demolicao") continue;
      if (!config.incluirRegularizacao && definicao.categoria === "regularizacao") continue;
      if (!config.incluirPintura && definicao.categoria === "pintura") continue;
      if (!config.incluirForro && definicao.categoria === "forro") continue;

      // Calcular quantidade
      const quantidade = calcularQuantidade(ambiente, definicao);
      if (quantidade <= 0) continue;

      // Buscar item no pricelist (filtrar materiais se opçÍo desabilitada)
      const itensBusca = config.incluirMateriais
        ? itensPricelist
        : itensPricelist.filter(i => i.tipo !== "material");
      const match = await buscarItemPricelist(definicao.nome, definicao.categoria, itensBusca);

      servicosCalculados.push({
        ...definicao,
        ambiente_id: ambiente.id,
        ambiente_nome: ambiente.nome,
        quantidade: Math.round(quantidade * 100) / 100,
        itemPricelist: match?.item ?? undefined,
        scoreMatch: match?.score,
      });

      if (!match?.item) {
        itensNaoEncontrados.push(`${definicao.nome} (${ambiente.nome})`);
      }
    }
  }

  // Ordenar por ambiente e prioridade
  servicosCalculados.sort((a, b) => {
    if (a.ambiente_nome !== b.ambiente_nome) {
      return a.ambiente_nome.localeCompare(b.ambiente_nome);
    }
    return a.prioridade - b.prioridade;
  });

  // Converter para ItemProposta
  const itensProposta: ItemProposta[] = servicosCalculados.map((srv) => ({
    id: `auto-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    item: srv.itemPricelist
      ? {
          id: srv.itemPricelist.id,
          codigo: srv.itemPricelist.codigo || "",
          nome: srv.itemPricelist.nome,
          descricao: srv.itemPricelist.descricao || "",
          categoria: typeof srv.itemPricelist.categoria === "object"
            ? ((srv.itemPricelist.categoria as { nome?: string })?.nome || "")
            : (srv.itemPricelist.categoria || ""),
          tipo: srv.itemPricelist.tipo || "servico",
          unidade: (srv.itemPricelist.unidade || "un") as "m2" | "ml" | "un" | "diaria" | "hora" | "empreita",
          preco: srv.itemPricelist.preco || 0,
          nucleo: srv.nucleo,
        }
      : {
          id: `nao-encontrado-${srv.id}`,
          codigo: "",
          nome: srv.nome,
          descricao: `Item não encontrado no pricelist - ${srv.categoria}`,
          categoria: srv.categoria,
          tipo: "servico" as const,
          unidade: "un" as const,
          preco: 0,
          nucleo: srv.nucleo,
        },
    ambiente_id: srv.ambiente_id,
    ambientes_ids: srv.ambiente_id ? [srv.ambiente_id] : [],
    quantidade: srv.quantidade,
    valor_unitario: srv.itemPricelist?.preco || 0,
    descricao_customizada: `${srv.nome} - ${srv.ambiente_nome}`,
  }));

  // Calcular totais
  const totais = calcularTotais(itensProposta);

  return {
    itens: itensProposta,
    resumo: {
      totalMaterial: totais.material,
      totalMaoObra: totais.maoObra,
      totalServico: totais.servico,
      totalProduto: totais.produto,
      totalGeral: totais.total,
      ambientesProcessados: ambientes.length,
      itensGerados: itensProposta.length,
      itensNaoEncontrados,
    },
  };
}

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

function identificarTipoAmbiente(nome: string): string {
  const nomeNorm = nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Banheiros
  if (nomeNorm.includes("banho") || nomeNorm.includes("banheiro") || nomeNorm.includes("wc")) {
    return "banheiro";
  }
  if (nomeNorm.includes("lavabo")) return "lavabo";

  // Quartos
  if (nomeNorm.includes("suite")) return "suite";
  if (nomeNorm.includes("quarto") || nomeNorm.includes("dormitorio")) return "quarto";

  // Salas
  if (nomeNorm.includes("sala") && nomeNorm.includes("jantar")) return "sala";
  if (nomeNorm.includes("sala") && nomeNorm.includes("estar")) return "sala";
  if (nomeNorm.includes("sala") && nomeNorm.includes("tv")) return "sala";
  if (nomeNorm.includes("living")) return "sala";

  // Cozinha
  if (nomeNorm.includes("cozinha")) return "cozinha";

  // Lavanderia
  if (nomeNorm.includes("lavanderia") || nomeNorm.includes("area de servico") || nomeNorm.includes("area servico")) {
    return "lavanderia";
  }

  // Áreas externas
  if (nomeNorm.includes("terraco") || nomeNorm.includes("terraço")) return "terraco";
  if (nomeNorm.includes("varanda") || nomeNorm.includes("sacada")) return "varanda";

  // CirculaçÍo
  if (nomeNorm.includes("circulacao") || nomeNorm.includes("corredor")) return "circulacao";
  if (nomeNorm.includes("hall") || nomeNorm.includes("entrada")) return "hall";

  // Home Office
  if (nomeNorm.includes("home office") || nomeNorm.includes("escritorio") || nomeNorm.includes("office")) {
    return "home_office";
  }

  // Área técnica
  if (nomeNorm.includes("area tecnica") || nomeNorm.includes("tecnica")) return "area_tecnica";

  // Default
  return "circulacao";
}

function calcularQuantidade(ambiente: Ambiente, servico: ServicoBase): number {
  const multiplicador = servico.multiplicador || 1;

  switch (servico.tipoCalculo) {
    case "area_piso":
      return (ambiente.area_piso || 0) * multiplicador;
    case "area_parede":
      // Usar área líquida se disponível (descontando vÍos)
      return (ambiente.area_paredes_liquida || ambiente.area_parede || 0) * multiplicador;
    case "area_teto":
      return (ambiente.area_teto || ambiente.area_piso || 0) * multiplicador;
    case "perimetro":
      return (ambiente.perimetro || 0) * multiplicador;
    case "quantidade":
      return multiplicador;
    case "fixo":
      return multiplicador;
    default:
      return 0;
  }
}

async function buscarItemPricelist(
  termo: string,
  categoria: string,
  itensPricelist: ItemPricelist[]
): Promise<{ item: ItemPricelist | null; score: number }> {
  // Normalizar termo
  const termoNorm = termo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Busca local primeiro (mais rápido)
  let melhorMatch: { item: ItemPricelist | null; score: number } = { item: null, score: 0 };

  for (const item of itensPricelist) {
    const nomeNorm = item.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const descNorm = (item.descricao || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    let score = 0;

    // Match exato no nome
    if (nomeNorm === termoNorm) {
      score = 1.0;
    }
    // Nome contém o termo (busca direta)
    else if (nomeNorm.includes(termoNorm)) {
      score = 0.8;
    }
    // Termo contém o nome (busca reversa - mais restritiva)
    else if (termoNorm.includes(nomeNorm) && nomeNorm.length >= termoNorm.length * 0.6) {
      score = 0.7;
    }
    // DescriçÍo contém o termo
    else if (descNorm.includes(termoNorm)) {
      score = 0.6;
    }
    // Match por palavras - usar max(termo, nome) como denominador para penalizar extras
    else {
      const palavrasTermo = termoNorm.split(" ").filter(p => p.length > 2);
      const palavrasNome = nomeNorm.split(" ").filter(p => p.length > 2);
      const matches = palavrasTermo.filter(p => palavrasNome.some(pn => pn.includes(p) || p.includes(pn)));
      if (matches.length > 0) {
        const denominador = Math.max(palavrasTermo.length, palavrasNome.length);
        score = (matches.length / denominador) * 0.7;
      }
    }

    // Bonus se categoria coincide
    const catItem = typeof item.categoria === "object"
      ? (item.categoria as { nome?: string } | null)?.nome
      : item.categoria;
    if (catItem && catItem.toLowerCase().includes(categoria.toLowerCase())) {
      score += 0.15;
    }

    if (score > melhorMatch.score) {
      melhorMatch = { item, score: Math.min(score, 1) };
    }
  }

  // Se score baixo, tentar busca no banco via RPC
  if (melhorMatch.score < 0.5) {
    try {
      const { data } = await supabase.rpc("calcular_similaridade", {
        termo1: termo,
        termo2: melhorMatch.item?.nome || "",
      });
      if (data && data > melhorMatch.score) {
        melhorMatch.score = data;
      }
    } catch {
      // Ignora erro de RPC
    }
  }

  return melhorMatch.score >= 0.4 ? melhorMatch : { item: null, score: 0 };
}

function calcularTotais(itens: ItemProposta[]): {
  material: number;
  maoObra: number;
  servico: number;
  produto: number;
  total: number;
} {
  const totais = {
    material: 0,
    maoObra: 0,
    servico: 0,
    produto: 0,
    total: 0,
  };

  for (const item of itens) {
    const valor = item.quantidade * item.valor_unitario;
    totais.total += valor;

    switch (item.item.tipo) {
      case "material":
        totais.material += valor;
        break;
      case "mao_obra":
        totais.maoObra += valor;
        break;
      case "servico":
        totais.servico += valor;
        break;
      case "produto":
        totais.produto += valor;
        break;
    }
  }

  return totais;
}

// ============================================================
// EXPORTAR HELPER
// ============================================================

export function getTiposAmbienteDisponiveis(): string[] {
  return Object.keys(SERVICOS_POR_AMBIENTE);
}

export function getServicosParaAmbiente(tipoAmbiente: string): ServicoBase[] {
  const servicosIds = SERVICOS_POR_AMBIENTE[tipoAmbiente] || [];
  return servicosIds.map(id => SERVICOS_DEFINICAO[id]).filter(Boolean);
}


