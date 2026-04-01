/**
 * Dashboard do Colaborador
 * VisÍo geral de projetos, checklist diário, agenda e pendências
 * Layout responsivo para mobile, tablet e desktop
 */

import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { motion } from "framer-motion";
import {
  ArrowRight,
  AtSign,
  Camera,
  FolderKanban,
  Calendar,
  Bell,
  ChevronLeft,
  ChevronRight,
  Circle,
  Loader2,
  ListChecks,
  CheckCircle2,
} from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday,
  isSameDay,
  addWeeks,
  subWeeks,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";
import { formatarMoeda, formatarData } from "@/lib/utils";
import {
  obterResumoFinanceiroColaborador,
  ResumoFinanceiroColaborador,
  listarLancamentosFavorecido,
  ColaboradorLancamento,
  listarProjetosColaborador,
  ColaboradorProjeto,
} from "@/lib/colaboradorApi";
import {
  listarNotasHierarquico,
  listarItensMencionados,
  toggleItemCheck,
  NotaSistema,
  NotaSistemaItem,
} from "@/lib/notasSistemaApi";
import {
  listarNotificacoesUsuario,
  TaskComentarioCompleto,
  ComentarioNotificacao,
} from "@/lib/taskComentariosApi";
import {
  listarDiariosPorColaborador,
} from "@/lib/diarioObraApi";
import type { DiarioObra } from "@/types/diarioObra";
import { supabase } from "@/lib/supabaseClient";
import Avatar from "@/components/common/Avatar";

// Tipo para dados do card de cliente com diário
type ClienteDiarioCard = {
  clienteId: string;
  clienteNome: string;
  avatarUrl?: string | null;
  fotoUrl?: string | null;
  registros: number;
  totalFotos: number;
  ultimaData: string;
  progresso: number;
  fotosRecentes: Array<{ id: string; url: string; data: string; legenda: string | null }>;
};

type AgendaTarefa = {
  id: string;
  texto: string;
  jornada: string;
  dataBase: string;
  dataInicio?: string | null;
  dataConclusao?: string | null;
  status: "pendente" | "concluida";
};

// Card de Cliente com Diário - estilo compacto
const ClienteDiarioCardCompact = ({
  card,
  onClick,
}: {
  card: ClienteDiarioCard;
  onClick: () => void;
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="w-full bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border border-gray-200 hover:border-[#F25C26] cursor-pointer"
    >
      {/* Header com Avatar e Nome */}
      <div className="flex items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar
            nome={card.clienteNome}
            avatar_url={card.avatarUrl || null}
            foto_url={card.fotoUrl || null}
            size={32}
          />
          <div className="min-w-0">
            <p className="text-[13px] font-normal text-gray-900 truncate uppercase">
              {card.clienteNome}
            </p>
            <p className="text-[10px] text-gray-500">
              {card.registros} registro{card.registros !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded text-[9px] font-normal text-white bg-primary">
          Diário
        </span>
      </div>

      {/* Grid de Fotos Recentes */}
      <div className="px-3 pb-2">
        <div className="grid grid-cols-3 gap-1.5">
          {card.fotosRecentes.slice(0, 3).map((foto) => (
            <div
              key={foto.id}
              className="relative aspect-square rounded-lg overflow-hidden border border-gray-100 bg-gray-100"
            >
              <img
                src={foto.url}
                alt="Foto da obra"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-1 bottom-1 rounded bg-black/60 px-1.5 py-0.5 text-[8px] text-white flex items-center justify-between gap-1">
                <span className="truncate flex-1">{foto.legenda || "foto"}</span>
                <span className="flex-shrink-0">{foto.data}</span>
              </div>
            </div>
          ))}
          {card.fotosRecentes.length === 0 && (
            <div className="col-span-3 flex items-center justify-center h-16 text-[10px] text-gray-400 border border-dashed rounded-lg">
              <Camera className="w-4 h-4 mr-1" />
              Sem fotos
            </div>
          )}
        </div>
      </div>

      {/* Barra de Progresso */}
      <div className="px-3 pb-2">
        <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
          <span>Progresso do projeto</span>
          <span className="font-medium text-[#F25C26]">{card.progresso}%</span>
        </div>
        <Progress value={card.progresso} className="h-1.5" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 text-[10px] text-gray-500">
        <span>{card.totalFotos} foto{card.totalFotos !== 1 ? "s" : ""}</span>
        <span>{card.ultimaData ? formatarData(card.ultimaData) : "Sem registros"}</span>
      </div>
    </motion.div>
  );
};

// Widget de Mini Calendário Semanal
const MiniCalendarioWidget = ({ tarefas }: { tarefas: AgendaTarefa[] }) => {
  const [semanaAtual, setSemanaAtual] = useState(new Date());
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(new Date());

  const diasSemana = useMemo(() => {
    const inicio = startOfWeek(semanaAtual, { locale: ptBR });
    const fim = endOfWeek(semanaAtual, { locale: ptBR });
    return eachDayOfInterval({ start: inicio, end: fim });
  }, [semanaAtual]);

  const tarefasDoDia = useMemo(() => {
    if (!diaSelecionado) return [];
    return tarefas.filter((tarefa) => {
      const data = new Date(`${tarefa.dataBase}T12:00:00`);
      return isSameDay(data, diaSelecionado);
    });
  }, [diaSelecionado, tarefas]);

  const quantidadeNoDia = useMemo(() => {
    return diasSemana.reduce<Record<string, number>>((acc, dia) => {
      const chave = format(dia, "yyyy-MM-dd");
      acc[chave] = tarefas.filter((tarefa) => {
        const data = new Date(`${tarefa.dataBase}T12:00:00`);
        return isSameDay(data, dia);
      }).length;
      return acc;
    }, {});
  }, [diasSemana, tarefas]);

  return (
    <Card className="h-full">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className={`${TYPOGRAPHY.cardTitle} flex items-center gap-1.5`}>
            <Calendar className={`${TYPOGRAPHY.iconSmall} text-[#F25C26]`} />
            Agenda
          </CardTitle>
          <div className="flex items-center gap-1">
            <button
              type="button"
              title="Semana anterior"
              onClick={() => setSemanaAtual(subWeeks(semanaAtual, 1))}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
            </button>
            <button
              type="button"
              onClick={() => setSemanaAtual(new Date())}
              className="px-2 py-0.5 text-[10px] text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              Hoje
            </button>
            <button
              type="button"
              title="Próxima semana"
              onClick={() => setSemanaAtual(addWeeks(semanaAtual, 1))}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
        </div>
        <p className="text-[10px] text-gray-500 mt-0.5">
          {format(diasSemana[0], "d MMM", { locale: ptBR })} - {format(diasSemana[6], "d MMM", { locale: ptBR })}
        </p>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="grid grid-cols-7 gap-1">
          {diasSemana.map((dia) => {
            const hoje = isToday(dia);
            const selecionado = diaSelecionado && isSameDay(dia, diaSelecionado);
            const chave = format(dia, "yyyy-MM-dd");
            const totalTarefasDia = quantidadeNoDia[chave] || 0;
            return (
              <button
                type="button"
                key={dia.toISOString()}
                onClick={() => setDiaSelecionado(dia)}
                className={`
                  flex flex-col items-center p-1.5 rounded-lg transition-all text-center
                  ${hoje ? "bg-primary text-white" : ""}
                  ${selecionado && !hoje ? "bg-orange-100 ring-1 ring-[#F25C26]" : ""}
                  ${!hoje && !selecionado ? "hover:bg-gray-100" : ""}
                `}
              >
                <span className={`text-[9px] uppercase ${hoje ? "text-white/80" : "text-gray-400"}`}>
                  {format(dia, "EEE", { locale: ptBR }).slice(0, 3)}
                </span>
                <span className={`text-sm font-medium ${hoje ? "text-white" : "text-gray-700"}`}>
                  {format(dia, "d")}
                </span>
                {totalTarefasDia > 0 && (
                  <span
                    className={`mt-0.5 text-[9px] leading-none ${
                      hoje ? "text-white/90" : "text-[#F25C26]"
                    }`}
                  >
                    {totalTarefasDia}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="mt-3 pt-2 border-t border-gray-100">
          <p className="text-[10px] text-gray-500 text-center">
            {diaSelecionado ? format(diaSelecionado, "EEEE, d 'de' MMMM", { locale: ptBR }) : "Selecione um dia"}
          </p>
        </div>
        <div className="mt-2 space-y-1.5 max-h-[130px] overflow-y-auto">
          {tarefasDoDia.length === 0 ? (
            <p className="text-[10px] text-gray-400 text-center py-1">Sem tarefas nesta data</p>
          ) : (
            tarefasDoDia.slice(0, 6).map((tarefa) => (
              <div
                key={tarefa.id}
                className={`rounded-lg border px-2 py-1.5 ${
                  tarefa.status === "concluida"
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-orange-50 border-orange-200"
                }`}
              >
                <p className="text-[10px] text-gray-800 line-clamp-1">{tarefa.texto}</p>
                <p className="text-[9px] text-gray-500 line-clamp-1">{tarefa.jornada}</p>
                <p className="text-[9px] text-gray-500 mt-0.5">
                  Início: {tarefa.dataInicio ? formatarData(tarefa.dataInicio) : "—"} · ConclusÍo:{" "}
                  {tarefa.dataConclusao ? formatarData(tarefa.dataConclusao) : "—"}
                </p>
              </div>
            ))
          )}
          {tarefasDoDia.length > 6 && (
            <p className="text-[9px] text-gray-400 text-center">+{tarefasDoDia.length - 6} tarefas</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Widget de Checklist Real (dados do banco)
const ChecklistResumoWidget = ({
  pessoaId,
  usuarioId,
  tipoUsuario,
  authUserId,
}: {
  pessoaId: string;
  usuarioId: string;
  tipoUsuario: string;
  authUserId?: string;
}) => {
  const [notas, setNotas] = useState<NotaSistema[]>([]);
  const [mencionados, setMencionados] = useState<NotaSistemaItem[]>([]);
  const [loadingChecklist, setLoadingChecklist] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    const carregar = async () => {
      try {
        const [notasData, mencionadosData] = await Promise.all([
          listarNotasHierarquico({ usuarioId, pessoaId, tipoUsuario, filtro: "minhas", authUserId }),
          listarItensMencionados(pessoaId),
        ]);
        setNotas(notasData);
        setMencionados(mencionadosData);
      } catch (err) {
        console.error("Erro ao carregar checklist:", err);
      } finally {
        setLoadingChecklist(false);
      }
    };
    carregar();
  }, [pessoaId, usuarioId, tipoUsuario, authUserId]);

  // Computar itens pendentes e concluídos
  const todosItens = useMemo(() => {
    return notas.flatMap((n) => (n.itens || []).map((i) => ({ ...i, notaId: n.id, notaTitulo: n.titulo })));
  }, [notas]);

  const concluidos = todosItens.filter((i) => i.checked).length;
  const total = todosItens.length;
  const pendentes = total - concluidos;
  const progresso = total > 0 ? Math.round((concluidos / total) * 100) : 0;
  const mencoesNaoLidas = mencionados.filter((i) => !i.checked).length;

  // 5 itens pendentes mais recentes
  const itensPendentesRecentes = useMemo(() => {
    return todosItens.filter((i) => !i.checked).slice(0, 5);
  }, [todosItens]);

  const handleToggle = async (item: typeof todosItens[0]) => {
    setToggling(item.id);
    try {
      const ok = await toggleItemCheck(item.id, !item.checked, pessoaId);
      if (ok) {
        setNotas((prev) =>
          prev.map((n) => {
            if (n.id !== item.notaId) return n;
            return {
              ...n,
              itens: n.itens?.map((i) => (i.id === item.id ? { ...i, checked: !item.checked } : i)),
            };
          })
        );
      }
    } finally {
      setToggling(null);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className={`${TYPOGRAPHY.cardTitle} flex items-center gap-1.5`}>
            <ListChecks className={`${TYPOGRAPHY.iconSmall} text-amber-500`} />
            Checklist
          </CardTitle>
          <div className="flex items-center gap-1.5">
            {mencoesNaoLidas > 0 && (
              <Badge variant="destructive" className="text-[9px] px-1.5 py-0.5">
                {mencoesNaoLidas} menções
              </Badge>
            )}
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0.5">
              {concluidos}/{total}
            </Badge>
          </div>
        </div>
        <Progress value={progresso} className="h-1 mt-1.5" />
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {loadingChecklist ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
          </div>
        ) : itensPendentesRecentes.length === 0 ? (
          <div className="text-center py-3 text-gray-500">
            <CheckCircle2 className="h-5 w-5 mx-auto mb-1 opacity-40 text-emerald-500" />
            <p className="text-[10px]">{total > 0 ? "Tudo concluído!" : "Nenhuma tarefa"}</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
            {itensPendentesRecentes.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => handleToggle(item)}
                disabled={toggling === item.id}
                className="w-full flex items-center gap-2 p-1.5 rounded-lg text-left transition-all bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
              >
                {toggling === item.id ? (
                  <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin flex-shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] text-gray-700 line-clamp-1">{item.texto}</span>
                  <span className="text-[9px] text-gray-400 truncate block">{item.notaTitulo}</span>
                </div>
              </button>
            ))}
          </div>
        )}
        {pendentes > 5 && (
          <p className="text-[9px] text-gray-400 text-center mt-1">
            +{pendentes - 5} pendentes
          </p>
        )}
        <div className="mt-2">
          <Link
            to="/colaborador/checklist"
            className="flex items-center justify-center gap-1 w-full py-1.5 text-[10px] font-medium text-[#F25C26] hover:bg-orange-50 rounded-lg transition-colors"
          >
            Ver todos
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

// Widget de Alertas Compacto
const AlertasWidget = ({
  notificacoesMencoes,
  lancamentosPendentes,
  resumoFinanceiro,
}: {
  notificacoesMencoes: Array<ComentarioNotificacao & { comentario: TaskComentarioCompleto }>;
  lancamentosPendentes: ColaboradorLancamento[];
  resumoFinanceiro: ResumoFinanceiroColaborador | null;
}) => {
  const totalAlertas =
    notificacoesMencoes.length +
    (lancamentosPendentes.length > 3 ? 1 : 0) +
    (resumoFinanceiro && resumoFinanceiro.valor_liberado > 0 ? 1 : 0);

  return (
    <Card className="h-full">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className={`${TYPOGRAPHY.cardTitle} flex items-center gap-1.5`}>
            <Bell className={`${TYPOGRAPHY.iconSmall} text-amber-500`} />
            Alertas
          </CardTitle>
          {totalAlertas > 0 && (
            <Badge variant="destructive" className="text-[9px] px-1.5 py-0.5">
              {totalAlertas}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
          {/* Menções em tarefas */}
          {notificacoesMencoes.length > 0 && (
            <div className="p-2 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-1.5">
                <AtSign className="w-3 h-3 text-purple-600" />
                <p className="text-[10px] font-medium text-purple-800">
                  {notificacoesMencoes.length} mençÍo{notificacoesMencoes.length !== 1 ? "ões" : ""}
                </p>
              </div>
              <p className="text-[9px] text-purple-600 mt-0.5 truncate">
                {notificacoesMencoes[0]?.comentario?.task?.titulo || "Nova mençÍo"}
              </p>
            </div>
          )}

          {/* Lançamentos pendentes */}
          {lancamentosPendentes.length > 3 && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-[10px] font-medium text-blue-800">
                {lancamentosPendentes.length} lançamentos pendentes
              </p>
              <p className="text-[9px] text-blue-600 mt-0.5">Acompanhe o andamento</p>
            </div>
          )}

          {/* Valores liberados */}
          {resumoFinanceiro && resumoFinanceiro.valor_liberado > 0 && (
            <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-[10px] font-medium text-green-800">Valores liberados</p>
              <p className="text-[9px] text-green-600 mt-0.5">
                {formatarMoeda(resumoFinanceiro.valor_liberado)} disponível
              </p>
            </div>
          )}

          {/* Estado vazio */}
          {totalAlertas === 0 && (
            <div className="text-center py-3 text-gray-500">
              <Bell className="h-5 w-5 mx-auto mb-1 opacity-40" />
              <p className="text-[10px]">Nenhum alerta</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function ColaboradorDashboardPage() {
  const navigate = useNavigate();
  const { user, usuarioCompleto } = useAuth();
  const [loading, setLoading] = useState(true);
  const [resumoFinanceiro, setResumoFinanceiro] =
    useState<ResumoFinanceiroColaborador | null>(null);
  const [lancamentosPendentes, setLancamentosPendentes] = useState<
    ColaboradorLancamento[]
  >([]);
  const [notificacoesMencoes, setNotificacoesMencoes] = useState<
    Array<ComentarioNotificacao & { comentario: TaskComentarioCompleto }>
  >([]);
  const [diarios, setDiarios] = useState<DiarioObra[]>([]);
  const [projetos, setProjetos] = useState<ColaboradorProjeto[]>([]);
  const [tarefasAgenda, setTarefasAgenda] = useState<AgendaTarefa[]>([]);
  const [progressoClienteMap, setProgressoClienteMap] = useState<Record<string, number>>({});

  // Carregar dados
  useEffect(() => {
    const carregarDados = async () => {
      if (!usuarioCompleto?.pessoa_id) return;

      try {
        setLoading(true);

        const [resumoData, solicitacoesData, projetosData, diariosData, notasData] = await Promise.all([
          obterResumoFinanceiroColaborador(usuarioCompleto.pessoa_id),
          listarLancamentosFavorecido(usuarioCompleto.pessoa_id),
          listarProjetosColaborador(usuarioCompleto.pessoa_id),
          listarDiariosPorColaborador(usuarioCompleto.pessoa_id),
          listarNotasHierarquico({
            usuarioId: usuarioCompleto.id || usuarioCompleto.pessoa_id,
            pessoaId: usuarioCompleto.pessoa_id,
            tipoUsuario: usuarioCompleto.tipo || "COLABORADOR",
            filtro: "minhas",
            authUserId: user?.id,
          }),
        ]);

        setResumoFinanceiro(resumoData);
        setLancamentosPendentes(
          solicitacoesData.filter((l) =>
            ["pendente", "previsto", "parcial"].includes(
              l.status || ""
            )
          )
        );
        setProjetos(projetosData);
        setDiarios(diariosData);

        // 1) Tarefas vindas de notas/checklist interno
        const tarefasNotas = notasData.flatMap((nota) =>
          (nota.itens || []).map((item) => {
            const dataBase =
              (item.deadline ? String(item.deadline).slice(0, 10) : null) ||
              (item.checked_em ? String(item.checked_em).slice(0, 10) : null) ||
              String(item.criado_em).slice(0, 10);
            return {
              id: item.id,
              texto: item.texto,
              jornada: nota.titulo,
              dataBase,
              dataInicio: item.criado_em ? String(item.criado_em).slice(0, 10) : null,
              dataConclusao: item.checked_em ? String(item.checked_em).slice(0, 10) : null,
              status: item.checked ? "concluida" : "pendente",
            } as AgendaTarefa;
          })
        );

        // 2) Identificar clientes vinculados ao colaborador (projetos + diários)
        const clienteIds = Array.from(
          new Set(
            [
              ...projetosData
                .map((p) => p.projeto?.cliente_id)
                .filter((id): id is string => Boolean(id)),
              ...diariosData
                .map((d) => d.cliente_id)
                .filter((id): id is string => Boolean(id)),
            ]
          )
        );

        // 3) Buscar projetos reais e tarefas de cronograma
        let tarefasCronograma: AgendaTarefa[] = [];
        const progressoPorCliente: Record<string, { total: number; concluidas: number }> = {};

        if (clienteIds.length > 0) {
          const { data: projetosReais } = await supabase
            .from("projetos")
            .select("id, cliente_id, nome")
            .in("cliente_id", clienteIds);

          const projetoIds = (projetosReais || []).map((p: any) => p.id);

          if (projetoIds.length > 0) {
            const { data: tarefasProjeto } = await supabase
              .from("cronograma_tarefas")
              .select("id, projeto_id, titulo, nome, status, progresso, data_inicio, data_termino")
              .in("projeto_id", projetoIds);

            const projetoClienteMap = new Map<string, string>(
              (projetosReais || []).map((p: any) => [p.id, p.cliente_id])
            );

            tarefasCronograma = (tarefasProjeto || []).map((t: any) => {
              const clienteId = projetoClienteMap.get(t.projeto_id);
              if (clienteId) {
                if (!progressoPorCliente[clienteId]) {
                  progressoPorCliente[clienteId] = { total: 0, concluidas: 0 };
                }
                progressoPorCliente[clienteId].total += 1;
                if (
                  String(t.status || "").toLowerCase() === "concluido" ||
                  Number(t.progresso || 0) >= 100
                ) {
                  progressoPorCliente[clienteId].concluidas += 1;
                }
              }

              const dataBase =
                (t.data_inicio ? String(t.data_inicio).slice(0, 10) : null) ||
                (t.data_termino ? String(t.data_termino).slice(0, 10) : null) ||
                new Date().toISOString().slice(0, 10);

              return {
                id: `cronograma-${t.id}`,
                texto: t.titulo || t.nome || "Tarefa do cronograma",
                jornada: "Cronograma",
                dataBase,
                dataInicio: t.data_inicio ? String(t.data_inicio).slice(0, 10) : null,
                dataConclusao:
                  String(t.status || "").toLowerCase() === "concluido" || Number(t.progresso || 0) >= 100
                    ? (t.data_termino ? String(t.data_termino).slice(0, 10) : null)
                    : null,
                status:
                  String(t.status || "").toLowerCase() === "concluido" || Number(t.progresso || 0) >= 100
                    ? "concluida"
                    : "pendente",
              } as AgendaTarefa;
            });
          }

          // 4) Buscar itens de cliente_checklists (jornada cliente) para agenda
          const { data: oportunidades } = await supabase
            .from("oportunidades")
            .select("id, cliente_id")
            .in("cliente_id", clienteIds);

          const oportunidadeIds = (oportunidades || []).map((o: any) => o.id);
          if (oportunidadeIds.length > 0) {
            const { data: checklistsCliente } = await supabase
              .from("cliente_checklists")
              .select("id, nome, oportunidade_id, cliente_checklist_items(id, texto, concluido, data_inicio, data_fim)")
              .in("oportunidade_id", oportunidadeIds);

            const tarefasChecklistCliente: AgendaTarefa[] = (checklistsCliente || []).flatMap((cl: any) =>
              (cl.cliente_checklist_items || []).map((item: any) => {
                const dataBase =
                  (item.data_inicio ? String(item.data_inicio).slice(0, 10) : null) ||
                  (item.data_fim ? String(item.data_fim).slice(0, 10) : null) ||
                  new Date().toISOString().slice(0, 10);

                return {
                  id: `cliente-checklist-${item.id}`,
                  texto: item.texto || "Item de checklist",
                  jornada: `Checklist: ${cl.nome || "Jornada do Cliente"}`,
                  dataBase,
                  dataInicio: item.data_inicio ? String(item.data_inicio).slice(0, 10) : null,
                  dataConclusao: item.concluido ? (item.data_fim ? String(item.data_fim).slice(0, 10) : null) : null,
                  status: item.concluido ? "concluida" : "pendente",
                } as AgendaTarefa;
              })
            );

            tarefasCronograma = [...tarefasCronograma, ...tarefasChecklistCliente];
          }
        }

        const progressoNormalizado: Record<string, number> = {};
        Object.entries(progressoPorCliente).forEach(([clienteId, info]) => {
          progressoNormalizado[clienteId] =
            info.total > 0 ? Math.round((info.concluidas / info.total) * 100) : 0;
        });
        setProgressoClienteMap(progressoNormalizado);

        setTarefasAgenda([...tarefasNotas, ...tarefasCronograma]);

        // Carregar notificações de menções
        try {
          const notificacoes = await listarNotificacoesUsuario();
          setNotificacoesMencoes(notificacoes.filter((n) => !n.lida).slice(0, 5));
        } catch {
          setNotificacoesMencoes([]);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [usuarioCompleto?.id, usuarioCompleto?.pessoa_id, usuarioCompleto?.tipo, user?.id]);

  // Agrupar diários por cliente
  const clientesComDiario = useMemo<ClienteDiarioCard[]>(() => {
    const clienteMap = new Map<string, {
      registros: DiarioObra[];
      projeto?: ColaboradorProjeto;
    }>();

    // Agrupar diários por cliente
    diarios.forEach((registro) => {
      const clienteId = registro.cliente_id;
      if (!clienteId) return;

      const atual = clienteMap.get(clienteId) || { registros: [] };
      atual.registros.push(registro);
      clienteMap.set(clienteId, atual);
    });

    // Associar projetos aos clientes
    projetos.forEach((projeto) => {
      const clienteIdProjeto = projeto.projeto?.cliente_id;
      if (clienteIdProjeto) {
        const atual = clienteMap.get(clienteIdProjeto);
        if (atual) {
          atual.projeto = projeto;
        }
      }
    });

    // Converter para array de cards
    return Array.from(clienteMap.entries())
      .map(([clienteId, data]) => {
        const registros = data.registros;
        const projeto = data.projeto;
        const clienteNome = registros[0]?.cliente?.nome || projeto?.projeto?.cliente_nome || "Cliente";

        // Calcular fotos
        const todasFotos = registros.flatMap((r) =>
          (r.fotos || []).map((f) => ({
            id: f.id,
            url: f.arquivo_url,
            data: new Date(f.criado_em).toLocaleDateString("pt-BR"),
            legenda: f.legenda,
            _ts: f.criado_em || "",
          }))
        ).sort((a, b) => (b._ts > a._ts ? 1 : b._ts < a._ts ? -1 : 0));

        // Calcular última data
        const ultimaData = registros.reduce((prev, current) => {
          if (!prev) return current.data_registro;
          return new Date(current.data_registro) > new Date(prev)
            ? current.data_registro
            : prev;
        }, "");

        // Calcular progresso (baseado no projeto se disponível)
        const statusContrato = String(projeto?.projeto?.status || "").toLowerCase();
        const progressoRealCronograma = progressoClienteMap[clienteId];
        const progresso =
          typeof progressoRealCronograma === "number"
            ? progressoRealCronograma
            : statusContrato.includes("conclu") || statusContrato.includes("final")
              ? 100
              : statusContrato.includes("exec") || statusContrato.includes("ativo")
                ? 60
                : 0;

        // Obter foto do cliente - primeiro do diário, depois do projeto
        const clienteAvatar = registros[0]?.cliente?.avatar_url || projeto?.projeto?.cliente_avatar_url;
        const clienteFoto = registros[0]?.cliente?.foto_url || projeto?.projeto?.cliente_foto_url;

        return {
          clienteId,
          clienteNome,
          avatarUrl: clienteAvatar,
          fotoUrl: clienteFoto,
          registros: registros.length,
          totalFotos: todasFotos.length,
          ultimaData,
          progresso,
          fotosRecentes: todasFotos.slice(0, 3),
        };
      })
      .sort((a, b) => {
        if (!a.ultimaData) return 1;
        if (!b.ultimaData) return -1;
        return new Date(b.ultimaData).getTime() - new Date(a.ultimaData).getTime();
      })
      .slice(0, 4); // Mostrar apenas os 4 mais recentes no dashboard
  }, [diarios, projetos, progressoClienteMap]);

  const handleAbrirDiario = (clienteId: string) => {
    navigate(`/colaborador/diariodeobra/${clienteId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-wg-primary" />
      </div>
    );
  }

  return (
    <div className={LAYOUT.pageContainer}>
      <div className={LAYOUT.sectionGap}>
      {/* Linha 1: Calendário, Checklist e Alertas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <MiniCalendarioWidget tarefas={tarefasAgenda} />
        {usuarioCompleto?.pessoa_id && usuarioCompleto?.id && (
          <ChecklistResumoWidget
            pessoaId={usuarioCompleto.pessoa_id}
            usuarioId={usuarioCompleto.id}
            tipoUsuario={usuarioCompleto.tipo || "COLABORADOR"}
            authUserId={user?.id}
          />
        )}
        <AlertasWidget
          notificacoesMencoes={notificacoesMencoes}
          lancamentosPendentes={lancamentosPendentes}
          resumoFinanceiro={resumoFinanceiro}
        />
      </div>

      {/* Bloco de Projetos */}
      {clientesComDiario.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderKanban className={`${TYPOGRAPHY.iconSmall} text-[#F25C26]`} />
              <h2 className={TYPOGRAPHY.cardTitle}>Projetos</h2>
            </div>
            <Button variant="ghost" size="sm" className="h-6 sm:h-7 px-2" asChild>
              <Link to="/colaborador/projetos">
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {clientesComDiario.map((card) => (
              <ClienteDiarioCardCompact
                key={card.clienteId}
                card={card}
                onClick={() => handleAbrirDiario(card.clienteId)}
              />
            ))}
          </div>
        </div>
      )}

      </div>
    </div>
  );
}

