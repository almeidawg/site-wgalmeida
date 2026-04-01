import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Edit2, Trash2, LayoutGrid, Kanban, Plus } from "lucide-react";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import { OportunidadeModal } from "@/components/oportunidades/OportunidadeModal";
import { ESTAGIOS, type Estagio, CORES_NUCLEOS, type Nucleo } from "@/constants/oportunidades";
import { formatarData } from "@/utils/formatadores";
import Avatar from "@/components/common/Avatar";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { criarContrato } from "@/lib/contratosApi";
import type { OportunidadeChecklistResumo } from "@/types/oportunidadesChecklist";
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";
import { useToast } from "@/components/ui/use-toast";
import EmptyState from "@/components/ui/EmptyState";

// Formatar nome: Primeiro nome + último sobrenome
function formatarNomeAbreviado(nomeCompleto: string | null | undefined): string {
  if (!nomeCompleto) return "Cliente";
  const partes = nomeCompleto.trim().split(/\s+/);
  if (partes.length === 1) return partes[0];
  const primeiro = partes[0];
  const ultimo = partes[partes.length - 1];
  // Capitalizar corretamente
  const capitalizar = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  return `${capitalizar(primeiro)} ${capitalizar(ultimo)}`;
}

type Oportunidade = {
  id: string;
  titulo: string;
  estagio: Estagio;
  valor: number | null; // Campo correto do banco de dados
  valor_estimado?: number | null; // Alias para compatibilidade
  previsao_fechamento: string | null;
  data_fechamento_prevista?: string | null; // Campo correto do banco
  origem: string | null;
  descricao: string | null;
  observacoes: string | null;
  // ─── Liz Integration 2026-03-28 ───
  pipeline_status?: string | null;
  pipeline_updated?: string | null;
  briefing_texto?: string | null;
  projeto_path?: string | null;
  projeto_tipo?: string | null;
  motivo_perda?: string | null;
  // ──────────────────────────────────
  clientes?: {
    id: string;
    nome: string;
    email?: string | null;
    telefone?: string | null;
    avatar_url?: string | null;
    foto_url?: string | null;
    avatar?: string | null;
  } | null;
  nucleos?: Array<{ nucleo: Nucleo; valor: number | null }>;
  checklist_resumo?: OportunidadeChecklistResumo | null;
};

type OportunidadeRow = {
  id: string;
  titulo: string | null;
  estagio: Estagio;
  valor?: number | null;
  valor_estimado?: number | null;
  previsao_fechamento: string | null;
  data_fechamento_prevista?: string | null;
  origem: string | null;
  descricao: string | null;
  observacoes: string | null;
  cliente_id: string | null;
  nucleo?: string | null;
};

type ClienteRow = {
  id: string;
  nome: string | null;
  email?: string | null;
  telefone?: string | null;
  avatar_url?: string | null;
  foto_url?: string | null;
  avatar?: string | null;
};

type NucleoRow = {
  oportunidade_id: string;
  nucleo: Nucleo;
  valor: number | null;
};

type ChecklistRow = OportunidadeChecklistResumo & {
  oportunidade_id: string;
};

type ContratoRow = {
  id: string;
  cliente_id: string | null;
  valor_total: number | null;
  numero: string | null;
  descricao: string | null;
  unidade_negocio: string | null;
  status: string | null;
  oportunidade_id: string | null;
  data_inicio: string | null;
};

type ViewMode = "kanban" | "cards";

// Detectar se é mobile (largura < 768px)
function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768;
}

export default function OportunidadesKanbanPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecionada, setSelecionada] = useState<Oportunidade | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [oportunidadeToDelete, setOportunidadeToDelete] = useState<Oportunidade | null>(null);
  // No mobile, iniciar com modo "cards" (lista) para melhor usabilidade
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    isMobileDevice() ? "cards" : "kanban"
  );

  const CORES_PADRAO = {
    primary: "#E5E7EB",
    secondary: "#F3F4F6",
    text: "#111827",
    border: "#E5E7EB",
    hover: "#D1D5DB",
  };

  const toNucleoLabel = (value?: string | null): Nucleo | null => {
    if (!value) return null;
    const normalized = value.toLowerCase();
    if (normalized.startsWith("arquitetura")) return "Arquitetura";
    if (normalized.startsWith("engenharia")) return "Engenharia";
    if (normalized.startsWith("marcenaria")) return "Marcenaria";
    return null;
  };

  const coresFromNucleo = (value?: string | null) => {
    const label = toNucleoLabel(value);
    if (!label) return CORES_PADRAO;
    return CORES_NUCLEOS[label] || CORES_PADRAO;
  };

  async function carregarOportunidades() {
    setLoading(true);
    try {

    // Query 1: Buscar todas as oportunidades
    const { data: oportRaw, error: oportError } = await supabase
      .from("oportunidades")
      .select("*")
      .order("criado_em", { ascending: false });

    const oportData = (oportRaw || []) as OportunidadeRow[];

    if (oportError) {
        console.error("Erro ao carregar oportunidades", oportError);
        toast({ title: "Erro ao carregar oportunidades", description: oportError.message, variant: "destructive" });
        return;
      }

    const oportIds = oportData.map((op) => op.id);

    // Query 2: Buscar todos os clientes relevantes com avatares
    const clienteIds = oportData
      .map((op) => op.cliente_id)
      .filter((id): id is string => Boolean(id));

    let clientesMap: Record<string, ClienteRow> = {};
    let checklistMap: Record<string, OportunidadeChecklistResumo> = {};

    if (clienteIds.length > 0) {
      const { data: clientesRaw } = await supabase
        .from("pessoas")
        .select("id, nome, email, telefone, avatar_url, foto_url, avatar")
        .in("id", clienteIds);

      const clientesData = (clientesRaw || []) as ClienteRow[];

      if (clientesData.length > 0) {
        clientesMap = clientesData.reduce((acc: Record<string, ClienteRow>, cliente) => {
          acc[cliente.id] = cliente;
          return acc;
        }, {} as Record<string, ClienteRow>);
      }
    }

    // Query 2.1: Resumo de checklist por oportunidade
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

    // Query 3: Buscar núcleos para cada oportunidade (tabela de junçÍo)
    const { data: nucleosRaw } = await supabase
      .from("oportunidades_nucleos")
      .select("oportunidade_id, nucleo, valor");

    const nucleosData = (nucleosRaw || []) as NucleoRow[];

    // Query 4: Buscar contratos que ainda nÍo geraram oportunidades (para garantir todos os clientes)
    const { data: contratosRaw } = await supabase
      .from("contratos")
      .select("id, cliente_id, valor_total, numero, descricao, unidade_negocio, status, oportunidade_id, data_inicio")
      .is("oportunidade_id", null)
      .not("status", "eq", "cancelado");

    const contratosData = (contratosRaw || []) as ContratoRow[];

    const normalizeNucleos = (
      items: Array<{ nucleo: string | Nucleo; valor: number | null }>
    ) =>
      items
        .map(({ nucleo, valor }) => {
          const label = toNucleoLabel(nucleo);
          if (!label) return null;
          return { nucleo: label, valor };
        })
        .filter(
          (item): item is { nucleo: Nucleo; valor: number | null } =>
            Boolean(item)
        );

    // Combinar todos os dados no código
    // IMPORTANTE: Se nÍo houver dados em oportunidades_nucleos, usar o campo 'nucleo' da oportunidade
    const oportunidadesComDados = oportData.map((op) => {
      const nucleosFromJunction = normalizeNucleos(
        nucleosData.filter((n) => n.oportunidade_id === op.id)
      );

      // Fallback: se nÍo há dados na tabela de junçÍo, usar o campo nucleo da oportunidade
      const fallbackNucleo = toNucleoLabel(op.nucleo);
      const nucleosFinal = nucleosFromJunction.length > 0
        ? nucleosFromJunction
        : (fallbackNucleo ? [{ nucleo: fallbackNucleo, valor: op.valor || 0 }] : []);

      return {
        ...op,
        clientes: op.cliente_id ? clientesMap[op.cliente_id] : null,
        nucleos: nucleosFinal,
        checklist_resumo: checklistMap[op.id] || null,
      };
    });

    const contratosPendentes = (contratosData || [])
      .filter((contrato) => !contrato.oportunidade_id && toNucleoLabel(contrato.unidade_negocio))
      .map((contrato) => {
        const cliente = contrato.cliente_id ? clientesMap[contrato.cliente_id] : null;
        const nucleo = toNucleoLabel(contrato.unidade_negocio);
        return {
          id: `contrato-${contrato.id}`,
          titulo: contrato.numero || contrato.descricao || "Contrato sem título",
          estagio: "Fechamento" as Estagio,
          valor: contrato.valor_total,
          previsao_fechamento: contrato.data_inicio || null,
          origem: "Contrato existente",
          descricao: contrato.descricao || null,
          observacoes: "Contrato em andamento sem oportunidade registrada",
          clientes: cliente,
          nucleos: nucleo ? [{ nucleo, valor: contrato.valor_total || 0 }] : [],
          checklist_resumo: null,
          valor_estimado: contrato.valor_total,
          pessoas: cliente,
        } as Oportunidade;
      });

    setOportunidades(
        [...oportunidadesComDados, ...contratosPendentes] as Oportunidade[]
      );
    } catch (err) {
      console.error("Erro ao carregar oportunidades", err);
      toast({ title: "Erro ao carregar oportunidades", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarOportunidades();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recarregar quando a página recebe foco (volta da ediçÍo)
  useEffect(() => {
    const handleFocus = () => {
      carregarOportunidades();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function atualizarEstagio(id: string, novoEstagio: Estagio) {
    // Se é um contrato (ID com prefixo "contrato-"), nÍo atualizar como oportunidade
    if (id.startsWith("contrato-")) {
      if (import.meta.env.DEV) console.log("Item é um contrato, nÍo uma oportunidade. Ignorando atualizaçÍo de estágio.");
      // Apenas atualizar estado local para feedback visual
      setOportunidades((prev) =>
        prev.map((op) =>
          op.id === id ? { ...op, estagio: novoEstagio } : op
        )
      );
      return;
    }

    // AtualizaçÍo otimista
    setOportunidades((prev) =>
      prev.map((op) =>
        op.id === id ? { ...op, estagio: novoEstagio } : op
      )
    );

    // Registrar no histórico
    const oportAnterior = oportunidades.find((op) => op.id === id);
    if (oportAnterior && oportAnterior.estagio !== novoEstagio) {
      await supabase.from("oportunidades_historico").insert({
        oportunidade_id: id,
        estagio_anterior: oportAnterior.estagio,
        estagio_novo: novoEstagio,
        observacao: `Movido via Kanban`,
      });
    }

    const { error } = await supabase
      .from("oportunidades")
      .update({ estagio: novoEstagio })
      .eq("id", id);

    if (error) {
      console.error("Erro ao atualizar estágio", error);
      toast({ title: "Erro ao mover oportunidade", description: "Recarregando dados...", variant: "destructive" });
      carregarOportunidades();
      return;
    }

    // Se chegou em Fechamento, criar contratos E copiar para Kanbans dos núcleos
    if (novoEstagio === "Fechamento" && oportAnterior) {
      await criarContratosAutomaticamente(oportAnterior);
      await copiarParaKanbansNucleos(id);
    }
  }

  // Criar contratos automaticamente quando oportunidade é fechada
  async function criarContratosAutomaticamente(oportunidade: Oportunidade) {
    try {
      // Buscar núcleos da oportunidade
      const nucleos = oportunidade.nucleos || [];

      if (nucleos.length === 0) {
        if (import.meta.env.DEV) console.log("Oportunidade sem núcleos definidos, nÍo será criado contrato");
        return;
      }

      // Buscar dados completos da oportunidade incluindo cliente_id
      const { data: oportCompleta } = await supabase
        .from("oportunidades")
        .select("cliente_id, valor_estimado")
        .eq("id", oportunidade.id)
        .single();

      if (!oportCompleta || !oportCompleta.cliente_id) {
        console.error("Oportunidade sem cliente definido");
        return;
      }

      // Criar um contrato para cada núcleo
      for (const nucleo of nucleos) {
        // Verificar se já existe contrato para esta oportunidade + núcleo
        const { data: contratoExistente } = await supabase
          .from("contratos")
          .select("id")
          .eq("oportunidade_id", oportunidade.id)
          .eq("unidade_negocio", nucleo.nucleo.toLowerCase())
          .limit(1)
          .maybeSingle();

        if (contratoExistente) {
          if (import.meta.env.DEV) console.log(`ℹ️ Contrato já existe para ${nucleo.nucleo}, pulando...`);
          continue;
        }

        const contratoData = {
          oportunidade_id: oportunidade.id,
          cliente_id: oportCompleta.cliente_id,
          titulo: oportunidade.titulo,
          descricao: oportunidade.descricao || "",
          tipo_contrato: nucleo.nucleo.toLowerCase(),
          unidade_negocio: nucleo.nucleo.toLowerCase() as "arquitetura" | "engenharia" | "marcenaria",
          valor_total: nucleo.valor || oportCompleta.valor_estimado || 0,
          data_inicio: new Date().toISOString().split('T')[0],
        };

        if (import.meta.env.DEV) console.log(`📝 Criando contrato para ${nucleo.nucleo}:`, contratoData);

        try {
          const novoContrato = await criarContrato(contratoData as any, true);
          if (import.meta.env.DEV) console.log(`✅ Contrato criado automaticamente para ${nucleo.nucleo}:`, novoContrato?.numero || novoContrato?.id);
        } catch (contratoError: any) {
          console.error(`❌ Erro ao criar contrato para ${nucleo.nucleo}:`, {
            code: contratoError?.code,
            message: contratoError?.message,
            details: contratoError?.details,
            hint: contratoError?.hint,
            contratoData,
          });
        }
      }
    } catch (error) {
      console.error("Erro ao criar contratos automaticamente:", error);
    }
  }

  // Copiar cards para Kanbans dos núcleos quando oportunidade chega em Fechamento
  async function copiarParaKanbansNucleos(oportunidadeId: string) {
    try {
      if (import.meta.env.DEV) console.log(`Copiando oportunidade ${oportunidadeId} para Kanbans dos nucleos...`);

      // Buscar núcleos da oportunidade - primeiro da tabela de junçÍo
      let nucleosList: { nucleo: string }[] = [];

      const { data: nucleosData, error: nucleosError } = await supabase
        .from("oportunidades_nucleos")
        .select("nucleo")
        .eq("oportunidade_id", oportunidadeId);

      if (!nucleosError && nucleosData && nucleosData.length > 0) {
        nucleosList = nucleosData;
      } else {
        // Fallback: buscar do campo nucleo na tabela oportunidades
        const { data: oportData } = await supabase
          .from("oportunidades")
          .select("nucleo")
          .eq("id", oportunidadeId)
          .single();

        if (oportData?.nucleo) {
          nucleosList = [{ nucleo: oportData.nucleo }];
          if (import.meta.env.DEV) console.log(`Usando nucleo da tabela principal: ${oportData.nucleo}`);
        }
      }

      if (nucleosList.length === 0) {
        if (import.meta.env.DEV) console.log("Oportunidade sem nucleos, nao sera copiada");
        return;
      }

      // Para cada núcleo, criar posiçÍo na primeira coluna
      for (const { nucleo } of nucleosList) {
        // Verificar se já existe posiçÍo para este núcleo
        const { data: posicaoExistente } = await supabase
          .from("nucleos_oportunidades_posicoes")
          .select("id")
          .eq("oportunidade_id", oportunidadeId)
          .eq("nucleo", nucleo)
          .single();

        if (posicaoExistente) {
          if (import.meta.env.DEV) console.log(`ℹ️ Card já existe no Kanban de ${nucleo}, pulando...`);
          continue;
        }

        // Buscar a primeira coluna (ordem=0) deste núcleo
        const { data: primeiraColuna, error: colunaError } = await supabase
          .from("nucleos_colunas")
          .select("id")
          .eq("nucleo", nucleo)
          .order("ordem", { ascending: true })
          .limit(1)
          .single();

        if (colunaError || !primeiraColuna) {
          console.error(`❌ Erro ao buscar primeira coluna do núcleo ${nucleo}:`, colunaError);
          continue;
        }

        // Criar posiçÍo na primeira coluna
        const { error: posicaoError } = await supabase
          .from("nucleos_oportunidades_posicoes")
          .insert({
            oportunidade_id: oportunidadeId,
            nucleo: nucleo,
            coluna_id: primeiraColuna.id,
            ordem: 0,
          });

        if (posicaoError) {
          console.error(`❌ Erro ao criar posiçÍo no núcleo ${nucleo}:`, posicaoError);
        } else {
          if (import.meta.env.DEV) console.log(`✅ Card copiado para Kanban de ${nucleo}`);
        }
      }

      if (import.meta.env.DEV) console.log(`Oportunidade copiada para ${nucleosList.length} nucleo(s)!`);
    } catch (error) {
      console.error("❌ Erro ao copiar para Kanbans dos núcleos:", error);
    }
  }

  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const origem = source.droppableId as Estagio;
    const destino = destination.droppableId as Estagio;

    if (origem === destino) return;

    atualizarEstagio(draggableId, destino);
  }

  function handleDeleteClick(oportunidade: Oportunidade, e: React.MouseEvent) {
    e.stopPropagation();
    setOportunidadeToDelete(oportunidade);
    setConfirmDelete(true);
  }

  async function handleConfirmDelete() {
    if (!oportunidadeToDelete) return;

    // Se é um contrato, nÍo permitir exclusÍo pelo Kanban de Oportunidades
    if (oportunidadeToDelete.id.startsWith("contrato-")) {
      toast({ title: "Este item é um contrato. Para excluir, acesse a página de Contratos." });
      setConfirmDelete(false);
      setOportunidadeToDelete(null);
      return;
    }

    try {
      // Deletar núcleos relacionados primeiro
      const { error: nucleosError } = await supabase
        .from("oportunidades_nucleos")
        .delete()
        .eq("oportunidade_id", oportunidadeToDelete.id);

      if (nucleosError) {
        console.error("Erro ao deletar núcleos:", nucleosError);
        toast({ variant: "destructive", title: "Erro", description: "Erro ao excluir oportunidade. Tente novamente." });
        return;
      }

      // Deletar posições em kanbans de núcleos
      await supabase
        .from("nucleos_oportunidades_posicoes")
        .delete()
        .eq("oportunidade_id", oportunidadeToDelete.id);

      // Deletar a oportunidade
      const { error: deleteError } = await supabase
        .from("oportunidades")
        .delete()
        .eq("id", oportunidadeToDelete.id);

      if (deleteError) {
        console.error("Erro ao deletar oportunidade:", deleteError);
        toast({ variant: "destructive", title: "Erro", description: "Erro ao excluir oportunidade. Tente novamente." });
        return;
      }

      // Remover da lista local
      setOportunidades((prev) =>
        prev.filter((op) => op.id !== oportunidadeToDelete.id)
      );

      // Fechar modal de confirmaçÍo
      setConfirmDelete(false);
      setOportunidadeToDelete(null);

      // Feedback de sucesso
      if (import.meta.env.DEV) console.log("✅ Oportunidade excluída com sucesso!");
    } catch (error) {
      console.error("Erro inesperado ao excluir:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao excluir oportunidade. Tente novamente." });
    }
  }

  function handleCancelDelete() {
    setConfirmDelete(false);
    setOportunidadeToDelete(null);
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A1A1A] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando oportunidades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={LAYOUT.pageContainer}>
      <div className={LAYOUT.pageHeader}>
        {/* Titulo - Lado Esquerdo */}
        <div>
          <h1 className={TYPOGRAPHY.pageTitle}>
            Pipeline de Oportunidades
          </h1>
          <p className={`${TYPOGRAPHY.pageSubtitle} mt-1 hidden sm:block`}>
            {viewMode === "kanban" ? "Arraste os cards para alterar o estagio" : "Visualizacao em blocos de cards"}
          </p>
        </div>

        {/* Controles - Lado Direito */}
        <div className={LAYOUT.pageActions}>
          <div className="flex flex-col items-start gap-1">
            <span className="text-[11px] uppercase tracking-wide text-[#8A7A6A]">
              Kanbans por Unidade de Negocio
            </span>
            <div className="flex items-center flex-wrap gap-2 sm:gap-3">
              <button
                onClick={() => navigate("/oportunidades/kanban/arquitetura")}
                className="px-3 sm:px-4 py-2 rounded-lg text-[14px] font-medium transition-all shadow-sm hover:shadow-md border border-[#F25C26] text-[#F25C26] bg-white hover:bg-[#FFF4EE]"
              >
                Arquitetura
              </button>
              <button
                onClick={() => navigate("/oportunidades/kanban/engenharia")}
                className="px-3 sm:px-4 py-2 rounded-lg text-[14px] font-medium transition-all shadow-sm hover:shadow-md border border-[#F25C26] text-[#F25C26] bg-white hover:bg-[#FFF4EE]"
              >
                Engenharia
              </button>
              <button
                onClick={() => navigate("/oportunidades/kanban/marcenaria")}
                className="px-3 sm:px-4 py-2 rounded-lg text-[14px] font-medium transition-all shadow-sm hover:shadow-md border border-[#F25C26] text-[#F25C26] bg-white hover:bg-[#FFF4EE]"
              >
                Marcenaria
              </button>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 sm:gap-3">
            {/* Seletores de Visualizacao */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("kanban")}
                className={`p-2 rounded-md transition-all ${
                  viewMode === "kanban"
                    ? "bg-white text-primary shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                title="Visualizacao Kanban"
              >
                <Kanban size={18} />
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={`p-2 rounded-md transition-all ${
                  viewMode === "cards"
                    ? "bg-white text-primary shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                title="Visualizacao em Cards"
              >
                <LayoutGrid size={18} />
              </button>
            </div>

            <button
              onClick={() => (window.location.href = "/oportunidades/novo")}
              className="px-4 py-2 bg-[#F25C26] text-white rounded-lg text-[14px] hover:bg-[#DD4F1D] transition-all shadow-sm hover:shadow-md"
            >
              + Nova Oportunidade
            </button>
          </div>
        </div>
      </div>

      {/* VISUALIZACAO KANBAN */}
      {viewMode === "kanban" && (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-4">
            {ESTAGIOS.map((estagio) => {
              const col = oportunidades.filter((op) => op.estagio === estagio);

              return (
                <Droppable droppableId={estagio} key={estagio}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`bg-[#F9F9F9] border rounded-xl p-3 sm:p-4 flex flex-col transition-all min-h-[500px] flex-1 min-w-[220px] ${
                        snapshot.isDraggingOver
                          ? "bg-white border-[#C9A86A] shadow-lg"
                          : "border-[#E5E5E5]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                        <h2 className={TYPOGRAPHY.sectionTitle + " uppercase tracking-wide"}>
                          {estagio}
                        </h2>
                        <span className={TYPOGRAPHY.badge + " bg-primary text-white"}>
                          {col.length}
                        </span>
                      </div>

                      <div className="flex flex-col gap-2 sm:gap-3 flex-1">
                        {col.map((op, idx) => (
                          <Draggable
                            key={op.id}
                            draggableId={op.id}
                            index={idx}
                          >
                            {(prov, snap) => (
                              <div
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                {...prov.dragHandleProps}
                                className={`w-full bg-white rounded-lg shadow-sm hover:shadow-lg transition-all border border-gray-100 ${
                                  snap.isDragging ? "ring-2 ring-[#C9A86A] shadow-2xl" : ""
                                }`}
                              >
                                {/* Header com Avatar */}
                                <div className="flex items-center gap-2 p-3 pb-2 border-b border-gray-100">
                                  <Avatar
                                    nome={op.clientes?.nome ?? "Cliente"}
                                    avatar_url={op.clientes?.avatar_url}
                                    foto_url={op.clientes?.foto_url}
                                    avatar={op.clientes?.avatar}
                                    size={28}
                                  />
                                  <span className="text-[13px] text-gray-600 font-medium uppercase">
                                    {formatarNomeAbreviado(op.clientes?.nome)}
                                  </span>
                                </div>

                                {/* Conteúdo do Card */}
                                <div
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => setSelecionada(op)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      setSelecionada(op);
                                    }
                                  }}
                                  className="w-full text-left p-3 cursor-pointer"
                                >
                                  <div className={`${TYPOGRAPHY.cardTitle} line-clamp-2 mb-2`}>
                                    {op.titulo}
                                  </div>

                                  {/* Checklist - progresso */}
                                  {op.checklist_resumo &&
                                    op.checklist_resumo.total_checklist > 0 && (
                                      <div className="mb-2">
                                        <div className="flex justify-between text-xs text-gray-500">
                                          <span>Checklist</span>
                                          <span>
                                            {op.checklist_resumo.checklist_concluidos}/
                                            {op.checklist_resumo.total_checklist} (
                                            {op.checklist_resumo.percentual_concluido}%)
                                          </span>
                                        </div>
                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                          <div
                                            className="h-full bg-gradient-to-r from-[#F25C26] to-[#d94e1f]"
                                            style={{
                                              width: `${op.checklist_resumo.percentual_concluido}%`,
                                            }}
                                          />
                                        </div>
                                        {op.checklist_resumo.obrigatorios_pendentes > 0 && (
                                          <div className="text-xs text-red-600 mt-1">
                                            {op.checklist_resumo.obrigatorios_pendentes}{" "}
                                            obrigatório(s) pendente(s)
                                          </div>
                                        )}
                                      </div>
                                    )}

                                {/* Nucleos */}
                                {op.nucleos && op.nucleos.length > 0 && (
                                  <div className="flex gap-0.5 mb-2">
                                    {op.nucleos.map((n, i) => {
                                      const nucleoLabel = n?.nucleo;
                                      if (!nucleoLabel) return null;
                                      const cores = coresFromNucleo(nucleoLabel);
                                      return (
                                        <span
                                          key={i}
                                          className={TYPOGRAPHY.badgeSmall + " whitespace-nowrap"}
                                          style={{
                                            backgroundColor: cores.secondary,
                                            color: cores.text,
                                            border: `1px solid ${cores.border}`,
                                          }}
                                        >
                                          {nucleoLabel}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Valor, Data e Ações */}
                                <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-gray-100">
                                  <div className="flex items-center gap-2">
                                    {(op.valor != null && op.valor > 0) ? (
                                      <span className="font-normal text-[#1A1A1A]">
                                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(op.valor)}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">Sem valor</span>
                                    )}
                                    {(op.data_fechamento_prevista || op.previsao_fechamento) && (
                                      <span className="text-gray-400 text-xs">
                                        📅 {formatarData(op.data_fechamento_prevista || op.previsao_fechamento || "")}
                                      </span>
                                    )}
                                  </div>

                                  {/* Ações */}
                                  <div className="flex items-center gap-0.5">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/oportunidades/editar/${op.id}`);
                                      }}
                                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                                      title="Editar oportunidade"
                                    >
                                      <Edit2 size={14} className="text-gray-400" />
                                    </button>
                                    <button
                                      onClick={(e) => handleDeleteClick(op, e)}
                                      className="p-1 hover:bg-red-50 rounded transition-colors"
                                      title="Excluir oportunidade"
                                    >
                                      <Trash2 size={14} className="text-red-400" />
                                    </button>
                                  </div>
                                </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}

                        {provided.placeholder}

                        {col.length === 0 && (
                          <div className="text-center text-gray-400 text-[11px] py-6 px-2 italic">
                            Arraste oportunidades aqui
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {/* VISUALIZACAO EM CARDS/BLOCOS */}
      {viewMode === "cards" && (
        <div className={LAYOUT.gridCards}>
          {oportunidades.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                emoji="🎯"
                title="Nenhuma oportunidade encontrada"
                description="Adicione clientes ao funil de vendas para acompanhar cada etapa do processo."
                actions={[{ label: "Nova Oportunidade", onClick: () => navigate("/oportunidades/novo"), variant: "primary", icon: Plus }]}
              />
            </div>
          ) : (
            oportunidades.map((op) => (
              <div
                key={op.id}
                className={LAYOUT.cardHover + " overflow-hidden"}
              >
                {/* Header com Avatar */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Avatar
                      nome={op.clientes?.nome ?? "Cliente"}
                      avatar_url={op.clientes?.avatar_url}
                      foto_url={op.clientes?.foto_url}
                      avatar={op.clientes?.avatar}
                      size={40}
                    />
                    <div>
                      <span className="text-[15px] font-medium text-gray-900 block uppercase">
                        {formatarNomeAbreviado(op.clientes?.nome)}
                      </span>
                      <span className="text-xs text-gray-500">{op.estagio}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigate(`/oportunidades/editar/${op.id}`)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      title="Editar oportunidade"
                    >
                      <Edit2 size={16} className="text-gray-500" />
                    </button>
                    <button
                      onClick={() => {
                        setOportunidadeToDelete(op);
                        setConfirmDelete(true);
                      }}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir oportunidade"
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                </div>

                {/* Conteúdo */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelecionada(op)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelecionada(op);
                    }
                  }}
                  className="w-full text-left p-4 cursor-pointer"
                >
                  <h3 className={`${TYPOGRAPHY.cardTitle} mb-3 line-clamp-2`}>
                    {op.titulo}
                  </h3>

                  {/* Checklist */}
                  {op.checklist_resumo && op.checklist_resumo.total_checklist > 0 && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Checklist</span>
                        <span>
                          {op.checklist_resumo.checklist_concluidos}/{op.checklist_resumo.total_checklist}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#F25C26] to-[#d94e1f]"
                          style={{ width: `${op.checklist_resumo.percentual_concluido}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Nucleos */}
                  {op.nucleos && op.nucleos.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {op.nucleos.map((n, i) => {
                        const nucleoLabel = n?.nucleo;
                        if (!nucleoLabel) return null;
                        const cores = coresFromNucleo(nucleoLabel);
                        return (
                          <span
                            key={i}
                            className={TYPOGRAPHY.badge}
                            style={{
                              backgroundColor: cores.secondary,
                              color: cores.text,
                              border: `1px solid ${cores.border}`,
                            }}
                          >
                            {nucleoLabel}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Valor e Data */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="text-[20px] font-normal text-[#1A1A1A]">
                      {(op.valor != null && op.valor > 0)
                        ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(op.valor)
                        : "Sem valor"}
                    </div>
                    {(op.data_fechamento_prevista || op.previsao_fechamento) && (
                      <div className="text-xs text-gray-500">
                        📅 {formatarData(op.data_fechamento_prevista || op.previsao_fechamento || "")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {selecionada && (
        <OportunidadeModal
          oportunidade={selecionada}
          onClose={() => setSelecionada(null)}
          onUpdated={carregarOportunidades}
          showDates={false}
          onChangeStage={atualizarEstagio}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDelete}
        title="Excluir Oportunidade"
        message={`Tem certeza que deseja excluir a oportunidade "${oportunidadeToDelete?.titulo}"? Esta açÍo nÍo pode ser desfeita.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        type="danger"
      />
    </div>
  );
}

