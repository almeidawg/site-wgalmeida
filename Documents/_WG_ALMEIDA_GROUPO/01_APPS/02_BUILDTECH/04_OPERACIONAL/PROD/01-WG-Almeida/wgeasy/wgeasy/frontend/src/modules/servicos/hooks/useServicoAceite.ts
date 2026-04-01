/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// Hook para gerenciar aceite de serviço via link público
import { useState, useCallback, useEffect } from 'react';
import type { SolicitacaoServico, PrestadorConvidado } from '../types';
import {
  obterServicoPorToken,
  obterConvidadoPorToken,
  aceitarServico,
  registrarVisualizacao,
} from '../services/servicosApi';

interface UseServicoAceiteReturn {
  servico: SolicitacaoServico | null;
  convidado: PrestadorConvidado | null;
  loading: boolean;
  processando: boolean;
  error: string | null;
  aceito: boolean;
  mensagemAceite: string | null;
  carregarPorTokenServico: (token: string) => Promise<void>;
  carregarPorTokenConvidado: (token: string) => Promise<void>;
  aceitar: (token: string) => Promise<boolean>;
}

export function useServicoAceite(): UseServicoAceiteReturn {
  const [servico, setServico] = useState<SolicitacaoServico | null>(null);
  const [convidado, setConvidado] = useState<PrestadorConvidado | null>(null);
  const [loading, setLoading] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aceito, setAceito] = useState(false);
  const [mensagemAceite, setMensagemAceite] = useState<string | null>(null);

  const carregarPorTokenServico = useCallback(async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await obterServicoPorToken(token);
      setServico(data);

      // Verificar se já foi aceito
      if (data?.status === 'aceito' || data?.status === 'em_andamento' || data?.status === 'concluido') {
        setError('Este serviço já foi aceito por outro prestador.');
      } else if (data?.status === 'cancelado') {
        setError('Este serviço foi cancelado.');
      } else if (data?.link_expira_em && new Date(data.link_expira_em) < new Date()) {
        setError('Este link expirou.');
      }
    } catch (err) {
      setError('Link inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  }, []);

  const carregarPorTokenConvidado = useCallback(async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await obterConvidadoPorToken(token);
      setConvidado(data);

      if (data) {
        // Registrar visualizaçÍo
        await registrarVisualizacao(token);

        // Carregar dados do serviço
        if (data.solicitacao_id) {
          // Precisamos buscar o serviço separadamente
          // Por ora, deixamos o convidado carregar
        }

        // Verificar status do convite
        if (data.status === 'aceito') {
          setAceito(true);
          setMensagemAceite('Você já aceitou este serviço!');
        } else if (data.status === 'expirado') {
          setError('Este convite expirou.');
        } else if (data.status === 'recusado') {
          setError('Você recusou este convite.');
        }
      }
    } catch (err) {
      setError('Link inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  }, []);

  const aceitar = useCallback(async (token: string): Promise<boolean> => {
    setProcessando(true);
    setError(null);
    try {
      const resultado = await aceitarServico(token);

      if (resultado.success) {
        setAceito(true);
        setMensagemAceite(resultado.message);
        if (resultado.servico) {
          setServico(resultado.servico);
        }
        return true;
      } else {
        setError(resultado.message);
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar aceite');
      return false;
    } finally {
      setProcessando(false);
    }
  }, []);

  return {
    servico,
    convidado,
    loading,
    processando,
    error,
    aceito,
    mensagemAceite,
    carregarPorTokenServico,
    carregarPorTokenConvidado,
    aceitar,
  };
}

