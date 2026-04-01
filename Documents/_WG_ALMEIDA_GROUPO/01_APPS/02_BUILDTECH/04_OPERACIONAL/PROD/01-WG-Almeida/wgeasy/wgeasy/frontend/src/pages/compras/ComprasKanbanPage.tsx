import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Edit2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import Avatar from "@/components/common/Avatar";
import { formatarData, formatarValor } from "@/types/pedidosCompra";

type StatusPedidoCompra =
  | "pendente"
  | "aprovado"
  | "em_transito"
  | "entregue"
  | "cancelado";

const ESTAGIOS: StatusPedidoCompra[] = [
  "pendente",
  "aprovado",
  "em_transito",
  "entregue",
  "cancelado",
];

const ESTAGIOS_LABELS: Record<StatusPedidoCompra, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  em_transito: "Em Trânsito",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

const ESTAGIOS_CORES: Record<StatusPedidoCompra, string> = {
  pendente: "#F59E0B",
  aprovado: "#3B82F6",
  em_transito: "#8B5CF6",
  entregue: "#10B981",
  cancelado: "#EF4444",
};

type PedidoCompra = {
  id: string;
  numero: string;
  fornecedor_id: string | null;
  fornecedor_nome?: string;
  valor_total: number;
  status: StatusPedidoCompra;
  data_pedido: string;
  data_previsao_entrega: string | null;
  contrato_id: string | null;
  created_at: string;
};

export default function ComprasKanbanPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pedidos, setPedidos] = useState<PedidoCompra[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregarPedidos() {
    setLoading(true);

    // Query 1: Buscar todos os pedidos
    const { data: pedidosData, error } = await supabase
      .from("pedidos_compra")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar pedidos", error);
      toast({ title: "Erro", description: "Erro ao carregar pedidos", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Query 2: Buscar fornecedores
    const fornecedorIds = (pedidosData || [])
      .map((p: any) => p.fornecedor_id)
      .filter((id: any) => id != null);

    let fornecedoresMap: Record<string, { id: string; nome: string }> = {};

    if (fornecedorIds.length > 0) {
      const { data: fornecedoresData } = await supabase
        .from("pessoas")
        .select("id, nome")
        .in("id", fornecedorIds);

      if (fornecedoresData) {
        fornecedoresMap = fornecedoresData.reduce((acc: any, fornecedor: any) => {
          acc[fornecedor.id] = fornecedor;
          return acc;
        }, {});
      }
    }

    // Combinar dados
    const pedidosComDados = (pedidosData || []).map((p: any) => ({
      ...p,
      fornecedor_nome: p.fornecedor_id ? fornecedoresMap[p.fornecedor_id]?.nome : null,
    }));

    setPedidos(pedidosComDados as PedidoCompra[]);
    setLoading(false);
  }

  useEffect(() => {
    carregarPedidos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function atualizarStatus(id: string, novoStatus: StatusPedidoCompra) {
    // AtualizaçÍo otimista
    setPedidos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: novoStatus } : p))
    );

    const updateData: any = { status: novoStatus };

    // Se for marcar como entregue, definir data de entrega real
    if (novoStatus === "entregue") {
      updateData.data_entrega_real = new Date().toISOString().split("T")[0];
    }

    const { error } = await supabase
      .from("pedidos_compra")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("Erro ao atualizar status", error);
      toast({ title: "Erro", description: "Erro ao atualizar status", variant: "destructive" });
      carregarPedidos();
    }
  }

  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const origem = source.droppableId as StatusPedidoCompra;
    const destino = destination.droppableId as StatusPedidoCompra;

    if (origem === destino) return;

    atualizarStatus(draggableId, destino);
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B5CF6] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando pedidos de compra...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[18px] sm:text-[24px] font-normal text-[#1A1A1A]">
            Compras - Kanban
          </h1>
          <p className="text-[12px] text-gray-500 mt-1">
            Arraste os cards para alterar o status
          </p>
        </div>

        <button
          onClick={() => navigate("/compras/novo")}
          className="px-4 py-2 bg-[#8B5CF6] text-white rounded-lg text-[14px] hover:bg-[#7C3AED] transition-all shadow-sm hover:shadow-md"
        >
          + Novo Pedido
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {ESTAGIOS.map((estagio) => {
            const col = pedidos.filter((p) => p.status === estagio);
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
                      {col.map((pedido, idx) => (
                        <Draggable
                          key={pedido.id}
                          draggableId={pedido.id}
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
                                    nome={pedido.fornecedor_nome ?? "Fornecedor"}
                                    tamanho={28}
                                  />
                                  <span className="text-xs text-gray-600 font-medium truncate">
                                    {pedido.fornecedor_nome ?? "NÍo informado"}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/compras/editar/${pedido.id}`);
                                  }}
                                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                                  title="Editar pedido"
                                >
                                  <Edit2 size={14} className="text-gray-500" />
                                </button>
                              </div>

                              {/* Conteúdo do Card */}
                              <button
                                type="button"
                                onClick={() => navigate(`/compras/detalhe/${pedido.id}`)}
                                className="w-full text-left p-3"
                              >
                                {/* Número do Pedido */}
                                <div className="text-[20px] font-normal text-[#1A1A1A] mb-2">
                                  {pedido.numero}
                                </div>

                                {/* Contrato (se houver) */}
                                {pedido.contrato_id && (
                                  <div className="text-xs text-gray-500 mb-2">
                                    📋 Vinculado ao contrato
                                  </div>
                                )}

                                {/* Valor e Data */}
                                <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-gray-100">
                                  <div className="font-normal text-[#1A1A1A]">
                                    {formatarValor(pedido.valor_total)}
                                  </div>
                                  {pedido.data_previsao_entrega && (
                                    <div className="text-gray-500 text-[10px]">
                                      📅 {formatarData(pedido.data_previsao_entrega)}
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
                          Nenhum pedido
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

