/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// PAGINA: Lista de Compras (Workflow de Compras)
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import ResponsiveTable from "@/components/ResponsiveTable";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { normalizeSearchTerm } from "@/utils/searchUtils";
import {
  listarItensCompras,
  listarProjetosCompras,
  listarCategoriasCompras,
  atualizarStatusCompra,
  deletarItemCompra,
  obterEstatisticasCompras,
  formatarMoeda,
  STATUS_COMPRA_LABELS,
  STATUS_COMPRA_COLORS,
  TIPO_COMPRA_LABELS,
  TIPO_CONTA_LABELS,
  type ListaCompraItem,
  type ProjetoCompras,
  type CategoriaCompras,
  type StatusCompra,
  type EstatisticasCompras,
} from "@/lib/listaComprasApi";

export default function ListaComprasPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [itens, setItens] = useState<ListaCompraItem[]>([]);
  const [projetos, setProjetos] = useState<ProjetoCompras[]>([]);
  const [categorias, setCategorias] = useState<CategoriaCompras[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasCompras | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroProjeto, setFiltroProjeto] = useState<string>("");
  const [filtroTipoConta, setFiltroTipoConta] = useState<string>("todos");
  const [filtroTipoCompra, setFiltroTipoCompra] = useState<string>("todos");
  const [busca, setBusca] = useState("");

  const comprasColumns = [
    { label: "Código", key: "codigo" },
    { label: "DescriçÍo", key: "descricao" },
    { label: "Fornecedor", key: "fornecedor" },
    { label: "Ambiente", key: "ambiente" },
    {
      label: "Tipo",
      key: "tipo_compra",
      render: (val: any) => (
        <span className="text-xs">{TIPO_COMPRA_LABELS[val as keyof typeof TIPO_COMPRA_LABELS] || val}</span>
      ),
    },
    {
      label: "Status",
      key: "status",
      render: (val: any) => {
        const colors = STATUS_COMPRA_COLORS[val as keyof typeof STATUS_COMPRA_COLORS] || "bg-gray-100 text-gray-700";
        const label = STATUS_COMPRA_LABELS[val as keyof typeof STATUS_COMPRA_LABELS] || val;
        return (
          <span className={`px-2 py-1 rounded text-xs font-medium ${colors}`}>
            {label}
          </span>
        );
      },
    },
    {
      label: "Valor",
      key: "valor_total",
      render: (val: any) => formatarMoeda(val || 0),
    },
    {
      label: "Ações",
      key: "id",
      render: (val: any, row: any) => (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => navigate(`/compras/editar/${val}`)}
            className="text-blue-600 hover:underline text-xs"
          >
            Editar
          </button>
          <button
            onClick={() => handleDeletar(val)}
            className="text-red-600 hover:underline text-xs"
          >
            Deletar
          </button>
        </div>
      ),
    },
  ];

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setLoading(true);
      const [itensData, projetosData, categoriasData, statsData] =
        await Promise.all([
          listarItensCompras(),
          listarProjetosCompras(),
          listarCategoriasCompras(),
          obterEstatisticasCompras(),
        ]);
      setItens(itensData);
      setProjetos(projetosData);
      setCategorias(categoriasData);
      setEstatisticas(statsData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({ title: "Erro", description: "Erro ao carregar dados", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleAtualizarStatus(id: string, novoStatus: StatusCompra) {
    try {
      const itemAtualizado = await atualizarStatusCompra(id, novoStatus);
      setItens((prev) =>
        prev.map((item) => (item.id === id ? itemAtualizado : item))
      );
      // Recarregar estatisticas
      const stats = await obterEstatisticasCompras();
      setEstatisticas(stats);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({ title: "Erro", description: "Erro ao atualizar status do item", variant: "destructive" });
    }
  }

  async function handleDeletar(id: string) {
    if (!confirm("Deseja realmente excluir este item?")) return;
    try {
      await deletarItemCompra(id);
      setItens((prev) => prev.filter((item) => item.id !== id));
      const stats = await obterEstatisticasCompras();
      setEstatisticas(stats);
    } catch (error) {
      console.error("Erro ao deletar item:", error);
      toast({ title: "Erro", description: "Erro ao excluir item", variant: "destructive" });
    }
  }

  // Filtrar itens
  const itensFiltrados = itens.filter((item) => {
    if (filtroStatus !== "todos" && item.status !== filtroStatus) return false;
    if (filtroProjeto && item.projeto_id !== filtroProjeto) return false;
    if (filtroTipoConta !== "todos" && item.tipo_conta !== filtroTipoConta)
      return false;
    if (filtroTipoCompra !== "todos" && item.tipo_compra !== filtroTipoCompra)
      return false;
    if (busca) {
      const buscaLower = normalizeSearchTerm(busca);
      return (
        normalizeSearchTerm(item.descricao).includes(buscaLower) ||
        normalizeSearchTerm(item.codigo).includes(buscaLower) ||
        normalizeSearchTerm(item.fornecedor || "").includes(buscaLower) ||
        normalizeSearchTerm(item.ambiente || "").includes(buscaLower)
      );
    }
    return true;
  });

  // Totais filtrados
  const totalFiltrado = itensFiltrados.reduce(
    (acc, i) => acc + (i.valor_total || 0),
    0
  );
  const totalFeeFiltrado = itensFiltrados.reduce(
    (acc, i) => acc + (i.valor_fee || 0),
    0
  );

  return (
    <div className="p-3 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] sm:text-[24px] font-normal text-[#2E2E2E]">
            Lista de Compras
          </h1>
          <p className="text-[12px] text-gray-600 mt-1">
            Gerenciamento de compras de materiais para projetos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/compras/projetos")}
            className="px-4 py-2 text-[14px] border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Projetos
          </button>
          <button
            type="button"
            onClick={() => navigate("/compras/novo")}
            className="px-4 py-2 text-[14px] bg-primary text-white rounded-lg hover:bg-primary/90 font-medium flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Nova Compra
          </button>
        </div>
      </div>

      {/* Estatisticas */}
      {estatisticas && (
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-[12px] font-medium text-gray-600 uppercase tracking-wide">
              Total de Itens
            </p>
            <p className="text-[20px] font-normal text-gray-900 mt-1">
              {estatisticas.total_itens}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-[12px] font-medium text-gray-600 uppercase tracking-wide">
              Valor Total
            </p>
            <p className="text-[20px] font-normal text-blue-600 mt-1">
              {formatarMoeda(estatisticas.valor_total)}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-[12px] font-medium text-gray-600 uppercase tracking-wide">
              Pendentes
            </p>
            <p className="text-[20px] font-normal text-yellow-600 mt-1">
              {formatarMoeda(estatisticas.valor_pendente)}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-[12px] font-medium text-gray-600 uppercase tracking-wide">
              Entregues
            </p>
            <p className="text-[20px] font-normal text-green-600 mt-1">
              {formatarMoeda(estatisticas.valor_entregue)}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-[12px] font-medium text-gray-600 uppercase tracking-wide">
              FEE Arrecadado
            </p>
            <p className="text-[20px] font-normal text-purple-600 mt-1">
              {formatarMoeda(estatisticas.total_fee_arrecadado)}
            </p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        {/* Busca */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por descricao, codigo, fornecedor..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26] focus:border-transparent"
          />
        </div>

        {/* Filtros em linha */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-medium text-gray-700">Status:</span>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
            >
              <option value="todos">Todos</option>
              <option value="PENDENTE">Pendente</option>
              <option value="APROVADO">Aprovado</option>
              <option value="COMPRADO">Comprado</option>
              <option value="ENTREGUE">Entregue</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>

          {/* Projeto */}
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-medium text-gray-700">Projeto:</span>
            <select
              value={filtroProjeto}
              onChange={(e) => setFiltroProjeto(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
            >
              <option value="">Todos</option>
              {projetos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo} - {p.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo Conta */}
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-medium text-gray-700">Conta:</span>
            <select
              value={filtroTipoConta}
              onChange={(e) => setFiltroTipoConta(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
            >
              <option value="todos">Todas</option>
              <option value="REAL">Conta Real</option>
              <option value="VIRTUAL">Conta Virtual</option>
            </select>
          </div>

          {/* Tipo Compra */}
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-medium text-gray-700">Tipo:</span>
            <select
              value={filtroTipoCompra}
              onChange={(e) => setFiltroTipoCompra(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
            >
              <option value="todos">Todos</option>
              <option value="WG_COMPRA">WG Compra</option>
              <option value="CLIENTE_DIRETO">Cliente Direto</option>
            </select>
          </div>
        </div>

        {/* Resumo filtrado */}
        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-sm text-gray-600">
            {itensFiltrados.length} item(s) encontrado(s)
          </span>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">
              Total:{" "}
              <span className="text-blue-600">
                {formatarMoeda(totalFiltrado)}
              </span>
            </span>
            <span className="text-sm font-medium">
              FEE:{" "}
              <span className="text-purple-600">
                {formatarMoeda(totalFeeFiltrado)}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#F25C26]" />
            <p className="text-sm text-gray-600 mt-2">Carregando...</p>
          </div>
        ) : (
          <ResponsiveTable
            columns={comprasColumns}
            data={itensFiltrados}
            emptyMessage={
              busca || filtroStatus !== "todos"
                ? "Nenhum item encontrado com esses filtros"
                : "Nenhum item na lista de compras"
            }
          />
        )}
      </div>
    </div>
  );
}

