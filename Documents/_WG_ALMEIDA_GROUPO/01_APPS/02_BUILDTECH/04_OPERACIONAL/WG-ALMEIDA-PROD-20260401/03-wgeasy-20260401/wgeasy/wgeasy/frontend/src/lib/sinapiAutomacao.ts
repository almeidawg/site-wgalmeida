// ============================================================
// AUTOMAÇÍO SINAPI - EXPORTAÇÍO CENTRAL
// Sistema WG Easy - Grupo WG Almeida
// Reexporta todos os serviços de automaçÍo SINAPI
// ============================================================

// Serviço de IntegraçÍo SINAPI (busca, importaçÍo, histórico)
export {
  sinapiService,
  type ItemSINAPI,
  type ComposicaoAnaliticaSINAPI,
  type FiltrosBuscaSINAPI,
  type HistoricoAtualizacaoSINAPI,
  type ResultadoImportacaoSINAPI,
  type EstadoBrasil,
  type TipoItemSINAPI,
  type TipoDesoneracao,
  SINAPI_CODIGOS_REFORMA,
  formatarCodigoSINAPI,
  validarCodigoSINAPI,
  getURLPlanilhaSINAPI,
} from './sinapiIntegracaoService';

// Serviço de Produtividade SINAPI (m²/dia, ml/dia, equipe)
export {
  produtividadeService,
  formatarDuracaoDias,
  formatarEquipe,
  type DadosProdutividade,
  type EquipePadrao,
  type ResultadoCalculoPrazo,
  type OpcoesCalculoPrazo,
  type UnidadeProdutividade,
  PRODUTIVIDADE_SINAPI,
} from './sinapiProdutividadeService';

// Serviço de SincronizaçÍo Pricelist-SINAPI
export {
  pricelistSinapiSyncService,
  obterEstatisticasCoberturaSINAPI,
  type MatchSINAPI,
  type ResultadoSincronizacao,
  type ConfiguracaoSync,
} from './pricelistSinapiSyncService';

// Serviço de GeraçÍo de Cronograma
export {
  cronogramaService,
  getLabelFase,
  getCorFase,
  adicionarDiasUteis,
  type ItemQuantitativo,
  type AtividadeCronograma,
  type FaseObra,
  type ConfiguracaoCronograma,
  type ResultadoCronograma,
} from './cronogramaGeracaoService';

// ============================================================
// FUNÇÕES UTILITÁRIAS COMBINADAS
// ============================================================

import { produtividadeService } from './sinapiProdutividadeService';
import { cronogramaService, type ItemQuantitativo, type ConfiguracaoCronograma } from './cronogramaGeracaoService';
import { pricelistSinapiSyncService, type ConfiguracaoSync } from './pricelistSinapiSyncService';

/**
 * Gera cronograma a partir de itens de orçamento
 * FunçÍo de conveniência que combina os serviços
 */
export async function gerarCronogramaDeOrcamento(
  itensOrcamento: Array<{
    id: string;
    nome: string;
    unidade: string;
    quantidade: number;
    codigoSINAPI?: string;
    categoria?: string;
    preco?: number;
  }>,
  dataInicio: Date,
  complexidade: 'baixa' | 'media' | 'alta' = 'media'
) {
  // Converter itens do orçamento para o formato esperado
  const itensQuantitativo: ItemQuantitativo[] = itensOrcamento.map(item => ({
    id: item.id,
    descricao: item.nome,
    unidade: item.unidade,
    quantidade: item.quantidade,
    codigoSINAPI: item.codigoSINAPI,
    categoriaServico: item.categoria,
    precoTotal: item.preco ? item.preco * item.quantidade : undefined,
  }));

  // ConfiguraçÍo do cronograma
  const config: ConfiguracaoCronograma = {
    dataInicio,
    complexidade,
    diasUteisSemana: 6,
    considerarCura: true,
    agruparPorFase: true,
    ordenarAutomatico: true,
  };

  return cronogramaService.gerarCronograma(itensQuantitativo, config);
}

/**
 * Calcula prazo estimado para uma lista de serviços
 */
export function calcularPrazoTotal(
  servicos: Array<{ nome: string; quantidade: number }>,
  complexidade: 'baixa' | 'media' | 'alta' = 'media'
) {
  const { resultados, prazoTotalSequencial, prazoTotalParalelo, equipeConsolidada } =
    produtividadeService.calcularPrazosMultiplos(
      servicos.map(s => ({ servico: s.nome, quantidade: s.quantidade })),
      { complexidade }
    );

  return {
    servicos: resultados,
    prazoSequencial: prazoTotalSequencial,
    prazoParalelo: prazoTotalParalelo,
    equipeNecessaria: equipeConsolidada,
    resumo: `Prazo estimado: ${prazoTotalSequencial} dias úteis (execuçÍo sequencial)`,
  };
}

/**
 * Analisa cobertura SINAPI do pricelist
 */
export async function analisarCoberturaSINAPI(estado: 'SP' | 'RJ' | 'MG' = 'SP') {
  const config: ConfiguracaoSync = {
    estado,
    limiarDiferencaPreco: 0.05,
    incluirSemCodigo: true,
  };

  const resultado = await pricelistSinapiSyncService.analisarSincronizacao(config);

  return {
    ...resultado,
    percentualCobertura: resultado.totalAnalisado > 0
      ? ((resultado.comMatchExato + resultado.comMatchAproximado) / resultado.totalAnalisado) * 100
      : 0,
  };
}

/**
 * Busca serviço de produtividade mais adequado para um item
 */
export function buscarProdutividadeParaItem(descricao: string, codigoSINAPI?: string) {
  // Tentar por código SINAPI primeiro
  if (codigoSINAPI) {
    const porCodigo = produtividadeService.buscarPorCodigoSINAPI(codigoSINAPI);
    if (porCodigo) return porCodigo;
  }

  // Tentar por descriçÍo
  const porDescricao = produtividadeService.buscarPorServico(descricao);
  if (porDescricao.length > 0) return porDescricao[0];

  return null;
}

