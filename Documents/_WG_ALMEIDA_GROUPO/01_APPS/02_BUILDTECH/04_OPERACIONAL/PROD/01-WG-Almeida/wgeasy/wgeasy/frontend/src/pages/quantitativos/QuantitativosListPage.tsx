/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// PÁGINA: Listagem de Quantitativos de Projeto
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  Pencil,
  Trash2,
  Filter,
} from "lucide-react";
import ResponsiveTable from "@/components/ResponsiveTable";
import type { Row } from "@/components/ResponsiveTable";
import {
  listarQuantitativosProjetos,
  obterEstatisticasQuantitativos,
  deletarQuantitativoProjeto,
} from "../../services/quantitativosApi";
import type {
  QuantitativoProjetoCompleto,
  QuantitativosFiltros,
  QuantitativosEstatisticas,
  NucleoQuantitativo,
  StatusQuantitativo,
} from "../../types/quantitativos";
import {
  getNucleoLabel,
  getStatusLabel,
  formatarPreco,
  formatarAreaComUnidade,
} from "../../types/quantitativos";

// Cor do modulo Quantitativos
const corModulo = "#5E9B94";
const corModuloEscura = "#2B4580";

export default function QuantitativosListPage() {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Estados
  const [quantitativos, setQuantitativos] = useState<QuantitativoProjetoCompleto[]>([]);
  const [estatisticas, setEstatisticas] = useState<QuantitativosEstatisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState<QuantitativosFiltros>({});

  const quantitativosColumns = [
    { label: "Numero", key: "numero", render: (val: any) => `#${val || '-'}` },
    { label: "Nome", key: "nome" },
    { label: "Cliente", key: "cliente_nome" },
    {
      label: "Nucleo",
      key: "nucleo",
      render: (val: any) => (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-normal bg-blue-100 text-blue-700">
          {getNucleoLabel(val)}
        </span>
      )
    },
    {
      label: "Status",
      key: "status",
      render: (val: any) => {
        const statusColors: any = {
          'em_elaboracao': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Em Elaboracao' },
          'aprovado': { bg: 'bg-green-100', text: 'text-green-700', label: 'Aprovado' },
          'revisao': { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Em Revisao' },
          'arquivado': { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Arquivado' },
        };
        const config = statusColors[val] || { bg: 'bg-gray-100', text: 'text-gray-600', label: getStatusLabel(val) };
        return <span className={`px-2 py-0.5 rounded-full text-[11px] font-normal ${config.bg} ${config.text}`}>{config.label}</span>;
      }
    },
    { label: "Area", key: "area_total", render: (val: any) => formatarAreaComUnidade(val || 0) },
    { label: "Ambientes", key: "total_ambientes" },
    { label: "Itens", key: "total_itens" },
    { label: "Valor", key: "valor_total", render: (val: any) => formatarPreco(val || 0) },
    {
      label: "Acoes",
      key: "id",
      render: (val: any, row: any) => (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/quantitativos/${val}`); }}
            className="p-1.5 text-gray-400 hover:text-[#5E9B94] hover:bg-[#5E9B94]/10 rounded-lg transition-all"
            title="Visualizar"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/quantitativos/editar/${val}`); }}
            className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
            title="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDeletar(val, row.nome); }}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="Excluir"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    },
  ];

  // Carregar dados
  useEffect(() => {
    carregarDados();
  }, [filtros]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [projetosData, statsData] = await Promise.all([
        listarQuantitativosProjetos(filtros),
        obterEstatisticasQuantitativos(),
      ]);
      setQuantitativos(projetosData);
      setEstatisticas(statsData);
    } catch (error) {
      console.error("Erro ao carregar quantitativos:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao carregar quantitativos" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletar = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja deletar o quantitativo "${nome}"?`)) {
      return;
    }

    try {
      await deletarQuantitativoProjeto(id);
      toast({ title: "Sucesso", description: "Quantitativo deletado com sucesso!" });
      carregarDados();
    } catch (error) {
      console.error("Erro ao deletar quantitativo:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao deletar quantitativo" });
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-white p-3 sm:p-6">
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-[#5E9B94] border-t-transparent rounded-full animate-spin" />
            <p className="text-[12px] text-gray-500">Carregando quantitativos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-3 sm:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#5E9B94] to-[#2B4580] rounded-xl flex items-center justify-center shadow-lg">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight text-gray-900">
                Quantitativos de Projeto
              </h1>
              <p className="text-[12px] text-gray-600">
                Gestao completa de quantitativos executivos
              </p>
            </div>
          </div>

          {/* Botoes de acao */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/quantitativos/novo")}
              className="flex items-center gap-2 px-3 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-[#5E9B94] to-[#2B4580] text-white rounded-lg text-[13px] font-normal hover:opacity-90 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Novo Quantitativo
            </button>
          </div>
        </div>
      </div>

      {/* Cards de Estatisticas */}
      {estatisticas && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gray-100 rounded-md">
                <FileSpreadsheet className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-[18px] font-light text-gray-900">{estatisticas.total_projetos}</span>
              <span className="text-[12px] text-gray-500">Projetos</span>
            </div>
          </div>

          <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-yellow-50 rounded-md">
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
              <span className="text-[18px] font-light text-gray-900">{estatisticas.total_em_elaboracao}</span>
              <span className="text-[12px] text-gray-500">Em Elaboracao</span>
            </div>
          </div>

          <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-50 rounded-md">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-[18px] font-light text-gray-900">{estatisticas.total_aprovados}</span>
              <span className="text-[12px] text-gray-500">Aprovados</span>
            </div>
          </div>

          <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 rounded-md">
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-[18px] font-light text-gray-900">{formatarPreco(estatisticas.valor_total_geral)}</span>
              <span className="text-[12px] text-gray-500">Total</span>
            </div>
          </div>
        </div>
      )}

      {/* Area de Filtros */}
      <div className="bg-white rounded-xl p-4 mb-6 border border-gray-100 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          {/* Busca */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[11px] text-gray-500 mb-1">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Numero ou nome..."
                value={filtros.busca || ""}
                onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5E9B94] focus:border-transparent outline-none text-[13px]"
              />
            </div>
          </div>

          {/* Nucleo */}
          <div className="min-w-[150px]">
            <label className="block text-[11px] text-gray-500 mb-1">Nucleo</label>
            <select
              value={filtros.nucleo || ""}
              onChange={(e) =>
                setFiltros({
                  ...filtros,
                  nucleo: e.target.value as NucleoQuantitativo | undefined,
                })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5E9B94] focus:border-transparent outline-none text-[13px]"
            >
              <option value="">Todos</option>
              <option value="arquitetura">Arquitetura</option>
              <option value="engenharia">Engenharia</option>
              <option value="marcenaria">Marcenaria</option>
            </select>
          </div>

          {/* Status */}
          <div className="min-w-[150px]">
            <label className="block text-[11px] text-gray-500 mb-1">Status</label>
            <select
              value={filtros.status || ""}
              onChange={(e) =>
                setFiltros({
                  ...filtros,
                  status: e.target.value as StatusQuantitativo | undefined,
                })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5E9B94] focus:border-transparent outline-none text-[13px]"
            >
              <option value="">Todos</option>
              <option value="em_elaboracao">Em Elaboracao</option>
              <option value="aprovado">Aprovado</option>
              <option value="revisao">Em Revisao</option>
              <option value="arquivado">Arquivado</option>
            </select>
          </div>

          {/* Limpar */}
          <button
            onClick={() => setFiltros({})}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-[13px] font-normal text-gray-600 hover:bg-gray-50 transition-all"
          >
            <Filter className="w-4 h-4" />
            Limpar
          </button>
        </div>
      </div>

      {/* Lista */}
      {quantitativos.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm">
          <FileSpreadsheet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-[18px] font-normal text-gray-700 mb-2">
            Nenhum quantitativo encontrado
          </h3>
          <p className="text-[12px] text-gray-500 mb-6">
            Crie seu primeiro quantitativo de projeto
          </p>
          <button
            onClick={() => navigate("/quantitativos/novo")}
            className="inline-flex items-center gap-2 px-3 py-2 sm:px-5 sm:py-2.5 bg-[#5E9B94] text-white rounded-lg text-[13px] font-normal hover:bg-[#2B4580] transition-all"
          >
            <Plus className="w-5 h-5" />
            Criar Primeiro Quantitativo
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <ResponsiveTable
            columns={quantitativosColumns}
            data={quantitativos as unknown as Row[]}
            emptyMessage="Nenhum quantitativo encontrado."
            onRowClick={(item) => navigate(`/quantitativos/${String(item.id || "")}`)}
          />
        </div>
      )}
    </div>
  );
}