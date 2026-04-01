// ============================================================
// Hook: useTiposAmbiente
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { useState, useEffect, useCallback } from "react";
import {
  TipoAmbienteDB,
  listarTiposAmbiente,
  criarTipoAmbiente,
  atualizarTipoAmbiente,
  desativarTipoAmbiente,
  verificarUsuarioMaster,
} from "@/lib/tiposAmbienteApi";
import { TIPO_AMBIENTE_LABELS } from "@/types/analiseProjeto";

export interface TipoAmbienteOption {
  codigo: string;
  nome: string;
  id?: string;
  ordem?: number;
}

export interface UseTiposAmbienteReturn {
  tipos: TipoAmbienteOption[];
  loading: boolean;
  isMaster: boolean;
  recarregar: () => Promise<void>;
  adicionar: (nome: string) => Promise<TipoAmbienteOption>;
  atualizar: (id: string, nome: string) => Promise<void>;
  remover: (id: string) => Promise<void>;
}

/**
 * Hook para gerenciar tipos de ambiente
 * Carrega do banco de dados se disponível, senão usa os tipos estáticos
 */
export function useTiposAmbiente(): UseTiposAmbienteReturn {
  const [tiposDB, setTiposDB] = useState<TipoAmbienteDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMaster, setIsMaster] = useState(false);
  const [usandoBanco, setUsandoBanco] = useState(false);

  // Carregar tipos do banco
  const carregarTipos = useCallback(async () => {
    try {
      setLoading(true);

      // Tentar carregar do banco
      const tiposBanco = await listarTiposAmbiente();
      console.log("[useTiposAmbiente] Tipos do banco:", tiposBanco.length);

      if (tiposBanco && tiposBanco.length > 0) {
        setTiposDB(tiposBanco);
        setUsandoBanco(true);
      } else {
        // Banco vazio - usar tipos estáticos
        console.log("[useTiposAmbiente] Banco vazio, usando tipos estáticos");
        setTiposDB([]);
        setUsandoBanco(false);
      }
    } catch (error) {
      // Se falhar (tabela não existe), usar tipos estáticos
      console.warn("[useTiposAmbiente] Erro ao carregar, usando tipos estáticos:", error);
      setTiposDB([]);
      setUsandoBanco(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Verificar se usuário é MASTER
  const verificarPermissao = useCallback(async () => {
    try {
      const ehMaster = await verificarUsuarioMaster();
      setIsMaster(ehMaster);
    } catch {
      setIsMaster(false);
    }
  }, []);

  // Carregar na montagem
  useEffect(() => {
    carregarTipos();
    verificarPermissao();
  }, [carregarTipos, verificarPermissao]);

  // Converter para formato de opções (ordenado alfabeticamente)
  const tipos: TipoAmbienteOption[] = usandoBanco
    ? tiposDB.map((t) => ({
        id: t.id,
        codigo: t.codigo,
        nome: t.nome,
        ordem: t.ordem,
      }))
    : Object.entries(TIPO_AMBIENTE_LABELS)
        .map(([codigo, nome], index) => ({
          codigo,
          nome,
          ordem: index + 1,
        }))
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')); // OrdenaçÍo alfabética

  // Adicionar novo tipo
  const adicionar = useCallback(async (nome: string): Promise<TipoAmbienteOption> => {
    if (!isMaster) {
      throw new Error("Apenas usuários MASTER podem adicionar tipos");
    }

    // Gerar código a partir do nome
    const codigo = nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    const novo = await criarTipoAmbiente({ codigo, nome });
    await carregarTipos();

    return {
      id: novo.id,
      codigo: novo.codigo,
      nome: novo.nome,
      ordem: novo.ordem,
    };
  }, [isMaster, carregarTipos]);

  // Atualizar tipo
  const atualizar = useCallback(async (id: string, nome: string): Promise<void> => {
    if (!isMaster) {
      throw new Error("Apenas usuários MASTER podem editar tipos");
    }

    await atualizarTipoAmbiente(id, { nome });
    await carregarTipos();
  }, [isMaster, carregarTipos]);

  // Remover tipo (desativar)
  const remover = useCallback(async (id: string): Promise<void> => {
    if (!isMaster) {
      throw new Error("Apenas usuários MASTER podem remover tipos");
    }

    await desativarTipoAmbiente(id);
    await carregarTipos();
  }, [isMaster, carregarTipos]);

  return {
    tipos,
    loading,
    isMaster,
    recarregar: carregarTipos,
    adicionar,
    atualizar,
    remover,
  };
}

export default useTiposAmbiente;


