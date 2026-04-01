// ============================================================
// MEMORIAL EXECUTIVO - COMPONENTE
// Sistema WG Easy - Grupo WG Almeida
// DescriçÍo detalhada do objeto contratual por núcleo
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Save,
  FileText,
  Building2,
  Wrench,
  Package,
  ShoppingCart,
  X,
} from "lucide-react";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";

/* ==================== TIPOS ==================== */

type ItemMemorial = {
  id: string;
  descricao: string;
  quantidade?: number;
  unidade?: string;
  especificacao?: string;
  observacao?: string;
};

type AmbienteMemorial = {
  id: string;
  nome: string;
  metragem?: number;
  itens: ItemMemorial[];
};

type NucleoMemorial = {
  expandido: boolean;
  ambientes: AmbienteMemorial[];
  itens: ItemMemorial[];
  observacoes: string;
};

type MemorialData = {
  arquitetura: NucleoMemorial;
  engenharia: NucleoMemorial;
  marcenaria: NucleoMemorial;
  materiais: NucleoMemorial;
  produtos: NucleoMemorial;
};

type Props = {
  contratoId: string;
  readOnly?: boolean;
  onSave?: (data: MemorialData) => void;
};

/* ==================== CONSTANTES ==================== */

const NUCLEOS_CONFIG = {
  arquitetura: {
    label: "Arquitetura",
    icone: Building2,
    cor: "#F25C26",
    emoji: "🏛️",
    temAmbientes: true,
  },
  engenharia: {
    label: "Engenharia",
    icone: Wrench,
    cor: "#3B82F6",
    emoji: "⚙️",
    temAmbientes: true,
  },
  marcenaria: {
    label: "Marcenaria Arquitetônica",
    icone: Package,
    cor: "#8B5CF6",
    emoji: "🪵",
    temAmbientes: true,
  },
  materiais: {
    label: "Materiais",
    icone: Package,
    cor: "#F59E0B",
    emoji: "🧰",
    temAmbientes: false,
  },
  produtos: {
    label: "Produtos",
    icone: ShoppingCart,
    cor: "#10B981",
    emoji: "🛒",
    temAmbientes: false,
  },
};

const MEMORIAL_INICIAL: MemorialData = {
  arquitetura: { expandido: false, ambientes: [], itens: [], observacoes: "" },
  engenharia: { expandido: false, ambientes: [], itens: [], observacoes: "" },
  marcenaria: { expandido: false, ambientes: [], itens: [], observacoes: "" },
  materiais: { expandido: false, ambientes: [], itens: [], observacoes: "" },
  produtos: { expandido: false, ambientes: [], itens: [], observacoes: "" },
};

/* ==================== COMPONENTE PRINCIPAL ==================== */

export default function MemorialExecutivo({ contratoId, readOnly = false, onSave }: Props) {
  const [memorial, setMemorial] = useState<MemorialData>(MEMORIAL_INICIAL);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [_editandoItem, setEditandoItem] = useState<string | null>(null);

  const carregarMemorial = useCallback(async () => {
    if (!contratoId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("juridico_memorial_executivo")
        .select("*")
        .eq("contrato_id", contratoId)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setMemorial({
          arquitetura: {
            expandido: false,
            ambientes: data.arquitetura?.ambientes || [],
            itens: data.arquitetura?.itens || [],
            observacoes: data.arquitetura?.observacoes || "",
          },
          engenharia: {
            expandido: false,
            ambientes: data.engenharia?.ambientes || [],
            itens: data.engenharia?.itens || [],
            observacoes: data.engenharia?.observacoes || "",
          },
          marcenaria: {
            expandido: false,
            ambientes: data.marcenaria?.ambientes || [],
            itens: data.marcenaria?.itens || [],
            observacoes: data.marcenaria?.observacoes || "",
          },
          materiais: {
            expandido: false,
            ambientes: [],
            itens: data.materiais?.itens || [],
            observacoes: data.materiais?.observacoes || "",
          },
          produtos: {
            expandido: false,
            ambientes: [],
            itens: data.produtos?.itens || [],
            observacoes: data.produtos?.observacoes || "",
          },
        });
      }
    } catch (error: any) {
      console.error("Erro ao carregar memorial:", error);
    } finally {
      setLoading(false);
    }
  }, [contratoId]);

  useEffect(() => {
    carregarMemorial();
  }, [carregarMemorial]);

  // Salvar memorial
  async function salvarMemorial() {
    if (!contratoId) return;

    setSaving(true);
    try {
      // Preparar dados para salvar
      const dadosMemorial = {
        contrato_id: contratoId,
        arquitetura: {
          ambientes: memorial.arquitetura.ambientes,
          itens: memorial.arquitetura.itens,
          observacoes: memorial.arquitetura.observacoes,
        },
        engenharia: {
          ambientes: memorial.engenharia.ambientes,
          itens: memorial.engenharia.itens,
          observacoes: memorial.engenharia.observacoes,
        },
        marcenaria: {
          ambientes: memorial.marcenaria.ambientes,
          itens: memorial.marcenaria.itens,
          observacoes: memorial.marcenaria.observacoes,
        },
        materiais: {
          itens: memorial.materiais.itens,
          observacoes: memorial.materiais.observacoes,
        },
        produtos: {
          itens: memorial.produtos.itens,
          observacoes: memorial.produtos.observacoes,
        },
        texto_clausula_objeto: gerarTextoClausula(),
        snapshot_data: memorial,
        snapshot_gerado_em: new Date().toISOString(),
      };

      // Upsert
      const { error } = await supabase
        .from("juridico_memorial_executivo")
        .upsert(dadosMemorial, { onConflict: "contrato_id" });

      if (error) throw error;

      alert("Memorial salvo com sucesso!");
      onSave?.(memorial);
    } catch (error: any) {
      console.error("Erro ao salvar memorial:", error);
      alert("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  // Gerar texto para cláusula do objeto
  function gerarTextoClausula(): string {
    const partes: string[] = [];

    Object.entries(memorial).forEach(([nucleoKey, nucleo]) => {
      const config = NUCLEOS_CONFIG[nucleoKey as keyof typeof NUCLEOS_CONFIG];
      const itensNucleo: string[] = [];

      // Itens com ambientes
      if (nucleo.ambientes.length > 0) {
        nucleo.ambientes.forEach((ambiente) => {
          if (ambiente.itens.length > 0) {
            const itensAmbiente = ambiente.itens
              .map((item) => {
                let texto = item.descricao;
                if (item.quantidade && item.unidade) {
                  texto += ` (${item.quantidade} ${item.unidade})`;
                }
                return texto;
              })
              .join(", ");

            itensNucleo.push(
              `${ambiente.nome}${ambiente.metragem ? ` (${ambiente.metragem}m²)` : ""}: ${itensAmbiente}`
            );
          }
        });
      }

      // Itens diretos
      if (nucleo.itens.length > 0) {
        nucleo.itens.forEach((item) => {
          let texto = item.descricao;
          if (item.quantidade && item.unidade) {
            texto += ` - ${item.quantidade} ${item.unidade}`;
          }
          if (item.especificacao) {
            texto += ` (${item.especificacao})`;
          }
          itensNucleo.push(texto);
        });
      }

      if (itensNucleo.length > 0) {
        partes.push(`<strong>${config.emoji} ${config.label}:</strong><br/>- ${itensNucleo.join("<br/>- ")}`);
      }

      if (nucleo.observacoes) {
        partes.push(`<em>Observações (${config.label}):</em> ${nucleo.observacoes}`);
      }
    });

    return partes.join("<br/><br/>");
  }

  // Toggle expansÍo do núcleo
  function toggleNucleo(nucleoKey: keyof MemorialData) {
    setMemorial((prev) => ({
      ...prev,
      [nucleoKey]: {
        ...prev[nucleoKey],
        expandido: !prev[nucleoKey].expandido,
      },
    }));
  }

  // Adicionar ambiente
  function adicionarAmbiente(nucleoKey: keyof MemorialData) {
    const novoAmbiente: AmbienteMemorial = {
      id: crypto.randomUUID(),
      nome: "",
      metragem: undefined,
      itens: [],
    };

    setMemorial((prev) => ({
      ...prev,
      [nucleoKey]: {
        ...prev[nucleoKey],
        ambientes: [...prev[nucleoKey].ambientes, novoAmbiente],
      },
    }));
  }

  // Atualizar ambiente
  function atualizarAmbiente(
    nucleoKey: keyof MemorialData,
    ambienteId: string,
    campo: keyof AmbienteMemorial,
    valor: any
  ) {
    setMemorial((prev) => ({
      ...prev,
      [nucleoKey]: {
        ...prev[nucleoKey],
        ambientes: prev[nucleoKey].ambientes.map((amb) =>
          amb.id === ambienteId ? { ...amb, [campo]: valor } : amb
        ),
      },
    }));
  }

  // Remover ambiente
  function removerAmbiente(nucleoKey: keyof MemorialData, ambienteId: string) {
    if (!confirm("Deseja remover este ambiente e todos os seus itens?")) return;

    setMemorial((prev) => ({
      ...prev,
      [nucleoKey]: {
        ...prev[nucleoKey],
        ambientes: prev[nucleoKey].ambientes.filter((amb) => amb.id !== ambienteId),
      },
    }));
  }

  // Adicionar item ao ambiente
  function adicionarItemAmbiente(nucleoKey: keyof MemorialData, ambienteId: string) {
    const novoItem: ItemMemorial = {
      id: crypto.randomUUID(),
      descricao: "",
      quantidade: undefined,
      unidade: "",
      observacao: "",
    };

    setMemorial((prev) => ({
      ...prev,
      [nucleoKey]: {
        ...prev[nucleoKey],
        ambientes: prev[nucleoKey].ambientes.map((amb) =>
          amb.id === ambienteId
            ? { ...amb, itens: [...amb.itens, novoItem] }
            : amb
        ),
      },
    }));

    setEditandoItem(novoItem.id);
  }

  // Adicionar item direto ao núcleo
  function adicionarItemNucleo(nucleoKey: keyof MemorialData) {
    const novoItem: ItemMemorial = {
      id: crypto.randomUUID(),
      descricao: "",
      quantidade: undefined,
      unidade: "",
      especificacao: "",
      observacao: "",
    };

    setMemorial((prev) => ({
      ...prev,
      [nucleoKey]: {
        ...prev[nucleoKey],
        itens: [...prev[nucleoKey].itens, novoItem],
      },
    }));

    setEditandoItem(novoItem.id);
  }

  // Atualizar item do ambiente
  function atualizarItemAmbiente(
    nucleoKey: keyof MemorialData,
    ambienteId: string,
    itemId: string,
    campo: keyof ItemMemorial,
    valor: any
  ) {
    setMemorial((prev) => ({
      ...prev,
      [nucleoKey]: {
        ...prev[nucleoKey],
        ambientes: prev[nucleoKey].ambientes.map((amb) =>
          amb.id === ambienteId
            ? {
                ...amb,
                itens: amb.itens.map((item) =>
                  item.id === itemId ? { ...item, [campo]: valor } : item
                ),
              }
            : amb
        ),
      },
    }));
  }

  // Atualizar item direto
  function atualizarItemNucleo(
    nucleoKey: keyof MemorialData,
    itemId: string,
    campo: keyof ItemMemorial,
    valor: any
  ) {
    setMemorial((prev) => ({
      ...prev,
      [nucleoKey]: {
        ...prev[nucleoKey],
        itens: prev[nucleoKey].itens.map((item) =>
          item.id === itemId ? { ...item, [campo]: valor } : item
        ),
      },
    }));
  }

  // Remover item do ambiente
  function removerItemAmbiente(nucleoKey: keyof MemorialData, ambienteId: string, itemId: string) {
    setMemorial((prev) => ({
      ...prev,
      [nucleoKey]: {
        ...prev[nucleoKey],
        ambientes: prev[nucleoKey].ambientes.map((amb) =>
          amb.id === ambienteId
            ? { ...amb, itens: amb.itens.filter((item) => item.id !== itemId) }
            : amb
        ),
      },
    }));
  }

  // Remover item direto
  function removerItemNucleo(nucleoKey: keyof MemorialData, itemId: string) {
    setMemorial((prev) => ({
      ...prev,
      [nucleoKey]: {
        ...prev[nucleoKey],
        itens: prev[nucleoKey].itens.filter((item) => item.id !== itemId),
      },
    }));
  }

  // Atualizar observações
  function atualizarObservacoes(nucleoKey: keyof MemorialData, valor: string) {
    setMemorial((prev) => ({
      ...prev,
      [nucleoKey]: {
        ...prev[nucleoKey],
        observacoes: valor,
      },
    }));
  }

  // Contar itens totais
  function contarItens(nucleo: NucleoMemorial): number {
    const itensAmbientes = nucleo.ambientes.reduce((acc, amb) => acc + amb.itens.length, 0);
    return itensAmbientes + nucleo.itens.length;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F25C26]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-normal text-[#1A1A1A] flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#F25C26]" />
            Memorial Executivo
          </h3>
          <p className="text-xs text-gray-500">
            DescriçÍo detalhada do objeto contratual por núcleo
          </p>
        </div>

        {!readOnly && (
          <button
            onClick={salvarMemorial}
            disabled={saving}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar Memorial
          </button>
        )}
      </div>

      {/* NÚCLEOS */}
      <div className="space-y-3">
        {Object.entries(NUCLEOS_CONFIG).map(([nucleoKey, config]) => {
          const nucleo = memorial[nucleoKey as keyof MemorialData];
          const totalItens = contarItens(nucleo);
            return (
            <div
              key={nucleoKey}
              className="border border-gray-200 rounded-xl overflow-hidden"
            >
              {/* Header do Núcleo */}
              <button
                type="button"
                onClick={() => toggleNucleo(nucleoKey as keyof MemorialData)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{config.emoji}</span>
                  <div className="text-left">
                    <h4 className="font-normal text-gray-900">{config.label}</h4>
                    <p className="text-xs text-gray-500">
                      {totalItens} {totalItens === 1 ? "item" : "itens"}
                      {nucleo.ambientes.length > 0 &&
                        ` em ${nucleo.ambientes.length} ${nucleo.ambientes.length === 1 ? "ambiente" : "ambientes"}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: totalItens > 0 ? config.cor : "#E5E7EB" }}
                  />
                  {nucleo.expandido ? (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Conteúdo Expandido */}
              <AnimatePresence>
                {nucleo.expandido && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-200"
                  >
                    <div className="p-4 space-y-4">
                      {/* AMBIENTES (se aplicável) */}
                      {config.temAmbientes && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Ambientes</span>
                            {!readOnly && (
                              <button
                                type="button"
                                onClick={() => adicionarAmbiente(nucleoKey as keyof MemorialData)}
                                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-1"
                              >
                                <Plus className="h-3 w-3" /> Ambiente
                              </button>
                            )}
                          </div>

                          {nucleo.ambientes.length === 0 ? (
                            <p className="text-xs text-gray-500 text-center py-4">
                              Nenhum ambiente adicionado
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {nucleo.ambientes.map((ambiente) => (
                                <div
                                  key={ambiente.id}
                                  className="bg-gray-50 rounded-lg p-3 space-y-3"
                                >
                                  {/* Info do Ambiente */}
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="text"
                                      value={ambiente.nome}
                                      onChange={(e) =>
                                        atualizarAmbiente(
                                          nucleoKey as keyof MemorialData,
                                          ambiente.id,
                                          "nome",
                                          e.target.value
                                        )
                                      }
                                      placeholder="Nome do ambiente"
                                      disabled={readOnly}
                                      className="flex-1 border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-[#F25C26] disabled:bg-gray-100"
                                    />
                                    <input
                                      type="number"
                                      value={ambiente.metragem || ""}
                                      onChange={(e) =>
                                        atualizarAmbiente(
                                          nucleoKey as keyof MemorialData,
                                          ambiente.id,
                                          "metragem",
                                          parseFloat(e.target.value) || undefined
                                        )
                                      }
                                      placeholder="m²"
                                      disabled={readOnly}
                                      className="w-20 border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-[#F25C26] disabled:bg-gray-100"
                                    />
                                    {!readOnly && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removerAmbiente(nucleoKey as keyof MemorialData, ambiente.id)
                                        }
                                        className="p-1 hover:bg-red-100 text-red-500 rounded"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>

                                  {/* Itens do Ambiente */}
                                  <div className="space-y-2 pl-4 border-l-2 border-gray-300">
                                    {ambiente.itens.map((item) => (
                                      <div
                                        key={item.id}
                                        className="flex items-center gap-2 text-sm"
                                      >
                                        <input
                                          type="text"
                                          value={item.descricao}
                                          onChange={(e) =>
                                            atualizarItemAmbiente(
                                              nucleoKey as keyof MemorialData,
                                              ambiente.id,
                                              item.id,
                                              "descricao",
                                              e.target.value
                                            )
                                          }
                                          placeholder="DescriçÍo do item"
                                          disabled={readOnly}
                                          className="flex-1 border rounded px-2 py-1 text-xs focus:ring-2 focus:ring-[#F25C26] disabled:bg-gray-100"
                                        />
                                        <input
                                          type="number"
                                          value={item.quantidade || ""}
                                          onChange={(e) =>
                                            atualizarItemAmbiente(
                                              nucleoKey as keyof MemorialData,
                                              ambiente.id,
                                              item.id,
                                              "quantidade",
                                              parseFloat(e.target.value) || undefined
                                            )
                                          }
                                          placeholder="Qtd"
                                          disabled={readOnly}
                                          className="w-16 border rounded px-2 py-1 text-xs focus:ring-2 focus:ring-[#F25C26] disabled:bg-gray-100"
                                        />
                                        <input
                                          type="text"
                                          value={item.unidade || ""}
                                          onChange={(e) =>
                                            atualizarItemAmbiente(
                                              nucleoKey as keyof MemorialData,
                                              ambiente.id,
                                              item.id,
                                              "unidade",
                                              e.target.value
                                            )
                                          }
                                          placeholder="Un"
                                          disabled={readOnly}
                                          className="w-16 border rounded px-2 py-1 text-xs focus:ring-2 focus:ring-[#F25C26] disabled:bg-gray-100"
                                        />
                                        {!readOnly && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              removerItemAmbiente(
                                                nucleoKey as keyof MemorialData,
                                                ambiente.id,
                                                item.id
                                              )
                                            }
                                            className="p-1 hover:bg-red-100 text-red-400 rounded"
                                          >
                                            <X className="h-3 w-3" />
                                          </button>
                                        )}
                                      </div>
                                    ))}

                                    {!readOnly && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          adicionarItemAmbiente(
                                            nucleoKey as keyof MemorialData,
                                            ambiente.id
                                          )
                                        }
                                        className="text-xs text-[#F25C26] hover:underline flex items-center gap-1"
                                      >
                                        <Plus className="h-3 w-3" /> Adicionar item
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* ITENS DIRETOS (Materiais/Produtos) */}
                      {!config.temAmbientes && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Itens</span>
                            {!readOnly && (
                              <button
                                type="button"
                                onClick={() => adicionarItemNucleo(nucleoKey as keyof MemorialData)}
                                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-1"
                              >
                                <Plus className="h-3 w-3" /> Item
                              </button>
                            )}
                          </div>

                          {nucleo.itens.length === 0 ? (
                            <p className="text-xs text-gray-500 text-center py-4">
                              Nenhum item adicionado
                            </p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">
                                      DescriçÍo
                                    </th>
                                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">
                                      Qtd
                                    </th>
                                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">
                                      Un
                                    </th>
                                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">
                                      EspecificaçÍo
                                    </th>
                                    {!readOnly && <th className="px-2 py-1 w-8"></th>}
                                  </tr>
                                </thead>
                                <tbody>
                                  {nucleo.itens.map((item) => (
                                    <tr key={item.id} className="border-b border-gray-100">
                                      <td className="px-2 py-1">
                                        <input
                                          type="text"
                                          value={item.descricao}
                                          onChange={(e) =>
                                            atualizarItemNucleo(
                                              nucleoKey as keyof MemorialData,
                                              item.id,
                                              "descricao",
                                              e.target.value
                                            )
                                          }
                                          disabled={readOnly}
                                          className="w-full border-0 bg-transparent text-xs focus:ring-0 disabled:bg-transparent"
                                          placeholder="DescriçÍo"
                                        />
                                      </td>
                                      <td className="px-2 py-1">
                                        <input
                                          type="number"
                                          value={item.quantidade || ""}
                                          onChange={(e) =>
                                            atualizarItemNucleo(
                                              nucleoKey as keyof MemorialData,
                                              item.id,
                                              "quantidade",
                                              parseFloat(e.target.value) || undefined
                                            )
                                          }
                                          disabled={readOnly}
                                          className="w-16 border-0 bg-transparent text-xs focus:ring-0"
                                          placeholder="0"
                                        />
                                      </td>
                                      <td className="px-2 py-1">
                                        <input
                                          type="text"
                                          value={item.unidade || ""}
                                          onChange={(e) =>
                                            atualizarItemNucleo(
                                              nucleoKey as keyof MemorialData,
                                              item.id,
                                              "unidade",
                                              e.target.value
                                            )
                                          }
                                          disabled={readOnly}
                                          className="w-12 border-0 bg-transparent text-xs focus:ring-0"
                                          placeholder="un"
                                        />
                                      </td>
                                      <td className="px-2 py-1">
                                        <input
                                          type="text"
                                          value={item.especificacao || ""}
                                          onChange={(e) =>
                                            atualizarItemNucleo(
                                              nucleoKey as keyof MemorialData,
                                              item.id,
                                              "especificacao",
                                              e.target.value
                                            )
                                          }
                                          disabled={readOnly}
                                          className="w-full border-0 bg-transparent text-xs focus:ring-0"
                                          placeholder="Marca, modelo..."
                                        />
                                      </td>
                                      {!readOnly && (
                                        <td className="px-2 py-1">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              removerItemNucleo(
                                                nucleoKey as keyof MemorialData,
                                                item.id
                                              )
                                            }
                                            className="p-1 hover:bg-red-100 text-red-400 rounded"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        </td>
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}

                      {/* OBSERVAÇÕES */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">
                          Observações
                        </label>
                        <textarea
                          value={nucleo.observacoes}
                          onChange={(e) =>
                            atualizarObservacoes(nucleoKey as keyof MemorialData, e.target.value)
                          }
                          disabled={readOnly}
                          rows={2}
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#F25C26] disabled:bg-gray-100"
                          placeholder="Observações específicas deste núcleo..."
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

