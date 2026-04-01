/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// SUPER CRONOGRAMA GANTT - Sistema WG Easy
// VisualizaçÍo Gantt com Financeiro Integrado
// ============================================================

import React, { useState, useEffect, useRef, useMemo } from "react";
import { formatarMoeda } from "@/lib/utils";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import { format, addDays, differenceInDays, isWeekend, parseISO, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateInputBR } from "@/components/ui/DateInputBR";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Layers,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Save,
  Plus,
  Trash2,
  Link2,
  Unlink,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  BarChart3,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

// ============================================================
// TIPOS
// ============================================================

interface TarefaGantt {
  id: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  nucleo?: string;
  data_inicio?: string;
  data_termino?: string;
  progresso: number;
  status: string;
  ordem: number;
  valor_total?: number;
  parent_id?: string | null; // Para dependências/subtarefas
  dependencias?: string[];
  dias_trabalhados?: number;
  valor_por_dia?: number;
  valor_realizado?: number;
  valor_pendente?: number;
}

interface ProjetoGantt {
  id: string;
  nome: string;
  cliente_nome?: string;
  data_inicio?: string;
  data_termino?: string;
  valor_total?: number;
  tarefas: TarefaGantt[];
}

// Cores por categoria
const CORES_CATEGORIAS: Record<string, { bg: string; border: string; text: string }> = {
  "Estrutura": { bg: "bg-blue-500/80", border: "border-blue-600", text: "text-blue-100" },
  "Alvenaria": { bg: "bg-orange-500/80", border: "border-orange-600", text: "text-orange-100" },
  "Instalações Elétricas": { bg: "bg-yellow-500/80", border: "border-yellow-600", text: "text-yellow-100" },
  "Instalações Hidráulicas": { bg: "bg-cyan-500/80", border: "border-cyan-600", text: "text-cyan-100" },
  "Acabamento": { bg: "bg-purple-500/80", border: "border-purple-600", text: "text-purple-100" },
  "Pintura": { bg: "bg-pink-500/80", border: "border-pink-600", text: "text-pink-100" },
  "Marcenaria": { bg: "bg-amber-600/80", border: "border-amber-700", text: "text-amber-100" },
  "FundaçÍo": { bg: "bg-stone-500/80", border: "border-stone-600", text: "text-stone-100" },
  "Cobertura": { bg: "bg-red-500/80", border: "border-red-600", text: "text-red-100" },
  "Paisagismo": { bg: "bg-green-500/80", border: "border-green-600", text: "text-green-100" },
  "Mobiliário": { bg: "bg-indigo-500/80", border: "border-indigo-600", text: "text-indigo-100" },
  "default": { bg: "bg-slate-500/80", border: "border-slate-600", text: "text-slate-100" },
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function SuperCronogramaGanttPage() {
  const { projetoId } = useParams();
  const navigate = useNavigate();

  // Estados
  const [projeto, setProjeto] = useState<ProjetoGantt | null>(null);
  const [tarefas, setTarefas] = useState<TarefaGantt[]>([]);
  const [loading, setLoading] = useState(true);
  const [modoFinanceiro, setModoFinanceiro] = useState(false);
  const [mostrarValores, setMostrarValores] = useState(true);
  const [tarefaEditando, setTarefaEditando] = useState<string | null>(null);
  const [tarefaExpandida, setTarefaExpandida] = useState<Set<string>>(new Set());
  const [draggedTarefa, setDraggedTarefa] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [animacaoInicial, setAnimacaoInicial] = useState(true);

  // Refs
  const timelineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ============================================================
  // CARREGAR DADOS
  // ============================================================

  useEffect(() => {
    carregarDados();
  }, [projetoId]);

  async function carregarDados() {
    if (!projetoId) return;

    try {
      setLoading(true);

      // Buscar projeto (sem join - evita erro de FK)
      const { data: projetoData, error: projetoError } = await supabase
        .from("projetos")
        .select("*")
        .eq("id", projetoId)
        .single();

      if (projetoError) throw projetoError;

      // Buscar nome do cliente separadamente
      let clienteNome = null;
      if (projetoData.cliente_id) {
        const { data: cliente } = await supabase
          .from("pessoas")
          .select("nome")
          .eq("id", projetoData.cliente_id)
          .single();
        clienteNome = cliente?.nome;
      }
      projetoData.cliente = { nome: clienteNome };

      // Buscar tarefas
      const { data: tarefasData, error: tarefasError } = await supabase
        .from("cronograma_tarefas")
        .select("*")
        .eq("projeto_id", projetoId)
        .order("ordem", { ascending: true });

      if (tarefasError) throw tarefasError;

      // Processar tarefas com cálculos financeiros
      const tarefasProcessadas = (tarefasData || []).map((t: any) => {
        const dias = t.data_inicio && t.data_termino
          ? Math.max(1, differenceInDays(parseISO(t.data_termino), parseISO(t.data_inicio)) + 1)
          : 1;
        const valorTotal = t.valor_total || 0;
        const valorPorDia = valorTotal / dias;
        const progressoDecimal = (t.progresso || 0) / 100;
        const valorRealizado = valorTotal * progressoDecimal;
        const valorPendente = valorTotal - valorRealizado;

        // Extrair nome da tarefa - pode vir de 'titulo' ou 'nome'
        // Se for objeto JSON, extrair o campo 'nome' interno
        let nomeTarefa = t.nome || t.titulo || `Tarefa ${t.ordem || 1}`;
        if (typeof nomeTarefa === "object" && nomeTarefa !== null) {
          // Se for objeto, tenta extrair nome/descricao
          nomeTarefa = nomeTarefa.nome || nomeTarefa.descricao || nomeTarefa.titulo || JSON.stringify(nomeTarefa);
        }
        // Se for string JSON, tenta parsear
        if (typeof nomeTarefa === "string" && nomeTarefa.startsWith("{")) {
          try {
            const parsed = JSON.parse(nomeTarefa);
            nomeTarefa = parsed.nome || parsed.descricao || parsed.titulo || nomeTarefa;
          } catch {
            // Manter o valor original se nÍo conseguir parsear
          }
        }

        return {
          ...t,
          nome: nomeTarefa, // Garantir que 'nome' está definido
          dias_trabalhados: dias,
          valor_por_dia: valorPorDia,
          valor_realizado: valorRealizado,
          valor_pendente: valorPendente,
        };
      });

      setProjeto({
        ...projetoData,
        cliente_nome: projetoData.cliente?.nome,
        tarefas: tarefasProcessadas,
      });
      setTarefas(tarefasProcessadas);

      // Remover animaçÍo inicial após carregar
      setTimeout(() => setAnimacaoInicial(false), 2000);
    } catch (error: any) {
      console.error("Erro ao carregar:", error);
      toast.error("Erro ao carregar cronograma");
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // CÁLCULOS DO TIMELINE
  // ============================================================

  const { dataInicio, dataFim, dias, larguraDia } = useMemo(() => {
    if (tarefas.length === 0) {
      const hoje = new Date();
      return {
        dataInicio: hoje,
        dataFim: addDays(hoje, 30),
        dias: Array.from({ length: 31 }, (_, i) => addDays(hoje, i)),
        larguraDia: 40,
      };
    }

    const todasDatas = tarefas.flatMap((t) => [
      t.data_inicio ? parseISO(t.data_inicio) : null,
      t.data_termino ? parseISO(t.data_termino) : null,
    ]).filter(Boolean) as Date[];

    if (todasDatas.length === 0) {
      const hoje = new Date();
      return {
        dataInicio: hoje,
        dataFim: addDays(hoje, 30),
        dias: Array.from({ length: 31 }, (_, i) => addDays(hoje, i)),
        larguraDia: 40,
      };
    }

    const minData = new Date(Math.min(...todasDatas.map((d) => d.getTime())));
    const maxData = new Date(Math.max(...todasDatas.map((d) => d.getTime())));

    // Adicionar margem
    const inicio = addDays(minData, -3);
    const fim = addDays(maxData, 7);
    const totalDias = differenceInDays(fim, inicio) + 1;

    return {
      dataInicio: inicio,
      dataFim: fim,
      dias: Array.from({ length: totalDias }, (_, i) => addDays(inicio, i)),
      larguraDia: 40,
    };
  }, [tarefas]);

  // ============================================================
  // CÁLCULOS FINANCEIROS
  // ============================================================

  const totaisFinanceiros = useMemo(() => {
    const valorTotal = tarefas.reduce((acc, t) => acc + (t.valor_total || 0), 0);
    const valorRealizado = tarefas.reduce((acc, t) => acc + (t.valor_realizado || 0), 0);
    const valorPendente = valorTotal - valorRealizado;
    const progressoGeral = valorTotal > 0 ? (valorRealizado / valorTotal) * 100 : 0;

    return { valorTotal, valorRealizado, valorPendente, progressoGeral };
  }, [tarefas]);

  // ============================================================
  // FUNÇÕES DE EDIÇÍO
  // ============================================================

  async function atualizarTarefa(tarefaId: string, campo: string, valor: any) {
    try {
      const { error } = await supabase
        .from("cronograma_tarefas")
        .update({ [campo]: valor })
        .eq("id", tarefaId);

      if (error) throw error;

      setTarefas((prev) =>
        prev.map((t) => (t.id === tarefaId ? { ...t, [campo]: valor } : t))
      );

      toast.success("Atualizado!");
    } catch (error: any) {
      toast.error("Erro ao atualizar");
    }
  }

  async function criarDependencia(tarefaFilhaId: string, tarefaPaiId: string) {
    if (tarefaFilhaId === tarefaPaiId) return;

    try {
      const { error } = await supabase
        .from("cronograma_tarefas")
        .update({ parent_id: tarefaPaiId })
        .eq("id", tarefaFilhaId);

      if (error) throw error;

      setTarefas((prev) =>
        prev.map((t) =>
          t.id === tarefaFilhaId ? { ...t, parent_id: tarefaPaiId } : t
        )
      );

      toast.success("Dependência criada!");
    } catch (error: any) {
      toast.error("Erro ao criar dependência");
    }
  }

  async function removerDependencia(tarefaId: string) {
    try {
      const { error } = await supabase
        .from("cronograma_tarefas")
        .update({ parent_id: null })
        .eq("id", tarefaId);

      if (error) throw error;

      setTarefas((prev) =>
        prev.map((t) => (t.id === tarefaId ? { ...t, parent_id: null } : t))
      );

      toast.success("Dependência removida!");
    } catch (error: any) {
      toast.error("Erro ao remover dependência");
    }
  }

  // ============================================================
  // DRAG & DROP
  // ============================================================

  function handleDragStart(e: React.DragEvent, tarefaId: string) {
    setDraggedTarefa(tarefaId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, tarefaId: string) {
    e.preventDefault();
    if (draggedTarefa && draggedTarefa !== tarefaId) {
      setDropTarget(tarefaId);
    }
  }

  function handleDragLeave() {
    setDropTarget(null);
  }

  function handleDrop(e: React.DragEvent, tarefaPaiId: string) {
    e.preventDefault();
    if (draggedTarefa && draggedTarefa !== tarefaPaiId) {
      criarDependencia(draggedTarefa, tarefaPaiId);
    }
    setDraggedTarefa(null);
    setDropTarget(null);
  }

  function handleDragEnd() {
    setDraggedTarefa(null);
    setDropTarget(null);
  }

  // ============================================================
  // HELPERS
  // ============================================================

  function getCorCategoria(categoria?: string) {
    return CORES_CATEGORIAS[categoria || ""] || CORES_CATEGORIAS.default;
  }

  function calcularPosicaoBarra(tarefa: TarefaGantt) {
    if (!tarefa.data_inicio || !tarefa.data_termino) {
      return { left: 0, width: larguraDia * 5 };
    }

    const inicio = parseISO(tarefa.data_inicio);
    const termino = parseISO(tarefa.data_termino);
    const offsetDias = differenceInDays(inicio, dataInicio);
    const duracao = differenceInDays(termino, inicio) + 1;

    return {
      left: offsetDias * larguraDia,
      width: Math.max(duracao * larguraDia, larguraDia),
    };
  }


  // ============================================================
  // RENDER - Loading
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center"
          >
            <BarChart3 className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-2xl font-normal text-white mb-2">Carregando Cronograma</h2>
          <p className="text-slate-400">Preparando visualizaçÍo...</p>
        </motion.div>
      </div>
    );
  }

  // ============================================================
  // RENDER - Página Principal
  // ============================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header Animado */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50"
      >
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Título */}
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate("/cronograma")}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>

              <div>
                <motion.h1
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-lg sm:text-2xl font-normal text-white flex items-center gap-2 sm:gap-3"
                >
                  <Sparkles className="w-6 h-6 text-primary" />
                  Super Cronograma Gantt
                </motion.h1>
                <motion.p
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-slate-400 text-sm"
                >
                  {projeto?.nome} • {projeto?.cliente_nome}
                </motion.p>
              </div>
            </div>

            {/* Controles */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Toggle Modo Financeiro */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setModoFinanceiro(!modoFinanceiro)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm sm:text-lg font-medium transition-all ${
                  modoFinanceiro
                    ? "bg-green-500 text-white shadow-lg shadow-green-500/30"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span className="hidden sm:inline">Financeiro</span>
              </motion.button>

              {/* Toggle Valores */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMostrarValores(!mostrarValores)}
                className={`p-2 rounded-xl transition-all ${
                  mostrarValores
                    ? "bg-slate-700 text-white"
                    : "bg-slate-800 text-slate-500"
                }`}
              >
                {mostrarValores ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </motion.button>
            </div>
          </div>

          {/* Barra de Progresso Geral */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-4"
          >
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-400">Progresso Geral</span>
              <span className="text-white font-normal">{totaisFinanceiros.progressoGeral.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${totaisFinanceiros.progressoGeral}%` }}
                transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-primary to-orange-500"
              />
            </div>
          </motion.div>
        </div>
      </motion.header>

      {/* Cards Financeiros */}
      <AnimatePresence>
        {modoFinanceiro && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="max-w-[1920px] mx-auto px-4 sm:px-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { label: "Valor Total", valor: totaisFinanceiros.valorTotal, cor: "from-blue-500 to-blue-600", icone: DollarSign },
                  { label: "Valor Realizado", valor: totaisFinanceiros.valorRealizado, cor: "from-green-500 to-green-600", icone: CheckCircle2 },
                  { label: "Valor Pendente", valor: totaisFinanceiros.valorPendente, cor: "from-orange-500 to-orange-600", icone: Clock },
                  { label: "A Receber (Proporcional)", valor: totaisFinanceiros.valorRealizado, cor: "from-purple-500 to-purple-600", icone: TrendingUp },
                ].map((card, index) => (
                  <motion.div
                    key={card.label}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`bg-gradient-to-br ${card.cor} rounded-2xl p-5 text-white shadow-xl`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <card.icone className="w-5 h-5 opacity-80" />
                      <span className="text-sm opacity-90">{card.label}</span>
                    </div>
                    <p className="text-2xl font-normal">{formatarMoeda(card.valor)}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Container do Gantt */}
      <div ref={containerRef} className="max-w-[1920px] mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden"
        >
          {/* Timeline Header */}
          <div className="flex border-b border-slate-700/50">
            {/* Coluna fixa de tarefas */}
            <div className="w-full md:w-[350px] lg:w-[400px] flex-shrink-0 bg-slate-800/80 border-r border-slate-700/50">
              <div className="h-16 px-4 flex items-center">
                <span className="text-slate-400 font-medium">Tarefas</span>
              </div>
            </div>

            {/* Timeline de dias scrollável */}
            <div ref={timelineRef} className="flex-1 overflow-x-auto">
              <div className="flex h-16" style={{ width: dias.length * larguraDia }}>
                {dias.map((dia, index) => {
                  const isHoje = format(dia, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                  const isFimDeSemana = isWeekend(dia);

                  return (
                    <motion.div
                      key={index}
                      initial={animacaoInicial ? { y: -20, opacity: 0 } : false}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: animacaoInicial ? index * 0.02 : 0 }}
                      className={`flex flex-col items-center justify-center border-r border-slate-700/30 ${
                        isHoje
                          ? "bg-primary/20"
                          : isFimDeSemana
                          ? "bg-slate-900/30"
                          : ""
                      }`}
                      style={{ width: larguraDia }}
                    >
                      <span className={`text-[10px] uppercase ${isHoje ? "text-primary" : "text-slate-500"}`}>
                        {format(dia, "EEE", { locale: ptBR })}
                      </span>
                      <span className={`text-sm font-normal ${isHoje ? "text-primary" : "text-slate-300"}`}>
                        {format(dia, "dd")}
                      </span>
                      <span className={`text-[10px] ${isHoje ? "text-primary" : "text-slate-500"}`}>
                        {format(dia, "MMM", { locale: ptBR })}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Linhas de Tarefas */}
          <div className="flex flex-col md:flex-row">
            {/* Coluna fixa de tarefas */}
            <div className="w-full md:w-[350px] lg:w-[400px] flex-shrink-0 bg-slate-800/50 border-r border-slate-700/50">
              {tarefas.map((tarefa, index) => {
                const cor = getCorCategoria(tarefa.categoria);
                const temFilhos = tarefas.some((t) => t.parent_id === tarefa.id);
                const ehFilho = !!tarefa.parent_id;
                const expandida = tarefaExpandida.has(tarefa.id);

                return (
                  <motion.div
                    key={tarefa.id}
                    initial={animacaoInicial ? { x: -50, opacity: 0 } : false}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: animacaoInicial ? index * 0.05 : 0 }}
                    draggable
                    onDragStart={(e) => handleDragStart(e as any, tarefa.id)}
                    onDragOver={(e) => handleDragOver(e as any, tarefa.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e as any, tarefa.id)}
                    onDragEnd={handleDragEnd}
                    className={`h-14 px-4 flex items-center gap-3 border-b border-slate-700/30 transition-all cursor-move ${
                      dropTarget === tarefa.id
                        ? "bg-primary/20 border-l-4 border-l-primary"
                        : draggedTarefa === tarefa.id
                        ? "opacity-50 bg-slate-700/50"
                        : "hover:bg-slate-700/30"
                    } ${ehFilho ? "pl-10" : ""}`}
                  >
                    {/* Grip */}
                    <GripVertical className="w-4 h-4 text-slate-500 flex-shrink-0" />

                    {/* Expand/Collapse */}
                    {temFilhos ? (
                      <button
                        onClick={() => {
                          const newSet = new Set(tarefaExpandida);
                          if (expandida) newSet.delete(tarefa.id);
                          else newSet.add(tarefa.id);
                          setTarefaExpandida(newSet);
                        }}
                        className="text-slate-400 hover:text-white"
                      >
                        {expandida ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    ) : ehFilho ? (
                      <button
                        onClick={() => removerDependencia(tarefa.id)}
                        className="text-slate-500 hover:text-red-400"
                        title="Remover dependência"
                      >
                        <Unlink className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="w-4" />
                    )}

                    {/* Badge Categoria */}
                    <div className={`w-3 h-3 rounded-full ${cor.bg} flex-shrink-0`} />

                    {/* Nome */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{tarefa.nome}</p>
                      {mostrarValores && tarefa.valor_total && (
                        <p className="text-xs text-slate-400">{formatarMoeda(tarefa.valor_total)}</p>
                      )}
                    </div>

                    {/* Datas Editáveis */}
                    <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                      <DateInputBR
                        value={tarefa.data_inicio || ""}
                        onChange={(val) => atualizarTarefa(tarefa.id, "data_inicio", val)}
                        className="w-28 px-2 py-1 text-xs bg-slate-700/50 border border-slate-600/50 rounded text-slate-300 focus:ring-2 focus:ring-primary/50"
                        placeholder="dd/mm/aaaa"
                        title="Data de início"
                      />
                      <span className="text-slate-500">→</span>
                      <DateInputBR
                        value={tarefa.data_termino || ""}
                        onChange={(val) => atualizarTarefa(tarefa.id, "data_termino", val)}
                        className="w-28 px-2 py-1 text-xs bg-slate-700/50 border border-slate-600/50 rounded text-slate-300 focus:ring-2 focus:ring-primary/50"
                        placeholder="dd/mm/aaaa"
                        title="Data de término"
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Área do Gantt */}
            <div className="flex-1 overflow-x-auto">
              <div style={{ width: dias.length * larguraDia }}>
                {tarefas.map((tarefa, index) => {
                  const cor = getCorCategoria(tarefa.categoria);
                  const pos = calcularPosicaoBarra(tarefa);

                  return (
                    <div
                      key={tarefa.id}
                      className="h-14 relative border-b border-slate-700/30"
                    >
                      {/* Grid de dias */}
                      <div className="absolute inset-0 flex">
                        {dias.map((dia, i) => {
                          const isHoje = format(dia, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                          const isFimDeSemana = isWeekend(dia);
                          return (
                            <div
                              key={i}
                              className={`border-r border-slate-700/20 ${
                                isHoje ? "bg-primary/10" : isFimDeSemana ? "bg-slate-900/20" : ""
                              }`}
                              style={{ width: larguraDia }}
                            />
                          );
                        })}
                      </div>

                      {/* Barra de Gantt */}
                      <motion.div
                        initial={animacaoInicial ? { scaleX: 0, opacity: 0 } : false}
                        animate={{ scaleX: 1, opacity: 1 }}
                        transition={{ delay: animacaoInicial ? 0.5 + index * 0.05 : 0, duration: 0.5 }}
                        className={`absolute top-2 h-10 ${cor.bg} ${cor.border} border rounded-lg shadow-lg cursor-pointer group overflow-hidden`}
                        style={{
                          left: pos.left,
                          width: pos.width,
                          transformOrigin: "left",
                        }}
                        title={`${tarefa.nome} - ${tarefa.progresso}%`}
                      >
                        {/* Barra de Progresso */}
                        <div
                          className="absolute inset-y-0 left-0 bg-white/20"
                          style={{ width: `${tarefa.progresso}%` }}
                        />

                        {/* Conteúdo */}
                        <div className="relative h-full px-3 flex items-center justify-between">
                          <span className={`text-xs font-medium ${cor.text} truncate`}>
                            {tarefa.nome}
                          </span>
                          <span className={`text-xs font-normal ${cor.text}`}>
                            {tarefa.progresso}%
                          </span>
                        </div>

                        {/* Valor Financeiro no Modo Financeiro */}
                        {modoFinanceiro && mostrarValores && tarefa.valor_total && (
                          <motion.div
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="absolute -bottom-6 left-0 text-xs text-green-400 font-medium bg-slate-900/80 px-2 py-0.5 rounded"
                          >
                            {formatarMoeda(tarefa.valor_realizado || 0)} / {formatarMoeda(tarefa.valor_total)}
                          </motion.div>
                        )}
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Legenda de Categorias */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 flex flex-wrap gap-3"
        >
          {Object.entries(CORES_CATEGORIAS)
            .filter(([key]) => key !== "default")
            .map(([categoria, cor]) => (
              <div
                key={categoria}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${cor.bg} ${cor.border} border`}
              >
                <span className={`text-xs font-medium ${cor.text}`}>{categoria}</span>
              </div>
            ))}
        </motion.div>

        {/* Instruções de Uso */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-6 bg-slate-800/30 rounded-xl p-4 border border-slate-700/30"
        >
          <h3 className="text-white font-medium mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Como usar
          </h3>
          <ul className="text-sm text-slate-400 space-y-1">
            <li>• <strong>Arraste uma tarefa</strong> sobre outra para criar dependência (subtarefa)</li>
            <li>• <strong>Clique em Unlink</strong> para remover a dependência</li>
            <li>• <strong>Edite as datas</strong> diretamente nos campos de início e término</li>
            <li>• <strong>Ative o modo Financeiro</strong> para ver valores proporcionais ao progresso</li>
            <li>• <strong>Cores representam categorias</strong> para melhor organizaçÍo visual</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}

