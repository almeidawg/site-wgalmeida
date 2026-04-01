// =====================================================
// FINANCEIRO PESSOAL - API SERVICE
// =====================================================

import { supabaseRaw as supabase } from '@/lib/supabaseClient';
import type {
  ContaPessoal,
  CategoriaPessoal,
  LancamentoPessoal,
  AlertaPessoal,
  NovaContaForm,
  NovoLancamentoForm,
  FiltrosLancamentos,
  DashboardPessoalData,
} from '../types';

// ---------- HELPER: OBTER USUARIO_ID ----------

async function getUsuarioId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (!usuario) throw new Error('Usuário não encontrado');
  return usuario.id;
}

// ---------- CONTAS ----------

export async function listarContas(): Promise<ContaPessoal[]> {
  const usuarioId = await getUsuarioId();

  const { data, error } = await supabase
    .from('fin_pessoal_contas')
    .select('*')
    .eq('usuario_id', usuarioId)
    .order('ordem', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function criarConta(dados: NovaContaForm): Promise<ContaPessoal> {
  const usuarioId = await getUsuarioId();

  const { data, error } = await supabase
    .from('fin_pessoal_contas')
    .insert({
      ...dados,
      usuario_id: usuarioId,
      saldo_atual: dados.saldo_inicial,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function atualizarConta(id: string, dados: Partial<ContaPessoal>): Promise<ContaPessoal> {
  const { data, error } = await supabase
    .from('fin_pessoal_contas')
    .update({ ...dados, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function arquivarConta(id: string): Promise<void> {
  await atualizarConta(id, { status: 'arquivada' });
}

// ---------- CATEGORIAS ----------

export async function listarCategorias(): Promise<CategoriaPessoal[]> {
  const { data, error } = await supabase
    .from('fin_pessoal_categorias')
    .select('*')
    .eq('ativo', true)
    .order('ordem', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function criarCategoria(dados: Partial<CategoriaPessoal>): Promise<CategoriaPessoal> {
  const usuarioId = await getUsuarioId();

  const { data, error } = await supabase
    .from('fin_pessoal_categorias')
    .insert({ ...dados, usuario_id: usuarioId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ---------- LANCAMENTOS ----------

export async function listarLancamentos(filtros?: FiltrosLancamentos): Promise<LancamentoPessoal[]> {
  const usuarioId = await getUsuarioId();

  // Buscar lançamentos sem join de contas (evita erro de FK)
  let query = supabase
    .from('fin_pessoal_lancamentos')
    .select(`
      *,
      categoria:fin_pessoal_categorias(*)
    `)
    .eq('usuario_id', usuarioId)
    .order('data_lancamento', { ascending: false });

  if (filtros) {
    if (filtros.tipo) query = query.eq('tipo', filtros.tipo);
    if (filtros.status) query = query.eq('status', filtros.status);
    if (filtros.categoria_id) query = query.eq('categoria_id', filtros.categoria_id);
    if (filtros.conta_id) query = query.eq('conta_id', filtros.conta_id);
    if (filtros.data_inicio) query = query.gte('data_lancamento', filtros.data_inicio);
    if (filtros.data_fim) query = query.lte('data_lancamento', filtros.data_fim);
    if (filtros.busca) query = query.ilike('descricao', `%${filtros.busca}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  if (!data || data.length === 0) return [];

  // Buscar contas separadamente
  const contaIds = [...new Set([
    ...data.map((l: any) => l.conta_id).filter(Boolean),
    ...data.map((l: any) => l.conta_destino_id).filter(Boolean)
  ])];

  let contasMap: Record<string, any> = {};
  if (contaIds.length > 0) {
    const { data: contas } = await supabase
      .from('fin_pessoal_contas')
      .select('*')
      .in('id', contaIds);
    if (contas) {
      contasMap = Object.fromEntries(contas.map(c => [c.id, c]));
    }
  }

  return data.map((l: any) => ({
    ...l,
    conta: l.conta_id ? contasMap[l.conta_id] : null,
    conta_destino: l.conta_destino_id ? contasMap[l.conta_destino_id] : null
  }));
}

export async function criarLancamento(dados: NovoLancamentoForm): Promise<LancamentoPessoal> {
  const usuarioId = await getUsuarioId();

  const { data, error } = await supabase
    .from('fin_pessoal_lancamentos')
    .insert({ ...dados, usuario_id: usuarioId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function atualizarLancamento(id: string, dados: Partial<LancamentoPessoal>): Promise<LancamentoPessoal> {
  const { data, error } = await supabase
    .from('fin_pessoal_lancamentos')
    .update({ ...dados, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletarLancamento(id: string): Promise<void> {
  const { error } = await supabase
    .from('fin_pessoal_lancamentos')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function efetivarLancamento(id: string): Promise<void> {
  await atualizarLancamento(id, {
    status: 'efetivado',
    data_efetivacao: new Date().toISOString().split('T')[0],
  });
}

// ---------- ALERTAS ----------

export async function listarAlertas(): Promise<AlertaPessoal[]> {
  const usuarioId = await getUsuarioId();

  const { data, error } = await supabase
    .from('fin_pessoal_alertas')
    .select('*')
    .eq('usuario_id', usuarioId)
    .in('status', ['ativo', 'lido'])
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data || [];
}

export async function marcarAlertaLido(id: string): Promise<void> {
  await supabase
    .from('fin_pessoal_alertas')
    .update({ status: 'lido', lido_at: new Date().toISOString() })
    .eq('id', id);
}

export async function resolverAlerta(id: string): Promise<void> {
  await supabase
    .from('fin_pessoal_alertas')
    .update({ status: 'resolvido', resolvido_at: new Date().toISOString() })
    .eq('id', id);
}

// ---------- DASHBOARD ----------

export async function obterDashboardData(): Promise<DashboardPessoalData> {
  const usuarioId = await getUsuarioId();

  // Buscar contas
  const { data: contas } = await supabase
    .from('fin_pessoal_contas')
    .select('*')
    .eq('usuario_id', usuarioId)
    .eq('status', 'ativa');

  // Buscar lançamentos do mês
  const inicioMes = new Date();
  inicioMes.setDate(1);
  const fimMes = new Date(inicioMes.getFullYear(), inicioMes.getMonth() + 1, 0);

  const { data: lancamentosMes } = await supabase
    .from('fin_pessoal_lancamentos')
    .select('tipo, valor, status, categoria:fin_pessoal_categorias(nome, cor)')
    .eq('usuario_id', usuarioId)
    .gte('data_lancamento', inicioMes.toISOString().split('T')[0])
    .lte('data_lancamento', fimMes.toISOString().split('T')[0])
    .neq('status', 'cancelado');

  // Buscar alertas ativos
  const { count: alertasAtivos } = await supabase
    .from('fin_pessoal_alertas')
    .select('*', { count: 'exact', head: true })
    .eq('usuario_id', usuarioId)
    .eq('status', 'ativo');

  // Buscar pendentes e vencidos
  const { count: pendentes } = await supabase
    .from('fin_pessoal_lancamentos')
    .select('*', { count: 'exact', head: true })
    .eq('usuario_id', usuarioId)
    .eq('status', 'pendente');

  const { count: vencidos } = await supabase
    .from('fin_pessoal_lancamentos')
    .select('*', { count: 'exact', head: true })
    .eq('usuario_id', usuarioId)
    .eq('status', 'vencido');

  // Calcular totais
  const saldo_total = (contas || []).reduce((sum, c) => sum + (c.saldo_atual || 0), 0);
  const receitas_mes = (lancamentosMes || [])
    .filter(l => l.tipo === 'receita')
    .reduce((sum, l) => sum + l.valor, 0);
  const despesas_mes = (lancamentosMes || [])
    .filter(l => l.tipo === 'despesa')
    .reduce((sum, l) => sum + l.valor, 0);

  // Agrupar por categoria
  const categoriasMap = new Map<string, { valor: number; cor: string }>();
  (lancamentosMes || [])
    .filter(l => l.tipo === 'despesa' && l.categoria)
    .forEach(l => {
      const cat = l.categoria as any;
      const nome = cat?.nome || 'Sem categoria';
      const current = categoriasMap.get(nome) || { valor: 0, cor: cat?.cor || '#6B7280' };
      categoriasMap.set(nome, { valor: current.valor + l.valor, cor: current.cor });
    });

  const grafico_categorias = Array.from(categoriasMap.entries()).map(([categoria, data]) => ({
    categoria,
    valor: data.valor,
    percentual: despesas_mes > 0 ? (data.valor / despesas_mes) * 100 : 0,
    cor: data.cor,
  }));

  return {
    saldo_total,
    receitas_mes,
    despesas_mes,
    balanco_mes: receitas_mes - despesas_mes,
    lancamentos_pendentes: pendentes || 0,
    lancamentos_vencidos: vencidos || 0,
    alertas_ativos: alertasAtivos || 0,
    contas: contas || [],
    grafico_categorias,
    grafico_evolucao: [],
  };
}

// ---------- PRO-LABORE ----------

export async function buscarProLaboresEmpresa(): Promise<any[]> {
  const { data, error } = await supabase
    .from('vw_prolabore_empresa')
    .select('*')
    .order('data_competencia', { ascending: false })
    .limit(12);

  if (error) {
    console.warn('Erro ao buscar pró-labores:', error);
    return [];
  }
  return data || [];
}


