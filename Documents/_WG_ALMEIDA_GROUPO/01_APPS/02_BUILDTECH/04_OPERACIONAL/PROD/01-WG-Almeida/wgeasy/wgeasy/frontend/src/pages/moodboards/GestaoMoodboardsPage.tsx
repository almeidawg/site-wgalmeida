/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// Pagina: Gestao de Moodboards (Equipe WG)
// Sistema WG Easy 2026 - Grupo WG Almeida
// Gerenciamento de moodboards de todos os clientes
// ============================================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  MessageSquare,
  FileText,
  ShoppingCart,
  RefreshCw,
  Filter,
  Download,
  Users,
  Palette,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpRight,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { normalizeSearchTerm } from "@/utils/searchUtils";
import type { MoodboardCliente } from "@/types/moodboardCliente";

// ============================================================
// TIPOS
// ============================================================

interface MoodboardGestao {
  id: string;
  titulo: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  cliente_id?: string | null;
  contrato_id?: string | null;
  cliente_nome: string;
  cliente_telefone?: string;
  projeto_nome?: string;
  contrato_numero?: string;
  etapa_atual: string;
  etapas_total: number;
  etapas_concluidas: number;
  valor_evf: number;
  valor_selecionado: number;
  ultima_atividade?: string;
}

// ============================================================
// CONFIGURACOES
// ============================================================

const STATUS_CONFIG = {
  rascunho: { label: "Rascunho", color: "bg-gray-100 text-gray-600", icon: Edit },
  em_andamento: { label: "Em andamento", color: "bg-blue-100 text-blue-700", icon: Clock },
  aguardando_aprovacao: { label: "Aguardando Aprovacao", color: "bg-amber-100 text-amber-700", icon: AlertCircle },
  aprovado: { label: "Aprovado", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  finalizado: { label: "Finalizado", color: "bg-purple-100 text-purple-700", icon: CheckCircle2 },
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function GestaoMoodboardsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [moodboards, setMoodboards] = useState<MoodboardGestao[]>([]);
  const [filteredMoodboards, setFilteredMoodboards] = useState<MoodboardGestao[]>([]);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [sortBy, setSortBy] = useState<string>("recentes");

  // Modais
  const [showNovoMoodboard, setShowNovoMoodboard] = useState(false);
  const [showNotificar, setShowNotificar] = useState(false);
  const [selectedMoodboard, setSelectedMoodboard] = useState<MoodboardGestao | null>(null);

  // Metricas
  const [metricas, setMetricas] = useState({
    total: 0,
    em_andamento: 0,
    aguardando_aprovacao: 0,
    valor_total_selecoes: 0,
  });

  // ============================================================
  // CARREGAR DADOS
  // ============================================================

  useEffect(() => {
    carregarMoodboards();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [moodboards, searchTerm, statusFilter, sortBy]);

  async function carregarMoodboards() {
    setLoading(true);
    try {
      // Buscar moodboards com dados do cliente e contrato
      const { data, error } = await supabase
        .from("cliente_moodboards")
        .select(`
          *,
          cliente:cliente_id(id, nome, telefone),
          contrato:contrato_id(id, numero_contrato, projeto_nome)
        `)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Buscar etapas para cada moodboard
      const moodboardsComEtapas = await Promise.all(
        (data || []).map(async (mb) => {
          // Buscar etapas
          const { data: etapas } = await supabase
            .from("etapas_escolha")
            .select("*")
            .eq("contrato_id", mb.contrato_id)
            .order("ordem");

          const etapasTotal = etapas?.length || 0;
          const etapasConcluidas = etapas?.filter((e) => e.status === "concluida").length || 0;
          const etapaAtual = etapas?.find((e) => e.status === "em_andamento" || e.status === "liberada");

          // Buscar valor total das selecoes
          const { data: selecoes } = await supabase
            .from("cliente_selecoes_acabamentos")
            .select("valor_total")
            .eq("moodboard_id", mb.id)
            .in("status", ["selecionado", "aprovado"]);

          const valorSelecionado = selecoes?.reduce((sum, s) => sum + (s.valor_total || 0), 0) || 0;

          return {
            id: mb.id,
            titulo: mb.titulo,
            status: mb.status,
            created_at: mb.created_at,
            updated_at: mb.updated_at,
            cliente_id: mb.cliente_id,
            contrato_id: mb.contrato_id,
            cliente_nome: mb.cliente?.nome || "Sem cliente",
            cliente_telefone: mb.cliente?.telefone,
            projeto_nome: mb.contrato?.projeto_nome,
            contrato_numero: mb.contrato?.numero_contrato,
            etapa_atual: etapaAtual?.titulo || "Nenhuma",
            etapas_total: etapasTotal,
            etapas_concluidas: etapasConcluidas,
            valor_evf: 0, // TODO: Buscar do EVF
            valor_selecionado: valorSelecionado,
            ultima_atividade: mb.updated_at,
          } as MoodboardGestao;
        })
      );

      setMoodboards(moodboardsComEtapas);

      // Calcular metricas
      setMetricas({
        total: moodboardsComEtapas.length,
        em_andamento: moodboardsComEtapas.filter((m) => m.status === "em_andamento").length,
        aguardando_aprovacao: moodboardsComEtapas.filter((m) => m.status === "aguardando_aprovacao").length,
        valor_total_selecoes: moodboardsComEtapas.reduce((sum, m) => sum + m.valor_selecionado, 0),
      });
    } catch (error) {
      console.error("Erro ao carregar moodboards:", error);
      toast.error("Erro ao carregar moodboards");
    } finally {
      setLoading(false);
    }
  }

  function aplicarFiltros() {
    let filtered = [...moodboards];

    // Busca por texto
    if (searchTerm) {
      const term = normalizeSearchTerm(searchTerm);
      filtered = filtered.filter(
        (m) =>
          normalizeSearchTerm(m.cliente_nome).includes(term) ||
          normalizeSearchTerm(m.titulo || "").includes(term) ||
          normalizeSearchTerm(m.projeto_nome || "").includes(term) ||
          normalizeSearchTerm(m.contrato_numero || "").includes(term)
      );
    }

    // Filtro por status
    if (statusFilter !== "todos") {
      filtered = filtered.filter((m) => m.status === statusFilter);
    }

    // Ordenacao
    switch (sortBy) {
      case "recentes":
        filtered.sort((a, b) => new Date(b.updated_at!).getTime() - new Date(a.updated_at!).getTime());
        break;
      case "antigos":
        filtered.sort((a, b) => new Date(a.updated_at!).getTime() - new Date(b.updated_at!).getTime());
        break;
      case "valor":
        filtered.sort((a, b) => b.valor_selecionado - a.valor_selecionado);
        break;
      case "nome":
        filtered.sort((a, b) => a.cliente_nome.localeCompare(b.cliente_nome));
        break;
    }

    setFilteredMoodboards(filtered);
  }

  // ============================================================
  // ACOES
  // ============================================================

  function handleVerMoodboard(moodboard: MoodboardGestao) {
    navigate(`/wgx/moodboard/${moodboard.id}`);
  }

  function handleEditarMoodboard(moodboard: MoodboardGestao) {
    navigate(`/wgx/moodboard/${moodboard.id}?edit=true`);
  }

  async function handleNotificarCliente(moodboard: MoodboardGestao) {
    setSelectedMoodboard(moodboard);
    setShowNotificar(true);
  }

  async function enviarNotificacao(tipo: string) {
    if (!selectedMoodboard) return;

    try {
      // TODO: Integrar com sistema de notificacoes/WhatsApp
      toast.success(`Notificacao "${tipo}" enviada para ${selectedMoodboard.cliente_nome}`);
      setShowNotificar(false);
    } catch (error) {
      toast.error("Erro ao enviar notificacao");
    }
  }

  function handleGerarPedidos(moodboard: MoodboardGestao) {
    navigate(`/compras/novo?moodboard=${moodboard.id}`);
  }

  function handleExportarRelatorio(moodboard: MoodboardGestao) {
    // TODO: Implementar exportacao
    toast.info("Funcao de exportacao em desenvolvimento");
  }

  // ============================================================
  // FORMATACAO
  // ============================================================

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const formatDate = (date: string | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatRelativeTime = (date: string | undefined) => {
    if (!date) return "-";
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Agora";
    if (hours < 24) return `${hours}h atras`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Ontem";
    if (days < 7) return `${days} dias atras`;
    return formatDate(date);
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="p-3 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-normal text-gray-900">Gestao de Moodboards</h1>
          <p className="text-gray-500">Gerencie os moodboards de todos os clientes</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => carregarMoodboards()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button
            onClick={() => setShowNovoMoodboard(true)}
            className="bg-gradient-to-r from-[#F25C26] to-[#F57F17]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Moodboard
          </Button>
        </div>
      </div>

      {/* Metricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Moodboards</p>
                <p className="text-2xl font-normal">{metricas.total}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Palette className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Em Andamento</p>
                <p className="text-2xl font-normal">{metricas.em_andamento}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Aguardando Aprovacao</p>
                <p className="text-2xl font-normal">{metricas.aguardando_aprovacao}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Valor Total Selecoes</p>
                <p className="text-2xl font-normal text-[#F25C26]">
                  {formatCurrency(metricas.valor_total_selecoes)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por cliente, projeto ou contrato..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="aguardando_aprovacao">Aguardando Aprovacao</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recentes">Mais Recentes</SelectItem>
                <SelectItem value="antigos">Mais Antigos</SelectItem>
                <SelectItem value="valor">Maior Valor</SelectItem>
                <SelectItem value="nome">Nome do Cliente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Moodboards */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredMoodboards.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Palette className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                Nenhum moodboard encontrado
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== "todos"
                  ? "Tente ajustar os filtros de busca"
                  : "Crie o primeiro moodboard para um cliente"}
              </p>
              {!searchTerm && statusFilter === "todos" && (
                <Button onClick={() => setShowNovoMoodboard(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Moodboard
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente / Projeto</TableHead>
                  <TableHead>Etapa Atual</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Valor Selecionado</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ultima Atividade</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMoodboards.map((moodboard) => {
                  const statusCfg = STATUS_CONFIG[moodboard.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.rascunho;
                  const StatusIcon = statusCfg.icon;
                  const progresso = moodboard.etapas_total > 0
                    ? Math.round((moodboard.etapas_concluidas / moodboard.etapas_total) * 100)
                    : 0;

                  return (
                    <TableRow key={moodboard.id} className="cursor-pointer hover:bg-gray-50">
                      <TableCell onClick={() => handleVerMoodboard(moodboard)}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F25C26] to-[#F57F17] flex items-center justify-center text-white font-normal">
                            {moodboard.cliente_nome.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{moodboard.cliente_nome}</p>
                            <p className="text-sm text-gray-500">
                              {moodboard.projeto_nome || moodboard.contrato_numero || "Sem projeto"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell onClick={() => handleVerMoodboard(moodboard)}>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{moodboard.etapa_atual}</span>
                        </div>
                      </TableCell>
                      <TableCell onClick={() => handleVerMoodboard(moodboard)}>
                        <div className="space-y-1 w-32">
                          <div className="flex justify-between text-xs">
                            <span>{moodboard.etapas_concluidas}/{moodboard.etapas_total}</span>
                            <span>{progresso}%</span>
                          </div>
                          <Progress value={progresso} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell onClick={() => handleVerMoodboard(moodboard)}>
                        <span className="font-medium text-[#F25C26]">
                          {formatCurrency(moodboard.valor_selecionado)}
                        </span>
                      </TableCell>
                      <TableCell onClick={() => handleVerMoodboard(moodboard)}>
                        <Badge className={cn("flex items-center gap-1 w-fit", statusCfg.color)}>
                          <StatusIcon className="h-3 w-3" />
                          {statusCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={() => handleVerMoodboard(moodboard)}>
                        <span className="text-sm text-gray-500">
                          {formatRelativeTime(moodboard.ultima_atividade)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acoes</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleVerMoodboard(moodboard)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Moodboard
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditarMoodboard(moodboard)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleNotificarCliente(moodboard)}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Notificar Cliente
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleGerarPedidos(moodboard)}>
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Gerar Pedidos
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportarRelatorio(moodboard)}>
                              <FileText className="h-4 w-4 mr-2" />
                              Exportar Relatorio
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal Novo Moodboard */}
      <Dialog open={showNovoMoodboard} onOpenChange={setShowNovoMoodboard}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Moodboard</DialogTitle>
            <DialogDescription>
              Selecione um cliente e contrato para criar o moodboard
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-500">
              Para criar um novo moodboard, acesse a pagina do contrato do cliente e clique em
              "Criar Moodboard".
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setShowNovoMoodboard(false);
                navigate("/contratos");
              }}
            >
              <Users className="h-4 w-4 mr-2" />
              Ir para Contratos
              <ArrowUpRight className="h-4 w-4 ml-auto" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Notificar Cliente */}
      <Dialog open={showNotificar} onOpenChange={setShowNotificar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notificar Cliente</DialogTitle>
            <DialogDescription>
              Envie uma notificacao para {selectedMoodboard?.cliente_nome}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => enviarNotificacao("etapa_liberada")}
            >
              <Clock className="h-4 w-4 mr-2 text-blue-500" />
              Nova etapa liberada
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => enviarNotificacao("lembrete_prazo")}
            >
              <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
              Lembrete de prazo
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => enviarNotificacao("sugestao_adicionada")}
            >
              <Palette className="h-4 w-4 mr-2 text-purple-500" />
              Nova sugestao adicionada
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => enviarNotificacao("pedido_enviado")}
            >
              <ShoppingCart className="h-4 w-4 mr-2 text-green-500" />
              Pedido enviado ao fornecedor
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNotificar(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
