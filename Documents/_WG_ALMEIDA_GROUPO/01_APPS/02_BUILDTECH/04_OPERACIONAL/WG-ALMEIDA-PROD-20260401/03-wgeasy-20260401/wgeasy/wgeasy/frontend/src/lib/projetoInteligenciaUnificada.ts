// ============================================================
// SISTEMA DE INTELIGÊNCIA UNIFICADA - Análise de Projetos
// WG Easy - Grupo WG Almeida
// ============================================================
// Este módulo centraliza toda a inteligência aplicada ao sistema
// de análise de projetos, incluindo:
// - Identidades de elementos (padrões de reconhecimento)
// - Regras de cálculo automático
// - ValidaçÍo cruzada
// - Match inteligente Memorial × Planta
// ============================================================

// ============================================================
// PARTE 1: IDENTIDADES DE ELEMENTOS - SÍMBOLOS E PADRÕES
// ============================================================

import { evaluate as mathEvaluate } from "mathjs";

/**
 * Identidade de um elemento arquitetônico/MEP
 * Define como o sistema reconhece e processa cada tipo de elemento
 */
export interface IdentidadeElemento {
  id: string;
  categoria: 'eletrico' | 'hidraulico' | 'arquitetonico' | 'acabamento' | 'automacao' | 'climatizacao';
  subcategoria: string;
  nome: string;
  nomesTecnicos: string[]; // Variações de nome em projetos
  simbolosVisuais: SimboloVisual[];
  regrasCalculo: RegraCalculo[];
  unidadePadrao: 'un' | 'm2' | 'ml' | 'pt' | 'cx' | 'vb';
  custoMedioRegiao?: number; // R$ médio na regiÍo (SP)
  tempoExecucaoHoras?: number;
  dependencias?: string[]; // IDs de outros elementos que devem existir
  incompatibilidades?: string[]; // IDs de elementos incompatíveis
}

/**
 * Símbolo visual para reconhecimento em plantas
 * Baseado na NBR 5444 (Símbolos gráficos para instalações elétricas prediais)
 */
export interface SimboloVisual {
  descricao: string;
  formato: 'circulo' | 'retangulo' | 'triangulo' | 'linha' | 'arco' | 'especial';
  caracteristicas: string[]; // Ex: "com ponto central", "com X", "hachurado"
  variantes?: string[];
  exemploTexto?: string; // Como pode aparecer escrito
}

/**
 * Regra de cálculo automático
 */
export interface RegraCalculo {
  tipo: 'por_area' | 'por_perimetro' | 'por_ambiente' | 'por_distancia' | 'por_quantidade' | 'fixo';
  formula: string;
  parametros: Record<string, number | string>;
  aplicaEm?: string[]; // Tipos de ambiente onde se aplica
  margem?: number; // Margem de segurança (%)
}

// ============================================================
// BIBLIOTECA DE IDENTIDADES - ELÉTRICO
// ============================================================

export const IDENTIDADES_ELETRICO: IdentidadeElemento[] = [
  // TOMADAS
  {
    id: 'tomada_110v_baixa',
    categoria: 'eletrico',
    subcategoria: 'tomada',
    nome: 'Tomada 110V Baixa',
    nomesTecnicos: ['tomada 2P+T', 'tomada baixa', 'tomada comum', 'TUG'],
    simbolosVisuais: [
      {
        descricao: 'Círculo com ponto central na altura baixa (30cm)',
        formato: 'circulo',
        caracteristicas: ['ponto central', 'altura 30cm', 'linha de cota indicando altura'],
        exemploTexto: 'T 110V h=30',
      },
    ],
    regrasCalculo: [
      {
        tipo: 'por_area',
        formula: 'Math.ceil(area / 5)',
        parametros: { minimo: 1, maximoPorParede: 3 },
        aplicaEm: ['quarto', 'sala', 'escritorio'],
        margem: 20,
      },
      {
        tipo: 'fixo',
        formula: '4',
        parametros: {},
        aplicaEm: ['cozinha'],
      },
    ],
    unidadePadrao: 'pt',
    tempoExecucaoHoras: 1.5,
  },
  {
    id: 'tomada_110v_media',
    categoria: 'eletrico',
    subcategoria: 'tomada',
    nome: 'Tomada 110V Média',
    nomesTecnicos: ['tomada média', 'tomada bancada', 'TUG média'],
    simbolosVisuais: [
      {
        descricao: 'Círculo com ponto central na altura média (110cm)',
        formato: 'circulo',
        caracteristicas: ['ponto central', 'altura 110cm', 'próximo a bancadas'],
        exemploTexto: 'T 110V h=110',
      },
    ],
    regrasCalculo: [
      {
        tipo: 'por_ambiente',
        formula: '3',
        parametros: {},
        aplicaEm: ['cozinha'],
      },
      {
        tipo: 'por_ambiente',
        formula: '1',
        parametros: {},
        aplicaEm: ['banheiro', 'lavabo'],
      },
    ],
    unidadePadrao: 'pt',
    tempoExecucaoHoras: 1.5,
  },
  {
    id: 'tomada_220v',
    categoria: 'eletrico',
    subcategoria: 'tomada',
    nome: 'Tomada 220V',
    nomesTecnicos: ['tomada 220', 'tomada especial', 'TUE'],
    simbolosVisuais: [
      {
        descricao: 'Círculo com dois pontos ou indicaçÍo 220V',
        formato: 'circulo',
        caracteristicas: ['dois pontos', 'indicaçÍo 220V', 'cor diferenciada'],
        exemploTexto: 'T 220V',
      },
    ],
    regrasCalculo: [
      {
        tipo: 'por_ambiente',
        formula: '1',
        parametros: {},
        aplicaEm: ['lavanderia', 'area_servico'],
      },
    ],
    unidadePadrao: 'pt',
    tempoExecucaoHoras: 2,
    dependencias: ['circuito_220v'],
  },
  {
    id: 'tomada_ar_condicionado',
    categoria: 'eletrico',
    subcategoria: 'tomada',
    nome: 'Tomada Ar Condicionado',
    nomesTecnicos: ['ponto AC', 'tomada split', 'TUE AC', 'ponto ar condicionado'],
    simbolosVisuais: [
      {
        descricao: 'Símbolo de tomada com indicaçÍo AC ou ar',
        formato: 'circulo',
        caracteristicas: ['indicaçÍo AC', 'altura alta (220cm)', 'próximo a janela'],
        exemploTexto: 'AC 220V',
      },
    ],
    regrasCalculo: [
      {
        tipo: 'por_ambiente',
        formula: '1',
        parametros: {},
        aplicaEm: ['quarto', 'suite', 'sala', 'escritorio'],
      },
    ],
    unidadePadrao: 'pt',
    tempoExecucaoHoras: 3,
    dependencias: ['circuito_220v', 'dreno_ar'],
  },
  {
    id: 'tomada_forno',
    categoria: 'eletrico',
    subcategoria: 'tomada',
    nome: 'Tomada Forno Elétrico',
    nomesTecnicos: ['ponto forno', 'TUE forno', 'tomada forno embutido'],
    simbolosVisuais: [
      {
        descricao: 'Tomada com indicaçÍo de alta potência',
        formato: 'circulo',
        caracteristicas: ['indicaçÍo FORNO', '220V', 'circuito exclusivo'],
        exemploTexto: 'FORNO 220V',
      },
    ],
    regrasCalculo: [
      {
        tipo: 'fixo',
        formula: '1',
        parametros: {},
        aplicaEm: ['cozinha'],
      },
    ],
    unidadePadrao: 'pt',
    tempoExecucaoHoras: 2.5,
    dependencias: ['circuito_220v_exclusivo'],
  },
  {
    id: 'tomada_cooktop',
    categoria: 'eletrico',
    subcategoria: 'tomada',
    nome: 'Tomada Cooktop',
    nomesTecnicos: ['ponto cooktop', 'TUE cooktop', 'tomada induçÍo'],
    simbolosVisuais: [
      {
        descricao: 'Tomada com indicaçÍo de cooktop',
        formato: 'circulo',
        caracteristicas: ['indicaçÍo COOKTOP', '220V', 'próximo a bancada cozinha'],
        exemploTexto: 'COOKTOP 220V',
      },
    ],
    regrasCalculo: [
      {
        tipo: 'fixo',
        formula: '1',
        parametros: {},
        aplicaEm: ['cozinha'],
      },
    ],
    unidadePadrao: 'pt',
    tempoExecucaoHoras: 2.5,
    dependencias: ['circuito_220v_exclusivo'],
  },

  // ILUMINAÇÍO
  {
    id: 'ponto_luz_plafon',
    categoria: 'eletrico',
    subcategoria: 'iluminacao',
    nome: 'Ponto de Luz - Plafon',
    nomesTecnicos: ['plafon', 'luminária teto', 'ponto luz central'],
    simbolosVisuais: [
      {
        descricao: 'Círculo vazio ou com símbolo de lâmpada',
        formato: 'circulo',
        caracteristicas: ['vazio', 'no centro do ambiente', 'linha até interruptor'],
        exemploTexto: 'LUZ ou ○',
      },
    ],
    regrasCalculo: [
      {
        tipo: 'por_area',
        formula: 'Math.ceil(area / 12)',
        parametros: { minimo: 1 },
        margem: 0,
      },
    ],
    unidadePadrao: 'pt',
    tempoExecucaoHoras: 1,
  },
  {
    id: 'spot_embutido',
    categoria: 'eletrico',
    subcategoria: 'iluminacao',
    nome: 'Spot Embutido',
    nomesTecnicos: ['spot', 'dicroica', 'embutido forro', 'spot LED'],
    simbolosVisuais: [
      {
        descricao: 'Círculo pequeno, geralmente múltiplos',
        formato: 'circulo',
        caracteristicas: ['pequeno', 'em grid', 'indicaçÍo de forro'],
        exemploTexto: 'SPOT ou ●',
      },
    ],
    regrasCalculo: [
      {
        tipo: 'por_area',
        formula: 'Math.ceil(area / 2.5)',
        parametros: { minimo: 4 },
        aplicaEm: ['sala', 'cozinha', 'banheiro'],
        margem: 10,
      },
    ],
    unidadePadrao: 'pt',
    tempoExecucaoHoras: 0.5,
    dependencias: ['forro_gesso'],
  },
  {
    id: 'fita_led',
    categoria: 'eletrico',
    subcategoria: 'iluminacao',
    nome: 'Fita LED',
    nomesTecnicos: ['fita LED', 'LED linear', 'iluminaçÍo indireta', 'sanca iluminada'],
    simbolosVisuais: [
      {
        descricao: 'Linha tracejada ao longo de sanca ou móvel',
        formato: 'linha',
        caracteristicas: ['tracejada', 'ao longo de sanca', 'indicaçÍo LED'],
        exemploTexto: 'LED ---',
      },
    ],
    regrasCalculo: [
      {
        tipo: 'por_perimetro',
        formula: 'perimetro * 0.6',
        parametros: { margem: 15 },
        aplicaEm: ['sala', 'quarto', 'suite'],
      },
    ],
    unidadePadrao: 'ml',
    tempoExecucaoHoras: 0.3, // por metro
    dependencias: ['sanca_gesso', 'driver_led'],
  },
  {
    id: 'pendente',
    categoria: 'eletrico',
    subcategoria: 'iluminacao',
    nome: 'Pendente',
    nomesTecnicos: ['pendente', 'lustre', 'luminária pendente'],
    simbolosVisuais: [
      {
        descricao: 'Círculo com linha para baixo',
        formato: 'especial',
        caracteristicas: ['linha vertical descendente', 'sobre mesa/bancada'],
        exemploTexto: 'PEND ou ⎯○',
      },
    ],
    regrasCalculo: [
      {
        tipo: 'fixo',
        formula: '1',
        parametros: {},
        aplicaEm: ['sala_jantar'],
      },
      {
        tipo: 'por_ambiente',
        formula: '3',
        parametros: {},
        aplicaEm: ['cozinha'], // sobre bancada
      },
    ],
    unidadePadrao: 'pt',
    tempoExecucaoHoras: 1.5,
  },
  {
    id: 'arandela',
    categoria: 'eletrico',
    subcategoria: 'iluminacao',
    nome: 'Arandela',
    nomesTecnicos: ['arandela', 'luminária parede', 'balizador'],
    simbolosVisuais: [
      {
        descricao: 'Semicírculo na parede',
        formato: 'arco',
        caracteristicas: ['junto à parede', 'altura média/alta'],
        exemploTexto: 'ARAND ou ⌓',
      },
    ],
    regrasCalculo: [
      {
        tipo: 'por_ambiente',
        formula: '2',
        parametros: {},
        aplicaEm: ['corredor', 'hall', 'varanda'],
      },
    ],
    unidadePadrao: 'pt',
    tempoExecucaoHoras: 1,
  },

  // INTERRUPTORES
  {
    id: 'interruptor_simples',
    categoria: 'eletrico',
    subcategoria: 'interruptor',
    nome: 'Interruptor Simples',
    nomesTecnicos: ['interruptor 1 tecla', 'INT simples', 'interruptor unipolar'],
    simbolosVisuais: [
      {
        descricao: 'Círculo com traço ou X',
        formato: 'circulo',
        caracteristicas: ['com X', 'junto à porta', 'altura 110cm'],
        exemploTexto: 'INT ou ⊗',
      },
    ],
    regrasCalculo: [
      {
        tipo: 'por_ambiente',
        formula: '1',
        parametros: {},
        margem: 0,
      },
    ],
    unidadePadrao: 'pt',
    tempoExecucaoHoras: 1,
  },
  {
    id: 'interruptor_paralelo',
    categoria: 'eletrico',
    subcategoria: 'interruptor',
    nome: 'Interruptor Paralelo (Three-Way)',
    nomesTecnicos: ['paralelo', 'three-way', '3 vias', 'INT paralelo'],
    simbolosVisuais: [
      {
        descricao: 'Círculo com dois traços paralelos',
        formato: 'circulo',
        caracteristicas: ['dois traços', 'duas posições no ambiente'],
        exemploTexto: 'INT// ou ⊗//',
      },
    ],
    regrasCalculo: [
      {
        tipo: 'por_ambiente',
        formula: '2',
        parametros: {},
        aplicaEm: ['quarto', 'suite', 'sala', 'corredor'],
      },
    ],
    unidadePadrao: 'pt',
    tempoExecucaoHoras: 1.5,
  },
  {
    id: 'dimmer',
    categoria: 'eletrico',
    subcategoria: 'interruptor',
    nome: 'Dimmer',
    nomesTecnicos: ['dimmer', 'variador luz', 'interruptor dimmer'],
    simbolosVisuais: [
      {
        descricao: 'Símbolo de interruptor com indicaçÍo DIM',
        formato: 'circulo',
        caracteristicas: ['indicaçÍo DIM', 'controle intensidade'],
        exemploTexto: 'DIM',
      },
    ],
    regrasCalculo: [
      {
        tipo: 'por_ambiente',
        formula: '1',
        parametros: {},
        aplicaEm: ['sala', 'quarto', 'suite'],
      },
    ],
    unidadePadrao: 'pt',
    tempoExecucaoHoras: 1.5,
  },

  // INFRAESTRUTURA
  {
    id: 'quadro_distribuicao',
    categoria: 'eletrico',
    subcategoria: 'infraestrutura',
    nome: 'Quadro de DistribuiçÍo',
    nomesTecnicos: ['QD', 'quadro elétrico', 'quadro disjuntores', 'CQD'],
    simbolosVisuais: [
      {
        descricao: 'Retângulo com subdivisões internas',
        formato: 'retangulo',
        caracteristicas: ['subdivisões', 'indicaçÍo QD', 'próximo entrada'],
        exemploTexto: 'QD ou ▭',
      },
    ],
    regrasCalculo: [
      {
        tipo: 'fixo',
        formula: '1',
        parametros: {},
      },
    ],
    unidadePadrao: 'un',
    tempoExecucaoHoras: 8,
  },
  {
    id: 'circuito_eletrico',
    categoria: 'eletrico',
    subcategoria: 'infraestrutura',
    nome: 'Circuito Elétrico',
    nomesTecnicos: ['circuito', 'alimentaçÍo', 'ramal'],
    simbolosVisuais: [
      {
        descricao: 'Linha conectando pontos ao quadro',
        formato: 'linha',
        caracteristicas: ['linha contínua', 'número do circuito'],
        exemploTexto: 'C1, C2, C3...',
      },
    ],
    regrasCalculo: [
      {
        tipo: 'por_quantidade',
        formula: 'Math.ceil(totalPontos / 8)',
        parametros: { minimo: 6 },
        margem: 20,
      },
    ],
    unidadePadrao: 'un',
    tempoExecucaoHoras: 4,
  },
  {
    id: 'tubulacao_seca_hdmi',
    categoria: 'eletrico',
    subcategoria: 'infraestrutura',
    nome: 'TubulaçÍo Seca (HDMI/Dados)',
    nomesTecnicos: ['tubulaçÍo seca', 'infraestrutura dados', 'ponto HDMI', 'ponto TV'],
    simbolosVisuais: [
      {
        descricao: 'Linha tracejada diferenciada',
        formato: 'linha',
        caracteristicas: ['tracejada', 'indicaçÍo HDMI ou DADOS'],
        exemploTexto: 'HDMI --- ou DADOS',
      },
    ],
    regrasCalculo: [
      {
        tipo: 'por_ambiente',
        formula: '1',
        parametros: {},
        aplicaEm: ['sala', 'quarto', 'suite', 'escritorio'],
      },
    ],
    unidadePadrao: 'pt',
    tempoExecucaoHoras: 2,
  },
];

// ============================================================
// BIBLIOTECA DE IDENTIDADES - HIDRÁULICO
// ============================================================

export const IDENTIDADES_HIDRAULICO: IdentidadeElemento[] = [
  // ÁGUA FRIA
  {
    id: 'ponto_agua_fria',
    categoria: 'hidraulico',
    subcategoria: 'agua_fria',
    nome: 'Ponto de Água Fria',
    nomesTecnicos: ['AF', 'água fria', 'ponto AF', 'alimentaçÍo fria'],
    simbolosVisuais: [
      {
        descricao: 'Círculo com AF ou azul',
        formato: 'circulo',
        caracteristicas: ['cor azul', 'indicaçÍo AF'],
        exemploTexto: 'AF ou ○(azul)',
      },
    ],
    regrasCalculo: [
      {
        tipo: 'por_ambiente',
        formula: '2',
        parametros: {},
        aplicaEm: ['banheiro', 'lavabo'],
      },
      {
        tipo: 'por_ambiente',
        formula: '3',
        parametros: {},
        aplicaEm: ['cozinha'],
      },
      {
        tipo: 'por_ambiente',
        formula: '2',
        parametros: {},
        aplicaEm: ['lavanderia', 'area_servico'],
      },
    ],
    unidadePadrao: 'pt',
    tempoExecucaoHoras: 3,
  },
  {
    id: 'ponto_agua_quente',
    categoria: 'hidraulico',
    subcategoria: 'agua_quente',
    nome: 'Ponto de Água Quente',
    nomesTecnicos: ['AQ', 'água quente', 'ponto AQ', 'retorno'],
    simbolosVisuais: [
      {
        descricao: 'Círculo com AQ ou vermelho',
        formato: 'circulo',
        caracteristicas: ['cor vermelha', 'indicaçÍo AQ'],
        exemploTexto: 'AQ ou ○(verm)',
      },
    ],
    regrasCalculo: [
      {
        tipo: 'por_ambiente',
        formula: '2',
        parametros: {},
        aplicaEm: ['banheiro', 'suite'],
      },
      {
        tipo: 'por_ambiente',
        formula: '1',
        parametros: {},
        aplicaEm: ['cozinha'],
      },
    ],
    unidadePadrao: 'pt',
    tempoExecucaoHoras: 4,
    dependencias: ['aquecedor', 'pressurizador'],
  },
  {
    id: 'ponto_esgoto',
    categoria: 'hidraulico',
    subcategoria: 'esgoto',
    nome: 'Ponto de Esgoto',
    nomesTecnicos: ['ESG', 'esgoto', 'ponto esgoto', 'ralo'],
    simbolosVisuais: [
      {
        descricao: 'Quadrado ou círculo com ESG',
        formato: 'especial',
        caracteristicas: ['indicaçÍo ESG', 'cor marrom/preta'],
        exemploTexto: 'ESG ou □',
      },
    ],
    regrasCalculo: [
      {
        tipo: 'por_ambiente',
        formula: '3',
        parametros: {},
        aplicaEm: ['banheiro'],
      },
      {
        tipo: 'por_ambiente',
        formula: '2',
        parametros: {},
        aplicaEm: ['cozinha', 'lavanderia'],
      },
    ],
    unidadePadrao: 'pt',
    tempoExecucaoHoras: 4,
  },
  {
    id: 'ponto_gas',
    categoria: 'hidraulico',
    subcategoria: 'gas',
    nome: 'Ponto de Gás',
    nomesTecnicos: ['GÁS', 'ponto gás', 'GLP', 'gás natural'],
    simbolosVisuais: [
      {
        descricao: 'Triângulo ou símbolo de chama',
        formato: 'triangulo',
        caracteristicas: ['indicaçÍo GÁS', 'cor amarela'],
        exemploTexto: 'GÁS ou △',
      },
    ],
    regrasCalculo: [
      {
        tipo: 'fixo',
        formula: '1',
        parametros: {},
        aplicaEm: ['cozinha'],
      },
    ],
    unidadePadrao: 'pt',
    tempoExecucaoHoras: 4,
  },
  {
    id: 'ralo_linear',
    categoria: 'hidraulico',
    subcategoria: 'ralo',
    nome: 'Ralo Linear',
    nomesTecnicos: ['ralo linear', 'ralo oculto', 'ralo invisível'],
    simbolosVisuais: [
      {
        descricao: 'Linha com indicaçÍo de ralo',
        formato: 'linha',
        caracteristicas: ['linha grossa', 'indicaçÍo RALO LINEAR'],
        exemploTexto: 'RL ou ═══',
      },
    ],
    regrasCalculo: [
      {
        tipo: 'por_ambiente',
        formula: '1',
        parametros: {},
        aplicaEm: ['banheiro', 'lavabo'],
      },
    ],
    unidadePadrao: 'ml',
    tempoExecucaoHoras: 4,
  },

  // TUBULAÇÍO
  {
    id: 'tubulacao_ppr',
    categoria: 'hidraulico',
    subcategoria: 'tubulacao',
    nome: 'TubulaçÍo PPR (Água Quente)',
    nomesTecnicos: ['PPR', 'tubo PPR', 'tubulaçÍo termofusÍo'],
    simbolosVisuais: [
      {
        descricao: 'Linha vermelha ou indicaçÍo PPR',
        formato: 'linha',
        caracteristicas: ['cor vermelha', 'indicaçÍo PPR'],
      },
    ],
    regrasCalculo: [
      {
        tipo: 'por_distancia',
        formula: 'distanciaQuadro * 1.3',
        parametros: { margem: 30 },
      },
    ],
    unidadePadrao: 'ml',
    tempoExecucaoHoras: 0.5, // por metro
  },
  {
    id: 'tubulacao_pvc',
    categoria: 'hidraulico',
    subcategoria: 'tubulacao',
    nome: 'TubulaçÍo PVC',
    nomesTecnicos: ['PVC', 'tubo PVC', 'tubulaçÍo soldável'],
    simbolosVisuais: [
      {
        descricao: 'Linha azul ou branca',
        formato: 'linha',
        caracteristicas: ['cor azul/branca', 'indicaçÍo PVC'],
      },
    ],
    regrasCalculo: [
      {
        tipo: 'por_distancia',
        formula: 'distanciaQuadro * 1.2',
        parametros: { margem: 20 },
      },
    ],
    unidadePadrao: 'ml',
    tempoExecucaoHoras: 0.4, // por metro
  },
];

// ============================================================
// BIBLIOTECA DE IDENTIDADES - AUTOMAÇÍO
// ============================================================

export const IDENTIDADES_AUTOMACAO: IdentidadeElemento[] = [
  {
    id: 'fechadura_digital',
    categoria: 'automacao',
    subcategoria: 'acesso',
    nome: 'Fechadura Digital',
    nomesTecnicos: ['fechadura digital', 'fechadura biométrica', 'smart lock'],
    simbolosVisuais: [
      {
        descricao: 'Símbolo de porta com indicaçÍo digital',
        formato: 'especial',
        caracteristicas: ['indicaçÍo DIGITAL', 'porta de entrada'],
      },
    ],
    regrasCalculo: [
      {
        tipo: 'fixo',
        formula: '1',
        parametros: {},
      },
    ],
    unidadePadrao: 'un',
    tempoExecucaoHoras: 2,
    dependencias: ['ponto_eletrico_fechadura'],
  },
  {
    id: 'automacao_iluminacao',
    categoria: 'automacao',
    subcategoria: 'iluminacao',
    nome: 'AutomaçÍo de IluminaçÍo',
    nomesTecnicos: ['automaçÍo luz', 'cena iluminaçÍo', 'controle cenas'],
    simbolosVisuais: [
      {
        descricao: 'Símbolo de interruptor com indicaçÍo AUTO',
        formato: 'especial',
        caracteristicas: ['indicaçÍo AUTO', 'controle central'],
      },
    ],
    regrasCalculo: [
      {
        tipo: 'por_ambiente',
        formula: '1',
        parametros: {},
        aplicaEm: ['sala', 'quarto', 'suite'],
      },
    ],
    unidadePadrao: 'pt',
    tempoExecucaoHoras: 3,
    dependencias: ['central_automacao'],
  },
  {
    id: 'sensor_presenca',
    categoria: 'automacao',
    subcategoria: 'sensor',
    nome: 'Sensor de Presença',
    nomesTecnicos: ['sensor presença', 'PIR', 'detector movimento'],
    simbolosVisuais: [
      {
        descricao: 'Círculo com ondas',
        formato: 'especial',
        caracteristicas: ['ondas irradiando', 'indicaçÍo PIR'],
        exemploTexto: 'PIR ou )))●(((',
      },
    ],
    regrasCalculo: [
      {
        tipo: 'por_ambiente',
        formula: '1',
        parametros: {},
        aplicaEm: ['corredor', 'hall', 'lavabo', 'banheiro'],
      },
    ],
    unidadePadrao: 'un',
    tempoExecucaoHoras: 1,
  },
  {
    id: 'persiana_motorizada',
    categoria: 'automacao',
    subcategoria: 'cortina',
    nome: 'Persiana/Cortina Motorizada',
    nomesTecnicos: ['persiana motorizada', 'cortina motorizada', 'blackout automático'],
    simbolosVisuais: [
      {
        descricao: 'Símbolo de janela com motor',
        formato: 'especial',
        caracteristicas: ['indicaçÍo MOTOR', 'próximo a janela'],
      },
    ],
    regrasCalculo: [
      {
        tipo: 'por_ambiente',
        formula: 'quantidadeJanelas',
        parametros: {},
        aplicaEm: ['quarto', 'suite', 'sala'],
      },
    ],
    unidadePadrao: 'un',
    tempoExecucaoHoras: 3,
    dependencias: ['ponto_eletrico_cortina', 'cortineiro'],
  },
];

// ============================================================
// BIBLIOTECA DE IDENTIDADES - ARQUITETÔNICO
// ============================================================

export const IDENTIDADES_ARQUITETONICO: IdentidadeElemento[] = [
  {
    id: 'porta_comum',
    categoria: 'arquitetonico',
    subcategoria: 'porta',
    nome: 'Porta de Abrir',
    nomesTecnicos: ['porta abrir', 'porta comum', 'porta giro'],
    simbolosVisuais: [
      {
        descricao: 'Arco indicando movimento de abertura',
        formato: 'arco',
        caracteristicas: ['arco 90°', 'linha da folha'],
        exemploTexto: 'P ou ◠',
      },
    ],
    regrasCalculo: [
      {
        tipo: 'por_ambiente',
        formula: '1',
        parametros: {},
        margem: 0,
      },
    ],
    unidadePadrao: 'un',
    tempoExecucaoHoras: 4,
  },
  {
    id: 'porta_correr',
    categoria: 'arquitetonico',
    subcategoria: 'porta',
    nome: 'Porta de Correr',
    nomesTecnicos: ['porta correr', 'porta deslizante', 'porta embutida'],
    simbolosVisuais: [
      {
        descricao: 'Duas linhas paralelas com seta',
        formato: 'especial',
        caracteristicas: ['seta indicando direçÍo', 'embutimento na parede'],
        exemploTexto: 'PC ou ▷▷',
      },
    ],
    regrasCalculo: [
      {
        tipo: 'fixo',
        formula: '1',
        parametros: {},
        aplicaEm: ['suite', 'closet', 'lavabo'],
      },
    ],
    unidadePadrao: 'un',
    tempoExecucaoHoras: 6,
  },
  {
    id: 'porta_pivotante',
    categoria: 'arquitetonico',
    subcategoria: 'porta',
    nome: 'Porta Pivotante',
    nomesTecnicos: ['porta pivotante', 'porta eixo central'],
    simbolosVisuais: [
      {
        descricao: 'Porta com ponto de pivô indicado',
        formato: 'especial',
        caracteristicas: ['ponto central', 'movimento duplo'],
        exemploTexto: 'PP ou ◆',
      },
    ],
    regrasCalculo: [
      {
        tipo: 'fixo',
        formula: '1',
        parametros: {},
        aplicaEm: ['entrada'],
      },
    ],
    unidadePadrao: 'un',
    tempoExecucaoHoras: 8,
  },
  {
    id: 'janela_correr',
    categoria: 'arquitetonico',
    subcategoria: 'janela',
    nome: 'Janela de Correr',
    nomesTecnicos: ['janela correr', 'janela deslizante', 'esquadria correr'],
    simbolosVisuais: [
      {
        descricao: 'Duas linhas verticais na parede',
        formato: 'retangulo',
        caracteristicas: ['duas folhas', 'na parede externa'],
        exemploTexto: 'J ou ▭',
      },
    ],
    regrasCalculo: [
      {
        tipo: 'por_area',
        formula: 'Math.ceil(area / 6)',
        parametros: { minimo: 1 },
        aplicaEm: ['quarto', 'sala'],
      },
    ],
    unidadePadrao: 'un',
    tempoExecucaoHoras: 4,
  },
  {
    id: 'janela_maxim_ar',
    categoria: 'arquitetonico',
    subcategoria: 'janela',
    nome: 'Janela Maxim-Ar',
    nomesTecnicos: ['maxim-ar', 'basculante', 'janela banheiro'],
    simbolosVisuais: [
      {
        descricao: 'Retângulo com linha diagonal indicando abertura',
        formato: 'retangulo',
        caracteristicas: ['linha diagonal', 'geralmente pequena'],
        exemploTexto: 'JM ou ▭/',
      },
    ],
    regrasCalculo: [
      {
        tipo: 'por_ambiente',
        formula: '1',
        parametros: {},
        aplicaEm: ['banheiro', 'lavabo', 'lavanderia'],
      },
    ],
    unidadePadrao: 'un',
    tempoExecucaoHoras: 2,
  },
];

// ============================================================
// PARTE 2: ENGINE DE CÁLCULO INTELIGENTE
// ============================================================

/**
 * Contexto de um ambiente para cálculos
 */
export interface ContextoAmbiente {
  nome: string;
  tipo: string;
  area: number;
  perimetro: number;
  peDireito: number;
  largura?: number;
  comprimento?: number;
  areaParedes: number;
  quantidadePortas: number;
  quantidadeJanelas: number;
  temForro: boolean;
  temSanca: boolean;
}

/**
 * Resultado de cálculo automático
 */
export interface ResultadoCalculo {
  elementoId: string;
  elementoNome: string;
  quantidade: number;
  unidade: string;
  formula: string;
  parametrosUsados: Record<string, number>;
  confianca: number; // 0-100%
  observacoes?: string[];
}

/**
 * Engine de Cálculo Inteligente
 * Aplica regras de cálculo automaticamente baseado no contexto do ambiente
 */
export class EngineCalculoInteligente {
  private todasIdentidades: IdentidadeElemento[];

  constructor() {
    this.todasIdentidades = [
      ...IDENTIDADES_ELETRICO,
      ...IDENTIDADES_HIDRAULICO,
      ...IDENTIDADES_AUTOMACAO,
      ...IDENTIDADES_ARQUITETONICO,
    ];
  }

  /**
   * Calcular todos os elementos para um ambiente
   */
  calcularParaAmbiente(contexto: ContextoAmbiente): ResultadoCalculo[] {
    const resultados: ResultadoCalculo[] = [];

    for (const identidade of this.todasIdentidades) {
      const calculo = this.calcularElemento(identidade, contexto);
      if (calculo && calculo.quantidade > 0) {
        resultados.push(calculo);
      }
    }

    return resultados;
  }

  /**
   * Calcular quantidade de um elemento específico
   */
  private calcularElemento(
    identidade: IdentidadeElemento,
    contexto: ContextoAmbiente
  ): ResultadoCalculo | null {
    // Encontrar regra aplicável
    const regraAplicavel = identidade.regrasCalculo.find((regra) => {
      if (!regra.aplicaEm) return true; // Aplica em todos
      return regra.aplicaEm.includes(contexto.tipo);
    });

    if (!regraAplicavel) return null;

    // Executar cálculo
    const parametros: Record<string, number> = {
      area: contexto.area,
      perimetro: contexto.perimetro,
      peDireito: contexto.peDireito,
      areaParedes: contexto.areaParedes,
      quantidadePortas: contexto.quantidadePortas,
      quantidadeJanelas: contexto.quantidadeJanelas,
    };

    let quantidade = 0;
    let formula = regraAplicavel.formula;

    try {
      // Substituir variáveis na fórmula
      let formulaExec = formula;
      for (const [key, value] of Object.entries(parametros)) {
        formulaExec = formulaExec.replace(new RegExp(key, 'g'), String(value));
      }

      // Avaliar fórmula (de forma segura)
      quantidade = this.avaliarFormula(formulaExec);

      // Aplicar margem se definida
      if (regraAplicavel.margem) {
        quantidade = Math.ceil(quantidade * (1 + regraAplicavel.margem / 100));
      }

      // Aplicar mínimo se definido
      if (regraAplicavel.parametros.minimo) {
        quantidade = Math.max(quantidade, Number(regraAplicavel.parametros.minimo));
      }
    } catch (e) {
      console.warn(`Erro ao calcular ${identidade.nome}:`, e);
      return null;
    }

    return {
      elementoId: identidade.id,
      elementoNome: identidade.nome,
      quantidade: Math.round(quantidade * 100) / 100, // 2 decimais
      unidade: identidade.unidadePadrao,
      formula,
      parametrosUsados: parametros,
      confianca: this.calcularConfianca(identidade, contexto),
    };
  }

  /**
   * Avaliar fórmula matemática de forma segura
   */
  private avaliarFormula(formula: string): number {
    // Usar mathjs para avaliaçÍo segura (sem new Function)
    const formulaLimpa = formula.replace(/[^0-9+\-*/().ceil\s]/g, '');
    try {
      const result = mathEvaluate(formulaLimpa);
      return typeof result === 'number' ? result : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Calcular nível de confiança do cálculo
   */
  private calcularConfianca(
    identidade: IdentidadeElemento,
    contexto: ContextoAmbiente
  ): number {
    let confianca = 80; // Base

    // Aumenta se tem dimensões precisas
    if (contexto.largura && contexto.comprimento) {
      confianca += 10;
    }

    // Aumenta se é tipo de ambiente conhecido
    const ambientesConhecidos = ['quarto', 'sala', 'cozinha', 'banheiro', 'lavabo'];
    if (ambientesConhecidos.includes(contexto.tipo)) {
      confianca += 5;
    }

    // Diminui para elementos mais complexos
    if (['automacao', 'climatizacao'].includes(identidade.categoria)) {
      confianca -= 15;
    }

    return Math.min(100, Math.max(0, confianca));
  }

  /**
   * Buscar identidade por texto (reconhecimento de memorial)
   */
  buscarPorTexto(texto: string): IdentidadeElemento | null {
    const textoLower = texto.toLowerCase();

    for (const identidade of this.todasIdentidades) {
      // Verificar nome
      if (identidade.nome.toLowerCase().includes(textoLower)) {
        return identidade;
      }

      // Verificar nomes técnicos
      for (const nomeTecnico of identidade.nomesTecnicos) {
        if (textoLower.includes(nomeTecnico.toLowerCase())) {
          return identidade;
        }
      }
    }

    return null;
  }

  /**
   * Obter todas as identidades de uma categoria
   */
  obterPorCategoria(categoria: string): IdentidadeElemento[] {
    return this.todasIdentidades.filter((i) => i.categoria === categoria);
  }
}

// ============================================================
// PARTE 3: MATCH INTELIGENTE MEMORIAL × PLANTA
// ============================================================

/**
 * Item do memorial descritivo
 */
export interface ItemMemorial {
  texto: string;
  categoria?: string;
  ambientes?: string[];
  quantidade?: number;
  unidade?: string;
  especificacoes?: Record<string, any>;
}

/**
 * Resultado do match
 */
export interface ResultadoMatch {
  itemMemorial: ItemMemorial;
  elementoIdentificado?: IdentidadeElemento;
  quantidadeCalculada?: number;
  quantidadeMemorial?: number;
  diferencaPercentual?: number;
  status: 'match' | 'divergente' | 'sem_match' | 'novo';
  sugestao?: string;
  confianca: number;
}

/**
 * Sistema de Match Inteligente
 * Cruza informações do memorial descritivo com análise de planta
 */
export class MatchInteligenteMemorialPlanta {
  private engine: EngineCalculoInteligente;

  constructor() {
    this.engine = new EngineCalculoInteligente();
  }

  /**
   * Executar match entre memorial e dados da planta
   */
  executarMatch(
    itensMemorial: ItemMemorial[],
    ambientes: ContextoAmbiente[]
  ): ResultadoMatch[] {
    const resultados: ResultadoMatch[] = [];

    for (const item of itensMemorial) {
      const resultado = this.processarItemMemorial(item, ambientes);
      resultados.push(resultado);
    }

    return resultados;
  }

  /**
   * Processar um item do memorial
   */
  private processarItemMemorial(
    item: ItemMemorial,
    ambientes: ContextoAmbiente[]
  ): ResultadoMatch {
    // Tentar identificar o elemento pelo texto
    const elementoIdentificado = this.engine.buscarPorTexto(item.texto);

    if (!elementoIdentificado) {
      return {
        itemMemorial: item,
        status: 'sem_match',
        confianca: 0,
        sugestao: 'Elemento não reconhecido. Verifique se o termo está correto ou adicione manualmente.',
      };
    }

    // Calcular quantidade esperada baseado nos ambientes
    let quantidadeCalculada = 0;
    const ambientesAplicaveis = item.ambientes?.length
      ? ambientes.filter((a) => item.ambientes!.includes(a.nome))
      : ambientes;

    for (const ambiente of ambientesAplicaveis) {
      const calculos = this.engine.calcularParaAmbiente(ambiente);
      const calculoElemento = calculos.find((c) => c.elementoId === elementoIdentificado.id);
      if (calculoElemento) {
        quantidadeCalculada += calculoElemento.quantidade;
      }
    }

    // Comparar com quantidade do memorial
    const quantidadeMemorial = item.quantidade || 0;
    let diferencaPercentual = 0;
    let status: ResultadoMatch['status'] = 'match';

    if (quantidadeMemorial > 0 && quantidadeCalculada > 0) {
      diferencaPercentual = Math.abs(
        ((quantidadeMemorial - quantidadeCalculada) / quantidadeCalculada) * 100
      );

      if (diferencaPercentual > 30) {
        status = 'divergente';
      }
    } else if (quantidadeMemorial === 0 && quantidadeCalculada > 0) {
      status = 'novo';
    }

    return {
      itemMemorial: item,
      elementoIdentificado,
      quantidadeCalculada,
      quantidadeMemorial,
      diferencaPercentual,
      status,
      confianca: status === 'match' ? 90 : status === 'divergente' ? 60 : 30,
      sugestao: this.gerarSugestao(status, quantidadeMemorial, quantidadeCalculada),
    };
  }

  /**
   * Gerar sugestÍo baseada no status
   */
  private gerarSugestao(
    status: ResultadoMatch['status'],
    qtdMemorial: number,
    qtdCalculada: number
  ): string {
    switch (status) {
      case 'match':
        return 'Quantidade do memorial confere com o cálculo.';
      case 'divergente':
        if (qtdMemorial > qtdCalculada) {
          return `Memorial indica ${qtdMemorial} mas cálculo sugere ${qtdCalculada}. Verificar se há requisitos especiais.`;
        }
        return `Memorial indica ${qtdMemorial} mas cálculo sugere ${qtdCalculada}. Pode haver subdimensionamento.`;
      case 'novo':
        return `Item não estava no memorial mas foi identificado na planta. Sugerido adicionar: ${qtdCalculada}`;
      default:
        return 'não foi possível fazer o match automático.';
    }
  }

  /**
   * Gerar relatório de validaçÍo cruzada
   */
  gerarRelatorioValidacao(resultados: ResultadoMatch[]): {
    totalItens: number;
    matches: number;
    divergentes: number;
    novos: number;
    semMatch: number;
    confiancaMedia: number;
    alertas: string[];
  } {
    const matches = resultados.filter((r) => r.status === 'match').length;
    const divergentes = resultados.filter((r) => r.status === 'divergente').length;
    const novos = resultados.filter((r) => r.status === 'novo').length;
    const semMatch = resultados.filter((r) => r.status === 'sem_match').length;
    const confiancaMedia =
      resultados.reduce((acc, r) => acc + r.confianca, 0) / resultados.length || 0;

    const alertas: string[] = [];

    if (divergentes > 0) {
      alertas.push(`${divergentes} item(ns) com quantidades divergentes entre memorial e planta.`);
    }
    if (novos > 0) {
      alertas.push(`${novos} item(ns) identificados na planta mas ausentes no memorial.`);
    }
    if (semMatch > 0) {
      alertas.push(`${semMatch} item(ns) do memorial não foram reconhecidos automaticamente.`);
    }

    return {
      totalItens: resultados.length,
      matches,
      divergentes,
      novos,
      semMatch,
      confiancaMedia: Math.round(confiancaMedia),
      alertas,
    };
  }
}

// ============================================================
// PARTE 4: EXPORTAÇÕES E INSTÂNCIAS
// ============================================================

// Instância global do engine
export const engineCalculo = new EngineCalculoInteligente();
export const matchInteligente = new MatchInteligenteMemorialPlanta();

// Exportar todas as identidades
export const TODAS_IDENTIDADES = [
  ...IDENTIDADES_ELETRICO,
  ...IDENTIDADES_HIDRAULICO,
  ...IDENTIDADES_AUTOMACAO,
  ...IDENTIDADES_ARQUITETONICO,
];

/**
 * Buscar identidade por ID
 */
export function buscarIdentidadePorId(id: string): IdentidadeElemento | undefined {
  return TODAS_IDENTIDADES.find((i) => i.id === id);
}

/**
 * Listar todas as categorias disponíveis
 */
export function listarCategorias(): string[] {
  return [...new Set(TODAS_IDENTIDADES.map((i) => i.categoria))];
}

/**
 * Listar todas as subcategorias de uma categoria
 */
export function listarSubcategorias(categoria: string): string[] {
  return [
    ...new Set(
      TODAS_IDENTIDADES
        .filter((i) => i.categoria === categoria)
        .map((i) => i.subcategoria)
    ),
  ];
}


