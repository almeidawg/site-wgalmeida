/**
 * Página de Diário de Obra do Colaborador
 * Permite criar registros com fotos e descriçÍo
 * Fotos sÍo enviadas para o Google Drive do cliente
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  Plus,
  Camera,
  Loader2,
  Search,
  Calendar,
  Filter,
  ImageIcon,
  CheckCircle2,
} from "lucide-react";
import { useUsuarioLogado } from "@/hooks/useUsuarioLogado";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { normalizeSearchTerm } from "@/utils/searchUtils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DiarioObraForm, DiarioObraList } from "@/components/diario-obra";
import { useClientesArea, ClienteAreaInfo } from "@/hooks/useClientesArea";
import {
  listarDiariosPorColaborador,
  excluirRegistroDiario,
  excluirFotoDiario,
  atualizarLegendaFoto,
} from "@/lib/diarioObraApi";
import type { DiarioObra, DiarioObraFoto } from "@/types/diarioObra";
import { TYPOGRAPHY } from "@/constants/typography";
import { formatarData } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listarProjetosCronograma } from "@/lib/cronogramaApi";
import type { ProjetoCompleto, StatusProjeto } from "@/types/cronograma";
import { getStatusProjetoColor } from "@/types/cronograma";
import { useNavigate } from "react-router-dom";

const getInitials = (name?: string) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

type ClienteCardData = {
  cliente: ClienteAreaInfo;
  registros: DiarioObra[];
  fotos: (DiarioObraFoto & { dataRegistro: string })[];
  ultimaData: string;
  totalFotos: number;
  ultimoRegistro: DiarioObra | null;
};

export default function ColaboradorDiarioObraPage() {
  const { toast } = useToast();
  const { clientes, loading: loadingClientes } = useClientesArea();
  const { usuario } = useUsuarioLogado();
  const [registros, setRegistros] = useState<DiarioObra[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [projetos, setProjetos] = useState<ProjetoCompleto[]>([]);
  const [projetosLoading, setProjetosLoading] = useState(true);
  const [filtroProjeto, setFiltroProjeto] = useState("");
  const [statusFiltroProjeto, setStatusFiltroProjeto] = useState<string>("todos");
  const [checklistFeito, setChecklistFeito] = useState<Record<string, boolean>>(
    {}
  );
  const navigate = useNavigate();

  // ID do colaborador logado
  const colaboradorId = usuario?.pessoa_id || "";

  const clientesComDiario = useMemo<ClienteCardData[]>(() => {
    const registroMap = new Map<string, DiarioObra[]>();
    registros.forEach((registro) => {
      if (!registro.cliente_id) return;
      const itensAtuais = registroMap.get(registro.cliente_id) ?? [];
      itensAtuais.push(registro);
      registroMap.set(registro.cliente_id, itensAtuais);
    });

    return clientes
      .map((cliente) => {
        const registrosCliente = registroMap.get(cliente.id) ?? [];
        const fotos = registrosCliente
          .flatMap((registro) =>
            (registro.fotos || []).map((foto) => ({
              ...foto,
              dataRegistro: registro.data_registro,
            }))
          )
          .sort(
            (a, b) =>
              new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
          );
        const ultimaData = registrosCliente.reduce((prev, current) => {
          if (!prev) return current.data_registro;
          return new Date(current.data_registro) > new Date(prev)
            ? current.data_registro
            : prev;
        }, "");
        const ultimoRegistro = registrosCliente.reduce<DiarioObra | null>(
          (prev, current) => {
            if (!prev) return current;
            return new Date(current.criado_em) > new Date(prev.criado_em)
              ? current
              : prev;
          },
          null
        );

        return {
          cliente,
          registros: registrosCliente,
          fotos,
          ultimaData,
          totalFotos: fotos.length,
          ultimoRegistro,
        };
      })
      .filter((item) => item.registros.length > 0);
  }, [clientes, registros]);

  // Carregar dados
  const loadDados = useCallback(async () => {
    try {
      setLoading(true);
      const diarios = await listarDiariosPorColaborador(colaboradorId);
      setRegistros(diarios);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }, [colaboradorId]);

  // Carregar dados iniciais
  useEffect(() => {
    if (colaboradorId) {
      loadDados();
    }
  }, [colaboradorId, loadDados]);

  useEffect(() => {
    const carregarProjetos = async () => {
      try {
        setProjetosLoading(true);
        const dados = await listarProjetosCronograma({
          mostrar_concluidos: true,
        });
        setProjetos(dados);
      } catch (error) {
        console.error("Erro ao carregar projetos:", error);
      } finally {
        setProjetosLoading(false);
      }
    };

    carregarProjetos();
  }, []);

  // Handler para novo registro criado
  const handleNovoRegistro = useCallback(() => {
    setSheetOpen(false);
    loadDados();
  }, [loadDados]);

  // Handler para excluir registro
  const handleExcluirRegistro = useCallback(async (diarioId: string) => {
    try {
      await excluirRegistroDiario(diarioId);
      setRegistros((prev) => prev.filter((r) => r.id !== diarioId));
    } catch (error) {
      console.error("Erro ao excluir registro:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao excluir registro. Tente novamente." });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handler para excluir foto
  const handleExcluirFoto = useCallback(async (fotoId: string) => {
    try {
      await excluirFotoDiario(fotoId);
      setRegistros((prev) =>
        prev.map((r) => ({
          ...r,
          fotos: r.fotos?.filter((f) => f.id !== fotoId),
        }))
      );
    } catch (error) {
      console.error("Erro ao excluir foto:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao excluir foto. Tente novamente." });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handler para atualizar legenda
  const handleAtualizarLegenda = useCallback(
    async (fotoId: string, legenda: string) => {
      try {
        await atualizarLegendaFoto(fotoId, legenda);
        setRegistros((prev) =>
          prev.map((r) => ({
            ...r,
            fotos: r.fotos?.map((f) =>
              f.id === fotoId ? { ...f, legenda } : f
            ),
          }))
        );
      } catch (error) {
        console.error("Erro ao atualizar legenda:", error);
      }
    },
    []
  );

  const projetosFiltrados = useMemo(() => {
    const termo = normalizeSearchTerm(filtroProjeto);
    return projetos.filter((projeto) => {
      const matchesSearch =
        !termo ||
        normalizeSearchTerm(projeto.nome || "").includes(termo) ||
        normalizeSearchTerm(projeto.cliente_nome || "").includes(termo) ||
        normalizeSearchTerm(projeto.contrato_numero || "").includes(termo);
      const matchesStatus =
        statusFiltroProjeto === "todos" || projeto.status === statusFiltroProjeto;
      return matchesSearch && matchesStatus;
    });
  }, [projetos, filtroProjeto, statusFiltroProjeto]);

  const statsProjetos = useMemo(() => {
    const total = projetos.length;
    const emAndamento = projetos.filter(
      (projeto) => projeto.status === "em_andamento"
    ).length;
    const concluido = projetos.filter(
      (projeto) => projeto.status === "concluido"
    ).length;
    const atrasados = projetos.filter((projeto) => {
      if (!projeto.data_termino || projeto.status === "concluido") return false;
      return new Date(projeto.data_termino).getTime() < Date.now();
    }).length;

    return { total, emAndamento, concluido, atrasados };
  }, [projetos]);

  const projetosComDatas = useMemo(
    () =>
      projetosFiltrados.filter(
        (projeto) => projeto.data_inicio && projeto.data_termino
      ),
    [projetosFiltrados]
  );

  const timelineRange = useMemo(() => {
    if (projetosComDatas.length === 0) return null;
    const startTimes = projetosComDatas.map((projeto) =>
      new Date(projeto.data_inicio!).getTime()
    );
    const endTimes = projetosComDatas.map((projeto) =>
      new Date(projeto.data_termino!).getTime()
    );
    const start = new Date(Math.min(...startTimes));
    const end = new Date(Math.max(...endTimes));
    const durationMs = Math.max(end.getTime() - start.getTime(), 1);
    return { start, end, durationMs };
  }, [projetosComDatas]);

  const timelineProjects = useMemo(
    () => projetosComDatas.slice(0, 4),
    [projetosComDatas]
  );

  const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

  const checklistItems = useMemo(() => {
    return registros
      .flatMap((registro) => {
        const pendencias = registro.pendencias || registro.observacoes || "";
        const partes = pendencias
          .split(/\r?\n|;/)
          .map((item) => item.trim())
          .filter(Boolean);
        return partes.map((texto, idx) => ({
          id: `${registro.id}-${idx}`,
          texto,
          clienteNome: registro.cliente?.nome || "Cliente",
          dataRegistro: registro.data_registro,
        }));
      })
      .slice(0, 6);
  }, [registros]);

  const latestFotos = useMemo(() => {
    return registros
      .flatMap((registro) =>
        (registro.fotos || []).map((foto) => ({
          ...foto,
          clienteNome: registro.cliente?.nome || "Cliente",
          dataRegistro: registro.data_registro,
        }))
      )
      .sort(
        (a, b) =>
          new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
      )
      .slice(0, 6);
  }, [registros]);

  const toggleChecklist = useCallback((id: string) => {
    setChecklistFeito((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  if (loading || loadingClientes || projetosLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-wg-primary mx-auto mb-3" />
          <p className="text-gray-500">
            Carregando diário de obra, clientes e projetos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <h1 className={`${TYPOGRAPHY.pageTitle}`}>Diário de Obra</h1>
          <p className={`${TYPOGRAPHY.pageSubtitle}`}>
            Registre o dia a dia das obras com fotos e anotações
          </p>
        </div>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button className="bg-wg-primary hover:bg-wg-primary/90 gap-2 text-lg">
              <Camera className="h-4 w-4" />
              Novo Registro
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Novo Registro</SheetTitle>
              <SheetDescription>
                Adicione fotos e uma descriçÍo do dia de trabalho
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <DiarioObraForm
                colaboradorId={colaboradorId}
                onSuccess={handleNovoRegistro}
                onCancel={() => setSheetOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Projetos e Cronograma */}
      <div className="space-y-4">
        <div className="flex flex-col gap-1">
          <p className={TYPOGRAPHY.sectionTitle}>Projetos + Diário</p>
          <p className={TYPOGRAPHY.sectionSubtitle}>
            Conecte o cronograma, checklist e as imagens enviadas direto do campo.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Buscar projeto, cliente ou contrato..."
              value={filtroProjeto}
              onChange={(event) => setFiltroProjeto(event.target.value)}
            />
          </div>
          <Select
            value={statusFiltroProjeto}
            onValueChange={setStatusFiltroProjeto}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="mr-2 h-4 w-4 text-gray-500" />
              <SelectValue placeholder="Status do projeto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="em_andamento">Em andamento</SelectItem>
              <SelectItem value="concluido">Concluídos</SelectItem>
              <SelectItem value="cancelado">Cancelados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-[10px] uppercase tracking-wide text-gray-400">
              Total de projetos
            </p>
            <p className="text-2xl font-normal text-gray-900">{statsProjetos.total}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-[10px] uppercase tracking-wide text-gray-400">
              Em andamento
            </p>
            <p className="text-2xl font-normal text-blue-600">
              {statsProjetos.emAndamento}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-[10px] uppercase tracking-wide text-gray-400">
              Concluídos
            </p>
            <p className="text-2xl font-normal text-emerald-600">
              {statsProjetos.concluido}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-[10px] uppercase tracking-wide text-gray-400">
              Atrasados
            </p>
            <p className="text-2xl font-normal text-red-600">
              {statsProjetos.atrasados}
            </p>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.3fr,0.7fr]">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <p className="text-sm font-normal text-gray-900">
                  Cronograma em Gantt
                </p>
              </div>
              {timelineRange ? (
                <p className="text-[11px] text-gray-400">
                  {formatarData(timelineRange.start.toISOString())}
                  {" — "}
                  {formatarData(timelineRange.end.toISOString())}
                </p>
              ) : (
                <p className="text-[11px] text-gray-400">
                  Sem datas completas
                </p>
              )}
            </div>

            {timelineRange ? (
              <div className="mt-4 space-y-4">
                {timelineProjects.map((projeto) => {
                  const start = new Date(projeto.data_inicio!).getTime();
                  const end = new Date(projeto.data_termino!).getTime();
                  const startPercent = clampPercent(
                    ((start - timelineRange.start.getTime()) /
                      timelineRange.durationMs) *
                      100
                  );
                  const widthPercent = clampPercent(
                    ((end - start) / timelineRange.durationMs) * 100
                  );
                  const statusColor = getStatusProjetoColor(
                    projeto.status as StatusProjeto
                  );

                  return (
                    <div key={projeto.id} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-gray-500">
                        <span className="font-normal text-gray-900 truncate">
                          {projeto.nome}
                        </span>
                        <span className="text-xs text-gray-400">
                          {projeto.cliente_nome || "Cliente"}
                        </span>
                      </div>
                      <div className="relative h-2 rounded-full bg-gray-100">
                        <div
                          className="absolute inset-y-0 rounded-full"
                          style={{
                            left: `${startPercent}%`,
                            width: `${widthPercent}%`,
                            backgroundColor: statusColor,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-400">
                        <span>{projeto.data_inicio ? formatarData(projeto.data_inicio) : "-"}</span>
                        <span>{projeto.data_termino ? formatarData(projeto.data_termino) : "-"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-500">
                Nenhum projeto com as duas datas preenchidas.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-wg-primary" />
                <p className="text-sm font-normal text-gray-900">
                  Checklist Diário
                </p>
              </div>
              <div className="mt-3 space-y-2">
                {checklistItems.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Sem pendências recentes capturadas automaticamente.
                  </p>
                ) : (
                  checklistItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-3"
                    >
                      <Checkbox
                        checked={Boolean(checklistFeito[item.id])}
                        onCheckedChange={() => toggleChecklist(item.id)}
                      />
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{item.texto}</p>
                        <p className="text-[11px] text-gray-500">
                          {item.clienteNome} ·{" "}
                          {formatarData(item.dataRegistro)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-gray-500" />
                <p className="text-sm font-normal text-gray-900">
                  Galeria Semanal
                </p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {latestFotos.length === 0 ? (
                  <Card className="border-dashed border-gray-200 p-4 text-sm text-gray-500">
                    Nenhuma foto recente publicada
                  </Card>
                ) : (
                  latestFotos.map((foto) => (
                    <div
                      key={foto.id}
                      className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-gray-100"
                    >
                      <img
                        src={foto.arquivo_url}
                        alt={foto.legenda || "Foto do diário"}
                        className="h-32 w-full object-cover transition duration-200 group-hover:scale-105"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-white/90 px-2 py-2 text-[11px] text-gray-600">
                        <p className="font-medium text-gray-900">
                          {foto.clienteNome}
                        </p>
                        <p className="truncate">
                          {formatarData(foto.dataRegistro)} ·{" "}
                          {foto.legenda || "Sem legenda"}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Cards de clientes */}
      <div>
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-normal text-gray-900">
            Clientes com Diário ativo
          </h2>
          <p className="text-xs text-gray-500">
            Cada card replica o estilo visual das oportunidades, mostrando fotos,
            datas e registros recentes.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          {clientesComDiario.length === 0 ? (
            <Card className="border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
              Nenhum cliente com registros de obra ainda.
            </Card>
          ) : (
            clientesComDiario.map((card) => (
              <div
                key={card.cliente.id}
                className="cursor-pointer rounded-xl bg-white p-3 shadow-sm border border-gray-200 hover:border-[#F25C26] hover:shadow-md transition-all"
                onClick={() =>
                  navigate(`/colaborador/diariodeobra/${card.cliente.id}`)
                }
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="h-8 w-8 bg-gradient-to-br from-[#F25C26] to-[#D94E1F]">
                      <AvatarFallback className="text-white text-[11px] font-normal">
                        {getInitials(card.cliente.nome)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-[11px] font-normal text-gray-700 truncate">
                        {card.cliente.nome}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">
                        {card.registros.length} registro
                        {card.registros.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="px-2 py-0.5 rounded text-[9px] font-normal text-white bg-primary">
                      Diário
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {card.totalFotos} foto{card.totalFotos !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  {card.fotos.slice(0, 3).map((foto) => (
                    <div
                      key={foto.id}
                      className="relative h-20 rounded-xl overflow-hidden border border-gray-100 bg-gray-100"
                    >
                      <img
                        src={foto.arquivo_url}
                        alt={foto.legenda || "Foto da obra"}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-x-2 bottom-2 rounded-lg bg-black/60 px-2 py-0.5 text-[10px] text-white flex items-center justify-between">
                        <span>foto</span>
                        <span>{formatarData(foto.criado_em)}</span>
                      </div>
                    </div>
                  ))}
                  {card.fotos.length === 0 && (
                    <div className="col-span-3 flex items-center justify-center h-20 text-[11px] text-gray-500 border border-dashed rounded-lg">
                      Sem fotos registradas
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-100">
                  <span>
                    Última coleta:{" "}
                    {card.ultimaData ? formatarData(card.ultimaData) : "—"}
                  </span>
                  <span>Fotos recolhidas: {card.totalFotos}</span>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={(event) => {
                      event.stopPropagation();
                      navigate(`/colaborador/diariodeobra/${card.cliente.id}`);
                    }}
                  >
                    Ver registros
                  </Button>
                  <p className="text-[10px] text-gray-400">
                    Atualizado{" "}
                    {card.ultimoRegistro
                      ? formatarData(card.ultimoRegistro.criado_em)
                      : "-"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Lista de registros */}
      <DiarioObraList
        registros={registros}
        colaboradorAtualId={colaboradorId}
        showCliente={true}
        onExcluir={handleExcluirRegistro}
        onExcluirFoto={handleExcluirFoto}
        onAtualizarLegendaFoto={handleAtualizarLegenda}
      />

      {/* Empty state */}
      {registros.length === 0 && !loading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Camera className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              Nenhum registro ainda
            </h3>
            <p className="text-sm text-gray-500 text-center max-w-sm mb-4">
              Comece a documentar o progresso das obras. As fotos sÍo enviadas
              automaticamente para o Google Drive do cliente.
            </p>
            <Button
              onClick={() => setSheetOpen(true)}
              className="bg-wg-primary hover:bg-wg-primary/90 gap-2 text-lg"
            >
              <Plus className="h-4 w-4" />
              Criar Primeiro Registro
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
