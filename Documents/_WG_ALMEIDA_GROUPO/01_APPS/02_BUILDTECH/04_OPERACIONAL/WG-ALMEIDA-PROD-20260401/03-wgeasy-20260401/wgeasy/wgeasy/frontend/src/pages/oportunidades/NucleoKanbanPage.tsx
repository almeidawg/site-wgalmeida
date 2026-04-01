import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Plus, Edit2, Trash2, ArrowLeft, LayoutDashboard, Columns } from "lucide-react";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import { OportunidadeModal } from "@/components/oportunidades/OportunidadeModal";
import { CORES_NUCLEOS, type Nucleo } from "@/constants/oportunidades";
import OportunidadeCard, {
  OportunidadeClienteUI,
  OportunidadeUI,
} from "@/components/oportunidades/OportunidadeCard";
import type { OportunidadeChecklistResumo } from "@/types/oportunidadesChecklist";
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";
import { useToast } from "@/components/ui/use-toast";

type Coluna = {
  id: string;
  titulo: string;
  ordem: number;
  cor: string;
};

type PosicaoRow = {
  oportunidade_id: string;
  coluna_id: string;
  ordem: number;
};

type ClienteRow = {
  id: string;
  nome: string | null;
  avatar_url: string | null;
  foto_url: string | null;
  avatar: string | null;
};

type ChecklistRow = OportunidadeChecklistResumo & {
  oportunidade_id: string;
};

type OportunidadeRow = {
  id: string;
  titulo: string | null;
  estagio: string | null;
  valor_estimado: number | null;
  data_previsao_fechamento?: string | null;
  origem?: string | null;
  descricao?: string | null;
  observacoes?: string | null;
  cliente_id?: string | null;
  data_fechamento?: string | null;
  data_inicio_projeto?: string | null;
  prazo_briefing?: string | null;
  prazo_anteprojeto?: string | null;
  prazo_projeto_executivo?: string | null;
  data_liberacao_obra?: string | null;
  data_inicio_obra?: string | null;
  prazo_obra_dias_uteis?: number | null;
  prazo_entrega?: string | null;
  data_medicao?: string | null;
  prazo_executivo?: string | null;
  data_assinatura_executivo?: string | null;
};

type Oportunidade = OportunidadeUI & {
  posicao?: {
    coluna_id: string;
    ordem: number;
  };
  checklist_resumo?: OportunidadeChecklistResumo | null;
};

type ModoVisual = "moderno" | "classico";
const VISUAL_STORAGE_KEY = "wg-kanban-modo-visual";

// Detectar se é mobile (largura < 768px)
function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768;
}

export default function NucleoKanbanPage() {
  const { nucleo } = useParams<{ nucleo: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Detectar núcleo da URL (funciona com /oportunidades/kanban/:nucleo e /:nucleo/kanban)
  let nucleoDetectado = nucleo;
  if (!nucleoDetectado) {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    if (pathSegments[0] === 'arquitetura' || pathSegments[0] === 'engenharia' || pathSegments[0] === 'marcenaria') {
      nucleoDetectado = pathSegments[0];
    }
  }

  // Normalizar nome do núcleo (primeira letra maiúscula)
  const slug = nucleoDetectado ?? "arquitetura";
  const nucleoNormalizado = (slug.charAt(0).toUpperCase() + slug.slice(1)) as Nucleo;

  const [colunas, setColunas] = useState<Coluna[]>([]);
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecionada, setSelecionada] = useState<Oportunidade | null>(null);
  const [editandoColunaId, setEditandoColunaId] = useState<string | null>(null);
  const [modoVisual, setModoVisual] = useState<ModoVisual>(() => {
    if (typeof window === "undefined") return "moderno";
    // No mobile, sempre iniciar com modo clássico (lista)
    if (isMobileDevice()) return "classico";
    // No desktop, respeitar a preferência salva
    const stored = window.localStorage.getItem(VISUAL_STORAGE_KEY);
    return stored === "classico" ? "classico" : "moderno";
  });

  const cores = CORES_NUCLEOS[nucleoNormalizado];


  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(VISUAL_STORAGE_KEY, modoVisual);
    }
  }, [modoVisual]);

  // Carregar colunas do núcleo
  const carregarColunas = useCallback(async () => {
    const { data, error } = await supabase
      .from("nucleos_colunas")
      .select("*")
      .eq("nucleo", nucleoNormalizado)
      .order("ordem", { ascending: true });

    if (error) {
      console.error("Erro ao carregar colunas:", error);
      return;
    }

    setColunas(data || []);
  }, [nucleoNormalizado]);

  // Carregar oportunidades posicionadas neste núcleo
  const carregarOportunidades = useCallback(async () => {
    setLoading(true);

    // Query 1: Buscar posições das oportunidades neste núcleo
    const { data: posicoesRaw, error: posicoesError } = await supabase
      .from("nucleos_oportunidades_posicoes")
      .select("oportunidade_id, coluna_id, ordem")
      .eq("nucleo", nucleoNormalizado);

    const posicoesData = (posicoesRaw || []) as PosicaoRow[];

    if (posicoesError) {
      console.error("Erro ao carregar posições:", posicoesError);
      setLoading(false);
      return;
    }

    if (!posicoesData || posicoesData.length === 0) {
      setOportunidades([]);
      setLoading(false);
      return;
    }

    const oportIds = posicoesData.map((p) => p.oportunidade_id);

    // Query 2: Buscar dados das oportunidades
    const { data: oportRaw, error: oportError } = await supabase
      .from("oportunidades")
      .select("*")
      .in("id", oportIds);

    const oportData = (oportRaw || []) as OportunidadeRow[];

    if (oportError) {
      console.error("Erro ao carregar oportunidades:", oportError);
      setLoading(false);
      return;
    }

    // Query 3: Buscar clientes com avatares
    const clienteIds = oportData
      .map((op) => op.cliente_id)
      .filter((id): id is string => Boolean(id));

    let clientesMap: Record<string, OportunidadeClienteUI> = {};
    let checklistMap: Record<string, OportunidadeChecklistResumo> = {};

    if (clienteIds.length > 0) {
      const { data: clientesRaw } = await supabase
        .from("pessoas")
        .select("id, nome, email, telefone, avatar_url, foto_url, avatar")
        .in("id", clienteIds);

      const clientesData = (clientesRaw || []) as ClienteRow[];

      if (clientesData.length > 0) {
        clientesMap = clientesData.reduce((acc: Record<string, OportunidadeClienteUI>, cliente) => {
          acc[cliente.id] = {
            id: cliente.id,
            nome: cliente.nome || "Cliente sem nome",
            avatar_url: cliente.avatar_url,
            foto_url: cliente.foto_url,
            avatar: cliente.avatar,
          };
          return acc;
        }, {} as Record<string, OportunidadeClienteUI>);
      }
    }

    // Resumo de checklist por oportunidade
    if (oportIds.length > 0) {
      const { data: checklistRaw } = await supabase
        .from("v_oportunidades_checklist_resumo")
        .select(
          "oportunidade_id, total_checklist, checklist_concluidos, percentual_concluido, obrigatorios_pendentes"
        )
        .in("oportunidade_id", oportIds);

      const checklistData = (checklistRaw || []) as ChecklistRow[];

      if (checklistData.length > 0) {
        checklistMap = checklistData.reduce((acc: Record<string, OportunidadeChecklistResumo>, item) => {
          acc[item.oportunidade_id] = item;
          return acc;
        }, {} as Record<string, OportunidadeChecklistResumo>);
      }
    }

    // Combinar dados
    const posicoesMap = posicoesData.reduce((acc: Record<string, PosicaoRow>, pos) => {
      acc[pos.oportunidade_id] = {
        oportunidade_id: pos.oportunidade_id,
        coluna_id: pos.coluna_id,
        ordem: pos.ordem,
      };
      return acc;
    }, {} as Record<string, PosicaoRow>);

    const oportunidadesComDados = oportData.map((op) => ({
      id: op.id,
      titulo: op.titulo,
      estagio: op.estagio,
      valor_estimado: op.valor_estimado,
      previsao_fechamento: op.data_previsao_fechamento,
      origem: op.origem,
      descricao: op.descricao,
      observacoes: op.observacoes,
      cliente: op.cliente_id ? clientesMap[op.cliente_id] : null,
      nucleos: [
        {
          nucleo: nucleoNormalizado,
          valor: op.valor_estimado ?? null,
        },
      ],
      data_fechamento: op.data_fechamento || op.data_previsao_fechamento,
      data_inicio_projeto: op.data_inicio_projeto,
      prazo_briefing: op.prazo_briefing,
      prazo_anteprojeto: op.prazo_anteprojeto,
      prazo_projeto_executivo: op.prazo_projeto_executivo,
      data_liberacao_obra: op.data_liberacao_obra,
      data_inicio_obra: op.data_inicio_obra,
      prazo_obra_dias_uteis: op.prazo_obra_dias_uteis,
      prazo_entrega: op.prazo_entrega,
      data_medicao: op.data_medicao,
      prazo_executivo: op.prazo_executivo,
      data_assinatura_executivo: op.data_assinatura_executivo,
      posicao: posicoesMap[op.id],
      checklist_resumo: checklistMap[op.id] || null,
    }));

    setOportunidades(oportunidadesComDados as Oportunidade[]);
    setLoading(false);
  }, [nucleoNormalizado]);

  useEffect(() => {
    carregarColunas();
    carregarOportunidades();
  }, [carregarColunas, carregarOportunidades]);

  // Criar nova coluna
  async function criarColuna() {
    const novaOrdem = colunas.length;
    const { data, error } = await supabase
      .from("nucleos_colunas")
      .insert({
        nucleo: nucleoNormalizado,
        titulo: `Nova Coluna ${novaOrdem + 1}`,
        ordem: novaOrdem,
        cor: cores.secondary,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar coluna:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao criar coluna: " + error.message });
      return;
    }

    setColunas([...colunas, data]);
  }

  // Atualizar título da coluna
  async function atualizarTituloColuna(colunaId: string, novoTitulo: string) {
    if (!novoTitulo.trim()) {
      toast({ variant: "destructive", title: "Campo obrigatório", description: "O título nÍo pode estar vazio" });
      return;
    }

    const { error } = await supabase
      .from("nucleos_colunas")
      .update({ titulo: novoTitulo })
      .eq("id", colunaId);

    if (error) {
      console.error("Erro ao atualizar coluna:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao atualizar coluna: " + error.message });
      return;
    }

    setColunas((prev) =>
      prev.map((col) =>
        col.id === colunaId ? { ...col, titulo: novoTitulo } : col
      )
    );
    setEditandoColunaId(null);
  }

  // Deletar coluna
  async function deletarColuna(colunaId: string) {
    // Verificar se há oportunidades na coluna
    const oportNaColuna = oportunidades.filter(
      (op) => op.posicao?.coluna_id === colunaId
    );

    if (oportNaColuna.length > 0) {
      toast({ variant: "destructive", title: "Erro", description: `NÍo é possível deletar esta coluna pois há ${oportNaColuna.length} oportunidade(s) nela. Mova as oportunidades para outra coluna antes de deletar.` });
      return;
    }

    if (!confirm("Tem certeza que deseja deletar esta coluna?")) {
      return;
    }

    const { error } = await supabase
      .from("nucleos_colunas")
      .delete()
      .eq("id", colunaId);

    if (error) {
      console.error("Erro ao deletar coluna:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao deletar coluna: " + error.message });
      return;
    }

    setColunas((prev) => prev.filter((col) => col.id !== colunaId));
  }

  async function deletarOportunidade(oportunidadeId: string) {
    try {
      // IMPORTANTE: Deletar apenas a posiçÍo no kanban deste núcleo específico
      // A oportunidade continua existindo em outros núcleos
      const { error } = await supabase
        .from("nucleos_oportunidades_posicoes")
        .delete()
        .eq("oportunidade_id", oportunidadeId)
        .eq("nucleo", nucleoNormalizado);

      if (error) {
        console.error("Erro ao remover oportunidade do núcleo:", error);
        toast({ variant: "destructive", title: "Erro", description: "Erro ao remover oportunidade: " + error.message });
        return;
      }

      // Atualizar estado local - remove apenas da visualizaçÍo deste núcleo
      setOportunidades((prev) => prev.filter((op) => op.id !== oportunidadeId));
      setSelecionada(null);
    } catch (error) {
      console.error("Erro ao remover oportunidade:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao remover oportunidade do núcleo" });
    }
  }

  // Drag and Drop
  async function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    const oportunidadeId = draggableId;
    const novaColunaId = destination.droppableId;

    // Atualizar no banco
    const { error } = await supabase
      .from("nucleos_oportunidades_posicoes")
      .update({
        coluna_id: novaColunaId,
        ordem: destination.index,
      })
      .eq("oportunidade_id", oportunidadeId)
      .eq("nucleo", nucleoNormalizado);

    if (error) {
      console.error("Erro ao mover card:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao mover card: " + error.message });
      return;
    }

    // Atualizar localmente
    setOportunidades((prev) =>
      prev.map((op) =>
        op.id === oportunidadeId
          ? {
              ...op,
              posicao: { coluna_id: novaColunaId, ordem: destination.index },
            }
          : op
      )
    );
  }

  // Obter oportunidades de uma coluna
  function getOportunidadesDaColuna(colunaId: string): Oportunidade[] {
    return oportunidades
      .filter((op) => op.posicao?.coluna_id === colunaId)
      .sort((a, b) => (a.posicao?.ordem || 0) - (b.posicao?.ordem || 0));
  }

  const renderOportunidadeCard = (
    oport: Oportunidade,
    index: number
  ) => (
    <Draggable key={oport.id} draggableId={oport.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={snapshot.isDragging ? "ring-2 ring-[#C9A86A] shadow-2xl rounded-lg" : ""}
        >
          <OportunidadeCard
            mode="kanban"
            oportunidade={oport as OportunidadeUI}
            nucleo={nucleoNormalizado.toLowerCase() as "arquitetura" | "engenharia" | "marcenaria"}
            showValue={false}
            onClick={() => setSelecionada(oport)}
            onEdit={() => navigate(`/oportunidades/editar/${oport.id}`)}
            onDelete={() => deletarOportunidade(oport.id)}
          />
        </div>
      )}
    </Draggable>
  );

  const renderColuna = (coluna: Coluna, variant: ModoVisual) => {
    const oportsDaColuna = getOportunidadesDaColuna(coluna.id);
    const isModerno = variant === "moderno";

    const containerClass = isModerno
      ? "flex flex-col rounded-lg shadow-sm h-[calc(100vh-160px)] flex-1 min-w-[220px]"
      : "flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm h-[calc(100vh-160px)] flex-1 min-w-[220px]";
    const headerClass = isModerno
      ? "p-3 flex items-center justify-between border-b border-gray-300"
      : "px-4 py-3 flex items-center justify-between border-b border-gray-100 bg-gray-50 rounded-t-2xl";
    const baseDroppableClass = isModerno
      ? "flex-1 p-3 space-y-3 overflow-y-auto overflow-x-hidden"
      : "flex-1 px-4 py-4 space-y-3 bg-white overflow-y-auto overflow-x-hidden rounded-b-2xl";
    const activeDroppableClass = isModerno
      ? "bg-gray-100"
      : "ring-1 ring-gray-200 bg-gray-50";

    return (
      <div
        key={coluna.id}
        className={containerClass}
        style={isModerno ? { backgroundColor: coluna.cor } : undefined}
      >
        <div className={headerClass}>
          <div className="flex items-center gap-2">
            {!isModerno && (
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: coluna.cor }}
              />
            )}
            {editandoColunaId === coluna.id ? (
              <input
                type="text"
                className="flex-1 px-2 py-1 border rounded text-sm"
                defaultValue={coluna.titulo}
                autoFocus
                onBlur={(e) =>
                  atualizarTituloColuna(coluna.id, e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    atualizarTituloColuna(coluna.id, e.currentTarget.value);
                  } else if (e.key === "Escape") {
                    setEditandoColunaId(null);
                  }
                }}
              />
            ) : (
              <h3
                className={`${TYPOGRAPHY.sectionTitle} uppercase tracking-wide ${
                  isModerno ? "text-gray-800" : "text-gray-900"
                }`}
              >
                {coluna.titulo}
                <span className={`ml-2 ${TYPOGRAPHY.cardSubtitle} normal-case`}>
                  ({oportsDaColuna.length})
                </span>
              </h3>
            )}
          </div>

          <div className="flex gap-1">
            <button
              onClick={() => {
                setEditandoColunaId(coluna.id);
              }}
              className={`p-1 rounded ${
                isModerno ? "hover:bg-gray-200" : "hover:bg-gray-200"
              }`}
              title="Editar t﹀ulo"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => deletarColuna(coluna.id)}
              className="p-1 hover:bg-red-100 text-red-600 rounded"
              title="Deletar coluna"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <Droppable droppableId={coluna.id}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`${baseDroppableClass} ${
                snapshot.isDraggingOver ? activeDroppableClass : ""
              }`}
              style={{ minHeight: "220px" }}
            >
              {oportsDaColuna.map((oport, index) =>
                renderOportunidadeCard(oport, index)
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-[16px]">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div
        className="p-3 sm:p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shadow-md"
        style={{ backgroundColor: cores.primary }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/oportunidades")}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
          >
            <ArrowLeft size={24} color="white" />
          </button>
          <h1 className={`${TYPOGRAPHY.pageTitle} text-white`}>
            Kanban - {nucleoNormalizado}
          </h1>
        </div>

        <div className={LAYOUT.pageActions}>
          <div className="flex items-center gap-2 sm:gap-3 text-white/80">
            <span className={TYPOGRAPHY.overline}>
              Visual
            </span>
            <div className="flex rounded-full bg-white/20 p-1 text-xs sm:text-sm font-normal">
              <button
                type="button"
                onClick={() => setModoVisual("moderno")}
                aria-pressed={modoVisual === "moderno"}
                className={`flex items-center gap-1 rounded-full px-3 py-1 transition ${
                  modoVisual === "moderno"
                    ? "bg-white text-gray-900 shadow"
                    : "text-white/80"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Imersivo
              </button>
              <button
                type="button"
                onClick={() => setModoVisual("classico")}
                aria-pressed={modoVisual === "classico"}
                className={`flex items-center gap-1 rounded-full px-3 py-1 transition ${
                  modoVisual === "classico"
                    ? "bg-white text-gray-900 shadow"
                    : "text-white/80"
                }`}
              >
                <Columns className="w-4 h-4" />
                Classico
              </button>
            </div>
          </div>
          <button
            onClick={criarColuna}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition-colors ${TYPOGRAPHY.cardTitle}`}
          >
            <Plus size={20} />
            Nova Coluna
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        {modoVisual === "moderno" ? (
          <div className="flex-1 overflow-x-auto p-4">
            <div className="flex gap-4 h-full">
              {colunas.map((coluna) => renderColuna(coluna, "moderno"))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto p-4">
            <div className="flex gap-4 pb-4">
              {colunas.map((coluna) => renderColuna(coluna, "classico"))}
            </div>
          </div>
        )}
      </DragDropContext>

      {/* Modal de Detalhes */}
      {selecionada && (
        <OportunidadeModal
          oportunidade={selecionada}
          onClose={() => setSelecionada(null)}
          onDelete={deletarOportunidade}
        />
      )}
    </div>
  );
}


