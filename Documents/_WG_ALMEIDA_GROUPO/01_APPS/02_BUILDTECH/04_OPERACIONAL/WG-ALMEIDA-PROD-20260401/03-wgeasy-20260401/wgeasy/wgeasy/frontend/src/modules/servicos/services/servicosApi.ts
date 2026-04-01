// Módulo de Serviços - API Service
// WGeasy - ComunicaçÍo com Supabase

import { supabase } from '@/lib/supabaseClient';
import type {
  SolicitacaoServico,
  ServicoCategoria,
  Prestador,
  PrestadorConvidado,
  ServicoHistorico,
  ServicoAnexo,
  NovoServicoForm,
  FiltrosServico,
  DashboardServicos,
  StatusServico,
} from '../types';

// =====================
// HELPER: Usuário atual
// =====================

async function getAuthUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

// =====================
// CATEGORIAS
// =====================

export async function listarCategorias(): Promise<ServicoCategoria[]> {
  const { data, error } = await supabase
    .from('servico_categorias')
    .select('*')
    .eq('ativo', true)
    .order('ordem', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function obterCategoria(id: string): Promise<ServicoCategoria | null> {
  const { data, error } = await supabase
    .from('servico_categorias')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// =====================
// PRESTADORES
// =====================

export async function listarPrestadoresPorCategoria(categoriaId: string): Promise<Prestador[]> {
  const { data, error } = await supabase
    .from('vw_prestadores_por_categoria')
    .select('*')
    .eq('categoria_id', categoriaId)
    .eq('ativo', true);

  if (error) throw error;
  return data || [];
}

export async function listarTodosPrestadores(): Promise<Prestador[]> {
  const { data, error } = await supabase
    .from('vw_prestadores_por_categoria')
    .select('*')
    .eq('ativo', true);

  if (error) throw error;
  return data || [];
}

export async function vincularPrestadorCategoria(
  prestadorId: string,
  categoriaId: string,
  principal: boolean = false
): Promise<void> {
  const { error } = await supabase
    .from('prestador_categoria_vinculo')
    .upsert({
      prestador_id: prestadorId,
      categoria_id: categoriaId,
      principal,
    }, {
      onConflict: 'prestador_id,categoria_id'
    });

  if (error) throw error;
}

export async function desvincularPrestadorCategoria(
  prestadorId: string,
  categoriaId: string
): Promise<void> {
  const { error } = await supabase
    .from('prestador_categoria_vinculo')
    .delete()
    .eq('prestador_id', prestadorId)
    .eq('categoria_id', categoriaId);

  if (error) throw error;
}

// =====================
// SOLICITAÇÕES DE SERVIÇO
// =====================

export async function listarServicos(filtros?: FiltrosServico): Promise<SolicitacaoServico[]> {
  let idsPorConvite: string[] = [];

  if (filtros?.prestador_relacionado_id) {
    const { data: convites, error: convitesError } = await supabase
      .from('servico_prestadores_convidados')
      .select('solicitacao_id')
      .eq('prestador_id', filtros.prestador_relacionado_id);

    if (convitesError) throw convitesError;
    idsPorConvite = [...new Set((convites || []).map((c) => c.solicitacao_id).filter(Boolean))];
  }

  let query = supabase
    .from('solicitacoes_servico')
    .select(`
      *,
      categoria:servico_categorias(*),
      prestador:pessoas!solicitacoes_servico_prestador_id_fkey(id, nome, telefone, email),
      projeto:contratos(id, numero, cliente_id, dados_cliente_json, dados_imovel_json),
      cliente:pessoas!solicitacoes_servico_cliente_id_fkey(id, nome, telefone),
      convidados:servico_prestadores_convidados(
        *,
        prestador:pessoas(id, nome, telefone, email)
      )
    `)
    .order('criado_em', { ascending: false });

  if (filtros?.status) {
    query = query.eq('status', filtros.status);
  }
  if (filtros?.categoria_id) {
    query = query.eq('categoria_id', filtros.categoria_id);
  }
  if (filtros?.tipo_vinculo) {
    query = query.eq('tipo_vinculo', filtros.tipo_vinculo);
  }
  if (filtros?.projeto_id) {
    query = query.eq('projeto_id', filtros.projeto_id);
  }
  if (filtros?.prestador_id) {
    query = query.eq('prestador_id', filtros.prestador_id);
  }
  if (filtros?.prestador_relacionado_id) {
    const base = `prestador_id.eq.${filtros.prestador_relacionado_id}`;
    const idsStr = idsPorConvite.join(',');
    const filtroRelacionamento = idsStr.length > 0 ? `${base},id.in.(${idsStr})` : base;
    query = query.or(filtroRelacionamento);
  }
  if (filtros?.data_inicio) {
    query = query.gte('data_necessidade', filtros.data_inicio);
  }
  if (filtros?.data_fim) {
    query = query.lte('data_necessidade', filtros.data_fim);
  }
  if (filtros?.busca) {
    query = query.or(`titulo.ilike.%${filtros.busca}%,numero.ilike.%${filtros.busca}%,descricao.ilike.%${filtros.busca}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function obterServico(id: string): Promise<SolicitacaoServico | null> {
  const { data, error } = await supabase
    .from('solicitacoes_servico')
    .select(`
      *,
      categoria:servico_categorias(*),
      prestador:pessoas!solicitacoes_servico_prestador_id_fkey(id, nome, telefone, email),
      projeto:contratos(id, numero, cliente_id, dados_cliente_json, dados_imovel_json),
      cliente:pessoas!solicitacoes_servico_cliente_id_fkey(id, nome, telefone),
      convidados:servico_prestadores_convidados(
        *,
        prestador:pessoas(id, nome, telefone, email)
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function obterServicoPorToken(token: string): Promise<SolicitacaoServico | null> {
  const { data, error } = await supabase
    .from('solicitacoes_servico')
    .select(`
      *,
      categoria:servico_categorias(*)
    `)
    .eq('token_aceite', token)
    .single();

  if (error) throw error;
  return data;
}

export async function criarServico(dados: NovoServicoForm): Promise<SolicitacaoServico> {
  const authUserId = await getAuthUserId();

  const { data, error } = await supabase
    .from('solicitacoes_servico')
    .insert({
      ...dados,
      criado_por: authUserId,
      link_expira_em: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
    })
    .select(`
      *,
      categoria:servico_categorias(*)
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function atualizarServico(
  id: string,
  dados: Partial<NovoServicoForm>
): Promise<SolicitacaoServico> {
  const authUserId = await getAuthUserId();

  const { data, error } = await supabase
    .from('solicitacoes_servico')
    .update({
      ...dados,
      atualizado_por: authUserId,
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', id)
    .select(`
      *,
      categoria:servico_categorias(*)
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function atualizarStatusServico(
  id: string,
  status: StatusServico,
  observacao?: string
): Promise<SolicitacaoServico> {
  const authUserId = await getAuthUserId();

  const updateData: Record<string, unknown> = {
    status,
    atualizado_por: authUserId,
    atualizado_em: new Date().toISOString(),
  };

  // Datas específicas por status
  if (status === 'em_andamento') {
    updateData.data_inicio_execucao = new Date().toISOString();
  } else if (status === 'concluido') {
    updateData.data_conclusao = new Date().toISOString();
  } else if (status === 'cancelado') {
    updateData.motivo_cancelamento = observacao;
    updateData.cancelado_por = authUserId;
    updateData.cancelado_em = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('solicitacoes_servico')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      categoria:servico_categorias(*)
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function marcarServicoEnviado(id: string): Promise<SolicitacaoServico> {
  return atualizarStatusServico(id, 'enviado');
}

// =====================
// PRESTADORES CONVIDADOS
// =====================

export async function convidarPrestadores(
  solicitacaoId: string,
  prestadores: { id: string; tipo: 'fornecedor' | 'colaborador' }[]
): Promise<PrestadorConvidado[]> {
  const inserts = prestadores.map(p => ({
    solicitacao_id: solicitacaoId,
    prestador_id: p.id,
    prestador_tipo: p.tipo,
    status: 'convidado',
    link_enviado_em: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from('servico_prestadores_convidados')
    .insert(inserts)
    .select(`
      *,
      prestador:pessoas(id, nome, telefone, email)
    `);

  if (error) throw error;
  return data || [];
}

export async function obterConvidadoPorToken(token: string): Promise<PrestadorConvidado | null> {
  const { data, error } = await supabase
    .from('servico_prestadores_convidados')
    .select(`
      *,
      prestador:pessoas(id, nome, telefone, email)
    `)
    .eq('token', token)
    .single();

  if (error) throw error;
  return data;
}

export async function aceitarServico(token: string): Promise<{
  success: boolean;
  message: string;
  servico?: SolicitacaoServico;
}> {
  // 1. Buscar o convite pelo token
  const { data: convite, error: conviteError } = await supabase
    .from('servico_prestadores_convidados')
    .select(`
      *,
      solicitacao:solicitacoes_servico(*)
    `)
    .eq('token', token)
    .single();

  if (conviteError || !convite) {
    return { success: false, message: 'Link inválido ou expirado.' };
  }

  // 2. Verificar se o serviço já foi aceito
  if (convite.solicitacao?.status !== 'enviado') {
    if (convite.solicitacao?.status === 'aceito' || convite.solicitacao?.status === 'em_andamento') {
      return {
        success: false,
        message: 'Este serviço já foi aceito por outro prestador. Aguarde próximas solicitações.'
      };
    }
    return { success: false, message: 'Este serviço não está mais disponível.' };
  }

  // 3. Verificar expiraçÍo
  if (convite.solicitacao?.link_expira_em) {
    const expiracao = new Date(convite.solicitacao.link_expira_em);
    if (expiracao < new Date()) {
      return { success: false, message: 'Este link expirou. Solicite um novo convite.' };
    }
  }

  // 4. Marcar este convite como aceito
  const { error: updateConviteError } = await supabase
    .from('servico_prestadores_convidados')
    .update({
      status: 'aceito',
      respondido_em: new Date().toISOString(),
    })
    .eq('id', convite.id);

  if (updateConviteError) {
    return { success: false, message: 'Erro ao processar aceite. Tente novamente.' };
  }

  // 5. Atualizar o serviço
  const { data: servico, error: updateServicoError } = await supabase
    .from('solicitacoes_servico')
    .update({
      status: 'aceito',
      prestador_id: convite.prestador_id,
      prestador_tipo: convite.prestador_tipo,
      data_aceite: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', convite.solicitacao_id)
    .select()
    .single();

  if (updateServicoError) {
    return { success: false, message: 'Erro ao confirmar aceite. Tente novamente.' };
  }

  // 6. Marcar outros convites como expirados
  await supabase
    .from('servico_prestadores_convidados')
    .update({ status: 'expirado' })
    .eq('solicitacao_id', convite.solicitacao_id)
    .neq('id', convite.id);

  return {
    success: true,
    message: 'Serviço aceito com sucesso! Você receberá mais informações em breve.',
    servico,
  };
}

export async function registrarVisualizacao(token: string): Promise<void> {
  await supabase
    .from('servico_prestadores_convidados')
    .update({
      status: 'visualizado',
      visualizado_em: new Date().toISOString(),
    })
    .eq('token', token)
    .eq('status', 'convidado');
}

// =====================
// HISTÓRICO
// =====================

export async function listarHistorico(solicitacaoId: string): Promise<ServicoHistorico[]> {
  const { data, error } = await supabase
    .from('servico_historico')
    .select('*')
    .eq('solicitacao_id', solicitacaoId)
    .order('criado_em', { ascending: false });

  if (error) throw error;
  return data || [];
}

// =====================
// ANEXOS
// =====================

export async function listarAnexos(solicitacaoId: string): Promise<ServicoAnexo[]> {
  const { data, error } = await supabase
    .from('servico_anexos')
    .select('*')
    .eq('solicitacao_id', solicitacaoId)
    .order('criado_em', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function adicionarAnexo(
  solicitacaoId: string,
  arquivo: File,
  tipo?: string
): Promise<ServicoAnexo> {
  const authUserId = await getAuthUserId();

  // Upload do arquivo
  const fileName = `${Date.now()}-${arquivo.name}`;
  const filePath = `servicos/${solicitacaoId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('anexos')
    .upload(filePath, arquivo);

  if (uploadError) throw uploadError;

  // URL pública
  const { data: urlData } = supabase.storage
    .from('anexos')
    .getPublicUrl(filePath);

  // Registrar no banco
  const { data, error } = await supabase
    .from('servico_anexos')
    .insert({
      solicitacao_id: solicitacaoId,
      nome: arquivo.name,
      tipo,
      arquivo_url: urlData.publicUrl,
      tamanho_bytes: arquivo.size,
      criado_por: authUserId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removerAnexo(id: string): Promise<void> {
  const { error } = await supabase
    .from('servico_anexos')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// =====================
// DASHBOARD
// =====================

export async function obterDashboard(): Promise<DashboardServicos> {
  const { data, error } = await supabase
    .from('vw_dashboard_servicos')
    .select('*')
    .single();

  if (error) throw error;
  return data || {
    total_criados: 0,
    total_enviados: 0,
    total_aceitos: 0,
    total_em_andamento: 0,
    total_concluidos: 0,
    total_cancelados: 0,
    valor_total_concluido: 0,
    valor_em_execucao: 0,
    total_geral: 0,
  };
}

// =====================
// PROJETOS/CONTRATOS (para select)
// =====================

export async function listarProjetos(): Promise<{
  id: string;
  numero: string;
  cliente_nome?: string;
  endereco_obra?: string;
}[]> {
  const { data, error } = await supabase
    .from('contratos')
    .select('id, numero, dados_cliente_json, dados_imovel_json')
    .not('status', 'in', '(rascunho,concluido,cancelado)')
    .order('numero', { ascending: false });

  if (error) throw error;

  return (data || []).map(c => ({
    id: c.id,
    numero: c.numero,
    cliente_nome: c.dados_cliente_json?.nome,
    endereco_obra: c.dados_imovel_json?.endereco_completo ||
      [
        c.dados_imovel_json?.logradouro,
        c.dados_imovel_json?.numero,
        c.dados_imovel_json?.bairro,
        c.dados_imovel_json?.cidade,
        c.dados_imovel_json?.estado
      ].filter(Boolean).join(', '),
  }));
}

// =====================
// FORNECEDORES (para select)
// =====================

export async function listarFornecedores(): Promise<{
  id: string;
  nome: string;
  telefone?: string;
  endereco?: string;
}[]> {
  const { data, error } = await supabase
    .from('pessoas')
    .select('id, nome, telefone, logradouro, numero, bairro, cidade, estado')
    .eq('tipo', 'FORNECEDOR')
    .eq('ativo', true)
    .order('nome');

  if (error) throw error;

  return (data || []).map(f => ({
    id: f.id,
    nome: f.nome,
    telefone: f.telefone,
    endereco: [f.logradouro, f.numero, f.bairro, f.cidade, f.estado].filter(Boolean).join(', '),
  }));
}


