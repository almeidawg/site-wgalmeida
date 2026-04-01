/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// PÁGINA: Timeline do Cronograma (Gantt Melhorado)
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  listarTarefasComComentarios,
  atualizarOrdemTarefas,
  atualizarDescricaoTarefa,
  atualizarTarefa,
  criarComentario,
} from "@/lib/cronogramaApi";
import { buscarProjetoCronograma } from "@/lib/cronogramaApi";
import type {
  TarefaComComentarios,
  ProjetoCompletoTimeline,
  StatusTarefa,
  CategoriaTarefa,
} from "@/types/cronograma";
import {
  getCategoriaIcon,
  getCategoriaColor,
  getStatusTarefaColor,
  tarefaEstaAtrasada,
  calcularDiasRestantes,
  formatarValor,
} from "@/types/cronograma";
// Toast notifications - remover se nÍo tiver a lib instalada
// import { toast } from "sonner";
import dayjs from "dayjs";
import { formatarDataHora } from "@/lib/utils";
import { useUsuarioLogado } from "@/hooks/useUsuarioLogado";
import TarefaFotoButton from "@/components/cronograma/TarefaFotoButton";

// Toast temporário (substituir por biblioteca depois)
const toast = {
  success: (msg: string) => console.log('✅', msg),
  error: (msg: string) => console.error('❌', msg),
};

const WG_COLORS = {
  barra: "#F25C26",
  fundo: "#F3F3F3",
  borda: "#E5E5E5",
  texto: "#2E2E2E",
  cinza: "#4C4C4C",
};

export default function CronogramaTimelinePage() {
  const { id } = useParams();
  const { usuario } = useUsuarioLogado();
  const [projeto, setProjeto] = useState<ProjetoCompletoTimeline | null>(null);
  const [tarefas, setTarefas] = useState<TarefaComComentarios[]>([]);
  const [loading, setLoading] = useState(true);

  // ID do colaborador logado
  const colaboradorId = usuario?.pessoa_id || "";

  // Filtros
  const [mostrarConcluidas, setMostrarConcluidas] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaTarefa | "todas">("todas");

  // EdiçÍo inline
  const [editandoDescricao, setEditandoDescricao] = useState<string | null>(null);
  const [descricaoTemp, setDescricaoTemp] = useState("");

  // Comentários
  const [tarefaComentando, setTarefaComentando] = useState<string | null>(null);
  const [comentarioTemp, setComentarioTemp] = useState("");

  useEffect(() => {
    carregarDados();
  }, [id]);

  async function carregarDados() {
    if (!id) return;

    setLoading(true);
    try {
      const [projetoData, tarefasData] = await Promise.all([
        buscarProjetoCronograma(id),
        listarTarefasComComentarios(id),
      ]);

      setProjeto(projetoData as ProjetoCompletoTimeline | null);
      setTarefas(tarefasData as TarefaComComentarios[]);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar cronograma");
    } finally {
      setLoading(false);
    }
  }

  async function handleDragEnd(result: any) {
    if (!result.destination) return;

    const novaTarefas = Array.from(tarefas);
    const [removed] = novaTarefas.splice(result.source.index, 1);
    novaTarefas.splice(result.destination.index, 0, removed);

    setTarefas(novaTarefas);

    // Atualizar ordem no backend
    try {
      const updates = novaTarefas.map((tarefa, index) => ({
        id: tarefa.id,
        ordem: index + 1,
      }));

      await atualizarOrdemTarefas(updates);
      toast.success("Ordem atualizada!");
    } catch (error) {
      console.error("Erro ao atualizar ordem:", error);
      toast.error("Erro ao atualizar ordem");
      carregarDados(); // Reverter
    }
  }

  async function handleSalvarDescricao(tarefaId: string) {
    if (!descricaoTemp.trim()) {
      toast.error("DescriçÍo nÍo pode estar vazia");
      return;
    }

    try {
      await atualizarDescricaoTarefa(tarefaId, descricaoTemp);
      toast.success("DescriçÍo atualizada!");
      setEditandoDescricao(null);
      carregarDados();
    } catch (error) {
      console.error("Erro ao atualizar descriçÍo:", error);
      toast.error("Erro ao atualizar descriçÍo");
    }
  }

  async function handleMudarStatus(tarefaId: string, novoStatus: StatusTarefa) {
    try {
      await atualizarTarefa(tarefaId, { status: novoStatus });
      toast.success("Status atualizado!");
      carregarDados();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status");
    }
  }

  async function handleAdicionarComentario(tarefaId: string) {
    if (!comentarioTemp.trim()) {
      toast.error("Comentário nÍo pode estar vazio");
      return;
    }

    try {
      await criarComentario({
        tarefa_id: tarefaId,
        comentario: comentarioTemp,
        created_by: usuario?.id || colaboradorId,
      });
      toast.success("Comentário adicionado!");
      setTarefaComentando(null);
      setComentarioTemp("");
      carregarDados();
    } catch (error) {
      console.error("Erro ao adicionar comentário:", error);
      toast.error("Erro ao adicionar comentário");
    }
  }

  // Filtrar tarefas
  const tarefasFiltradas = tarefas.filter((t) => {
    if (!mostrarConcluidas && (t.status_tarefa || t.status) === "concluido") return false;
    if (filtroCategoria !== "todas" && t.categoria !== filtroCategoria) return false;
    return true;
  });

  // Cálculos Gantt
  const inicioProjeto = tarefasFiltradas.length > 0
    ? dayjs(
        tarefasFiltradas.reduce(
          (menor, t) =>
            t.inicio && dayjs(t.inicio).isBefore(dayjs(menor)) ? t.inicio : menor,
          tarefasFiltradas[0].inicio || new Date().toISOString()
        )
      )
    : dayjs();

  function diasEntre(i: string, f: string) {
    return dayjs(f).diff(dayjs(i), "day") || 1;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh] text-[#4C4C4C]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando timeline...</p>
        </div>
      </div>
    );
  }

  if (!projeto) {
    return (
      <div className="flex justify-center items-center h-[50vh] text-[#4C4C4C]">
        Projeto nÍo encontrado
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-[18px] sm:text-[24px] font-normal text-[#2E2E2E]">
            📅 {projeto.contrato_numero || projeto.titulo}
          </h1>
          <p className="text-sm text-[#4C4C4C] mt-1">{projeto.cliente_nome}</p>
        </div>

        {/* Estatísticas */}
        <div className="bg-white border border-[#E5E5E5] rounded-lg p-3 sm:p-4 flex items-center space-x-4 sm:space-x-6">
          <div className="text-center">
            <p className="text-[12px] text-[#4C4C4C]">Progresso</p>
            <p className="text-[20px] font-normal text-primary">
              {projeto.progresso_percentual}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-[12px] text-[#4C4C4C]">Concluídas</p>
            <p className="text-[20px] font-normal text-[#10B981]">
              {projeto.tarefas_concluidas}/{projeto.total_tarefas}
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-[#E5E5E5] rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:space-x-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={mostrarConcluidas}
              onChange={(e) => setMostrarConcluidas(e.target.checked)}
              className="w-4 h-4 text-primary rounded"
            />
            <span className="text-[14px] text-[#4C4C4C]">Mostrar concluídas</span>
          </label>

          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value as any)}
            className="text-[14px] border border-[#E5E5E5] rounded-lg px-3 py-1.5 text-[#2E2E2E]"
          >
            <option value="todas">Todas as categorias</option>
            <option value="material">📦 Material</option>
            <option value="mao_obra">👷 MÍo de Obra</option>
            <option value="servico">🔧 Serviço</option>
            <option value="equipamento">🏗️ Equipamento</option>
          </select>
        </div>

        <span className="text-sm text-[#4C4C4C]">
          {tarefasFiltradas.length} tarefa{tarefasFiltradas.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Timeline/Gantt */}
      {tarefasFiltradas.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[#4C4C4C]">Nenhuma tarefa encontrada com os filtros aplicados.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E5E5] rounded-xl shadow p-4 sm:p-6 overflow-x-auto -mx-4 sm:mx-0">
          <table className="min-w-[900px] w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E5E5]">
                <th className="p-3 text-left font-medium text-[#4C4C4C] w-[40px]"></th>
                <th className="p-3 text-left font-medium text-[#4C4C4C] w-[300px]">
                  Tarefa
                </th>
                <th className="p-3 text-left font-medium text-[#4C4C4C] w-[100px]">
                  Status
                </th>
                <th className="p-3 text-left font-medium text-[#4C4C4C] w-[100px]">
                  Valor
                </th>
                <th className="p-3 text-left font-medium text-[#4C4C4C]">
                  Linha do Tempo
                </th>
              </tr>
            </thead>

            <tbody>
              {tarefasFiltradas.map((tarefa, index) => {
                const offsetDias = tarefa.inicio
                  ? diasEntre(inicioProjeto.format("YYYY-MM-DD"), tarefa.inicio)
                  : 0;
                const duracaoDias = tarefa.inicio && tarefa.fim
                  ? diasEntre(tarefa.inicio, tarefa.fim)
                  : 1;
                const pxPorDia = 20;
                const atrasada = tarefaEstaAtrasada(tarefa);
                const diasRestantes = calcularDiasRestantes(tarefa);

                return (
                  <tr key={tarefa.id} className="border-b border-[#E5E5E5] hover:bg-[#fafafa] group">
                    {/* Ícone de categoria */}
                    <td className="p-3">
                      <span className="text-2xl">
                        {tarefa.categoria ? getCategoriaIcon(tarefa.categoria) : "📋"}
                      </span>
                    </td>

                    {/* Nome da tarefa (editável) */}
                    <td className="p-3">
                      {editandoDescricao === tarefa.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={descricaoTemp}
                            onChange={(e) => setDescricaoTemp(e.target.value)}
                            className="w-full border border-[#E5E5E5] rounded px-2 py-1 text-sm"
                            autoFocus
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleSalvarDescricao(tarefa.id)}
                              className="text-xs bg-[#10B981] text-white px-3 py-1 rounded hover:bg-[#059669]"
                            >
                              Salvar
                            </button>
                            <button
                              onClick={() => setEditandoDescricao(null)}
                              className="text-xs bg-[#6B7280] text-white px-3 py-1 rounded hover:bg-[#4B5563]"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-[#2E2E2E]">
                              {tarefa.descricao_editavel || tarefa.titulo}
                            </p>
                            <button
                              onClick={() => {
                                setEditandoDescricao(tarefa.id);
                                setDescricaoTemp(tarefa.descricao_editavel || tarefa.titulo);
                              }}
                              className="opacity-0 group-hover:opacity-100 text-[#4C4C4C] hover:text-primary"
                            >
                              ✏️
                            </button>
                            {projeto && colaboradorId && (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <TarefaFotoButton
                                  tarefa={tarefa}
                                  colaboradorId={colaboradorId}
                                  clienteId={projeto.cliente_id || ""}
                                  onFotoVinculada={carregarDados}
                                  variant="ghost"
                                  size="sm"
                                  showBadge={true}
                                />
                              </div>
                            )}
                          </div>

                          {/* Quantidade e unidade */}
                          {tarefa.quantidade && (
                            <p className="text-xs text-[#4C4C4C] mt-1">
                              {tarefa.quantidade} {tarefa.unidade || "un"}
                            </p>
                          )}

                          {/* Comentários */}
                          {(tarefa.total_comentarios ?? 0) > 0 && (
                            <button
                              onClick={() => setTarefaComentando(tarefa.id)}
                              className="text-xs text-primary mt-1 hover:underline"
                            >
                              💬 {tarefa.total_comentarios ?? 0} comentário
                              {(tarefa.total_comentarios ?? 0) !== 1 ? "s" : ""}
                            </button>
                          )}

                          {/* Avisos */}
                          {atrasada && (
                            <p className="text-xs text-red-600 mt-1">
                              ⚠️ Atrasada {Math.abs(diasRestantes || 0)} dias
                            </p>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="p-3">
                      <select
                        value={(tarefa.status_tarefa || tarefa.status || "pendente") as StatusTarefa}
                        onChange={(e) =>
                          handleMudarStatus(tarefa.id, e.target.value as StatusTarefa)
                        }
                        className="text-xs rounded-full px-2 py-1 border-0"
                        style={{
                          backgroundColor: getStatusTarefaColor(
                            (tarefa.status_tarefa || tarefa.status || "pendente") as StatusTarefa
                          ),
                          color: "white",
                        }}
                      >
                        <option value="pendente">Pendente</option>
                        <option value="em_andamento">Em Andamento</option>
                        <option value="concluido">Concluída</option>
                        <option value="cancelada">Cancelada</option>
                      </select>
                    </td>

                    {/* Valor */}
                    <td className="p-3 text-[#2E2E2E] font-medium">
                      {Number(tarefa.valor_tarefa ?? 0) > 0
                        ? formatarValor(Number(tarefa.valor_tarefa ?? 0))
                        : "-"}
                    </td>

                    {/* Barra do Gantt */}
                    <td className="p-3">
                      <div
                        className="relative h-8 rounded-lg"
                        style={{
                          background: WG_COLORS.fundo,
                          border: `1px solid ${WG_COLORS.borda}`,
                        }}
                      >
                        <div
                          className="absolute h-8 rounded-lg shadow-md transition-all flex items-center px-2"
                          style={{
                            marginLeft: offsetDias * pxPorDia,
                            width: duracaoDias * pxPorDia,
                            background: atrasada
                              ? "#EF4444"
                              : tarefa.categoria
                              ? getCategoriaColor(tarefa.categoria)
                              : WG_COLORS.barra,
                            minWidth: "40px",
                          }}
                        >
                          <span className="text-xs text-white font-medium truncate">
                            {duracaoDias}d
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Comentários */}
      {tarefaComentando && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setTarefaComentando(null)}
        >
          <div
            className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-2xl max-h-[80vh] overflow-auto mx-4 sm:mx-0"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-normal text-[#2E2E2E] mb-4">
              💬 Comentários da Tarefa
            </h3>

            {/* Lista de comentários */}
            {tarefas
              .find((t) => t.id === tarefaComentando)
              ?.comentarios?.map((comentario: any, idx: number) => (
                <div key={comentario?.id || idx} className="mb-4 pb-4 border-b border-[#E5E5E5]">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-normal">
                      {comentario?.usuario_nome?.[0] || "?"}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-[#2E2E2E]">
                          {comentario?.usuario_nome || "Usuário"}
                        </span>
                        <span className="text-xs text-[#4C4C4C]">
                          {formatarDataHora(comentario?.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-[#4C4C4C]">{comentario?.comentario}</p>
                    </div>
                  </div>
                </div>
              ))}

            {/* Adicionar comentário */}
            <div className="space-y-2 mt-4">
              <textarea
                value={comentarioTemp}
                onChange={(e) => setComentarioTemp(e.target.value)}
                placeholder="Digite seu comentário..."
                className="w-full border border-[#E5E5E5] rounded-lg p-3 text-sm resize-none"
                rows={3}
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setTarefaComentando(null);
                    setComentarioTemp("");
                  }}
                  className="px-4 py-2 text-[14px] bg-[#6B7280] text-white rounded-lg hover:bg-[#4B5563]"
                >
                  Fechar
                </button>
                <button
                  onClick={() => handleAdicionarComentario(tarefaComentando)}
                  className="px-4 py-2 text-[14px] bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Adicionar Comentário
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

