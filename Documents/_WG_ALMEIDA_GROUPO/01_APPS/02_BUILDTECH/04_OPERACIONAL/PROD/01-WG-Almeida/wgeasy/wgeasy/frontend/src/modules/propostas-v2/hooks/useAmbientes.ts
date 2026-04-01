/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// useAmbientes - Hook para gerenciar ambientes da proposta
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { useState, useCallback, useMemo } from "react";
import type { Ambiente, AmbienteInput, TotaisAmbientes, AmbienteExtraido } from "../types";

export interface UseAmbientesReturn {
  ambientes: Ambiente[];
  loading: boolean;
  totais: TotaisAmbientes;
  adicionar: (input: AmbienteInput) => Ambiente;
  atualizar: (id: string, input: Partial<AmbienteInput>) => void;
  remover: (id: string) => void;
  importar: (ambientesExtraidos: AmbienteExtraido[]) => void;
  setAmbientes: (ambientes: Ambiente[]) => void;
  limpar: () => void;
}

function calcularAreas(
  input: AmbienteInput,
  portas: Ambiente["portas"] = [],
  janelas: Ambiente["janelas"] = [],
  vaos: Ambiente["vaos"] = []
): Omit<Ambiente, "id" | "nome" | "descricao" | "tipo"> {
  const largura = input.largura || 0;
  const comprimento = input.comprimento || 0;
  const peDireito = input.pe_direito || 2.7;

  // Se informou área manual, usar ela
  const usouAreaManual = input.area && input.area > 0;
  const possuiDimensoes = largura > 0 && comprimento > 0;

  const area_piso = usouAreaManual ? input.area! : largura * comprimento;
  const area_teto = area_piso;
  const perimetro = possuiDimensoes ? 2 * (largura + comprimento) : 0;
  const area_paredes_bruta = possuiDimensoes ? perimetro * peDireito : area_piso;

  // Calcular área de vÍos
  const calcularAreaVaos = (lista: typeof portas) =>
    lista.reduce((acc, v) => acc + (v.largura * v.altura * v.quantidade), 0);

  const area_vaos_total = calcularAreaVaos(portas) + calcularAreaVaos(janelas) + calcularAreaVaos(vaos);
  const area_paredes_liquida = Math.max(0, area_paredes_bruta - area_vaos_total);

  // Calcular dimensões a partir da área se necessário
  const larguraFinal = possuiDimensoes ? largura : (usouAreaManual ? Math.sqrt(area_piso) : 0);
  const comprimentoFinal = possuiDimensoes ? comprimento : (usouAreaManual ? Math.sqrt(area_piso) : 0);

  return {
    largura: larguraFinal,
    comprimento: comprimentoFinal,
    pe_direito: peDireito,
    area_piso,
    area_parede: area_paredes_bruta, // Alias
    area_paredes_bruta,
    area_paredes_liquida,
    area_teto,
    perimetro,
    portas,
    janelas,
    vaos,
    area_vaos_total,
    // Revestimentos
    rev_piso_largura: larguraFinal,
    rev_piso_altura: comprimentoFinal,
    rev_piso_area: area_piso,
    rev_parede_perimetro: perimetro,
    rev_parede_altura: peDireito,
    rev_parede_area: area_paredes_liquida,
  };
}

export function useAmbientes(): UseAmbientesReturn {
  const [ambientesRaw, setAmbientesRaw] = useState<Ambiente[]>([]);
  const [loading, setLoading] = useState(false);

  // Ambientes ordenados alfabeticamente pelo nome
  const ambientes = useMemo(() => {
    return [...ambientesRaw].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [ambientesRaw]);

  const totais = useMemo<TotaisAmbientes>(() => {
    return ambientes.reduce((acc, amb) => {
      // Contar portas, janelas e vaos
      const numPortas = (amb.portas || []).reduce((sum, p) => sum + (p.quantidade || 1), 0);
      const numJanelas = (amb.janelas || []).reduce((sum, j) => sum + (j.quantidade || 1), 0);
      const numVaos = (amb.vaos || []).reduce((sum, v) => sum + (v.quantidade || 1), 0);

      return {
        area_piso: acc.area_piso + (amb.area_piso || 0),
        area_parede: acc.area_parede + (amb.area_paredes_liquida || amb.area_parede || 0),
        area_paredes_bruta: acc.area_paredes_bruta + (amb.area_paredes_bruta || amb.area_parede || 0),
        area_paredes_liquida: acc.area_paredes_liquida + (amb.area_paredes_liquida || 0),
        area_teto: acc.area_teto + (amb.area_teto || 0),
        perimetro: acc.perimetro + (amb.perimetro || 0),
        area_vaos_total: acc.area_vaos_total + (amb.area_vaos_total || 0),
        total_portas: acc.total_portas + numPortas,
        total_janelas: acc.total_janelas + numJanelas,
        total_vaos: acc.total_vaos + numVaos,
      };
    }, {
      area_piso: 0,
      area_parede: 0,
      area_paredes_bruta: 0,
      area_paredes_liquida: 0,
      area_teto: 0,
      perimetro: 0,
      area_vaos_total: 0,
      total_portas: 0,
      total_janelas: 0,
      total_vaos: 0,
    });
  }, [ambientes]);

  const adicionar = useCallback((input: AmbienteInput): Ambiente => {
    const areas = calcularAreas(input);
    const novoAmbiente: Ambiente = {
      id: `amb-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      nome: input.nome,
      ...areas,
    };

    setAmbientesRaw(prev => [...prev, novoAmbiente]);
    return novoAmbiente;
  }, []);

  const atualizar = useCallback((id: string, input: Partial<AmbienteInput>) => {
    setAmbientesRaw(prev => prev.map(amb => {
      if (amb.id !== id) return amb;

      const merged: AmbienteInput = {
        nome: input.nome ?? amb.nome,
        largura: input.largura ?? amb.largura,
        comprimento: input.comprimento ?? amb.comprimento,
        pe_direito: input.pe_direito ?? amb.pe_direito,
        area: input.area,
      };

      const areas = calcularAreas(merged, amb.portas, amb.janelas, amb.vaos);
      return {
        ...amb,
        nome: merged.nome,
        ...areas,
      };
    }));
  }, []);

  const remover = useCallback((id: string) => {
    setAmbientesRaw(prev => prev.filter(amb => amb.id !== id));
  }, []);

  const importar = useCallback((ambientesExtraidos: AmbienteExtraido[]) => {
    const novosAmbientes: Ambiente[] = ambientesExtraidos.map(ext => {
      const areas = calcularAreas({
        nome: ext.nome,
        largura: ext.largura,
        comprimento: ext.comprimento,
        pe_direito: ext.pe_direito,
        area: ext.area,
      });

      return {
        id: `amb-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        nome: ext.nome,
        descricao: ext.descricao,
        tipo: ext.tipo,
        ...areas,
      };
    });

    setAmbientesRaw(prev => [...prev, ...novosAmbientes]);
  }, []);

  const limpar = useCallback(() => {
    setAmbientesRaw([]);
  }, []);

  return {
    ambientes,
    loading,
    totais,
    adicionar,
    atualizar,
    remover,
    importar,
    setAmbientes: setAmbientesRaw, // Permite definir ambientes diretamente
    limpar,
  };
}

export default useAmbientes;

