// ============================================================
// UTILITY: Cálculo de Dias Úteis
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

/**
 * Feriados nacionais brasileiros fixos
 * TODO: Adicionar feriados móveis (Páscoa, Carnaval, etc.)
 */
const FERIADOS_FIXOS = [
  { mes: 1, dia: 1 },   // Ano Novo
  { mes: 4, dia: 21 },  // Tiradentes
  { mes: 5, dia: 1 },   // Dia do Trabalho
  { mes: 9, dia: 7 },   // Independência
  { mes: 10, dia: 12 }, // Nossa Senhora Aparecida
  { mes: 11, dia: 2 },  // Finados
  { mes: 11, dia: 15 }, // ProclamaçÍo da República
  { mes: 12, dia: 25 }, // Natal
];

/**
 * Verifica se uma data é feriado fixo
 */
export function isFeriadoFixo(data: Date): boolean {
  const mes = data.getMonth() + 1;
  const dia = data.getDate();

  return FERIADOS_FIXOS.some(
    feriado => feriado.mes === mes && feriado.dia === dia
  );
}

/**
 * Verifica se uma data é dia útil (segunda a sexta, exceto feriados)
 */
export function isDiaUtil(data: Date): boolean {
  const diaSemana = data.getDay();

  // Sábado (6) ou Domingo (0)
  if (diaSemana === 0 || diaSemana === 6) {
    return false;
  }

  // Verifica feriado
  if (isFeriadoFixo(data)) {
    return false;
  }

  return true;
}

/**
 * Calcula o número de dias úteis entre duas datas
 */
export function calcularDiasUteis(dataInicio: Date, dataFim: Date): number {
  let diasUteis = 0;
  const dataAtual = new Date(dataInicio);

  while (dataAtual <= dataFim) {
    if (isDiaUtil(dataAtual)) {
      diasUteis++;
    }
    dataAtual.setDate(dataAtual.getDate() + 1);
  }

  return diasUteis;
}

/**
 * Adiciona dias úteis a uma data inicial
 * Retorna a data de término
 */
export function adicionarDiasUteis(dataInicio: Date, diasUteis: number): Date {
  let dataAtual = new Date(dataInicio);
  let diasContados = 0;

  while (diasContados < diasUteis) {
    dataAtual.setDate(dataAtual.getDate() + 1);

    if (isDiaUtil(dataAtual)) {
      diasContados++;
    }
  }

  return dataAtual;
}

/**
 * Calcula a data de término a partir de uma data de início e duraçÍo em dias úteis
 */
export function calcularDataTermino(
  dataInicio: Date | string,
  duracaoDiasUteis: number
): Date {
  const data = typeof dataInicio === 'string' ? new Date(dataInicio) : dataInicio;
  return adicionarDiasUteis(data, duracaoDiasUteis);
}

/**
 * Formata dias úteis para exibiçÍo
 */
export function formatarDiasUteis(dias: number): string {
  return `${dias} dia${dias !== 1 ? 's' : ''} úteis`;
}

/**
 * Calcula duraçÍo total em dias úteis para múltiplos núcleos
 * Considera que os núcleos podem ser executados em paralelo ou sequencialmente
 */
export function calcularDuracaoTotalDiasUteis(
  duracoesPorNucleo: Record<string, number>,
  emParalelo: boolean = false
): number {
  const duracoes = Object.values(duracoesPorNucleo);

  if (duracoes.length === 0) return 0;

  if (emParalelo) {
    // Se em paralelo, pega a maior duraçÍo
    return Math.max(...duracoes);
  } else {
    // Se sequencial, soma todas as durações
    return duracoes.reduce((acc, duracao) => acc + duracao, 0);
  }
}

/**
 * Verifica se uma data está atrasada em relaçÍo à data atual
 */
export function isAtrasado(dataPrevista: Date | string): boolean {
  const data = typeof dataPrevista === 'string' ? new Date(dataPrevista) : dataPrevista;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0); // Zera as horas para comparar apenas datas

  return data < hoje;
}

/**
 * Calcula quantos dias úteis faltam para uma data
 */
export function calcularDiasUteisRestantes(dataPrevista: Date | string): number {
  const data = typeof dataPrevista === 'string' ? new Date(dataPrevista) : dataPrevista;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  if (data <= hoje) return 0;

  return calcularDiasUteis(hoje, data);
}

/**
 * Formata período em dias úteis
 */
export function formatarPeriodoDiasUteis(
  dataInicio: Date | string,
  dataFim: Date | string
): string {
  const inicio = typeof dataInicio === 'string' ? new Date(dataInicio) : dataInicio;
  const fim = typeof dataFim === 'string' ? new Date(dataFim) : dataFim;

  const dias = calcularDiasUteis(inicio, fim);

  const inicioFormatado = inicio.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const fimFormatado = fim.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return `${inicioFormatado} a ${fimFormatado} (${formatarDiasUteis(dias)})`;
}

/**
 * Retorna o próximo dia útil após uma data
 */
export function proximoDiaUtil(data: Date): Date {
  const proximaData = new Date(data);
  proximaData.setDate(proximaData.getDate() + 1);

  while (!isDiaUtil(proximaData)) {
    proximaData.setDate(proximaData.getDate() + 1);
  }

  return proximaData;
}

/**
 * Retorna o dia útil anterior a uma data
 */
export function diaUtilAnterior(data: Date): Date {
  const dataAnterior = new Date(data);
  dataAnterior.setDate(dataAnterior.getDate() - 1);

  while (!isDiaUtil(dataAnterior)) {
    dataAnterior.setDate(dataAnterior.getDate() - 1);
  }

  return dataAnterior;
}

/**
 * Ajusta uma data para o próximo dia útil se for fim de semana/feriado
 */
export function ajustarParaDiaUtil(data: Date): Date {
  if (isDiaUtil(data)) {
    return data;
  }

  return proximoDiaUtil(data);
}

/**
 * Calcula um cronograma de etapas baseado em dias úteis
 */
export interface EtapaCronograma {
  nome: string;
  duracaoDiasUteis: number;
  dataInicio: Date;
  dataFim: Date;
}

export function calcularCronogramaEtapas(
  dataInicioGeral: Date,
  etapas: Array<{ nome: string; duracaoDiasUteis: number }>
): EtapaCronograma[] {
  const cronograma: EtapaCronograma[] = [];
  let dataInicioEtapa = new Date(dataInicioGeral);

  etapas.forEach(etapa => {
    const dataFimEtapa = adicionarDiasUteis(dataInicioEtapa, etapa.duracaoDiasUteis);

    cronograma.push({
      nome: etapa.nome,
      duracaoDiasUteis: etapa.duracaoDiasUteis,
      dataInicio: new Date(dataInicioEtapa),
      dataFim: dataFimEtapa,
    });

    // Próxima etapa começa no dia seguinte ao término desta
    dataInicioEtapa = proximoDiaUtil(dataFimEtapa);
  });

  return cronograma;
}

/**
 * Formata data para input do tipo date (YYYY-MM-DD)
 */
export function formatarParaInputDate(data: Date | string): string {
  const d = typeof data === 'string' ? new Date(data) : data;
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');

  return `${ano}-${mes}-${dia}`;
}

/**
 * Converte string de input date para Date
 */
export function parseInputDate(dateString: string): Date {
  return new Date(dateString + 'T00:00:00');
}

