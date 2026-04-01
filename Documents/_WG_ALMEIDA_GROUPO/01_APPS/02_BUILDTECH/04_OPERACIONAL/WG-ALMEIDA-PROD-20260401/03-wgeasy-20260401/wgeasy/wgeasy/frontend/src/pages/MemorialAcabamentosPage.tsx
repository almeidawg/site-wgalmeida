/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ==========================================
// MEMORIAL DE ACABAMENTOS
// Sistema WG Easy - Grupo WG Almeida
// EspecificaçÍo técnica por ambiente
// ==========================================

import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import {
  Plus,
  Search,
  Filter,
  Home,
  ChevronRight,
  Package,
  Edit2,
  Trash2,
  Copy,
  Link2,
  Unlink,
  MoreVertical,
  FileText,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import { normalizeSearchTerm } from "@/utils/searchUtils";
import {
  listarMemorialProjeto,
  deletarMemorialItem,
  obterResumoAmbientes,
} from "@/lib/memorialApi";
import type {
  MemorialAcabamentoCompleto,
  MemorialResumoAmbiente,
  AmbienteMemorial,
  CategoriaMemorial,
  StatusMemorial,
} from "@/types/memorial";
import {
  AMBIENTES_MEMORIAL,
  CATEGORIAS_MEMORIAL,
  STATUS_MEMORIAL,
  getStatusLabel,
  getStatusColor,
  formatarPrecoMemorial,
  agruparPorAmbienteECategoria,
  calcularTotalAmbiente,
  calcularEstatisticasMemorial,
} from "@/types/memorial";

// ==========================================
// Tipos Locais
// ==========================================

interface Projeto {
  id: string;
  nome: string;
  cliente?: { nome: string | null };
}

// ==========================================
// Componente Principal
// ==========================================

export default function MemorialAcabamentosPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  // Estado
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [projetoSelecionado, setProjetoSelecionado] = useState<string>("");
  const [itens, setItens] = useState<MemorialAcabamentoCompleto[]>([]);
  const [resumoAmbientes, setResumoAmbientes] = useState<MemorialResumoAmbiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [busca, setBusca] = useState("");
  const [ambienteFiltro, setAmbienteFiltro] = useState<string>("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("");
  const [statusFiltro, setStatusFiltro] = useState<string>("");
  const [ambienteAtivo, setAmbienteAtivo] = useState<string>("todos");

  // Modal
  const [itemParaDeletar, setItemParaDeletar] = useState<string | null>(null);
  const [deletando, setDeletando] = useState(false);

  // ==========================================
  // Carregar Projetos
  // ==========================================

  useEffect(() => {
    carregarProjetos();
  }, []);

  async function carregarProjetos() {
    try {
      // Buscar projetos sem join (evita erro de FK)
      const { data, error } = await supabase
        .from("projetos")
        .select("id, nome, cliente_id")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      // Buscar nomes dos clientes separadamente
      const clienteIds = [...new Set((data || []).map(p => p.cliente_id).filter(Boolean))];
      let clientesMap: Record<string, string> = {};
      if (clienteIds.length > 0) {
        const { data: clientes } = await supabase
          .from("pessoas")
          .select("id, nome")
          .in("id", clienteIds);
        if (clientes) {
          clientesMap = Object.fromEntries(clientes.map(c => [c.id, c.nome]));
        }
      }

      const projetosComCliente = (data || []).map(p => ({
        ...p,
        cliente: { nome: p.cliente_id ? clientesMap[p.cliente_id] : null }
      }));

      setProjetos(projetosComCliente);

      // Se tem projeto na URL, selecionar
      const projetoUrl = searchParams.get("projeto");
      if (projetoUrl) {
        setProjetoSelecionado(projetoUrl);
      }
    } catch (err: any) {
      console.error("Erro ao carregar projetos:", err);
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // Carregar Itens do Memorial
  // ==========================================

  useEffect(() => {
    if (projetoSelecionado) {
      carregarItens();
      // Atualizar URL
      setSearchParams({ projeto: projetoSelecionado });
    } else {
      setItens([]);
      setResumoAmbientes([]);
    }
  }, [projetoSelecionado]);

  async function carregarItens() {
    try {
      setLoading(true);
      setError(null);

      const [itensData, resumoData] = await Promise.all([
        listarMemorialProjeto(projetoSelecionado),
        obterResumoAmbientes(projetoSelecionado),
      ]);

      setItens(itensData);
      setResumoAmbientes(resumoData);
    } catch (err: any) {
      console.error("Erro ao carregar memorial:", err);
      setError(err.message || "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // Filtros
  // ==========================================

  const itensFiltrados = useMemo(() => {
    let resultado = [...itens];

    // Filtro de ambiente (via tabs)
    if (ambienteAtivo && ambienteAtivo !== "todos") {
      resultado = resultado.filter((i) => i.ambiente === ambienteAtivo);
    }

    // Filtro de busca
    if (busca) {
      const termoBusca = normalizeSearchTerm(busca);
      resultado = resultado.filter(
        (i) =>
          normalizeSearchTerm(i.item).includes(termoBusca) ||
          normalizeSearchTerm(i.fabricante_display || "").includes(termoBusca) ||
          normalizeSearchTerm(i.modelo_display || "").includes(termoBusca)
      );
    }

    // Filtro de categoria
    if (categoriaFiltro) {
      resultado = resultado.filter((i) => i.categoria === categoriaFiltro);
    }

    // Filtro de status
    if (statusFiltro) {
      resultado = resultado.filter((i) => i.status === statusFiltro);
    }

    return resultado;
  }, [itens, ambienteAtivo, busca, categoriaFiltro, statusFiltro]);

  const itensAgrupados = useMemo(() => {
    return agruparPorAmbienteECategoria(itensFiltrados);
  }, [itensFiltrados]);

  const estatisticas = useMemo(() => {
    return calcularEstatisticasMemorial(itens);
  }, [itens]);

  const ambientesComItens = useMemo(() => {
    const ambientes = new Set(itens.map((i) => i.ambiente));
    return AMBIENTES_MEMORIAL.filter((a) => ambientes.has(a));
  }, [itens]);

  // ==========================================
  // Ações
  // ==========================================

  async function handleDeletar() {
    if (!itemParaDeletar) return;

    try {
      setDeletando(true);
      await deletarMemorialItem(itemParaDeletar);
      await carregarItens();
      setItemParaDeletar(null);
    } catch (err: any) {
      console.error("Erro ao deletar:", err);
      toast({ variant: "destructive", title: "Erro ao deletar item", description: err.message });
    } finally {
      setDeletando(false);
    }
  }

  function limparFiltros() {
    setBusca("");
    setCategoriaFiltro("");
    setStatusFiltro("");
    setAmbienteAtivo("todos");
  }

  const temFiltrosAtivos = busca || categoriaFiltro || statusFiltro;

  // ==========================================
  // Render: SeleçÍo de Projeto
  // ==========================================

  if (!projetoSelecionado) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-wg-primary/10 rounded-lg">
                <FileText className="w-6 h-6 text-wg-primary" />
              </div>
              <h1 className="text-[20px] sm:text-[22px] lg:text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight text-gray-900">
                Memorial de Acabamentos
              </h1>
            </div>
            <p className="text-[11px] sm:text-[12px] text-gray-600">
              EspecificaçÍo técnica de acabamentos por ambiente
            </p>
          </div>

          {/* SeleçÍo de Projeto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Selecione um Projeto
              </CardTitle>
            </CardHeader>
            <CardContent>
              {projetos.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">
                    Nenhum projeto encontrado
                  </p>
                  <Button onClick={() => navigate("/cronograma/projects")}>
                    Criar Projeto
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {projetos.map((projeto) => (
                    <button
                      key={projeto.id}
                      onClick={() => setProjetoSelecionado(projeto.id)}
                      className="w-full p-4 text-left rounded-lg border hover:border-wg-primary hover:bg-wg-primary/5 transition-colors"
                    >
                      <div className="font-normal text-gray-900 text-[12px] sm:text-[13px]">
                        {projeto.nome}
                      </div>
                      {projeto.cliente && (
                        <div className="text-sm text-gray-500">
                          Cliente: {projeto.cliente.nome}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ==========================================
  // Render: Loading
  // ==========================================

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto animate-pulse space-y-6">
          <div className="h-10 bg-gray-200 rounded w-64" />
          <div className="h-12 bg-gray-200 rounded" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // Render: Principal
  // ==========================================

  const projetoAtual = projetos.find((p) => p.id === projetoSelecionado);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <button
              onClick={() => setProjetoSelecionado("")}
              className="hover:text-wg-primary"
            >
              Projetos
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900">{projetoAtual?.nome}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-wg-primary/10 rounded-lg">
                <FileText className="w-6 h-6 text-wg-primary" />
              </div>
              <div>
                <h1 className="text-[20px] sm:text-[22px] lg:text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight text-gray-900">
                  Memorial de Acabamentos
                </h1>
                <p className="text-[11px] sm:text-[12px] text-gray-600">
                  {projetoAtual?.nome}
                  {projetoAtual?.cliente && ` - ${projetoAtual.cliente.nome}`}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button
                onClick={() =>
                  navigate(
                    `/memorial-acabamentos/novo?projeto=${projetoSelecionado}`
                  )
                }
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Item
              </Button>
            </div>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total de Itens</p>
                  <p className="text-[16px] sm:text-[17px] lg:text-[18px] font-light text-gray-900">{estatisticas.total_itens}</p>
                </div>
                <Package className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Ambientes</p>
                  <p className="text-[16px] sm:text-[17px] lg:text-[18px] font-light text-gray-900">
                    {estatisticas.total_ambientes}
                  </p>
                </div>
                <Home className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Progresso</p>
                  <p className="text-[16px] sm:text-[17px] lg:text-[18px] font-light text-gray-900">
                    {estatisticas.progresso_percentual}%
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Valor Estimado</p>
                  <p className="text-[16px] sm:text-[17px] lg:text-[18px] font-light text-gray-900">
                    {formatarPrecoMemorial(estatisticas.valor_total_estimado)}
                  </p>
                </div>
                <span className="text-2xl">R$</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barra de Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar itens..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Categoria */}
            <Select value={categoriaFiltro || "__all__"} onValueChange={(v) => setCategoriaFiltro(v === "__all__" ? "" : v)}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas categorias</SelectItem>
                {CATEGORIAS_MEMORIAL.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status */}
            <Select value={statusFiltro || "__all__"} onValueChange={(v) => setStatusFiltro(v === "__all__" ? "" : v)}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos status</SelectItem>
                {STATUS_MEMORIAL.map((status) => (
                  <SelectItem key={status} value={status}>
                    {getStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {temFiltrosAtivos && (
              <Button variant="ghost" size="sm" onClick={limparFiltros}>
                <X className="w-4 h-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>
        </div>

        {/* Tabs de Ambientes */}
        <Tabs
          value={ambienteAtivo}
          onValueChange={setAmbienteAtivo}
          className="mb-6"
        >
          <TabsList className="flex-wrap h-auto p-1">
            <TabsTrigger value="todos" className="px-4">
              Todos ({itens.length})
            </TabsTrigger>
            {ambientesComItens.map((ambiente) => {
              const count = itens.filter((i) => i.ambiente === ambiente).length;
              return (
                <TabsTrigger key={ambiente} value={ambiente} className="px-3">
                  {ambiente} ({count})
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {/* Lista de Itens */}
        {itensFiltrados.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-[16px] sm:text-[17px] lg:text-[18px] font-light text-gray-700 mb-2">
                {itens.length === 0
                  ? "Memorial vazio"
                  : "Nenhum item encontrado"}
              </h2>
              <p className="text-gray-500 mb-4">
                {itens.length === 0
                  ? "Adicione itens ao memorial de acabamentos"
                  : "Tente ajustar os filtros"}
              </p>
              {itens.length === 0 ? (
                <Button
                  onClick={() =>
                    navigate(
                      `/memorial-acabamentos/novo?projeto=${projetoSelecionado}`
                    )
                  }
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Primeiro Item
                </Button>
              ) : (
                <Button variant="outline" onClick={limparFiltros}>
                  Limpar Filtros
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(itensAgrupados).map(([ambiente, categorias]) => (
              <Card key={ambiente}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Home className="w-5 h-5 text-wg-primary" />
                      {ambiente}
                    </CardTitle>
                    <Badge variant="secondary">
                      {formatarPrecoMemorial(
                        calcularTotalAmbiente(
                          Object.values(categorias).flat()
                        )
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {Object.entries(categorias).map(([categoria, itensCategoria]) => (
                    <div key={categoria} className="mb-6 last:mb-0">
                      <h4 className="text-sm font-normal text-gray-700 mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        {categoria}
                        <Badge variant="outline" className="ml-2">
                          {itensCategoria.length}
                        </Badge>
                      </h4>

                      <div className="space-y-2">
                        {itensCategoria.map((item) => (
                          <ItemMemorialRow
                            key={item.id}
                            item={item}
                            onEdit={() =>
                              navigate(
                                `/memorial-acabamentos/${item.id}/editar`
                              )
                            }
                            onDelete={() => setItemParaDeletar(item.id)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de ConfirmaçÍo de ExclusÍo */}
        <Dialog
          open={!!itemParaDeletar}
          onOpenChange={() => setItemParaDeletar(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar ExclusÍo</DialogTitle>
            </DialogHeader>
            <p className="text-gray-600">
              Tem certeza que deseja excluir este item do memorial?
            </p>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setItemParaDeletar(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeletar}
                disabled={deletando}
              >
                {deletando ? "Excluindo..." : "Excluir"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// ==========================================
// Componente: Linha de Item do Memorial
// ==========================================

interface ItemMemorialRowProps {
  item: MemorialAcabamentoCompleto;
  onEdit: () => void;
  onDelete: () => void;
}

function ItemMemorialRow({ item, onEdit, onDelete }: ItemMemorialRowProps) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
      {/* Info Principal */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-normal text-gray-900 text-[12px] sm:text-[13px] truncate">{item.item}</span>
          {item.pricelist_item_id && (
            <Link2 className="w-3 h-3 text-green-500 flex-shrink-0" title="Vinculado ao Pricelist" />
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
          {item.fabricante_display && (
            <span>{item.fabricante_display}</span>
          )}
          {item.modelo_display && (
            <span className="truncate">{item.modelo_display}</span>
          )}
          {item.codigo_display && (
            <span className="font-mono text-xs">[{item.codigo_display}]</span>
          )}
        </div>
      </div>

      {/* Assunto */}
      <div className="hidden md:block text-sm text-gray-500 w-40 truncate">
        {item.assunto}
      </div>

      {/* Quantidade */}
      <div className="text-sm text-center w-16">
        <span className="font-normal">{item.quantidade}</span>
        <span className="text-gray-400 ml-1">{item.unidade}</span>
      </div>

      {/* Preço */}
      <div className="text-right w-28">
        <div className="font-normal text-gray-900 text-[12px] sm:text-[13px]">
          {formatarPrecoMemorial(item.preco_display)}
        </div>
        {item.quantidade > 1 && (
          <div className="text-xs text-gray-500">
            Total: {formatarPrecoMemorial(item.preco_display * item.quantidade)}
          </div>
        )}
      </div>

      {/* Status */}
      <Badge
        style={{
          backgroundColor: getStatusColor(item.status) + "20",
          color: getStatusColor(item.status),
        }}
        className="w-24 justify-center"
      >
        {getStatusLabel(item.status)}
      </Badge>

      {/* Ações */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Edit2 className="w-4 h-4 mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Copy className="w-4 h-4 mr-2" />
            Duplicar
          </DropdownMenuItem>
          {item.pricelist_item_id ? (
            <DropdownMenuItem>
              <Unlink className="w-4 h-4 mr-2" />
              Desvincular Pricelist
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem>
              <Link2 className="w-4 h-4 mr-2" />
              Vincular Pricelist
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onDelete}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

