/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// useSugestoesIA - Hook para gerenciar sugestões da IA
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { useState, useCallback } from "react";
import { buscarAnalise, vincularAnaliseAProposta } from "@/lib/analiseProjetoApi";
import { buscarQuantitativoProjetoCompleto } from "@/services/quantitativosApi";
import type { SugestaoIA, ItemPricelist, ItemProposta, Ambiente } from "../types";

export interface UseSugestoesIAReturn {
  sugestoes: SugestaoIA[];
  loading: boolean;
  analiseVinculadaId: string | null;
  quantitativoVinculadoId: string | null;
  carregarDeAnalise: (analiseId: string, itensPricelist: ItemPricelist[]) => Promise<{
    ambientes: Ambiente[];
    itensSugeridos: ItemProposta[];
  } | null>;
  carregarDeQuantitativo: (quantitativoId: string, itensPricelist: ItemPricelist[]) => Promise<{
    ambientes: Ambiente[];
    itensSugeridos: ItemProposta[];
  } | null>;
  limpar: () => void;
}

export function useSugestoesIA(): UseSugestoesIAReturn {
  const [sugestoes, setSugestoes] = useState<SugestaoIA[]>([]);
  const [loading, setLoading] = useState(false);
  const [analiseVinculadaId, setAnaliseVinculadaId] = useState<string | null>(null);
  const [quantitativoVinculadoId, setQuantitativoVinculadoId] = useState<string | null>(null);

  // Carregar dados de uma Análise de Projeto
  const carregarDeAnalise = useCallback(async (
    analiseId: string,
    itensPricelist: ItemPricelist[]
  ): Promise<{
    ambientes: Ambiente[];
    itensSugeridos: ItemProposta[];
  } | null> => {
    try {
      setLoading(true);
      const analise = await buscarAnalise(analiseId);
      if (!analise) return null;

      setAnaliseVinculadaId(analiseId);

      // Converter ambientes
      const ambientes: Ambiente[] = [];
      if (analise.ambientes && analise.ambientes.length > 0) {
        for (const amb of analise.ambientes) {
          const largura = amb.largura || 0;
          const comprimento = amb.comprimento || 0;
          const peDireito = amb.pe_direito || 2.7;
          const areaPiso = amb.area_piso || (largura * comprimento) || 0;
          const perimetro = amb.perimetro || (largura && comprimento ? 2 * (largura + comprimento) : 0);
          const areaParede = amb.area_paredes_liquida || (perimetro * peDireito) || 0;

          ambientes.push({
            id: amb.id,
            nome: amb.nome,
            largura,
            comprimento,
            pe_direito: peDireito,
            area_piso: areaPiso,
            area_parede: areaParede,
            area_teto: amb.area_teto || areaPiso,
            perimetro,
            area_paredes_bruta: areaParede,
            area_paredes_liquida: areaParede,
            portas: [],
            janelas: [],
            vaos: [],
            area_vaos_total: 0,
          });
        }
      }

      // Sugerir itens baseados nos acabamentos
      const itensSugeridos: ItemProposta[] = [];
      if (analise.acabamentos && analise.acabamentos.length > 0 && itensPricelist.length > 0) {
        for (const acabamento of analise.acabamentos) {
          const termoBusca = acabamento.material || acabamento.tipo || "";
          const itemEncontrado = itensPricelist.find(item => {
            const nomeNorm = item.nome.toLowerCase();
            const descNorm = (item.descricao || "").toLowerCase();
            const termoNorm = termoBusca.toLowerCase();
            return nomeNorm.includes(termoNorm) || descNorm.includes(termoNorm);
          });

          if (itemEncontrado) {
            const ambienteEncontrado = ambientes.find(
              a => a.nome.toLowerCase() === (acabamento.ambiente || "").toLowerCase()
            );

            let quantidade = acabamento.area || acabamento.quantidade || 1;
            if (acabamento.tipo === "piso" && ambienteEncontrado) {
              quantidade = ambienteEncontrado.area_piso;
            } else if (acabamento.tipo === "parede" && ambienteEncontrado) {
              quantidade = ambienteEncontrado.area_parede;
            } else if (acabamento.tipo === "teto" && ambienteEncontrado) {
              quantidade = ambienteEncontrado.area_teto;
            } else if (acabamento.tipo === "rodape" && ambienteEncontrado) {
              quantidade = ambienteEncontrado.perimetro;
            }

            // Evitar duplicatas
            const jaAdicionado = itensSugeridos.some(
              i => i.item.id === itemEncontrado.id && i.ambiente_id === ambienteEncontrado?.id
            );

            if (!jaAdicionado && quantidade > 0) {
              itensSugeridos.push({
                id: `sugerido-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                item: itemEncontrado,
                ambiente_id: ambienteEncontrado?.id,
                ambientes_ids: ambienteEncontrado ? [ambienteEncontrado.id] : [],
                quantidade: Math.ceil(quantidade * 1.1), // 10% de margem
                valor_unitario: itemEncontrado.preco,
                descricao_customizada: acabamento.descricao || undefined,
              });

              // Adicionar como sugestÍo
              setSugestoes(prev => [...prev, {
                id: `sug-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                tipo: "acabamento",
                ambiente: acabamento.ambiente,
                descricao: `${acabamento.tipo}: ${acabamento.material || acabamento.descricao}`,
                itemSugerido: itemEncontrado,
                quantidade: Math.ceil(quantidade * 1.1),
                prioridade: "alta",
                origem: "analise_projeto",
              }]);
            }
          }
        }
      }

      return { ambientes, itensSugeridos };
    } catch (error) {
      console.error("Erro ao carregar análise:", error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar dados de um Quantitativo
  const carregarDeQuantitativo = useCallback(async (
    quantitativoId: string,
    itensPricelist: ItemPricelist[]
  ): Promise<{
    ambientes: Ambiente[];
    itensSugeridos: ItemProposta[];
  } | null> => {
    try {
      setLoading(true);
      const quantitativo = await buscarQuantitativoProjetoCompleto(quantitativoId);
      if (!quantitativo) return null;

      setQuantitativoVinculadoId(quantitativoId);

      // Converter ambientes
      const ambientes: Ambiente[] = [];
      if (quantitativo.ambientes && quantitativo.ambientes.length > 0) {
        for (const amb of quantitativo.ambientes) {
          const largura = amb.largura || 0;
          const comprimento = amb.comprimento || 0;
          const peDireito = amb.pe_direito || 2.7;
          const areaPiso = amb.area || (largura * comprimento) || 0;
          const perimetro = amb.perimetro || (largura && comprimento ? 2 * (largura + comprimento) : 0);
          const areaParede = perimetro * peDireito;

          ambientes.push({
            id: amb.id,
            nome: amb.nome,
            largura,
            comprimento,
            pe_direito: peDireito,
            area_piso: areaPiso,
            area_parede: areaParede,
            area_teto: areaPiso,
            perimetro,
            area_paredes_bruta: areaParede,
            area_paredes_liquida: areaParede,
            portas: [],
            janelas: [],
            vaos: [],
            area_vaos_total: 0,
          });
        }
      }

      // Importar itens
      const itensSugeridos: ItemProposta[] = [];
      if (quantitativo.ambientes) {
        for (const ambiente of quantitativo.ambientes) {
          if (!ambiente.categorias) continue;

          for (const categoria of ambiente.categorias) {
            if (!categoria.itens) continue;

            for (const item of categoria.itens) {
              const itemPricelist = itensPricelist.find(
                p => p.id === item.pricelist_item_id ||
                     p.codigo === item.codigo ||
                     p.nome.toLowerCase() === item.nome.toLowerCase()
              );

              if (itemPricelist) {
                itensSugeridos.push({
                  id: `qtd-${item.id}-${Date.now()}`,
                  item: itemPricelist,
                  ambiente_id: ambiente.id,
                  quantidade: item.quantidade || 1,
                  valor_unitario: item.preco_unitario || itemPricelist.preco,
                  descricao_customizada: item.descricao || undefined,
                });
              }
            }
          }
        }
      }

      return { ambientes, itensSugeridos };
    } catch (error) {
      console.error("Erro ao carregar quantitativo:", error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const limpar = useCallback(() => {
    setSugestoes([]);
    setAnaliseVinculadaId(null);
    setQuantitativoVinculadoId(null);
  }, []);

  return {
    sugestoes,
    loading,
    analiseVinculadaId,
    quantitativoVinculadoId,
    carregarDeAnalise,
    carregarDeQuantitativo,
    limpar,
  };
}

export default useSugestoesIA;

