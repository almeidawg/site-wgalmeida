/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Edit2 } from "lucide-react";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import Avatar from "@/components/common/Avatar";
import { formatarData, formatarValor } from "@/types/assistenciaTecnica";

type StatusOS =
  | "aberta"
  | "em_atendimento"
  | "aguardando_peca"
  | "aguardando_cliente"
  | "concluida"
  | "cancelada";

const ESTAGIOS: StatusOS[] = [
  "aberta",
  "em_atendimento",
  "aguardando_peca",
  "aguardando_cliente",
  "concluida",
  "cancelada",
];

const ESTAGIOS_LABELS: Record<StatusOS, string> = {
  aberta: "Aberta",
  em_atendimento: "Em Atendimento",
  aguardando_peca: "Aguardando Peça",
  aguardando_cliente: "Aguardando Cliente",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

const ESTAGIOS_CORES: Record<StatusOS, string> = {
  aberta: "#F59E0B",
  em_atendimento: "#3B82F6",
  aguardando_peca: "#8B5CF6",
  aguardando_cliente: "#F97316",
  concluida: "#10B981",
  cancelada: "#EF4444",
};

type OrdemServico = {
  id: string;
  numero: string;
  cliente_id: string;
  cliente_nome?: string;
  titulo: string;
  valor_total: number;
  status: StatusOS;
  prioridade: "baixa" | "media" | "alta" | "urgente";
  data_abertura: string;
  data_previsao: string | null;
  created_at: string;
};

export default function AssistenciaKanbanPage() {
  const navigate = useNavigate();
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregarOrdens() {
    setLoading(true);

    // Query 1: Buscar todas as ordens de serviço
    const { data: ordensData, error } = await supabase
      .from("assistencia_ordens")
      .select("*")
      .order("criado_em", { ascending: false });

    if (error) {
      console.error("Erro ao carregar ordens de serviço", error);
      setLoading(false);
      return;
    }

    // Query 2: Buscar clientes
    const clienteIds = (ordensData || [])
      .map((os: any) => os.cliente_id)
      .filter((id: any) => id != null);

    let clientesMap: Record<string, { id: string; nome: string }> = {};

    if (clienteIds.length > 0) {
      const { data: clientesData } = await supabase
        .from("pessoas")
        .select("id, nome")
        .in("id", clienteIds);

      if (clientesData) {
        clientesMap = clientesData.reduce((acc: any, cliente: any) => {
          acc[cliente.id] = cliente;
          return acc;
        }, {});
      }
    }

    // Combinar dados
    const ordensComDados = (ordensData || []).map((os: any) => ({
      ...os,
      cliente_nome: os.cliente_id ? clientesMap[os.cliente_id]?.nome : null,
    }));

    setOrdens(ordensComDados as OrdemServico[]);
    setLoading(false);
  }

  useEffect(() => {
    carregarOrdens();
  }, []);

  async function atualizarStatus(id: string, novoStatus: StatusOS) {
    // AtualizaçÍo otimista
    setOrdens((prev) =>
      prev.map((os) => (os.id === id ? { ...os, status: novoStatus } : os))
    );

    const updateData: any = { status: novoStatus };

    // Se for marcar como concluída, definir data de conclusÍo
    if (novoStatus === "concluida") {
      updateData.data_conclusao = new Date().toISOString().split("T")[0];
    }

    const { error } = await supabase
      .from("assistencia_ordens")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("Erro ao atualizar status", error);
      carregarOrdens();
    }
  }

  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const origem = source.droppableId as StatusOS;
    const destino = destination.droppableId as StatusOS;

    if (origem === destino) return;

    atualizarStatus(draggableId, destino);
  }

  const PRIORIDADE_CORES = {
    baixa: "#10B981",
    media: "#F59E0B",
    alta: "#F97316",
    urgente: "#EF4444",
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando ordens de serviço...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[18px] sm:text-[24px] font-normal text-[#1A1A1A]">
            Assistência Técnica - Kanban
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Arraste os cards para alterar o status
          </p>
        </div>

        <button
          onClick={() => navigate("/assistencia/novo")}
          className="px-4 py-2 bg-[#3B82F6] text-white rounded-lg text-[14px] hover:bg-[#2563EB] transition-all shadow-sm hover:shadow-md"
        >
          + Nova OS
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {ESTAGIOS.map((estagio) => {
            const col = ordens.filter((os) => os.status === estagio);
            const cor = ESTAGIOS_CORES[estagio];

            return (
              <Droppable droppableId={estagio} key={estagio}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`bg-[#F9F9F9] border rounded-xl p-3 flex flex-col transition-all min-h-[500px] flex-1 min-w-[220px] ${
                      snapshot.isDraggingOver
                        ? "bg-white shadow-lg"
                        : "border-[#E5E5E5]"
                    }`}
                    style={
                      snapshot.isDraggingOver
                        ? { borderColor: cor }
                        : undefined
                    }
                  >
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                      <h2 className="text-[20px] font-normal uppercase tracking-wide text-[#2E2E2E]">
                        {ESTAGIOS_LABELS[estagio]}
                      </h2>
                      <span
                        className="text-[14px] font-normal text-white px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: cor }}
                      >
                        {col.length}
                      </span>
                    </div>

                    <div className="flex flex-col gap-3 flex-1">
                      {col.map((os, idx) => (
                        <Draggable
                          key={os.id}
                          draggableId={os.id}
                          index={idx}
                        >
                          {(prov, snap) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              className={`w-full bg-white rounded-lg shadow-sm hover:shadow-lg transition-all border border-gray-100 ${
                                snap.isDragging ? "ring-2 shadow-2xl" : ""
                              }`}
                              style={{
                                ...prov.draggableProps.style,
                                borderColor: snap.isDragging ? cor : undefined,
                              }}
                            >
                              {/* Header com Avatar e BotÍo Editar */}
                              <div className="flex items-center justify-between p-3 pb-2 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                  <Avatar
                                    nome={os.cliente_nome ?? "Cliente"}
                                    tamanho={28}
                                  />
                                  <span className="text-xs text-gray-600 font-medium truncate">
                                    {os.cliente_nome ?? "não informado"}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/assistencia/editar/${os.id}`);
                                  }}
                                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                                  title="Editar OS"
                                >
                                  <Edit2 size={14} className="text-gray-500" />
                                </button>
                              </div>

                              {/* Conteúdo do Card */}
                              <button
                                type="button"
                                onClick={() => navigate(`/assistencia/detalhe/${os.id}`)}
                                className="w-full text-left p-3"
                              >
                                {/* Número da OS */}
                                <div className="text-[20px] font-normal text-[#1A1A1A] mb-1">
                                  {os.numero}
                                </div>

                                {/* Título */}
                                <div className="text-xs text-gray-700 mb-2 line-clamp-2">
                                  {os.titulo}
                                </div>

                                {/* Prioridade */}
                                <div className="mb-2">
                                  <span
                                    className="text-[10px] font-normal px-2 py-0.5 rounded-full text-white"
                                    style={{ backgroundColor: PRIORIDADE_CORES[os.prioridade] }}
                                  >
                                    {os.prioridade.toUpperCase()}
                                  </span>
                                </div>

                                {/* Valor e Data */}
                                <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-gray-100">
                                  <div className="font-normal text-[#1A1A1A]">
                                    {formatarValor(os.valor_total)}
                                  </div>
                                  {os.data_previsao && (
                                    <div className="text-gray-500 text-[10px]">
                                      📅 {formatarData(os.data_previsao)}
                                    </div>
                                  )}
                                </div>
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}

                      {provided.placeholder}

                      {col.length === 0 && (
                        <div className="text-center text-gray-400 text-xs py-8">
                          Nenhuma OS
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}


