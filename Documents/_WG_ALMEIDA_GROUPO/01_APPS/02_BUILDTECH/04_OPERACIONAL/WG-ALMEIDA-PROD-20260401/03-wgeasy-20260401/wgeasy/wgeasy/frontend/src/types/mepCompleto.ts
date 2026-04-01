// ============================================================
// TIPOS MEP COMPLETO - Elétrico, Hidráulico, AutomaçÍo
// Sistema WG Easy - Grupo WG Almeida
// ============================================================
// Este arquivo define todos os tipos necessários para análise
// completa de projetos MEP (Mechanical, Electrical, Plumbing)
// ============================================================

// ============================================================
// ELÉTRICO - TIPOS COMPLETOS
// ============================================================

/**
 * EspecificaçÍo de condutor elétrico
 */
export type SecaoCondutor = '1.5mm' | '2.5mm' | '4mm' | '6mm' | '10mm' | '16mm' | '25mm' | '35mm';
export type TipoCondutor = 'cobre' | 'aluminio';
export type IsolacaoCondutor = 'PVC' | 'EPR' | 'XLPE';

/**
 * Voltagem do sistema
 */
export type Voltagem = 110 | 127 | 220 | 380;

/**
 * Tipo de tomada elétrica
 */
export type TipoTomada =
  | 'comum_baixa'      // 30cm do piso
  | 'comum_media'      // 110cm do piso (bancadas)
  | 'comum_alta'       // 200cm do piso
  | 'ar_condicionado'  // Split/janela
  | 'forno'            // Forno elétrico embutido
  | 'cooktop'          // Cooktop indução/vitrocerâmico
  | 'microondas'       // Micro-ondas
  | 'lava_loucas'      // Lava-louças
  | 'lava_roupa'       // Máquina de lavar
  | 'secadora'         // Secadora de roupas
  | 'chuveiro'         // Chuveiro elétrico
  | 'aquecedor'        // Aquecedor elétrico
  | 'hidromassagem'    // Banheira hidromassagem
  | 'sauna'            // Sauna elétrica
  | 'usb'              // Tomada com USB integrado
  | 'especial';        // Outras especiais

/**
 * Tomada elétrica completa
 */
export interface TomadaEletrica {
  id?: string;
  tipo: TipoTomada;
  voltagem: Voltagem;
  potencia?: number;           // Watts
  corrente?: number;           // Amperes
  altura: number;              // cm do piso
  quantidade: number;
  ambiente: string;
  circuito?: number;
  disjuntor?: number;          // Amperes
  secaoCondutor?: SecaoCondutor;
  exclusivo: boolean;          // Circuito exclusivo?
  descricao?: string;
  posicao?: {
    x?: number;
    y?: number;
    parede?: 'norte' | 'sul' | 'leste' | 'oeste';
  };
}

/**
 * Tipo de ponto de iluminaçÍo
 */
export type TipoIluminacao =
  | 'plafon'
  | 'spot_embutido'
  | 'spot_sobrepor'
  | 'pendente'
  | 'lustre'
  | 'arandela'
  | 'fita_led'
  | 'led_embutido'
  | 'projetor'
  | 'balizador'
  | 'poste'
  | 'refletor';

/**
 * Ponto de iluminaçÍo completo
 */
export interface PontoIluminacao {
  id?: string;
  tipo: TipoIluminacao;
  quantidade: number;
  potencia?: number;           // Watts por unidade
  temperatura?: number;        // Kelvin (3000K quente, 4000K neutro, 6000K frio)
  dimerizavel: boolean;
  ambiente: string;
  circuito?: number;
  metragemFitaLed?: number;    // Se for fita LED
  descricao?: string;
  posicao?: {
    x?: number;
    y?: number;
    z?: number;                // Altura do forro
  };
}

/**
 * Tipo de interruptor
 */
export type TipoInterruptor =
  | 'simples'
  | 'duplo'
  | 'triplo'
  | 'paralelo'              // Three-way
  | 'intermediario'         // Four-way
  | 'dimmer'
  | 'sensor_presenca'
  | 'sensor_touch'
  | 'smart'
  | 'timer';

/**
 * Interruptor completo
 */
export interface Interruptor {
  id?: string;
  tipo: TipoInterruptor;
  teclas: number;
  ambiente: string;
  altura: number;              // cm do piso (padrÍo 110cm)
  circuitosControlados: number[];
  descricao?: string;
  posicao?: {
    x?: number;
    y?: number;
    parede?: string;
  };
}

/**
 * Circuito elétrico completo
 */
export interface CircuitoEletrico {
  numero: number;
  nome: string;
  tipo: 'iluminacao' | 'tomada_geral' | 'tomada_especial' | 'ar_condicionado' | 'chuveiro' | 'misto';
  voltagem: Voltagem;
  disjuntor: number;           // Amperes
  secaoCondutor: SecaoCondutor;
  tipoCondutor: TipoCondutor;
  metragemFio: number;         // metros total
  pontosAtendidos: number;
  cargaTotal: number;          // Watts
  ambiente?: string;
  dr: boolean;                 // Tem DR?
  dps: boolean;                // Tem DPS?
}

/**
 * Quadro de distribuiçÍo
 */
export interface QuadroDistribuicao {
  id?: string;
  nome: string;
  tipo: 'principal' | 'secundario';
  posicao: string;             // DescriçÍo da localizaçÍo
  disjuntorGeral: number;      // Amperes
  circuitos: CircuitoEletrico[];
  dr: {
    quantidade: number;
    corrente: number;          // mA (30mA padrÍo)
  };
  dps: {
    quantidade: number;
    classe: 'I' | 'II' | 'III';
  };
  barramentos: {
    fase: number;
    neutro: number;
    terra: number;
  };
}

/**
 * Infraestrutura de dados/automaçÍo
 */
export interface InfraestruturaDados {
  id?: string;
  tipo: 'hdmi' | 'rede' | 'telefone' | 'tv' | 'som' | 'interfone' | 'camera' | 'alarme';
  ambiente: string;
  quantidade: number;
  eletroduto: '20mm' | '25mm' | '32mm' | '40mm';
  metragem?: number;
  descricao?: string;
}

// ============================================================
// HIDRÁULICO - TIPOS COMPLETOS
// ============================================================

/**
 * Tipo de ponto hidráulico
 */
export type TipoPontoHidraulico =
  | 'agua_fria'
  | 'agua_quente'
  | 'retorno_aq'
  | 'esgoto_primario'
  | 'esgoto_secundario'
  | 'ventilacao'
  | 'gas_glp'
  | 'gas_natural'
  | 'agua_pluvial'
  | 'reuso';

/**
 * Diâmetro de tubulação
 */
export type DiametroTubulacao = '20mm' | '25mm' | '32mm' | '40mm' | '50mm' | '75mm' | '100mm' | '150mm';

/**
 * Material de tubulação
 */
export type MaterialTubulacao = 'PVC' | 'PPR' | 'CPVC' | 'PEX' | 'cobre' | 'ferro_galvanizado' | 'inox';

/**
 * Ponto hidráulico completo
 */
export interface PontoHidraulico {
  id?: string;
  tipo: TipoPontoHidraulico;
  diametro: DiametroTubulacao;
  material: MaterialTubulacao;
  ambiente: string;
  quantidade: number;
  altura?: number;             // cm do piso
  equipamento?: string;        // Ex: "vaso sanitário", "pia cozinha"
  vazao?: number;              // L/min
  pressao?: number;            // mca
  descricao?: string;
  posicao?: {
    x?: number;
    y?: number;
    parede?: string;
  };
}

/**
 * Tipo de ralo
 */
export type TipoRalo =
  | 'sifonado'
  | 'seco'
  | 'linear'
  | 'oculto'
  | 'grelha';

/**
 * Ralo completo
 */
export interface Ralo {
  id?: string;
  tipo: TipoRalo;
  dimensao: string;            // Ex: "10x10cm", "100x10cm" (linear)
  material: 'inox' | 'plastico' | 'latao' | 'bronze';
  ambiente: string;
  quantidade: number;
  saidasEsgoto: DiametroTubulacao;
  posicao?: {
    x?: number;
    y?: number;
  };
}

/**
 * tubulação hidráulica (trecho)
 */
export interface TrechoTubulacao {
  id?: string;
  tipo: TipoPontoHidraulico;
  diametro: DiametroTubulacao;
  material: MaterialTubulacao;
  metragem: number;
  conexoes: {
    joelhos: number;
    tes: number;
    reducoes: number;
    registros: number;
    caps: number;
  };
  de: string;                  // Ponto de origem
  para: string;                // Ponto de destino
}

/**
 * Equipamento hidráulico
 */
export interface EquipamentoHidraulico {
  id?: string;
  tipo: 'aquecedor_passagem' | 'aquecedor_acumulacao' | 'boiler' | 'pressurizador' | 'bomba' | 'caixa_dagua' | 'filtro';
  marca?: string;
  modelo?: string;
  capacidade?: number;         // Litros ou L/min
  potencia?: number;           // Watts ou kCal
  local: string;
  pontoEletrico: boolean;
  pontoGas: boolean;
  dreno: boolean;
}

/**
 * Louça sanitária
 */
export type TipoLouca =
  | 'vaso_sanitario'
  | 'vaso_com_caixa'
  | 'caixa_acoplada'
  | 'vaso_suspenso'
  | 'cuba_sobrepor'
  | 'cuba_embutir'
  | 'cuba_apoio'
  | 'pia_cozinha'
  | 'tanque'
  | 'banheira'
  | 'bide'
  | 'mictorio';

/**
 * Louça sanitária completa
 */
export interface LoucaSanitaria {
  id?: string;
  tipo: TipoLouca;
  marca?: string;
  modelo?: string;
  cor?: string;
  ambiente: string;
  quantidade: number;
  pontosAgua: number;
  pontosEsgoto: number;
  descricao?: string;
}

/**
 * Metal sanitário
 */
export type TipoMetal =
  | 'torneira_mesa'
  | 'torneira_parede'
  | 'misturador'
  | 'monocomando'
  | 'chuveiro'
  | 'ducha_higienica'
  | 'registro_pressao'
  | 'registro_gaveta'
  | 'sifao'
  | 'valvula'
  | 'flexivel'
  | 'acabamento';

/**
 * Metal sanitário completo
 */
export interface MetalSanitario {
  id?: string;
  tipo: TipoMetal;
  marca?: string;
  modelo?: string;
  acabamento?: string;         // Ex: "cromado", "dourado", "preto"
  ambiente: string;
  quantidade: number;
  diametro?: string;
  descricao?: string;
}

// ============================================================
// AUTOMAÇÍO - TIPOS COMPLETOS
// ============================================================

/**
 * Tipo de dispositivo de automaçÍo
 */
export type TipoDispositivoAutomacao =
  | 'fechadura_digital'
  | 'fechadura_biometrica'
  | 'sensor_presenca'
  | 'sensor_abertura'
  | 'sensor_fumaca'
  | 'sensor_gas'
  | 'sensor_agua'
  | 'camera_ip'
  | 'videoporteiro'
  | 'interfone'
  | 'central_alarme'
  | 'sirene'
  | 'controle_cena'
  | 'dimmer_smart'
  | 'interruptor_smart'
  | 'tomada_smart'
  | 'motor_cortina'
  | 'motor_persiana'
  | 'motor_portao'
  | 'controle_ar'
  | 'termostato'
  | 'hub_central'
  | 'repetidor'
  | 'assistente_voz';

/**
 * Protocolo de comunicaçÍo
 */
export type ProtocoloAutomacao = 'wifi' | 'zigbee' | 'zwave' | 'bluetooth' | 'rf433' | 'cabeado' | 'matter';

/**
 * Dispositivo de automaçÍo
 */
export interface DispositivoAutomacao {
  id?: string;
  tipo: TipoDispositivoAutomacao;
  marca?: string;
  modelo?: string;
  protocolo: ProtocoloAutomacao;
  ambiente: string;
  quantidade: number;
  alimentacao: 'bateria' | 'bivolt' | 'poe' | '12v' | '24v';
  integracao?: string[];       // Ex: ['alexa', 'google', 'homekit']
  descricao?: string;
}

/**
 * Cena de automaçÍo
 */
export interface CenaAutomacao {
  id?: string;
  nome: string;
  ambiente: string;
  acoes: {
    dispositivo: string;
    acao: string;
    valor?: any;
  }[];
  gatilhos?: {
    tipo: 'horario' | 'sensor' | 'comando' | 'localizacao';
    condicao: string;
  }[];
}

// ============================================================
// CLIMATIZAÇÍO - TIPOS COMPLETOS
// ============================================================

/**
 * Tipo de ar condicionado
 */
export type TipoArCondicionado =
  | 'split_hi_wall'
  | 'split_piso_teto'
  | 'split_cassete'
  | 'split_duto'
  | 'multi_split'
  | 'vrf'
  | 'janela'
  | 'portatil';

/**
 * Ar condicionado
 */
export interface ArCondicionado {
  id?: string;
  tipo: TipoArCondicionado;
  marca?: string;
  modelo?: string;
  capacidade: number;          // BTUs
  ciclo: 'frio' | 'quente_frio';
  inverter: boolean;
  ambiente: string;
  quantidade: number;
  voltagem: Voltagem;
  circuitoExclusivo: boolean;
  dreno: {
    tipo: 'gravidade' | 'bomba';
    metragem?: number;
  };
  descricao?: string;
}

/**
 * Exaustor/VentilaçÍo
 */
export interface Exaustor {
  id?: string;
  tipo: 'axial' | 'centrifugo' | 'coifa' | 'depurador';
  vazao: number;               // m³/h
  ambiente: string;
  quantidade: number;
  voltagem: Voltagem;
  ducto?: {
    diametro: string;
    metragem: number;
  };
}

// ============================================================
// RESUMO MEP DO PROJETO
// ============================================================

/**
 * Resumo completo das instalações MEP
 */
export interface ResumoMEP {
  eletrico: {
    tomadas: TomadaEletrica[];
    iluminacao: PontoIluminacao[];
    interruptores: Interruptor[];
    quadros: QuadroDistribuicao[];
    infraestrutura: InfraestruturaDados[];
    totais: {
      totalTomadas: number;
      totalPontosLuz: number;
      totalInterruptores: number;
      totalCircuitos: number;
      cargaTotal: number;          // kW
      metragemFioTotal: number;    // m
    };
  };
  hidraulico: {
    pontosAgua: PontoHidraulico[];
    ralos: Ralo[];
    tubulacoes: TrechoTubulacao[];
    equipamentos: EquipamentoHidraulico[];
    loucas: LoucaSanitaria[];
    metais: MetalSanitario[];
    totais: {
      pontosAguaFria: number;
      pontosAguaQuente: number;
      pontosEsgoto: number;
      pontosGas: number;
      totalRalos: number;
      metragemTubulacao: number;   // m
    };
  };
  automacao: {
    dispositivos: DispositivoAutomacao[];
    cenas: CenaAutomacao[];
    totais: {
      totalDispositivos: number;
      dispositivosPorProtocolo: Record<ProtocoloAutomacao, number>;
    };
  };
  climatizacao: {
    arCondicionados: ArCondicionado[];
    exaustores: Exaustor[];
    totais: {
      capacidadeTotalBTU: number;
      totalEquipamentos: number;
    };
  };
  validacao: {
    status: 'completo' | 'parcial' | 'pendente';
    alertas: string[];
    sugestoes: string[];
    confiancaGeral: number;        // 0-100%
  };
}

// ============================================================
// HELPERS E CONSTANTES
// ============================================================

/**
 * Potências típicas de equipamentos (Watts)
 */
export const POTENCIAS_TIPICAS: Record<TipoTomada, number> = {
  comum_baixa: 100,
  comum_media: 100,
  comum_alta: 100,
  ar_condicionado: 1400,      // 9000 BTUs médio
  forno: 2500,
  cooktop: 7000,              // indução 4 bocas
  microondas: 1500,
  lava_loucas: 2000,
  lava_roupa: 1500,
  secadora: 3000,
  chuveiro: 5500,
  aquecedor: 4000,
  hidromassagem: 3000,
  sauna: 6000,
  usb: 10,
  especial: 500,
};

/**
 * SeçÍo mínima de condutor por potência
 */
export const SECAO_CONDUTOR_MINIMA: Record<number, SecaoCondutor> = {
  1270: '1.5mm',              // Até 1270W em 127V
  2200: '2.5mm',              // Até 2200W em 127V
  4400: '4mm',
  5500: '6mm',
  8800: '10mm',
  12000: '16mm',
};

/**
 * Disjuntor por seçÍo de condutor
 */
export const DISJUNTOR_POR_SECAO: Record<SecaoCondutor, number> = {
  '1.5mm': 10,
  '2.5mm': 16,
  '4mm': 25,
  '6mm': 32,
  '10mm': 50,
  '16mm': 63,
  '25mm': 80,
  '35mm': 100,
};

/**
 * Calcular seçÍo do condutor recomendada
 */
export function calcularSecaoCondutor(potencia: number, voltagem: Voltagem): SecaoCondutor {
  const corrente = potencia / voltagem;

  if (corrente <= 10) return '1.5mm';
  if (corrente <= 16) return '2.5mm';
  if (corrente <= 25) return '4mm';
  if (corrente <= 32) return '6mm';
  if (corrente <= 50) return '10mm';
  if (corrente <= 63) return '16mm';
  if (corrente <= 80) return '25mm';
  return '35mm';
}

/**
 * Calcular disjuntor recomendado
 */
export function calcularDisjuntor(potencia: number, voltagem: Voltagem): number {
  const corrente = potencia / voltagem;

  if (corrente <= 10) return 10;
  if (corrente <= 16) return 16;
  if (corrente <= 20) return 20;
  if (corrente <= 25) return 25;
  if (corrente <= 32) return 32;
  if (corrente <= 40) return 40;
  if (corrente <= 50) return 50;
  if (corrente <= 63) return 63;
  return 80;
}

/**
 * Calcular metragem de fio estimada
 * Fórmula: distância até quadro × 2 (ida e volta) × 1.2 (margem)
 */
export function calcularMetragemFio(
  distanciaQuadro: number,
  fases: number = 2 // Fase + Neutro ou 2 fases
): number {
  return Math.ceil(distanciaQuadro * fases * 1.2);
}

/**
 * Estimar metragem de tubulação hidráulica
 */
export function estimarMetragemTubulacao(
  pontosTotal: number,
  areaImovel: number,
  tipo: TipoPontoHidraulico
): number {
  // Fórmula empírica baseada em projetos típicos
  const fatorBase = tipo.includes('esgoto') ? 1.5 : 1.2;
  const distanciaMedia = Math.sqrt(areaImovel) * 0.7; // Estimativa de distância média

  return Math.ceil(pontosTotal * distanciaMedia * fatorBase);
}


