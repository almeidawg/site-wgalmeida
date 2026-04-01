/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";
import {
  buscarOS,
  alterarStatusOS,
  duplicarOS,
  aprovarOrcamento,
  criarItemOS,
  deletarItemOS,
  marcarItemAplicado,
  type OrdemServicoCompleta,
  type ItemOSFormData,
} from "@/lib/assistenciaApi";
import {
  STATUS_OS_LABELS,
  STATUS_OS_COLORS,
  PRIORIDADE_LABELS,
  PRIORIDADE_COLORS,
  TIPO_ATENDIMENTO_LABELS,
  formatarValor,
  formatarData,
  formatarDataHora,
  getStatusOSIcon,
  getPrioridadeIcon,
  getUrgenciaOS,
  podeIniciarAtendimento,
  podeConcluirOS,
  podeCancelarOS,
  podeAprovarOrcamento,
  validarItem,
} from "@/types/assistenciaTecnica";
import type { StatusOS } from "@/types/assistenciaTecnica";
import { useToast } from "@/components/ui/use-toast";

export default function AssistenciaDetalhePage() {
  const { id } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [os, setOS] = useState<OrdemServicoCompleta | null>(null);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<"detalhes" | "itens" | "historico">("detalhes");

  // Novo item
  const [novoItem, setNovoItem] = useState<ItemOSFormData>({
    descricao: "",
    quantidade: 1,
    unidade: "UN",
    valor_unitario: 0,
  });

  useEffect(() => {
    if (id) {
      carregar();
    }
  }, [id]);

  async function carregar() {
    if (!id) return;

    setLoading(true);
    try {
      const data = await buscarOS(id);
      setOS(data);
    } catch (err) {
      console.error("Erro ao carregar OS:", err);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao carregar ordem de serviço" });
    }
    setLoading(false);
  }

  async function mudarStatus(novoStatus: StatusOS, observacao?: string) {
    if (!id) return;

    try {
      await alterarStatusOS(id, novoStatus, observacao);
      await carregar();
      toast({ title: "Sucesso", description: `Status alterado para ${STATUS_OS_LABELS[novoStatus]}` });
    } catch (err) {
      console.error("Erro ao alterar status:", err);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao alterar status" });
    }
  }

  async function duplicar() {
    if (!id || !confirm("Duplicar esta OS?")) return;

    try {
      const novaOS = await duplicarOS(id);
      toast({ title: "Sucesso", description: "OS duplicada com sucesso!" });
      navigate(`/assistencia/detalhe/${novaOS.id}`);
    } catch (err) {
      console.error("Erro ao duplicar OS:", err);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao duplicar OS" });
    }
  }

  async function aprovar() {
    if (!id || !confirm("Aprovar orçamento?")) return;

    try {
      await aprovarOrcamento(id);
      await carregar();
      toast({ title: "Sucesso", description: "Orçamento aprovado!" });
    } catch (err) {
      console.error("Erro ao aprovar orçamento:", err);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao aprovar orçamento" });
    }
  }

  async function adicionarItem() {
    if (!id) return;

    const erros = validarItem(novoItem);
    if (erros.length > 0) {
      toast({ variant: "destructive", title: "Erros de validaçÍo", description: erros.join(", ") });
      return;
    }

    try {
      await criarItemOS(id, novoItem);
      setNovoItem({
        descricao: "",
        quantidade: 1,
        unidade: "UN",
        valor_unitario: 0,
      });
      await carregar();
    } catch (err) {
      console.error("Erro ao adicionar item:", err);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao adicionar item" });
    }
  }

  async function removerItem(itemId: string) {
    if (!confirm("Remover este item?")) return;

    try {
      await deletarItemOS(itemId);
      await carregar();
    } catch (err) {
      console.error("Erro ao remover item:", err);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao remover item" });
    }
  }

  async function toggleItemAplicado(itemId: string, aplicado: boolean) {
    try {
      await marcarItemAplicado(itemId, !aplicado);
      await carregar();
    } catch (err) {
      console.error("Erro ao marcar item:", err);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao marcar item" });
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh] text-[#4C4C4C]">
        Carregando ordem de serviço...
      </div>
    );
  }

  if (!os) {
    return (
      <div className="flex justify-center items-center h-[50vh] text-[#4C4C4C]">
        Ordem de serviço não encontrada
      </div>
    );
  }

  const urgencia = getUrgenciaOS(os);

  return (
    <div className={`${LAYOUT.pageContainer} ${LAYOUT.sectionGap}`}>
      {/* HEADER */}
      <div className={LAYOUT.pageHeader}>
        <div>
          <div className={LAYOUT.pageTitleWrapper}>
            <span className="text-3xl">{getStatusOSIcon(os.status)}</span>
            <div>
              <h1 className={TYPOGRAPHY.pageTitle}>OS {os.numero}</h1>
              <p className={TYPOGRAPHY.pageSubtitle}>{os.titulo}</p>
            </div>
          </div>
        </div>

        <div className={LAYOUT.pageActions}>
          <button
            onClick={() => navigate("/assistencia")}
            className="px-3 py-2 text-[13px] sm:text-[14px] bg-white border border-[#E5E5E5] rounded hover:bg-[#F3F3F3]"
          >
            Voltar
          </button>
          <button
            onClick={duplicar}
            className="px-3 py-2 text-[13px] sm:text-[14px] bg-white border border-[#E5E5E5] rounded hover:bg-[#F3F3F3]"
          >
            Duplicar
          </button>
          <Link
            to={`/assistencia/editar/${os.id}`}
            className="px-3 sm:px-4 py-2 text-[13px] sm:text-[14px] bg-primary text-white rounded hover:bg-[#d54b1c]"
          >
            Editar
          </Link>
        </div>
      </div>

      {/* STATUS E BADGES */}
      <div className="flex gap-2 sm:gap-3 flex-wrap">
        <div
          className="px-4 py-2 rounded text-white font-normal"
          style={{ backgroundColor: STATUS_OS_COLORS[os.status] }}
        >
          {STATUS_OS_LABELS[os.status]}
        </div>
        <div
          className="px-4 py-2 rounded text-white font-normal flex items-center gap-2"
          style={{ backgroundColor: PRIORIDADE_COLORS[os.prioridade] }}
        >
          <span>{getPrioridadeIcon(os.prioridade)}</span>
          <span>{PRIORIDADE_LABELS[os.prioridade]}</span>
        </div>
        <div className="px-4 py-2 rounded bg-gray-600 text-white font-normal">
          {TIPO_ATENDIMENTO_LABELS[os.tipo_atendimento]}
        </div>
        {urgencia.urgente && (
          <div
            className="px-4 py-2 rounded text-white font-normal"
            style={{ backgroundColor: urgencia.color }}
          >
            {urgencia.label}
          </div>
        )}
        {os.valor_aprovado_cliente && (
          <div className="px-4 py-2 rounded bg-green-600 text-white font-normal">
            ✅ Orçamento Aprovado
          </div>
        )}
      </div>

      {/* AÇÕES RÁPIDAS */}
      <div className="bg-white rounded-xl shadow-md border border-[#E5E5E5] p-4">
        <h2 className="text-sm font-normal text-[#2E2E2E] mb-3">Ações Rápidas</h2>
        <div className="flex flex-wrap gap-2">
          {podeIniciarAtendimento(os) && (
            <button
              onClick={() => mudarStatus("em_atendimento", "Atendimento iniciado")}
              className="px-3 py-2 text-[14px] bg-primary text-white rounded hover:bg-primary/90"
            >
              🔧 Iniciar Atendimento
            </button>
          )}
          {podeConcluirOS(os) && (
            <button
              onClick={() => mudarStatus("concluida", "Atendimento concluído")}
              className="px-3 py-2 text-[14px] bg-green-600 text-white rounded hover:bg-green-700"
            >
              ✅ Concluir Atendimento
            </button>
          )}
          {podeAprovarOrcamento(os) && (
            <button
              onClick={aprovar}
              className="px-3 py-2 text-[14px] bg-green-600 text-white rounded hover:bg-green-700"
            >
              💰 Aprovar Orçamento
            </button>
          )}
          {os.status === "em_atendimento" && (
            <>
              <button
                onClick={() => mudarStatus("aguardando_peca", "Aguardando chegada de peças")}
                className="px-3 py-2 text-[14px] bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                ⏳ Aguardando Peça
              </button>
              <button
                onClick={() => mudarStatus("aguardando_cliente", "Aguardando retorno do cliente")}
                className="px-3 py-2 text-[14px] bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                👤 Aguardando Cliente
              </button>
            </>
          )}
          {podeCancelarOS(os) && (
            <button
              onClick={() => mudarStatus("cancelada", "OS cancelada")}
              className="px-3 py-2 text-[14px] bg-red-600 text-white rounded hover:bg-red-700"
            >
              ❌ Cancelar OS
            </button>
          )}
        </div>
      </div>

      {/* ABAS */}
      <div className="bg-white rounded-xl shadow-md border border-[#E5E5E5]">
        <div className="border-b border-[#E5E5E5] flex">
          <button
            onClick={() => setAbaAtiva("detalhes")}
            className={`px-4 py-3 text-[14px] font-medium ${
              abaAtiva === "detalhes"
                ? "border-b-2 border-[#F25C26] text-[#F25C26]"
                : "text-[#4C4C4C] hover:text-[#2E2E2E]"
            }`}
          >
            Detalhes
          </button>
          <button
            onClick={() => setAbaAtiva("itens")}
            className={`px-4 py-3 text-[14px] font-medium ${
              abaAtiva === "itens"
                ? "border-b-2 border-[#F25C26] text-[#F25C26]"
                : "text-[#4C4C4C] hover:text-[#2E2E2E]"
            }`}
          >
            Itens/Peças ({os.total_itens})
          </button>
          <button
            onClick={() => setAbaAtiva("historico")}
            className={`px-4 py-3 text-[14px] font-medium ${
              abaAtiva === "historico"
                ? "border-b-2 border-[#F25C26] text-[#F25C26]"
                : "text-[#4C4C4C] hover:text-[#2E2E2E]"
            }`}
          >
            Histórico ({os.historico?.length || 0})
          </button>
        </div>

        <div className="p-6">
          {/* ABA DETALHES */}
          {abaAtiva === "detalhes" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-normal text-[#2E2E2E] mb-3">Informações do Cliente</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-[#4C4C4C]">Nome:</span>
                      <span className="ml-2 font-normal">{os.cliente?.nome || "-"}</span>
                    </div>
                    {os.cliente?.email && (
                      <div>
                        <span className="text-[#4C4C4C]">Email:</span>
                        <span className="ml-2">{os.cliente.email}</span>
                      </div>
                    )}
                    {os.cliente?.telefone && (
                      <div>
                        <span className="text-[#4C4C4C]">Telefone:</span>
                        <span className="ml-2">{os.cliente.telefone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-normal text-[#2E2E2E] mb-3">Responsável</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-[#4C4C4C]">Técnico:</span>
                      <span className="ml-2 font-normal">{os.tecnico?.nome || "não atribuído"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-normal text-[#2E2E2E] mb-2">DescriçÍo do Problema</h3>
                <p className="text-sm text-[#4C4C4C] whitespace-pre-wrap bg-[#F3F3F3] p-3 rounded">
                  {os.descricao}
                </p>
              </div>

              {os.solucao && (
                <div>
                  <h3 className="text-sm font-normal text-[#2E2E2E] mb-2">SoluçÍo Aplicada</h3>
                  <p className="text-sm text-[#4C4C4C] whitespace-pre-wrap bg-green-50 p-3 rounded border border-green-200">
                    {os.solucao}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#F3F3F3] p-4 rounded">
                  <div className="text-xs text-[#4C4C4C] mb-1">Data Abertura</div>
                  <div className="font-normal">{formatarData(os.data_abertura)}</div>
                </div>
                <div className="bg-[#F3F3F3] p-4 rounded">
                  <div className="text-xs text-[#4C4C4C] mb-1">PrevisÍo</div>
                  <div className="font-normal">{formatarData(os.data_previsao)}</div>
                </div>
                {os.data_conclusao && (
                  <div className="bg-green-50 p-4 rounded border border-green-200">
                    <div className="text-xs text-green-700 mb-1">Data ConclusÍo</div>
                    <div className="font-normal text-green-800">{formatarData(os.data_conclusao)}</div>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <h3 className="text-sm font-normal text-[#2E2E2E] mb-3">Valores</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#4C4C4C]">MÍo de Obra:</span>
                    <span className="font-normal">{formatarValor(os.valor_mao_obra)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4C4C4C]">Peças/Materiais:</span>
                    <span className="font-normal">{formatarValor(os.valor_pecas)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-blue-300">
                    <span className="font-normal text-[#2E2E2E]">TOTAL:</span>
                    <span className="font-normal text-[#F25C26] text-lg">{formatarValor(os.valor_total)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA ITENS */}
          {abaAtiva === "itens" && (
            <div className="space-y-4">
              {/* FORMULÁRIO NOVO ITEM */}
              <div className="bg-[#F3F3F3] p-4 rounded space-y-3">
                <h3 className="text-sm font-normal text-[#2E2E2E]">Adicionar Item/Peça</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      placeholder="DescriçÍo do item"
                      value={novoItem.descricao}
                      onChange={(e) =>
                        setNovoItem({ ...novoItem, descricao: e.target.value })
                      }
                      className="w-full border border-[#E5E5E5] rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Quantidade"
                      value={novoItem.quantidade}
                      onChange={(e) =>
                        setNovoItem({ ...novoItem, quantidade: Number(e.target.value) })
                      }
                      className="w-full border border-[#E5E5E5] rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Unidade"
                      value={novoItem.unidade}
                      onChange={(e) =>
                        setNovoItem({ ...novoItem, unidade: e.target.value })
                      }
                      className="w-full border border-[#E5E5E5] rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Valor Unit."
                      step="0.01"
                      value={novoItem.valor_unitario}
                      onChange={(e) =>
                        setNovoItem({ ...novoItem, valor_unitario: Number(e.target.value) })
                      }
                      className="w-full border border-[#E5E5E5] rounded px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <button
                  onClick={adicionarItem}
                  className="px-4 py-2 bg-[#10B981] text-white rounded text-[14px] hover:bg-[#059669]"
                >
                  Adicionar Item
                </button>
              </div>

              {/* LISTA DE ITENS */}
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F3F3F3]">
                  <tr>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">DescriçÍo</th>
                    <th className="p-2 text-left">Qtd</th>
                    <th className="p-2 text-left">Unidade</th>
                    <th className="p-2 text-left">Valor Unit.</th>
                    <th className="p-2 text-left">Total</th>
                    <th className="p-2 text-left">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {os.itens && os.itens.map((item) => (
                    <tr key={item.id} className={`border-b ${item.aplicado ? "bg-green-50" : ""}`}>
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={item.aplicado}
                          onChange={() => toggleItemAplicado(item.id, item.aplicado)}
                          className="w-4 h-4"
                          title={item.aplicado ? "Item aplicado" : "Item não aplicado"}
                        />
                      </td>
                      <td className="p-2">{item.descricao}</td>
                      <td className="p-2">{item.quantidade}</td>
                      <td className="p-2">{item.unidade}</td>
                      <td className="p-2">{formatarValor(item.valor_unitario)}</td>
                      <td className="p-2 font-normal">{formatarValor(item.valor_total)}</td>
                      <td className="p-2">
                        <button
                          onClick={() => removerItem(item.id)}
                          className="text-red-600 hover:underline text-sm"
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!os.itens || os.itens.length === 0) && (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-[#4C4C4C]">
                        Nenhum item adicionado
                      </td>
                    </tr>
                  )}
                </tbody>
                {os.itens && os.itens.length > 0 && (
                  <tfoot className="bg-[#F3F3F3] font-normal">
                    <tr>
                      <td colSpan={5} className="p-2 text-right">
                        TOTAL PEÇAS:
                      </td>
                      <td className="p-2">{formatarValor(os.valor_pecas)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
              </div>
            </div>
          )}

          {/* ABA HISTÓRICO */}
          {abaAtiva === "historico" && (
            <div className="space-y-3">
              {os.historico && os.historico.length > 0 ? (
                os.historico.map((h) => (
                  <div key={h.id} className="border-l-4 border-blue-500 pl-4 py-2 bg-[#F3F3F3] rounded-r">
                    <div className="flex justify-between items-start mb-1">
                      <div className="text-sm font-medium text-[#2E2E2E]">{h.descricao}</div>
                      <div className="text-xs text-[#4C4C4C]">{formatarDataHora(h.created_at)}</div>
                    </div>
                    {h.usuario && (
                      <div className="text-xs text-[#4C4C4C]">Por: {h.usuario.nome}</div>
                    )}
                    {(h.status_anterior || h.status_novo) && (
                      <div className="text-xs text-[#4C4C4C] mt-1">
                        {h.status_anterior && <span>De: {STATUS_OS_LABELS[h.status_anterior]} </span>}
                        {h.status_novo && <span>→ Para: {STATUS_OS_LABELS[h.status_novo]}</span>}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center text-[#4C4C4C] py-4">
                  Nenhum histórico registrado
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


