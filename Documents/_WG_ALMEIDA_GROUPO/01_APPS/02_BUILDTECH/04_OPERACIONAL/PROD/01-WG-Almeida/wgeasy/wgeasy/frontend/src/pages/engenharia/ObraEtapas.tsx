/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/auth/AuthContext";
import {
  ObraEtapaCompleta,
  EtapasEstatisticas,
  obterEtapasMacro,
  calcularProgressoGeral,
} from "@/types/etapas";
import EtapaTimeline from "@/components/etapas/EtapaTimeline";
import EtapaCard from "@/components/etapas/EtapaCard";
import EtapaChecklist from "@/components/etapas/EtapaChecklist";
import {
  ArrowLeft,
  Plus,
  LayoutList,
  BarChart3,
  ListChecks,
} from "lucide-react";

type VisualizacaoModo = "timeline" | "grid" | "lista";

export default function ObraEtapas() {
  const { toast } = useToast();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [etapas, setEtapas] = useState<ObraEtapaCompleta[]>([]);
  const [etapaSelecionada, setEtapaSelecionada] = useState<ObraEtapaCompleta | null>(null);
  const [estatisticas, setEstatisticas] = useState<EtapasEstatisticas | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [visualizacao, setVisualizacao] = useState<VisualizacaoModo>("timeline");
  const [mostrarConcluidas, setMostrarConcluidas] = useState(true);

  // Carregar etapas da obra
  async function carregarEtapas() {
    if (!id) return;

    setCarregando(true);
    setErro(null);

    try {
      // Buscar etapas com dados agregados
      const { data: etapasData, error: etapasError } = await supabase
        .from("v_obras_etapas_completo")
        .select("*")
        .eq("obra_id", id)
        .order("ordem", { ascending: true });

      if (etapasError) throw etapasError;

      // Carregar subetapas para cada etapa macro
      const etapasComSubetapas = await Promise.all(
        (etapasData || []).map(async (etapa) => {
          if (etapa.tipo === "macro") {
            const { data: subetapas } = await supabase
              .from("v_obras_etapas_completo")
              .select("*")
              .eq("etapa_pai_id", etapa.id)
              .order("ordem", { ascending: true });

            return {
              ...etapa,
              subetapas: subetapas || [],
            };
          }
          return etapa;
        })
      );

      setEtapas(etapasComSubetapas as ObraEtapaCompleta[]);

      // Calcular estatísticas
      calcularEstatisticas(etapasComSubetapas as ObraEtapaCompleta[]);
    } catch (err: any) {
      console.error("Erro ao carregar etapas:", err);
      setErro("NÍo foi possível carregar as etapas da obra");
    } finally {
      setCarregando(false);
    }
  }

  function calcularEstatisticas(etapasData: ObraEtapaCompleta[]) {
    const stats: EtapasEstatisticas = {
      total_etapas: etapasData.length,
      etapas_nao_iniciadas: etapasData.filter((e) => e.status === "nao_iniciada").length,
      etapas_em_andamento: etapasData.filter((e) => e.status === "em_andamento").length,
      etapas_concluidas: etapasData.filter((e) => e.status === "concluida").length,
      etapas_atrasadas: etapasData.filter((e) => e.status === "atrasada").length,
      etapas_bloqueadas: etapasData.filter((e) => e.status === "bloqueada").length,
      percentual_conclusao_geral: calcularProgressoGeral(etapasData),
      dias_atraso_medio: Math.round(
        etapasData.reduce((acc, e) => acc + e.dias_atraso, 0) / etapasData.length || 0
      ),
      total_checklist: etapasData.reduce((acc, e) => acc + e.total_checklist, 0),
      checklist_concluidos: etapasData.reduce((acc, e) => acc + e.checklist_concluidos, 0),
      total_evidencias: etapasData.reduce((acc, e) => acc + e.total_evidencias, 0),
      total_assinaturas: etapasData.reduce((acc, e) => acc + e.total_assinaturas, 0),
      alertas_pendentes: etapasData.reduce((acc, e) => acc + e.alertas_pendentes, 0),
    };

    setEstatisticas(stats);
  }

  useEffect(() => {
    carregarEtapas();
  }, [id]);

  // Criar etapas padrÍo
  async function criarEtapasPadrao() {
    if (!id || !user) return;

    const etapasPadrao = [
      {
        titulo: "Planejamento e Projetos",
        descricao: "DefiniçÍo de escopo, projetos arquitetônicos e executivos",
        ordem: 1,
      },
      {
        titulo: "MediçÍo Técnica",
        descricao: "Levantamento de medidas e validaçÍo de projetos",
        ordem: 2,
      },
      {
        titulo: "Marcenaria",
        descricao: "ProduçÍo e instalaçÍo de móveis planejados",
        ordem: 3,
      },
      {
        titulo: "ExecuçÍo de Obra",
        descricao: "DemoliçÍo, alvenaria, elétrica, hidráulica",
        ordem: 4,
      },
      {
        titulo: "Acabamento",
        descricao: "Revestimentos, pintura e acabamentos finais",
        ordem: 5,
      },
      {
        titulo: "Entrega Final",
        descricao: "Limpeza, vistoria e entrega ao cliente",
        ordem: 6,
      },
    ];

    const payload = etapasPadrao.map((etapa) => ({
      obra_id: id,
      titulo: etapa.titulo,
      descricao: etapa.descricao,
      tipo: "macro",
      ordem: etapa.ordem,
      status: "nao_iniciada",
      percentual_concluido: 0,
      created_by: user.id,
    }));

    const { error } = await supabase.from("obras_etapas").insert(payload);

    if (error) {
      console.error("Erro ao criar etapas:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao criar etapas padrÍo" });
      return;
    }

    carregarEtapas();
  }

  // Filtrar etapas
  const etapasFiltradas = mostrarConcluidas
    ? etapas
    : etapas.filter((e) => e.status !== "concluida");

  const etapasMacro = obterEtapasMacro(etapasFiltradas);
  const etapasMacroCompletas = etapasMacro as ObraEtapaCompleta[];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* NavegaçÍo */}
          <button
            onClick={() => navigate(`/obras/${id}`)}
            className="flex items-center gap-2 text-[14px] text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            <span>Voltar para Detalhes da Obra</span>
          </button>

          {/* Título */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[18px] sm:text-[24px] font-normal text-[#3B82F6]">
                Etapas da Obra
              </h1>
              {estatisticas && (
                <p className="text-[16px] text-gray-600 mt-1">
                  {estatisticas.total_etapas} etapas •{" "}
                  {estatisticas.percentual_conclusao_geral}% concluído
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Botões de visualizaçÍo */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setVisualizacao("timeline")}
                  className={`px-3 py-2 rounded ${
                    visualizacao === "timeline"
                      ? "bg-white shadow-sm"
                      : "text-gray-600"
                  }`}
                  title="VisualizaçÍo em Timeline"
                >
                  <LayoutList size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setVisualizacao("grid")}
                  className={`px-3 py-2 rounded ${
                    visualizacao === "grid" ? "bg-white shadow-sm" : "text-gray-600"
                  }`}
                  title="VisualizaçÍo em Grade"
                >
                  <BarChart3 size={18} />
                </button>
              </div>

              {/* Adicionar etapa */}
              <button
                type="button"
                onClick={() => toast({ title: "Funcionalidade em desenvolvimento" })}
                className="flex items-center gap-2 px-4 py-2 text-[14px] bg-[#3B82F6] text-white rounded-lg hover:bg-[#2563EB] transition-colors"
              >
                <Plus size={18} />
                <span>Nova Etapa</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      {estatisticas && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-[20px] font-normal text-gray-900">
                {estatisticas.total_etapas}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Em Andamento</p>
              <p className="text-[20px] font-normal text-blue-600">
                {estatisticas.etapas_em_andamento}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Concluídas</p>
              <p className="text-[20px] font-normal text-green-600">
                {estatisticas.etapas_concluidas}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Atrasadas</p>
              <p className="text-[20px] font-normal text-red-600">
                {estatisticas.etapas_atrasadas}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Checklist</p>
              <p className="text-[20px] font-normal text-gray-900">
                {estatisticas.checklist_concluidos}/{estatisticas.total_checklist}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Alertas</p>
              <p className="text-[20px] font-normal text-orange-600">
                {estatisticas.alertas_pendentes}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Controles */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-[14px] text-gray-700">
            <input
              type="checkbox"
              checked={mostrarConcluidas}
              onChange={(e) => setMostrarConcluidas(e.target.checked)}
              className="rounded"
            />
            Mostrar etapas concluídas
          </label>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {carregando && (
          <div className="text-center py-12">
            <p className="text-[16px] text-gray-600">Carregando etapas...</p>
          </div>
        )}

        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-[16px] text-red-800">
            {erro}
          </div>
        )}

        {/* Nenhuma etapa */}
        {!carregando && etapas.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <ListChecks size={48} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-[20px] font-normal text-gray-900 mb-2">
              Nenhuma etapa cadastrada
            </h2>
            <p className="text-[16px] text-gray-600 mb-6">
              Comece criando as etapas padrÍo da obra
            </p>
            <button
              type="button"
              onClick={criarEtapasPadrao}
              className="px-6 py-3 text-[14px] bg-[#3B82F6] text-white rounded-lg hover:bg-[#2563EB] transition-colors"
            >
              Criar Etapas PadrÍo
            </button>
          </div>
        )}

        {/* VisualizaçÍo Timeline */}
        {!carregando && etapas.length > 0 && visualizacao === "timeline" && (
          <EtapaTimeline
            etapas={etapasMacroCompletas}
            onEtapaClick={setEtapaSelecionada}
          />
        )}

        {/* VisualizaçÍo Grid */}
        {!carregando && etapas.length > 0 && visualizacao === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {etapasMacroCompletas.map((etapa) => (
              <EtapaCard
                key={etapa.id}
                etapa={etapa}
                onClick={() => setEtapaSelecionada(etapa)}
                expandivel={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalhes da Etapa */}
      {etapaSelecionada && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setEtapaSelecionada(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-[20px] font-normal text-gray-900">
                    {etapaSelecionada.titulo}
                  </h2>
                  {etapaSelecionada.descricao && (
                    <p className="text-[16px] text-gray-600 mt-1">
                      {etapaSelecionada.descricao}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setEtapaSelecionada(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Checklist */}
              {etapaSelecionada.checklist && (
                <EtapaChecklist
                  etapaId={etapaSelecionada.id}
                  checklist={etapaSelecionada.checklist}
                  onUpdate={carregarEtapas}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
