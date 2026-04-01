// ============================================================
// SERVIÇO DE GERAÇÍO AUTOMÁTICA DE CRONOGRAMA
// Sistema WG Easy - Grupo WG Almeida
// Gera cronograma baseado em quantitativos e produtividade SINAPI
// ============================================================

import {
  produtividadeService,
  formatarDuracaoDias,
  formatarEquipe,
  type DadosProdutividade,
  type EquipePadrao,
  type OpcoesCalculoPrazo,
} from './sinapiProdutividadeService';

// ============================================================
// TIPOS E INTERFACES
// ============================================================

/**
 * Item de quantitativo para geraçÍo de cronograma
 */
export interface ItemQuantitativo {
  id: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  categoriaServico?: string;
  codigoSINAPI?: string;
  // Campos opcionais do orçamento
  precoUnitario?: number;
  precoTotal?: number;
}

/**
 * Atividade gerada para o cronograma
 */
export interface AtividadeCronograma {
  id: string;
  sequencia: number;
  nome: string;
  descricao: string;
  categoria: string;
  fase: FaseObra;

  // Quantitativo
  quantidade: number;
  unidade: string;

  // Datas
  dataInicio: Date;
  dataFim: Date;
  duracao_dias_uteis: number;
  tempo_cura_dias: number;

  // Equipe
  equipe: EquipePadrao;

  // Dependências
  dependencias: string[]; // IDs das atividades que precisam terminar antes

  // Produtividade
  produtividade_usada: number;
  unidade_produtividade: string;

  // Status e observações
  observacoes: string[];
  percentualCompleto?: number;
  status?: 'pendente' | 'em_andamento' | 'concluida' | 'pausada';

  // Custo (se disponível)
  custoEstimado?: number;
}

/**
 * Fases de uma obra de reforma
 */
export type FaseObra =
  | 'preparacao'      // Proteções, remoções, demolições
  | 'estrutura'       // Fundações, estrutura, alvenaria
  | 'instalacoes'     // Elétrica, hidráulica, gás
  | 'revestimento'    // Contrapiso, chapisco, reboco, gesso
  | 'acabamento'      // Piso, azulejo, pintura
  | 'loucas_metais'   // InstalaçÍo de louças e metais
  | 'finalizacao';    // Limpeza, arremates

/**
 * Ordem de execuçÍo das fases
 */
const ORDEM_FASES: FaseObra[] = [
  'preparacao',
  'estrutura',
  'instalacoes',
  'revestimento',
  'acabamento',
  'loucas_metais',
  'finalizacao',
];

/**
 * Mapeamento de serviços para fases
 */
const MAPEAMENTO_FASES: Record<string, FaseObra> = {
  // PreparaçÍo
  'demolicao': 'preparacao',
  'remocao': 'preparacao',
  'protecao': 'preparacao',
  'limpeza_inicial': 'preparacao',

  // Estrutura
  'alvenaria': 'estrutura',
  'concreto': 'estrutura',
  'forma': 'estrutura',
  'armacao': 'estrutura',
  'fundacao': 'estrutura',
  'verga': 'estrutura',
  'estrutura': 'estrutura',

  // Instalações
  'eletrica': 'instalacoes',
  'hidraulica': 'instalacoes',
  'esgoto': 'instalacoes',
  'gas': 'instalacoes',
  'ar_condicionado': 'instalacoes',
  'cabeamento': 'instalacoes',

  // Revestimento
  'chapisco': 'revestimento',
  'emboco': 'revestimento',
  'reboco': 'revestimento',
  'gesso': 'revestimento',
  'contrapiso': 'revestimento',
  'regularizacao': 'revestimento',
  'impermeabilizacao': 'revestimento',
  'forro': 'revestimento',

  // Acabamento
  'piso': 'acabamento',
  'azulejo': 'acabamento',
  'ceramica': 'acabamento',
  'porcelanato': 'acabamento',
  'pintura': 'acabamento',
  'textura': 'acabamento',
  'rodape': 'acabamento',
  'soleira': 'acabamento',

  // Louças e Metais
  'loucas': 'loucas_metais',
  'metais': 'loucas_metais',
  'vaso': 'loucas_metais',
  'lavatorio': 'loucas_metais',
  'pia': 'loucas_metais',
  'torneira': 'loucas_metais',
  'chuveiro': 'loucas_metais',
  'box': 'loucas_metais',
  'espelho': 'loucas_metais',

  // FinalizaçÍo
  'esquadria': 'finalizacao',
  'porta': 'finalizacao',
  'janela': 'finalizacao',
  'limpeza_final': 'finalizacao',
  'arremate': 'finalizacao',
};

/**
 * ConfiguraçÍo para geraçÍo de cronograma
 */
export interface ConfiguracaoCronograma {
  dataInicio: Date;
  complexidade: 'baixa' | 'media' | 'alta';
  horasTrabalhoDia?: number;
  diasUteisSemana?: number;
  folgas?: Date[];
  multiplicadorEquipe?: number;
  considerarCura?: boolean;
  agruparPorFase?: boolean;
  ordenarAutomatico?: boolean;
}

/**
 * Resultado da geraçÍo de cronograma
 */
export interface ResultadoCronograma {
  atividades: AtividadeCronograma[];
  resumo: {
    totalAtividades: number;
    dataInicio: Date;
    dataFim: Date;
    duracaoTotalDiasUteis: number;
    duracaoTotalDiasCorridos: number;
    equipePico: EquipePadrao;
    custoTotal?: number;
  };
  porFase: Record<FaseObra, {
    atividades: AtividadeCronograma[];
    dataInicio: Date;
    dataFim: Date;
    duracaoDias: number;
  }>;
  alertas: string[];
}

// ============================================================
// CLASSE PRINCIPAL
// ============================================================

export class CronogramaGeracaoService {
  /**
   * Gera cronograma a partir de lista de quantitativos
   */
  gerarCronograma(
    itens: ItemQuantitativo[],
    config: ConfiguracaoCronograma
  ): ResultadoCronograma {
    const alertas: string[] = [];
    const atividades: AtividadeCronograma[] = [];

    // Mapear itens para atividades com produtividade
    for (let i = 0; i < itens.length; i++) {
      const item = itens[i];
      const atividade = this.criarAtividade(item, i + 1, config);

      if (atividade) {
        atividades.push(atividade);
      } else {
        alertas.push(`Item "${item.descricao}" não possui dados de produtividade. Será necessário estimar manualmente.`);
      }
    }

    // Ordenar por fase e sequência lógica
    if (config.ordenarAutomatico !== false) {
      this.ordenarPorFaseESequencia(atividades);
    }

    // Calcular datas baseado em dependências
    this.calcularDatas(atividades, config);

    // Calcular dependências entre fases
    this.definirDependencias(atividades);

    // Agrupar por fase
    const porFase = this.agruparPorFase(atividades);

    // Calcular resumo
    const resumo = this.calcularResumo(atividades, config);

    return {
      atividades,
      resumo,
      porFase,
      alertas,
    };
  }

  /**
   * Cria atividade de cronograma a partir de item de quantitativo
   */
  private criarAtividade(
    item: ItemQuantitativo,
    sequencia: number,
    config: ConfiguracaoCronograma
  ): AtividadeCronograma | null {
    // Tentar encontrar dados de produtividade
    let dadosProdutividade: DadosProdutividade | undefined;

    // 1. Tentar por código SINAPI
    if (item.codigoSINAPI) {
      dadosProdutividade = produtividadeService.buscarPorCodigoSINAPI(item.codigoSINAPI);
    }

    // 2. Tentar por categoria/descriçÍo
    if (!dadosProdutividade && item.categoriaServico) {
      const resultados = produtividadeService.buscarPorServico(item.categoriaServico);
      if (resultados.length > 0) {
        dadosProdutividade = resultados[0];
      }
    }

    // 3. Tentar por descriçÍo do item
    if (!dadosProdutividade) {
      const resultados = produtividadeService.buscarPorServico(item.descricao);
      if (resultados.length > 0) {
        dadosProdutividade = resultados[0];
      }
    }

    // Se não encontrou, retornar null
    if (!dadosProdutividade) {
      return null;
    }

    // Calcular prazo
    const opcoes: OpcoesCalculoPrazo = {
      complexidade: config.complexidade,
      horasTrabalhoDia: config.horasTrabalhoDia,
      multiplicadorEquipe: config.multiplicadorEquipe,
      considerarCura: config.considerarCura,
    };

    const resultado = produtividadeService.calcularPrazo(
      dadosProdutividade,
      item.quantidade,
      opcoes
    );

    if (!resultado) return null;

    // Determinar fase
    const fase = this.determinarFase(item, dadosProdutividade);

    return {
      id: item.id,
      sequencia,
      nome: item.descricao,
      descricao: dadosProdutividade.servico,
      categoria: dadosProdutividade.categoria,
      fase,
      quantidade: item.quantidade,
      unidade: item.unidade,
      dataInicio: config.dataInicio,
      dataFim: config.dataInicio,
      duracao_dias_uteis: resultado.dias_trabalho,
      tempo_cura_dias: resultado.tempo_cura_adicional_dias,
      equipe: resultado.equipe_necessaria,
      dependencias: [],
      produtividade_usada: resultado.produtividade_usada,
      unidade_produtividade: resultado.unidade_produtividade,
      observacoes: resultado.observacoes,
      status: 'pendente',
      custoEstimado: item.precoTotal,
    };
  }

  /**
   * Determina a fase de obra para um item
   */
  private determinarFase(item: ItemQuantitativo, dados: DadosProdutividade): FaseObra {
    // Checar categoria do serviço
    const categoriaLower = dados.categoria.toLowerCase();
    const subcategoriaLower = (dados.subcategoria || '').toLowerCase();
    const descricaoLower = item.descricao.toLowerCase();

    // Verificar mapeamento
    for (const [termo, fase] of Object.entries(MAPEAMENTO_FASES)) {
      if (
        categoriaLower.includes(termo) ||
        subcategoriaLower.includes(termo) ||
        descricaoLower.includes(termo)
      ) {
        return fase;
      }
    }

    // Fallback baseado na categoria
    if (categoriaLower.includes('demoliçÍo') || categoriaLower.includes('remoçÍo')) {
      return 'preparacao';
    }
    if (categoriaLower.includes('elétric') || categoriaLower.includes('hidrául')) {
      return 'instalacoes';
    }
    if (categoriaLower.includes('pint') || categoriaLower.includes('piso')) {
      return 'acabamento';
    }

    return 'revestimento'; // Default
  }

  /**
   * Ordena atividades por fase e sequência lógica de obra
   */
  private ordenarPorFaseESequencia(atividades: AtividadeCronograma[]): void {
    atividades.sort((a, b) => {
      const ordemA = ORDEM_FASES.indexOf(a.fase);
      const ordemB = ORDEM_FASES.indexOf(b.fase);

      if (ordemA !== ordemB) {
        return ordemA - ordemB;
      }

      // Dentro da mesma fase, manter ordem original
      return a.sequencia - b.sequencia;
    });

    // Atualizar sequência após ordenaçÍo
    atividades.forEach((ativ, idx) => {
      ativ.sequencia = idx + 1;
    });
  }

  /**
   * Calcula datas de início e fim para cada atividade
   */
  private calcularDatas(
    atividades: AtividadeCronograma[],
    config: ConfiguracaoCronograma
  ): void {
    const diasUteisSemana = config.diasUteisSemana || 5;
    const folgas = config.folgas || [];

    let dataAtual = new Date(config.dataInicio);

    for (const atividade of atividades) {
      // Data de início é a data atual
      atividade.dataInicio = new Date(dataAtual);

      // Calcular data de fim considerando dias úteis
      const diasTotais = atividade.duracao_dias_uteis + atividade.tempo_cura_dias;
      let diasContados = 0;

      while (diasContados < diasTotais) {
        const diaSemana = dataAtual.getDay();
        const ehFimDeSemana = diaSemana === 0 || diaSemana === 6;
        const ehFolga = folgas.some(f =>
          f.getFullYear() === dataAtual.getFullYear() &&
          f.getMonth() === dataAtual.getMonth() &&
          f.getDate() === dataAtual.getDate()
        );

        // Em obra, trabalhamos 6 dias por semana
        if (!ehFimDeSemana || diasUteisSemana > 5) {
          if (!ehFolga) {
            diasContados++;
          }
        }

        if (diasContados < diasTotais) {
          dataAtual.setDate(dataAtual.getDate() + 1);
        }
      }

      atividade.dataFim = new Date(dataAtual);

      // Próxima atividade começa no dia seguinte
      dataAtual.setDate(dataAtual.getDate() + 1);
    }
  }

  /**
   * Define dependências entre atividades baseado nas fases
   */
  private definirDependencias(atividades: AtividadeCronograma[]): void {
    const atividadesPorFase = new Map<FaseObra, AtividadeCronograma[]>();

    // Agrupar por fase
    for (const atividade of atividades) {
      const lista = atividadesPorFase.get(atividade.fase) || [];
      lista.push(atividade);
      atividadesPorFase.set(atividade.fase, lista);
    }

    // Definir dependências entre fases
    for (let i = 1; i < ORDEM_FASES.length; i++) {
      const faseAtual = ORDEM_FASES[i];
      const faseAnterior = ORDEM_FASES[i - 1];

      const atividadesFaseAtual = atividadesPorFase.get(faseAtual) || [];
      const atividadesFaseAnterior = atividadesPorFase.get(faseAnterior) || [];

      if (atividadesFaseAtual.length > 0 && atividadesFaseAnterior.length > 0) {
        // Primeira atividade da fase atual depende da última da fase anterior
        const ultimaAnterior = atividadesFaseAnterior[atividadesFaseAnterior.length - 1];
        atividadesFaseAtual[0].dependencias.push(ultimaAnterior.id);
      }
    }
  }

  /**
   * Agrupa atividades por fase
   */
  private agruparPorFase(atividades: AtividadeCronograma[]): Record<FaseObra, {
    atividades: AtividadeCronograma[];
    dataInicio: Date;
    dataFim: Date;
    duracaoDias: number;
  }> {
    const resultado: Record<FaseObra, {
      atividades: AtividadeCronograma[];
      dataInicio: Date;
      dataFim: Date;
      duracaoDias: number;
    }> = {} as any;

    for (const fase of ORDEM_FASES) {
      const atividadesFase = atividades.filter(a => a.fase === fase);

      if (atividadesFase.length > 0) {
        const dataInicio = atividadesFase[0].dataInicio;
        const dataFim = atividadesFase[atividadesFase.length - 1].dataFim;
        const duracaoDias = atividadesFase.reduce(
          (acc, a) => acc + a.duracao_dias_uteis + a.tempo_cura_dias,
          0
        );

        resultado[fase] = {
          atividades: atividadesFase,
          dataInicio,
          dataFim,
          duracaoDias,
        };
      }
    }

    return resultado;
  }

  /**
   * Calcula resumo do cronograma
   */
  private calcularResumo(
    atividades: AtividadeCronograma[],
    config: ConfiguracaoCronograma
  ): ResultadoCronograma['resumo'] {
    if (atividades.length === 0) {
      return {
        totalAtividades: 0,
        dataInicio: config.dataInicio,
        dataFim: config.dataInicio,
        duracaoTotalDiasUteis: 0,
        duracaoTotalDiasCorridos: 0,
        equipePico: {},
      };
    }

    const dataInicio = atividades[0].dataInicio;
    const dataFim = atividades[atividades.length - 1].dataFim;

    const duracaoTotalDiasUteis = atividades.reduce(
      (acc, a) => acc + a.duracao_dias_uteis,
      0
    );

    const duracaoTotalDiasCorridos = Math.ceil(
      (dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    // Calcular equipe de pico (maior necessidade simultânea)
    const equipePico: EquipePadrao = {};
    for (const atividade of atividades) {
      for (const [cargo, qtd] of Object.entries(atividade.equipe)) {
        if (qtd) {
          const atual = equipePico[cargo as keyof EquipePadrao] || 0;
          equipePico[cargo as keyof EquipePadrao] = Math.max(atual, qtd);
        }
      }
    }

    const custoTotal = atividades.reduce(
      (acc, a) => acc + (a.custoEstimado || 0),
      0
    );

    return {
      totalAtividades: atividades.length,
      dataInicio,
      dataFim,
      duracaoTotalDiasUteis,
      duracaoTotalDiasCorridos,
      equipePico,
      custoTotal: custoTotal > 0 ? custoTotal : undefined,
    };
  }

  /**
   * Exporta cronograma para formato de Gantt
   */
  exportarParaGantt(cronograma: ResultadoCronograma): Array<{
    id: string;
    name: string;
    start: string;
    end: string;
    progress: number;
    dependencies: string;
    custom_class?: string;
  }> {
    return cronograma.atividades.map(atividade => ({
      id: atividade.id,
      name: atividade.nome,
      start: atividade.dataInicio.toISOString().split('T')[0],
      end: atividade.dataFim.toISOString().split('T')[0],
      progress: atividade.percentualCompleto || 0,
      dependencies: atividade.dependencias.join(', '),
      custom_class: `fase-${atividade.fase}`,
    }));
  }

  /**
   * Exporta cronograma para CSV
   */
  exportarParaCSV(cronograma: ResultadoCronograma): string {
    const headers = [
      'Seq',
      'Atividade',
      'Fase',
      'Quantidade',
      'Unidade',
      'Data Início',
      'Data Fim',
      'Dias Úteis',
      'Equipe',
      'Custo',
    ].join(';');

    const linhas = cronograma.atividades.map(a => [
      a.sequencia,
      `"${a.nome}"`,
      a.fase,
      a.quantidade,
      a.unidade,
      a.dataInicio.toLocaleDateString('pt-BR'),
      a.dataFim.toLocaleDateString('pt-BR'),
      a.duracao_dias_uteis,
      `"${formatarEquipe(a.equipe)}"`,
      a.custoEstimado?.toFixed(2) || '',
    ].join(';'));

    return [headers, ...linhas].join('\n');
  }

  /**
   * Gera texto resumo do cronograma
   */
  gerarResumoTexto(cronograma: ResultadoCronograma): string {
    const { resumo, porFase } = cronograma;

    const linhas: string[] = [
      '=== CRONOGRAMA DE OBRA ===',
      '',
      `Data Início: ${resumo.dataInicio.toLocaleDateString('pt-BR')}`,
      `Data Fim: ${resumo.dataFim.toLocaleDateString('pt-BR')}`,
      `DuraçÍo: ${formatarDuracaoDias(resumo.duracaoTotalDiasUteis)} úteis (${resumo.duracaoTotalDiasCorridos} dias corridos)`,
      '',
      `Total de Atividades: ${resumo.totalAtividades}`,
      `Equipe de Pico: ${formatarEquipe(resumo.equipePico)}`,
      resumo.custoTotal ? `Custo Estimado: R$ ${resumo.custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '',
      '',
      '=== FASES ===',
    ];

    for (const fase of ORDEM_FASES) {
      if (porFase[fase]) {
        const info = porFase[fase];
        linhas.push(
          '',
          `📌 ${fase.toUpperCase().replace('_', ' ')}`,
          `   ${info.atividades.length} atividade(s)`,
          `   ${info.dataInicio.toLocaleDateString('pt-BR')} - ${info.dataFim.toLocaleDateString('pt-BR')}`,
          `   ${info.duracaoDias} dias`
        );
      }
    }

    return linhas.filter(l => l !== '').join('\n');
  }
}

// ============================================================
// INSTÂNCIA GLOBAL
// ============================================================

export const cronogramaService = new CronogramaGeracaoService();

// ============================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================

/**
 * Obtém label da fase para exibiçÍo
 */
export function getLabelFase(fase: FaseObra): string {
  const labels: Record<FaseObra, string> = {
    preparacao: 'PreparaçÍo',
    estrutura: 'Estrutura',
    instalacoes: 'Instalações',
    revestimento: 'Revestimento',
    acabamento: 'Acabamento',
    loucas_metais: 'Louças e Metais',
    finalizacao: 'FinalizaçÍo',
  };
  return labels[fase] || fase;
}

/**
 * Obtém cor da fase para visualizaçÍo
 */
export function getCorFase(fase: FaseObra): string {
  const cores: Record<FaseObra, string> = {
    preparacao: '#EF4444',    // Vermelho
    estrutura: '#F97316',     // Laranja
    instalacoes: '#EAB308',   // Amarelo
    revestimento: '#22C55E',  // Verde
    acabamento: '#3B82F6',    // Azul
    loucas_metais: '#8B5CF6', // Roxo
    finalizacao: '#EC4899',   // Rosa
  };
  return cores[fase] || '#6B7280';
}

/**
 * Calcula data fim adicionando dias úteis
 */
export function adicionarDiasUteis(
  dataInicio: Date,
  diasUteis: number,
  diasUteisSemana = 6
): Date {
  const data = new Date(dataInicio);
  let diasContados = 0;

  while (diasContados < diasUteis) {
    data.setDate(data.getDate() + 1);
    const diaSemana = data.getDay();

    // Domingo = 0, Sábado = 6
    if (diasUteisSemana >= 6) {
      // Trabalha sábado
      if (diaSemana !== 0) diasContados++;
    } else {
      // não trabalha fim de semana
      if (diaSemana !== 0 && diaSemana !== 6) diasContados++;
    }
  }

  return data;
}


