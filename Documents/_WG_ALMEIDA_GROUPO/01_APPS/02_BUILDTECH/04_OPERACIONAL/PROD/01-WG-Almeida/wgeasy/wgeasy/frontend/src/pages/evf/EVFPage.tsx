/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================================
// EVF PAGE - Listagem de Estudos de Viabilidade Financeira
// Sistema WG Easy - Grupo WG Almeida
// ============================================================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Calculator,
  TrendingUp,
  FileText,
  Trash2,
  Copy,
  Eye,
  MoreVertical,
  AlertCircle,
  RefreshCw,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  listarEstudos,
  deletarEstudo,
  duplicarEstudo,
  buscarEstatisticasEVF,
} from "@/lib/evfApi";
import type { EVFEstudoCompleto } from "@/types/evf";
import { formatarMoeda, formatarNumero, PADRAO_LABELS } from "@/types/evf";
import { normalizeSearchTerm } from "@/utils/searchUtils";

export default function EVFPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Estados
  const [estudos, setEstudos] = useState<EVFEstudoCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [estudoParaDeletar, setEstudoParaDeletar] = useState<string | null>(null);
  const [estatisticas, setEstatisticas] = useState<{
    totalEstudos: number;
    valorMedioTotal: number;
    valorMedioM2: number;
  } | null>(null);

  // Carregar dados
  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setLoading(true);
      const [listaEstudos, stats] = await Promise.all([
        listarEstudos(),
        buscarEstatisticasEVF(),
      ]);
      setEstudos(listaEstudos);
      setEstatisticas(stats);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // Filtrar estudos
  const estudosFiltrados = estudos.filter((estudo) => {
    if (!busca) return true;
    const termo = normalizeSearchTerm(busca);
    return (
      normalizeSearchTerm(estudo.titulo).includes(termo) ||
      normalizeSearchTerm(estudo.cliente?.nome || "").includes(termo) ||
      normalizeSearchTerm(estudo.analise_projeto?.titulo || "").includes(termo)
    );
  });

  // Handlers
  async function handleDeletar() {
    if (!estudoParaDeletar) return;

    try {
      await deletarEstudo(estudoParaDeletar);
      toast({
        title: "Estudo excluído",
        description: "O estudo foi excluído com sucesso.",
      });
      carregarDados();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setEstudoParaDeletar(null);
    }
  }

  async function handleDuplicar(id: string) {
    try {
      const novoEstudo = await duplicarEstudo(id);
      toast({
        title: "Estudo duplicado",
        description: "O estudo foi duplicado com sucesso.",
      });
      navigate(`/evf/${novoEstudo.id}`);
    } catch (error: any) {
      toast({
        title: "Erro ao duplicar",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  // Cores do padrÍo
  function getCorPadrao(padrao: string): string {
    switch (padrao) {
      case "economico":
        return "bg-green-100 text-green-800";
      case "medio_alto":
        return "bg-blue-100 text-blue-800";
      case "alto_luxo":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  // Cor do modulo EVF
  const corModulo = "#16a34a";

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-white p-3 sm:p-6">
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-[#16a34a] border-t-transparent rounded-full animate-spin" />
            <p className="text-[12px] text-gray-500">Carregando estudos...</p>
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
            <div className="w-12 h-12 bg-gradient-to-br from-[#16a34a] to-[#15803d] rounded-xl flex items-center justify-center shadow-lg">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight text-gray-900">
                Estudo de Viabilidade Financeira
              </h1>
              <p className="text-[12px] text-gray-600">
                Estimativas de investimento por metragem e padrao de acabamento
              </p>
            </div>
          </div>

          {/* Botoes de acao */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/evf/novo")}
              className="flex items-center gap-2 px-3 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-[#16a34a] to-[#15803d] text-white rounded-lg text-[13px] font-normal hover:opacity-90 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Novo Estudo
            </button>
          </div>
        </div>
      </div>

      {/* Cards de Estatisticas */}
      {estatisticas && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gray-100 rounded-md">
                <FileText className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-[18px] font-light text-gray-900">{estatisticas.totalEstudos}</span>
              <span className="text-[12px] text-gray-500">Estudos</span>
            </div>
          </div>

          <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-50 rounded-md">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-[18px] font-light text-gray-900">{formatarMoeda(estatisticas.valorMedioTotal)}</span>
              <span className="text-[12px] text-gray-500">Media Total</span>
            </div>
          </div>

          <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 rounded-md">
                <Calculator className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-[18px] font-light text-gray-900">{formatarMoeda(estatisticas.valorMedioM2)}/m²</span>
              <span className="text-[12px] text-gray-500">Media m²</span>
            </div>
          </div>
        </div>
      )}

      {/* Area de Filtros */}
      <div className="bg-white rounded-xl p-4 mb-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          {/* Busca */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por titulo, cliente ou analise..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#16a34a] focus:border-transparent outline-none"
            />
          </div>

          <button
            onClick={carregarDados}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-[13px] font-normal text-gray-600 hover:bg-gray-50 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>
      </div>

      {/* Lista de Estudos */}
      {estudosFiltrados.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm">
          <Calculator className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-[18px] font-normal text-gray-700 mb-2">
            {busca ? "Nenhum estudo encontrado" : "Nenhum estudo cadastrado"}
          </h3>
          <p className="text-[12px] text-gray-500 mb-6">
            {busca
              ? "Tente buscar por outro termo"
              : "Crie seu primeiro estudo de viabilidade financeira"}
          </p>
          {!busca && (
            <button
              onClick={() => navigate("/evf/novo")}
              className="inline-flex items-center gap-2 px-3 py-2 sm:px-5 sm:py-2.5 bg-[#16a34a] text-white rounded-lg text-[13px] font-normal hover:bg-[#15803d] transition-all"
            >
              <Plus className="w-5 h-5" />
              Criar Primeiro Estudo
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                  Titulo
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                  Metragem
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                  Padrao
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                  Valor Total
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                  R$/m²
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                  Acoes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {estudosFiltrados.map((estudo) => (
                <tr
                  key={estudo.id}
                  className="hover:bg-gray-50 cursor-pointer group"
                  onClick={() => navigate(`/evf/${estudo.id}`)}
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-gray-900 text-[12px] group-hover:text-[#16a34a] transition-colors">{estudo.titulo}</p>
                      {estudo.analise_projeto && (
                        <p className="text-[11px] text-gray-400">
                          {estudo.analise_projeto.titulo}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-[12px]">
                    {estudo.cliente?.nome || "-"}
                  </td>
                  <td className="px-4 py-3 text-center text-[12px] text-gray-600">
                    {formatarNumero(estudo.metragem_total)} m²
                  </td>
                  <td className="px-4 py-3 text-center text-[12px]">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-normal ${getCorPadrao(estudo.padrao_acabamento)}`}>
                      {PADRAO_LABELS[estudo.padrao_acabamento]?.label || estudo.padrao_acabamento}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-[#16a34a] text-[12px] font-normal">
                    {formatarMoeda(estudo.valor_total)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600 text-[12px]">
                    {formatarMoeda(estudo.valor_m2_medio)}
                  </td>
                  <td className="px-4 py-3 text-center text-[11px] text-gray-400">
                    {new Date(estudo.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/evf/${estudo.id}`);
                        }}
                        className="p-1.5 text-gray-400 hover:text-[#16a34a] hover:bg-[#16a34a]/10 rounded-lg transition-all"
                        title="Visualizar"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicar(estudo.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                        title="Duplicar"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEstudoParaDeletar(estudo.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog de Confirmacao de Exclusao */}
      <AlertDialog open={!!estudoParaDeletar} onOpenChange={() => setEstudoParaDeletar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusÍo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este estudo? Esta açÍo nÍo pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletar}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

