// =====================================================
// FINANCEIRO PESSOAL - TIPOS TYPESCRIPT
// =====================================================

// ---------- ENUMS ----------
export type TipoConta = 'PF' | 'PJ';
export type SubtipoConta = 'corrente' | 'poupanca' | 'investimento' | 'carteira' | 'cartao_credito';
export type StatusConta = 'ativa' | 'inativa' | 'arquivada';

export type TipoLancamento = 'receita' | 'despesa' | 'transferencia';
export type StatusLancamento = 'pendente' | 'efetivado' | 'agendado' | 'vencido' | 'cancelado';

export type TipoCategoria = 'receita' | 'despesa' | 'ambos';

export type TipoAlerta =
  | 'prolabore_ausente'
  | 'deposito_sem_origem'
  | 'vencimento_proximo'
  | 'meta_atingida'
  | 'orcamento_estourado'
  | 'lancamento_sugerido';

export type StatusAlerta = 'ativo' | 'lido' | 'resolvido' | 'ignorado';
export type PrioridadeAlerta = 'baixa' | 'media' | 'alta';

export type StatusSugestao = 'pendente' | 'aceita' | 'rejeitada' | 'ignorada';
export type TipoVinculo = 'prolabore' | 'transferencia' | 'pagamento';
export type OrigemVinculo = 'manual' | 'automatico' | 'sugerido';

// ---------- INTERFACES PRINCIPAIS ----------

export interface ContaPessoal {
  id: string;
  usuario_id: string;
  nome: string;
  banco?: string;
  agencia?: string;
  numero_conta?: string;
  tipo: TipoConta;
  subtipo?: SubtipoConta;
  saldo_inicial: number;
  saldo_atual: number;
  cor: string;
  icone: string;
  ordem: number;
  is_principal: boolean;
  status: StatusConta;
  created_at: string;
  updated_at: string;
}

export interface CategoriaPessoal {
  id: string;
  usuario_id?: string;
  nome: string;
  tipo: TipoCategoria;
  categoria_pai_id?: string;
  cor: string;
  icone?: string;
  ordem: number;
  is_sistema: boolean;
  ativo: boolean;
  created_at: string;
  subcategorias?: CategoriaPessoal[];
}

export interface LancamentoPessoal {
  id: string;
  usuario_id: string;
  numero: string;
  tipo: TipoLancamento;
  descricao: string;
  valor: number;
  categoria_id?: string;
  tags?: string[];
  conta_id?: string;
  conta_destino_id?: string;
  data_lancamento: string;
  data_vencimento?: string;
  data_efetivacao?: string;
  status: StatusLancamento;
  is_recorrente: boolean;
  recorrencia_tipo?: 'mensal' | 'semanal' | 'anual';
  recorrencia_pai_id?: string;
  vinculo_financeiro_principal_id?: string;
  vinculo_tipo?: TipoVinculo;
  vinculo_origem: OrigemVinculo;
  comprovante_url?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  categoria?: CategoriaPessoal;
  conta?: ContaPessoal;
  conta_destino?: ContaPessoal;
}

export interface SugestaoVinculo {
  id: string;
  usuario_id: string;
  financeiro_principal_id: string;
  financeiro_tipo: TipoVinculo;
  valor: number;
  data_lancamento: string;
  descricao?: string;
  status: StatusSugestao;
  lancamento_pessoal_id?: string;
  created_at: string;
  processado_at?: string;
}

export interface AlertaPessoal {
  id: string;
  usuario_id: string;
  tipo: TipoAlerta;
  titulo: string;
  mensagem?: string;
  dados?: Record<string, any>;
  acao_tipo?: string;
  acao_referencia_id?: string;
  status: StatusAlerta;
  prioridade: PrioridadeAlerta;
  created_at: string;
  lido_at?: string;
  resolvido_at?: string;
}

// ---------- INTERFACES DE DASHBOARD ----------

export interface DashboardPessoalData {
  saldo_total: number;
  receitas_mes: number;
  despesas_mes: number;
  balanco_mes: number;
  lancamentos_pendentes: number;
  lancamentos_vencidos: number;
  alertas_ativos: number;
  contas: ContaPessoal[];
  grafico_categorias: GraficoCategorias[];
  grafico_evolucao: GraficoEvolucao[];
}

export interface GraficoCategorias {
  categoria: string;
  valor: number;
  percentual: number;
  cor: string;
}

export interface GraficoEvolucao {
  mes: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

// ---------- INTERFACES DE FILTROS ----------

export interface FiltrosLancamentos {
  tipo?: TipoLancamento;
  status?: StatusLancamento;
  categoria_id?: string;
  conta_id?: string;
  data_inicio?: string;
  data_fim?: string;
  valor_min?: number;
  valor_max?: number;
  busca?: string;
}

// ---------- INTERFACES DE FORMULÁRIOS ----------

export interface NovaContaForm {
  nome: string;
  banco?: string;
  agencia?: string;
  numero_conta?: string;
  tipo: TipoConta;
  subtipo?: SubtipoConta;
  saldo_inicial: number;
  cor?: string;
  icone?: string;
}

export interface NovoLancamentoForm {
  tipo: TipoLancamento;
  descricao: string;
  valor: number;
  categoria_id?: string;
  conta_id?: string;
  conta_destino_id?: string;
  data_lancamento: string;
  data_vencimento?: string;
  is_recorrente?: boolean;
  recorrencia_tipo?: string;
  tags?: string[];
  observacoes?: string;
}

// ---------- OPTIONS PARA SELECTS ----------

export const STATUS_LANCAMENTO_OPTIONS: { value: StatusLancamento; label: string; cor: string }[] = [
  { value: 'pendente', label: 'Pendente', cor: 'yellow' },
  { value: 'efetivado', label: 'Efetivado', cor: 'green' },
  { value: 'agendado', label: 'Agendado', cor: 'blue' },
  { value: 'vencido', label: 'Vencido', cor: 'red' },
  { value: 'cancelado', label: 'Cancelado', cor: 'gray' },
];

export const TIPO_CONTA_OPTIONS: { value: TipoConta; label: string }[] = [
  { value: 'PF', label: 'Pessoa Física' },
  { value: 'PJ', label: 'Pessoa Jurídica' },
];

export const SUBTIPO_CONTA_OPTIONS: { value: SubtipoConta; label: string; icone: string }[] = [
  { value: 'corrente', label: 'Conta Corrente', icone: 'building-2' },
  { value: 'poupanca', label: 'Poupança', icone: 'piggy-bank' },
  { value: 'investimento', label: 'Investimentos', icone: 'trending-up' },
  { value: 'carteira', label: 'Carteira/Dinheiro', icone: 'wallet' },
  { value: 'cartao_credito', label: 'CartÍo de Crédito', icone: 'credit-card' },
];

export const TIPO_LANCAMENTO_OPTIONS: { value: TipoLancamento; label: string; cor: string }[] = [
  { value: 'receita', label: 'Receita', cor: 'green' },
  { value: 'despesa', label: 'Despesa', cor: 'red' },
  { value: 'transferencia', label: 'Transferência', cor: 'blue' },
];

