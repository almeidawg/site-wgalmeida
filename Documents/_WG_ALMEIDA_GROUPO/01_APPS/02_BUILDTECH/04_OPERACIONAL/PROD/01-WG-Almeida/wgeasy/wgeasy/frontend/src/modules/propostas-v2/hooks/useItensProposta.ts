// ============================================================
// useItensProposta - Hook para gerenciar itens da proposta
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { useState, useCallback, useMemo } from "react";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import type {
  ItemProposta,
  ItemPricelist,
  Ambiente,
  TotaisGerais,
  TotaisPorNucleo,
  GrupoNucleo
} from "../types";
import type { NucleoItem, Nucleo } from "@/types/propostas";
import { getNucleoLabel, getNucleoColor, getCorProdutos } from "@/types/propostas";

// Flag para habilitar salvamento automático no pricelist (usuário master)
let salvarNoPricelistHabilitado = false;

// FunçÍo para habilitar/desabilitar salvamento no pricelist
export function setSalvarNoPricelist(habilitar: boolean) {
  salvarNoPricelistHabilitado = habilitar;
  console.log(`[useItensProposta] Salvamento automático no pricelist: ${habilitar ? "HABILITADO" : "DESABILITADO"}`);
}

function isUuid(value?: string | null): boolean {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

// FunçÍo para atualizar item no pricelist
async function atualizarItemNoPricelist(
  itemId: string,
  dados: {
    nucleo_id?: string | null;
    categoria_id?: string | null;
    subcategoria_id?: string | null;
    tipo?: string;
  }
) {
  if (!salvarNoPricelistHabilitado) return;

  // Ignorar IDs sintéticos que não pertencem ao pricelist.
  if (!isUuid(itemId)) {
    console.log(`[atualizarItemNoPricelist] Item não-pricelist ignorado: ${itemId}`);
    return;
  }

  try {
    console.log(`[atualizarItemNoPricelist] Atualizando item ${itemId} com:`, dados);

    const { error } = await supabase
      .from("pricelist_itens")
      .update(dados)
      .eq("id", itemId);

    if (error) {
      console.error(`[atualizarItemNoPricelist] Erro ao atualizar:`, error);
    } else {
      console.log(`[atualizarItemNoPricelist] Item ${itemId} atualizado com sucesso`);
    }
  } catch (e) {
    console.error(`[atualizarItemNoPricelist] ExceçÍo:`, e);
  }
}

export interface UseItensPropostaReturn {
  itens: ItemProposta[];
  totais: TotaisGerais;
  totaisPorNucleo: TotaisPorNucleo;
  gruposPorNucleo: GrupoNucleo[];
  adicionar: (item: ItemPricelist, ambienteId?: string, ambientes?: Ambiente[]) => void;
  adicionarMultiplos: (novosItens: ItemProposta[]) => void;
  remover: (id: string) => void;
  atualizarQuantidade: (id: string, quantidade: number) => void;
  atualizarValorUnitario: (id: string, valor: number) => void;
  atualizarDescricao: (id: string, descricao: string) => void;
  atualizarNome: (id: string, nome: string) => void;
  atualizarNucleo: (id: string, nucleo: NucleoItem, nucleo_id?: string) => void | Promise<void>;
  atualizarTipo: (id: string, tipo: "material" | "mao_obra" | "servico" | "produto" | "ambos") => void | Promise<void>;
  atualizarCategoria: (id: string, categoria: string, categoria_id?: string) => void | Promise<void>;
  atualizarSubcategoria: (id: string, subcategoria: string, subcategoria_id?: string) => void | Promise<void>;
  setItens: (itens: ItemProposta[]) => void;
  limpar: () => void;
}

// Obter quantidade inicial baseada no ambiente e unidade
function calcularQuantidadeInicial(
  item: ItemPricelist,
  ambienteId: string | undefined,
  ambientes: Ambiente[] | undefined
): number {
  if (!ambienteId || !ambientes) return 1;

  const ambiente = ambientes.find(a => a.id === ambienteId);
  if (!ambiente) return 1;

  if (item.unidade === "m2") {
    // Categorias de piso (não incluir "revestimento" genérico aqui, só "revestimento piso")
    const categoriaPiso = ["piso", "revestimento piso", "revestimento_piso", "laminado", "vinilico", "contrapiso"];
    // Categorias de parede - usar área LÍQUIDA (descontando portas/janelas)
    const categoriaParede = ["parede", "revestimento parede", "revestimento_parede", "pintura parede", "azulejo", "textura"];
    const categoriaTeto = ["forro", "teto", "gesso", "pintura teto"];

    const catLower = (item.categoria || "").toLowerCase();
    const nomeLower = (item.nome || "").toLowerCase();

    // Primeiro verificar por nome do item (mais específico)
    if (nomeLower.includes("piso") || nomeLower.includes("contrapiso") || nomeLower.includes("laminado")) {
      return Number((ambiente.area_piso || 0).toFixed(2));
    }
    if (nomeLower.includes("parede") || nomeLower.includes("azulejo")) {
      // IMPORTANTE: usar area_paredes_liquida para revestimentos de parede
      const areaParede = ambiente.area_paredes_liquida || ambiente.area_parede || 0;
      return Number(areaParede.toFixed(2));
    }
    if (nomeLower.includes("teto") || nomeLower.includes("forro")) {
      return Number((ambiente.area_teto || ambiente.area_piso || 0).toFixed(2));
    }

    // Depois verificar por categoria
    if (categoriaPiso.some(c => catLower.includes(c))) {
      return Number((ambiente.area_piso || 0).toFixed(2));
    }
    if (categoriaParede.some(c => catLower.includes(c))) {
      // IMPORTANTE: usar area_paredes_liquida para revestimentos de parede
      const areaParede = ambiente.area_paredes_liquida || ambiente.area_parede || 0;
      return Number(areaParede.toFixed(2));
    }
    if (categoriaTeto.some(c => catLower.includes(c))) {
      return Number((ambiente.area_teto || ambiente.area_piso || 0).toFixed(2));
    }

    // Default para m2: área do piso
    return Number((ambiente.area_piso || 0).toFixed(2));
  }

  if (item.unidade === "ml") {
    return Number((ambiente.perimetro || 0).toFixed(2));
  }

  return 1;
}

// Labels e cores para núcleos
function getNucleoLabelSafe(nucleo?: NucleoItem | "sem_nucleo"): string {
  if (!nucleo || nucleo === "sem_nucleo") return "Sem núcleo";
  if (nucleo === "produtos") return "Produtos";
  return getNucleoLabel(nucleo as Nucleo);
}

function getNucleoColorSafe(nucleo?: NucleoItem | "sem_nucleo"): string {
  if (!nucleo || nucleo === "sem_nucleo") return "#6B7280"; // gray-500
  if (nucleo === "produtos") return getCorProdutos();
  return getNucleoColor(nucleo as Nucleo);
}

function normalizarNucleoKey(valor?: string | null): NucleoItem | "sem_nucleo" {
  const nucleo = (valor || "").toLowerCase();
  if (nucleo === "arquitetura" || nucleo === "engenharia" || nucleo === "marcenaria" || nucleo === "produtos") {
    return nucleo;
  }
  return "sem_nucleo";
}

export function useItensProposta(): UseItensPropostaReturn {
  const [itens, setItens] = useState<ItemProposta[]>([]);

  // Totais gerais
  const totais = useMemo<TotaisGerais>(() => {
    return itens.reduce((acc, item) => {
      const subtotal = item.quantidade * item.valor_unitario;
      if (item.item.tipo === "material") {
        acc.materiais += subtotal;
      } else if (item.item.tipo === "mao_obra") {
        acc.maoObra += subtotal;
      } else {
        // Ambos ou outro
        acc.materiais += subtotal / 2;
        acc.maoObra += subtotal / 2;
      }
      acc.total += subtotal;
      return acc;
    }, { materiais: 0, maoObra: 0, total: 0 });
  }, [itens]);

  // Totais por núcleo
  const totaisPorNucleo = useMemo<TotaisPorNucleo>(() => {
    return itens.reduce((acc, item) => {
      const subtotal = item.quantidade * item.valor_unitario;
      const nucleo = item.item.nucleo || "arquitetura";
      const tipo = item.item.tipo;

      acc.totalGeral += subtotal;

      if (nucleo === "arquitetura") {
        acc.arquitetura += subtotal;
      } else if (nucleo === "engenharia") {
        if (tipo === "material") {
          acc.engenhariaMateriais += subtotal;
        } else if (tipo === "mao_obra") {
          acc.engenhariaMaoObra += subtotal;
        } else if (tipo === "ambos") {
          acc.engenhariaMateriais += subtotal / 2;
          acc.engenhariaMaoObra += subtotal / 2;
        } else {
          acc.engenhariaMaoObra += subtotal;
        }
      } else if (nucleo === "marcenaria") {
        acc.marcenaria += subtotal;
      } else if (nucleo === "produtos") {
        acc.produtos += subtotal;
      }

      return acc;
    }, {
      arquitetura: 0,
      engenhariaMaoObra: 0,
      engenhariaMateriais: 0,
      marcenaria: 0,
      produtos: 0,
      totalGeral: 0,
    });
  }, [itens]);

  // Grupos por núcleo
  const gruposPorNucleo = useMemo<GrupoNucleo[]>(() => {
    const grupos: Record<string, GrupoNucleo> = {};

    itens.forEach(item => {
      const nucleo = normalizarNucleoKey(item.item.nucleo);

      if (!grupos[nucleo]) {
        grupos[nucleo] = {
          nucleo,
          label: getNucleoLabelSafe(nucleo),
          cor: getNucleoColorSafe(nucleo),
          itens: [],
          total: 0,
        };
      }

      grupos[nucleo].itens.push(item);
      grupos[nucleo].total += item.quantidade * item.valor_unitario;
    });

    // Ordenar: arquitetura, engenharia, marcenaria, produtos, sem_nucleo
    const ordem: (NucleoItem | "sem_nucleo")[] = ["arquitetura", "engenharia", "marcenaria", "produtos", "sem_nucleo"];
    return ordem
      .map(n => grupos[n])
      .filter(Boolean);
  }, [itens]);

  const adicionar = useCallback((
    item: ItemPricelist,
    ambienteId?: string,
    ambientes?: Ambiente[]
  ) => {
    const quantidade = calcularQuantidadeInicial(item, ambienteId, ambientes);

    const novoItem: ItemProposta = {
      id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
      item,
      ambiente_id: ambienteId,
      ambientes_ids: ambienteId ? [ambienteId] : [],
      quantidade,
      valor_unitario: item.preco,
    };

    setItens(prev => [novoItem, ...prev]);
  }, []);

  const adicionarMultiplos = useCallback((novosItens: ItemProposta[]) => {
    setItens(prev => [...novosItens, ...prev]);
  }, []);

  const remover = useCallback((id: string) => {
    setItens(prev => prev.filter(item => item.id !== id));
  }, []);

  const atualizarQuantidade = useCallback((id: string, quantidade: number) => {
    setItens(prev => prev.map(item =>
      item.id === id ? { ...item, quantidade: Math.max(0.01, quantidade) } : item
    ));
  }, []);

  const atualizarValorUnitario = useCallback((id: string, valor: number) => {
    setItens(prev => prev.map(item =>
      item.id === id ? { ...item, valor_unitario: Math.max(0, valor) } : item
    ));
  }, []);

  const atualizarDescricao = useCallback((id: string, descricao: string) => {
    setItens(prev => prev.map(item =>
      item.id === id ? { ...item, descricao_customizada: descricao } : item
    ));
  }, []);

  const atualizarNome = useCallback((id: string, nome: string) => {
    setItens(prev => prev.map(item =>
      item.id === id ? { ...item, descricao_customizada: nome } : item
    ));
  }, []);

  const atualizarNucleo = useCallback(async (id: string, nucleo: NucleoItem, nucleo_id?: string) => {
    // Atualizar estado local
    let pricelistItemId: string | undefined;
    setItens(prev => prev.map(item => {
      if (item.id === id) {
        pricelistItemId = item.item.id;
        return {
          ...item,
          item: { ...item.item, nucleo, nucleo_id: nucleo_id || null }
        };
      }
      return item;
    }));

    // Salvar no pricelist se habilitado
    if (pricelistItemId && nucleo_id) {
      await atualizarItemNoPricelist(pricelistItemId, { nucleo_id });
    }
  }, []);

  const atualizarCategoria = useCallback(async (id: string, categoria: string, categoria_id?: string) => {
    // Atualizar estado local
    let pricelistItemId: string | undefined;
    setItens(prev => prev.map(item => {
      if (item.id === id) {
        pricelistItemId = item.item.id;
        return {
          ...item,
          item: { ...item.item, categoria, categoria_id: categoria_id || null }
        };
      }
      return item;
    }));

    // Salvar no pricelist se habilitado
    if (pricelistItemId && categoria_id) {
      await atualizarItemNoPricelist(pricelistItemId, { categoria_id });
    }
  }, []);

  const atualizarSubcategoria = useCallback(async (id: string, subcategoria: string, subcategoria_id?: string) => {
    // Atualizar estado local
    let pricelistItemId: string | undefined;
    setItens(prev => prev.map(item => {
      if (item.id === id) {
        pricelistItemId = item.item.id;
        return {
          ...item,
          item: { ...item.item, subcategoria, subcategoria_id: subcategoria_id || null }
        };
      }
      return item;
    }));

    // Salvar no pricelist se habilitado
    if (pricelistItemId && subcategoria_id) {
      await atualizarItemNoPricelist(pricelistItemId, { subcategoria_id });
    }
  }, []);

  const atualizarTipo = useCallback(async (id: string, tipo: "material" | "mao_obra" | "servico" | "produto" | "ambos") => {
    // Atualizar estado local
    let pricelistItemId: string | undefined;
    setItens(prev => prev.map(item => {
      if (item.id === id) {
        pricelistItemId = item.item.id;
        return {
          ...item,
          item: { ...item.item, tipo }
        };
      }
      return item;
    }));

    // Salvar no pricelist se habilitado
    if (pricelistItemId) {
      await atualizarItemNoPricelist(pricelistItemId, { tipo });
    }
  }, []);

  const limpar = useCallback(() => {
    setItens([]);
  }, []);

  return {
    itens,
    totais,
    totaisPorNucleo,
    gruposPorNucleo,
    adicionar,
    adicionarMultiplos,
    remover,
    atualizarQuantidade,
    atualizarValorUnitario,
    atualizarDescricao,
    atualizarNome,
    atualizarNucleo,
    atualizarCategoria,
    atualizarSubcategoria,
    atualizarTipo,
    setItens,
    limpar,
  };
}

export default useItensProposta;


