// ============================================================
// UTILITÁRIOS DE PRECIFICAÇÍO
// Sistema WGEasy - Grupo WG Almeida
// IntegraçÍo entre PrecificaçÍo e Pricelist
// ============================================================

export type NucleoNegocio = "Design" | "Arquitetura" | "Engenharia" | "Marcenaria";

export interface RegrasPrecificacao {
  impostosPerc: number;         // % de impostos
  custoHoraWilliamPerc: number; // % do custo hora William
  variaveisPerc: number;        // % de custos variáveis
  fixosPerc: number;            // % de custos fixos
  margemPerc: number;           // % de margem de lucro
  faturamentoMeta: number;      // Faturamento meta mensal
  custoMensalWilliam: number;   // Custo mensal do William
  fixosValor: number;           // Valor absoluto dos custos fixos
}

export interface CalculoPrecificacao {
  custoAquisicao: number;       // Custo base (input)
  impostos: number;             // + Impostos
  custoHoraWilliam: number;     // + Custo hora William
  variaveis: number;            // + Custos variáveis
  fixos: number;                // + Custos fixos
  custoReal: number;            // = CUSTO REAL
  margem: number;               // + Margem
  precoVenda: number;           // = PREÇO DE VENDA
  margemRealPerc: number;       // Margem real calculada
}

// ============================================================
// VALORES PADRÍO DO SISTEMA
// ============================================================
const VALORES_PADRAO: RegrasPrecificacao = {
  impostosPerc: 5,              // ISS padrÍo
  custoHoraWilliamPerc: 21.3,   // ~21.3% (21297.12 / 100000)
  variaveisPerc: 0,             // Sem variáveis padrÍo
  fixosPerc: 0,                 // Calculado por empresa
  margemPerc: 100,               // 100% margem padrÍo
  faturamentoMeta: 100000,
  custoMensalWilliam: 21297.12,
  fixosValor: 0,
};

// Custos fixos por núcleo/empresa (valores mensais aproximados)
const FIXOS_POR_NUCLEO: Record<NucleoNegocio, number> = {
  Design: 3000,
  Arquitetura: 5000,
  Engenharia: 8000,
  Marcenaria: 12000,
};

// ============================================================
// CARREGAR REGRAS DO LOCALSTORAGE
// ============================================================
export function carregarRegrasPrecificacao(nucleo?: string): RegrasPrecificacao {
  const nucleoNormalizado = normalizarNucleo(nucleo);
  const storageKey = `precificacao_empresa_${nucleoNormalizado || "global"}`;

  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      const itemsByTab = parsed.itemsByTab || {};

      // Calcular percentuais a partir dos itens salvos
      const impostosPerc = (itemsByTab.impostos || [])
        .filter((i: any) => i.tipo === "percentual")
        .reduce((acc: number, i: any) => acc + (i.valor || 0), 0);

      const variaveisPerc = (itemsByTab.variaveis || [])
        .filter((i: any) => i.tipo === "percentual")
        .reduce((acc: number, i: any) => acc + (i.valor || 0), 0);

      const margemPerc = (itemsByTab.margem || [])
        .filter((i: any) => i.tipo === "percentual")
        .reduce((acc: number, i: any) => acc + (i.valor || 0), 0) || VALORES_PADRAO.margemPerc;

      // Faturamento meta (do custoBase ou padrÍo)
      const faturamentoMeta = Number(parsed.faturamentoMeta) || VALORES_PADRAO.faturamentoMeta;
      const custoMensalWilliam = VALORES_PADRAO.custoMensalWilliam;

      // Custo hora William como percentual
      const custoHoraWilliamPerc = (custoMensalWilliam / faturamentoMeta) * 100;

      // Custos fixos por núcleo
      const fixosValor = FIXOS_POR_NUCLEO[nucleoNormalizado as NucleoNegocio] || 0;
      const fixosPerc = (fixosValor / faturamentoMeta) * 100;

      return {
        impostosPerc: impostosPerc || VALORES_PADRAO.impostosPerc,
        custoHoraWilliamPerc,
        variaveisPerc,
        fixosPerc,
        margemPerc,
        faturamentoMeta,
        custoMensalWilliam,
        fixosValor,
      };
    }
  } catch (error) {
    console.error("Erro ao carregar regras de precificaçÍo:", error);
  }

  // Retornar valores padrÍo com fixos do núcleo
  const fixosValor = FIXOS_POR_NUCLEO[nucleoNormalizado as NucleoNegocio] || 0;
  const fixosPerc = (fixosValor / VALORES_PADRAO.faturamentoMeta) * 100;

  return {
    ...VALORES_PADRAO,
    fixosValor,
    fixosPerc,
    custoHoraWilliamPerc: (VALORES_PADRAO.custoMensalWilliam / VALORES_PADRAO.faturamentoMeta) * 100,
  };
}

// ============================================================
// CALCULAR PREÇO DE VENDA
// ============================================================
export function calcularPrecificacao(
  custoAquisicao: number,
  regras: RegrasPrecificacao
): CalculoPrecificacao {
  if (!custoAquisicao || custoAquisicao <= 0) {
    return {
      custoAquisicao: 0,
      impostos: 0,
      custoHoraWilliam: 0,
      variaveis: 0,
      fixos: 0,
      custoReal: 0,
      margem: 0,
      precoVenda: 0,
      margemRealPerc: 0,
    };
  }

  // ITEM 1: Custo do produto
  const item1 = custoAquisicao;

  // ITEM 2: + Impostos
  const impostos = item1 * (regras.impostosPerc / 100);
  const subtotal2 = item1 + impostos;

  // ITEM 3: + Custo Hora William
  const custoHoraWilliam = subtotal2 * (regras.custoHoraWilliamPerc / 100);
  const subtotal3 = subtotal2 + custoHoraWilliam;

  // ITEM 4: + Custos Variáveis
  const variaveis = subtotal3 * (regras.variaveisPerc / 100);
  const subtotal4 = subtotal3 + variaveis;

  // ITEM 5: + Custos Fixos
  const fixos = subtotal4 * (regras.fixosPerc / 100);
  const custoReal = subtotal4 + fixos;

  // MARGEM: + Lucro
  const margem = custoReal * (regras.margemPerc / 100);
  const precoVenda = custoReal + margem;

  // Margem real calculada
  const margemRealPerc = precoVenda > 0 ? ((precoVenda - custoReal) / precoVenda) * 100 : 0;

  return {
    custoAquisicao,
    impostos,
    custoHoraWilliam,
    variaveis,
    fixos,
    custoReal,
    margem,
    precoVenda,
    margemRealPerc,
  };
}

// ============================================================
// NORMALIZAR NÚCLEO
// ============================================================
export function normalizarNucleo(nucleo?: string | null): NucleoNegocio | null {
  if (!nucleo) return null;

  const n = nucleo.toLowerCase();

  if (n.includes("design")) return "Design";
  if (n.includes("arq")) return "Arquitetura";
  if (n.includes("eng")) return "Engenharia";
  if (n.includes("marc")) return "Marcenaria";

  // Mapear diretamente
  const map: Record<string, NucleoNegocio> = {
    design: "Design",
    arquitetura: "Arquitetura",
    engenharia: "Engenharia",
    marcenaria: "Marcenaria",
  };

  return map[n] || null;
}

// ============================================================
// RECALCULAR PREÇO A PARTIR DO CUSTO DE AQUISIÇÍO
// ============================================================
export function recalcularPreco(
  custoAquisicao: number,
  nucleo?: string
): number {
  const regras = carregarRegrasPrecificacao(nucleo);
  const calculo = calcularPrecificacao(custoAquisicao, regras);
  return Math.round(calculo.precoVenda * 100) / 100; // Arredondar para 2 casas
}

// ============================================================
// OBTER DETALHES DO CÁLCULO (para exibiçÍo)
// ============================================================
export function obterDetalhesCalculo(
  custoAquisicao: number,
  nucleo?: string
): {
  regras: RegrasPrecificacao;
  calculo: CalculoPrecificacao;
  breakdown: { nome: string; percentual: number; valor: number }[];
} {
  const regras = carregarRegrasPrecificacao(nucleo);
  const calculo = calcularPrecificacao(custoAquisicao, regras);

  const breakdown = [
    { nome: "Custo de AquisiçÍo", percentual: 0, valor: calculo.custoAquisicao },
    { nome: "Impostos", percentual: regras.impostosPerc, valor: calculo.impostos },
    { nome: "Custo Hora William", percentual: regras.custoHoraWilliamPerc, valor: calculo.custoHoraWilliam },
    { nome: "Custos Variáveis", percentual: regras.variaveisPerc, valor: calculo.variaveis },
    { nome: "Custos Fixos", percentual: regras.fixosPerc, valor: calculo.fixos },
    { nome: "Margem de Lucro", percentual: regras.margemPerc, valor: calculo.margem },
  ];

  return { regras, calculo, breakdown };
}

