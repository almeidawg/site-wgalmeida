// ==========================================
// MARCENARIA - CONTRATOS PAGE
// Sistema WG Easy - Grupo WG Almeida
// ==========================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, Search, Filter } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type MarcenariaContrato = {
  id: string;
  obra_id: string | null;
  cliente_id: string | null;
  numero_contrato: string | null;
  valor_total: number;
  status: "rascunho" | "ativo" | "concluido" | "cancelado";
  data_ativacao: string | null;
  created_at: string;
  cliente?: { nome: string } | null;
  obra?: { nome: string } | null;
};

const STATUS_CONFIG = {
  rascunho: { label: "Rascunho", color: "bg-gray-100 text-gray-700" },
  ativo: { label: "Ativo", color: "bg-green-100 text-green-700" },
  concluido: { label: "Concluído", color: "bg-blue-100 text-blue-700" },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-700" },
};

export default function MarcenariaContratosPage() {
  const navigate = useNavigate();
  const [contratos, setContratos] = useState<MarcenariaContrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [busca, setBusca] = useState("");

  useEffect(() => {
    carregarContratos();
  }, []);

  async function carregarContratos() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("marcenaria_contratos")
        .select(`
          *,
          cliente:pessoas!marcenaria_contratos_cliente_id_fkey(nome),
          obra:obras(nome)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContratos(data || []);
    } catch (error) {
      console.error("Erro ao carregar contratos:", error);
    } finally {
      setLoading(false);
    }
  }

  const contratosFiltrados = contratos.filter((c) => {
    const matchStatus = filtroStatus === "todos" || c.status === filtroStatus;
    const matchBusca =
      !busca ||
      c.numero_contrato?.toLowerCase().includes(busca.toLowerCase()) ||
      c.cliente?.nome?.toLowerCase().includes(busca.toLowerCase());
    return matchStatus && matchBusca;
  });

  const formatarMoeda = (valor: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

  const formatarData = (data: string) =>
    new Date(data).toLocaleDateString("pt-BR");

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B5E3C] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando contratos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-light tracking-tight text-gray-900 flex items-center gap-3">
            <FileText className="w-7 h-7 text-[#8B5E3C]" />
            Contratos de Marcenaria
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Gerencie os contratos de marcenaria e acompanhe o fluxo de produçÍo
          </p>
        </div>

        <button
          onClick={() => navigate("/marcenaria/contratos/novo")}
          className="px-4 py-2 bg-[#8B5E3C] text-white rounded-lg text-sm font-medium hover:bg-[#7A5235] transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          Novo Contrato
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por número ou cliente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-400" />
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C]"
          >
            <option value="todos">Todos os status</option>
            <option value="rascunho">Rascunho</option>
            <option value="ativo">Ativo</option>
            <option value="concluido">Concluído</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Lista de Contratos */}
      {contratosFiltrados.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            Nenhum contrato encontrado
          </h3>
          <p className="text-gray-500 text-sm">
            {busca || filtroStatus !== "todos"
              ? "Tente ajustar os filtros de busca"
              : "Clique em 'Novo Contrato' para criar o primeiro"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contrato
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Obra
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {contratosFiltrados.map((contrato) => (
                <tr
                  key={contrato.id}
                  onClick={() => navigate(`/marcenaria/contratos/${contrato.id}`)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-4">
                    <span className="font-medium text-gray-900">
                      {contrato.numero_contrato || `#${contrato.id.slice(0, 8)}`}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-600">
                    {contrato.cliente?.nome || "—"}
                  </td>
                  <td className="px-4 py-4 text-gray-600">
                    {contrato.obra?.nome || "—"}
                  </td>
                  <td className="px-4 py-4 font-medium text-gray-900">
                    {formatarMoeda(contrato.valor_total)}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        STATUS_CONFIG[contrato.status]?.color || "bg-gray-100"
                      }`}
                    >
                      {STATUS_CONFIG[contrato.status]?.label || contrato.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-500 text-sm">
                    {formatarData(contrato.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total de Contratos</p>
          <p className="text-2xl font-normal text-gray-900">{contratos.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Ativos</p>
          <p className="text-2xl font-normal text-green-600">
            {contratos.filter((c) => c.status === "ativo").length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Valor Total</p>
          <p className="text-2xl font-normal text-[#8B5E3C]">
            {formatarMoeda(contratos.reduce((acc, c) => acc + c.valor_total, 0))}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Valor Ativos</p>
          <p className="text-2xl font-normal text-green-600">
            {formatarMoeda(
              contratos
                .filter((c) => c.status === "ativo")
                .reduce((acc, c) => acc + c.valor_total, 0)
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

