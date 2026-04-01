// ============================================================
// Oportunidades Inteligentes Dashboard
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import React from "react";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Clock,
  Zap,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Target,
  Phone,
  Activity,
} from "lucide-react";
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";
import {
  identificarOportunidadesInteligentes,
  type OportunidadeIdentificada,
  type OportunidadesInteligenteResult,
  ICONES_TIPO,
  LABELS_TIPO,
  formatarValorEstimado,
} from "@/services/oportunidadesInteligentesService";
import { supabase } from "@/lib/supabaseClient";

// ============================================================
// HELPERS
// ============================================================

function corUrgencia(urgencia: "alta" | "media" | "baixa") {
  if (urgencia === "alta") return { bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100 text-red-700", dot: "bg-red-500" };
  if (urgencia === "media") return { bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500" };
  return { bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-700", dot: "bg-blue-500" };
}

function ScoreBadge({ score }: { score: number }) {
  const cor = score >= 70 ? "bg-green-100 text-green-700" : score >= 50 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500";
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${cor}`}>
      {score}%
    </span>
  );
}

// ============================================================
// CARD DE OPORTUNIDADE
// ============================================================

function OportunidadeCard({ op, onCriarOportunidade }: { op: OportunidadeIdentificada; onCriarOportunidade: (op: OportunidadeIdentificada) => void }) {
  const [expandido, setExpandido] = useState(false);
  const cores = corUrgencia(op.urgencia);

  return (
    <div className={`border rounded-xl ${cores.border} ${cores.bg} overflow-hidden transition-all`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className="text-2xl flex-shrink-0 mt-0.5">{ICONES_TIPO[op.tipo]}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${cores.badge}`}>
                  {LABELS_TIPO[op.tipo]}
                </span>
                <ScoreBadge score={op.score} />
                {op.fonte === "ia" && (
                  <span className="flex items-center gap-1 text-[11px] text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                    <Activity className="w-3 h-3" />
                    IA
                  </span>
                )}
                {op.nucleo && (
                  <span className="text-[11px] text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                    {op.nucleo}
                  </span>
                )}
              </div>
              <h3 className="text-[14px] font-semibold text-gray-800 truncate">{op.titulo}</h3>
              {op.cliente_nome && (
                <p className="text-[12px] text-gray-500 mt-0.5">👤 {op.cliente_nome}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {op.valor_estimado && (
              <span className="text-[12px] font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-lg">
                {formatarValorEstimado(op.valor_estimado)}
              </span>
            )}
            <button
              onClick={() => setExpandido(!expandido)}
              className="p-1.5 rounded-lg hover:bg-white/60 transition-colors text-gray-500"
            >
              {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {expandido && (
          <div className="mt-3 pt-3 border-t border-white/60 space-y-3">
            <p className="text-[13px] text-gray-700">{op.descricao}</p>

            {op.dias_sem_atividade !== undefined && (
              <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
                <Clock className="w-3.5 h-3.5" />
                {op.dias_sem_atividade} dias sem atividade
              </div>
            )}

            <div className="flex items-start gap-2 bg-white/60 rounded-lg p-2.5">
              <Zap className="w-3.5 h-3.5 text-[#F25C26] flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-gray-700">
                <span className="font-medium">AçÍo sugerida: </span>
                {op.acao_sugerida}
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => onCriarOportunidade(op)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-[12px] font-medium hover:opacity-90 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Criar Oportunidade
              </button>
              {op.oportunidade_id && (
                <a
                  href={`/oportunidades/${op.oportunidade_id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-[12px] font-medium hover:bg-gray-50 transition-all"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  Ver Oportunidade
                </a>
              )}
              {op.cliente_id && (
                <a
                  href={`/pessoas/${op.cliente_id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-[12px] font-medium hover:bg-gray-50 transition-all"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Ver Cliente
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// RESUMO CARD
// ============================================================

function ResumoCard({ label, valor, cor, icon }: { label: string; valor: number | string; cor: string; icon: React.ReactNode }) {
  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border ${cor}`}>
      <div className="w-9 h-9 rounded-lg bg-white/70 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[22px] font-bold text-gray-900 leading-none">{valor}</p>
        <p className="text-[12px] text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ============================================================
// PÁGINA PRINCIPAL
// ============================================================

export default function OportunidadesInteligentesDashboard() {
  const navigate = useNavigate();
  const [resultado, setResultado] = useState<OportunidadesInteligenteResult | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtroUrgencia, setFiltroUrgencia] = useState<"todas" | "alta" | "media" | "baixa">("todas");
  const [empresaId, setEmpresaId] = useState<string>("");

  const carregar = useCallback(async (eid: string) => {
    setCarregando(true);
    setErro(null);
    try {
      const result = await identificarOportunidadesInteligentes(eid);
      setResultado(result);
    } catch (e: any) {
      setErro(e.message || "Erro ao identificar oportunidades");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: perfil } = await supabase
        .from("usuarios")
        .select("empresa_id")
        .eq("id", user.id)
        .single();

      const eid = perfil?.empresa_id || user.id;
      setEmpresaId(eid);
      carregar(eid);
    })();
  }, [carregar]);

  const oportunidadesFiltradas = resultado?.oportunidades.filter(
    (o) => filtroUrgencia === "todas" || o.urgencia === filtroUrgencia
  ) || [];

  function handleCriarOportunidade(op: OportunidadeIdentificada) {
    const params = new URLSearchParams();
    if (op.cliente_id) params.set("cliente_id", op.cliente_id);
    if (op.nucleo) params.set("nucleo", op.nucleo);
    if (op.valor_estimado) params.set("valor", String(op.valor_estimado));
    navigate(`/oportunidades/novo?${params.toString()}`);
  }

  return (
    <div className={`min-h-screen bg-white ${LAYOUT.pageContainer}`}>
      {/* Header */}
      <div className={LAYOUT.pageHeaderSpacing}>
        <div className={LAYOUT.pageHeader}>
          <div className={LAYOUT.pageTitleWrapper}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className={TYPOGRAPHY.iconLarge + " text-white"} />
            </div>
            <div>
              <h1 className={TYPOGRAPHY.pageTitle}>Oportunidades Inteligentes</h1>
              <p className={TYPOGRAPHY.pageSubtitle}>
                IdentificaçÍo automática por IA + regras de negócio
                {resultado && (
                  <span className="ml-2 text-gray-400 text-[11px]">
                    Atualizado {new Date(resultado.gerado_em).toLocaleTimeString("pt-BR")}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/oportunidades")}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-[13px] hover:bg-gray-200 transition-all"
            >
              <Target className="w-4 h-4" />
              CRM Kanban
            </button>
            <button
              onClick={() => empresaId && carregar(empresaId)}
              disabled={carregando}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#F25C26] to-[#e04a1a] text-white rounded-lg text-[13px] hover:opacity-90 transition-all shadow-lg disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${carregando ? "animate-spin" : ""}`} />
              {carregando ? "Analisando..." : "Atualizar"}
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className={LAYOUT.formContainer}>
        {carregando && !resultado && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-purple-500 animate-pulse" />
            </div>
            <p className="text-[15px] font-medium text-gray-700">Analisando oportunidades...</p>
            <p className="text-[13px] text-gray-400 mt-1">IA + regras de negócio trabalhando</p>
          </div>
        )}

        {erro && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-[13px]">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            {erro}
          </div>
        )}

        {resultado && (
          <>
            {/* Cards de Resumo */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <ResumoCard
                label="Total de Oportunidades"
                valor={resultado.total}
                cor="border-purple-200 bg-purple-50"
                icon={<Sparkles className="w-4 h-4 text-purple-600" />}
              />
              <ResumoCard
                label="Alta Urgência"
                valor={resultado.resumo.alta_urgencia}
                cor="border-red-200 bg-red-50"
                icon={<AlertTriangle className="w-4 h-4 text-red-600" />}
              />
              <ResumoCard
                label="Valor Potencial"
                valor={formatarValorEstimado(resultado.resumo.valor_potencial_total) || "—"}
                cor="border-green-200 bg-green-50"
                icon={<TrendingUp className="w-4 h-4 text-green-600" />}
              />
              <ResumoCard
                label="Sugestões IA"
                valor={resultado.resumo.fonte_ia}
                cor="border-blue-200 bg-blue-50"
                icon={<Activity className="w-4 h-4 text-blue-600" />}
              />
            </div>

            {/* Filtro de urgência */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {(["todas", "alta", "media", "baixa"] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => setFiltroUrgencia(u)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all capitalize ${
                    filtroUrgencia === u
                      ? "bg-primary text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {u === "todas" ? "Todas" : u.charAt(0).toUpperCase() + u.slice(1)}{" "}
                  {u !== "todas" && (
                    <span className="ml-1 opacity-70">
                      ({resultado.oportunidades.filter((o) => o.urgencia === u).length})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Lista de Oportunidades */}
            {oportunidadesFiltradas.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-[15px] font-medium text-gray-700">Nenhuma oportunidade nesta categoria</p>
                <p className="text-[13px] text-gray-400 mt-1">O funil está saudável!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {oportunidadesFiltradas.map((op, i) => (
                  <OportunidadeCard
                    key={`${op.tipo}-${op.cliente_id || i}-${i}`}
                    op={op}
                    onCriarOportunidade={handleCriarOportunidade}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

