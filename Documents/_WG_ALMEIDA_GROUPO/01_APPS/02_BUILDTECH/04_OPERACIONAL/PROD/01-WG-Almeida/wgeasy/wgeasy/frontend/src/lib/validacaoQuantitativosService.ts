/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// SERVIÇO DE VALIDAÇÍO CRUZADA DE QUANTITATIVOS
// Sistema WG Easy - Grupo WG Almeida
// ============================================================
// Este serviço integra todos os módulos de inteligência para
// validar quantitativos entre análise de planta, memorial e
// cálculos automáticos baseados em regras
// ============================================================

import {
  EngineCalculoInteligente,
  MatchInteligenteMemorialPlanta,
  ContextoAmbiente,
  buscarIdentidadePorId,
} from './projetoInteligenciaUnificada';

import type { ProjetoAnalisado, AmbienteExtraido, ServicoExtraido } from './projetoAnaliseAI';

// ============================================================
// TIPOS
// ============================================================

/**
 * Fonte de dados para validaçÍo
 */
export type FonteDados = 'planta' | 'memorial' | 'calculo_automatico' | 'manual';

/**
 * Item de quantitativo unificado
 */
export interface ItemQuantitativo {
  id: string;
  categoria: string;
  subcategoria?: string;
  descricao: string;
  ambiente?: string;
  unidade: string;
  quantidades: {
    fonte: FonteDados;
    valor: number;
    confianca: number;
  }[];
  quantidadeFinal?: number;
  status: 'validado' | 'divergente' | 'pendente' | 'novo';
  observacoes?: string[];
}

/**
 * Resultado da validaçÍo cruzada
 */
export interface ResultadoValidacaoCruzada {
  itens: ItemQuantitativo[];
  resumo: {
    totalItens: number;
    validados: number;
    divergentes: number;
    pendentes: number;
    novos: number;
    confiancaMedia: number;
  };
  alertas: AlertaValidacao[];
  sugestoes: string[];
  pontuacaoGeral: number; // 0-100
}

/**
 * Alerta de validaçÍo
 */
export interface AlertaValidacao {
  tipo: 'erro' | 'aviso' | 'info';
  categoria: string;
  mensagem: string;
  itemRelacionado?: string;
  sugestaoCorrecao?: string;
}

// ============================================================
// CLASSE PRINCIPAL
// ============================================================

/**
 * Serviço de ValidaçÍo Cruzada de Quantitativos
 */
export class ValidacaoQuantitativosService {
  private readonly engineCalculo: EngineCalculoInteligente;
  private readonly matchInteligente: MatchInteligenteMemorialPlanta;

  constructor() {
    this.engineCalculo = new EngineCalculoInteligente();
    this.matchInteligente = new MatchInteligenteMemorialPlanta();
  }

  /**
   * Executar validaçÍo cruzada completa
   */
  async executarValidacaoCompleta(
    dadosPlanta?: ProjetoAnalisado,
    textoMemorial?: string,
    ambientesContexto?: ContextoAmbiente[]
  ): Promise<ResultadoValidacaoCruzada> {
    const itens: ItemQuantitativo[] = [];
    const alertas: AlertaValidacao[] = [];
    const sugestoes: string[] = [];

    // 1. Processar dados da planta
    if (dadosPlanta) {
      const itensPlanta = this.extrairItensPlanta(dadosPlanta);
      this.mesclarItens(itens, itensPlanta, 'planta');
    }

    // 2. Processar cálculos automáticos se tivermos contexto de ambientes
    const contextosAmbiente = ambientesContexto || this.converterAmbientesParaContexto(dadosPlanta?.ambientes || []);
    if (contextosAmbiente.length > 0) {
      const itensCalculados = this.calcularQuantitativosAutomaticos(contextosAmbiente);
      this.mesclarItens(itens, itensCalculados, 'calculo_automatico');
    }

    // 3. Processar memorial se fornecido
    if (textoMemorial && dadosPlanta) {
      const itensMemorial = this.extrairItensMemorial(dadosPlanta.servicos || []);
      this.mesclarItens(itens, itensMemorial, 'memorial');
    }

    // 4. Validar e detectar divergências
    this.validarItens(itens, alertas, sugestoes);

    // 5. Calcular resumo
    const resumo = this.calcularResumo(itens);

    return {
      itens,
      resumo,
      alertas,
      sugestoes,
      pontuacaoGeral: this.calcularPontuacaoGeral(resumo, alertas),
    };
  }

  /**
   * Extrair itens da análise de planta
   */
  private extrairItensPlanta(dados: ProjetoAnalisado): ItemQuantitativo[] {
    const itens: ItemQuantitativo[] = [];

    // Processar elementos (portas, janelas, tomadas, etc.)
    for (const elemento of dados.elementos || []) {
      const identidade = this.engineCalculo.buscarPorTexto(elemento.tipo);

      itens.push({
        id: `planta_${elemento.tipo}_${elemento.ambiente || 'geral'}`,
        categoria: identidade?.categoria || 'arquitetonico',
        subcategoria: identidade?.subcategoria || elemento.tipo,
        descricao: elemento.descricao || `${elemento.tipo} - ${elemento.ambiente || 'geral'}`,
        ambiente: elemento.ambiente,
        unidade: identidade?.unidadePadrao || 'un',
        quantidades: [{
          fonte: 'planta',
          valor: elemento.quantidade,
          confianca: 85,
        }],
        status: 'pendente',
      });
    }

    // Processar acabamentos
    for (const acabamento of dados.acabamentos || []) {
      itens.push({
        id: `planta_${acabamento.tipo}_${acabamento.ambiente || 'geral'}`,
        categoria: 'acabamento',
        subcategoria: acabamento.tipo,
        descricao: acabamento.descricao || `${acabamento.tipo} - ${acabamento.ambiente || 'geral'}`,
        ambiente: acabamento.ambiente,
        unidade: acabamento.area ? 'm2' : acabamento.metragem_linear ? 'ml' : 'un',
        quantidades: [{
          fonte: 'planta',
          valor: acabamento.area || acabamento.metragem_linear || acabamento.quantidade || 0,
          confianca: 80,
        }],
        status: 'pendente',
      });
    }

    return itens;
  }

  /**
   * Extrair itens do memorial (serviços)
   */
  private extrairItensMemorial(servicos: ServicoExtraido[]): ItemQuantitativo[] {
    return servicos.map((servico) => ({
      id: `memorial_${servico.categoria}_${servico.tipo}_${servico.ambiente || 'geral'}`,
      categoria: servico.categoria,
      subcategoria: servico.tipo,
      descricao: servico.descricao,
      ambiente: servico.ambiente,
      unidade: servico.unidade,
      quantidades: [{
        fonte: 'memorial' as FonteDados,
        valor: servico.quantidade || servico.area || servico.metragem_linear || 0,
        confianca: 75,
      }],
      status: 'pendente' as const,
    }));
  }

  /**
   * Calcular quantitativos automáticos baseado em regras
   */
  private calcularQuantitativosAutomaticos(ambientes: ContextoAmbiente[]): ItemQuantitativo[] {
    const itens: ItemQuantitativo[] = [];

    for (const ambiente of ambientes) {
      const resultados = this.engineCalculo.calcularParaAmbiente(ambiente);

      for (const resultado of resultados) {
        const identidade = buscarIdentidadePorId(resultado.elementoId);

        itens.push({
          id: `calc_${resultado.elementoId}_${ambiente.nome}`,
          categoria: identidade?.categoria || 'geral',
          subcategoria: identidade?.subcategoria,
          descricao: resultado.elementoNome,
          ambiente: ambiente.nome,
          unidade: resultado.unidade,
          quantidades: [{
            fonte: 'calculo_automatico',
            valor: resultado.quantidade,
            confianca: resultado.confianca,
          }],
          status: 'pendente',
        });
      }
    }

    return itens;
  }

  /**
   * Mesclar itens de diferentes fontes
   */
  private mesclarItens(
    listaBase: ItemQuantitativo[],
    novosItens: ItemQuantitativo[],
    fonte: FonteDados
  ): void {
    for (const novoItem of novosItens) {
      // Procurar item existente com mesma categoria, subcategoria e ambiente
      const itemExistente = listaBase.find(
        (item) =>
          item.categoria === novoItem.categoria &&
          item.subcategoria === novoItem.subcategoria &&
          item.ambiente === novoItem.ambiente
      );

      if (itemExistente) {
        // Adicionar quantidade desta fonte
        itemExistente.quantidades.push(...novoItem.quantidades);
      } else {
        // Adicionar novo item
        listaBase.push(novoItem);
      }
    }
  }

  /**
   * Validar itens e detectar divergências
   */
  private validarItens(
    itens: ItemQuantitativo[],
    alertas: AlertaValidacao[],
    sugestoes: string[]
  ): void {
    for (const item of itens) {
      const qtds = item.quantidades;

      if (qtds.length === 0) {
        item.status = 'pendente';
        continue;
      }

      if (qtds.length === 1) {
        // Apenas uma fonte - considerar válido mas com aviso
        item.status = 'validado';
        item.quantidadeFinal = qtds[0].valor;

        if (qtds[0].fonte === 'calculo_automatico') {
          sugestoes.push(
            `"${item.descricao}" em ${item.ambiente}: quantidade estimada (${qtds[0].valor} ${item.unidade}). Recomenda-se validar com projeto.`
          );
        }
        continue;
      }

      // Múltiplas fontes - verificar consistência
      const valores = qtds.map((q) => q.valor).filter((v) => v > 0);
      if (valores.length === 0) {
        item.status = 'pendente';
        continue;
      }

      const media = valores.reduce((a, b) => a + b, 0) / valores.length;
      const max = Math.max(...valores);
      const min = Math.min(...valores);
      const variacaoPercentual = ((max - min) / media) * 100;

      if (variacaoPercentual <= 15) {
        // VariaçÍo aceitável - usar valor mais confiável
        item.status = 'validado';
        const maisConfiavel = qtds.reduce((a, b) => (a.confianca > b.confianca ? a : b));
        item.quantidadeFinal = maisConfiavel.valor;
      } else if (variacaoPercentual <= 30) {
        // VariaçÍo moderada - validado com aviso
        item.status = 'validado';
        item.quantidadeFinal = Math.max(...valores); // Usar maior para segurança
        alertas.push({
          tipo: 'aviso',
          categoria: item.categoria,
          mensagem: `"${item.descricao}" tem variaçÍo de ${variacaoPercentual.toFixed(0)}% entre fontes`,
          itemRelacionado: item.id,
          sugestaoCorrecao: `Considerar ${Math.max(...valores)} ${item.unidade} (valor mais conservador)`,
        });
      } else {
        // VariaçÍo alta - divergente
        item.status = 'divergente';
        item.quantidadeFinal = Math.max(...valores);
        alertas.push({
          tipo: 'erro',
          categoria: item.categoria,
          mensagem: `DIVERGÊNCIA: "${item.descricao}" - variaçÍo de ${variacaoPercentual.toFixed(0)}%`,
          itemRelacionado: item.id,
          sugestaoCorrecao: `Verificar: ${qtds.map((q) => `${q.fonte}=${q.valor}`).join(', ')}`,
        });
      }
    }

    // Verificar itens faltantes por categoria
    const categorias = [...new Set(itens.map((i) => i.categoria))];
    for (const categoria of categorias) {
      const itensCategoria = itens.filter((i) => i.categoria === categoria);
      if (itensCategoria.length === 0) {
        alertas.push({
          tipo: 'info',
          categoria,
          mensagem: `Nenhum item de "${categoria}" identificado. Verifique se o projeto contempla esta categoria.`,
        });
      }
    }
  }

  /**
   * Calcular resumo da validaçÍo
   */
  private calcularResumo(itens: ItemQuantitativo[]): ResultadoValidacaoCruzada['resumo'] {
    const validados = itens.filter((i) => i.status === 'validado').length;
    const divergentes = itens.filter((i) => i.status === 'divergente').length;
    const pendentes = itens.filter((i) => i.status === 'pendente').length;
    const novos = itens.filter((i) => i.status === 'novo').length;

    const confiancaMedia =
      itens.reduce((acc, item) => {
        const maxConfianca = Math.max(...item.quantidades.map((q) => q.confianca), 0);
        return acc + maxConfianca;
      }, 0) / (itens.length || 1);

    return {
      totalItens: itens.length,
      validados,
      divergentes,
      pendentes,
      novos,
      confiancaMedia: Math.round(confiancaMedia),
    };
  }

  /**
   * Calcular pontuaçÍo geral
   */
  private calcularPontuacaoGeral(
    resumo: ResultadoValidacaoCruzada['resumo'],
    alertas: AlertaValidacao[]
  ): number {
    let pontuacao = 100;

    // Penalizar por divergências
    pontuacao -= resumo.divergentes * 10;

    // Penalizar por pendências
    pontuacao -= resumo.pendentes * 2;

    // Penalizar por alertas de erro
    const erros = alertas.filter((a) => a.tipo === 'erro').length;
    pontuacao -= erros * 5;

    // Bonificar por confiança alta
    if (resumo.confiancaMedia > 80) {
      pontuacao += 5;
    }

    return Math.max(0, Math.min(100, pontuacao));
  }

  /**
   * Converter ambientes extraídos para contexto de cálculo
   */
  private converterAmbientesParaContexto(ambientes: AmbienteExtraido[]): ContextoAmbiente[] {
    return ambientes.map((amb) => {
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
        areaParedes: perimetro * peDireito * 0.9, // 10% de vÍos estimado
        quantidadePortas: 1,
        quantidadeJanelas: amb.tipo === 'banheiro' ? 1 : 2,
        temForro: true,
        temSanca: amb.tipo === 'sala' || amb.tipo === 'quarto',
      };
    });
  }

  /**
   * Gerar relatório de validaçÍo em texto
   */
  gerarRelatorioTexto(resultado: ResultadoValidacaoCruzada): string {
    let relatorio = '';

    relatorio += '═══════════════════════════════════════════════════════════\n';
    relatorio += '           RELATÓRIO DE VALIDAÇÍO DE QUANTITATIVOS         \n';
    relatorio += '═══════════════════════════════════════════════════════════\n\n';

    relatorio += `PONTUAÇÍO GERAL: ${resultado.pontuacaoGeral}/100\n`;
    relatorio += `Confiança Média: ${resultado.resumo.confiancaMedia}%\n\n`;

    relatorio += '┌─────────────────────────────────────────────────────────┐\n';
    relatorio += '│ RESUMO                                                   │\n';
    relatorio += '├─────────────────────────────────────────────────────────┤\n';
    relatorio += `│ Total de Itens: ${resultado.resumo.totalItens.toString().padEnd(40)}│\n`;
    relatorio += `│ ✅ Validados: ${resultado.resumo.validados.toString().padEnd(42)}│\n`;
    relatorio += `│ ⚠️ Divergentes: ${resultado.resumo.divergentes.toString().padEnd(40)}│\n`;
    relatorio += `│ ⏳ Pendentes: ${resultado.resumo.pendentes.toString().padEnd(42)}│\n`;
    relatorio += '└─────────────────────────────────────────────────────────┘\n\n';

    if (resultado.alertas.length > 0) {
      relatorio += '┌─────────────────────────────────────────────────────────┐\n';
      relatorio += '│ ALERTAS                                                  │\n';
      relatorio += '└─────────────────────────────────────────────────────────┘\n';

      for (const alerta of resultado.alertas) {
        const icone = alerta.tipo === 'erro' ? '❌' : alerta.tipo === 'aviso' ? '⚠️' : 'ℹ️';
        relatorio += `${icone} [${alerta.categoria.toUpperCase()}] ${alerta.mensagem}\n`;
        if (alerta.sugestaoCorrecao) {
          relatorio += `   → ${alerta.sugestaoCorrecao}\n`;
        }
      }
      relatorio += '\n';
    }

    if (resultado.sugestoes.length > 0) {
      relatorio += '┌─────────────────────────────────────────────────────────┐\n';
      relatorio += '│ SUGESTÕES                                                │\n';
      relatorio += '└─────────────────────────────────────────────────────────┘\n';

      for (const sugestao of resultado.sugestoes) {
        relatorio += `• ${sugestao}\n`;
      }
      relatorio += '\n';
    }

    relatorio += '═══════════════════════════════════════════════════════════\n';
    relatorio += `Gerado em: ${new Date().toLocaleString('pt-BR')}\n`;
    relatorio += 'Sistema WG Easy - Grupo WG Almeida\n';

    return relatorio;
  }
}

// ============================================================
// INSTÂNCIA SINGLETON
// ============================================================

export const validacaoService = new ValidacaoQuantitativosService();

// ============================================================
// EXPORTAÇÕES UTILITÁRIAS
// ============================================================

/**
 * Validar quantitativos de forma simplificada
 */
export async function validarQuantitativos(
  dadosPlanta?: ProjetoAnalisado,
  textoMemorial?: string
): Promise<ResultadoValidacaoCruzada> {
  return validacaoService.executarValidacaoCompleta(dadosPlanta, textoMemorial);
}

/**
 * Gerar relatório de validaçÍo
 */
export function gerarRelatorioValidacao(resultado: ResultadoValidacaoCruzada): string {
  return validacaoService.gerarRelatorioTexto(resultado);
}


