// ============================================================
// INTELIGÊNCIA UNIFICADA - MÓDULO CENTRAL
// Sistema WG Easy - Grupo WG Almeida
// ============================================================
// Este é o ponto de entrada unificado para todo o sistema de
// inteligência aplicada à análise de projetos arquitetônicos
// ============================================================

// ============================================================
// RE-EXPORTAÇÕES DOS MÓDULOS
// ============================================================

// Sistema de Identidades e Engine de Cálculo
export {
  // Tipos
  type IdentidadeElemento,
  type SimboloVisual,
  type RegraCalculo,
  type ContextoAmbiente,
  type ResultadoCalculo,
  type ItemMemorial,
  type ResultadoMatch,

  // Classes
  EngineCalculoInteligente,
  MatchInteligenteMemorialPlanta,

  // Instâncias globais
  engineCalculo,
  matchInteligente,

  // Bibliotecas de identidades
  IDENTIDADES_ELETRICO,
  IDENTIDADES_HIDRAULICO,
  IDENTIDADES_AUTOMACAO,
  IDENTIDADES_ARQUITETONICO,
  TODAS_IDENTIDADES,

  // Funções utilitárias
  buscarIdentidadePorId,
  listarCategorias,
  listarSubcategorias,
} from './projetoInteligenciaUnificada';
import { TODAS_IDENTIDADES } from './projetoInteligenciaUnificada';

// Prompts avançados para IA
export {
  // Prompts
  PROMPT_ELETRICO_NBR5444,
  PROMPT_HIDRAULICO,
  PROMPT_ARQUITETONICO_COMPLETO,
  PROMPT_AUTOMACAO,
  PROMPT_ANALISE_MEP_COMPLETA,

  // Tipos
  type TipoAnalise,
  type ContextoPrompt,

  // Funções
  construirPromptPersonalizado,
  construirPromptValidacaoCruzada,
} from './promptsAnaliseAvancada';

// Serviço de ValidaçÍo Cruzada
export {
  // Tipos
  type FonteDados,
  type ItemQuantitativo,
  type ResultadoValidacaoCruzada,
  type AlertaValidacao,

  // Classe
  ValidacaoQuantitativosService,

  // Instância global
  validacaoService,

  // Funções utilitárias
  validarQuantitativos,
  gerarRelatorioValidacao,
} from './validacaoQuantitativosService';

// Sistema de PrecificaçÍo Automatizada (SINAPI, BDI, Curva ABC)
export {
  // Tipos
  type FontePreco,
  type ItemComposicao,
  type ComposicaoServico,
  type ConfiguracaoBDI,
  type ItemOrcamentoPrecificado,
  type CurvaABC,
  type HistoricoPreco,

  // Classe
  PrecificacaoAutomatizadaService,

  // Instância global
  precificacaoService,

  // Configurações padrÍo de BDI
  BDI_RESIDENCIAL,
  BDI_COMERCIAL,
  BDI_REFORMA,

  // Códigos SINAPI frequentes
  CODIGOS_SINAPI_FREQUENTES,

  // Funções utilitárias
  formatarMoedaBRL,
  calcularPrecoComBDI,
} from './precificacaoAutomatizada';

// IntegraçÍo SINAPI
export {
  // Tipos
  type EstadoBrasil,
  type TipoItemSINAPI,
  type TipoDesoneracao,
  type ItemSINAPI,
  type ComposicaoAnaliticaSINAPI,
  type ResultadoImportacaoSINAPI,
  type FiltrosBuscaSINAPI,
  type HistoricoAtualizacaoSINAPI,

  // Classe
  SINAPIIntegracaoService,

  // Instância global
  sinapiService,

  // Códigos SINAPI organizados
  SINAPI_CODIGOS_REFORMA,

  // Funções utilitárias
  formatarCodigoSINAPI,
  validarCodigoSINAPI,
  getURLPlanilhaSINAPI,
} from './sinapiIntegracaoService';

// Catálogo de Produtos
export {
  // Tipos
  type ProdutoCatalogo,
  type CotacaoProduto,
  type DadosCapturadosWeb,
  type ConfiguracaoScraping,
  type ResultadoBuscaCatalogo,
  type FiltrosBuscaCatalogo,

  // Classe
  CatalogoProdutosService,

  // Instância global
  catalogoProdutosService,
} from './catalogoProdutosService';

// Tipos MEP Completos - Re-exportados de ../types/mepCompleto
// (Importar diretamente quando necessário para evitar dependência circular)

// ============================================================
// FUNÇÕES DE ALTO NÍVEL (FACHADA)
// ============================================================

import { engineCalculo, matchInteligente, ContextoAmbiente, ResultadoMatch, ItemMemorial } from './projetoInteligenciaUnificada';
import { validacaoService, ResultadoValidacaoCruzada } from './validacaoQuantitativosService';
import { construirPromptPersonalizado, TipoAnalise, ContextoPrompt } from './promptsAnaliseAvancada';
import type { ProjetoAnalisado, AmbienteExtraido } from './projetoAnaliseAI';

/**
 * Análise inteligente completa de um projeto
 * Combina todos os módulos de inteligência
 */
export async function analisarProjetoInteligente(
  dadosPlanta?: ProjetoAnalisado,
  textoMemorial?: string,
  opcoes?: {
    tipoAnalise?: TipoAnalise[];
    contexto?: ContextoPrompt;
    validarCruzado?: boolean;
  }
): Promise<{
  validacao: ResultadoValidacaoCruzada;
  promptRecomendado?: string;
  matchMemorialPlanta?: ResultadoMatch[];
  calculosAutomaticos?: Map<string, import('./projetoInteligenciaUnificada').ResultadoCalculo[]>;
}> {
  const resultado: any = {};

  // 1. Executar validaçÍo cruzada
  if (opcoes?.validarCruzado !== false) {
    resultado.validacao = await validacaoService.executarValidacaoCompleta(
      dadosPlanta,
      textoMemorial
    );
  }

  // 2. Gerar prompt recomendado se solicitado
  if (opcoes?.tipoAnalise) {
    resultado.promptRecomendado = construirPromptPersonalizado(
      opcoes.tipoAnalise,
      opcoes.contexto
    );
  }

  // 3. Executar match inteligente se tivermos memorial e ambientes
  if (textoMemorial && dadosPlanta?.ambientes?.length) {
    const itensMemorial = extrairItensDoMemorial(textoMemorial);
    const contextoAmbientes = converterParaContexto(dadosPlanta.ambientes);
    resultado.matchMemorialPlanta = matchInteligente.executarMatch(itensMemorial, contextoAmbientes);
  }

  // 4. Calcular quantitativos automáticos para cada ambiente
  if (dadosPlanta?.ambientes?.length) {
    const calculosMap = new Map<string, import('./projetoInteligenciaUnificada').ResultadoCalculo[]>();
    const contextos = converterParaContexto(dadosPlanta.ambientes);

    for (const contexto of contextos) {
      const calculos = engineCalculo.calcularParaAmbiente(contexto);
      calculosMap.set(contexto.nome, calculos);
    }

    resultado.calculosAutomaticos = calculosMap;
  }

  return resultado;
}

/**
 * Extrair itens do texto do memorial (análise simplificada)
 */
function extrairItensDoMemorial(texto: string): ItemMemorial[] {
  const itens: ItemMemorial[] = [];
  const linhas = texto.split('\n').filter(l => l.trim());

  for (const linha of linhas) {
    // Tentar identificar padrões como "- InstalaçÍo de porcelanato na cozinha"
    const match = linha.match(/[-•]\s*(.+?)(?:\s+(?:na|no|em)\s+(.+?))?(?:\s*[-:]\s*(\d+(?:[.,]\d+)?)\s*(m²|ml|un|pt)?)?$/i);

    if (match) {
      itens.push({
        texto: match[1].trim(),
        ambientes: match[2] ? [match[2].trim()] : undefined,
        quantidade: match[3] ? parseFloat(match[3].replace(',', '.')) : undefined,
        unidade: match[4] || undefined,
      });
    } else if (linha.trim().length > 10) {
      // Adicionar linha como item genérico
      itens.push({
        texto: linha.trim(),
      });
    }
  }

  return itens;
}

/**
 * Converter ambientes extraídos para contexto de cálculo
 */
function converterParaContexto(ambientes: AmbienteExtraido[]): ContextoAmbiente[] {
  return ambientes.map(amb => {
    const area = amb.area || (amb.largura && amb.comprimento ? amb.largura * amb.comprimento : 0);
    const largura = amb.largura || Math.sqrt(area);
    const comprimento = amb.comprimento || Math.sqrt(area);
    const peDireito = amb.pe_direito || 2.7;
    const perimetro = 2 * (largura + comprimento);

    return {
      nome: amb.nome,
      tipo: amb.tipo || 'outro',
      area,
      perimetro,
      peDireito,
      largura,
      comprimento,
      areaParedes: perimetro * peDireito * 0.9,
      quantidadePortas: 1,
      quantidadeJanelas: amb.tipo === 'banheiro' || amb.tipo === 'lavabo' ? 1 : 2,
      temForro: true,
      temSanca: amb.tipo === 'sala' || amb.tipo === 'quarto' || amb.tipo === 'suite',
    };
  });
}

/**
 * Gerar relatório completo de análise
 */
export function gerarRelatorioCompleto(
  validacao: ResultadoValidacaoCruzada,
  calculosAutomaticos?: Map<string, import('./projetoInteligenciaUnificada').ResultadoCalculo[]>
): string {
  let relatorio = validacaoService.gerarRelatorioTexto(validacao);

  if (calculosAutomaticos && calculosAutomaticos.size > 0) {
    relatorio += '\n\n';
    relatorio += '═══════════════════════════════════════════════════════════\n';
    relatorio += '          QUANTITATIVOS CALCULADOS AUTOMATICAMENTE         \n';
    relatorio += '═══════════════════════════════════════════════════════════\n\n';

    for (const [ambiente, calculos] of calculosAutomaticos) {
      relatorio += `📍 ${ambiente.toUpperCase()}\n`;
      relatorio += '─'.repeat(50) + '\n';

      for (const calc of calculos) {
        relatorio += `  • ${calc.elementoNome}: ${calc.quantidade} ${calc.unidade} (confiança: ${calc.confianca}%)\n`;
      }
      relatorio += '\n';
    }
  }

  return relatorio;
}

// ============================================================
// CONSTANTES ÚTEIS
// ============================================================

/**
 * Categorias disponíveis no sistema
 */
export const CATEGORIAS_SISTEMA = {
  eletrico: {
    nome: 'Elétrico',
    subcategorias: ['tomada', 'iluminacao', 'interruptor', 'infraestrutura'],
  },
  hidraulico: {
    nome: 'Hidráulico',
    subcategorias: ['agua_fria', 'agua_quente', 'esgoto', 'gas', 'tubulacao', 'ralo'],
  },
  automacao: {
    nome: 'AutomaçÍo',
    subcategorias: ['acesso', 'iluminacao', 'sensor', 'cortina'],
  },
  arquitetonico: {
    nome: 'Arquitetônico',
    subcategorias: ['porta', 'janela', 'vao'],
  },
  acabamento: {
    nome: 'Acabamento',
    subcategorias: ['piso', 'parede', 'teto', 'rodape', 'forro'],
  },
  climatizacao: {
    nome: 'ClimatizaçÍo',
    subcategorias: ['ar_condicionado', 'ventilacao', 'exaustao'],
  },
};

/**
 * VersÍo do sistema de inteligência
 */
export const VERSAO_INTELIGENCIA = '2.0.0';

/**
 * Metadados do sistema
 */
export const METADATA_SISTEMA = {
  versao: VERSAO_INTELIGENCIA,
  dataAtualizacao: '2026-01-16',
  totalIdentidades: TODAS_IDENTIDADES.length,
  categorias: Object.keys(CATEGORIAS_SISTEMA),
  modulos: [
    'projetoInteligenciaUnificada',   // Identidades e cálculo automático
    'promptsAnaliseAvancada',          // Prompts IA para análise MEP
    'validacaoQuantitativosService',   // ValidaçÍo cruzada
    'precificacaoAutomatizada',        // BDI e Curva ABC
    'sinapiIntegracaoService',         // IntegraçÍo SINAPI
    'catalogoProdutosService',         // Catálogo com captura de preços
  ],
  funcionalidades: {
    analiseIA: true,
    quantitativosAutomaticos: true,
    validacaoCruzada: true,
    integracaoSINAPI: true,
    calculoBDI: true,
    curvaABC: true,
    capturaPrecosWeb: true,
  },
};

