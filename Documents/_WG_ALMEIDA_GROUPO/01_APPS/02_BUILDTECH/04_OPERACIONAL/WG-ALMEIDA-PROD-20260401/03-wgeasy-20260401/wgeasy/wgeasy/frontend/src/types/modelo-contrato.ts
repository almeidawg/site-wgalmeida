// ============================================================
// TIPOS - MODELO DE CONTRATOS
// Sistema WG Easy - Grupo WG Almeida
// Tipagem para o sistema de modelos de contratos
// ============================================================

import numeroPorExtenso from "numero-por-extenso";

export type TipoVariavel =
  | "texto"
  | "cpf"
  | "cnpj"
  | "moeda"
  | "data"
  | "email"
  | "telefone"
  | "numero"
  | "select"
  | "boolean";

export type TipoContrato = "arquitetura" | "marcenaria" | "engenharia";

export interface VariavelContrato {
  id: string;
  label: string;
  tipo: TipoVariavel;
  obrigatorio: boolean;
  placeholder?: string;
  valor_padrao?: string;
  opcoes?: string[];
  mascara?: string;
}

export interface DadosBancarios {
  nome: string;
  codigo: string;
  agencia: string;
  conta: string;
  pix?: string;
}

export interface EmpresaContrato {
  razao_social: string;
  cnpj: string;
  inscricao_estadual?: string;
  ccm?: string;
  endereco: string;
  cep: string;
  cidade: string;
  estado: string;
  banco?: DadosBancarios;
}

export interface SubItemClausula {
  titulo: string;
  itens: string[];
}

export interface ItemClausula {
  numero: string;
  texto: string;
  sub_itens?: SubItemClausula[];
}

export interface ClausulaContrato {
  numero: number;
  titulo: string;
  itens: ItemClausula[];
}

export interface EtapaContrato {
  numero: number;
  nome: string;
  prazo: string;
  prazo_dias: number | null;
  descricao: string;
  gatilho_pagamento: boolean;
  percentual_pagamento?: number;
}

export interface ParcelaPagamento {
  numero: number;
  percentual: number;
  descricao: string;
  prazo?: string;
  vinculo_etapa?: number;
}

export interface MultaAtraso {
  juros_mora: number;
  multa_inicial: number;
  multa_60_dias: number;
  correcao: string;
  juros_anuais?: number;
  multa_contratual?: number;
}

export interface CondicoesPagamento {
  parcelas?: ParcelaPagamento[];
  multa_atraso: MultaAtraso;
  valor_hora_extra?: number;
  multa_cancelamento_antes_envio?: number;
}

export interface CondicoesRescisao {
  multa_percentual: number;
  condicoes: string[];
}

export interface PrazoEntrega {
  prazo_dias: number;
  tipo: "dias_uteis" | "dias_corridos";
  referencia: string;
}

export interface GarantiaItem {
  prazo_dias?: number;
  prazo_anos?: number;
  referencia?: string;
}

export interface GarantiasContrato {
  defeitos_fabrica?: GarantiaItem;
  movel?: GarantiaItem;
  puxadores_dobradicas_aramados?: GarantiaItem;
  montagem?: GarantiaItem;
  taxa_visita_pos_garantia?: number;
}

export interface CampoAmbiente {
  id: string;
  label: string;
  tipo: TipoVariavel;
  opcoes?: string[];
}

export interface AmbientesConfig {
  descricao: string;
  campos: CampoAmbiente[];
}

export interface ModeloContrato {
  id: string;
  nome: string;
  tipo: TipoContrato;
  descricao: string;
  empresa: EmpresaContrato;
  variaveis: VariavelContrato[];
  clausulas: ClausulaContrato[];
  etapas: EtapaContrato[];
  condicoes_pagamento?: CondicoesPagamento;
  rescisao?: CondicoesRescisao;

  // Campos específicos de marcenaria
  ambientes?: AmbientesConfig;
  prazos?: {
    entrega_produtos?: PrazoEntrega;
    inicio_montagem?: PrazoEntrega;
    troca_avaria?: PrazoEntrega;
  };
  garantias?: GarantiasContrato;
  exclusoes?: string[];

  // Status do modelo
  status?: "ativo" | "rascunho" | "inativo";
  observacao?: string;
}

export interface ModelosContratosData {
  versao: string;
  atualizado_em: string;
  modelos: ModeloContrato[];
  tipos_variaveis: Record<TipoVariavel, {
    tipo_html: string;
    mascara?: string;
    validacao?: string;
    prefixo?: string;
    casas_decimais?: number;
    formato?: string;
    min?: number;
  }>;
}

// ============================================================
// TIPOS PARA CRIAÇÍO DE CONTRATOS
// ============================================================

export interface ValorVariavel {
  variavel_id: string;
  valor: string | number | boolean | null;
}

export interface AmbienteContrato {
  id: string;
  ambiente: string;
  caixas: string;
  portas: string;
  lacca: boolean;
  dobradica_amortecedor: string;
  corredica_amortecedor: string;
  puxador: string;
}

export interface ContratoGerado {
  id?: string;
  modelo_id: string;
  cliente_id: string;
  valores: ValorVariavel[];
  ambientes?: AmbienteContrato[];
  status: "rascunho" | "aguardando_assinatura" | "assinado" | "cancelado";
  criado_em?: string;
  atualizado_em?: string;
  assinado_em?: string;
  documento_url?: string;
}

// ============================================================
// HELPERS
// ============================================================

export function valorMonetarioParaExtenso(valor: number): string {
  const extenso = numeroPorExtenso;
  const reais = Math.floor(valor);
  const centavos = Math.round((valor - reais) * 100);

  let resultado = extenso.porExtenso(reais, extenso.Genero.Masculino) + " reais";

  if (centavos > 0) {
    resultado += " e " + extenso.porExtenso(centavos, extenso.Genero.Masculino) + " centavos";
  }

  return resultado;
}

export function formatarValorMonetario(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

export function substituirVariaveis(
  texto: string,
  valores: Record<string, string | number>
): string {
  let resultado = texto;

  for (const [chave, valor] of Object.entries(valores)) {
    const regex = new RegExp(`\\{\\{${chave}\\}\\}`, "g");
    resultado = resultado.replace(regex, String(valor));
  }

  return resultado;
}

