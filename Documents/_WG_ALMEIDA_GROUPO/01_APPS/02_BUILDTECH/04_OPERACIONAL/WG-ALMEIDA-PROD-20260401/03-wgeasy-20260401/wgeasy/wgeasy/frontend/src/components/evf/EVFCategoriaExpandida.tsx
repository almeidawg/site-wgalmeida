// ============================================================================
// EVFCategoriaExpandida — ExpansÍo inteligente de itens do pricelist por categoria EVF
// Sistema WG Easy - Grupo WG Almeida
// ============================================================================

import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Clock } from "lucide-react";
import type { PricelistItemCompleto } from "@/types/pricelist";
import type { PricelistCategoryFlow, FlowResourceKey } from "@/types/pricelist";
import { FLOW_RESOURCE_LABELS } from "@/types/pricelist";
import { formatarMoeda } from "@/types/evf";

// ============================================================================
// TIPOS
// ============================================================================

interface EVFCategoriaExpandidaProps {
  categoriaEVF: string;
  categoriaNome: string;
  itensPricelist: PricelistItemCompleto[];
  flow: PricelistCategoryFlow | null;
  valorTotal: number;
  corCategoria: string;
}

interface GrupoItens {
  id: string;
  nome: string;
  itens: PricelistItemCompleto[];
  subtotal: number;
}

// ============================================================================
// BADGES DE TIPO
// ============================================================================

const TIPO_BADGES: Record<string, { label: string; cor: string; bg: string }> = {
  mao_obra: { label: "MDO", cor: "#3B82F6", bg: "#DBEAFE" },
  servico: { label: "SRV", cor: "#8B5CF6", bg: "#EDE9FE" },
  material: { label: "MAT", cor: "#F59E0B", bg: "#FEF3C7" },
  produto: { label: "PRO", cor: "#10B981", bg: "#D1FAE5" },
};

function TipoBadge({ tipo }: { tipo?: string | null }) {
  if (!tipo) return null;
  const badge = TIPO_BADGES[tipo];
  if (!badge) return null;
  return (
    <span
      className="text-[8px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
      style={{ backgroundColor: badge.bg, color: badge.cor }}
    >
      {badge.label}
    </span>
  );
}

// ============================================================================
// RESOURCE KEY BADGE (para flows)
// ============================================================================

const RESOURCE_BADGES: Record<FlowResourceKey, { cor: string; bg: string }> = {
  ferramenta: { cor: "#6B7280", bg: "#F3F4F6" },
  insumo: { cor: "#F59E0B", bg: "#FEF3C7" },
  epi: { cor: "#EF4444", bg: "#FEE2E2" },
  infra: { cor: "#78716C", bg: "#F5F5F4" },
  materialCinza: { cor: "#9CA3AF", bg: "#F3F4F6" },
  acabamento: { cor: "#DB2777", bg: "#FCE7F3" },
  produto: { cor: "#10B981", bg: "#D1FAE5" },
};

// ============================================================================
// SUBCOMPONENTE: Fase do Flow
// ============================================================================

function FaseFlow({
  fase,
  faseIndex,
  corCategoria,
}: {
  fase: PricelistCategoryFlow["fases"][0];
  faseIndex: number;
  corCategoria: string;
}) {
  const [aberta, setAberta] = useState(faseIndex === 0);

  const tempoTotal = fase.tasks.reduce(
    (sum, t) => sum + (t.tempoEstimadoMinutos || 0),
    0
  );

  const recursosUnicos = useMemo(() => {
    const all: { key: FlowResourceKey; value: string }[] = [];
    for (const task of fase.tasks) {
      if (!task.recursos) continue;
      for (const [key, value] of Object.entries(task.recursos)) {
        if (value) {
          all.push({ key: key as FlowResourceKey, value });
        }
      }
    }
    return all;
  }, [fase.tasks]);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      {/* Header da fase */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-50/80 hover:bg-slate-100/80 transition-colors text-left"
        onClick={() => setAberta(!aberta)}
      >
        <div className="flex items-center gap-2">
          {aberta ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span
            className="text-[11px] font-semibold uppercase tracking-wide"
            style={{ color: corCategoria }}
          >
            Fase {faseIndex + 1} — {fase.nome}
          </span>
          {tempoTotal > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
              <Clock className="w-3 h-3" />
              {tempoTotal >= 60
                ? `${Math.floor(tempoTotal / 60)}h${tempoTotal % 60 > 0 ? `${tempoTotal % 60}min` : ""}`
                : `${tempoTotal}min`}
            </span>
          )}
        </div>
        <span className="text-[10px] text-slate-500">
          {fase.tasks.length} {fase.tasks.length === 1 ? "tarefa" : "tarefas"}
        </span>
      </button>

      {/* Conteúdo expandido */}
      {aberta && (
        <div className="divide-y divide-slate-100">
          {fase.tasks.map((task) => (
            <div
              key={task.id}
              className="px-3 py-2 hover:bg-slate-50/50 flex items-start gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-800 font-normal">
                    {task.nome}
                  </span>
                  {task.tempoEstimadoMinutos && (
                    <span className="text-[9px] text-slate-400">
                      {task.tempoEstimadoMinutos}min
                    </span>
                  )}
                </div>
                {/* Recursos da tarefa */}
                {task.recursos && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.entries(task.recursos).map(([key, value]) => {
                      if (!value) return null;
                      const rKey = key as FlowResourceKey;
                      const badge = RESOURCE_BADGES[rKey];
                      return (
                        <span
                          key={key}
                          className="text-[9px] px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: badge?.bg || "#F3F4F6",
                            color: badge?.cor || "#6B7280",
                          }}
                        >
                          {FLOW_RESOURCE_LABELS[rKey] || key}: {value}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Resumo de recursos da fase */}
          {recursosUnicos.length > 0 && (
            <div className="px-3 py-2 bg-slate-50/60">
              <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-1">
                Recursos necessários nesta fase
              </p>
              <div className="flex flex-wrap gap-1">
                {recursosUnicos.map(({ key, value }, i) => {
                  const badge = RESOURCE_BADGES[key];
                  return (
                    <span
                      key={`${key}-${i}`}
                      className="text-[9px] px-1.5 py-0.5 rounded border"
                      style={{
                        backgroundColor: badge?.bg || "#F3F4F6",
                        borderColor: `${badge?.cor || "#6B7280"}33`,
                        color: badge?.cor || "#6B7280",
                      }}
                    >
                      {value}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SUBCOMPONENTE: Grupo de Itens do Pricelist (sem flow)
// ============================================================================

function GrupoItensPricelist({
  grupo,
  corCategoria,
  defaultAberto,
}: {
  grupo: GrupoItens;
  corCategoria: string;
  defaultAberto: boolean;
}) {
  const [aberto, setAberto] = useState(defaultAberto);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-50/80 hover:bg-slate-100/80 transition-colors text-left"
        onClick={() => setAberto(!aberto)}
      >
        <div className="flex items-center gap-2">
          {aberto ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span
            className="text-[11px] font-semibold"
            style={{ color: corCategoria }}
          >
            {grupo.nome}
          </span>
          <span className="text-[10px] text-slate-400">
            {grupo.itens.length} {grupo.itens.length === 1 ? "item" : "itens"}
          </span>
        </div>
        <span
          className="text-[11px] font-normal"
          style={{ color: corCategoria }}
        >
          {formatarMoeda(grupo.subtotal)}
        </span>
      </button>

      {aberto && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/70">
              <tr>
                <th className="px-3 py-1.5 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-2 py-1.5 text-center text-[10px] font-medium text-slate-500 uppercase tracking-wider w-14">
                  Tipo
                </th>
                <th className="px-2 py-1.5 text-center text-[10px] font-medium text-slate-500 uppercase tracking-wider w-14">
                  Unid
                </th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-slate-500 uppercase tracking-wider w-24">
                  Preço
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {grupo.itens.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="px-3 py-1.5">
                    <span className="text-[11px] text-slate-800">
                      {item.nome}
                    </span>
                    {item.codigo && (
                      <span className="text-[9px] text-slate-400 ml-1.5">
                        {item.codigo}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <TipoBadge tipo={item.tipo} />
                  </td>
                  <td className="px-2 py-1.5 text-center text-[10px] text-slate-500">
                    {item.unidade}
                  </td>
                  <td className="px-2 py-1.5 text-right text-[11px] font-mono text-slate-700">
                    {formatarMoeda(item.preco)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function EVFCategoriaExpandida({
  categoriaEVF,
  categoriaNome: _categoriaNome,
  itensPricelist,
  flow,
  valorTotal,
  corCategoria,
}: EVFCategoriaExpandidaProps) {
  // Agrupar itens do pricelist por tipo para fallback
  const gruposPorTipo = useMemo<GrupoItens[]>(() => {
    const grupos: Record<string, PricelistItemCompleto[]> = {};

    for (const item of itensPricelist) {
      const tipo = item.tipo || "material";
      let grupoNome: string;

      if (tipo === "mao_obra" || tipo === "servico") {
        grupoNome = "MÍo de Obra / Serviço";
      } else if (tipo === "produto") {
        grupoNome = "Produtos / Equipamentos";
      } else {
        // material
        grupoNome = "Materiais / Insumos";
      }

      if (!grupos[grupoNome]) {
        grupos[grupoNome] = [];
      }
      grupos[grupoNome].push(item);
    }

    // Ordem de exibiçÍo
    const ordemGrupos = [
      "Materiais / Insumos",
      "MÍo de Obra / Serviço",
      "Produtos / Equipamentos",
    ];

    return ordemGrupos
      .filter((nome) => grupos[nome]?.length > 0)
      .map((nome) => {
        const itensGrupo = grupos[nome];
        return {
          id: nome.toLowerCase().replace(/[^a-z]/g, "_"),
          nome,
          itens: itensGrupo.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
          subtotal: itensGrupo.reduce((sum, i) => sum + i.preco, 0),
        };
      });
  }, [itensPricelist]);

  // Resumo por tipo
  const resumo = useMemo(() => {
    let insumos = 0;
    let mdo = 0;
    let produtos = 0;

    for (const item of itensPricelist) {
      const tipo = item.tipo || "material";
      if (tipo === "mao_obra" || tipo === "servico") {
        mdo += item.preco;
      } else if (tipo === "produto") {
        produtos += item.preco;
      } else {
        insumos += item.preco;
      }
    }

    return { insumos, mdo, produtos };
  }, [itensPricelist]);

  const totalItens = itensPricelist.length;
  const totalFases = flow?.fases?.length || gruposPorTipo.length;

  return (
    <div className="p-3 space-y-3">
      {/* Header info */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-500">
          {totalItens > 0
            ? `${totalItens} itens do pricelist`
            : "Sem itens no pricelist"}
          {totalFases > 0 && ` \u00b7 ${totalFases} ${flow ? "fases" : "grupos"}`}
          {valorTotal > 0 && ` \u00b7 ${formatarMoeda(valorTotal)}`}
        </span>
      </div>

      {/* MODO 1: Com Flow definido — mostrar por fases */}
      {flow && flow.fases.length > 0 && (
        <div className="space-y-2">
          {flow.fases.map((fase, index) => (
            <FaseFlow
              key={fase.id}
              fase={fase}
              faseIndex={index}
              corCategoria={corCategoria}
            />
          ))}
        </div>
      )}

      {/* MODO 2: Sem Flow — itens do pricelist agrupados por tipo */}
      {(!flow || flow.fases.length === 0) && totalItens > 0 && (
        <div className="space-y-2">
          {gruposPorTipo.map((grupo, index) => (
            <GrupoItensPricelist
              key={grupo.id}
              grupo={grupo}
              corCategoria={corCategoria}
              defaultAberto={index === 0}
            />
          ))}
        </div>
      )}

      {/* MODO 3: Sem itens — mensagem vazia */}
      {totalItens === 0 && (!flow || flow.fases.length === 0) && (
        <div className="text-center py-4">
          <p className="text-[11px] text-slate-400">
            Nenhum item do pricelist vinculado a esta categoria.
          </p>
          <p className="text-[10px] text-slate-300 mt-1">
            Vincule itens no Pricelist definindo evf_categoria_codigo = &quot;{categoriaEVF}&quot;
          </p>
        </div>
      )}

      {/* Resumo — sempre mostrar quando tem itens */}
      {totalItens > 0 && (
        <div className="flex items-center gap-4 pt-2 border-t border-slate-200">
          {resumo.insumos > 0 && (
            <div className="text-[10px]">
              <span className="text-slate-400">Materiais: </span>
              <span className="font-normal text-slate-600">
                {formatarMoeda(resumo.insumos)}
              </span>
            </div>
          )}
          {resumo.mdo > 0 && (
            <div className="text-[10px]">
              <span className="text-slate-400">MDO: </span>
              <span className="font-normal text-slate-600">
                {formatarMoeda(resumo.mdo)}
              </span>
            </div>
          )}
          {resumo.produtos > 0 && (
            <div className="text-[10px]">
              <span className="text-slate-400">Produtos: </span>
              <span className="font-normal text-slate-600">
                {formatarMoeda(resumo.produtos)}
              </span>
            </div>
          )}
          <div className="text-[10px] ml-auto">
            <span className="text-slate-400">Soma Pricelist: </span>
            <span className="font-semibold" style={{ color: corCategoria }}>
              {formatarMoeda(resumo.insumos + resumo.mdo + resumo.produtos)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

