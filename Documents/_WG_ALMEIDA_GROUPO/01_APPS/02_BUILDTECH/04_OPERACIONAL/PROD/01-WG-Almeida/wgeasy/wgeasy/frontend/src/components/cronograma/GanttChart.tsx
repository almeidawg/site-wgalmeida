// ============================================================
// COMPONENTE: GanttChart - Layout Profissional
// Cabeçalho com Ano/Mês e dias da semana (S T Q Q S S D)
// Barras finas, hierarquia visual, exportaçÍo PDF A4/A3
// ============================================================

import React, { useState, useMemo, useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Play,
  ChevronDown,
  ChevronRight,
  ArrowDownRight,
  GripVertical,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Download,
  Maximize2,
  Minimize2,
  FileText,
  Check,
  X,
  BarChart3,
  Link2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DateInputBR } from "@/components/ui/DateInputBR";
import {
  detectarFaseExecucaoInteligente,
  resolverSmartTags
} from "@/lib/cronogramaSmartTags";
import { getCategoriaConfig } from "@/config/categoriasConfig";

// ============================================================
// Helper: match tarefa → categoria pricelist por keywords
// ============================================================
const KEYWORDS_CATEGORIA: [string[], string][] = [
  [["planta", "projeto", "marcacao", "documento", "arquiteta", "arquiteto", "detalhament"], "arquitetura"],
  [["eletric", "tomada", "interruptor", "disjuntor", "quadro eletric", "infraestrutura eletric"], "eletrica"],
  [["hidraulic", "esgoto", "agua", "encanament", "hidrossanit"], "hidrossanitaria"],
  [["pintura", "pintor", "tinta", "massa corrida", "textura", "stain"], "pintura"],
  [["gesso", "forro", "sanca", "drywall", "tabica"], "gesso"],
  [["piso", "porcelanato", "ceramica", "revestiment", "contrapiso", "nivelament"], "piso"],
  [["marcenari", "armario", "movel", "bancada", "madeira"], "marcenaria"],
  [["vidrac", "vidro", "box", "espelho", "envidrac"], "vidracaria"],
  [["demolic", "remocao", "retir", "quebra"], "demolicoes"],
  [["automacao", "cortina", "persiana", "smart"], "automacao"],
  [["ar condicionado", "split", "climatiz", "infra ar"], "ar_condicionado"],
  [["limpeza", "lavar", "faxina", "pos obra", "pos-obra"], "limpeza"],
  [["acabament", "rodape", "soleira", "filete"], "acabamentos"],
  [["marmore", "granito", "pedra", "marmoraria"], "marmoraria"],
  [["iluminac", "luminaria", "led", "spot", "pendente"], "iluminacao"],
  [["louca", "vaso", "cuba", "metai", "torneira", "chuveiro"], "loucas_metais"],
  [["parede", "alvenaria", "bloco", "tijolo"], "paredes"],
  [["gas", "aquecedor"], "gas"],
  [["impermeabil", "manta"], "pre_obra"],
  [["checklist", "conferenc", "vistoria", "entrega"], "finalizacao"],
  [["kick", "reuniao", "staff", "equipe"], "kick_off"],
];

function matchCategoria(nome: string, categoria?: string): { cor: string; nome: string; id: string } {
  if (categoria) {
    const config = getCategoriaConfig(categoria);
    if (config) return { cor: config.cor, nome: config.nome, id: config.id };
  }
  const lower = nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const [keys, catId] of KEYWORDS_CATEGORIA) {
    if (keys.some(k => lower.includes(k))) {
      const config = getCategoriaConfig(catId);
      if (config) return { cor: config.cor, nome: config.nome, id: config.id };
    }
  }
  return { cor: "#6B7280", nome: "Sem categoria", id: "" };
}

// ============================================================
// Interfaces
// ============================================================
interface TarefaGantt {
  id: string;
  nome: string;
  descricao?: string;
  nucleo?: string;
  categoria?: string;
  data_inicio?: string;
  data_fim?: string;
  progresso: number;
  status: 'pendente' | 'em_andamento' | 'concluida' | 'atrasada';
  ordem: number;
  parent_id?: string; // Para hierarquia
  nivel?: number; // Nível de indentaçÍo
  dependencias?: string[]; // IDs de tarefas das quais esta depende
}

interface GanttChartProps {
  tarefas: TarefaGantt[];
  dataInicio?: string | null;
  dataFim?: string | null;
  onEdit?: (tarefa: TarefaGantt) => void;
  onDelete?: (tarefa: TarefaGantt) => void;
  onProgressoChange?: (tarefaId: string, progresso: number) => void;
  onDateChange?: (dataInicio: string | null, dataFim: string | null) => void;
  onTimelineComment?: (tarefaId: string, data: string) => void;
  onDependencyCreate?: (tarefaId: string, dependeDe: string) => void;
  onDependencyRemove?: (tarefaId: string, dependeDe: string) => void;
  onReorder?: (tarefaId: string, alvoId: string, posicao?: "before" | "after") => void;
  onTimelineMove?: (tarefaId: string, novaDataInicio: string) => void;
  onTimelineResize?: (tarefaId: string, novaDataInicio: string, novaDataFim: string) => void;
  projetoNome?: string;
  hideHeader?: boolean;
}

export interface GanttChartHandle {
  filtroTag: string;
  setFiltroTag: (tag: string) => void;
  filtroFase: string;
  setFiltroFase: (fase: string) => void;
  opcoesTag: string[];
  opcoesFase: { key: string; label: string }[];
  exportarPDF: (formato: 'A4' | 'A3') => void;
  toggleFullscreen: () => void;
  fullscreen: boolean;
}

// ============================================================
// Cores por categoria
// ============================================================
const CATEGORIA_CORES: Record<string, string> = {
  "Estrutura": "#3B82F6",      // Azul
  "Piso": "#14B8A6",           // Teal
  "Gesso": "#64748B",          // Cinza
  "Elétrica": "#CA8A04",       // Amarelo escuro
  "Hidráulica": "#0891B2",     // Ciano
  "Pintura": "#9333EA",        // Roxo
  "Marcenaria": "#A16207",     // Marrom
  "Vidraçaria": "#0EA5E9",     // Azul claro
  "Paisagismo": "#22C55E",     // Verde
  "ClimatizaçÍo": "#4F46E5",   // Índigo
  "AutomaçÍo": "#DB2777",      // Rosa
  "Alvenaria": "#EA580C",      // Laranja
  "FundaçÍo": "#78716C",       // Stone
  "Cobertura": "#DC2626",      // Vermelho
  "Acabamento": "#8B5CF6",     // Violeta
  "default": "#F25C26",        // Laranja WG
};

const getCategoriaCor = (categoria?: string): string => {
  return CATEGORIA_CORES[categoria || ""] || CATEGORIA_CORES.default;
};

// ============================================================
// Helpers de data
// ============================================================
const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function gerarDiasDoGantt(dataInicio: Date, dataFim: Date) {
  const dias: { data: Date; diaSemana: string; dia: number; mes: string; ano: number }[] = [];
  const atual = new Date(dataInicio);

  while (atual <= dataFim) {
    dias.push({
      data: new Date(atual),
      diaSemana: DIAS_SEMANA[atual.getDay()],
      dia: atual.getDate(),
      mes: MESES[atual.getMonth()],
      ano: atual.getFullYear(),
    });
    atual.setDate(atual.getDate() + 1);
  }

  return dias;
}

function agruparPorMes(dias: ReturnType<typeof gerarDiasDoGantt>) {
  const meses: { label: string; dias: typeof dias }[] = [];
  let mesAtual = '';

  dias.forEach(dia => {
    const label = `${dia.mes} ${dia.ano}`;
    if (label !== mesAtual) {
      meses.push({ label, dias: [] });
      mesAtual = label;
    }
    meses[meses.length - 1].dias.push(dia);
  });

  return meses;
}

function formatarData(data?: string): string {
  if (!data) return '-';
  return parseDataLocal(data).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function parseDataLocal(valor: string) {
  const isoSemHora = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoSemHora) {
    const [, ano, mes, dia] = isoSemHora;
    return new Date(Number(ano), Number(mes) - 1, Number(dia));
  }
  return new Date(valor);
}

function formatIsoLocal(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

// ============================================================
// Componente Principal
// ============================================================
const GanttChart = forwardRef<GanttChartHandle, GanttChartProps>(function GanttChart({
  tarefas,
  dataInicio,
  dataFim,
  onEdit,
  onDelete,
  onProgressoChange,
  onDateChange,
  onTimelineComment,
  onDependencyCreate,
  onDependencyRemove,
  onReorder,
  onTimelineMove,
  onTimelineResize,
  projetoNome = 'Projeto',
  hideHeader = false,
}, ref) {
  const [fullscreen, setFullscreen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [showProgressSlider, setShowProgressSlider] = useState<string | null>(null);
  const [localProgresso, setLocalProgresso] = useState(0);
  const ganttRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const infoColumnWidth = 320;

  // Estados para ediçÍo de datas do projeto
  const [editingDates, setEditingDates] = useState(false);
  const [localDataInicio, setLocalDataInicio] = useState(dataInicio || '');
  const [localDataFim, setLocalDataFim] = useState(dataFim || '');

  // Estados para Drag and Drop (reordenaçÍo e dependências)
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [dropBefore, setDropBefore] = useState<string | null>(null);
  const [draggedTimelineTask, setDraggedTimelineTask] = useState<string | null>(null);
  const [resizingTask, setResizingTask] = useState<{
    tarefaId: string;
    edge: 'start' | 'end';
    originalInicio: string;
    originalFim: string;
    previewInicio: string;
    previewFim: string;
    startX: number;
  } | null>(null);
  const [filtroTag, setFiltroTag] = useState<string>("todas");
  const [filtroFase, setFiltroFase] = useState<string>("todas");

  const tarefasComMeta = useMemo(() => {
    return tarefas.map((tarefa) => {
      const smart = resolverSmartTags({
        titulo: tarefa.nome,
        descricao: tarefa.descricao,
        nucleo: tarefa.nucleo,
        categoria: tarefa.categoria,
        ordem: tarefa.ordem,
      });
      const fase = detectarFaseExecucaoInteligente({
        titulo: tarefa.nome,
        descricao: tarefa.descricao,
        nucleo: tarefa.nucleo,
        categoria: tarefa.categoria,
      });
      return { tarefa, smart, fase };
    });
  }, [tarefas]);

  const opcoesTag = useMemo(() => {
    const tags = new Set<string>();
    for (const row of tarefasComMeta) {
      const cat = matchCategoria(row.tarefa.nome, row.tarefa.categoria);
      if (cat.id) tags.add(cat.nome);
    }
    return Array.from(tags).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [tarefasComMeta]);

  const opcoesFase = useMemo(() => {
    const fases = new Map<string, string>();
    for (const row of tarefasComMeta) {
      fases.set(row.fase.key, row.fase.label);
    }
    return Array.from(fases.entries()).map(([key, label]) => ({ key, label }));
  }, [tarefasComMeta]);

  // Expose imperative API for parent components
  useImperativeHandle(ref, () => ({
    filtroTag,
    setFiltroTag,
    filtroFase,
    setFiltroFase,
    opcoesTag,
    opcoesFase,
    exportarPDF,
    toggleFullscreen: () => setFullscreen(f => !f),
    fullscreen,
  }));

  const tarefasFiltradas = useMemo(() => {
    return tarefasComMeta
      .filter((row) => {
        if (filtroTag === "todas") return true;
        const cat = matchCategoria(row.tarefa.nome, row.tarefa.categoria);
        return cat.nome === filtroTag;
      })
      .filter((row) => (filtroFase === "todas" ? true : row.fase.key === filtroFase))
      .map((row) => row.tarefa);
  }, [tarefasComMeta, filtroTag, filtroFase]);

  const tarefasExibicao = useMemo(() => {
    // OrdenaçÍo: respeita a ordem manual (campo ordem) quando definida.
    // Fallback para data_inicio quando ordem é igual ou zero.
    const ordenadas = [...tarefasFiltradas].sort((a, b) => {
      const ordemA = a.ordem || 0;
      const ordemB = b.ordem || 0;

      // Se ambas têm ordem definida, respeitar diretamente
      if (ordemA !== ordemB) return ordemA - ordemB;

      // Fallback: ordenar por data de início
      const dataA = a.data_inicio || "9999-12-31";
      const dataB = b.data_inicio || "9999-12-31";
      return dataA.localeCompare(dataB);
    });

    const byId = new Map(ordenadas.map((t) => [t.id, t]));
    const filhosPorPai = new Map<string, string[]>();
    const dependenciaPrincipal = new Map<string, string>();

    for (const t of ordenadas) {
      const pai = (t.dependencias || []).find((depId) => byId.has(depId));
      if (!pai) continue;
      dependenciaPrincipal.set(t.id, pai);
      filhosPorPai.set(pai, [...(filhosPorPai.get(pai) || []), t.id]);
    }

    const visitados = new Set<string>();
    const resultado: Array<TarefaGantt & { nivelVisual: number; dependeDeId?: string }> = [];

    const pushRecursivo = (id: string, nivel: number) => {
      if (visitados.has(id)) return;
      const tarefa = byId.get(id);
      if (!tarefa) return;

      visitados.add(id);
      resultado.push({
        ...tarefa,
        nivelVisual: nivel,
        dependeDeId: dependenciaPrincipal.get(id),
      });

      const filhos = filhosPorPai.get(id) || [];
      for (const filhoId of filhos) {
        pushRecursivo(filhoId, nivel + 1);
      }
    };

    for (const tarefa of ordenadas) {
      if (!dependenciaPrincipal.has(tarefa.id)) {
        pushRecursivo(tarefa.id, 0);
      }
    }

    for (const tarefa of ordenadas) {
      if (!visitados.has(tarefa.id)) {
        pushRecursivo(tarefa.id, 0);
      }
    }

    return resultado;
  }, [tarefasFiltradas]);

  // Calcular datas mín/máx
  const { minDate, diasGantt, mesesAgrupados } = useMemo(() => {
    let min: Date, max: Date;

    if (dataInicio && dataFim) {
      min = new Date(dataInicio);
      max = new Date(dataFim);
    } else {
      const datas = tarefas.flatMap(t => [
        t.data_inicio ? new Date(t.data_inicio) : null,
        t.data_fim ? new Date(t.data_fim) : null,
      ]).filter(Boolean) as Date[];

      if (datas.length === 0) {
        min = new Date();
        max = new Date();
        max.setMonth(max.getMonth() + 3);
      } else {
        min = new Date(Math.min(...datas.map(d => d.getTime())));
        max = new Date(Math.max(...datas.map(d => d.getTime())));
      }
    }

    // Adicionar margem de 7 dias
    min.setDate(min.getDate() - 7);
    max.setDate(max.getDate() + 7);

    const dias = gerarDiasDoGantt(min, max);
    const meses = agruparPorMes(dias);

    return { minDate: min, diasGantt: dias, mesesAgrupados: meses };
  }, [tarefas, dataInicio, dataFim]);

  // Largura de cada dia em pixels
  const diaWidth = 28;
  const totalWidth = diasGantt.length * diaWidth;

  // Calcular posiçÍo X da linha vertical "Hoje"
  const todayOffset = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const idx = diasGantt.findIndex(d => d.data.toDateString() === hoje.toDateString());
    if (idx === -1) return null;
    return idx * diaWidth + diaWidth / 2; // Centro do dia
  }, [diasGantt, diaWidth]);

  const semanaAtualRange = useMemo(() => {
    const hoje = new Date();
    const inicioSemana = new Date(hoje);
    inicioSemana.setHours(0, 0, 0, 0);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6);

    const primeiroDia = diasGantt.findIndex((d) => {
      const atual = new Date(d.data);
      atual.setHours(0, 0, 0, 0);
      return atual >= inicioSemana;
    });
    const ultimoDia = [...diasGantt].reverse().findIndex((d) => {
      const atual = new Date(d.data);
      atual.setHours(0, 0, 0, 0);
      return atual <= fimSemana;
    });
    if (primeiroDia === -1 || ultimoDia === -1) return null;

    const ultimoIndex = diasGantt.length - 1 - ultimoDia;
    if (ultimoIndex < primeiroDia) return null;

    return {
      left: primeiroDia * diaWidth,
      width: (ultimoIndex - primeiroDia + 1) * diaWidth,
    };
  }, [diasGantt, diaWidth]);

  const iniciarResizeTimeline = useCallback((
    e: React.MouseEvent,
    tarefaId: string,
    edge: 'start' | 'end',
    dataInicio: string,
    dataFim: string,
  ) => {
    if (!onTimelineResize) return;
    e.preventDefault();
    e.stopPropagation();

    setResizingTask({
      tarefaId,
      edge,
      originalInicio: dataInicio,
      originalFim: dataFim,
      previewInicio: dataInicio,
      previewFim: dataFim,
      startX: e.clientX,
    });
  }, [onTimelineResize]);

  useEffect(() => {
    if (!resizingTask) return;

    const handleMouseMove = (ev: MouseEvent) => {
      if (!scrollContainerRef.current) return;
      const deltaPx = ev.clientX - resizingTask.startX;
      const deltaDias = Math.round(deltaPx / diaWidth);
      if (deltaDias === 0) return;

      const inicioOriginal = parseDataLocal(resizingTask.originalInicio);
      const fimOriginal = parseDataLocal(resizingTask.originalFim);

      let novoInicio = new Date(inicioOriginal);
      let novoFim = new Date(fimOriginal);

      if (resizingTask.edge === 'start') {
        novoInicio.setDate(inicioOriginal.getDate() + deltaDias);
        if (novoInicio >= novoFim) return;
      } else {
        novoFim.setDate(fimOriginal.getDate() + deltaDias);
        if (novoFim <= novoInicio) return;
      }

      setResizingTask((prev) => prev ? {
        ...prev,
        previewInicio: formatIsoLocal(novoInicio),
        previewFim: formatIsoLocal(novoFim),
      } : null);
    };

    const handleMouseUp = () => {
      if (onTimelineResize && resizingTask) {
        const mudouInicio = resizingTask.previewInicio !== resizingTask.originalInicio;
        const mudouFim = resizingTask.previewFim !== resizingTask.originalFim;
        if (mudouInicio || mudouFim) {
          onTimelineResize(resizingTask.tarefaId, resizingTask.previewInicio, resizingTask.previewFim);
        }
      }
      setResizingTask(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp, { once: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingTask, onTimelineResize, diaWidth]);

  // Ao abrir o cronograma, posiciona no contexto da semana atual
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || todayOffset === null) return;
    const margemSemana = diaWidth * 3;
    const destino = Math.max(todayOffset - infoColumnWidth - margemSemana, 0);
    container.scrollTo({ left: destino, behavior: "smooth" });
  }, [todayOffset, diaWidth, infoColumnWidth, tarefasExibicao.length]);

  // Toggle item expandido (para hierarquia)
  const toggleExpanded = (id: string) => {
    const newSet = new Set(expandedItems);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedItems(newSet);
  };

  // Calcular posiçÍo e largura da barra
  const calcularBarra = (tarefa: TarefaGantt) => {
    if (!tarefa.data_inicio || !tarefa.data_fim) {
      return { left: 0, width: diaWidth };
    }

    const inicio = new Date(tarefa.data_inicio);
    const fim = new Date(tarefa.data_fim);

    const diasDesdeInicio = Math.floor((inicio.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    const duracao = Math.max(1, Math.floor((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    return {
      left: diasDesdeInicio * diaWidth,
      width: duracao * diaWidth - 4, // -4 para margem
    };
  };

  // Exportar PDF
  const exportarPDF = (formato: 'A4' | 'A3') => {
    const win = window.open('', '_blank');
    if (!win) return;

    const pageWidth = formato === 'A4' ? '297mm' : '420mm';
    const pageHeight = formato === 'A4' ? '210mm' : '297mm';

    const tarefasHTML = tarefas.map(t => {
      const cor = getCategoriaCor(t.categoria);
      const indent = (t.nivel || 0) * 20;
      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; padding-left: ${indent + 8}px;">
            ${t.nivel && t.nivel > 0 ? '└─ ' : ''}${t.nome}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">
            <span style="background: ${cor}20; color: ${cor}; padding: 2px 8px; border-radius: 4px; font-size: 11px;">
              ${t.categoria || '-'}
            </span>
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${formatarData(t.data_inicio)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${formatarData(t.data_fim)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">
            <div style="background: #eee; border-radius: 4px; height: 8px; width: 100px;">
              <div style="background: ${cor}; height: 100%; width: ${t.progresso}%; border-radius: 4px;"></div>
            </div>
            <span style="font-size: 11px;">${t.progresso}%</span>
          </td>
        </tr>
      `;
    }).join('');

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cronograma - ${projetoNome}</title>
        <style>
          @page { size: ${pageWidth} ${pageHeight} landscape; margin: 10mm; }
          body { font-family: Arial, sans-serif; font-size: 12px; margin: 0; padding: 20px; }
          h1 { color: #F25C26; margin-bottom: 5px; }
          h2 { color: #666; font-weight: normal; margin-top: 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #F25C26; color: white; padding: 10px; text-align: left; font-size: 11px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #F25C26; padding-bottom: 10px; margin-bottom: 20px; }
          .info { color: #666; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Cronograma da Obra</h1>
            <h2>${projetoNome}</h2>
          </div>
          <div class="info">
            <p>Data de impressÍo: ${new Date().toLocaleDateString('pt-BR')}</p>
            <p>Formato: ${formato} Paisagem</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 35%;">DescriçÍo do Item</th>
              <th style="width: 15%;">Categoria</th>
              <th style="width: 12%; text-align: center;">Início</th>
              <th style="width: 12%; text-align: center;">Término</th>
              <th style="width: 20%; text-align: center;">Progresso</th>
            </tr>
          </thead>
          <tbody>
            ${tarefasHTML}
          </tbody>
        </table>
      </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  // Status icons
  const statusIcons: Record<string, React.ReactNode> = {
    pendente: <Clock className="w-3 h-3" />,
    em_andamento: <Play className="w-3 h-3" />,
    concluida: <CheckCircle2 className="w-3 h-3" />,
    atrasada: <AlertTriangle className="w-3 h-3" />,
  };

  const statusColors: Record<string, string> = {
    pendente: 'bg-gray-400',
    em_andamento: 'bg-blue-500',
    concluida: 'bg-green-500',
    atrasada: 'bg-red-500',
  };

  return (
    <div
      ref={ganttRef}
      className={`bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transition-all ${
        fullscreen ? 'fixed inset-4 z-50 m-0 rounded-xl' : ''
      }`}
    >
      {/* Overlay para tela cheia */}
      {fullscreen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setFullscreen(false)} />
      )}

      {/* Header compacto - ferramentas inline (hidden when parent provides controls) */}
      {!hideHeader && <div className={`px-3 py-2 border-b border-gray-100 flex items-center justify-between gap-2 ${fullscreen ? 'relative z-50 bg-white' : ''}`}>
        <div className="flex items-center gap-2 min-w-0">
          {editingDates ? (
            <div className="flex items-center gap-1.5">
              <DateInputBR
                value={localDataInicio}
                onChange={(val) => setLocalDataInicio(val)}
                title="Data de início"
                className="px-1.5 py-0.5 text-[11px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#F25C26] w-24"
              />
              <span className="text-gray-300 text-[10px]">→</span>
              <DateInputBR
                value={localDataFim}
                onChange={(val) => setLocalDataFim(val)}
                title="Data de término"
                className="px-1.5 py-0.5 text-[11px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#F25C26] w-24"
              />
              <button type="button" onClick={() => { if (onDateChange && localDataInicio && localDataFim) onDateChange(localDataInicio, localDataFim); setEditingDates(false); }} className="p-1 bg-green-500 text-white rounded hover:bg-green-600" title="Salvar"><Check className="w-3 h-3" /></button>
              <button type="button" onClick={() => { setLocalDataInicio(dataInicio || ''); setLocalDataFim(dataFim || ''); setEditingDates(false); }} className="p-1 bg-gray-200 text-gray-500 rounded hover:bg-gray-300" title="Cancelar"><X className="w-3 h-3" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-gray-500">
                {formatarData(dataInicio || undefined)} → {formatarData(dataFim || undefined)}
              </span>
              {onDateChange && (
                <button type="button" onClick={() => { setLocalDataInicio(dataInicio || ''); setLocalDataFim(dataFim || ''); setEditingDates(true); }} className="p-0.5 hover:bg-gray-100 rounded" title="Editar datas">
                  <Edit2 className="w-3 h-3 text-gray-300 hover:text-[#F25C26]" />
                </button>
              )}
            </div>
          )}

          <div className="hidden xl:flex items-center gap-1.5 ml-2">
            <select value={filtroTag} onChange={(e) => setFiltroTag(e.target.value)} className="h-6 px-1.5 text-[10px] border border-gray-200 rounded bg-white text-gray-600" title="Filtrar por hashtag">
              <option value="todas"># Todas</option>
              {opcoesTag.map((tag) => (<option key={tag} value={tag}>{tag}</option>))}
            </select>
            <select value={filtroFase} onChange={(e) => setFiltroFase(e.target.value)} className="h-6 px-1.5 text-[10px] border border-gray-200 rounded bg-white text-gray-600" title="Filtrar por fase">
              <option value="todas">Fase: Todas</option>
              {opcoesFase.map((fase) => (<option key={fase.key} value={fase.key}>{fase.label}</option>))}
            </select>
          </div>

          <div className="hidden lg:flex items-center gap-2 ml-2 text-[9px] text-gray-400">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-gray-400" />Pendente</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" />Andamento</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />Concluída</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Atrasada</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="relative group">
            <Button variant="outline" size="sm" className="border-gray-200 h-6 text-[10px] px-2">
              <Download className="w-3 h-3 mr-1" />
              PDF
            </Button>
            <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <button type="button" onClick={() => exportarPDF('A4')} className="w-full px-3 py-1.5 text-left text-[11px] hover:bg-gray-50 flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-gray-400" />A4 Paisagem
              </button>
              <button type="button" onClick={() => exportarPDF('A3')} className="w-full px-3 py-1.5 text-left text-[11px] hover:bg-gray-50 flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-gray-400" />A3 Paisagem
              </button>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setFullscreen(!fullscreen)} className="border-gray-200 h-6 w-6 p-0" title={fullscreen ? "Minimizar" : "Tela Cheia"}>
            {fullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </Button>
        </div>
      </div>}

      {/* Container do Gantt com scroll horizontal */}
      <div ref={scrollContainerRef} className={`overflow-auto ${fullscreen ? 'max-h-[calc(100vh-140px)]' : 'max-h-[calc(100vh-300px)] min-h-[500px]'}`}>
        <div style={{ minWidth: `${totalWidth + infoColumnWidth}px` }}>
          {/* Cabeçalho do Timeline */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
            {/* Linha 1: Mês/Ano */}
            <div className="flex">
              <div
                className="sticky left-0 z-30 flex-shrink-0 bg-gray-50 px-2 py-px border-r border-gray-200 flex items-center"
                style={{ width: `${infoColumnWidth}px` }}
              >
                <span className="text-[10px] text-gray-500">Item</span>
              </div>
              <div className="flex">
                {mesesAgrupados.map((mes, idx) => (
                  <div
                    key={idx}
                    className="bg-[#2B4580] text-white text-center text-[9px] leading-none border-r border-[#1e3460] flex items-center justify-center"
                    style={{ width: `${mes.dias.length * diaWidth}px` }}
                  >
                    {mes.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Linha 2: Número do dia */}
            <div className="flex">
              <div
                className="sticky left-0 z-30 flex-shrink-0 bg-gray-50 px-2 py-0.5 border-r border-gray-200"
                style={{ width: `${infoColumnWidth}px` }}
              >
              </div>
              <div className="flex">
                {diasGantt.map((dia, idx) => {
                  const isWeekend = dia.diaSemana === 'D' || dia.diaSemana === 'S';
                  const isToday = dia.data.toDateString() === new Date().toDateString();
                  return (
                    <div
                      key={idx}
                      className={`text-center py-px text-[9px] border-r border-gray-100 ${
                        isWeekend ? 'bg-gray-100 text-gray-300' : 'bg-gray-50 text-gray-500'
                      } ${isToday ? 'bg-[#2B4580] text-white' : ''}`}
                      style={{ width: `${diaWidth}px` }}
                      title={`${dia.dia}/${dia.mes}/${dia.ano}`}
                    >
                      {dia.dia}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Linha 3: Dias da semana (S T Q Q S S D) */}
            <div className="flex">
              <div
                className="sticky left-0 z-30 flex-shrink-0 bg-gray-50 px-2 py-0.5 border-r border-gray-200"
                style={{ width: `${infoColumnWidth}px` }}
              >
              </div>
              <div className="flex">
                {diasGantt.map((dia, idx) => {
                  const isWeekend = dia.diaSemana === 'D' || dia.diaSemana === 'S';
                  const isToday = dia.data.toDateString() === new Date().toDateString();
                  return (
                    <div
                      key={idx}
                      className={`text-center py-px text-[8px] border-r border-gray-100 ${
                        isWeekend ? 'bg-gray-50 text-gray-300' : 'bg-white text-gray-400'
                      } ${isToday ? 'bg-blue-50 text-[#2B4580]' : ''}`}
                      style={{ width: `${diaWidth}px` }}
                      title={`${dia.dia}/${dia.mes}/${dia.ano}`}
                    >
                      {dia.diaSemana}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Linhas das tarefas */}
          <div className="divide-y divide-gray-100">
            {tarefasExibicao.map((tarefa, index) => {
              const tarefaPreview =
                resizingTask?.tarefaId === tarefa.id
                  ? {
                      ...tarefa,
                      data_inicio: resizingTask.previewInicio,
                      data_fim: resizingTask.previewFim,
                    }
                  : tarefa;
              const barra = calcularBarra(tarefaPreview);
              const catMatch = matchCategoria(tarefa.nome, tarefa.categoria);
              const cor = catMatch.cor;
              const isConcluida = tarefa.status === 'concluida';
              const nivel = (tarefa as any).nivelVisual || 0;
              const hasChildren = tarefasExibicao.some((t: any) => t.dependeDeId === tarefa.id);
              const isExpanded = expandedItems.has(tarefa.id);
              const isChild = nivel > 0;
              const dependeDeId = (tarefa as any).dependeDeId as string | undefined;

              const isDragging = draggedTask === tarefa.id;
              const isDropTarget = dropTarget === tarefa.id && draggedTask !== tarefa.id;

              const isDropBeforeHere = dropBefore === tarefa.id && draggedTask !== tarefa.id;

              return (
                <React.Fragment key={tarefa.id}>
                  {/* Drop zone BEFORE this task */}
                  <div
                    className={`transition-all duration-150 ${
                      draggedTask && draggedTask !== tarefa.id
                        ? `h-5 flex items-center ${isDropBeforeHere ? 'bg-orange-100' : 'bg-transparent hover:bg-orange-50'}`
                        : 'h-0'
                    }`}
                    onDragOver={(e) => {
                      if (!onReorder || !draggedTask || draggedTask === tarefa.id) return;
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      setDropBefore(tarefa.id);
                      setDropTarget(null);
                    }}
                    onDragLeave={() => setDropBefore(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (!onReorder || !draggedTask || draggedTask === tarefa.id) return;
                      onReorder(draggedTask, tarefa.id, "before");
                      setDraggedTask(null);
                      setDropTarget(null);
                      setDropBefore(null);
                    }}
                  >
                    {isDropBeforeHere && (
                      <div className="w-full h-0.5 bg-primary rounded-full mx-2 shadow-sm" />
                    )}
                  </div>
                  {/* Task row - draggable */}
                  <div
                    draggable={!!(onDependencyCreate || onReorder)}
                    onDragStart={(e) => {
                      if (!(onDependencyCreate || onReorder)) return;
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', tarefa.id);
                      setDraggedTask(tarefa.id);
                    }}
                    onDragEnd={() => {
                      setDraggedTask(null);
                      setDropTarget(null);
                      setDropBefore(null);
                      setDraggedTimelineTask(null);
                    }}
                    onDragOver={(e) => {
                      if (!draggedTask || draggedTask === tarefa.id) return;
                      e.preventDefault();
                      e.dataTransfer.dropEffect = e.altKey ? 'link' : 'move';
                      setDropTarget(tarefa.id);
                      setDropBefore(null);
                    }}
                    onDragLeave={() => {
                      setDropTarget(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (!draggedTask || draggedTask === tarefa.id) return;
                      // Alt + drop => vínculo/dependência. Drop normal => reordenaçÍo.
                      if (e.altKey && onDependencyCreate) {
                        onDependencyCreate(draggedTask, tarefa.id);
                      } else if (onReorder) {
                        onReorder(draggedTask, tarefa.id, "after");
                      }
                      setDraggedTask(null);
                      setDropTarget(null);
                      setDropBefore(null);
                    }}
                    className={`flex hover:bg-gray-50/80 transition-all group border-b border-gray-50 ${
                      isConcluida ? 'bg-green-50/30 opacity-70' : ''
                    } ${selectedTask === tarefa.id ? 'bg-orange-50/50' : ''
                    } ${isDragging ? 'opacity-30 scale-[0.97] bg-blue-50 ring-1 ring-blue-200' : ''} ${
                      isDropTarget ? 'bg-orange-50 ring-1 ring-[#F25C26]/40 ring-inset' : ''
                    } ${onDependencyCreate || onReorder ? 'cursor-grab active:cursor-grabbing' : ''}`}
                    onClick={() => setSelectedTask(tarefa.id)}
                  >
                    {/* Coluna de informações */}
                    <div
                      className="sticky left-0 z-20 flex-shrink-0 px-2 py-1.5 border-r border-gray-100 flex items-center gap-1.5 bg-white group-hover:bg-gray-50/80 relative"
                      style={{ width: `${infoColumnWidth}px`, paddingLeft: `${8 + nivel * 16}px` }}
                    >
                    {/* Drag handle */}
                    {(onDependencyCreate || onReorder) && (
                      <span title="Arraste para reordenar. Alt+arrastar para vínculo.">
                        <GripVertical
                          className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${
                            isDragging
                              ? 'text-orange-500'
                              : isDropTarget
                                ? 'text-orange-400'
                                : 'text-gray-200 group-hover:text-gray-400'
                          }`}
                        />
                      </span>
                    )}

                    {isChild && (
                      <ArrowDownRight className="w-3 h-3 text-blue-400 flex-shrink-0" />
                    )}

                    {hasChildren && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleExpanded(tarefa.id); }}
                        className="p-0.5 hover:bg-gray-100 rounded"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-gray-400" />
                        )}
                      </button>
                    )}

                    {/* Status */}
                    <div
                      className={`w-4 h-4 rounded-full ${statusColors[tarefa.status]} flex items-center justify-center text-white flex-shrink-0`}
                      title={tarefa.status}
                    >
                      {statusIcons[tarefa.status]}
                    </div>

                    {/* Bolinha da categoria pricelist */}
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 border border-white shadow-sm"
                      style={{ backgroundColor: catMatch.cor }}
                      title={catMatch.nome}
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[11px] leading-tight line-clamp-2 ${isConcluida ? 'text-gray-400 line-through' : 'text-gray-900'}`} title={tarefa.nome}>
                          {tarefa.nome.replace(/@\S+/g, '').replace(/\s{2,}/g, ' ').trim() || tarefa.nome}
                        </span>
                        {tarefa.dependencias && tarefa.dependencias.length > 0 && (
                          <button
                            type="button"
                            className="shrink-0 p-0.5 hover:bg-red-50 rounded transition-colors"
                            title={`Clique para desvincular (depende de ${tarefa.dependencias.length} tarefa(s))`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onDependencyRemove) {
                                tarefa.dependencias!.forEach(depId => onDependencyRemove(tarefa.id, depId));
                              }
                            }}
                          >
                            <Link2 className="w-3 h-3 text-blue-400 hover:text-red-500 transition-colors" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 overflow-hidden">
                        {dependeDeId && (
                          <span className="text-[9px] text-blue-500 flex items-center gap-0.5 shrink-0">
                            <ArrowDownRight className="w-2.5 h-2.5" />
                            Vinculada
                          </span>
                        )}
                        {catMatch.id && (
                          <span
                            className="px-1 py-px rounded text-[8px]"
                            style={{ backgroundColor: `${catMatch.cor}18`, color: catMatch.cor }}
                            title={catMatch.nome}
                          >
                            #{catMatch.nome}
                          </span>
                        )}
                        <span className="text-[9px] text-gray-300 ml-auto shrink-0">
                          {formatarData(tarefa.data_inicio)}
                        </span>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded px-0.5 z-10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowProgressSlider(tarefa.id);
                          setLocalProgresso(tarefa.progresso);
                        }}
                        className="p-1 hover:bg-orange-100 rounded"
                        title="Progresso"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-orange-600" />
                      </button>
                      {onEdit && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onEdit(tarefa); }}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onDelete(tarefa); }}
                          className="p-1 hover:bg-red-100 rounded"
                          title="Excluir tarefa"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        </button>
                      )}
                    </div>
                    </div>

                    {/* Coluna do Gantt */}
                    <div className="flex-1 relative py-1.5">
                    {/* Destaque da semana atual */}
                    {semanaAtualRange && (
                      <div
                        className="absolute top-0 bottom-0 bg-blue-100/45 border-l border-r border-blue-300/55 z-[1] pointer-events-none"
                        style={{ left: `${semanaAtualRange.left}px`, width: `${semanaAtualRange.width}px` }}
                      />
                    )}
                    {/* Grid de fundo - Clicável para comentários */}
                    <div className="absolute inset-0 flex z-[2]">
                      {diasGantt.map((dia, idx) => {
                        const isWeekend = dia.diaSemana === 'D' || dia.diaSemana === 'S';
                        const isToday = dia.data.toDateString() === new Date().toDateString();
                        const dataISO = dia.data.toISOString().split('T')[0];
                        return (
                          <div
                            key={idx}
                            className={`border-r border-gray-50 cursor-pointer hover:bg-[#2B4580]/10 transition-colors ${isWeekend ? 'bg-gray-50/50' : ''} ${isToday ? 'bg-blue-100/55' : ''}`}
                            style={{ width: `${diaWidth}px` }}
                            onDragOver={(e) => {
                              if (!draggedTimelineTask || !onTimelineMove) return;
                              e.preventDefault();
                            }}
                            onDrop={(e) => {
                              if (!draggedTimelineTask || !onTimelineMove) return;
                              e.preventDefault();
                              onTimelineMove(draggedTimelineTask, dataISO);
                              setDraggedTimelineTask(null);
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onTimelineComment) {
                                onTimelineComment(tarefa.id, dataISO);
                              }
                            }}
                            title={`Clique para adicionar comentário em ${dia.dia}/${dia.mes}`}
                          />
                        );
                      })}
                    </div>

                    {/* Linha vertical "Hoje" */}
                    {todayOffset !== null && (
                      <div
                        className="absolute top-0 bottom-0 pointer-events-none z-[5]"
                        style={{
                          left: `${todayOffset}px`,
                          width: '2px',
                          background: '#2B4580',
                          opacity: 0.75,
                        }}
                      />
                    )}

                    {/* Barra da tarefa */}
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: barra.width, opacity: isConcluida ? 0.45 : 1 }}
                      transition={{ duration: 0.3, delay: index * 0.02 }}
                      className="absolute top-1/2 -translate-y-1/2 h-5 rounded-md cursor-pointer overflow-hidden shadow-sm z-[6]"
                      style={{
                        left: `${barra.left}px`,
                        backgroundColor: `${cor}30`,
                        border: `1.5px solid ${cor}`,
                      }}
                      draggable={!!onTimelineMove}
                      onDragStart={(e) => {
                        if (!onTimelineMove) return;
                        e.stopPropagation();
                        setDraggedTimelineTask(tarefa.id);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowProgressSlider(tarefa.id);
                        setLocalProgresso(tarefa.progresso);
                      }}
                    >
                      {onTimelineResize && tarefaPreview.data_inicio && tarefaPreview.data_fim && (
                        <div
                          className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-20 hover:bg-black/10 rounded-l-md"
                          onMouseDown={(e) => iniciarResizeTimeline(e, tarefa.id, 'start', tarefaPreview.data_inicio!, tarefaPreview.data_fim!)}
                          title="Ajustar início da atividade"
                        />
                      )}

                      {/* Progresso interno */}
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${tarefa.progresso}%` }}
                        className="h-full rounded-l-md"
                        style={{ backgroundColor: cor }}
                      />
                      {/* Label */}
                      <span
                        className="absolute inset-0 flex items-center justify-center text-[10px] font-normal"
                        style={{ color: tarefa.progresso >= 50 ? '#ffffff' : cor }}
                      >
                        {tarefa.progresso}%
                      </span>

                      {onTimelineResize && tarefaPreview.data_inicio && tarefaPreview.data_fim && (
                        <div
                          className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize z-20 hover:bg-black/10 rounded-r-md"
                          onMouseDown={(e) => iniciarResizeTimeline(e, tarefa.id, 'end', tarefaPreview.data_inicio!, tarefaPreview.data_fim!)}
                          title="Ajustar término da atividade"
                        />
                      )}
                    </motion.div>

                    {/* Slider de progresso inline */}
                    {showProgressSlider === tarefa.id && (
                      <div className="absolute top-full left-4 mt-1 z-20 bg-white rounded-lg shadow-xl border border-gray-200 p-3 flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={localProgresso}
                          onChange={(e) => setLocalProgresso(parseInt(e.target.value))}
                          className="w-24 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#F25C26]"
                        />
                        <span className="text-xs font-normal text-[#F25C26] w-8">{localProgresso}%</span>
                        <button
                          type="button"
                          onClick={() => {
                            onProgressoChange?.(tarefa.id, localProgresso);
                            setShowProgressSlider(null);
                          }}
                          className="p-1 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowProgressSlider(null)}
                          className="p-1 bg-gray-300 text-gray-600 rounded hover:bg-gray-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          {tarefasExibicao.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              Nenhuma tarefa encontrada para os filtros selecionados
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default GanttChart;

