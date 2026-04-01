/* eslint-disable @typescript-eslint/no-unused-vars */
// ============================================================
// PÁGINA DE CRIAÇÍO/GERENCIAMENTO DE CHECKLISTS
// Módulo completo com templates, menções, ediçÍo inline,
// bulk @mention, renderizaçÍo de menções e reconhecimento
// ============================================================

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import {
  listarNotasHierarquico,
  listarItensMencionados,
  criarNota,
  adicionarItem,
  adicionarItensEmLote,
  toggleItemCheck,
  excluirItem,
  arquivarNota,
  excluirNota,
  atualizarNota,
  atualizarItemDeadline,
  atualizarItemTexto,
  resolverMencoesENotificar,
  CORES_NOTAS,
  NotaSistema,
  NotaSistemaItem,
  FiltroChecklist,
} from "@/lib/notasSistemaApi";
import { useUsuarioLogado } from "@/hooks/useUsuarioLogado";
import { TYPOGRAPHY, LAYOUT } from "@/constants";
import { NotasKeepTab } from "./NotasKeepTab";

import {
  CheckSquare,
  Plus,
  Trash2,
  Archive,
  Filter,
  AtSign,
  ChevronDown,
  ChevronUp,
  Loader2,
  ClipboardPaste,
  X,
  Check,
  Pencil,
  ListChecks,
} from "lucide-react";

// ============================================================
// TIPOS LOCAIS
// ============================================================

interface ChecklistTemplate {
  id: string;
  nome: string;
  nucleo: string | null;
}

interface PessoaMencaoOption {
  id: string;
  nome: string;
  tipo?: string | null;
  cargo?: string | null;
}

// ============================================================
// HELPERS DE MENÇÍO (mesma lógica do CardChecklist)
// ============================================================

function normalizarTexto(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Renderiza texto com @menções destacadas em verde */
function renderTextoComMencoes(texto: string) {
  const partes = texto.split(
    /(@[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9._-]*(?:\s+[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9._-]*){0,5})/g
  );
  return partes.map((parte, idx) => {
    if (/^@[A-Za-zÀ-ÿ]/.test(parte)) {
      return (
        <span key={`${parte}-${idx}`} className="text-green-700 font-medium">
          {parte}
        </span>
      );
    }
    return <span key={`${parte}-${idx}`}>{parte}</span>;
  });
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function CriacaoChecklistPage() {
  const { toast } = useToast();
  const { usuario, isAdminOuMaster } = useUsuarioLogado();
  const [searchParams] = useSearchParams();
  const notaIdParam = searchParams.get("nota");
  const tabParam = searchParams.get("tab");

  const pessoaId = usuario?.pessoa_id || "";
  const usuarioId = usuario?.id || "";
  const authUserId = usuario?.auth_user_id || "";
  const tipoUsuario = usuario?.tipo_usuario || "COLABORADOR";

  // ------ Estado principal ------
  const [notas, setNotas] = useState<NotaSistema[]>([]);
  const [mencionados, setMencionados] = useState<NotaSistemaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<FiltroChecklist>("minhas");
  const [expandedNota, setExpandedNota] = useState<string | null>(notaIdParam);
  const [activeTab, setActiveTab] = useState<"checklists" | "notas">(
    tabParam === "notas" || tabParam === "guia" ? "notas" : "checklists"
  );

  // ------ Criar nota ------
  const [showCriarNota, setShowCriarNota] = useState(false);
  const [novaNota, setNovaNota] = useState({
    titulo: "",
    descricao: "",
    cor: CORES_NOTAS.amarelo as string,
    vinculo_id: "",
  });
  const [criandoNota, setCriandoNota] = useState(false);

  // ------ Adicionar item ------
  const [addingItemNotaId, setAddingItemNotaId] = useState<string | null>(null);
  const [novoItemTexto, setNovoItemTexto] = useState("");
  const [novoItemDeadline, setNovoItemDeadline] = useState("");
  const [novoItemPrioridade, setNovoItemPrioridade] = useState<"baixa" | "media" | "alta">("media");

  // ------ Colar checklist (Quick Add) ------
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddNotaId, setQuickAddNotaId] = useState<string | null>(null);
  const [quickAddText, setQuickAddText] = useState("");
  const [quickAddName, setQuickAddName] = useState("");
  const [creatingQuickAdd, setCreatingQuickAdd] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ------ Templates ------
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  // ------ EdiçÍo inline ------
  const [editingNotaTituloId, setEditingNotaTituloId] = useState<string | null>(null);
  const [editingNotaTitulo, setEditingNotaTitulo] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemText, setEditingItemText] = useState("");

  // ------ Bulk @mention ------
  const [bulkMentionNotaId, setBulkMentionNotaId] = useState<string | null>(null);
  const [bulkMentionText, setBulkMentionText] = useState("");
  const [showBulkMentionSuggestions, setShowBulkMentionSuggestions] = useState(false);
  const [pessoasMencao, setPessoasMencao] = useState<PessoaMencaoOption[]>([]);

  // ------ MençÍo reconhecida ------
  const [mencaoReconhecidaItemId, setMencaoReconhecidaItemId] = useState<string | null>(null);

  // ------ Clientes para vincular ------
  const [clientes, setClientes] = useState<Array<{ id: string; nome: string }>>([]);

  // ============================================================
  // CARREGAMENTO
  // ============================================================

  const carregarNotas = useCallback(async () => {
    if (!pessoaId || !usuarioId) {
      setLoading(false);
      return;
    }
    try {
      const [notasData, mencionadosData, notasAdminClienteData] = await Promise.all([
        listarNotasHierarquico({ usuarioId, pessoaId, tipoUsuario, filtro, authUserId }),
        listarItensMencionados(pessoaId),
        isAdminOuMaster && filtro === "minhas"
          ? listarNotasHierarquico({ usuarioId, pessoaId, tipoUsuario, filtro: "todas", authUserId })
          : Promise.resolve([] as NotaSistema[]),
      ]);

      let notasVisiveis = notasData;
      if (isAdminOuMaster && filtro === "minhas") {
        const vinculadasCliente = (notasAdminClienteData || []).filter((n) => n.vinculo_tipo === "cliente");
        const merged = new Map<string, NotaSistema>();
        [...notasData, ...vinculadasCliente].forEach((n) => merged.set(n.id, n));
        notasVisiveis = Array.from(merged.values()).sort(
          (a, b) => new Date(b.atualizado_em).getTime() - new Date(a.atualizado_em).getTime()
        );
      }

      setNotas(notasVisiveis);
      setMencionados(mencionadosData);
    } catch (err) {
      console.error("Erro ao carregar notas:", err);
    } finally {
      setLoading(false);
    }
  }, [pessoaId, usuarioId, tipoUsuario, filtro, authUserId, isAdminOuMaster]);

  const carregarTemplates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("checklist_templates")
        .select("id, nome, nucleo")
        .eq("ativo", true)
        .order("ordem");
      if (!error) setTemplates(data || []);
    } catch (err) {
      console.error("Erro ao carregar templates:", err);
    }
  }, []);

  const carregarPessoas = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("pessoas")
        .select("id, nome, tipo, cargo")
        .eq("ativo", true)
        .order("nome", { ascending: true })
        .limit(300);
      if (!error) setPessoasMencao((data as PessoaMencaoOption[]) || []);
    } catch (err) {
      console.error("Erro ao carregar pessoas:", err);
    }
  }, []);

  const carregarClientes = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("pessoas")
        .select("id, nome")
        .eq("tipo", "CLIENTE")
        .eq("ativo", true)
        .order("nome")
        .limit(200);
      setClientes(data || []);
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
    }
  }, []);

  useEffect(() => {
    if (tabParam === "notas" || tabParam === "guia") {
      setActiveTab("notas");
    }
  }, [tabParam]);

  useEffect(() => {
    carregarNotas();
    carregarTemplates();
    carregarPessoas();
    carregarClientes();
  }, [carregarNotas, carregarTemplates, carregarPessoas, carregarClientes]);

  // ============================================================
  // ESTATÍSTICAS
  // ============================================================

  const stats = useMemo(() => {
    const todosItens = notas.flatMap((n) => n.itens || []);
    const pendentes = todosItens.filter((i) => !i.checked).length;
    const concluidos = todosItens.filter((i) => i.checked).length;
    const total = todosItens.length;
    const mencoesCount = mencionados.filter((i) => !i.checked).length;
    const atrasados = todosItens.filter(
      (i) => !i.checked && i.deadline && new Date(i.deadline) < new Date()
    ).length;
    const progresso = total > 0 ? Math.round((concluidos / total) * 100) : 0;
    return { pendentes, concluidos, total, mencoesCount, atrasados, progresso };
  }, [notas, mencionados]);

  // ============================================================
  // BULK MENTION - autocomplete filtrado
  // ============================================================

  const termoMencaoHeader = bulkMentionText.trim().startsWith("@")
    ? normalizarTexto(bulkMentionText.trim().slice(1))
    : "";

  const pessoasMencaoFiltradas = useMemo(() => {
    if (termoMencaoHeader.length < 2) return [];
    return pessoasMencao
      .filter((p) => normalizarTexto(p.nome || "").includes(termoMencaoHeader))
      .slice(0, 8);
  }, [termoMencaoHeader, pessoasMencao]);

  // ============================================================
  // AÇÕES: CRIAR NOTA
  // ============================================================

  async function handleCriarNota() {
    if (!novaNota.titulo.trim()) return;
    setCriandoNota(true);
    try {
      await criarNota(
        {
          titulo: novaNota.titulo.trim(),
          descricao: novaNota.descricao.trim() || undefined,
          cor: novaNota.cor,
          vinculo_tipo: novaNota.vinculo_id ? "cliente" : undefined,
          vinculo_id: novaNota.vinculo_id || undefined,
        },
        pessoaId
      );
      setShowCriarNota(false);
      setNovaNota({ titulo: "", descricao: "", cor: CORES_NOTAS.amarelo, vinculo_id: "" });
      await carregarNotas();
    } finally {
      setCriandoNota(false);
    }
  }

  // ============================================================
  // AÇÕES: TEMPLATES
  // ============================================================

  function getNucleoColor(nucleo: string) {
    switch (nucleo) {
      case "arquitetura": return "bg-blue-500";
      case "engenharia": return "bg-green-500";
      case "marcenaria": return "bg-amber-500";
      default: return "bg-gray-500";
    }
  }

  async function handleApplyTemplate(templateId: string) {
    try {
      const { data: template } = await supabase
        .from("checklist_templates")
        .select("nome")
        .eq("id", templateId)
        .single();

      const { data: templateItems, error } = await supabase
        .from("checklist_template_items")
        .select("texto, ordem")
        .eq("template_id", templateId)
        .order("ordem");

      if (error) throw error;

      const nomeTemplate = template?.nome || "Checklist Template";
      const itens = (templateItems || []).map((i) => ({
        texto: i.texto,
        prioridade: "media" as const,
      }));

      const nota = await criarNota(
        { titulo: nomeTemplate, cor: CORES_NOTAS.laranja, itens },
        pessoaId
      );

      if (nota) {
        const itensComId = (nota.itens || []).map((i) => ({ id: i.id, texto: i.texto }));
        const idsComMencao = await resolverMencoesENotificar(nomeTemplate, itensComId, pessoaId);
        if (idsComMencao.size > 0) {
          const primeiro = itensComId[0]?.id;
          if (primeiro && idsComMencao.has(primeiro)) {
            setMencaoReconhecidaItemId(primeiro);
            setTimeout(() => setMencaoReconhecidaItemId((prev) => (prev === primeiro ? null : prev)), 2500);
          }
        }
      }

      setShowTemplateSelector(false);
      await carregarNotas();
    } catch (err) {
      console.error("Erro ao aplicar template:", err);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao aplicar template" });
    }
  }

  // ============================================================
  // AÇÕES: QUICK ADD (Colar Checklist)
  // ============================================================

  function contarLinhas(): number {
    return quickAddText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0).length;
  }

  async function handleQuickAdd() {
    const linhas = quickAddText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    if (linhas.length === 0) return;

    setCreatingQuickAdd(true);
    try {
      if (quickAddNotaId) {
        await adicionarItensEmLote(quickAddNotaId, linhas, pessoaId);
      } else {
        const nome = quickAddName.trim() || `Checklist ${new Date().toLocaleDateString("pt-BR")}`;
        const nota = await criarNota(
          { titulo: nome, cor: CORES_NOTAS.amarelo, itens: linhas.map((texto) => ({ texto, prioridade: "media" as const })) },
          pessoaId
        );
        if (nota) {
          const itensComId = (nota.itens || []).map((i) => ({ id: i.id, texto: i.texto }));
          await resolverMencoesENotificar(nome, itensComId, pessoaId);
        }
      }

      setShowQuickAdd(false);
      setQuickAddText("");
      setQuickAddName("");
      setQuickAddNotaId(null);
      await carregarNotas();
    } catch (err) {
      console.error("Erro ao criar checklist rápido:", err);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao criar checklist rápido" });
    } finally {
      setCreatingQuickAdd(false);
    }
  }

  // ============================================================
  // AÇÕES: TOGGLE CHECK
  // ============================================================

  async function handleToggleItem(notaId: string, item: NotaSistemaItem) {
    const ok = await toggleItemCheck(item.id, !item.checked, pessoaId);
    if (ok) {
      setNotas((prev) =>
        prev.map((n) => {
          if (n.id !== notaId) return n;
          return {
            ...n,
            itens: n.itens?.map((i) => (i.id === item.id ? { ...i, checked: !item.checked } : i)),
          };
        })
      );
    }
  }

  // ============================================================
  // AÇÕES: ADICIONAR ITEM
  // ============================================================

  async function handleAdicionarItem(notaId: string) {
    if (!novoItemTexto.trim()) return;
    const item = await adicionarItem(
      {
        nota_id: notaId,
        texto: novoItemTexto.trim(),
        deadline: novoItemDeadline || undefined,
        prioridade: novoItemPrioridade,
      },
      pessoaId
    );

    if (item) {
      const nota = notas.find((n) => n.id === notaId);
      const idsComMencao = await resolverMencoesENotificar(
        nota?.titulo || "Checklist",
        [{ id: item.id, texto: item.texto }],
        pessoaId
      );
      if (idsComMencao.has(item.id)) {
        setMencaoReconhecidaItemId(item.id);
        setTimeout(() => setMencaoReconhecidaItemId((prev) => (prev === item.id ? null : prev)), 2500);
      }
    }

    setAddingItemNotaId(null);
    setNovoItemTexto("");
    setNovoItemDeadline("");
    setNovoItemPrioridade("media");
    await carregarNotas();
  }

  // ============================================================
  // AÇÕES: EDIÇÍO INLINE - Título da nota
  // ============================================================

  async function handleSaveNotaTitulo(notaId: string) {
    const titulo = editingNotaTitulo.trim();
    if (!titulo) return;
    const ok = await atualizarNota(notaId, { titulo });
    if (ok) {
      setNotas((prev) => prev.map((n) => (n.id === notaId ? { ...n, titulo } : n)));
    }
    setEditingNotaTituloId(null);
    setEditingNotaTitulo("");
  }

  // ============================================================
  // AÇÕES: EDIÇÍO INLINE - Texto do item
  // ============================================================

  async function handleSaveItemText(notaId: string, itemId: string) {
    const texto = editingItemText.trim();
    if (!texto) return;
    const ok = await atualizarItemTexto(itemId, texto);
    if (ok) {
      setNotas((prev) =>
        prev.map((n) =>
          n.id === notaId
            ? { ...n, itens: n.itens?.map((i) => (i.id === itemId ? { ...i, texto } : i)) }
            : n
        )
      );

      const nota = notas.find((n) => n.id === notaId);
      const idsComMencao = await resolverMencoesENotificar(
        nota?.titulo || "Checklist",
        [{ id: itemId, texto }],
        pessoaId
      );
      if (idsComMencao.has(itemId)) {
        setMencaoReconhecidaItemId(itemId);
        setTimeout(() => setMencaoReconhecidaItemId((prev) => (prev === itemId ? null : prev)), 2500);
      }
    }
    setEditingItemId(null);
    setEditingItemText("");
  }

  // ============================================================
  // AÇÕES: EXCLUIR ITEM
  // ============================================================

  async function handleExcluirItem(notaId: string, itemId: string) {
    if (!confirm("Excluir este item?")) return;
    const ok = await excluirItem(itemId);
    if (ok) {
      setNotas((prev) =>
        prev.map((n) =>
          n.id === notaId ? { ...n, itens: n.itens?.filter((i) => i.id !== itemId) } : n
        )
      );
      if (editingItemId === itemId) {
        setEditingItemId(null);
        setEditingItemText("");
      }
    }
  }

  // ============================================================
  // AÇÕES: BULK @MENTION
  // ============================================================

  async function handleBulkMention(notaId: string) {
    const mencaoRaw = bulkMentionText.trim();
    if (!mencaoRaw) return;

    const mencaoTexto = mencaoRaw.startsWith("@") ? mencaoRaw : `@${mencaoRaw}`;
    const nota = notas.find((n) => n.id === notaId);
    const itens = nota?.itens || [];
    if (itens.length === 0) return;

    try {
      const updates: Array<{ id: string; texto: string }> = [];
      for (const item of itens) {
        if ((item.texto || "").includes(mencaoTexto)) continue;
        updates.push({ id: item.id, texto: `${item.texto} ${mencaoTexto}`.trim() });
      }

      for (const update of updates) {
        await atualizarItemTexto(update.id, update.texto);
      }

      if (updates.length > 0) {
        setNotas((prev) =>
          prev.map((n) =>
            n.id === notaId
              ? {
                  ...n,
                  itens: n.itens?.map((item) => {
                    const update = updates.find((u) => u.id === item.id);
                    return update ? { ...item, texto: update.texto } : item;
                  }),
                }
              : n
          )
        );

        const idsComMencao = await resolverMencoesENotificar(nota?.titulo || "Checklist", updates, pessoaId);
        const primeiro = updates[0]?.id || null;
        if (primeiro && idsComMencao.has(primeiro)) {
          setMencaoReconhecidaItemId(primeiro);
          setTimeout(() => setMencaoReconhecidaItemId((prev) => (prev === primeiro ? null : prev)), 2500);
        }
      }

      setBulkMentionNotaId(null);
      setBulkMentionText("");
      setShowBulkMentionSuggestions(false);
    } catch (err) {
      console.error("Erro ao aplicar mençÍo em massa:", err);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao aplicar mençÍo" });
    }
  }

  // ============================================================
  // AÇÕES: DEADLINE
  // ============================================================

  async function handleDeadlineChange(notaId: string, itemId: string, deadline: string) {
    const ok = await atualizarItemDeadline(itemId, deadline || null);
    if (ok) {
      setNotas((prev) =>
        prev.map((n) =>
          n.id === notaId
            ? { ...n, itens: n.itens?.map((i) => (i.id === itemId ? { ...i, deadline: deadline || null } : i)) }
            : n
        )
      );
    }
  }

  // ============================================================
  // AÇÕES: ARQUIVAR / EXCLUIR NOTA
  // ============================================================

  async function handleArquivarNota(notaId: string) {
    if (!confirm("Arquivar esta nota?")) return;
    const ok = await arquivarNota(notaId);
    if (ok) setNotas((prev) => prev.filter((n) => n.id !== notaId));
  }

  async function handleExcluirNota(notaId: string) {
    if (!confirm("Excluir esta nota e todos os itens permanentemente?")) return;
    const ok = await excluirNota(notaId);
    if (ok) setNotas((prev) => prev.filter((n) => n.id !== notaId));
  }

  // ============================================================
  // RENDER
  // ============================================================

  if (loading) {
    return (
      <div className={`${LAYOUT.pageContainer} ${LAYOUT.sectionGap}`}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className={`${LAYOUT.pageContainer} ${LAYOUT.sectionGap}`}>
      {/* ====== HEADER ====== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className={TYPOGRAPHY.pageTitle}>
            <ListChecks className="inline w-5 h-5 mr-1.5 text-primary" />
            Checklist
          </h1>
          <p className={TYPOGRAPHY.pageSubtitle}>Gerencie tarefas, menções e checklists da equipe</p>
        </div>
        {activeTab === "checklists" && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowQuickAdd(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              <ClipboardPaste size={16} />
              Colar Checklist
            </button>
            <button
              onClick={() => setShowTemplateSelector(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm"
            >
              <CheckSquare size={16} />
              Modelos
            </button>
            <button
              onClick={() => setShowCriarNota(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark text-sm"
            >
              <Plus size={16} />
              Nova Nota
            </button>
          </div>
        )}
      </div>

      {/* ====== ABAS ====== */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("checklists")}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === "checklists"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <ListChecks size={15} />
          Checklists
        </button>
        <button
          onClick={() => setActiveTab("notas")}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === "notas"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <ListChecks size={15} />
          Guia (Notas)
        </button>
      </div>

      {/* ====== CONTEÚDO DA ABA NOTAS ====== */}
      {activeTab === "notas" && <NotasKeepTab />}

      {/* ====== CONTEÚDO DA ABA CHECKLISTS (oculto quando na aba notas) ====== */}
      {activeTab === "checklists" && <>

      {/* ====== STATS ====== */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white rounded-lg border p-3 text-center">
          <p className="text-lg font-bold text-amber-600">{stats.pendentes}</p>
          <p className="text-[10px] text-gray-500">Pendentes</p>
        </div>
        <div className="bg-white rounded-lg border p-3 text-center">
          <p className="text-lg font-bold text-emerald-600">{stats.concluidos}</p>
          <p className="text-[10px] text-gray-500">Concluídos</p>
        </div>
        <div className="bg-white rounded-lg border p-3 text-center">
          <p className="text-lg font-bold text-teal-600">{stats.mencoesCount}</p>
          <p className="text-[10px] text-gray-500">Menções</p>
        </div>
        <div className="bg-white rounded-lg border p-3 text-center">
          <p className="text-lg font-bold text-red-600">{stats.atrasados}</p>
          <p className="text-[10px] text-gray-500">Atrasados</p>
        </div>
        <div className="bg-white rounded-lg border p-3 text-center col-span-2 sm:col-span-1">
          <p className="text-lg font-bold text-blue-600">{stats.progresso}%</p>
          <p className="text-[10px] text-gray-500">Progresso</p>
        </div>
      </div>

      {/* ====== FILTROS ====== */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={14} className="text-gray-400" />
        {(["minhas", "mencionado", ...(isAdminOuMaster ? ["todas" as const] : [])] as FiltroChecklist[]).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              filtro === f
                ? "bg-primary text-white border-primary"
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
            }`}
          >
            {f === "minhas" ? "Minhas" : f === "mencionado" ? "Mencionado" : "Todas"}
          </button>
        ))}
      </div>

      {/* ====== LISTA DE NOTAS ====== */}
      {notas.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <CheckSquare size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm mb-3">Nenhum checklist encontrado</p>
          <button
            onClick={() => setShowCriarNota(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark text-sm"
          >
            Criar Primeiro Checklist
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {notas.map((nota) => {
            const isExpanded = expandedNota === nota.id;
            const itens = nota.itens || [];
            const totalItens = itens.length;
            const concluidos = itens.filter((i) => i.checked).length;
            const progresso = totalItens > 0 ? Math.round((concluidos / totalItens) * 100) : 0;

            return (
              <div
                key={nota.id}
                className="bg-white border rounded-lg overflow-hidden"
                style={{ borderLeftColor: nota.cor, borderLeftWidth: 4 }}
              >
                {/* ---- HEADER DA NOTA ---- */}
                <div
                  className="p-3 bg-gray-50 border-b cursor-pointer hover:bg-gray-100"
                  onClick={() => setExpandedNota(isExpanded ? null : nota.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      {editingNotaTituloId === nota.id ? (
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editingNotaTitulo}
                            onChange={(e) => setEditingNotaTitulo(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") { e.preventDefault(); handleSaveNotaTitulo(nota.id); }
                              if (e.key === "Escape") { setEditingNotaTituloId(null); setEditingNotaTitulo(""); }
                            }}
                            className="w-full border rounded px-2 py-1 text-sm font-medium"
                            autoFocus
                          />
                          <button type="button" onClick={() => handleSaveNotaTitulo(nota.id)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Salvar">
                            <Check size={14} />
                          </button>
                          <button type="button" onClick={() => { setEditingNotaTituloId(null); setEditingNotaTitulo(""); }} className="p-1 text-gray-500 hover:bg-gray-100 rounded" title="Cancelar">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-medium text-gray-800 truncate">{nota.titulo}</h3>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setEditingNotaTituloId(nota.id); setEditingNotaTitulo(nota.titulo); }}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded flex-shrink-0"
                            title="Editar título"
                          >
                            <Pencil size={12} />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progresso}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                          {concluidos}/{totalItens} ({progresso}%)
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                        <span>{nota.criado_por_nome}</span>
                        {nota.vinculo_id && (
                          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">Cliente vinculado</span>
                        )}
                      </div>
                    </div>

                    {/* Botões de açÍo no header */}
                    <div className="ml-3 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => { setExpandedNota(nota.id); setBulkMentionNotaId(nota.id); setBulkMentionText(""); }}
                        className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded"
                        title="Mencionar em todos os itens"
                      >
                        <AtSign size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => { setExpandedNota(nota.id); setAddingItemNotaId(nota.id); setNovoItemTexto(""); }}
                        className="p-1.5 text-green-700 hover:bg-green-50 rounded"
                        title="Adicionar item"
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => { setQuickAddNotaId(nota.id); setShowQuickAdd(true); setQuickAddText(""); }}
                        className="p-1.5 text-blue-700 hover:bg-blue-50 rounded"
                        title="Colar itens nesta nota"
                      >
                        <ClipboardPaste size={14} />
                      </button>
                      <button onClick={() => handleArquivarNota(nota.id)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title="Arquivar">
                        <Archive size={14} />
                      </button>
                      <button onClick={() => handleExcluirNota(nota.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Excluir">
                        <Trash2 size={14} />
                      </button>
                      <button type="button" className="p-1.5 text-gray-400">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ---- CONTEÚDO EXPANDIDO ---- */}
                {isExpanded && (
                  <div className="p-3 space-y-2">
                    {/* Bulk Mention input */}
                    {bulkMentionNotaId === nota.id && (
                      <div className="relative flex items-center gap-1.5 p-2 bg-emerald-50 rounded border border-emerald-200">
                        <input
                          type="text"
                          value={bulkMentionText}
                          onChange={(e) => { setBulkMentionText(e.target.value); setShowBulkMentionSuggestions(true); }}
                          onFocus={() => setShowBulkMentionSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowBulkMentionSuggestions(false), 120)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { e.preventDefault(); handleBulkMention(nota.id); }
                            if (e.key === "Escape") { setBulkMentionNotaId(null); setBulkMentionText(""); }
                          }}
                          className="w-full border rounded px-2 py-1 text-sm"
                          placeholder="Ex.: @Wellington de Melo"
                          autoFocus
                        />
                        {showBulkMentionSuggestions && pessoasMencaoFiltradas.length > 0 && (
                          <div className="absolute top-full left-0 mt-1 z-20 w-[320px] max-h-44 overflow-auto rounded border bg-white shadow-lg">
                            {pessoasMencaoFiltradas.map((pessoa) => (
                              <button
                                key={pessoa.id}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { setBulkMentionText(`@${pessoa.nome}`); setShowBulkMentionSuggestions(false); }}
                                className="w-full text-left px-3 py-2 hover:bg-emerald-50"
                              >
                                <p className="text-sm text-gray-800">{pessoa.nome}</p>
                                <p className="text-[11px] text-gray-500">
                                  {pessoa.tipo || "pessoa"}{pessoa.cargo ? ` • ${pessoa.cargo}` : ""}
                                </p>
                              </button>
                            ))}
                          </div>
                        )}
                        <button type="button" onClick={() => handleBulkMention(nota.id)} className="p-1 text-emerald-700 hover:bg-emerald-100 rounded" title="Aplicar mençÍo em todos itens">
                          <Check size={14} />
                        </button>
                        <button type="button" onClick={() => { setBulkMentionNotaId(null); setBulkMentionText(""); }} className="p-1 text-gray-500 hover:bg-gray-100 rounded" title="Cancelar">
                          <X size={14} />
                        </button>
                      </div>
                    )}

                    {/* Input para novo item */}
                    {addingItemNotaId === nota.id && (
                      <div className="p-2 bg-green-50 rounded border border-green-200 space-y-2">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={novoItemTexto}
                            onChange={(e) => setNovoItemTexto(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") { e.preventDefault(); handleAdicionarItem(nota.id); }
                              if (e.key === "Escape") { setAddingItemNotaId(null); setNovoItemTexto(""); }
                            }}
                            className="flex-1 border rounded px-2 py-1 text-sm"
                            placeholder="Novo item (use @nome para mencionar)..."
                            autoFocus
                          />
                          <button type="button" onClick={() => handleAdicionarItem(nota.id)} className="p-1 text-green-700 hover:bg-green-100 rounded" title="Salvar">
                            <Check size={14} />
                          </button>
                          <button type="button" onClick={() => { setAddingItemNotaId(null); setNovoItemTexto(""); }} className="p-1 text-gray-500 hover:bg-gray-100 rounded" title="Cancelar">
                            <X size={14} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={novoItemDeadline}
                            onChange={(e) => setNovoItemDeadline(e.target.value)}
                            className="border rounded px-2 py-0.5 text-xs"
                          />
                          <select
                            value={novoItemPrioridade}
                            onChange={(e) => setNovoItemPrioridade(e.target.value as "baixa" | "media" | "alta")}
                            className="border rounded px-2 py-0.5 text-xs"
                          >
                            <option value="baixa">Baixa</option>
                            <option value="media">Média</option>
                            <option value="alta">Alta</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Header de datas */}
                    {itens.length > 0 && (
                      <div className="flex justify-end">
                        <div className="w-[120px] text-[10px] text-gray-500 font-medium text-center">Deadline</div>
                      </div>
                    )}

                    {/* Itens do checklist */}
                    {itens.length > 0 ? (
                      itens.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer group"
                          onClick={() => { if (editingItemId !== item.id) handleToggleItem(nota.id, item); }}
                        >
                          <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${item.checked ? "bg-primary border-blue-600" : "border-gray-300 bg-white"}`}>
                            {item.checked && <Check size={14} className="text-white" />}
                          </div>

                          {editingItemId === item.id ? (
                            <div className="flex-1 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={editingItemText}
                                onChange={(e) => setEditingItemText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") { e.preventDefault(); handleSaveItemText(nota.id, item.id); }
                                  if (e.key === "Escape") { setEditingItemId(null); setEditingItemText(""); }
                                }}
                                className="w-full border rounded px-2 py-1 text-sm"
                                autoFocus
                              />
                              <button type="button" onClick={() => handleSaveItemText(nota.id, item.id)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Salvar">
                                <Check size={14} />
                              </button>
                              <button type="button" onClick={() => { setEditingItemId(null); setEditingItemText(""); }} className="p-1 text-gray-500 hover:bg-gray-100 rounded" title="Cancelar">
                                <X size={14} />
                              </button>
                              <button type="button" onClick={() => handleExcluirItem(nota.id, item.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Excluir">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex-1 flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                <span className={`text-sm ${item.checked ? "text-gray-400 line-through" : "text-gray-800"}`}>
                                  {renderTextoComMencoes(item.texto)}
                                </span>

                                {item.prioridade === "alta" && (
                                  <span className="text-[9px] px-1 py-0.5 rounded bg-red-100 text-red-700 flex-shrink-0">Alta</span>
                                )}

                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setEditingItemId(item.id); setEditingItemText(item.texto); }}
                                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 flex-shrink-0"
                                  title="Editar item"
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleExcluirItem(nota.id, item.id); }}
                                  className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 flex-shrink-0"
                                  title="Excluir item"
                                >
                                  <Trash2 size={12} />
                                </button>

                                {mencaoReconhecidaItemId === item.id && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 animate-pulse flex-shrink-0">
                                    MençÍo reconhecida
                                  </span>
                                )}
                              </div>

                              <div className="shrink-0 w-[120px]" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="date"
                                  value={item.deadline ? item.deadline.slice(0, 10) : ""}
                                  onChange={(e) => handleDeadlineChange(nota.id, item.id, e.target.value)}
                                  className={`w-full border rounded px-1.5 py-0 h-[22px] text-[10px] ${
                                    item.deadline && !item.checked && new Date(item.deadline) < new Date()
                                      ? "border-red-300 text-red-600"
                                      : "text-gray-700"
                                  }`}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-400 text-sm py-4">Nenhum item nesta nota</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ====== MODAL: CRIAR NOTA ====== */}
      {showCriarNota && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-800">Nova Nota / Checklist</h3>
              <button type="button" onClick={() => setShowCriarNota(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                  type="text"
                  value={novaNota.titulo}
                  onChange={(e) => setNovaNota((prev) => ({ ...prev, titulo: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Nome do checklist..."
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DescriçÍo (opcional)</label>
                <textarea
                  value={novaNota.descricao}
                  onChange={(e) => setNovaNota((prev) => ({ ...prev, descricao: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  rows={2}
                  placeholder="DescriçÍo..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(CORES_NOTAS).map(([nome, hex]) => (
                    <button
                      key={nome}
                      type="button"
                      onClick={() => setNovaNota((prev) => ({ ...prev, cor: hex }))}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${novaNota.cor === hex ? "border-gray-800 scale-110" : "border-gray-300"}`}
                      style={{ backgroundColor: hex }}
                      title={nome}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vincular a cliente (opcional)</label>
                <select
                  value={novaNota.vinculo_id}
                  onChange={(e) => setNovaNota((prev) => ({ ...prev, vinculo_id: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Sem vínculo</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button type="button" onClick={() => setShowCriarNota(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm">
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCriarNota}
                disabled={criandoNota || !novaNota.titulo.trim()}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 text-sm"
              >
                {criandoNota ? "Criando..." : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}

      </> /* fim aba checklists */}

      {/* ====== MODAL: TEMPLATE SELECTOR ====== */}
      {showTemplateSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-800">Selecionar Modelo</h3>
              <button type="button" onClick={() => setShowTemplateSelector(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {templates.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Nenhum modelo disponível</p>
              ) : (
                <div className="space-y-2">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleApplyTemplate(template.id)}
                      className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getNucleoColor(template.nucleo || "geral")}`} />
                        <div>
                          <p className="font-medium text-gray-800">{template.nome}</p>
                          <p className="text-xs text-gray-500 capitalize">{template.nucleo || "geral"}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t flex justify-end">
              <button type="button" onClick={() => setShowTemplateSelector(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== MODAL: QUICK ADD (Colar Checklist) ====== */}
      {showQuickAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                  <ClipboardPaste size={20} className="text-green-600" />
                  {quickAddNotaId ? "Colar Itens na Nota" : "Criar Checklist Rápido"}
                </h3>
                <p className="text-sm text-gray-500 mt-1">Cada linha será um item do checklist</p>
              </div>
              <button type="button" onClick={() => { setShowQuickAdd(false); setQuickAddText(""); setQuickAddName(""); setQuickAddNotaId(null); }} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {!quickAddNotaId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Checklist (opcional)</label>
                  <input
                    type="text"
                    value={quickAddName}
                    onChange={(e) => setQuickAddName(e.target.value)}
                    placeholder={`Checklist ${new Date().toLocaleDateString("pt-BR")}`}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Itens</label>
                <textarea
                  ref={textareaRef}
                  value={quickAddText}
                  onChange={(e) => setQuickAddText(e.target.value)}
                  placeholder={"Cole aqui sua lista de tarefas...\n\nExemplo:\nVerificar medidas do ambiente\nConfirmar cores com cliente\nSolicitar aprovaçÍo do projeto"}
                  rows={8}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-sm"
                  autoFocus
                />
                {quickAddText && (
                  <p className="text-sm text-gray-500 mt-1">{contarLinhas()} item(s) será(Ío) criado(s)</p>
                )}
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setShowQuickAdd(false); setQuickAddText(""); setQuickAddName(""); setQuickAddNotaId(null); }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm"
                disabled={creatingQuickAdd}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleQuickAdd}
                disabled={creatingQuickAdd || !quickAddText.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 text-sm"
              >
                {creatingQuickAdd ? (
                  <><Loader2 size={16} className="animate-spin" /> Criando...</>
                ) : (
                  <><Check size={16} /> {quickAddNotaId ? "Adicionar Itens" : "Criar Checklist"}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

