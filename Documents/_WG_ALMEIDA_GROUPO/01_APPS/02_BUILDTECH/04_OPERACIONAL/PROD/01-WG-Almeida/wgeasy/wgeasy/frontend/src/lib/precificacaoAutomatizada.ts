// ============================================================
// SISTEMA DE PRECIFICAÇÍO AUTOMATIZADA - WG EASY
// IntegraçÍo com bases de dados oficiais e catálogos
// ============================================================

// ============================================================
// TIPOS E INTERFACES
// ============================================================

/**
 * Fonte de dados de preços
 */
export type FontePreco =
  | 'sinapi'      // Sistema Nacional de Pesquisa de Custos e índices da ConstruçÍo Civil
  | 'sicro'       // Sistema de Custos Referenciais de Obras (DNIT)
  | 'orse'        // Orçamento de Obras de Sergipe
  | 'setop'       // Secretaria de Estado de Transportes e Obras Públicas (MG)
  | 'tcpo'        // Tabela de Composições de Preços para Orçamentos
  | 'catalogo'    // Catálogo próprio WGEasy
  | 'fornecedor'; // Preço de fornecedor específico

/**
 * Item de composiçÍo de custo
 */
export interface ItemComposicao {
  codigo: string;
  descricao: string;
  unidade: string;
  coeficiente: number;
  precoUnitario: number;
  precoTotal: number;
  tipo: 'material' | 'mao_obra' | 'equipamento' | 'servico';
  fonte: FontePreco;
  dataReferencia: string;
  estado?: string;
}

/**
 * ComposiçÍo completa de serviço
 */
export interface ComposicaoServico {
  codigo: string;
  descricao: string;
  unidade: string;
  fonte: FontePreco;
  dataReferencia: string;
  estado: string;
  itens: ItemComposicao[];
  custoMaterial: number;
  custoMaoObra: number;
  custoEquipamento: number;
  custoTotal: number;
  bdiAplicado?: number;
  precoFinal?: number;
}

/**
 * ConfiguraçÍo de BDI (BonificaçÍo e Despesas Indiretas)
 */
export interface ConfiguracaoBDI {
  administracaoCentral: number;      // AC - 3% a 5%
  seguroGarantia: number;            // SG - 0.8% a 1%
  riscoImprevistos: number;          // R - 0.5% a 1.5%
  despesasFinanceiras: number;       // DF - 0.5% a 1.5%
  lucro: number;                     // L - 5% a 10%
  tributos: {
    pis: number;                     // PIS - 0.65% ou 1.65%
    cofins: number;                  // COFINS - 3% ou 7.6%
    iss: number;                     // ISS - 2% a 5%
    irpj?: number;                   // IRPJ (se aplicável)
    csll?: number;                   // CSLL (se aplicável)
  };
  bdiTotal?: number;
}

/**
 * Item de orçamento com precificaçÍo
 */
export interface ItemOrcamentoPrecificado {
  id: string;
  codigo: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  precoUnitario: number;
  precoTotal: number;
  fonte: FontePreco;
  composicao?: ComposicaoServico;
  bdi?: number;
  precoComBDI?: number;
  categoria: string;
  subcategoria?: string;
  percentualTotal?: number; // Para curva ABC
}

/**
 * Resultado da Curva ABC
 */
export interface CurvaABC {
  classificacao: 'A' | 'B' | 'C';
  itens: ItemOrcamentoPrecificado[];
  valorTotal: number;
  percentualValor: number;
  quantidadeItens: number;
  percentualItens: number;
}

/**
 * Histórico de preços para análise de tendência
 */
export interface HistoricoPreco {
  codigo: string;
  precos: {
    data: string;
    valor: number;
    fonte: FontePreco;
    estado: string;
  }[];
  variacaoMensal?: number;
  variacaoAnual?: number;
  tendencia: 'alta' | 'estavel' | 'baixa';
}

// ============================================================
// CLASSE PRINCIPAL DE PRECIFICAÇÍO
// ============================================================

export class PrecificacaoAutomatizadaService {
  private readonly cachePrecos: Map<string, { preco: number; data: Date }> = new Map();
  private readonly CACHE_DURACAO_MS = 24 * 60 * 60 * 1000; // 24 horas

  /**
   * Calcular BDI total baseado na configuraçÍo
   */
  calcularBDI(config: ConfiguracaoBDI): number {
    const { administracaoCentral, seguroGarantia, riscoImprevistos, despesasFinanceiras, lucro, tributos } = config;

    const totalTributos = tributos.pis + tributos.cofins + tributos.iss + (tributos.irpj || 0) + (tributos.csll || 0);

    // Fórmula do BDI conforme TCU
    // BDI = ((1 + AC + SG + R + DF) * (1 + L) / (1 - T)) - 1
    const parcela1 = 1 + (administracaoCentral / 100) + (seguroGarantia / 100) + (riscoImprevistos / 100) + (despesasFinanceiras / 100);
    const parcela2 = 1 + (lucro / 100);
    const parcela3 = 1 - (totalTributos / 100);

    const bdi = ((parcela1 * parcela2) / parcela3) - 1;

    return Math.round(bdi * 10000) / 100; // Retorna em percentual com 2 casas
  }

  /**
   * Aplicar BDI ao preço
   */
  aplicarBDI(precoBase: number, bdiPercentual: number): number {
    return precoBase * (1 + bdiPercentual / 100);
  }

  /**
   * Classificar itens pela Curva ABC
   */
  classificarCurvaABC(itens: ItemOrcamentoPrecificado[]): {
    curvaA: CurvaABC;
    curvaB: CurvaABC;
    curvaC: CurvaABC;
    resumo: {
      valorTotal: number;
      quantidadeTotal: number;
    };
  } {
    // Ordenar por valor total decrescente
    const itensOrdenados = [...itens].sort((a, b) => b.precoTotal - a.precoTotal);
    const valorTotal = itensOrdenados.reduce((sum, item) => sum + item.precoTotal, 0);

    // Calcular percentuais acumulados
    let acumulado = 0;
    const itensComPercentual = itensOrdenados.map(item => {
      acumulado += item.precoTotal;
      return {
        ...item,
        percentualTotal: (item.precoTotal / valorTotal) * 100,
        percentualAcumulado: (acumulado / valorTotal) * 100,
      };
    });

    // Classificar: A = até 80%, B = 80-95%, C = 95-100%
    const curvaA: ItemOrcamentoPrecificado[] = [];
    const curvaB: ItemOrcamentoPrecificado[] = [];
    const curvaC: ItemOrcamentoPrecificado[] = [];

    for (const item of itensComPercentual) {
      if (item.percentualAcumulado <= 80) {
        curvaA.push(item);
      } else if (item.percentualAcumulado <= 95) {
        curvaB.push(item);
      } else {
        curvaC.push(item);
      }
    }

    const criarCurva = (itens: ItemOrcamentoPrecificado[], classificacao: 'A' | 'B' | 'C'): CurvaABC => {
      const valorCurva = itens.reduce((sum, item) => sum + item.precoTotal, 0);
      return {
        classificacao,
        itens,
        valorTotal: valorCurva,
        percentualValor: (valorCurva / valorTotal) * 100,
        quantidadeItens: itens.length,
        percentualItens: (itens.length / itensOrdenados.length) * 100,
      };
    };

    return {
      curvaA: criarCurva(curvaA, 'A'),
      curvaB: criarCurva(curvaB, 'B'),
      curvaC: criarCurva(curvaC, 'C'),
      resumo: {
        valorTotal,
        quantidadeTotal: itensOrdenados.length,
      },
    };
  }

  /**
   * Buscar preço no SINAPI
   * Nota: Em produçÍo, isso deve fazer chamada à API ou banco de dados
   */
  async buscarPrecoSINAPI(codigo: string, estado: string = 'SP'): Promise<ItemComposicao | null> {
    // Verificar cache
    const cacheKey = `sinapi_${codigo}_${estado}`;
    const cached = this.cachePrecos.get(cacheKey);
    if (cached && Date.now() - cached.data.getTime() < this.CACHE_DURACAO_MS) {
      return {
        codigo,
        descricao: `Item SINAPI ${codigo}`,
        unidade: 'UN',
        coeficiente: 1,
        precoUnitario: cached.preco,
        precoTotal: cached.preco,
        tipo: 'servico',
        fonte: 'sinapi',
        dataReferencia: new Date().toISOString().slice(0, 7),
        estado,
      };
    }

    // TODO: Implementar integraçÍo real com API SINAPI ou banco de dados
    // Por enquanto, retornar null para indicar que precisa ser implementado
    console.warn(`[PrecificacaoService] Busca SINAPI não implementada para código ${codigo}`);
    return null;
  }

  /**
   * Buscar preço no SICRO
   */
  async buscarPrecoSICRO(codigo: string): Promise<ItemComposicao | null> {
    // TODO: Implementar integraçÍo com SICRO/DNIT
    console.warn(`[PrecificacaoService] Busca SICRO não implementada para código ${codigo}`);
    return null;
  }

  /**
   * Importar tabela SINAPI de arquivo Excel/CSV
   */
  async importarTabelaSINAPI(arquivo: File): Promise<{
    sucesso: boolean;
    itensImportados: number;
    erros: string[];
  }> {
    const erros: string[] = [];
    let itensImportados = 0;

    try {
      // TODO: Implementar parsing de Excel/CSV
      // Usar biblioteca como xlsx ou papaparse

      console.log('[PrecificacaoService] ImportaçÍo SINAPI iniciada', arquivo.name);

      return {
        sucesso: true,
        itensImportados,
        erros,
      };
    } catch (error) {
      erros.push(`Erro ao importar arquivo: ${error}`);
      return {
        sucesso: false,
        itensImportados,
        erros,
      };
    }
  }

  /**
   * Gerar relatório de Curva ABC formatado
   */
  gerarRelatorioCurvaABC(curvas: ReturnType<typeof this.classificarCurvaABC>): string {
    let relatorio = '';
    relatorio += '═══════════════════════════════════════════════════════════\n';
    relatorio += '              ANÁLISE DE CURVA ABC - ORÇAMENTO              \n';
    relatorio += '═══════════════════════════════════════════════════════════\n\n';

    relatorio += `📊 RESUMO GERAL\n`;
    relatorio += `   Valor Total: R$ ${curvas.resumo.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
    relatorio += `   Quantidade de Itens: ${curvas.resumo.quantidadeTotal}\n\n`;

    const formatarCurva = (curva: CurvaABC, emoji: string) => {
      relatorio += `${emoji} CURVA ${curva.classificacao}\n`;
      relatorio += `   Valor: R$ ${curva.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${curva.percentualValor.toFixed(1)}%)\n`;
      relatorio += `   Itens: ${curva.quantidadeItens} (${curva.percentualItens.toFixed(1)}%)\n`;
      relatorio += `   Top 5 itens:\n`;
      curva.itens.slice(0, 5).forEach((item, i) => {
        relatorio += `     ${i + 1}. ${item.descricao.slice(0, 40)}... - R$ ${item.precoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
      });
      relatorio += '\n';
    };

    formatarCurva(curvas.curvaA, '🔴');
    formatarCurva(curvas.curvaB, '🟡');
    formatarCurva(curvas.curvaC, '🟢');

    relatorio += '═══════════════════════════════════════════════════════════\n';
    relatorio += '💡 RECOMENDAÇÕES:\n';
    relatorio += '   • Curva A: Negociar intensamente com fornecedores\n';
    relatorio += '   • Curva B: Buscar alternativas e comparar preços\n';
    relatorio += '   • Curva C: Compra simplificada, foco em disponibilidade\n';
    relatorio += '═══════════════════════════════════════════════════════════\n';

    return relatorio;
  }

  /**
   * Calcular variaçÍo de preço entre períodos
   */
  calcularVariacaoPreco(precoAnterior: number, precoAtual: number): {
    variacao: number;
    percentual: number;
    tendencia: 'alta' | 'estavel' | 'baixa';
  } {
    const variacao = precoAtual - precoAnterior;
    const percentual = precoAnterior > 0 ? ((variacao / precoAnterior) * 100) : 0;

    let tendencia: 'alta' | 'estavel' | 'baixa';
    if (percentual > 2) tendencia = 'alta';
    else if (percentual < -2) tendencia = 'baixa';
    else tendencia = 'estavel';

    return {
      variacao,
      percentual: Math.round(percentual * 100) / 100,
      tendencia,
    };
  }
}

// ============================================================
// CONFIGURAÇÕES PADRÍO DE BDI
// ============================================================

/**
 * BDI padrÍo para obras residenciais
 */
export const BDI_RESIDENCIAL: ConfiguracaoBDI = {
  administracaoCentral: 4,
  seguroGarantia: 0.8,
  riscoImprevistos: 1,
  despesasFinanceiras: 1,
  lucro: 100,
  tributos: {
    pis: 0.65,
    cofins: 3,
    iss: 3,
  },
};

/**
 * BDI padrÍo para obras comerciais
 */
export const BDI_COMERCIAL: ConfiguracaoBDI = {
  administracaoCentral: 5,
  seguroGarantia: 1,
  riscoImprevistos: 1.5,
  despesasFinanceiras: 1.2,
  lucro: 100,
  tributos: {
    pis: 1.65,
    cofins: 7.6,
    iss: 4,
  },
};

/**
 * BDI padrÍo para reformas
 */
export const BDI_REFORMA: ConfiguracaoBDI = {
  administracaoCentral: 4.5,
  seguroGarantia: 0.8,
  riscoImprevistos: 2,
  despesasFinanceiras: 1,
  lucro: 100,
  tributos: {
    pis: 0.65,
    cofins: 3,
    iss: 3.5,
  },
};

// ============================================================
// MAPEAMENTO SINAPI - CÓDIGOS MAIS USADOS
// ============================================================

/**
 * Códigos SINAPI frequentes para referência
 */
export const CODIGOS_SINAPI_FREQUENTES = {
  // Alvenaria
  alvenaria_tijolo_9cm: '87472', // Alvenaria de vedaçÍo de blocos cerâmicos
  alvenaria_tijolo_14cm: '87476',
  alvenaria_tijolo_19cm: '87480',

  // Revestimentos
  chapisco_interno: '87879',
  chapisco_externo: '87878',
  emboco_interno: '87529',
  emboco_externo: '87528',
  reboco: '87891',

  // Pisos
  contrapiso: '87622',
  piso_ceramico: '87261',
  piso_porcelanato: '87266',

  // Instalações Elétricas
  ponto_tomada: '91853',
  ponto_iluminacao: '91856',
  ponto_interruptor: '91859',
  quadro_distribuicao: '91928',

  // Instalações Hidráulicas
  ponto_agua_fria: '89357',
  ponto_agua_quente: '89358',
  ponto_esgoto: '89400',

  // Pintura
  pintura_latex_interna: '88485',
  pintura_latex_externa: '88489',
  pintura_acrilica: '88494',
  massa_corrida: '88497',

  // Forro
  forro_gesso: '96117',
  forro_pvc: '96123',
};

// ============================================================
// INSTÂNCIA GLOBAL
// ============================================================

export const precificacaoService = new PrecificacaoAutomatizadaService();

// ============================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================

/**
 * Formatar valor em Real
 */
export function formatarMoedaBRL(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/**
 * Calcular preço total com BDI
 */
export function calcularPrecoComBDI(
  quantidade: number,
  precoUnitario: number,
  bdiPercentual: number
): { precoBase: number; bdiValor: number; precoFinal: number } {
  const precoBase = quantidade * precoUnitario;
  const bdiValor = precoBase * (bdiPercentual / 100);
  const precoFinal = precoBase + bdiValor;

  return {
    precoBase: Math.round(precoBase * 100) / 100,
    bdiValor: Math.round(bdiValor * 100) / 100,
    precoFinal: Math.round(precoFinal * 100) / 100,
  };
}


