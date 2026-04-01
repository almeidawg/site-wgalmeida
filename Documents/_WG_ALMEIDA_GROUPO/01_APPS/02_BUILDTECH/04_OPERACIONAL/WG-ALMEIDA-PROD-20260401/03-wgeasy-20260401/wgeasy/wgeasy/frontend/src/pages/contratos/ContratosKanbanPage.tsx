import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Edit2, Trash2, LayoutGrid, Kanban } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import Avatar from "@/components/common/Avatar";
import { formatarData, formatarValor } from "@/types/contratos";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

// Status do banco de dados (status reais usados no sistema)
type StatusContrato =
  | "rascunho"
  | "aguardando_assinatura"
  | "assinado"
  | "em_execucao"
  | "ativo"
  | "concluido"
  | "cancelado"
  | "finalizado";

// Rascunho removido - rascunhos ficam em Propostas
const ESTAGIOS: StatusContrato[] = [
  "aguardando_assinatura",
  "assinado",
  "em_execucao",
  "concluido",
  "cancelado",
];

const ESTAGIOS_LABELS: Record<StatusContrato, string> = {
  rascunho: "Rascunho",
  aguardando_assinatura: "Aguardando",
  assinado: "Assinado",
  em_execucao: "Em ExecuçÍo",
  ativo: "Ativo",
  concluido: "Concluído",
  cancelado: "Cancelado",
  finalizado: "Finalizado",
};

const ESTAGIOS_CORES: Record<StatusContrato, string> = {
  rascunho: "#9CA3AF",
  aguardando_assinatura: "#F59E0B",
  assinado: "#8B5CF6",
  em_execucao: "#3B82F6",
  ativo: "#3B82F6",
  concluido: "#10B981",
  cancelado: "#EF4444",
  finalizado: "#10B981",
};

type Contrato = {
  id: string;
  numero: string | null;
  numero_contrato: string | null;
  cliente_id: string | null;
  cliente_nome?: string;
  cliente_avatar_url?: string | null;
  cliente_foto_url?: string | null;
  valor_total: number;
  status: StatusContrato;
  unidade_negocio: string;
  data_inicio: string | null;
  data_previsao_termino: string | null;
  previsao_termino: string | null;
  descricao: string | null;
  created_at: string;
};

type ViewMode = "kanban" | "cards";

function normalizarStatus(status: string | null | undefined): string {
  return (status || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
}

function statusParaEstagioKanban(status: string | null | undefined): StatusContrato {
  const normalizado = normalizarStatus(status);

  if (normalizado === "ativo") return "em_execucao";
  if (normalizado === "finalizado") return "concluido";
  if (normalizado === "em_execucao") return "em_execucao";
  if (normalizado === "assinado") return "assinado";
  if (normalizado === "aguardando_assinatura") return "aguardando_assinatura";
  if (normalizado === "concluido") return "concluido";
  if (normalizado === "cancelado") return "cancelado";

  return "aguardando_assinatura";
}

export default function ContratosKanbanPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [contratoParaExcluir, setContratoParaExcluir] = useState<Contrato | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");

  async function carregarContratos() {
    setLoading(true);

    // Query 1: Buscar todos os contratos
    const { data: contratosData, error } = await supabase
      .from("contratos")
      .select("*")
      .order("created_at", { ascending: false });

    if (import.meta.env.DEV) console.log("[ContratosKanban] Contratos carregados:", contratosData?.length || 0, contratosData);

    if (error) {
      console.error("[ContratosKanban] Erro ao carregar contratos:", error);
      toast({ variant: "destructive", title: "Erro ao carregar contratos", description: error.message });
      setLoading(false);
      return;
    }

    // Query 2: Buscar clientes
    const clienteIds = (contratosData || [])
      .map((c: any) => c.cliente_id)
      .filter((id: any) => id != null);

    let clientesMap: Record<string, { id: string; nome: string; avatar_url?: string | null; foto_url?: string | null }> = {};

    if (clienteIds.length > 0) {
      const { data: clientesData } = await supabase
        .from("pessoas")
        .select("id, nome, avatar_url, foto_url")
        .in("id", clienteIds);

      if (clientesData) {
        clientesMap = clientesData.reduce((acc: any, cliente: any) => {
          acc[cliente.id] = cliente;
          return acc;
        }, {});
      }
    }

    // Combinar dados
    const contratosComDados = (contratosData || []).map((c: any) => ({
      ...c,
      cliente_nome: c.cliente_id ? clientesMap[c.cliente_id]?.nome : null,
      cliente_avatar_url: c.cliente_id ? clientesMap[c.cliente_id]?.avatar_url : null,
      cliente_foto_url: c.cliente_id ? clientesMap[c.cliente_id]?.foto_url : null,
    }));

    setContratos(contratosComDados as Contrato[]);
    setLoading(false);
  }

  useEffect(() => {
    carregarContratos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function atualizarStatus(id: string, novoStatus: StatusContrato) {
    // Guardar status anterior para rollback
    const contratoAnterior = contratos.find(c => c.id === id);
    const statusAnterior = contratoAnterior?.status;

    // AtualizaçÍo otimista
    setContratos((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: novoStatus } : c))
    );

    const { error } = await supabase
      .from("contratos")
      .update({ status: novoStatus })
      .eq("id", id);

    if (error) {
      console.error("Erro ao atualizar status", error);

      // Rollback para status anterior
      if (statusAnterior) {
        setContratos((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: statusAnterior } : c))
        );
      }

      // Mensagem de erro mais amigável
      if (error.code === 'PGRST301' || error.message?.includes('policy')) {
        toast({ variant: "destructive", title: "Sem permissÍo", description: "Você nÍo tem permissÍo para alterar o status deste contrato." });
      } else if (error.code === '23514' || error.message?.includes('check')) {
        toast({ variant: "destructive", title: "Status inválido", description: "NÍo é possível alterar para este status. Verifique as regras de negócio." });
      } else {
        toast({ variant: "destructive", title: "Erro ao atualizar status", description: error.message || 'Erro de conexÍo' });
      }
    }
  }

  async function deletarContrato() {
    if (!contratoParaExcluir) return;

    try {
      const { error } = await supabase
        .from("contratos")
        .delete()
        .eq("id", contratoParaExcluir.id);

      if (error) {
        console.error("Erro ao deletar contrato:", error);
        toast({ variant: "destructive", title: "Erro ao excluir contrato", description: error.message });
        return;
      }

      // Atualizar estado local
      setContratos((prev) => prev.filter((c) => c.id !== contratoParaExcluir.id));
      setContratoParaExcluir(null);
    } catch (error) {
      console.error("Erro ao deletar contrato:", error);
      toast({ variant: "destructive", title: "Erro ao excluir contrato" });
    }
  }

  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const origem = source.droppableId as StatusContrato;
    const destino = destination.droppableId as StatusContrato;

    if (origem === destino) return;

    atualizarStatus(draggableId, destino);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
          <p className="text-[12px] text-gray-500">Carregando contratos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Seletores de VisualizaçÍo */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-2 rounded-md transition-all ${
                viewMode === "kanban"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              title="VisualizaçÍo Kanban"
            >
              <Kanban size={18} />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`p-2 rounded-md transition-all ${
                viewMode === "cards"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              title="VisualizaçÍo em Cards"
            >
              <LayoutGrid size={18} />
            </button>
          </div>

          <div>
            <h1 className="text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight text-gray-900">
              Contratos
            </h1>
            <p className="text-[12px] text-gray-600 mt-1">
              {viewMode === "kanban" ? "Arraste os cards para alterar o status" : "VisualizaçÍo em blocos de cards"}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate("/contratos/novo")}
          className="px-4 py-2 bg-primary text-white rounded-lg text-[14px] hover:bg-primary-dark transition-all shadow-sm hover:shadow-md w-full sm:w-auto text-center"
        >
          + Novo Contrato
        </button>
      </div>

      {/* VISUALIZAÇÍO KANBAN */}
      {viewMode === "kanban" && (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {ESTAGIOS.map((estagio) => {
              const col = contratos.filter(
                (c) => statusParaEstagioKanban(c.status) === estagio
              );
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
                        <h2 className="text-[14px] font-light uppercase tracking-wide text-gray-700">
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
                        {col.map((contrato, idx) => (
                          <Draggable
                            key={contrato.id}
                            draggableId={contrato.id}
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
                                {/* Header com Avatar e Botões AçÍo */}
                                <div className="flex items-center justify-between p-3 pb-2 border-b border-gray-100">
                                  <div className="flex items-center gap-2">
                                    <Avatar
                                      nome={contrato.cliente_nome ?? "Cliente"}
                                      avatar_url={contrato.cliente_avatar_url}
                                      foto_url={contrato.cliente_foto_url}
                                      tamanho={28}
                                    />
                                    <span className="text-xs text-gray-600 font-medium truncate">
                                      {contrato.cliente_nome ?? "NÍo informado"}
                                    </span>
                                  </div>
                                  <div className="flex gap-1">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/contratos/editar/${contrato.id}`);
                                      }}
                                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                                      title="Editar contrato"
                                    >
                                      <Edit2 size={14} className="text-gray-500" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setContratoParaExcluir(contrato);
                                      }}
                                      className="p-1 hover:bg-red-50 rounded transition-colors"
                                      title="Excluir contrato"
                                    >
                                      <Trash2 size={14} className="text-red-600" />
                                    </button>
                                  </div>
                                </div>

                                {/* Conteúdo do Card */}
                                <button
                                  type="button"
                                  onClick={() => navigate(`/contratos/${contrato.id}`)}
                                  className="w-full text-left p-3"
                                >
                                  {/* Número/Título do Contrato */}
                                  <div className="text-[20px] font-normal text-[#1A1A1A] mb-1 line-clamp-2">
                                    {contrato.numero_contrato || contrato.numero || contrato.descricao || "Sem título"}
                                  </div>

                                  {/* Data e Hora de CriaçÍo */}
                                  <div className="text-[10px] text-gray-400 mb-2">
                                    Criado em {new Date(contrato.created_at).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric'
                                    })} às {new Date(contrato.created_at).toLocaleTimeString('pt-BR', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>

                                  {/* Unidade de Negócio com Cor */}
                                  <div className="mb-2">
                                    <span
                                      className="px-2 py-1 rounded-full text-xs font-normal text-white capitalize"
                                      style={{
                                        backgroundColor:
                                          contrato.unidade_negocio?.toLowerCase() === 'arquitetura' ? '#5E9B94' :
                                          contrato.unidade_negocio?.toLowerCase() === 'engenharia' ? '#2B4580' :
                                          contrato.unidade_negocio?.toLowerCase() === 'marcenaria' ? '#8B5E3C' :
                                          contrato.unidade_negocio?.toLowerCase()?.includes('moma') ? '#10B981' :
                                          '#6B7280'
                                      }}
                                    >
                                      {contrato.unidade_negocio?.replace('_', ' ') || 'NÍo definido'}
                                    </span>
                                  </div>

                                  {/* Valor */}
                                  <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-gray-100">
                                    <div className="font-normal text-[#1A1A1A]">
                                      {formatarValor(contrato.valor_total)}
                                    </div>
                                    {(contrato.data_previsao_termino || contrato.previsao_termino) && (
                                      <div className="text-gray-500 text-[10px]">
                                        {formatarData(contrato.data_previsao_termino || contrato.previsao_termino)}
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
                            Nenhum contrato
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
      )}

      {/* VISUALIZAÇÍO EM CARDS/BLOCOS */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {contratos.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 text-sm">Nenhum contrato encontrado</div>
            </div>
          ) : (
            contratos.map((contrato) => {
              const estagioKanban = statusParaEstagioKanban(contrato.status);
              const cor = ESTAGIOS_CORES[estagioKanban];
              return (
                <div
                  key={contrato.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all overflow-hidden"
                >
                  {/* Header com Avatar */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Avatar
                        nome={contrato.cliente_nome ?? "Cliente"}
                        avatar_url={contrato.cliente_avatar_url}
                        foto_url={contrato.cliente_foto_url}
                        tamanho={40}
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900 block">
                          {contrato.cliente_nome ?? "Cliente nÍo informado"}
                        </span>
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${cor}20`, color: cor }}
                        >
                          {ESTAGIOS_LABELS[contrato.status] || ESTAGIOS_LABELS[estagioKanban]}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => navigate(`/contratos/editar/${contrato.id}`)}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Editar contrato"
                      >
                        <Edit2 size={16} className="text-gray-500" />
                      </button>
                      <button
                        onClick={() => setContratoParaExcluir(contrato)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir contrato"
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <button
                    onClick={() => navigate(`/contratos/${contrato.id}`)}
                    className="w-full text-left p-4"
                  >
                    {/* Número/Título do Contrato */}
                    <h3 className="text-base font-normal text-[#1A1A1A] mb-2 line-clamp-2">
                      {contrato.numero_contrato || contrato.numero || contrato.descricao || "Sem título"}
                    </h3>

                    {/* Data de CriaçÍo */}
                    <div className="text-xs text-gray-400 mb-3">
                      Criado em {new Date(contrato.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </div>

                    {/* Unidade de Negócio */}
                    <div className="mb-3">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-normal text-white capitalize"
                        style={{
                          backgroundColor:
                            contrato.unidade_negocio?.toLowerCase() === 'arquitetura' ? '#5E9B94' :
                            contrato.unidade_negocio?.toLowerCase() === 'engenharia' ? '#2B4580' :
                            contrato.unidade_negocio?.toLowerCase() === 'marcenaria' ? '#8B5E3C' :
                            contrato.unidade_negocio?.toLowerCase()?.includes('moma') ? '#10B981' :
                            '#6B7280'
                        }}
                      >
                        {contrato.unidade_negocio?.replace('_', ' ') || 'NÍo definido'}
                      </span>
                    </div>

                    {/* Valor e Data */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="text-[20px] font-normal text-[#1A1A1A]">
                        {formatarValor(contrato.valor_total)}
                      </div>
                      {(contrato.data_previsao_termino || contrato.previsao_termino) && (
                        <div className="text-xs text-gray-500">
                          {formatarData(contrato.data_previsao_termino || contrato.previsao_termino)}
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÍO DE EXCLUSÍO */}
      {contratoParaExcluir && (
        <ConfirmDialog
          isOpen={true}
          title="Excluir Contrato?"
          message={`Deseja realmente excluir o contrato "${contratoParaExcluir.numero_contrato || contratoParaExcluir.numero || contratoParaExcluir.descricao || 'Sem título'}"? Esta açÍo nÍo poderá ser desfeita e todos os dados relacionados serÍo perdidos.`}
          confirmLabel="Excluir"
          cancelLabel="Cancelar"
          type="danger"
          onConfirm={deletarContrato}
          onCancel={() => setContratoParaExcluir(null)}
        />
      )}
    </div>
  );
}

