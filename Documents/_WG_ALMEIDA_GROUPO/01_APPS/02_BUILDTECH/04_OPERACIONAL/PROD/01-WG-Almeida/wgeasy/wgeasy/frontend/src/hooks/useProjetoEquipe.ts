import { useState, useEffect, useCallback } from 'react';
import { supabaseRaw } from '@/lib/supabaseClient';

// Tipos para o hook useProjetoEquipe
interface PessoaEquipe {
  id: string;
  nome: string;
  tipo: string;
  cargo?: string;
  rg?: string;
  cpf?: string;
  avatar_url?: string;
  telefone?: string;
  email?: string;
}

interface MembroEquipe {
  id: string;
  projeto_id: string;
  pessoa_id: string;
  funcao_no_projeto?: string;
  data_entrada: string;
  data_saida?: string;
  ativo: boolean;
  observacoes?: string;
  pessoa?: PessoaEquipe;
}

interface PessoaDisponivel {
  id: string;
  nome: string;
  tipo: string;
  cargo?: string;
  telefone?: string;
  email?: string;
}

export const useProjetoEquipe = (projetoId?: string) => {
  const [membrosEquipe, setMembrosEquipe] = useState<MembroEquipe[]>([]);
  const [pessoasDisponiveis, setPessoasDisponiveis] = useState<PessoaDisponivel[]>([]);
  const [loading, setLoading] = useState(false);

  const listarPessoasColaboradoresEFornecedores = useCallback(async (): Promise<PessoaDisponivel[]> => {
    const pageSize = 1000;
    let from = 0;
    const acumulado: PessoaDisponivel[] = [];

    while (true) {
      const { data, error } = await supabaseRaw
        .from('pessoas')
        .select('*')
        .or('tipo.ilike.%colaborador%,tipo.ilike.%fornecedor%')
        .order('nome', { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) throw error;

      const lote = (data || []) as PessoaDisponivel[];
      acumulado.push(...lote);

      if (lote.length < pageSize) break;
      from += pageSize;
    }

    const unicos = new Map<string, PessoaDisponivel>();
    for (const pessoa of acumulado) {
      if (!pessoa?.id) continue;
      unicos.set(pessoa.id, pessoa);
    }

    return Array.from(unicos.values()).sort((a, b) =>
      (a.nome || '').localeCompare(b.nome || '')
    );
  }, []);

  // Buscar membros da equipe do projeto
  const fetchEquipe = useCallback(async () => {
    if (!projetoId) return;

    setLoading(true);
    try {
      const { data, error } = await supabaseRaw
        .from('projeto_equipe')
        .select(`
          id,
          projeto_id,
          pessoa_id,
          funcao_no_projeto,
          data_entrada,
          ativo,
          observacoes,
          pessoa:pessoas(
            id,
            nome,
            tipo,
            cargo,
            rg,
            cpf,
            avatar_url,
            telefone,
            email
          )
        `)
        .eq('projeto_id', projetoId)
        .eq('ativo', true)
        .order('data_entrada', { ascending: false });

      if (error) throw error;

      // Mapear os dados para lidar com pessoa sendo retornado como array pelo Supabase
      const membros = (data || []).map((item: any) => ({
        ...item,
        pessoa: Array.isArray(item.pessoa) ? item.pessoa[0] : item.pessoa
      })) as MembroEquipe[];

      setMembrosEquipe(membros);
      console.log('Equipe carregada:', membros);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro ao buscar equipe:', errorMessage);
      setMembrosEquipe([]);
    } finally {
      setLoading(false);
    }
  }, [projetoId]);

  // Buscar pessoas disponíveis (colaboradores e fornecedores)
  const fetchPessoasDisponiveis = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listarPessoasColaboradoresEFornecedores();
      setPessoasDisponiveis(data || []);
      console.log('Pessoas disponíveis:', data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro ao buscar pessoas:', errorMessage);
      setPessoasDisponiveis([]);
    } finally {
      setLoading(false);
    }
  }, [listarPessoasColaboradoresEFornecedores]);

  // Adicionar membro à equipe
  const adicionarMembro = async (pessoaId: string, funcaoNoProjeto?: string) => {
    if (!projetoId) return false;

    try {
      // Primeiro, verificar se já existe (ativo ou inativo)
      const { data: existente } = await supabaseRaw
        .from('projeto_equipe')
        .select('id, ativo')
        .eq('projeto_id', projetoId)
        .eq('pessoa_id', pessoaId)
        .maybeSingle();

      if (existente) {
        if (existente.ativo) {
          // Já está na equipe e ativo
          console.log('Pessoa já está na equipe');
          return false;
        } else {
          // Estava inativo, reativar
          const { error: updateError } = await supabaseRaw
            .from('projeto_equipe')
            .update({
              ativo: true,
              data_entrada: new Date().toISOString(),
              data_saida: null,
              funcao_no_projeto: funcaoNoProjeto || null
            })
            .eq('id', existente.id);

          if (updateError) throw updateError;
          await fetchEquipe();
          return true;
        }
      }

      // não existe, criar novo
      const { error } = await supabaseRaw
        .from('projeto_equipe')
        .insert({
          projeto_id: projetoId,
          pessoa_id: pessoaId,
          funcao_no_projeto: funcaoNoProjeto || null,
          ativo: true
        });

      if (error) {
        // Se erro for de duplicidade (23505 ou 409), tenta reativar
        if (error.code === '23505' || error.message?.includes('409') || error.message?.includes('duplicate')) {
          console.log('Conflito detectado, pessoa pode já estar na equipe');
          await fetchEquipe();
          return false;
        }
        throw error;
      }

      await fetchEquipe(); // Recarrega a equipe
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro ao adicionar membro:', errorMessage);
      return false;
    }
  };

  // Remover membro da equipe
  const removerMembro = async (membroId: string) => {
    try {
      const { error } = await supabaseRaw
        .from('projeto_equipe')
        .update({ ativo: false, data_saida: new Date().toISOString() })
        .eq('id', membroId);

      if (error) throw error;

      await fetchEquipe(); // Recarrega a equipe
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro ao remover membro:', errorMessage);
      return false;
    }
  };

  // Atualizar funçÍo no projeto
  const atualizarFuncao = async (membroId: string, novaFuncao: string) => {
    try {
      const { error } = await supabaseRaw
        .from('projeto_equipe')
        .update({ funcao_no_projeto: novaFuncao })
        .eq('id', membroId);

      if (error) throw error;

      await fetchEquipe();
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro ao atualizar funçÍo:', errorMessage);
      return false;
    }
  };

  useEffect(() => {
    if (projetoId) {
      fetchEquipe();
    }
    fetchPessoasDisponiveis();
  }, [projetoId, fetchEquipe, fetchPessoasDisponiveis]);

  // Filtrar pessoas que não estÍo na equipe
  const pessoasNaoNaEquipe = pessoasDisponiveis.filter(
    pessoa => !membrosEquipe.find(m => m.pessoa_id === pessoa.id)
  );

  return {
    membrosEquipe,
    pessoasDisponiveis,
    pessoasNaoNaEquipe,
    loading,
    adicionarMembro,
    removerMembro,
    atualizarFuncao,
    fetchEquipe,
    fetchPessoasDisponiveis
  };
};


