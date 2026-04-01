/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { normalizeSearchTerm } from "@/utils/searchUtils";
import { recalcularPreco } from "@/lib/precificacaoUtils";
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  Tag,
  FolderTree,
  Save,
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  Package,
  GripVertical,
  X,
  Check,
  Palette,
  Move,
  ArrowDownToLine,
  GitCompare,
  MoreVertical,
  ChevronLeft,
  Pencil,
  Layers,
  Calculator,
  List,
  LayoutGrid,
  ArrowRightLeft,
} from "lucide-react";
import {
  CATEGORIAS_CONFIG,
  getCorCategoria,
  getCorClaraCategoria,
  getCodigoCategoria,
  gerarCodigoItem,
} from "@/config/categoriasConfig";
import {
  listarCategorias,
  listarSubcategorias,
  criarCategoria,
  atualizarCategoria,
  atualizarItem,
  criarItem,
  deletarCategoria,
  criarSubcategoria,
  atualizarSubcategoria,
  deletarSubcategoria,
  buscarFluxoCategoriaBackend,
  salvarFluxoCategoriaBackend,
  listarItensComFiltros,
  salvarGuiasCategoria,
  deletarItem,
} from "@/lib/pricelistApi";
import { sincronizarItensPorPricelistItem } from "@/lib/propostasApi";
import GuiasReordenaveis from "@/components/GuiasReordenaveis";
import { getTipoItemColor, getTipoItemLabel, type TipoPricelist, type PricelistItemCompleto } from "@/types/pricelist";

// ============================================================
// TIPOS
// ============================================================

interface CategoriaDB {
  id: string;
  nome: string;
  codigo?: string;
  tipo?: string;
  ativo?: boolean;
  ordem?: number;
  cor?: string;
  guias?: string[];
}

interface SubcategoriaDB {
  id: string;
  nome: string;
  categoria_id: string;
  tipo?: string;
  ordem?: number;
  ativo?: boolean;
}

interface ContagemItens {
  categoria_id: string;
  subcategoria_id: string | null;
  total: number;
}

interface ItemFormData {
  id: string;
  nome: string;
  codigo: string;
  unidade: string;
  preco: number;
  custo_aquisicao: number;
  nucleo_id: string;
  tipo: string;
  ativo: boolean;
  categoria_id: string;
  subcategoria_id: string;
  categoria_original_id: string;
}

const SUBCATEGORIAS_WORKFLOW_PADRAO: Array<{
  nome: string;
  prefixo: string;
  tipo: TipoPricelist;
}> = [
  { nome: "AçÍo", prefixo: "ACA", tipo: "servico" },
  { nome: "Epi", prefixo: "EPI", tipo: "material" },
  { nome: "Insumo", prefixo: "INS", tipo: "material" },
  { nome: "Ferramenta", prefixo: "FER", tipo: "material" },
  { nome: "Infraestrutura", prefixo: "INF", tipo: "material" },
  { nome: "Material Cinza", prefixo: "MCI", tipo: "material" },
  { nome: "Acabamento", prefixo: "ACB", tipo: "material" },
  { nome: "Produto", prefixo: "PRO", tipo: "produto" },
];

const SUBCATEGORIA_CORES_REPRESENTACAO: Record<string, { bg: string; text: string; border: string }> = {
  ACA: { bg: "#FFF7ED", text: "#C2410C", border: "#FDBA74" },
  EPI: { bg: "#EFF6FF", text: "#1D4ED8", border: "#93C5FD" },
  INS: { bg: "#FEF2F2", text: "#B91C1C", border: "#FCA5A5" },
  FER: { bg: "#F0FDF4", text: "#166534", border: "#86EFAC" },
  INF: { bg: "#EEF2FF", text: "#4338CA", border: "#A5B4FC" },
  MCI: { bg: "#F3F4F6", text: "#374151", border: "#D1D5DB" },
  ACB: { bg: "#FDF4FF", text: "#A21CAF", border: "#E879F9" },
  PRO: { bg: "#ECFDF5", text: "#047857", border: "#6EE7B7" },
};

const SUBCATEGORIA_ALIAS_COMANDOS: Record<string, string[]> = {
  ACA: ["acao", "ações", "executar", "execucao", "servico", "serviços", "atividade", "task", "etapa"],
  EPI: ["epi", "epis", "equipamento de protecao", "protecao individual", "luva", "capacete", "oculos", "mascara"],
  INS: ["insumo", "insumos", "consumivel", "consumiveis", "material de consumo", "cola", "fita", "selante"],
  FER: ["ferramenta", "ferramentas", "equipamento", "furadeira", "parafusadeira", "esmerilhadeira"],
  INF: ["infra", "infraestrutura", "tubulacao", "eletroduto", "cabeamento", "rede", "pre-instalacao"],
  MCI: ["material cinza", "mci", "cimento", "argamassa", "areia", "brita", "bloco", "alvenaria"],
  ACB: ["acabamento", "revestimento", "pintura", "textura", "massa corrida", "forro", "rodape"],
  PRO: ["produto", "produtos", "item final", "item comercial", "decoracao", "louca", "metal"],
};

function normalizarNomeAba(nome?: string | null): string {
  return (nome || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function resolverPadraoSubcategoria(nome?: string | null) {
  const alvo = normalizarNomeAba(nome);
  if (!alvo) return null;

  for (const padrao of SUBCATEGORIAS_WORKFLOW_PADRAO) {
    const nomePadrao = normalizarNomeAba(padrao.nome);
    const aliases = SUBCATEGORIA_ALIAS_COMANDOS[padrao.prefixo] || [];
    const bateNome = alvo === nomePadrao || alvo.includes(nomePadrao) || nomePadrao.includes(alvo);
    const bateAlias = aliases.some((alias) => {
      const a = normalizarNomeAba(alias);
      return a && (alvo === a || alvo.includes(a) || a.includes(alvo));
    });
    if (bateNome || bateAlias) return padrao;
  }

  return null;
}

function getInicialItem(nome?: string | null): string {
  const texto = (nome || "").trim();
  if (!texto) return "?";
  return texto.charAt(0).toUpperCase();
}

// Tipos para Drag & Drop
interface DragState {
  draggedId: string | null;
  draggedType: "categoria" | "subcategoria" | null;
  overId: string | null;
  overType: "categoria" | "subcategoria" | "between" | null;
  overPosition: "top" | "bottom" | "center" | null;
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function GerenciarCategoriasPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Estados principais
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Dados do banco
  const [categoriasDB, setCategoriasDB] = useState<CategoriaDB[]>([]);
  const [subcategoriasDB, setSubcategoriasDB] = useState<SubcategoriaDB[]>([]);
  const [contagemItens, setContagemItens] = useState<ContagemItens[]>([]);

  // UI States
  const [busca, setBusca] = useState("");
  const [categoriasComItensMatch, setCategoriasComItensMatch] = useState<Set<string>>(new Set());
  const [itensMatchPorCategoria, setItensMatchPorCategoria] = useState<Record<string, any[]>>({});
  const [buscandoItensGlobal, setBuscandoItensGlobal] = useState(false);
  const buscaGlobalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [expandidas, setExpandidas] = useState<Set<string>>(new Set());
  const [editandoCategoria, setEditandoCategoria] = useState<string | null>(null);
  const [novaCategoria, setNovaCategoria] = useState(false);

  // Form States
  const [formCategoria, setFormCategoria] = useState({
    nome: "",
    codigo: "",
    tipo: "material" as string,
    ordem: 0,
    cor: "#6B7280",
    ativo: true,
  });

  // Drag & Drop States
  const [dragState, setDragState] = useState<DragState>({
    draggedId: null,
    draggedType: null,
    overId: null,
    overType: null,
    overPosition: null,
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  // Relatório de mudanças em cascata
  const [relatorioMudancas, setRelatorioMudancas] = useState<{
    visivel: boolean;
    titulo: string;
    detalhes: string[];
  }>({ visivel: false, titulo: "", detalhes: [] });

  // Subcategorias expandidas e seus itens
  const [subcategoriasExpandidas, setSubcategoriasExpandidas] = useState<Set<string>>(new Set());
  const [itensSubcategoria, setItensSubcategoria] = useState<Record<string, any[]>>({});
  const [carregandoItens, setCarregandoItens] = useState<string | null>(null);

  // Estados para gerenciar abas de subcategorias
  const [editandoSubcategoriaAba, setEditandoSubcategoriaAba] = useState<string | null>(null);
  const [nomeSubcategoriaEditando, setNomeSubcategoriaEditando] = useState("");
  const [criandoSubcategoriaAba, setCriandoSubcategoriaAba] = useState<string | null>(null); // categoria_id
  const [nomeNovaSubcategoria, setNomeNovaSubcategoria] = useState("");
  const [menuAbaAberto, setMenuAbaAberto] = useState<string | null>(null);
  const [itemEditando, setItemEditando] = useState<ItemFormData | null>(null);
  const [edicaoRapida, setEdicaoRapida] = useState<Record<string, { preco: string; unidade: string }>>({});
  const [salvandoInlineItem, setSalvandoInlineItem] = useState<Record<string, boolean>>({});
  const [buscaItensPorCategoria, setBuscaItensPorCategoria] = useState<Record<string, string>>({});
  const [resultadosBuscaItens, setResultadosBuscaItens] = useState<Record<string, any[]>>({});
  const [buscandoItensCat, setBuscandoItensCat] = useState<string | null>(null);
  const buscaItensTimerRef = useRef<Record<string, NodeJS.Timeout>>({});
  const [novoItemRapidoPorCategoria, setNovoItemRapidoPorCategoria] = useState<
    Record<string, { nome: string; codigo: string; unidade: string; preco: string; tipo: TipoPricelist }>
  >({});
  const [salvandoNovoItemRapido, setSalvandoNovoItemRapido] = useState<Record<string, boolean>>({});
  const [padronizacaoAutomaticaExecutada, setPadronizacaoAutomaticaExecutada] = useState(false);

  // Sistema de abas por categoria (raiz + subcategorias)
  const [abaAtivaPorCategoria, setAbaAtivaPorCategoria] = useState<Record<string, string>>({});
  const [itensRaiz, setItensRaiz] = useState<Record<string, any[]>>({});
  const [carregandoRaiz, setCarregandoRaiz] = useState<string | null>(null);

  // SeleçÍo múltipla para classificaçÍo em lote
  const [itensSelecionados, setItensSelecionados] = useState<Record<string, Set<string>>>({});

  // Recalcular preços de venda
  const [recalculando, setRecalculando] = useState(false);
  const [recalcProgressText, setRecalcProgressText] = useState("");

  // Vista: categorias vs lista geral
  const [vistaAtual, setVistaAtual] = useState<"categorias" | "lista">("categorias");
  const [itensListaGeral, setItensListaGeral] = useState<any[]>([]);
  const [carregandoListaGeral, setCarregandoListaGeral] = useState(false);
  const [buscaListaGeral, setBuscaListaGeral] = useState("");
  const [paginaListaGeral, setPaginaListaGeral] = useState(0);
  const ITENS_POR_PAGINA_LISTA = 50;
  const [migrando, setMigrando] = useState(false);
  const [migrProgressText, setMigrProgressText] = useState("");

  // Modal de gerenciamento de fluxos
  const [modalFluxosAberto, setModalFluxosAberto] = useState(false);
  const [categoriaFluxoSelecionada, setCategoriaFluxoSelecionada] = useState<string | null>(null);
  const [fluxoAtual, setFluxoAtual] = useState<{
    fases: Array<{
      id: string;
      nome: string;
      descricao: string;
      tarefas: Array<{
        id: string;
        nome: string;
        descricao: string;
        tempoEstimadoMinutos: number;
        recursos: Array<{
          id: string;
          itemId: string;
          tipo: 'ferramenta' | 'insumo' | 'epi' | 'materialCinza' | 'acabamento' | 'produto';
          quantidade: number;
          itemNome?: string;
          itemCodigo?: string;
        }>;
      }>;
    }>;
  }>({ fases: [] });
  const [editandoFase, setEditandoFase] = useState<string | null>(null);
  const [editandoTarefa, setEditandoTarefa] = useState<{ faseId: string; tarefaId: string } | null>(null);
  const [itensCategoria, setItensCategoria] = useState<PricelistItemCompleto[]>([]);
  const [carregandoFluxo, setCarregandoFluxo] = useState(false);
  const [flowIdAtual, setFlowIdAtual] = useState<string | null>(null);
  const [buscaItens, setBuscaItens] = useState("");
  const [itemArrastando, setItemArrastando] = useState<PricelistItemCompleto | null>(null);
  const [autoFluxoPreset, setAutoFluxoPreset] = useState<"agil" | "essencial" | "completo">("essencial");
  const [autoFluxoQtdFases, setAutoFluxoQtdFases] = useState<2 | 3 | 4 | 5>(3);
  const [autoFluxoIntensidade, setAutoFluxoIntensidade] = useState<"baixa" | "media" | "alta">("media");

  // Funções para gerenciar recursos
  const adicionarRecursoNaTarefa = (faseId: string, tarefaId: string, item: PricelistItemCompleto, tipo: 'ferramenta' | 'insumo' | 'epi' | 'materialCinza' | 'acabamento' | 'produto') => {
    setFluxoAtual(prev => ({
      fases: prev.fases.map(f =>
        f.id === faseId
          ? {
              ...f,
              tarefas: f.tarefas.map(t =>
                t.id === tarefaId
                  ? {
                      ...t,
                      recursos: [
                        ...t.recursos,
                        {
                          id: `recurso-${Date.now()}`,
                          itemId: item.id,
                          tipo,
                          quantidade: 1,
                          itemNome: item.nome,
                          itemCodigo: item.codigo || undefined,
                        }
                      ]
                    }
                  : t
              )
            }
          : f
      )
    }));
  };

  const removerRecurso = (faseId: string, tarefaId: string, recursoId: string) => {
    setFluxoAtual(prev => ({
      fases: prev.fases.map(f =>
        f.id === faseId
          ? {
              ...f,
              tarefas: f.tarefas.map(t =>
                t.id === tarefaId
                  ? { ...t, recursos: t.recursos.filter(r => r.id !== recursoId) }
                  : t
              )
            }
          : f
      )
    }));
  };

  const atualizarQuantidadeRecurso = (faseId: string, tarefaId: string, recursoId: string, quantidade: number) => {
    setFluxoAtual(prev => ({
      fases: prev.fases.map(f =>
        f.id === faseId
          ? {
              ...f,
              tarefas: f.tarefas.map(t =>
                t.id === tarefaId
                  ? {
                      ...t,
                      recursos: t.recursos.map(r =>
                        r.id === recursoId ? { ...r, quantidade } : r
                      )
                    }
                  : t
              )
            }
          : f
      )
    }));
  };

  const atualizarTipoRecurso = (faseId: string, tarefaId: string, recursoId: string, tipo: 'ferramenta' | 'insumo' | 'epi' | 'materialCinza' | 'acabamento' | 'produto') => {
    setFluxoAtual(prev => ({
      fases: prev.fases.map(f =>
        f.id === faseId
          ? {
              ...f,
              tarefas: f.tarefas.map(t =>
                t.id === tarefaId
                  ? {
                      ...t,
                      recursos: t.recursos.map(r =>
                        r.id === recursoId ? { ...r, tipo } : r
                      )
                    }
                  : t
              )
            }
          : f
      )
    }));
  };

  // Filtrar itens por busca
  const itensFiltrados = itensCategoria.filter(item => {
    if (!buscaItens) return true;
    const busca = normalizeSearchTerm(buscaItens);
    return (
      normalizeSearchTerm(item.nome).includes(busca) ||
      normalizeSearchTerm(item.codigo || "").includes(busca) ||
      normalizeSearchTerm(item.subcategoria?.nome || "").includes(busca)
    );
  });

  const mapearPrefixoParaTipoRecurso = (
    prefixo: string
  ): "ferramenta" | "insumo" | "epi" | "materialCinza" | "acabamento" | "produto" => {
    const tipoPorPrefixo: Record<string, "ferramenta" | "insumo" | "epi" | "materialCinza" | "acabamento" | "produto"> = {
      ACA: "acabamento",
      EPI: "epi",
      INS: "insumo",
      FER: "ferramenta",
      INF: "materialCinza",
      MCI: "materialCinza",
      ACB: "acabamento",
      PRO: "produto",
    };
    return tipoPorPrefixo[prefixo] || "insumo";
  };

  const construirFluxoAutomatico = () => {
    const categoria = categoriasDB.find((cat) => cat.id === categoriaFluxoSelecionada);
    if (!categoriaFluxoSelecionada || !categoria) {
      toast({
        title: "Selecione uma categoria",
        description: "Escolha uma categoria antes de montar o fluxo automático.",
        variant: "destructive",
      });
      return;
    }

    const modelos: Record<"agil" | "essencial" | "completo", string[]> = {
      agil: ["ExecuçÍo", "Entrega"],
      essencial: ["PreparaçÍo", "ExecuçÍo", "FinalizaçÍo"],
      completo: ["Planejamento", "PreparaçÍo", "ExecuçÍo", "Acabamento", "Entrega"],
    };
    const fasesBase = modelos[autoFluxoPreset];
    const nomesFases = fasesBase.slice(0, autoFluxoQtdFases);
    while (nomesFases.length < autoFluxoQtdFases) {
      nomesFases.push(`Fase ${nomesFases.length + 1}`);
    }

    const limiteRecursos =
      autoFluxoIntensidade === "baixa" ? 2 : autoFluxoIntensidade === "media" ? 4 : 7;
    const tempoBase =
      autoFluxoIntensidade === "baixa" ? 45 : autoFluxoIntensidade === "media" ? 90 : 150;

    const grupos = new Map<string, { nome: string; itens: PricelistItemCompleto[] }>();
    for (const item of itensCategoria) {
      const padrao = resolverPadraoSubcategoria(item.subcategoria?.nome || "");
      const chave = padrao?.prefixo || "RAIZ";
      const nomeGrupo = padrao?.nome || "Categoria Raiz";
      if (!grupos.has(chave)) grupos.set(chave, { nome: nomeGrupo, itens: [] });
      grupos.get(chave)!.itens.push(item);
    }

    const ordemGrupos = ["INF", "EPI", "FER", "MCI", "INS", "ACA", "ACB", "PRO", "RAIZ"];
    const gruposOrdenados = ordemGrupos
      .filter((prefixo) => grupos.has(prefixo))
      .map((prefixo) => ({ prefixo, dados: grupos.get(prefixo)! }));

    const fasesMontadas = nomesFases.map((nomeFase, idxFase) => ({
      id: `fase-auto-${Date.now()}-${idxFase}`,
      nome: nomeFase,
      descricao: `Fluxo automático (${autoFluxoPreset})`,
      tarefas: [] as Array<{
        id: string;
        nome: string;
        descricao: string;
        tempoEstimadoMinutos: number;
        recursos: Array<{
          id: string;
          itemId: string;
          tipo: "ferramenta" | "insumo" | "epi" | "materialCinza" | "acabamento" | "produto";
          quantidade: number;
          itemNome?: string;
          itemCodigo?: string;
        }>;
      }>,
    }));

    gruposOrdenados.forEach((grupo, index) => {
      const faseDestino = fasesMontadas[index % fasesMontadas.length];
      const recursos = grupo.dados.itens.slice(0, limiteRecursos).map((item, recursoIndex) => ({
        id: `recurso-auto-${Date.now()}-${index}-${recursoIndex}`,
        itemId: item.id,
        tipo: mapearPrefixoParaTipoRecurso(grupo.prefixo),
        quantidade: 1,
        itemNome: item.nome,
        itemCodigo: item.codigo || undefined,
      }));

      faseDestino.tarefas.push({
        id: `tarefa-auto-${Date.now()}-${index}`,
        nome: grupo.prefixo === "RAIZ" ? "ClassificaçÍo da Categoria Raiz" : `${grupo.dados.nome} - ExecuçÍo`,
        descricao:
          grupo.prefixo === "RAIZ"
            ? "Itens sem subcategoria padrÍo. Revisar e classificar quando necessário."
            : `Tarefas baseadas nos itens de ${grupo.dados.nome}.`,
        tempoEstimadoMinutos: tempoBase,
        recursos,
      });
    });

    if (fasesMontadas.every((fase) => fase.tarefas.length === 0)) {
      fasesMontadas[0].tarefas.push({
        id: `tarefa-auto-${Date.now()}-fallback`,
        nome: "Levantamento inicial",
        descricao: "Fluxo criado sem itens vinculados. Inclua itens e gere novamente.",
        tempoEstimadoMinutos: 30,
        recursos: [],
      });
    }

    setFluxoAtual({ fases: fasesMontadas });
    toast({
      title: "Fluxo montado automaticamente",
      description: `${fasesMontadas.length} fases geradas para ${categoria.nome}.`,
    });
  };

  const MoverItemDropdown = ({
    item,
    categoriaAtual,
    categorias,
    subcategorias,
    subId,
    onMoverParaCategoria,
    onMoverParaSubcategoria,
  }: {
    item: any;
    categoriaAtual: CategoriaDB;
    categorias: CategoriaDB[];
    subcategorias: SubcategoriaDB[];
    subId: string | null;
    onMoverParaCategoria: (novaCategoriaId: string) => void;
    onMoverParaSubcategoria: (novaSubId: string) => void;
  }) => {
    const outrasCategorias = categorias.filter(c => c.id !== categoriaAtual.id);

    return (
      <div className="flex gap-1 items-center">
        <select
          className="text-[11px] border border-gray-200 rounded-lg px-2 py-1 bg-white"
          defaultValue=""
          onChange={e => {
            const novaCategoriaId = e.target.value;
            if (!novaCategoriaId) return;
            onMoverParaCategoria(novaCategoriaId);
            e.target.value = "";
          }}
          aria-label="Mover item para outra categoria"
        >
          <option value="">Categoria</option>
          {outrasCategorias.map(categoria => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nome}
            </option>
          ))}
        </select>
        <select
          className="text-[11px] border border-gray-200 rounded-lg px-2 py-1 bg-white"
          defaultValue=""
          onChange={e => {
            const novaSubId = e.target.value;
            if (!novaSubId || !subId) {
              e.target.value = "";
              return;
            }
            onMoverParaSubcategoria(novaSubId);
            e.target.value = "";
          }}
          aria-label="Mover item para subcategoria"
        >
          <option value="">Subcategoria</option>
          {subcategorias.map(sub => (
            <option key={sub.id} value={sub.id}>
              {sub.nome}
            </option>
          ))}
        </select>
      </div>
    );
  };

  // ============================================================
  // CARREGAMENTO DE DADOS
  // ============================================================

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      // Buscar categorias
      const categorias = await listarCategorias();
      const categoriasOrdenadas = [...categorias].sort((a, b) =>
        (a.ordem || 0) - (b.ordem || 0)
      );
      setCategoriasDB(categoriasOrdenadas.map((categoria) => ({
        ...categoria,
        codigo: categoria.codigo || undefined,
        tipo: categoria.tipo || undefined,
        cor: categoria.cor || undefined,
      })));

      // Buscar subcategorias
      const subcategorias = await listarSubcategorias();
      setSubcategoriasDB(subcategorias.map((subcategoria) => ({
        ...subcategoria,
        tipo: subcategoria.tipo || undefined,
      })));

      // Buscar contagem de itens por categoria/subcategoria
      const { data: itens } = await supabase
        .from("pricelist_itens")
        .select("categoria_id, subcategoria_id")
        .eq("ativo", true);

      // Criar set de subcategorias válidas para verificaçÍo
      const subcategoriasValidas = new Set(subcategorias.map(s => s.id));

      // Calcular contagem
      const contagem: ContagemItens[] = [];
      const contagemMap = new Map<string, number>();

      (itens || []).forEach((item: any) => {
        const catId = item.categoria_id || "sem";
        // Tratar como "sem" (raiz) se: null, vazio, ou ID inválido (não existe na tabela)
        const subId = item.subcategoria_id &&
                      item.subcategoria_id.trim() !== "" &&
                      subcategoriasValidas.has(item.subcategoria_id)
          ? item.subcategoria_id
          : "sem";
        const key = `${catId}_${subId}`;
        contagemMap.set(key, (contagemMap.get(key) || 0) + 1);
      });

      contagemMap.forEach((total, key) => {
        const [catId, subId] = key.split("_");
        contagem.push({
          categoria_id: catId === "sem" ? "" : catId,
          subcategoria_id: subId === "sem" ? null : subId,
          total,
        });
      });

      setContagemItens(contagem);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "não foi possível carregar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // FunçÍo que recarrega dados mantendo a posiçÍo do scroll
  const carregarDadosMantendoScroll = useCallback(async () => {
    // Salvar posiçÍo do scroll do container principal
    const container = document.querySelector('.layout-content');
    const scrollTop = container?.scrollTop || 0;

    await carregarDados();

    // Restaurar posiçÍo do scroll após um pequeno delay para garantir que o DOM atualizou
    requestAnimationFrame(() => {
      if (container) {
        container.scrollTop = scrollTop;
      }
    });
  }, [carregarDados]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Carregar fluxo e itens quando categoria for selecionada
  const carregarFluxoEItens = useCallback(async (categoriaId: string) => {
    if (!categoriaId) return;

    setCarregandoFluxo(true);
    try {
      // Buscar o fluxo da categoria diretamente do Supabase
      const { data: categoria, error } = await supabase
        .from('pricelist_categorias')
        .select('fluxo')
        .eq('id', categoriaId)
        .single();

      if (error) throw error;

      if (categoria?.fluxo) {
        // Categoria tem fluxo salvo
        setFluxoAtual({
          fases: categoria.fluxo.fases || []
        });
        setFlowIdAtual(categoria.fluxo.id || null);
      } else {
        // Categoria sem fluxo - iniciar vazio
        setFluxoAtual({ fases: [] });
        setFlowIdAtual(null);
      }

      // Buscar itens do pricelist da categoria
      const itens = await listarItensComFiltros({ categoria_id: categoriaId, apenas_ativos: true });
      setItensCategoria(itens);
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
      // Garantir que temos dados vazios mesmo em caso de erro
      setFluxoAtual({ fases: [] });
      setItensCategoria([]);
      setFlowIdAtual(null);

      toast({
        title: "Erro ao carregar dados",
        description: error.message || "não foi possível carregar os dados da categoria",
        variant: "destructive",
      });
    } finally {
      setCarregandoFluxo(false);
    }
  }, [toast]);

  // Executar quando a categoria for selecionada
  useEffect(() => {
    if (categoriaFluxoSelecionada) {
      carregarFluxoEItens(categoriaFluxoSelecionada);
    } else {
      setFluxoAtual({ fases: [] });
      setItensCategoria([]);
      setFlowIdAtual(null);
    }
  }, [categoriaFluxoSelecionada, carregarFluxoEItens]);

  // Fechar menu de aba ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuAbaAberto) {
        const target = e.target as HTMLElement;
        if (!target.closest('[data-menu-aba]')) {
          setMenuAbaAberto(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuAbaAberto]);

  // Salvar fluxo
  const salvarFluxo = async () => {
    if (!categoriaFluxoSelecionada) {
      toast({
        title: "Erro",
        description: "Nenhuma categoria selecionada",
        variant: "destructive",
      });
      return;
    }

    setSalvando(true);
    try {
      // Criar estrutura completa do fluxo com ID
      const flowId = flowIdAtual || `flow-${Date.now()}`;
      const fluxoCompleto = {
        id: flowId,
        nome: `Fluxo ${categoriasDB.find(c => c.id === categoriaFluxoSelecionada)?.nome || ''}`,
        descricao: `Fluxo de trabalho da categoria`,
        fases: fluxoAtual.fases,
      };

      // Salvar diretamente no Supabase
      const { error } = await supabase
        .from('pricelist_categorias')
        .update({ fluxo: fluxoCompleto })
        .eq('id', categoriaFluxoSelecionada);

      if (error) throw error;

      toast({
        title: "✅ Sucesso",
        description: "Fluxo salvo com sucesso!",
      });

      setFlowIdAtual(flowId);
      await carregarDados(); // Recarregar dados para atualizar a categoria
    } catch (error: any) {
      console.error("Erro ao salvar fluxo:", error);
      toast({
        title: "❌ Erro ao salvar",
        description: error.message || "não foi possível salvar o fluxo",
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  };

  // ============================================================
  // FUNÇÕES AUXILIARES
  // ============================================================

  const getContagemCategoria = (categoriaId: string) => {
    return contagemItens
      .filter(c => c.categoria_id === categoriaId)
      .reduce((acc, c) => acc + c.total, 0);
  };

  const getContagemSubcategoria = (categoriaId: string, subcategoriaId: string | null) => {
    const item = contagemItens.find(
      c => c.categoria_id === categoriaId && c.subcategoria_id === subcategoriaId
    );
    return item?.total || 0;
  };

  const toggleExpansao = (categoriaId: string) => {
    setExpandidas(prev => {
      const novo = new Set(prev);
      if (novo.has(categoriaId)) {
        novo.delete(categoriaId);
      } else {
        novo.add(categoriaId);
        // Inicializar na aba "raiz" e carregar itens
        if (!abaAtivaPorCategoria[categoriaId]) {
          setAbaAtivaPorCategoria(p => ({ ...p, [categoriaId]: "raiz" }));
          if (!itensRaiz[categoriaId]) {
            carregarItensRaiz(categoriaId);
          }
        }
      }
      return novo;
    });
  };

  const getSubcategoriasDaCategoria = (categoriaId: string) => {
    const ordemPadrao = new Map(
      SUBCATEGORIAS_WORKFLOW_PADRAO.map((sub, index) => [normalizarNomeAba(sub.nome), index])
    );

    return subcategoriasDB
      .filter(s => s.categoria_id === categoriaId)
      .sort((a, b) => {
        const aPadrao = ordemPadrao.get(normalizarNomeAba(a.nome));
        const bPadrao = ordemPadrao.get(normalizarNomeAba(b.nome));
        const aRank = aPadrao ?? 999;
        const bRank = bPadrao ?? 999;
        if (aRank !== bRank) return aRank - bRank;
        return (a.ordem || 0) - (b.ordem || 0);
      });
  };

  const getPrefixoSubcategoria = (nome: string) => {
    const match = resolverPadraoSubcategoria(nome);
    return match?.prefixo || nome.substring(0, 3).toUpperCase();
  };

  const gerarCodigoFormatado = (ordem: number, codigoCat: string, prefixoSub: string, numero: number) => {
    return `${String(ordem).padStart(3, "0")}/${codigoCat}/${prefixoSub}#${String(numero).padStart(3, "0")}`;
  };

  // ============================================================
  // CRUD CATEGORIAS
  // ============================================================

  const iniciarNovaCategoria = () => {
    const proximaOrdem = categoriasDB.length > 0
      ? Math.max(...categoriasDB.map(c => c.ordem || 0)) + 1
      : 1;

    setFormCategoria({
      nome: "",
      codigo: "",
      tipo: "material",
      ordem: proximaOrdem,
      cor: "#6B7280",
      ativo: true,
    });
    setNovaCategoria(true);
    setEditandoCategoria(null);
  };

  const iniciarEdicaoCategoria = (categoria: CategoriaDB) => {
    // Sempre usar o código do banco, não auto-gerar
    // Aplicar cor do config se banco tiver cor default/vazia
    const corConfig = getCorCategoria(categoria.nome);
    const corTipo = getTipoItemColor((categoria.tipo || "material") as TipoPricelist);
    const corDoBanco = categoria.cor && categoria.cor !== "#6B7280" && categoria.cor !== "#000000" ? categoria.cor : null;
    const corFinal = corDoBanco || (corConfig !== "#6B7280" ? corConfig : corTipo);

    setFormCategoria({
      nome: categoria.nome,
      codigo: categoria.codigo || "",
      tipo: categoria.tipo || "material",
      ordem: categoria.ordem || 0,
      cor: corFinal,
      ativo: categoria.ativo ?? true,
    });
    setEditandoCategoria(categoria.id);
    setNovaCategoria(false);
  };

  const cancelarEdicao = () => {
    setEditandoCategoria(null);
    setNovaCategoria(false);
    setFormCategoria({
      nome: "",
      codigo: "",
      tipo: "material",
      ordem: 0,
      cor: "#6B7280",
      ativo: true,
    });
  };

  // FunçÍo para gerar código único
  const gerarCodigoUnico = (codigoBase: string): string => {
    const codigoNormalizado = codigoBase.toUpperCase().trim();
    const codigosExistentes = categoriasDB.map(c => (c.codigo || "").toUpperCase());

    // Se o código base não existe, usar ele
    if (!codigosExistentes.includes(codigoNormalizado)) {
      return codigoNormalizado;
    }

    // Se existe, adicionar número sequencial
    let contador = 1;
    let codigoTentativa = `${codigoNormalizado}${contador}`;
    while (codigosExistentes.includes(codigoTentativa)) {
      contador++;
      codigoTentativa = `${codigoNormalizado}${contador}`;
    }
    return codigoTentativa;
  };

  const salvarCategoria = async () => {
    if (!formCategoria.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome da categoria é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    setSalvando(true);
    try {
      if (novaCategoria) {
        // Verificar código digitado manualmente
        const codigoDigitado = formCategoria.codigo.trim().toUpperCase();
        let codigoFinal: string;

        if (codigoDigitado) {
          // Código foi digitado manualmente - verificar se já existe
          const codigoEmUso = categoriasDB.find(
            c => (c.codigo || "").toUpperCase() === codigoDigitado
          );

          if (codigoEmUso) {
            toast({
              title: "Código duplicado",
              description: `O código "${codigoDigitado}" já está em uso pela categoria "${codigoEmUso.nome}".`,
              variant: "destructive",
            });
            setSalvando(false);
            return;
          }
          codigoFinal = codigoDigitado;
        } else {
          // Auto-gerar código único
          const codigoBase = formCategoria.nome.substring(0, 3).toUpperCase();
          codigoFinal = gerarCodigoUnico(codigoBase);
        }

        // Criar nova categoria com cor
        const novaCat = await criarCategoria({
          nome: formCategoria.nome.trim(),
          codigo: codigoFinal,
          tipo: formCategoria.tipo as any,
          ordem: formCategoria.ordem,
          ativo: formCategoria.ativo,
          cor: formCategoria.cor,
        });

        // Criar subcategorias padrÍo automaticamente
        for (let i = 0; i < SUBCATEGORIAS_WORKFLOW_PADRAO.length; i++) {
          const sub = SUBCATEGORIAS_WORKFLOW_PADRAO[i];
          await criarSubcategoria({
            categoria_id: novaCat.id,
            nome: sub.nome,
            tipo: sub.tipo,
            ordem: i + 1,
            ativo: true,
          });
        }

        toast({
          title: "Categoria criada",
          description: `"${formCategoria.nome}" (${codigoFinal}) criada com ${SUBCATEGORIAS_WORKFLOW_PADRAO.length} subcategorias padrÍo.`,
        });
      } else if (editandoCategoria) {
        // Buscar código original da categoria sendo editada
        const categoriaOriginal = categoriasDB.find(c => c.id === editandoCategoria);
        const codigoOriginal = (categoriaOriginal?.codigo || "").toUpperCase();
        const codigoAtual = formCategoria.codigo.trim().toUpperCase();

        // Só verificar duplicados se o código foi ALTERADO
        if (codigoOriginal !== codigoAtual) {
          const codigoEmUso = categoriasDB.find(
            c => c.id !== editandoCategoria && (c.codigo || "").toUpperCase() === codigoAtual
          );

          if (codigoEmUso) {
            toast({
              title: "Código duplicado",
              description: `O código "${codigoAtual}" já está em uso pela categoria "${codigoEmUso.nome}".`,
              variant: "destructive",
            });
            setSalvando(false);
            return;
          }
        }

        // Atualizar categoria existente (cor aplicada em todo sistema)
        await atualizarCategoria(editandoCategoria, {
          nome: formCategoria.nome.trim(),
          codigo: formCategoria.codigo.trim(),
          tipo: formCategoria.tipo as any,
          ordem: formCategoria.ordem,
          ativo: formCategoria.ativo,
          cor: formCategoria.cor,
        });

        toast({
          title: "Categoria atualizada",
          description: `"${formCategoria.nome}" foi atualizada.`,
        });
      }

      cancelarEdicao();
      await carregarDadosMantendoScroll();
    } catch (error) {
      console.error("Erro ao salvar categoria:", error);
      toast({
        title: "Erro",
        description: "não foi possível salvar a categoria.",
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  };

  const excluirCategoria = async (categoria: CategoriaDB) => {
    const totalItens = getContagemCategoria(categoria.id);
    if (totalItens > 0) {
      toast({
        title: "não é possível excluir",
        description: `Esta categoria possui ${totalItens} itens vinculados. Remova os itens primeiro.`,
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Deseja realmente excluir a categoria "${categoria.nome}"?`)) {
      return;
    }

    setSalvando(true);
    try {
      // Excluir subcategorias primeiro
      const subs = getSubcategoriasDaCategoria(categoria.id);
      for (const sub of subs) {
        await deletarSubcategoria(sub.id);
      }

      // Excluir categoria
      await deletarCategoria(categoria.id);

      toast({
        title: "Categoria excluída",
        description: `"${categoria.nome}" foi excluída.`,
      });

      await carregarDadosMantendoScroll();
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);
      toast({
        title: "Erro",
        description: "não foi possível excluir a categoria.",
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  };

  // Handler para salvar guias reordenadas/editadas
  const handleGuiasChange = useCallback(
    async (categoriaId: string, novasGuias: string[]) => {
      try {
        await salvarGuiasCategoria(categoriaId, novasGuias);
        setCategoriasDB((prev) =>
          prev.map((cat) =>
            cat.id === categoriaId ? { ...cat, guias: novasGuias } : cat
          )
        );
        toast({
          title: "Guias atualizadas",
          description: "As guias foram salvas com sucesso.",
        });
      } catch (error) {
        console.error("Erro ao salvar guias:", error);
        toast({
          title: "Erro",
          description: "não foi possível salvar as guias.",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  // ============================================================
  // CRUD SUBCATEGORIAS
  // ============================================================

  const adicionarSubcategoriaPadrao = async (categoriaId: string, categoria: CategoriaDB) => {
    const existentes = getSubcategoriasDaCategoria(categoriaId);
    const existentesNomes = new Set(existentes.map(s => normalizarNomeAba(s.nome)));

    const faltantes = SUBCATEGORIAS_WORKFLOW_PADRAO.filter(
      sub => !existentesNomes.has(normalizarNomeAba(sub.nome))
    );

    if (faltantes.length === 0) {
      toast({
        title: "Subcategorias completas",
        description: "Todas as subcategorias padrÍo já existem.",
      });
      return;
    }

    setSalvando(true);
    try {
      for (let i = 0; i < faltantes.length; i++) {
        const sub = faltantes[i];
        await criarSubcategoria({
          categoria_id: categoriaId,
          nome: sub.nome,
          tipo: sub.tipo,
          ordem: existentes.length + i + 1,
          ativo: true,
        });
      }

      toast({
        title: "Subcategorias adicionadas",
        description: `${faltantes.length} subcategorias foram adicionadas.`,
      });

      await carregarDadosMantendoScroll();
    } catch (error) {
      console.error("Erro ao adicionar subcategorias:", error);
      toast({
        title: "Erro",
        description: "não foi possível adicionar as subcategorias.",
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  };

  // ============================================================
  // SUBCATEGORIAS EXPANSÍVEIS
  // ============================================================

  const toggleSubcategoriaExpansao = async (subcategoriaId: string, categoriaId: string) => {
    setSubcategoriasExpandidas(prev => {
      const novo = new Set(prev);
      if (novo.has(subcategoriaId)) {
        novo.delete(subcategoriaId);
      } else {
        novo.add(subcategoriaId);
        // Carregar itens se ainda não carregados
        if (!itensSubcategoria[subcategoriaId]) {
          carregarItensSubcategoria(subcategoriaId, categoriaId);
        }
      }
      return novo;
    });
  };

  const carregarItensSubcategoria = async (subcategoriaId: string, categoriaId: string) => {
    setCarregandoItens(subcategoriaId);
    try {
      const { data, error } = await supabase
        .from("pricelist_itens")
        .select("id, nome, codigo, unidade, preco, tipo, ativo, categoria_id, subcategoria_id, imagem_url")
        .eq("categoria_id", categoriaId)
        .eq("subcategoria_id", subcategoriaId)
        .eq("ativo", true)
        .order("nome", { ascending: true })
        .limit(50);

      if (error) throw error;

      setItensSubcategoria(prev => ({
        ...prev,
        [subcategoriaId]: data || [],
      }));
    } catch (error) {
      console.error("Erro ao carregar itens:", error);
      toast({
        title: "Erro",
        description: "não foi possível carregar os itens.",
        variant: "destructive",
      });
    } finally {
      setCarregandoItens(null);
    }
  };

  // Carregar itens da raiz (sem subcategoria válida)
  // Busca itens onde subcategoria_id é NULL, vazio, ou inválido (não existe na tabela)
  const carregarItensRaiz = async (categoriaId: string) => {
    setCarregandoRaiz(categoriaId);
    try {
      // Buscar TODOS os itens da categoria
      const { data: todosItens, error } = await supabase
        .from("pricelist_itens")
        .select("id, nome, codigo, unidade, preco, tipo, ativo, subcategoria_id, imagem_url")
        .eq("categoria_id", categoriaId)
        .eq("ativo", true)
        .order("nome", { ascending: true })
        .limit(500);

      if (error) throw error;

      // Obter subcategorias válidas desta categoria
      const subcategoriasValidas = new Set(
        subcategoriasDB
          .filter(s => s.categoria_id === categoriaId)
          .map(s => s.id)
      );

      // Filtrar itens que estÍo na "raiz" (sem subcategoria válida)
      // Considera raiz: null, vazio, whitespace, ou ID que não existe
      const itensRaizFiltrados = (todosItens || []).filter(item => {
        const subId = item.subcategoria_id;
        // É raiz se: null, undefined, string vazia/whitespace, ou ID inválido
        if (!subId || subId.trim() === "") return true;
        if (!subcategoriasValidas.has(subId)) return true;
        return false;
      });

      setItensRaiz(prev => ({
        ...prev,
        [categoriaId]: itensRaizFiltrados,
      }));

      const nulos = itensRaizFiltrados.filter(i => !i.subcategoria_id).length;
      const invalidos = itensRaizFiltrados.filter(i => i.subcategoria_id && !subcategoriasValidas.has(i.subcategoria_id)).length;
      if (import.meta.env.DEV) console.log(`[Categoria Raiz] ${categoriaId}: ${itensRaizFiltrados.length} itens (${nulos} sem subcategoria + ${invalidos} com subcategoria inválida)`);
    } catch (error) {
      console.error("Erro ao carregar itens da raiz:", error);
      toast({
        title: "Erro",
        description: "não foi possível carregar os itens da categoria.",
        variant: "destructive",
      });
    } finally {
      setCarregandoRaiz(null);
    }
  };

  // Buscar TODOS os itens da categoria (cross-tab) para o campo de busca
  // Gera filtro ilike para busca server-side (termo original + sem acentos)
  const buildIlikeFilter = (termo: string) => {
    const termoLimpo = termo.trim();
    const termoSemAcento = normalizeSearchTerm(termoLimpo);
    // Buscar por ambos: com e sem acento, em nome/codigo/unidade
    const filtros = [
      `nome.ilike.%${termoLimpo}%`,
      `codigo.ilike.%${termoLimpo}%`,
      `unidade.ilike.%${termoLimpo}%`,
    ];
    if (termoSemAcento !== termoLimpo.toLowerCase()) {
      filtros.push(
        `nome.ilike.%${termoSemAcento}%`,
        `codigo.ilike.%${termoSemAcento}%`,
        `unidade.ilike.%${termoSemAcento}%`,
      );
    }
    return filtros.join(",");
  };

  const buscarTodosItensDaCategoria = async (categoriaId: string, termo: string) => {
    if (!termo.trim()) {
      setResultadosBuscaItens(prev => {
        const novo = { ...prev };
        delete novo[categoriaId];
        return novo;
      });
      return;
    }
    setBuscandoItensCat(categoriaId);
    try {
      // Busca server-side com ilike (pega matches com e sem acento)
      const { data, error } = await supabase
        .from("pricelist_itens")
        .select("id, nome, codigo, unidade, preco, tipo, ativo, subcategoria_id, imagem_url")
        .eq("categoria_id", categoriaId)
        .eq("ativo", true)
        .or(buildIlikeFilter(termo))
        .order("nome", { ascending: true })
        .limit(500);

      if (error) throw error;

      // Filtro client-side refinado (accent-insensitive)
      const termoNorm = normalizeSearchTerm(termo);
      const filtrados = (data || []).filter(item => {
        return normalizeSearchTerm(`${item.nome || ""} ${item.codigo || ""} ${item.unidade || ""}`).includes(termoNorm);
      });

      setResultadosBuscaItens(prev => ({
        ...prev,
        [categoriaId]: filtrados,
      }));
    } catch (error) {
      console.error("Erro ao buscar itens:", error);
    } finally {
      setBuscandoItensCat(null);
    }
  };

  // Debounced search: dispara busca após 300ms de inatividade
  const handleBuscaItensChange = (categoriaId: string, valor: string) => {
    setBuscaItensPorCategoria(prev => ({ ...prev, [categoriaId]: valor }));
    // Limpar resultados se campo vazio
    if (!valor.trim()) {
      setResultadosBuscaItens(prev => {
        const novo = { ...prev };
        delete novo[categoriaId];
        return novo;
      });
      if (buscaItensTimerRef.current[categoriaId]) {
        clearTimeout(buscaItensTimerRef.current[categoriaId]);
      }
      return;
    }
    // Debounce
    if (buscaItensTimerRef.current[categoriaId]) {
      clearTimeout(buscaItensTimerRef.current[categoriaId]);
    }
    buscaItensTimerRef.current[categoriaId] = setTimeout(() => {
      buscarTodosItensDaCategoria(categoriaId, valor);
    }, 300);
  };

  // Busca global de itens para o campo de busca principal
  const buscarItensGlobal = async (termo: string) => {
    if (!termo.trim()) {
      setCategoriasComItensMatch(new Set());
      setItensMatchPorCategoria({});
      return;
    }
    setBuscandoItensGlobal(true);
    try {
      const termoNorm = normalizeSearchTerm(termo);
      // Busca server-side com ilike (pega matches com e sem acento)
      const { data, error } = await supabase
        .from("pricelist_itens")
        .select("id, nome, codigo, unidade, preco, tipo, ativo, categoria_id, subcategoria_id, imagem_url")
        .eq("ativo", true)
        .or(buildIlikeFilter(termo))
        .order("nome", { ascending: true })
        .limit(500);

      if (error) throw error;

      // Filtro client-side refinado (accent-insensitive)
      const filtrados = (data || []).filter(item =>
        normalizeSearchTerm(`${item.nome || ""} ${item.codigo || ""} ${item.unidade || ""}`).includes(termoNorm)
      );

      // Agrupar por categoria_id
      const catIds = new Set<string>();
      const porCategoria: Record<string, any[]> = {};
      filtrados.forEach(item => {
        if (item.categoria_id) {
          catIds.add(item.categoria_id);
          if (!porCategoria[item.categoria_id]) porCategoria[item.categoria_id] = [];
          porCategoria[item.categoria_id].push(item);
        }
      });

      setCategoriasComItensMatch(catIds);
      setItensMatchPorCategoria(porCategoria);

      // Auto-expandir categorias que têm itens encontrados
      if (catIds.size > 0) {
        setExpandidas(prev => {
          const novo = new Set(prev);
          catIds.forEach(id => novo.add(id));
          return novo;
        });
      }
    } catch (error) {
      console.error("Erro na busca global de itens:", error);
    } finally {
      setBuscandoItensGlobal(false);
    }
  };

  const handleBuscaGlobal = (valor: string) => {
    setBusca(valor);
    if (!valor.trim()) {
      setCategoriasComItensMatch(new Set());
      setItensMatchPorCategoria({});
      if (buscaGlobalTimerRef.current) clearTimeout(buscaGlobalTimerRef.current);
      return;
    }
    if (buscaGlobalTimerRef.current) clearTimeout(buscaGlobalTimerRef.current);
    buscaGlobalTimerRef.current = setTimeout(() => {
      buscarItensGlobal(valor);
    }, 400);
  };

  // Recalcular preços de venda de todos os itens com custo_aquisicao
  const recalcularPrecosVenda = async () => {
    if (!confirm(
      "Recalcular preços de venda de TODOS os itens?\n\n" +
      "Itens com custo de aquisiçÍo preenchido terÍo o preço atualizado " +
      "usando as regras de precificaçÍo (impostos + custo hora + variáveis + fixos + margem).\n\n" +
      "Itens sem custo de aquisiçÍo não serÍo alterados."
    )) return;

    setRecalculando(true);
    setRecalcProgressText("Carregando itens e núcleos...");

    try {
      // 1. Buscar todos os itens com custo_aquisicao
      const { data: itens, error: errItens } = await supabase
        .from("pricelist_itens")
        .select("id, nome, preco, custo_aquisicao, nucleo_id, ativo")
        .eq("ativo", true)
        .not("custo_aquisicao", "is", null)
        .gt("custo_aquisicao", 0)
        .limit(2000);

      if (errItens) throw errItens;

      if (!itens || itens.length === 0) {
        toast({ title: "Nenhum item para recalcular", description: "Nenhum item ativo tem custo de aquisiçÍo preenchido." });
        return;
      }

      // 2. Buscar núcleos para mapear id → nome
      const { data: nucleosData } = await supabase
        .from("nucleos")
        .select("id, nome");

      const nucleoMap = new Map<string, string>();
      (nucleosData || []).forEach(n => nucleoMap.set(n.id, n.nome));

      // 3. Recalcular cada item
      let atualizados = 0;
      let iguais = 0;
      let erros = 0;

      for (let i = 0; i < itens.length; i++) {
        const item = itens[i];
        setRecalcProgressText(`Recalculando ${i + 1}/${itens.length}: ${item.nome || "sem nome"}`);

        const nucleoNome = item.nucleo_id ? nucleoMap.get(item.nucleo_id) || undefined : undefined;
        const novoPreco = recalcularPreco(item.custo_aquisicao, nucleoNome);

        // Só atualizar se o preço mudou (diferença > 0.01)
        if (Math.abs(novoPreco - (item.preco || 0)) > 0.01) {
          const { error: errUpdate } = await supabase
            .from("pricelist_itens")
            .update({ preco: novoPreco })
            .eq("id", item.id);

          if (errUpdate) {
            console.error(`Erro ao atualizar item ${item.id}:`, errUpdate);
            erros++;
          } else {
            atualizados++;
          }
        } else {
          iguais++;
        }
      }

      // 4. Recarregar dados
      setRecalcProgressText("Recarregando dados...");
      // Limpar caches de itens
      setItensRaiz({});
      setItensSubcategoria({});
      setResultadosBuscaItens({});
      setItensMatchPorCategoria({});

      toast({
        title: "Preços recalculados",
        description: `${atualizados} atualizados, ${iguais} já corretos, ${erros} erros. Total: ${itens.length} itens.`,
      });

      if (import.meta.env.DEV) console.log(`[Recalcular Preços] ${atualizados} atualizados, ${iguais} iguais, ${erros} erros de ${itens.length} itens.`);
    } catch (error) {
      console.error("Erro ao recalcular preços:", error);
      toast({
        title: "Erro",
        description: "Falha ao recalcular preços. Veja o console para detalhes.",
        variant: "destructive",
      });
    } finally {
      setRecalculando(false);
      setRecalcProgressText("");
    }
  };

  // Carregar todos os itens para lista geral
  const carregarListaGeral = async () => {
    setCarregandoListaGeral(true);
    try {
      const { data, error } = await supabase
        .from("pricelist_itens")
        .select("id, nome, codigo, unidade, preco, custo_aquisicao, tipo, ativo, categoria_id, subcategoria_id, nucleo_id")
        .eq("ativo", true)
        .order("nome", { ascending: true })
        .limit(5000);

      if (error) throw error;

      // Enriquecer com nomes de categoria/subcategoria
      const itensEnriquecidos = (data || []).map(item => {
        const cat = categoriasDB.find(c => c.id === item.categoria_id);
        const sub = subcategoriasDB.find(s => s.id === item.subcategoria_id);
        return {
          ...item,
          categoria_nome: cat?.nome || "",
          subcategoria_nome: sub?.nome || "",
        };
      });
      setItensListaGeral(itensEnriquecidos);
    } catch (error) {
      console.error("Erro ao carregar lista geral:", error);
      toast({ title: "Erro", description: "Falha ao carregar lista de itens", variant: "destructive" });
    } finally {
      setCarregandoListaGeral(false);
    }
  };

  // Migrar custos: para itens serviço/mÍo de obra SEM custo_aquisicao, mover preco → custo_aquisicao e recalcular preco
  const migrarCustosServicos = async () => {
    if (!confirm(
      "Migrar custos de itens de serviço e mÍo de obra?\n\n" +
      "Para itens do tipo Serviço e MÍo de Obra que não possuem Custo de AquisiçÍo:\n" +
      "- O Preço Unitário atual será movido para Custo de AquisiçÍo\n" +
      "- O Preço Unitário será recalculado com as regras de precificaçÍo\n\n" +
      "Itens do tipo Material, Produto e Insumo não serÍo afetados."
    )) return;

    setMigrando(true);
    setMigrProgressText("Carregando itens e núcleos...");

    try {
      // 1. Buscar itens serviço/mao_obra sem custo_aquisicao mas com preco > 0
      const { data: itens, error: errItens } = await supabase
        .from("pricelist_itens")
        .select("id, nome, preco, custo_aquisicao, tipo, nucleo_id, ativo")
        .eq("ativo", true)
        .in("tipo", ["servico", "mao_obra"])
        .gt("preco", 0)
        .limit(5000);

      if (errItens) throw errItens;

      // Filtrar os que não têm custo_aquisicao
      const itensSemCusto = (itens || []).filter(
        i => !i.custo_aquisicao || i.custo_aquisicao <= 0
      );

      if (itensSemCusto.length === 0) {
        toast({ title: "Nenhum item para migrar", description: "Todos os itens de serviço/mÍo de obra já possuem custo de aquisiçÍo." });
        return;
      }

      // 2. Buscar núcleos
      const { data: nucleosData } = await supabase.from("nucleos").select("id, nome");
      const nucleoMap = new Map<string, string>();
      (nucleosData || []).forEach(n => nucleoMap.set(n.id, n.nome));

      // 3. Migrar cada item
      let migrados = 0;
      let erros = 0;

      for (let i = 0; i < itensSemCusto.length; i++) {
        const item = itensSemCusto[i];
        setMigrProgressText(`Migrando ${i + 1}/${itensSemCusto.length}: ${item.nome || "sem nome"}`);

        const custoOriginal = item.preco;
        const nucleoNome = item.nucleo_id ? nucleoMap.get(item.nucleo_id) || undefined : undefined;
        const novoPreco = recalcularPreco(custoOriginal, nucleoNome);

        const { error: errUpdate } = await supabase
          .from("pricelist_itens")
          .update({
            custo_aquisicao: custoOriginal,
            preco: novoPreco,
          })
          .eq("id", item.id);

        if (errUpdate) {
          console.error(`Erro ao migrar item ${item.id}:`, errUpdate);
          erros++;
        } else {
          migrados++;
        }
      }

      // 4. Limpar caches
      setMigrProgressText("Recarregando dados...");
      setItensRaiz({});
      setItensSubcategoria({});
      setResultadosBuscaItens({});
      setItensMatchPorCategoria({});
      if (vistaAtual === "lista") {
        await carregarListaGeral();
      }

      toast({
        title: "MigraçÍo concluída",
        description: `${migrados} itens migrados, ${erros} erros. Total analisado: ${itensSemCusto.length} itens.`,
      });

      if (import.meta.env.DEV) console.log(`[Migrar Custos] ${migrados} migrados, ${erros} erros de ${itensSemCusto.length} itens.`);
    } catch (error) {
      console.error("Erro ao migrar custos:", error);
      toast({ title: "Erro", description: "Falha ao migrar custos. Veja o console.", variant: "destructive" });
    } finally {
      setMigrando(false);
      setMigrProgressText("");
    }
  };

  const padronizarAbasSubcategorias = async (skipConfirm = false) => {
    if (!skipConfirm && !confirm("Padronizar abas de subcategoria em TODAS as categorias?\n\nPadrÍo: AçÍo, Epi, Insumo, Ferramenta, Infraestrutura, Material Cinza, Acabamento, Produto.\n\nItens sem identificaçÍo válida serÍo enviados para a aba RAIZ.")) {
      return;
    }

    setSalvando(true);
    try {
      for (const categoria of categoriasDB) {
        // 1) Garante quantidade mínima de abas para o padrÍo
        let atuais = subcategoriasDB
          .filter((s) => s.categoria_id === categoria.id)
          .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

        if (atuais.length < SUBCATEGORIAS_WORKFLOW_PADRAO.length) {
          const faltam = SUBCATEGORIAS_WORKFLOW_PADRAO.length - atuais.length;
          for (let i = 0; i < faltam; i++) {
            await criarSubcategoria({
              categoria_id: categoria.id,
              nome: `TEMP-${i + 1}`,
              tipo: "material",
              ordem: atuais.length + i + 1,
              ativo: true,
            });
          }
          const recarregadas = await listarSubcategorias();
          atuais = recarregadas
            .filter((s) => s.categoria_id === categoria.id)
            .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
            .map((s) => ({ ...s, tipo: s.tipo || undefined }));
        }

        // 2) Força as 8 primeiras abas para o padrÍo (nome/tipo/ordem fixos)
        const padraoSlots = atuais.slice(0, SUBCATEGORIAS_WORKFLOW_PADRAO.length);
        const idsPadraoDaCategoria = padraoSlots.map((s) => s.id);
        for (let idx = 0; idx < SUBCATEGORIAS_WORKFLOW_PADRAO.length; idx++) {
          const slot = padraoSlots[idx];
          const padrao = SUBCATEGORIAS_WORKFLOW_PADRAO[idx];
          if (!slot) continue;
          await atualizarSubcategoria(slot.id, {
            nome: padrao.nome,
            tipo: padrao.tipo,
            ordem: idx + 1,
          });
        }

        // 3) Tudo além das 8 abas padrÍo vai para raiz e é removido
        const extras = atuais.slice(SUBCATEGORIAS_WORKFLOW_PADRAO.length);
        if (extras.length > 0) {
          const extrasIds = extras.map((s) => s.id);
          const { error: moverExtrasError } = await supabase
            .from("pricelist_itens")
            .update({ subcategoria_id: null })
            .eq("categoria_id", categoria.id)
            .in("subcategoria_id", extrasIds);
          if (moverExtrasError) throw moverExtrasError;

          for (const subExtra of extras) {
            await deletarSubcategoria(subExtra.id);
          }
        }

        // 4) Segurança: qualquer subcategoria fora das 8 padrÍo vai para raiz
        const { data: itensCategoria, error: itensCategoriaError } = await supabase
          .from("pricelist_itens")
          .select("id, subcategoria_id")
          .eq("categoria_id", categoria.id);
        if (itensCategoriaError) throw itensCategoriaError;

        const idsParaRaiz = (itensCategoria || [])
          .filter((item: any) => item.subcategoria_id && !idsPadraoDaCategoria.includes(item.subcategoria_id))
          .map((item: any) => item.id);

        if (idsParaRaiz.length > 0) {
          const { error: raizError } = await supabase
            .from("pricelist_itens")
            .update({ subcategoria_id: null })
            .in("id", idsParaRaiz);
          if (raizError) throw raizError;
        }
      }

      await carregarDadosMantendoScroll();
      toast({
        title: "Abas padronizadas",
        description: "Abas padrÍo aplicadas e itens não identificados enviados para a aba raiz.",
      });
    } catch (error) {
      console.error("Erro ao padronizar abas:", error);
      toast({
        title: "Erro",
        description: "não foi possível padronizar as abas.",
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (salvando) return;
    if (padronizacaoAutomaticaExecutada) return;
    if (categoriasDB.length === 0) return;

    setPadronizacaoAutomaticaExecutada(true);
    padronizarAbasSubcategorias(true);
  }, [loading, salvando, padronizacaoAutomaticaExecutada, categoriasDB.length]);

  const abrirEdicaoItem = (item: any, categoriaId: string, subcategoriaId?: string | null) => {
    setItemEditando({
      id: item.id,
      nome: item.nome || "",
      codigo: item.codigo || "",
      unidade: item.unidade || "un",
      preco: Number(item.preco || 0),
      custo_aquisicao: Number(item.custo_aquisicao || 0),
      nucleo_id: item.nucleo_id || "",
      tipo: item.tipo || "material",
      ativo: item.ativo !== false,
      categoria_id: item.categoria_id || categoriaId,
      subcategoria_id: subcategoriaId || item.subcategoria_id || "",
      categoria_original_id: item.categoria_id || categoriaId,
    });
  };

  const salvarItemEditado = async () => {
    if (!itemEditando) return;
    if (!itemEditando.nome.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Informe o nome do item.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSalvando(true);

      // Se tem custo de aquisiçÍo, recalcular preço automaticamente
      let precoFinal = Number(itemEditando.preco || 0);
      const custoAq = Number(itemEditando.custo_aquisicao || 0);
      if (custoAq > 0) {
        // Descobrir nome do núcleo para regras de precificaçÍo
        let nucleoNome: string | undefined;
        if (itemEditando.nucleo_id) {
          const { data: nucleoData } = await supabase
            .from("nucleos")
            .select("nome")
            .eq("id", itemEditando.nucleo_id)
            .single();
          nucleoNome = nucleoData?.nome || undefined;
        }
        precoFinal = recalcularPreco(custoAq, nucleoNome);
      }

      await atualizarItem(itemEditando.id, {
        nome: itemEditando.nome.trim(),
        codigo: itemEditando.codigo.trim() || undefined,
        unidade: itemEditando.unidade.trim() || "un",
        preco: precoFinal,
        custo_aquisicao: custoAq > 0 ? custoAq : null,
        tipo: itemEditando.tipo as any,
        ativo: itemEditando.ativo,
        categoria_id: itemEditando.categoria_id || null,
        subcategoria_id: itemEditando.subcategoria_id || null,
      } as any);
      try {
        await sincronizarItensPorPricelistItem(itemEditando.id);
      } catch (syncError) {
        console.warn("Falha ao sincronizar item editado com propostas:", syncError);
      }

      setItemEditando(null);
      setItensRaiz({});
      setItensSubcategoria({});
      await carregarDadosMantendoScroll();
      if (vistaAtual === "lista") {
        await carregarListaGeral();
      }

      toast({
        title: "Item atualizado",
        description: "Dados do item salvos com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao salvar item:", error);
      toast({
        title: "Erro",
        description: "não foi possível salvar o item.",
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  };

  const initEdicaoRapida = (item: any) => {
    setEdicaoRapida((prev) => {
      if (prev[item.id]) return prev;
      return {
        ...prev,
        [item.id]: {
          preco: String(item.preco ?? 0),
          unidade: item.unidade || "un",
        },
      };
    });
  };

  const salvarEdicaoRapidaItem = async (item: any, categoriaId: string, subcategoriaId?: string | null) => {
    const draft = edicaoRapida[item.id];
    if (!draft) return;

    const precoNum = Number(String(draft.preco).replace(",", "."));
    if (Number.isNaN(precoNum) || precoNum < 0) {
      toast({
        title: "Preço inválido",
        description: "Informe um valor numérico válido.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSalvandoInlineItem((prev) => ({ ...prev, [item.id]: true }));
      await atualizarItem(item.id, {
        preco: precoNum,
        unidade: draft.unidade || "un",
      } as any);
      try {
        await sincronizarItensPorPricelistItem(item.id);
      } catch (syncError) {
        console.warn("Falha ao sincronizar ediçÍo rápida com propostas:", syncError);
      }

      const aplicar = (lista: any[]) =>
        lista.map((row) =>
          row.id === item.id ? { ...row, preco: precoNum, unidade: draft.unidade || "un" } : row
        );

      if (subcategoriaId) {
        setItensSubcategoria((prev) => ({
          ...prev,
          [subcategoriaId]: aplicar(prev[subcategoriaId] || []),
        }));
      } else {
        setItensRaiz((prev) => ({
          ...prev,
          [categoriaId]: aplicar(prev[categoriaId] || []),
        }));
      }

      toast({
        title: "Item atualizado",
        description: "Preço e unidade salvos.",
      });
    } catch (error) {
      console.error("Erro ao salvar ediçÍo rápida:", error);
      toast({
        title: "Erro",
        description: "não foi possível salvar a ediçÍo rápida.",
        variant: "destructive",
      });
    } finally {
      setSalvandoInlineItem((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const criarItemRapidoNaAbaAtiva = async (categoria: CategoriaDB) => {
    const draft = novoItemRapidoPorCategoria[categoria.id];
    if (!draft) {
      toast({
        title: "Preencha os dados do item",
        description: "Informe ao menos o nome para criar o item.",
        variant: "destructive",
      });
      return;
    }
    const nome = draft?.nome?.trim();
    if (!nome) {
      toast({
        title: "Nome obrigatório",
        description: "Informe o nome do item para criar.",
        variant: "destructive",
      });
      return;
    }

    const precoNum = Number(String(draft.preco || "0").replace(",", "."));
    if (Number.isNaN(precoNum) || precoNum < 0) {
      toast({
        title: "Preço inválido",
        description: "Informe um preço válido.",
        variant: "destructive",
      });
      return;
    }

    const abaAtiva = abaAtivaPorCategoria[categoria.id] || "raiz";
    const subcategoriaId = abaAtiva === "raiz" ? null : abaAtiva;

    try {
      setSalvandoNovoItemRapido((prev) => ({ ...prev, [categoria.id]: true }));
      await criarItem({
        nome,
        codigo: draft.codigo?.trim() || undefined,
        unidade: draft.unidade?.trim() || "un",
        preco: precoNum,
        tipo: (draft.tipo || "material") as any,
        categoria_id: categoria.id,
        subcategoria_id: subcategoriaId,
        ativo: true,
      } as any);

      setNovoItemRapidoPorCategoria((prev) => ({
        ...prev,
        [categoria.id]: {
          nome: "",
          codigo: "",
          unidade: "un",
          preco: "0",
          tipo: draft.tipo || "material",
        },
      }));

      setItensRaiz((prev) => {
        const next = { ...prev };
        delete next[categoria.id];
        return next;
      });
      if (subcategoriaId) {
        setItensSubcategoria((prev) => {
          const next = { ...prev };
          delete next[subcategoriaId];
          return next;
        });
        await carregarItensSubcategoria(subcategoriaId, categoria.id);
      } else {
        await carregarItensRaiz(categoria.id);
      }
      await carregarDadosMantendoScroll();

      toast({
        title: "Item criado",
        description: "Novo item criado na aba ativa.",
      });
    } catch (error) {
      console.error("Erro ao criar item rápido:", error);
      toast({
        title: "Erro",
        description: "não foi possível criar o item.",
        variant: "destructive",
      });
    } finally {
      setSalvandoNovoItemRapido((prev) => ({ ...prev, [categoria.id]: false }));
    }
  };

  const abrirFluxoDaCategoria = (categoriaId: string) => {
    setCategoriaFluxoSelecionada(categoriaId);
    setModalFluxosAberto(true);
  };

  // Atualizar subcategoria de um item (mover para subcategoria)
  const atualizarSubcategoriaItem = async (itemId: string, subcategoriaId: string, categoriaId: string) => {
    try {
      const { error } = await supabase
        .from("pricelist_itens")
        .update({ subcategoria_id: subcategoriaId })
        .eq("id", itemId);

      if (error) throw error;

      // Remover item da lista da raiz
      setItensRaiz(prev => ({
        ...prev,
        [categoriaId]: (prev[categoriaId] || []).filter(item => item.id !== itemId),
      }));

      // Recarregar contagem mantendo scroll
      await carregarDadosMantendoScroll();

      toast({
        title: "Item classificado",
        description: "Item movido para a subcategoria com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao atualizar subcategoria:", error);
      toast({
        title: "Erro",
        description: "não foi possível mover o item.",
        variant: "destructive",
      });
    }
  };

  // Reclassificar item de uma subcategoria para outra
  const reclassificarItem = async (itemId: string, novaSubcategoriaId: string, subcategoriaAtualId: string, categoriaId: string) => {
    try {
      const { error } = await supabase
        .from("pricelist_itens")
        .update({ subcategoria_id: novaSubcategoriaId })
        .eq("id", itemId);

      if (error) throw error;

      // Remover item da lista da subcategoria atual
      setItensSubcategoria(prev => ({
        ...prev,
        [subcategoriaAtualId]: (prev[subcategoriaAtualId] || []).filter(item => item.id !== itemId),
      }));

      // Recarregar contagem mantendo scroll
      await carregarDadosMantendoScroll();

      // Buscar nome da nova subcategoria
      const novaSub = subcategoriasDB.find(s => s.id === novaSubcategoriaId);

      toast({
        title: "Item reclassificado",
        description: `Item movido para "${novaSub?.nome || 'subcategoria'}".`,
      });
    } catch (error) {
      console.error("Erro ao reclassificar item:", error);
      toast({
        title: "Erro",
        description: "não foi possível mover o item.",
        variant: "destructive",
      });
    }
  };

  // Mover item para outra categoria (mantém na raiz da nova categoria)
  const moverParaOutraCategoria = async (itemId: string, novaCategoriaId: string, categoriaAtualId: string) => {
    try {
      const { error } = await supabase
        .from("pricelist_itens")
        .update({
          categoria_id: novaCategoriaId,
          subcategoria_id: null // Vai para raiz da nova categoria
        })
        .eq("id", itemId);

      if (error) throw error;

      // Remover item da lista da categoria atual
      setItensRaiz(prev => ({
        ...prev,
        [categoriaAtualId]: (prev[categoriaAtualId] || []).filter(item => item.id !== itemId),
      }));

      // Recarregar dados mantendo scroll
      await carregarDadosMantendoScroll();

      // Buscar nome da nova categoria
      const novaCat = categoriasDB.find(c => c.id === novaCategoriaId);

      toast({
        title: "Item transferido",
        description: `Item movido para categoria "${novaCat?.nome || 'nova categoria'}".`,
      });
    } catch (error) {
      console.error("Erro ao mover item para outra categoria:", error);
      toast({
        title: "Erro",
        description: "não foi possível mover o item.",
        variant: "destructive",
      });
    }
  };

  // Atualizar tipo de um item (material, mao_obra, servico, etc)
  const atualizarTipoItem = async (itemId: string, novoTipo: string, categoriaId: string) => {
    try {
      const { error } = await supabase
        .from("pricelist_itens")
        .update({ tipo: novoTipo })
        .eq("id", itemId);

      if (error) throw error;

      // Atualizar item na lista local
      setItensRaiz(prev => ({
        ...prev,
        [categoriaId]: (prev[categoriaId] || []).map(item =>
          item.id === itemId ? { ...item, tipo: novoTipo } : item
        ),
      }));

      const tipoLabels: Record<string, string> = {
        material: "Material",
        mao_obra: "MÍo de Obra",
        servico: "Serviço",
        produto: "Produto",
        insumo: "Insumo",
      };

      toast({
        title: "Tipo atualizado",
        description: `Item alterado para "${tipoLabels[novoTipo] || novoTipo}".`,
      });
    } catch (error) {
      console.error("Erro ao atualizar tipo:", error);
      toast({
        title: "Erro",
        description: "não foi possível alterar o tipo do item.",
        variant: "destructive",
      });
    }
  };

  // Excluir item individual
  const excluirItemIndividual = async (itemId: string, itemNome: string, categoriaId: string, subcategoriaId?: string) => {
    if (!confirm(`Deseja excluir o item "${itemNome}"?\n\nEsta açÍo não pode ser desfeita.`)) {
      return;
    }

    try {
      await deletarItem(itemId);

      // Atualizar estado local
      if (subcategoriaId) {
        setItensSubcategoria(prev => ({
          ...prev,
          [subcategoriaId]: (prev[subcategoriaId] || []).filter(item => item.id !== itemId),
        }));
      } else {
        setItensRaiz(prev => ({
          ...prev,
          [categoriaId]: (prev[categoriaId] || []).filter(item => item.id !== itemId),
        }));
      }

      toast({
        title: "Item excluído",
        description: `"${itemNome}" foi removido com sucesso.`,
      });
    } catch (error) {
      console.error("Erro ao excluir item:", error);
      toast({
        title: "Erro",
        description: "não foi possível excluir o item.",
        variant: "destructive",
      });
    }
  };

  // Funções de seleçÍo múltipla
  const toggleSelecaoItem = (categoriaId: string, itemId: string) => {
    setItensSelecionados(prev => {
      const selecionados = new Set(prev[categoriaId] || []);
      if (selecionados.has(itemId)) {
        selecionados.delete(itemId);
      } else {
        selecionados.add(itemId);
      }
      return { ...prev, [categoriaId]: selecionados };
    });
  };

  const selecionarTodos = (categoriaId: string) => {
    const itens = itensRaiz[categoriaId] || [];
    const todosSelecionados = itens.every(item =>
      (itensSelecionados[categoriaId] || new Set()).has(item.id)
    );

    if (todosSelecionados) {
      // Desselecionar todos
      setItensSelecionados(prev => ({ ...prev, [categoriaId]: new Set() }));
    } else {
      // Selecionar todos
      setItensSelecionados(prev => ({
        ...prev,
        [categoriaId]: new Set(itens.map(item => item.id)),
      }));
    }
  };

  const classificarSelecionados = async (categoriaId: string, subcategoriaId: string) => {
    const selecionados = Array.from(itensSelecionados[categoriaId] || []);
    if (selecionados.length === 0) return;

    setSalvando(true);
    try {
      // Atualizar todos os itens selecionados
      const { error } = await supabase
        .from("pricelist_itens")
        .update({ subcategoria_id: subcategoriaId })
        .in("id", selecionados);

      if (error) throw error;

      // Remover itens da lista da raiz
      setItensRaiz(prev => ({
        ...prev,
        [categoriaId]: (prev[categoriaId] || []).filter(item => !selecionados.includes(item.id)),
      }));

      // Limpar seleçÍo
      setItensSelecionados(prev => ({ ...prev, [categoriaId]: new Set() }));

      // Recarregar contagem mantendo scroll
      await carregarDadosMantendoScroll();

      toast({
        title: "Itens classificados",
        description: `${selecionados.length} item(ns) movidos para a subcategoria.`,
      });
    } catch (error) {
      console.error("Erro ao classificar itens:", error);
      toast({
        title: "Erro",
        description: "não foi possível mover os itens.",
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  };

  const getQtdSelecionados = (categoriaId: string) => {
    return (itensSelecionados[categoriaId] || new Set()).size;
  };

  // Alternar aba ativa da categoria
  const alternarAbaCategoria = async (categoriaId: string, abaId: string) => {
    setAbaAtivaPorCategoria(prev => ({ ...prev, [categoriaId]: abaId }));

    if (abaId === "raiz") {
      // Carregar itens da raiz se ainda não carregados
      if (!itensRaiz[categoriaId]) {
        await carregarItensRaiz(categoriaId);
      }
    } else {
      // Carregar itens da subcategoria se ainda não carregados
      if (!itensSubcategoria[abaId]) {
        await carregarItensSubcategoria(abaId, categoriaId);
      }
    }
  };

  // FunçÍo para excluir subcategoria com confirmaçÍo
  const excluirSubcategoria = async (sub: SubcategoriaDB, categoriaId: string) => {
    const contagemSub = getContagemSubcategoria(categoriaId, sub.id);

    if (contagemSub > 0) {
      const confirmacao = window.confirm(
        `A subcategoria "${sub.nome}" possui ${contagemSub} item(ns) vinculados.\n\nSe continuar, os itens ficarÍo SEM subcategoria.\n\nDeseja excluir mesmo assim?`
      );
      if (!confirmacao) return;
    } else {
      const confirmacao = window.confirm(
        `Deseja excluir a subcategoria "${sub.nome}"?`
      );
      if (!confirmacao) return;
    }

    setSalvando(true);
    try {
      await deletarSubcategoria(sub.id);
      toast({
        title: "Subcategoria excluída",
        description: `"${sub.nome}" foi removida com sucesso.`,
      });
      await carregarDadosMantendoScroll();
    } catch (error) {
      console.error("Erro ao excluir subcategoria:", error);
      toast({
        title: "Erro",
        description: "não foi possível excluir a subcategoria.",
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  };

  // FunçÍo para iniciar ediçÍo do nome da aba/subcategoria
  const iniciarEdicaoAba = (sub: SubcategoriaDB) => {
    setEditandoSubcategoriaAba(sub.id);
    setNomeSubcategoriaEditando(sub.nome);
    setMenuAbaAberto(null);
  };

  // FunçÍo para salvar ediçÍo do nome da aba/subcategoria
  const salvarEdicaoAba = async (sub: SubcategoriaDB) => {
    if (!nomeSubcategoriaEditando.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para a subcategoria.",
        variant: "destructive",
      });
      return;
    }
    setSalvando(true);
    try {
      await atualizarSubcategoria(sub.id, { nome: nomeSubcategoriaEditando.trim() });
      toast({
        title: "Subcategoria atualizada",
        description: `Nome alterado para "${nomeSubcategoriaEditando.trim()}".`,
      });
      setEditandoSubcategoriaAba(null);
      setNomeSubcategoriaEditando("");
      await carregarDadosMantendoScroll();
    } catch (error) {
      console.error("Erro ao atualizar subcategoria:", error);
      toast({
        title: "Erro",
        description: "não foi possível atualizar a subcategoria.",
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  };

  // FunçÍo para criar nova subcategoria personalizada
  const criarNovaSubcategoriaAba = async (categoriaId: string, categoria: CategoriaDB) => {
    if (!nomeNovaSubcategoria.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para a nova subcategoria.",
        variant: "destructive",
      });
      return;
    }
    setSalvando(true);
    try {
      const subcatsCategoria = subcategoriasDB.filter(s => s.categoria_id === categoriaId);
      const maiorOrdem = subcatsCategoria.reduce((max, s) => Math.max(max, s.ordem || 0), 0);

      await criarSubcategoria({
        nome: nomeNovaSubcategoria.trim(),
        categoria_id: categoriaId,
        tipo: (categoria.tipo as TipoPricelist) || "material",
        ordem: maiorOrdem + 1,
        ativo: true,
      });
      toast({
        title: "Subcategoria criada",
        description: `"${nomeNovaSubcategoria.trim()}" foi adicionada com sucesso.`,
      });
      setCriandoSubcategoriaAba(null);
      setNomeNovaSubcategoria("");
      await carregarDadosMantendoScroll();
    } catch (error) {
      console.error("Erro ao criar subcategoria:", error);
      toast({
        title: "Erro",
        description: "não foi possível criar a subcategoria.",
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  };

  // FunçÍo para mover subcategoria (reordenar)
  const moverSubcategoriaAba = async (sub: SubcategoriaDB, direcao: "esquerda" | "direita", categoriaId: string) => {
    const subcatsCategoria = subcategoriasDB
      .filter(s => s.categoria_id === categoriaId)
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

    const indexAtual = subcatsCategoria.findIndex(s => s.id === sub.id);
    if (indexAtual === -1) return;

    const novoIndex = direcao === "esquerda" ? indexAtual - 1 : indexAtual + 1;
    if (novoIndex < 0 || novoIndex >= subcatsCategoria.length) return;

    const outraSub = subcatsCategoria[novoIndex];
    const ordemAtual = sub.ordem || 0;
    const ordemOutra = outraSub.ordem || 0;

    setSalvando(true);
    try {
      await Promise.all([
        atualizarSubcategoria(sub.id, { ordem: ordemOutra }),
        atualizarSubcategoria(outraSub.id, { ordem: ordemAtual }),
      ]);
      await carregarDadosMantendoScroll();
      setMenuAbaAberto(null);
    } catch (error) {
      console.error("Erro ao reordenar subcategorias:", error);
      toast({
        title: "Erro",
        description: "não foi possível reordenar as subcategorias.",
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  };

  // FunçÍo para reordenar subcategorias via drag-and-drop
  const handleDragEndSubcategorias = async (result: DropResult, categoriaId: string) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;

    const subcatsCategoria = subcategoriasDB
      .filter(s => s.categoria_id === categoriaId)
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    // Reordenar array localmente
    const novasSubcats = Array.from(subcatsCategoria);
    const [removed] = novasSubcats.splice(sourceIndex, 1);
    novasSubcats.splice(destIndex, 0, removed);

    // Atualizar ordens
    setSalvando(true);
    try {
      const updates = novasSubcats.map((sub, index) =>
        atualizarSubcategoria(sub.id, { ordem: index })
      );
      await Promise.all(updates);
      await carregarDadosMantendoScroll();
    } catch (error) {
      console.error("Erro ao reordenar subcategorias:", error);
      toast({
        title: "Erro",
        description: "não foi possível reordenar as subcategorias.",
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  };

  // ============================================================
  // FILTROS
  // ============================================================

  const categoriasFiltradas = categoriasDB.filter(cat => {
    if (!busca) return true;
    const termo = normalizeSearchTerm(busca);
    // Match por nome/código da categoria OU por itens encontrados na busca global
    return (
      normalizeSearchTerm(cat.nome).includes(termo) ||
      normalizeSearchTerm(cat.codigo || "").includes(termo) ||
      categoriasComItensMatch.has(cat.id)
    );
  });

  // ============================================================
  // DRAG & DROP HANDLERS
  // ============================================================

  const handleDragStart = (e: React.DragEvent, id: string, type: "categoria" | "subcategoria") => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", JSON.stringify({ id, type }));
    setDragState(prev => ({ ...prev, draggedId: id, draggedType: type }));
    setIsDragging(true);

    // Add drag image
    const dragElement = e.currentTarget as HTMLElement;
    if (dragElement) {
      e.dataTransfer.setDragImage(dragElement, 20, 20);
    }
  };

  const handleDragEnd = () => {
    setDragState({
      draggedId: null,
      draggedType: null,
      overId: null,
      overType: null,
      overPosition: null,
    });
    setIsDragging(false);
    dragCounter.current = 0;
  };

  const handleDragOver = (e: React.DragEvent, id: string, type: "categoria" | "subcategoria") => {
    e.preventDefault();
    e.stopPropagation();

    if (dragState.draggedId === id) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;

    let position: "top" | "bottom" | "center";
    // Zonas: top (0-15%), center (15-85%), bottom (85-100%)
    // Centro maior para facilitar conversÍo em subcategoria
    if (y < height * 0.15) {
      position = "top";
    } else if (y > height * 0.85) {
      position = "bottom";
    } else {
      position = "center";
    }

    setDragState(prev => ({
      ...prev,
      overId: id,
      overType: type,
      overPosition: position,
    }));
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragState(prev => ({
        ...prev,
        overId: null,
        overType: null,
        overPosition: null,
      }));
    }
  };

  // ============================================================
  // FUNÇÕES DE RECÁLCULO EM CASCATA
  // ============================================================

  /**
   * Extrai o nome limpo sem o prefixo de ordem (ex: "001/Arquitetura" → "Arquitetura")
   */
  const getNomeLimpo = (nome: string): string => {
    // Remove prefixos como "001/", "002/", etc.
    return nome.replace(/^\d{3}\//, '');
  };

  /**
   * Gera o nome com prefixo de ordem (ex: "Arquitetura" + ordem 1 → "001/Arquitetura")
   */
  const gerarNomeComOrdem = (nomeLimpo: string, ordem: number): string => {
    const prefixo = String(ordem).padStart(3, '0');
    return `${prefixo}/${nomeLimpo}`;
  };

  /**
   * Recalcula e atualiza a ordem e nome de todas as categorias afetadas
   * Atualiza os 3 primeiros dígitos do nome para refletir a nova ordem
   * Retorna um relatório das mudanças realizadas
   */
  const recalcularOrdensEmCascata = async (
    categoriasReordenadas: CategoriaDB[]
  ): Promise<{ alteradas: string[]; detalhes: string[] }> => {
    const alteradas: string[] = [];
    const detalhes: string[] = [];

    for (let i = 0; i < categoriasReordenadas.length; i++) {
      const cat = categoriasReordenadas[i];
      const novaOrdem = i + 1;
      const ordemAnterior = cat.ordem || 0;

      // Extrair nome limpo e gerar novo nome com prefixo atualizado
      const nomeLimpo = getNomeLimpo(cat.nome);
      const novoNome = gerarNomeComOrdem(nomeLimpo, novaOrdem);

      // Verificar se houve mudança de ordem OU se o nome precisa do prefixo
      const ordemMudou = ordemAnterior !== novaOrdem;
      const nomePrecisaAtualizar = cat.nome !== novoNome;

      if (ordemMudou || nomePrecisaAtualizar) {
        // Atualizar ordem E nome da categoria
        await atualizarCategoria(cat.id, { ordem: novaOrdem, nome: novoNome });

        alteradas.push(nomeLimpo);
        detalhes.push(`${nomeLimpo}: ${String(ordemAnterior).padStart(3, "0")} → ${String(novaOrdem).padStart(3, "0")}`);
      }
    }

    return { alteradas, detalhes };
  };

  const handleDrop = async (e: React.DragEvent, targetId: string, targetType: "categoria" | "subcategoria") => {
    e.preventDefault();
    e.stopPropagation();

    if (!dragState.draggedId || dragState.draggedId === targetId) {
      handleDragEnd();
      return;
    }

    const draggedCategoria = categoriasDB.find(c => c.id === dragState.draggedId);
    if (!draggedCategoria) {
      handleDragEnd();
      return;
    }

    const targetCategoria = categoriasDB.find(c => c.id === targetId);
    if (!targetCategoria) {
      handleDragEnd();
      return;
    }

    setSalvando(true);
    try {
      if (dragState.overPosition === "center" && targetType === "categoria") {
        // DROP NO CENTRO = Tornar subcategoria

        // Verificar se não está tentando tornar uma categoria subcategoria de si mesma
        if (draggedCategoria.id === targetId) {
          toast({
            title: "OperaçÍo inválida",
            description: "não é possível tornar uma categoria subcategoria de si mesma.",
            variant: "destructive",
          });
          handleDragEnd();
          setSalvando(false);
          return;
        }

        // Verificar se já existe subcategoria com mesmo nome na categoria alvo
        const existentesSubcats = getSubcategoriasDaCategoria(targetId);
        const subcatDuplicada = existentesSubcats.find(
          s => s.nome.toLowerCase().trim() === draggedCategoria.nome.toLowerCase().trim()
        );

        if (subcatDuplicada) {
          toast({
            title: "Subcategoria já existe",
            description: `A categoria "${targetCategoria.nome}" já possui uma subcategoria "${subcatDuplicada.nome}". Escolha outro nome ou mova para outra categoria.`,
            variant: "destructive",
          });
          handleDragEnd();
          setSalvando(false);
          return;
        }

        // Verificar se a categoria arrastada tem itens
        const totalItens = getContagemCategoria(draggedCategoria.id);

        const ordemNova = existentesSubcats.length > 0
          ? Math.max(...existentesSubcats.map(s => s.ordem || 0)) + 10
          : 10;

        // Criar subcategoria
        const novaSubcat = await criarSubcategoria({
          categoria_id: targetId,
          nome: draggedCategoria.nome,
          tipo: draggedCategoria.tipo as any || "material",
          ordem: ordemNova,
          ativo: true,
        });

        // Mover TODOS os itens para a nova subcategoria (incluindo itens de subcategorias)
        if (novaSubcat?.id) {
          // Buscar subcategorias DIRETAMENTE do banco (não do estado React)
          const { data: subsDoDb } = await supabase
            .from("pricelist_subcategorias")
            .select("id")
            .eq("categoria_id", draggedCategoria.id);

          const subsParaExcluir = subsDoDb || [];

          // Primeiro: mover TODOS os itens da categoria arrastada para a nova subcategoria
          // (independente de subcategoria)
          await supabase
            .from("pricelist_itens")
            .update({
              categoria_id: targetId,
              subcategoria_id: novaSubcat.id,
            })
            .eq("categoria_id", draggedCategoria.id);

          // Depois: excluir subcategorias antigas (já sem itens vinculados)
          for (const sub of subsParaExcluir) {
            try {
              await deletarSubcategoria(sub.id);
            } catch (err) {
              console.warn(`não foi possível excluir subcategoria ${sub.id}:`, err);
            }
          }
        }

        // Excluir a categoria original
        await deletarCategoria(draggedCategoria.id);

        // RECÁLCULO EM CASCATA: Atualizar ordem das categorias restantes
        const categoriasRestantes = categoriasDB
          .filter(c => c.id !== draggedCategoria.id)
          .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

        const { alteradas, detalhes } = await recalcularOrdensEmCascata(categoriasRestantes);

        toast({
          title: "Categoria convertida",
          description: `"${getNomeLimpo(draggedCategoria.nome)}" agora é subcategoria de "${getNomeLimpo(targetCategoria.nome)}"${totalItens > 0 ? ` com ${totalItens} item(ns) transferido(s)` : ""}.${alteradas.length > 0 ? ` ${alteradas.length} categoria(s) reordenada(s).` : ""}`,
        });

        // Se houve muitas alterações, mostrar detalhes
        if (detalhes.length > 0) {
          if (import.meta.env.DEV) console.log("Categorias reordenadas:", detalhes.join(", "));
        }
      } else {
        // DROP EM CIMA OU EMBAIXO = Reordenar
        const categoriasOrdenadas = [...categoriasDB].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
        const draggedIndex = categoriasOrdenadas.findIndex(c => c.id === dragState.draggedId);
        const targetIndex = categoriasOrdenadas.findIndex(c => c.id === targetId);

        if (draggedIndex === -1 || targetIndex === -1) {
          handleDragEnd();
          setSalvando(false);
          return;
        }

        // Calcular nova posiçÍo
        let newIndex = targetIndex;
        if (dragState.overPosition === "bottom") {
          newIndex = targetIndex + 1;
        }
        if (draggedIndex < targetIndex && dragState.overPosition !== "bottom") {
          newIndex = targetIndex - 1;
        }

        // Reordenar array
        const reordered = [...categoriasOrdenadas];
        const [removed] = reordered.splice(draggedIndex, 1);
        reordered.splice(newIndex, 0, removed);

        // RECÁLCULO EM CASCATA: Atualizar ordens de TODAS as categorias afetadas
        const { alteradas, detalhes } = await recalcularOrdensEmCascata(reordered);

        // Gerar mensagem detalhada
        const ordemAnterior = draggedCategoria.ordem || 0;
        const ordemNova = newIndex + 1;

        toast({
          title: "Ordem atualizada em cascata",
          description: `"${getNomeLimpo(draggedCategoria.nome)}": ${String(ordemAnterior).padStart(3, "0")} → ${String(ordemNova).padStart(3, "0")}. ${alteradas.length} categoria(s) atualizadas.`,
        });

        // Mostrar relatório detalhado se houve múltiplas alterações
        if (detalhes.length > 1) {
          setRelatorioMudancas({
            visivel: true,
            titulo: `${detalhes.length} códigos atualizados em cascata`,
            detalhes: detalhes,
          });
        }
      }

      await carregarDadosMantendoScroll();
    } catch (error) {
      console.error("Erro ao mover categoria:", error);
      toast({
        title: "Erro",
        description: "não foi possível mover a categoria.",
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
      handleDragEnd();
    }
  };

  // Gera classe CSS para feedback visual durante drag
  const getDragFeedbackClass = (categoriaId: string) => {
    if (!isDragging) return "";
    if (dragState.draggedId === categoriaId) return "opacity-50 scale-95";
    if (dragState.overId === categoriaId) {
      if (dragState.overPosition === "center") {
        return "ring-2 ring-[#F25C26] ring-offset-2 bg-orange-50";
      }
      return "";
    }
    return "";
  };

  // Gera estilos para indicador de drop
  const getDropIndicatorStyle = (categoriaId: string) => {
    if (dragState.overId === categoriaId && dragState.overPosition === "top") {
      return { borderTop: "3px solid #F25C26" };
    }
    if (dragState.overId === categoriaId && dragState.overPosition === "bottom") {
      return { borderBottom: "3px solid #F25C26" };
    }
    return {};
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="w-full px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                title="Voltar"
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-[18px] sm:text-[24px] font-normal text-wg-neutral">
                  Categorias de Pricelist
                </h1>
                <p className="text-[12px] text-gray-500">
                  Gerencie categorias e subcategorias - Cores aplicadas em todo o sistema
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={carregarDados}
                disabled={loading}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-1.5 text-[14px]"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Atualizar
              </button>

              <button
                type="button"
                onClick={() => {
                  void padronizarAbasSubcategorias();
                }}
                disabled={salvando}
                className="px-3 py-1.5 border border-blue-300 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 flex items-center gap-1.5 text-[14px] disabled:opacity-60"
                title="Padronizar abas de subcategoria em todas as categorias"
              >
                <Layers className="w-4 h-4" />
                Padronizar Abas
              </button>

              <button
                type="button"
                onClick={migrarCustosServicos}
                disabled={migrando || recalculando || salvando}
                className="px-3 py-1.5 border border-teal-300 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 flex items-center gap-1.5 text-[14px] disabled:opacity-60"
                title="Mover Preço → Custo de AquisiçÍo em itens serviço/mÍo de obra sem custo, e recalcular preço de venda"
              >
                {migrando ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
                {migrando ? migrProgressText || "Migrando..." : "Migrar Custos"}
              </button>

              <button
                type="button"
                onClick={recalcularPrecosVenda}
                disabled={recalculando || salvando}
                className="px-3 py-1.5 border border-amber-300 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 flex items-center gap-1.5 text-[14px] disabled:opacity-60"
                title="Recalcular preços de venda de todos os itens com custo de aquisiçÍo (aplica impostos + custo hora + variáveis + fixos + margem)"
              >
                {recalculando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                {recalculando ? recalcProgressText || "Recalculando..." : "Recalcular Preços"}
              </button>

              <button
                type="button"
                onClick={() => setModalFluxosAberto(true)}
                className="px-3 py-1.5 border border-purple-300 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 flex items-center gap-1.5 text-[14px]"
                title="Gerenciar fluxos de trabalho, fases e tarefas"
              >
                <GitCompare className="w-4 h-4" />
                Gerenciar Fluxos
              </button>

              <button
                type="button"
                onClick={iniciarNovaCategoria}
                disabled={salvando || novaCategoria}
                className="px-3 py-1.5 bg-wg-primary text-white rounded-lg hover:bg-wg-primary/90 flex items-center gap-1.5 text-[14px]"
              >
                <Plus className="w-4 h-4" />
                Nova Categoria
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="w-full px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-wg-primary animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Barra de Busca + Toggle Vista */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={vistaAtual === "lista" ? buscaListaGeral : busca}
                  onChange={(e) => {
                    if (vistaAtual === "lista") {
                      setBuscaListaGeral(e.target.value);
                      setPaginaListaGeral(0);
                    } else {
                      handleBuscaGlobal(e.target.value);
                    }
                  }}
                  placeholder={vistaAtual === "lista" ? "Buscar itens (nome, código, categoria)..." : "Buscar categorias e itens (nome, código, unidade)..."}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-[10px] placeholder:text-[10px]"
                />
                {buscandoItensGlobal && vistaAtual === "categorias" && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 animate-spin" />
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Toggle vista */}
                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setVistaAtual("categorias")}
                    className={`px-3 py-2 flex items-center gap-1.5 text-[12px] transition-colors ${
                      vistaAtual === "categorias"
                        ? "bg-primary text-white"
                        : "bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                    title="Vista por Categorias"
                  >
                    <LayoutGrid className="w-4 h-4" />
                    Categorias
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVistaAtual("lista");
                      if (itensListaGeral.length === 0) carregarListaGeral();
                    }}
                    className={`px-3 py-2 flex items-center gap-1.5 text-[12px] transition-colors ${
                      vistaAtual === "lista"
                        ? "bg-primary text-white"
                        : "bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                    title="Vista em Lista Geral"
                  >
                    <List className="w-4 h-4" />
                    Lista Geral
                  </button>
                </div>
                <div className="text-[12px] text-gray-600 flex items-center gap-2 whitespace-nowrap">
                  <Tag className="w-4 h-4" />
                  {categoriasDB.length} categorias | {subcategoriasDB.length} subcategorias
                  {busca && vistaAtual === "categorias" && categoriasComItensMatch.size > 0 && (
                    <span className="text-amber-600 font-medium">
                      | {Object.values(itensMatchPorCategoria).reduce((acc, arr) => acc + arr.length, 0)} itens encontrados em {categoriasComItensMatch.size} {categoriasComItensMatch.size === 1 ? "categoria" : "categorias"}
                    </span>
                  )}
                </div>
              </div>
            </div>


            {/* Relatório de Mudanças em Cascata */}
            {relatorioMudancas.visivel && (
              <div className="bg-green-50 border border-green-300 rounded-lg p-4 relative">
                <button
                  type="button"
                  onClick={() => setRelatorioMudancas({ visivel: false, titulo: "", detalhes: [] })}
                  className="absolute top-2 right-2 p-1 text-green-600 hover:bg-green-100 rounded"
                  title="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-normal text-green-800 mb-2">{relatorioMudancas.titulo}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
                      {relatorioMudancas.detalhes.map((detalhe, idx) => (
                        <div
                          key={idx}
                          className="text-xs bg-white px-2 py-1 rounded border border-green-200 text-green-700 font-mono"
                        >
                          {detalhe}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-green-600 mt-2">
                      Os códigos das subcategorias foram atualizados automaticamente.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ========== VISTA: LISTA GERAL ========== */}
            {vistaAtual === "lista" && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {carregandoListaGeral ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 text-[#F25C26] animate-spin mr-2" />
                    <span className="text-sm text-gray-500">Carregando itens...</span>
                  </div>
                ) : (() => {
                  const termoLista = normalizeSearchTerm(buscaListaGeral);
                  const itensFiltrados = termoLista
                    ? itensListaGeral.filter(item =>
                        normalizeSearchTerm(item.nome || "").includes(termoLista) ||
                        normalizeSearchTerm(item.codigo || "").includes(termoLista) ||
                        normalizeSearchTerm(item.categoria_nome || "").includes(termoLista) ||
                        normalizeSearchTerm(item.subcategoria_nome || "").includes(termoLista) ||
                        normalizeSearchTerm(item.tipo || "").includes(termoLista)
                      )
                    : itensListaGeral;
                  const totalPaginas = Math.ceil(itensFiltrados.length / ITENS_POR_PAGINA_LISTA);
                  const itensPagina = itensFiltrados.slice(
                    paginaListaGeral * ITENS_POR_PAGINA_LISTA,
                    (paginaListaGeral + 1) * ITENS_POR_PAGINA_LISTA
                  );
                  return (
                    <>
                      {/* Header com contagem */}
                      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                        <span className="text-[12px] text-gray-600">
                          {itensFiltrados.length} itens{termoLista ? ` (filtrados de ${itensListaGeral.length})` : ""}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => carregarListaGeral()}
                            disabled={carregandoListaGeral}
                            className="px-2 py-1 border border-gray-300 rounded text-[11px] text-gray-600 hover:bg-gray-50 flex items-center gap-1"
                          >
                            <RefreshCw className={`w-3 h-3 ${carregandoListaGeral ? "animate-spin" : ""}`} />
                            Atualizar
                          </button>
                        </div>
                      </div>

                      {/* Tabela */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="px-3 py-2 text-[10px] font-medium text-gray-500 uppercase">Nome</th>
                              <th className="px-3 py-2 text-[10px] font-medium text-gray-500 uppercase">Código</th>
                              <th className="px-3 py-2 text-[10px] font-medium text-gray-500 uppercase">Tipo</th>
                              <th className="px-3 py-2 text-[10px] font-medium text-gray-500 uppercase">Unidade</th>
                              <th className="px-3 py-2 text-[10px] font-medium text-gray-500 uppercase text-right">Custo Aq.</th>
                              <th className="px-3 py-2 text-[10px] font-medium text-gray-500 uppercase text-right">Preço Venda</th>
                              <th className="px-3 py-2 text-[10px] font-medium text-gray-500 uppercase">Categoria</th>
                              <th className="px-3 py-2 text-[10px] font-medium text-gray-500 uppercase">Subcategoria</th>
                              <th className="px-3 py-2 text-[10px] font-medium text-gray-500 uppercase w-16"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {itensPagina.map((item) => {
                              const tipoColor = getTipoItemColor((item.tipo || "material") as TipoPricelist);
                              const tipoLabel = getTipoItemLabel((item.tipo || "material") as TipoPricelist);
                              const semCusto = !item.custo_aquisicao || item.custo_aquisicao <= 0;
                              const ehServico = item.tipo === "servico" || item.tipo === "mao_obra";
                              return (
                                <tr
                                  key={item.id}
                                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                                    semCusto && ehServico ? "bg-amber-50/50" : ""
                                  }`}
                                >
                                  <td className="px-3 py-2 text-[12px] font-medium text-gray-900 max-w-[250px] truncate">{item.nome}</td>
                                  <td className="px-3 py-2 text-[11px] font-mono text-gray-500">{item.codigo || "-"}</td>
                                  <td className="px-3 py-2">
                                    <span
                                      className="inline-block px-1.5 py-0.5 rounded text-[9px] font-medium"
                                      style={{ backgroundColor: tipoColor + "20", color: tipoColor }}
                                    >
                                      {tipoLabel}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-[11px] text-gray-600">{item.unidade || "un"}</td>
                                  <td className="px-3 py-2 text-[11px] text-right font-mono">
                                    {item.custo_aquisicao && item.custo_aquisicao > 0 ? (
                                      <span className="text-gray-600">R$ {Number(item.custo_aquisicao).toFixed(2)}</span>
                                    ) : (
                                      <span className={`${ehServico ? "text-amber-500 font-medium" : "text-gray-300"}`}>
                                        {ehServico ? "migrar" : "-"}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-[11px] text-right font-mono font-medium text-gray-900">
                                    R$ {Number(item.preco || 0).toFixed(2)}
                                  </td>
                                  <td className="px-3 py-2 text-[11px] text-gray-600 max-w-[150px] truncate">{item.categoria_nome || "-"}</td>
                                  <td className="px-3 py-2 text-[11px] text-gray-500 max-w-[120px] truncate">{item.subcategoria_nome || "-"}</td>
                                  <td className="px-3 py-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setItemEditando({
                                          id: item.id,
                                          nome: item.nome || "",
                                          codigo: item.codigo || "",
                                          unidade: item.unidade || "un",
                                          preco: item.preco || 0,
                                          custo_aquisicao: Number(item.custo_aquisicao || 0),
                                          nucleo_id: item.nucleo_id || "",
                                          tipo: item.tipo || "material",
                                          ativo: item.ativo !== false,
                                          categoria_id: item.categoria_id || "",
                                          subcategoria_id: item.subcategoria_id || "",
                                          categoria_original_id: item.categoria_id || "",
                                        });
                                      }}
                                      className="p-1 text-gray-400 hover:text-[#F25C26] rounded transition-colors"
                                      title="Editar item"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* PaginaçÍo */}
                      {totalPaginas > 1 && (
                        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                          <span className="text-[11px] text-gray-500">
                            Página {paginaListaGeral + 1} de {totalPaginas}
                          </span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              disabled={paginaListaGeral === 0}
                              onClick={() => setPaginaListaGeral(p => Math.max(0, p - 1))}
                              className="px-2 py-1 border border-gray-300 rounded text-[11px] text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            {Array.from({ length: Math.min(totalPaginas, 7) }, (_, i) => {
                              let pageNum: number;
                              if (totalPaginas <= 7) {
                                pageNum = i;
                              } else if (paginaListaGeral < 4) {
                                pageNum = i;
                              } else if (paginaListaGeral > totalPaginas - 4) {
                                pageNum = totalPaginas - 7 + i;
                              } else {
                                pageNum = paginaListaGeral - 3 + i;
                              }
                              return (
                                <button
                                  key={pageNum}
                                  type="button"
                                  onClick={() => setPaginaListaGeral(pageNum)}
                                  className={`px-2 py-1 border rounded text-[11px] min-w-[28px] ${
                                    paginaListaGeral === pageNum
                                      ? "bg-primary text-white border-[#F25C26]"
                                      : "border-gray-300 text-gray-600 hover:bg-gray-50"
                                  }`}
                                >
                                  {pageNum + 1}
                                </button>
                              );
                            })}
                            <button
                              type="button"
                              disabled={paginaListaGeral >= totalPaginas - 1}
                              onClick={() => setPaginaListaGeral(p => Math.min(totalPaginas - 1, p + 1))}
                              className="px-2 py-1 border border-gray-300 rounded text-[11px] text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {itensFiltrados.length === 0 && (
                        <div className="text-center py-10 text-gray-500">
                          <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">{termoLista ? "Nenhum item encontrado para esta busca" : "Nenhum item no pricelist"}</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* ========== VISTA: CATEGORIAS ========== */}
            {vistaAtual === "categorias" && (<>
            {/* Formulário Nova Categoria */}
            {novaCategoria && (
              <div className="bg-white rounded-lg shadow-sm border-2 border-wg-primary p-4">
                <h3 className="text-[20px] font-normal text-gray-900 mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-wg-primary" />
                  Nova Categoria
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 mb-1">Nome *</label>
                    <input
                      type="text"
                      value={formCategoria.nome}
                      onChange={(e) => {
                        const nome = e.target.value;
                        // Auto-gerar codigo e cor baseado no nome
                        const codigoAuto = getCodigoCategoria(nome);
                        const corAuto = getCorCategoria(nome);
                        setFormCategoria(f => ({
                          ...f,
                          nome,
                          codigo: codigoAuto,
                          cor: corAuto,
                        }));
                      }}
                      placeholder="Ex: Hidrossanitaria"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 mb-1">Codigo</label>
                    <input
                      type="text"
                      value={formCategoria.codigo}
                      onChange={(e) => setFormCategoria(f => ({ ...f, codigo: e.target.value.toUpperCase() }))}
                      placeholder="Auto ou digite manualmente"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px] font-mono"
                    />
                    <p className="text-[12px] text-gray-400 mt-1">Auto-gerado ou edite manualmente</p>
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 mb-1">Tipo</label>
                    <select
                      value={formCategoria.tipo}
                      onChange={(e) => setFormCategoria(f => ({ ...f, tipo: e.target.value }))}
                      title="Tipo da categoria"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px]"
                    >
                      <option value="material">Material</option>
                      <option value="mao_obra">Mao de Obra</option>
                      <option value="servico">Servico</option>
                      <option value="produto">Produto</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 mb-1">Ordem</label>
                    <input
                      type="number"
                      value={formCategoria.ordem}
                      onChange={(e) => setFormCategoria(f => ({ ...f, ordem: parseInt(e.target.value) || 0 }))}
                      min={0}
                      title="Ordem da categoria"
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 mb-1">Cor (auto/ajustavel)</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formCategoria.cor}
                        onChange={(e) => setFormCategoria(f => ({ ...f, cor: e.target.value }))}
                        title="Selecionar cor"
                        className="w-10 h-9 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formCategoria.cor}
                        onChange={(e) => setFormCategoria(f => ({ ...f, cor: e.target.value }))}
                        title="Codigo da cor em hexadecimal"
                        placeholder="#6B7280"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-[14px] font-mono"
                      />
                    </div>
                    <p className="text-[12px] text-gray-400 mt-1">Cor aplicada do config ou ajuste manualmente</p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={cancelarEdicao}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2 text-[14px]"
                  >
                    <X className="w-4 h-4" />
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={salvarCategoria}
                    disabled={salvando}
                    className="px-4 py-2 bg-wg-primary text-white rounded-lg hover:bg-wg-primary/90 flex items-center gap-2 text-[14px]"
                  >
                    {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Criar com Subcategorias
                  </button>
                </div>
                <p className="text-[12px] text-gray-500 mt-2">
                  * Ao criar a categoria, as {SUBCATEGORIAS_WORKFLOW_PADRAO.length} subcategorias padrÍo serÍo adicionadas automaticamente.
                </p>
              </div>
            )}

            {/* InstruçÍo Drag & Drop */}
            {isDragging && (
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-3 flex items-center gap-3">
                <Move className="w-5 h-5 text-wg-primary" />
                <div className="text-[16px]">
                  <span className="font-medium text-gray-900">Arraste para reordenar</span>
                  <span className="text-gray-600 mx-2">-</span>
                  <span className="text-gray-600">Solte <strong>no centro</strong> de outra categoria para transformar em subcategoria</span>
                </div>
              </div>
            )}

            {/* Lista de Categorias */}
            <div className="space-y-3">
              {categoriasFiltradas.map((cat) => {
                const isExpanded = expandidas.has(cat.id);
                const isEditing = editandoCategoria === cat.id;
                const subcategorias = getSubcategoriasDaCategoria(cat.id);
                const buscaItensCategoria = buscaItensPorCategoria[cat.id] || "";
                const termoBuscaItens = normalizeSearchTerm(buscaItensCategoria);
                const totalItens = getContagemCategoria(cat.id);
                // Usa cor do banco > cor do config > cor do tipo como fallback
                const corConfig = getCorCategoria(cat.nome);
                const corTipo = getTipoItemColor((cat.tipo || "material") as TipoPricelist);
                // Ignora cores de banco que sÍo o default gray
                const corDoBanco = cat.cor && cat.cor !== "#6B7280" && cat.cor !== "#000000" ? cat.cor : null;
                const corCategoria = corDoBanco || (corConfig !== "#6B7280" ? corConfig : corTipo);
                const codigoCat = cat.codigo || getCodigoCategoria(cat.nome);
                const isDraggedItem = dragState.draggedId === cat.id;
                const isDropTarget = dragState.overId === cat.id && !isDraggedItem;
                const draftItemRapido = novoItemRapidoPorCategoria[cat.id] || {
                  nome: "",
                  codigo: "",
                  unidade: "un",
                  preco: "0",
                  tipo: (cat.tipo as TipoPricelist) || "material",
                };
                const itensMatchGlobal = itensMatchPorCategoria[cat.id] || [];
                // Resultados de busca ativos: per-category search OU global search
                const searchResultsAtivos = resultadosBuscaItens[cat.id] !== undefined
                  ? resultadosBuscaItens[cat.id]
                  : itensMatchGlobal.length > 0
                    ? itensMatchGlobal
                    : undefined;

                return (
                  <div
                    key={cat.id}
                    draggable={!isEditing && !novaCategoria}
                    onDragStart={(e) => handleDragStart(e, cat.id, "categoria")}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, cat.id, "categoria")}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, cat.id, "categoria")}
                    className={`bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-200 ${getDragFeedbackClass(cat.id)} ${!isEditing && !novaCategoria ? "cursor-grab active:cursor-grabbing" : ""}`}
                    style={getDropIndicatorStyle(cat.id)}
                  >
                    {/* Header da Categoria */}
                    {isEditing ? (
                      // Modo EdiçÍo - Grid 5 colunas (sem botÍo Aplicar Config)
                      <div className="p-3 border-l-4" style={{ borderLeftColor: formCategoria.cor }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                          <div>
                            <label className="block text-[12px] font-medium text-gray-700 mb-1">Nome</label>
                            <input
                              type="text"
                              value={formCategoria.nome}
                              onChange={(e) => {
                                const nome = e.target.value;
                                // Auto-aplicar cor do config quando nome muda
                                const corConfig = getCorCategoria(nome);
                                setFormCategoria(f => ({
                                  ...f,
                                  nome,
                                  cor: corConfig !== "#6B7280" ? corConfig : f.cor,
                                }));
                              }}
                              title="Nome da categoria"
                              placeholder="Nome da categoria"
                              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-[14px]"
                            />
                          </div>
                          <div>
                            <label className="block text-[12px] font-medium text-gray-700 mb-1">Codigo</label>
                            <input
                              type="text"
                              value={formCategoria.codigo}
                              onChange={(e) => setFormCategoria(f => ({ ...f, codigo: e.target.value.toUpperCase() }))}
                              title="Editar codigo da categoria"
                              placeholder="Codigo"
                              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-[14px] font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[12px] font-medium text-gray-700 mb-1">Tipo</label>
                            <select
                              value={formCategoria.tipo}
                              onChange={(e) => setFormCategoria(f => ({ ...f, tipo: e.target.value }))}
                              title="Tipo da categoria"
                              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-[14px]"
                            >
                              <option value="material">Material</option>
                              <option value="mao_obra">Mao de Obra</option>
                              <option value="servico">Servico</option>
                              <option value="produto">Produto</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[12px] font-medium text-gray-700 mb-1">Ordem</label>
                            <input
                              type="number"
                              value={formCategoria.ordem}
                              onChange={(e) => setFormCategoria(f => ({ ...f, ordem: parseInt(e.target.value) || 0 }))}
                              min={0}
                              title="Ordem da categoria"
                              placeholder="0"
                              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-[14px]"
                            />
                          </div>
                          <div>
                            <label className="block text-[12px] font-medium text-gray-700 mb-1">Cor</label>
                            <div className="flex gap-1">
                              <input
                                type="color"
                                value={formCategoria.cor}
                                onChange={(e) => setFormCategoria(f => ({ ...f, cor: e.target.value }))}
                                title="Selecionar cor"
                                className="w-8 h-7 rounded border border-gray-300 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={formCategoria.cor}
                                onChange={(e) => setFormCategoria(f => ({ ...f, cor: e.target.value }))}
                                title="Codigo da cor em hexadecimal"
                                placeholder="#6B7280"
                                className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-[14px] font-mono"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-3">
                          <button
                            type="button"
                            onClick={cancelarEdicao}
                            className="px-2 py-1 text-gray-700 hover:bg-gray-100 rounded flex items-center gap-1 text-[14px]"
                          >
                            <X className="w-3 h-3" />
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={salvarCategoria}
                            disabled={salvando}
                            className="px-2 py-1 bg-wg-primary text-white rounded hover:bg-wg-primary/90 flex items-center gap-1 text-[14px]"
                          >
                            {salvando ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            Salvar
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Modo VisualizaçÍo
                      <div
                        className={`flex items-center justify-between p-3 hover:bg-gray-50 border-l-4 transition-colors ${isDropTarget && dragState.overPosition === "center" ? "bg-orange-50" : ""}`}
                        style={{ borderLeftColor: corCategoria }}
                      >
                        {/* Área clicável para expansÍo */}
                        <div
                          className="flex items-center gap-3 flex-1 cursor-pointer"
                          onClick={() => toggleExpansao(cat.id)}
                        >
                          {/* Grip para arrastar */}
                          <div
                            className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing p-1 -ml-1"
                            title="Arraste para reordenar"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>

                          {/* Quadrado com número e cor padronizada */}
                          <div
                            className="w-8 h-7 rounded flex items-center justify-center text-white font-normal text-[10px] shadow-sm"
                            style={{ backgroundColor: corCategoria }}
                          >
                            {String(cat.ordem || 0).padStart(3, "0")}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-medium text-gray-900 text-[10px]">{cat.nome}</span>
                              <span
                                className="font-mono text-[9px] px-1.5 py-0.5 rounded font-normal"
                                style={{ backgroundColor: corCategoria + "20", color: corCategoria }}
                              >
                                {codigoCat}
                              </span>
                              <span
                                className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                                style={{
                                  backgroundColor: getTipoItemColor((cat.tipo || "material") as TipoPricelist) + "20",
                                  color: getTipoItemColor((cat.tipo || "material") as TipoPricelist),
                                }}
                              >
                                {getTipoItemLabel((cat.tipo || "material") as TipoPricelist)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[9px] text-gray-500">
                              <span>{subcategorias.length} sub</span>
                              <span>•</span>
                              <span>{totalItens} itens</span>
                              {itensMatchGlobal.length > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="text-amber-600 font-medium">
                                    {itensMatchGlobal.length} {itensMatchGlobal.length === 1 ? "item encontrado" : "itens encontrados"}
                                  </span>
                                </>
                              )}
                              {!cat.ativo && (
                                <>
                                  <span>•</span>
                                  <span className="text-red-500">Inativo</span>
                                </>
                              )}
                            </div>
                            {/* Guias Reordenáveis */}
                            <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                              <GuiasReordenaveis
                                guias={cat.guias || []}
                                onChange={(novasGuias) => handleGuiasChange(cat.id, novasGuias)}
                                placeholder="Sem guias extras"
                                hideAddButton
                              />
                            </div>
                          </div>
                        </div>

                        {/* Indicador visual de drop no centro */}
                        {isDropTarget && dragState.overPosition === "center" && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-wg-primary text-white rounded-full text-xs font-medium animate-pulse">
                            <ArrowDownToLine className="w-3 h-3" />
                            Solte para subcategoria
                          </div>
                        )}

                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => iniciarEdicaoCategoria(cat)}
                            className="p-2 text-gray-400 hover:text-wg-primary hover:bg-gray-100 rounded-lg transition-colors"
                            title="Editar categoria"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => excluirCategoria(cat)}
                            disabled={salvando}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir categoria"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Subcategorias Expandidas - Sistema de Abas */}
                    {isExpanded && !isEditing && (
                      <div className="border-t border-gray-200 bg-gray-50">
                        {/* Header com abas de navegaçÍo */}
                        <div className="flex items-center justify-between px-3 pt-2 pb-0 border-b border-gray-200 bg-white">
                          <div className="flex items-center gap-1 overflow-x-auto flex-1" style={{ scrollbarWidth: "none" }}>
                            {/* Aba Raiz */}
                            <button
                              type="button"
                              onClick={() => alternarAbaCategoria(cat.id, "raiz")}
                              className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                                abaAtivaPorCategoria[cat.id] === "raiz" || !abaAtivaPorCategoria[cat.id]
                                  ? "bg-gray-50 border border-b-0 border-gray-200 -mb-px"
                                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                              }`}
                              style={
                                abaAtivaPorCategoria[cat.id] === "raiz" || !abaAtivaPorCategoria[cat.id]
                                  ? { color: corCategoria }
                                  : {}
                              }
                            >
                              <Package className="w-3 h-3" />
                              <span>Categoria Raiz</span>
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded-full"
                                style={{ backgroundColor: corCategoria + "20", color: corCategoria }}
                              >
                                {getContagemSubcategoria(cat.id, null)}
                              </span>
                            </button>

                            {/* Abas de Subcategorias com Drag-and-Drop */}
                            <DragDropContext onDragEnd={(result) => handleDragEndSubcategorias(result, cat.id)}>
                              <Droppable droppableId={`subcats-${cat.id}`} direction="horizontal">
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="flex items-center gap-1"
                                  >
                                    {subcategorias.map((sub, subIndex) => {
                                      const prefixoSub = getPrefixoSubcategoria(sub.nome);
                                      const contagemSub = getContagemSubcategoria(cat.id, sub.id);
                                      const isActive = abaAtivaPorCategoria[cat.id] === sub.id;
                                      const isEditando = editandoSubcategoriaAba === sub.id;
                                      const isMenuAberto = menuAbaAberto === sub.id;

                                      return (
                                        <Draggable
                                          key={sub.id}
                                          draggableId={sub.id}
                                          index={subIndex}
                                          isDragDisabled={isEditando || salvando}
                                        >
                                          {(provided, snapshot) => (
                                            <div
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              {...provided.dragHandleProps}
                                              className={`relative flex items-center group ${snapshot.isDragging ? "z-50" : ""}`}
                                            >
                                              {isEditando ? (
                                    // Modo de ediçÍo do nome
                                    <div className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 rounded-t-lg">
                                      <input
                                        type="text"
                                        value={nomeSubcategoriaEditando}
                                        onChange={(e) => setNomeSubcategoriaEditando(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") salvarEdicaoAba(sub);
                                          if (e.key === "Escape") {
                                            setEditandoSubcategoriaAba(null);
                                            setNomeSubcategoriaEditando("");
                                          }
                                        }}
                                        placeholder="Nome da aba"
                                        className="w-24 px-1 py-0.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-wg-primary"
                                        autoFocus
                                      />
                                      <button
                                        type="button"
                                        onClick={() => salvarEdicaoAba(sub)}
                                        disabled={salvando}
                                        className="p-0.5 text-green-600 hover:bg-green-50 rounded"
                                        title="Salvar"
                                      >
                                        <Check className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditandoSubcategoriaAba(null);
                                          setNomeSubcategoriaEditando("");
                                        }}
                                        className="p-0.5 text-gray-400 hover:bg-gray-100 rounded"
                                        title="Cancelar"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    // Aba normal - clique para selecionar, duplo clique para editar
                                    <button
                                      type="button"
                                      onClick={() => alternarAbaCategoria(cat.id, sub.id)}
                                      onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        iniciarEdicaoAba(sub);
                                      }}
                                      className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                                        isActive
                                          ? "bg-gray-50 border border-b-0 border-gray-200 -mb-px"
                                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                      }`}
                                      style={isActive ? { color: corCategoria } : {}}
                                      title="Duplo clique para editar nome"
                                    >
                                      <span
                                        className="w-5 h-5 rounded flex items-center justify-center text-white text-[8px] font-normal"
                                        style={{ backgroundColor: corCategoria }}
                                      >
                                        {prefixoSub}
                                      </span>
                                      <span className="hidden sm:inline">{sub.nome}</span>
                                      <span
                                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                                        style={{ backgroundColor: corCategoria + "20", color: corCategoria }}
                                      >
                                        {contagemSub}
                                      </span>
                                    </button>
                                  )}

                                  {/* BotÍo de menu (aparece no hover ou quando ativo) */}
                                  {!isEditando && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setMenuAbaAberto(isMenuAberto ? null : sub.id);
                                      }}
                                      className={`p-0.5 rounded transition-opacity ${
                                        isActive || isMenuAberto
                                          ? "opacity-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                                          : "opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600"
                                      }`}
                                      title="Opções"
                                    >
                                      <MoreVertical className="w-3 h-3" />
                                    </button>
                                  )}

                                  {/* Menu dropdown */}
                                  {isMenuAberto && (
                                    <div data-menu-aba className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[140px]">
                                      <button
                                        type="button"
                                        onClick={() => iniciarEdicaoAba(sub)}
                                        className="w-full px-3 py-2 text-xs text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                      >
                                        <Pencil className="w-3 h-3" />
                                        Editar nome
                                      </button>
                                      {subIndex > 0 && (
                                        <button
                                          type="button"
                                          onClick={() => moverSubcategoriaAba(sub, "esquerda", cat.id)}
                                          disabled={salvando}
                                          className="w-full px-3 py-2 text-xs text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                        >
                                          <ChevronLeft className="w-3 h-3" />
                                          Mover p/ esquerda
                                        </button>
                                      )}
                                      {subIndex < subcategorias.length - 1 && (
                                        <button
                                          type="button"
                                          onClick={() => moverSubcategoriaAba(sub, "direita", cat.id)}
                                          disabled={salvando}
                                          className="w-full px-3 py-2 text-xs text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                        >
                                          <ChevronRight className="w-3 h-3" />
                                          Mover p/ direita
                                        </button>
                                      )}
                                      <div className="border-t border-gray-100" />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setMenuAbaAberto(null);
                                          excluirSubcategoria(sub, cat.id);
                                        }}
                                        disabled={salvando}
                                        className="w-full px-3 py-2 text-xs text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        Excluir
                                      </button>
                                    </div>
                                  )}
                                </div>
                                          )}
                                        </Draggable>
                                      );
                                    })}
                                    {provided.placeholder}
                                  </div>
                                )}
                              </Droppable>
                            </DragDropContext>

                            {/* Input para criar nova subcategoria */}
                            {criandoSubcategoriaAba === cat.id ? (
                              <div className="flex items-center gap-1 px-2 py-1 bg-white border border-dashed border-gray-300 rounded-t-lg">
                                <input
                                  type="text"
                                  value={nomeNovaSubcategoria}
                                  onChange={(e) => setNomeNovaSubcategoria(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") criarNovaSubcategoriaAba(cat.id, cat);
                                    if (e.key === "Escape") {
                                      setCriandoSubcategoriaAba(null);
                                      setNomeNovaSubcategoria("");
                                    }
                                  }}
                                  placeholder="Nome..."
                                  className="w-24 px-1 py-0.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-wg-primary"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => criarNovaSubcategoriaAba(cat.id, cat)}
                                  disabled={salvando}
                                  className="p-0.5 text-green-600 hover:bg-green-50 rounded"
                                  title="Criar"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCriandoSubcategoriaAba(null);
                                    setNomeNovaSubcategoria("");
                                  }}
                                  className="p-0.5 text-gray-400 hover:bg-gray-100 rounded"
                                  title="Cancelar"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              // BotÍo + para adicionar nova subcategoria
                              <button
                                type="button"
                                onClick={() => {
                                  setCriandoSubcategoriaAba(cat.id);
                                  setNomeNovaSubcategoria("");
                                }}
                                disabled={salvando}
                                className="px-2 py-2 text-gray-400 hover:text-wg-primary hover:bg-gray-100 rounded-t-lg transition-colors flex items-center justify-center border border-dashed border-gray-300 border-b-0"
                                title="Adicionar subcategoria"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Conteúdo da aba ativa */}
                        <div className="p-3">
                          <div className="mb-3 p-2 border border-gray-200 rounded-lg bg-gray-50">
                            <div className="grid grid-cols-1 xl:grid-cols-[minmax(240px,1.4fr)_minmax(240px,1.4fr)_120px_90px_100px_130px_auto] gap-2">
                              <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                <input
                                  type="text"
                                  value={buscaItensCategoria}
                                  onChange={(e) => handleBuscaItensChange(cat.id, e.target.value)}
                                  placeholder="Buscar itens nesta categoria (nome, código, unidade)..."
                                  className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                                />
                              </div>
                              <input
                                type="text"
                                value={draftItemRapido.nome}
                                onChange={(e) =>
                                  setNovoItemRapidoPorCategoria((prev) => ({
                                    ...prev,
                                    [cat.id]: { ...draftItemRapido, nome: e.target.value },
                                  }))
                                }
                                placeholder="Novo item na aba ativa"
                                className="px-2 py-1.5 border border-gray-200 rounded text-xs"
                              />
                              <input
                                type="text"
                                value={draftItemRapido.codigo}
                                onChange={(e) =>
                                  setNovoItemRapidoPorCategoria((prev) => ({
                                    ...prev,
                                    [cat.id]: { ...draftItemRapido, codigo: e.target.value.toUpperCase() },
                                  }))
                                }
                                placeholder="Código"
                                className="px-2 py-1.5 border border-gray-200 rounded text-xs"
                              />
                              <input
                                type="text"
                                value={draftItemRapido.unidade}
                                onChange={(e) =>
                                  setNovoItemRapidoPorCategoria((prev) => ({
                                    ...prev,
                                    [cat.id]: { ...draftItemRapido, unidade: e.target.value },
                                  }))
                                }
                                placeholder="Unidade"
                                className="px-2 py-1.5 border border-gray-200 rounded text-xs"
                              />
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={draftItemRapido.preco}
                                onChange={(e) =>
                                  setNovoItemRapidoPorCategoria((prev) => ({
                                    ...prev,
                                    [cat.id]: { ...draftItemRapido, preco: e.target.value },
                                  }))
                                }
                                placeholder="Preço"
                                className="px-2 py-1.5 border border-gray-200 rounded text-xs text-right"
                              />
                              <select
                                value={draftItemRapido.tipo}
                                onChange={(e) =>
                                  setNovoItemRapidoPorCategoria((prev) => ({
                                    ...prev,
                                    [cat.id]: { ...draftItemRapido, tipo: e.target.value as TipoPricelist },
                                  }))
                                }
                                className="px-2 py-1.5 border border-gray-200 rounded text-xs bg-white"
                              >
                                <option value="material">Material</option>
                                <option value="mao_obra">MÍo de Obra</option>
                                <option value="servico">Serviço</option>
                                <option value="produto">Produto</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => criarItemRapidoNaAbaAtiva(cat)}
                                disabled={!!salvandoNovoItemRapido[cat.id]}
                                className="px-3 py-1.5 bg-wg-primary text-white rounded text-xs hover:bg-wg-primary/90 disabled:opacity-60"
                              >
                                {salvandoNovoItemRapido[cat.id] ? "Criando..." : "Criar"}
                              </button>
                            </div>
                          </div>

                          {/* Resultados da busca cross-tab (per-category ou global) */}
                          {searchResultsAtivos !== undefined ? (
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                              <div className="px-3 py-2 border-b border-gray-100 bg-amber-50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Search className="w-3.5 h-3.5 text-amber-600" />
                                  <span className="text-[12px] font-medium text-amber-800">
                                    Resultados da busca: {searchResultsAtivos.length} {searchResultsAtivos.length === 1 ? "item" : "itens"}
                                  </span>
                                </div>
                                {(buscandoItensCat === cat.id || buscandoItensGlobal) && (
                                  <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                                )}
                              </div>
                              {(buscandoItensCat === cat.id || buscandoItensGlobal) && searchResultsAtivos.length === 0 ? (
                                <div className="flex items-center justify-center py-8">
                                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                  <span className="ml-2 text-[12px] text-gray-500">Buscando itens...</span>
                                </div>
                              ) : searchResultsAtivos.length === 0 ? (
                                <div className="text-center py-6 text-gray-400">
                                  <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                  <p className="text-[12px]">Nenhum item encontrado para &quot;{buscaItensCategoria || busca}&quot;</p>
                                  <p className="text-xs mt-1">Busca em todas as subcategorias da categoria</p>
                                </div>
                              ) : (
                                <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                                  {searchResultsAtivos.map((item, idx) => {
                                    const tipoLabel = {
                                      material: { label: "MAT", bg: "#3B82F6", desc: "Material" },
                                      mao_obra: { label: "MDO", bg: "#10B981", desc: "MÍo de Obra" },
                                      servico: { label: "SRV", bg: "#8B5CF6", desc: "Serviço" },
                                      produto: { label: "PRO", bg: "#F59E0B", desc: "Produto" },
                                      insumo: { label: "INS", bg: "#EF4444", desc: "Insumo" },
                                    }[item.tipo as string] || { label: "OUT", bg: "#6B7280", desc: "Outro" };
                                    const subNome = item.subcategoria_id
                                      ? subcategoriasDB.find(s => s.id === item.subcategoria_id)?.nome || "—"
                                      : "Raiz";

                                    return (
                                      <div
                                        key={item.id}
                                        className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 gap-2"
                                      >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                          <span
                                            className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded shrink-0"
                                            style={{ backgroundColor: corCategoria + "15", color: corCategoria }}
                                          >
                                            #{String(idx + 1).padStart(3, "0")}
                                          </span>
                                          {item.imagem_url ? (
                                            <img
                                              src={item.imagem_url}
                                              alt={item.nome}
                                              className="w-5 h-5 rounded-full object-cover border border-gray-200 shrink-0"
                                            />
                                          ) : (
                                            <div
                                              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium text-white shrink-0"
                                              style={{ backgroundColor: corCategoria }}
                                              title={item.nome}
                                            >
                                              {getInicialItem(item.nome)}
                                            </div>
                                          )}
                                          <span className="text-xs text-gray-700 truncate">{item.nome}</span>
                                          <span
                                            className="text-[9px] px-1.5 py-0.5 rounded-full shrink-0"
                                            style={{ backgroundColor: (tipoLabel as any).bg + "15", color: (tipoLabel as any).bg }}
                                          >
                                            {(tipoLabel as any).label}
                                          </span>
                                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 shrink-0">
                                            {subNome}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <span className="text-[10px] text-gray-500">{item.unidade || "un"}</span>
                                          <span className="text-xs font-medium text-gray-900 min-w-[60px] text-right">
                                            R$ {Number(item.preco || 0).toFixed(2)}
                                          </span>
                                          {item.codigo && (
                                            <span className="text-[9px] font-mono text-gray-400">{item.codigo}</span>
                                          )}
                                          <button
                                            type="button"
                                            onClick={() => navigate(`/pricelist/editar/${item.id}`)}
                                            className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                            title="Abrir ficha completa"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ) : (
                          <>
                          {/* Aba Raiz - Itens sem subcategoria */}
                          {(abaAtivaPorCategoria[cat.id] === "raiz" || !abaAtivaPorCategoria[cat.id]) && (
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                              {/* Header com seleçÍo múltipla */}
                              <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {(itensRaiz[cat.id] || []).length > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => selecionarTodos(cat.id)}
                                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                          (itensRaiz[cat.id] || []).length > 0 &&
                                          (itensRaiz[cat.id] || []).every(item =>
                                            (itensSelecionados[cat.id] || new Set()).has(item.id)
                                          )
                                            ? "bg-wg-primary border-wg-primary text-white"
                                            : "border-gray-300 hover:border-wg-primary"
                                        }`}
                                        title="Selecionar todos"
                                      >
                                        {(itensRaiz[cat.id] || []).length > 0 &&
                                          (itensRaiz[cat.id] || []).every(item =>
                                            (itensSelecionados[cat.id] || new Set()).has(item.id)
                                          ) && <Check className="w-3 h-3" />}
                                      </button>
                                    )}
                                    <span className="text-xs font-medium text-gray-700">
                                      Itens sem subcategoria
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {carregandoRaiz === cat.id && (
                                      <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                                    )}
                                  </div>
                                </div>

                                {/* Barra de ações quando há itens selecionados */}
                                {getQtdSelecionados(cat.id) > 0 && (
                                  <div className="mt-2 flex items-center gap-2 p-2 bg-wg-primary/10 rounded-lg flex-wrap">
                                    <span className="text-xs font-normal text-wg-primary">
                                      {getQtdSelecionados(cat.id)} selecionado(s)
                                    </span>
                                    <span className="text-gray-300">|</span>
                                    {subcategorias.length > 0 ? (
                                      <>
                                        <span className="text-xs text-gray-600">Mover para:</span>
                                        <select
                                          className="text-xs px-2 py-1 border border-wg-primary rounded bg-white text-gray-700 cursor-pointer focus:ring-1 focus:ring-wg-primary focus:outline-none"
                                          defaultValue=""
                                          disabled={salvando}
                                          title="Selecionar subcategoria para mover itens"
                                          onChange={(e) => {
                                            if (e.target.value) {
                                              classificarSelecionados(cat.id, e.target.value);
                                              e.target.value = "";
                                            }
                                          }}
                                        >
                                          <option value="">Escolher subcategoria...</option>
                                          {subcategorias.map((sub) => {
                                            const prefixo = getPrefixoSubcategoria(sub.nome);
                                            return (
                                              <option key={sub.id} value={sub.id}>
                                                [{prefixo}] {sub.nome}
                                              </option>
                                            );
                                          })}
                                        </select>
                                      </>
                                    ) : (
                                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                        Adicione subcategorias primeiro (clique no botÍo +)
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => setItensSelecionados(prev => ({ ...prev, [cat.id]: new Set() }))}
                                      className="text-xs text-gray-500 hover:text-gray-700 px-2"
                                    >
                                      Limpar
                                    </button>
                                  </div>
                                )}

                                {/* Alerta quando não há subcategorias mas tem itens para classificar */}
                                {subcategorias.length === 0 && (itensRaiz[cat.id] || []).length > 0 && getQtdSelecionados(cat.id) === 0 && (
                                  <div className="mt-2 flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                                    <span className="text-xs text-amber-700">
                                      <strong>Dica:</strong> Para classificar os itens, primeiro adicione subcategorias clicando no botÍo{" "}
                                      <button
                                        type="button"
                                        onClick={() => setCriandoSubcategoriaAba(cat.id)}
                                        disabled={salvando}
                                        className="text-wg-primary font-normal hover:underline"
                                      >
                                        + Nova Subcategoria
                                      </button>
                                    </span>
                                  </div>
                                )}
                              </div>

                              {carregandoRaiz === cat.id ? (
                                <div className="flex items-center justify-center py-8">
                                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                  <span className="ml-2 text-[12px] text-gray-500">Carregando itens...</span>
                                </div>
                              ) : (itensRaiz[cat.id] || []).filter((item) => {
                                if (!termoBuscaItens) return true;
                                return normalizeSearchTerm(`${item.nome || ""} ${item.codigo || ""} ${item.unidade || ""}`).includes(termoBuscaItens);
                              }).length === 0 ? (
                                <div className="text-center py-6 text-gray-400">
                                  <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                  <p className="text-[12px]">Nenhum item encontrado</p>
                                  <p className="text-xs mt-1">Ajuste o termo de busca ou mova itens para esta aba</p>
                                </div>
                              ) : (
                                <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                                  {(itensRaiz[cat.id] || [])
                                    .filter((item) => {
                                      if (!termoBuscaItens) return true;
                                      return normalizeSearchTerm(`${item.nome || ""} ${item.codigo || ""} ${item.unidade || ""}`).includes(termoBuscaItens);
                                    })
                                    .map((item, idx) => {
                                    // Badge de tipo
                                    const tipoLabel = {
                                      material: { label: "MAT", bg: "#3B82F6", desc: "Material" },
                                      mao_obra: { label: "MDO", bg: "#10B981", desc: "MÍo de Obra" },
                                      servico: { label: "SRV", bg: "#8B5CF6", desc: "Serviço" },
                                      produto: { label: "PRO", bg: "#F59E0B", desc: "Produto" },
                                      insumo: { label: "INS", bg: "#EF4444", desc: "Insumo" },
                                    }[(item.tipo || "") as keyof { material: { label: string; bg: string; desc: string }; mao_obra: { label: string; bg: string; desc: string }; servico: { label: string; bg: string; desc: string }; produto: { label: string; bg: string; desc: string }; insumo: { label: string; bg: string; desc: string } }] || { label: "OUT", bg: "#6B7280", desc: "Outro" };
                                    const isSelected = (itensSelecionados[cat.id] || new Set()).has(item.id);

                                    return (
                                      <div
                                        key={item.id}
                                        className={`flex items-center justify-between py-2 px-3 hover:bg-gray-50 gap-2 ${
                                          isSelected ? "bg-wg-primary/5" : ""
                                        }`}
                                      >
                                        {/* Checkbox + Número + Tipo */}
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => toggleSelecaoItem(cat.id, item.id)}
                                            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                              isSelected
                                                ? "bg-wg-primary border-wg-primary text-white"
                                                : "border-gray-300 hover:border-wg-primary"
                                            }`}
                                          >
                                            {isSelected && <Check className="w-3 h-3" />}
                                          </button>
                                          <span
                                            className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded"
                                            style={{ backgroundColor: corCategoria + "15", color: corCategoria }}
                                          >
                                            #{String(idx + 1).padStart(3, "0")}
                                          </span>
                                          {/* Select de Tipo - Clicável */}
                                          <select
                                            value={item.tipo || "material"}
                                            onChange={(e) => atualizarTipoItem(item.id, e.target.value, cat.id)}
                                            className="text-[8px] font-normal px-1 py-0.5 rounded text-white border-0 cursor-pointer appearance-none pr-3 focus:ring-1 focus:ring-white/50 focus:outline-none"
                                            style={{
                                              backgroundColor: tipoLabel.bg,
                                              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                                              backgroundRepeat: "no-repeat",
                                              backgroundPosition: "right 2px center",
                                            }}
                                            title="Clique para alterar o tipo"
                                          >
                                            <option value="material" style={{ backgroundColor: "#3B82F6", color: "white" }}>MAT</option>
                                            <option value="mao_obra" style={{ backgroundColor: "#10B981", color: "white" }}>MDO</option>
                                            <option value="servico" style={{ backgroundColor: "#8B5CF6", color: "white" }}>SRV</option>
                                            <option value="produto" style={{ backgroundColor: "#F59E0B", color: "white" }}>PRO</option>
                                            <option value="insumo" style={{ backgroundColor: "#EF4444", color: "white" }}>INS</option>
                                          </select>
                                        </div>

                                        {/* Nome do item */}
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 min-w-0">
                                            {item.imagem_url ? (
                                              <img
                                                src={item.imagem_url}
                                                alt={item.nome}
                                                className="w-5 h-5 rounded-full object-cover border border-gray-200 shrink-0"
                                              />
                                            ) : (
                                              <div
                                                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium text-white shrink-0"
                                                style={{ backgroundColor: corCategoria }}
                                                title={item.nome}
                                              >
                                                {getInicialItem(item.nome)}
                                              </div>
                                            )}
                                            <span className="text-xs text-gray-700 truncate block">{item.nome}</span>
                                          </div>
                                        </div>

                                        {/* EdiçÍo rápida: unidade + preço */}
                                        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                                          <input
                                            type="text"
                                            value={edicaoRapida[item.id]?.unidade ?? (item.unidade || "un")}
                                            onFocus={() => initEdicaoRapida(item)}
                                            onChange={(e) =>
                                              setEdicaoRapida((prev) => ({
                                                ...prev,
                                                [item.id]: {
                                                  preco: prev[item.id]?.preco ?? String(item.preco ?? 0),
                                                  unidade: e.target.value,
                                                },
                                              }))
                                            }
                                            className="w-14 text-[10px] px-1.5 py-1 border border-gray-200 rounded"
                                            title="Unidade"
                                          />
                                          <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={edicaoRapida[item.id]?.preco ?? String(item.preco ?? 0)}
                                            onFocus={() => initEdicaoRapida(item)}
                                            onChange={(e) =>
                                              setEdicaoRapida((prev) => ({
                                                ...prev,
                                                [item.id]: {
                                                  preco: e.target.value,
                                                  unidade: prev[item.id]?.unidade ?? (item.unidade || "un"),
                                                },
                                              }))
                                            }
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") {
                                                salvarEdicaoRapidaItem(item, cat.id, null);
                                              }
                                            }}
                                            className="w-24 text-[10px] px-1.5 py-1 border border-gray-200 rounded text-right"
                                            title="Preço"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => salvarEdicaoRapidaItem(item, cat.id, null)}
                                            disabled={!!salvandoInlineItem[item.id]}
                                            className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                                            title="Salvar ediçÍo rápida"
                                          >
                                            {salvandoInlineItem[item.id] ? (
                                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                              <Check className="w-3.5 h-3.5" />
                                            )}
                                          </button>
                                        </div>

                                        {/* Select de Subcategoria ou Categoria */}
                                        {subcategorias.length > 0 ? (
                                          <select
                                            className="text-[10px] px-2 py-1 border border-gray-300 rounded bg-white text-gray-700 cursor-pointer hover:border-wg-primary focus:border-wg-primary focus:ring-1 focus:ring-wg-primary focus:outline-none min-w-[100px]"
                                            defaultValue=""
                                            onChange={(e) => {
                                              if (e.target.value) {
                                                atualizarSubcategoriaItem(item.id, e.target.value, cat.id);
                                              }
                                            }}
                                            title="Mover para subcategoria"
                                          >
                                            <option value="">Classificar →</option>
                                            {subcategorias.map((sub) => {
                                              const prefixo = getPrefixoSubcategoria(sub.nome);
                                              return (
                                                <option key={sub.id} value={sub.id}>
                                                  [{prefixo}] {sub.nome}
                                                </option>
                                              );
                                            })}
                                          </select>
                                        ) : (
                                          <select
                                            className="text-[10px] px-2 py-1 border border-amber-300 rounded bg-amber-50 text-gray-700 cursor-pointer hover:border-wg-primary focus:border-wg-primary focus:ring-1 focus:ring-wg-primary focus:outline-none min-w-[110px]"
                                            defaultValue=""
                                            onChange={(e) => {
                                              if (e.target.value) {
                                                moverParaOutraCategoria(item.id, e.target.value, cat.id);
                                              }
                                            }}
                                            title="Mover para outra categoria (sem subcategorias nesta)"
                                          >
                                            <option value="">Mover p/ →</option>
                                            {categoriasDB
                                              .filter(c => c.id !== cat.id) // Excluir categoria atual
                                              .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
                                              .map((outraCat) => (
                                                <option key={outraCat.id} value={outraCat.id}>
                                                  {String(outraCat.ordem || 0).padStart(2, "0")} {outraCat.nome}
                                                </option>
                                              ))}
                                          </select>
                                        )}

                                        <button
                                          type="button"
                                          onClick={() => abrirFluxoDaCategoria(cat.id)}
                                          className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                          title="Gerenciar fluxos da categoria deste item"
                                        >
                                          <GitCompare className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => navigate(`/pricelist/editar/${item.id}`)}
                                          className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                          title="Abrir ficha completa"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => abrirEdicaoItem(item, cat.id, null)}
                                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                          title="Editar dados do item"
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => excluirItemIndividual(item.id, item.nome, cat.id)}
                                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                          title="Excluir item"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Abas de Subcategorias - Conteúdo */}
                          {subcategorias.map((sub) => {
                            if (abaAtivaPorCategoria[cat.id] !== sub.id) return null;

                            const prefixoSub = getPrefixoSubcategoria(sub.nome);
                            const contagemSub = getContagemSubcategoria(cat.id, sub.id);
                            const codigoExemplo = gerarCodigoFormatado(cat.ordem || 0, codigoCat, prefixoSub, 1);
                            const itens = itensSubcategoria[sub.id] || [];
                            const isLoadingItems = carregandoItens === sub.id;

                            return (
                              <div key={sub.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-6 h-6 rounded flex items-center justify-center text-white text-[9px] font-normal"
                                      style={{ backgroundColor: corCategoria }}
                                    >
                                      {prefixoSub}
                                    </div>
                                    <span className="text-[12px] font-medium text-gray-900">{sub.nome}</span>
                                    <span className="text-xs text-gray-400 font-mono">{codigoExemplo}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {isLoadingItems && (
                                      <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                                    )}
                                    <span
                                      className="text-xs px-2 py-0.5 rounded-full font-normal"
                                      style={{ backgroundColor: corCategoria + "20", color: corCategoria }}
                                    >
                                      {contagemSub} {contagemSub === 1 ? "item" : "itens"}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => excluirSubcategoria(sub, cat.id)}
                                      disabled={salvando}
                                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                      title={`Excluir subcategoria ${sub.nome}`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                                  {isLoadingItems ? (
                                  <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                    <span className="ml-2 text-[12px] text-gray-500">Carregando itens...</span>
                                  </div>
                                ) : itens.filter((item) => {
                                  if (!termoBuscaItens) return true;
                                  return normalizeSearchTerm(`${item.nome || ""} ${item.codigo || ""} ${item.unidade || ""}`).includes(termoBuscaItens);
                                }).length === 0 ? (
                                  <div className="text-center py-6 text-gray-400">
                                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-[12px]">Nenhum item encontrado</p>
                                  </div>
                                ) : (
                                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                                    {itens
                                      .filter((item) => {
                                        if (!termoBuscaItens) return true;
                                        return normalizeSearchTerm(`${item.nome || ""} ${item.codigo || ""} ${item.unidade || ""}`).includes(termoBuscaItens);
                                      })
                                      .map((item, idx) => (
                                      <div
                                        key={item.id}
                                        className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 gap-2"
                                      >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                          <span
                                            className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded shrink-0"
                                            style={{ backgroundColor: corCategoria + "15", color: corCategoria }}
                                          >
                                            #{String(idx + 1).padStart(3, "0")}
                                          </span>
                                          {item.imagem_url ? (
                                            <img
                                              src={item.imagem_url}
                                              alt={item.nome}
                                              className="w-5 h-5 rounded-full object-cover border border-gray-200 shrink-0"
                                            />
                                          ) : (
                                            <div
                                              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium text-white shrink-0"
                                              style={{ backgroundColor: corCategoria }}
                                              title={item.nome}
                                            >
                                              {getInicialItem(item.nome)}
                                            </div>
                                          )}
                                          <span className="text-xs text-gray-700 truncate">{item.nome}</span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <div className="hidden sm:flex items-center gap-1.5">
                                            <input
                                              type="text"
                                              value={edicaoRapida[item.id]?.unidade ?? (item.unidade || "un")}
                                              onFocus={() => initEdicaoRapida(item)}
                                              onChange={(e) =>
                                                setEdicaoRapida((prev) => ({
                                                  ...prev,
                                                  [item.id]: {
                                                    preco: prev[item.id]?.preco ?? String(item.preco ?? 0),
                                                    unidade: e.target.value,
                                                  },
                                                }))
                                              }
                                              className="w-14 text-[10px] px-1.5 py-1 border border-gray-200 rounded"
                                              title="Unidade"
                                            />
                                            <input
                                              type="number"
                                              step="0.01"
                                              min="0"
                                              value={edicaoRapida[item.id]?.preco ?? String(item.preco ?? 0)}
                                              onFocus={() => initEdicaoRapida(item)}
                                              onChange={(e) =>
                                                setEdicaoRapida((prev) => ({
                                                  ...prev,
                                                  [item.id]: {
                                                    preco: e.target.value,
                                                    unidade: prev[item.id]?.unidade ?? (item.unidade || "un"),
                                                  },
                                                }))
                                              }
                                              onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                  salvarEdicaoRapidaItem(item, cat.id, sub.id);
                                                }
                                              }}
                                              className="w-24 text-[10px] px-1.5 py-1 border border-gray-200 rounded text-right"
                                              title="Preço"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => salvarEdicaoRapidaItem(item, cat.id, sub.id)}
                                              disabled={!!salvandoInlineItem[item.id]}
                                              className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                                              title="Salvar ediçÍo rápida"
                                            >
                                              {salvandoInlineItem[item.id] ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                              ) : (
                                                <Check className="w-3.5 h-3.5" />
                                              )}
                                            </button>
                                          </div>
                                          <MoverItemDropdown
                                            item={item}
                                            categoriaAtual={cat}
                                            categorias={categoriasDB}
                                            subcategorias={subcategoriasDB.filter(s => s.categoria_id === cat.id)}
                                            subId={sub.id}
                                            onMoverParaCategoria={novaCategoriaId =>
                                              moverParaOutraCategoria(item.id, novaCategoriaId, cat.id)
                                            }
                                            onMoverParaSubcategoria={novaSubId =>
                                              reclassificarItem(item.id, novaSubId, sub.id, cat.id)
                                            }
                                          />
                                          <button
                                            type="button"
                                            onClick={() => abrirFluxoDaCategoria(cat.id)}
                                            className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                            title="Gerenciar fluxos da categoria deste item"
                                          >
                                            <GitCompare className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => navigate(`/pricelist/editar/${item.id}`)}
                                            className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                            title="Abrir ficha completa"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => abrirEdicaoItem(item, cat.id, sub.id)}
                                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                            title="Editar dados do item"
                                          >
                                            <Pencil className="w-3.5 h-3.5" />
                                          </button>
                                          {/* BotÍo excluir item */}
                                          <button
                                            type="button"
                                            onClick={() => excluirItemIndividual(item.id, item.nome, cat.id, sub.id)}
                                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                            title="Excluir item"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Mensagem quando não há subcategorias */}
                          {subcategorias.length === 0 && (
                            <div className="text-center py-6 text-gray-500 bg-white rounded-lg border border-gray-200">
                              <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                              <p className="text-[12px] mb-2">Nenhuma subcategoria cadastrada</p>
                              <button
                                type="button"
                                onClick={() => adicionarSubcategoriaPadrao(cat.id, cat)}
                                disabled={salvando}
                                className="text-xs text-wg-primary hover:underline"
                              >
                                Adicionar subcategorias padrÍo
                              </button>
                            </div>
                          )}
                          </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {categoriasFiltradas.length === 0 && !loading && (
              <div className="text-center py-10 text-gray-500">
                <FolderTree className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma categoria encontrada</p>
              </div>
            )}

            {/* Legenda Subcategorias PadrÍo */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-normal text-gray-900 mb-3 flex items-center gap-2">
                <Palette className="w-4 h-4 text-wg-primary" />
                Subcategorias PadrÍo do Sistema
              </h3>
              <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
                {SUBCATEGORIAS_WORKFLOW_PADRAO.map((sub) => (
                  <div
                    key={sub.prefixo}
                    className="min-w-[120px] px-2.5 py-2 rounded border text-center shrink-0"
                    style={{
                      backgroundColor: SUBCATEGORIA_CORES_REPRESENTACAO[sub.prefixo]?.bg || "#F9FAFB",
                      borderColor: SUBCATEGORIA_CORES_REPRESENTACAO[sub.prefixo]?.border || "#E5E7EB",
                    }}
                  >
                    <p
                      className="font-mono text-[18px] font-semibold leading-tight"
                      style={{ color: SUBCATEGORIA_CORES_REPRESENTACAO[sub.prefixo]?.text || "#1F2937" }}
                    >
                      {sub.prefixo}
                    </p>
                    <p className="text-[11px] font-medium text-gray-900 leading-tight mt-1">{sub.nome}</p>
                    <p className="text-[10px] text-gray-500 leading-tight mt-0.5">Aba padrÍo</p>
                  </div>
                ))}
              </div>
            </div>
            </>)}
          </div>
        )}
      </div>

      {/* Modal de EdiçÍo de Item (centralizado nesta página) */}
      {itemEditando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[95]">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900">Editar Item do Pricelist</h3>
              <button
                type="button"
                onClick={() => setItemEditando(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="text-xs text-gray-600">Nome</label>
                <input
                  value={itemEditando.nome}
                  onChange={(e) => setItemEditando((prev) => prev ? { ...prev, nome: e.target.value } : prev)}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Código</label>
                <input
                  value={itemEditando.codigo}
                  onChange={(e) => setItemEditando((prev) => prev ? { ...prev, codigo: e.target.value } : prev)}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Unidade</label>
                <input
                  value={itemEditando.unidade}
                  onChange={(e) => setItemEditando((prev) => prev ? { ...prev, unidade: e.target.value } : prev)}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Custo de AquisiçÍo</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemEditando.custo_aquisicao || ""}
                  onChange={(e) => setItemEditando((prev) => prev ? { ...prev, custo_aquisicao: Number(e.target.value || 0) } : prev)}
                  placeholder="0.00"
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
                {itemEditando.custo_aquisicao > 0 && (
                  <p className="text-[10px] text-teal-600 mt-0.5">
                    Preço será recalculado automaticamente ao salvar
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-600">
                  Preço de Venda {itemEditando.custo_aquisicao > 0 ? "(auto)" : ""}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemEditando.preco}
                  onChange={(e) => setItemEditando((prev) => prev ? { ...prev, preco: Number(e.target.value || 0) } : prev)}
                  className={`w-full mt-1 px-3 py-2 border rounded-lg text-sm ${
                    itemEditando.custo_aquisicao > 0
                      ? "border-gray-100 bg-gray-50 text-gray-500"
                      : "border-gray-200"
                  }`}
                  readOnly={itemEditando.custo_aquisicao > 0}
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Tipo</label>
                <select
                  value={itemEditando.tipo}
                  onChange={(e) => setItemEditando((prev) => prev ? { ...prev, tipo: e.target.value } : prev)}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  <option value="material">Material</option>
                  <option value="mao_obra">MÍo de Obra</option>
                  <option value="servico">Serviço</option>
                  <option value="produto">Produto</option>
                  <option value="insumo">Insumo</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600">Categoria</label>
                <select
                  value={itemEditando.categoria_id}
                  onChange={(e) => {
                    const novoCat = e.target.value;
                    setItemEditando((prev) => prev ? { ...prev, categoria_id: novoCat, subcategoria_id: "" } : prev);
                  }}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  {categoriasDB.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600">Subcategoria</label>
                <select
                  value={itemEditando.subcategoria_id}
                  onChange={(e) => setItemEditando((prev) => prev ? { ...prev, subcategoria_id: e.target.value } : prev)}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  <option value="">Sem subcategoria</option>
                  {subcategoriasDB
                    .filter((sub) => sub.categoria_id === itemEditando.categoria_id)
                    .map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.nome}</option>
                    ))}
                </select>
              </div>
              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={itemEditando.ativo}
                    onChange={(e) => setItemEditando((prev) => prev ? { ...prev, ativo: e.target.checked } : prev)}
                  />
                  Item ativo
                </label>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setItemEditando(null)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvarItemEditado}
                disabled={salvando}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-60"
              >
                {salvando ? "Salvando..." : "Salvar item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Gerenciamento de Fluxos */}
      {modalFluxosAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-normal text-gray-900 flex items-center gap-2">
                  <GitCompare className="w-6 h-6 text-purple-600" />
                  Gerenciar Fluxos de Trabalho
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Organize fases, tarefas e recursos para cada categoria
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalFluxosAberto(false);
                  setCategoriaFluxoSelecionada(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Seletor de Categoria */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecione uma categoria para gerenciar seu fluxo
                  </label>
                  <select
                    value={categoriaFluxoSelecionada || ""}
                    onChange={(e) => setCategoriaFluxoSelecionada(e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Selecione uma categoria...</option>
                    {categoriasDB
                      .filter((cat) => cat.ativo)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.codigo ? `${cat.codigo} - ` : ""}{cat.nome}
                        </option>
                    ))}
                  </select>
                </div>

                {categoriaFluxoSelecionada && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">Montagem Automática</h3>
                        <p className="text-xs text-gray-500">
                          Escolha os seletores e gere fases, tarefas e recursos automaticamente.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={construirFluxoAutomatico}
                        className="px-3 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90"
                      >
                        Montar Automático
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Modelo</label>
                        <select
                          value={autoFluxoPreset}
                          onChange={(e) => setAutoFluxoPreset(e.target.value as "agil" | "essencial" | "completo")}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                        >
                          <option value="agil">Agil</option>
                          <option value="essencial">Essencial</option>
                          <option value="completo">Completo</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Quantidade de fases</label>
                        <select
                          value={autoFluxoQtdFases}
                          onChange={(e) => setAutoFluxoQtdFases(Number(e.target.value) as 2 | 3 | 4 | 5)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                        >
                          <option value={2}>2 fases</option>
                          <option value={3}>3 fases</option>
                          <option value={4}>4 fases</option>
                          <option value={5}>5 fases</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Intensidade</label>
                        <select
                          value={autoFluxoIntensidade}
                          onChange={(e) => setAutoFluxoIntensidade(e.target.value as "baixa" | "media" | "alta")}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                        >
                          <option value="baixa">Baixa (menos recursos)</option>
                          <option value="media">Media (equilibrado)</option>
                          <option value="alta">Alta (mais recursos)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Editor de Fluxo */}
                {categoriaFluxoSelecionada ? (
                  carregandoFluxo ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                    </div>
                  ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Coluna 1 e 2: Editor de Fluxo */}
                    <div className="lg:col-span-2 space-y-4">
                    {/* Cabeçalho das Fases */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">Fases do Fluxo</h3>
                      <button
                        type="button"
                        onClick={() => {
                          const novaFase = {
                            id: `fase-${Date.now()}`,
                            nome: "Nova Fase",
                            descricao: "",
                            tarefas: [],
                          };
                          setFluxoAtual(prev => ({
                            fases: [...prev.fases, novaFase]
                          }));
                          setEditandoFase(novaFase.id);
                        }}
                        className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1.5 text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Nova Fase
                      </button>
                    </div>

                    {/* Lista de Fases */}
                    {fluxoAtual.fases.length === 0 ? (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                        <GitCompare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">
                          Nenhuma fase criada. Clique em "Nova Fase" para começar.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {fluxoAtual.fases.map((fase, faseIndex) => (
                          <div
                            key={fase.id}
                            className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                          >
                            {/* Header da Fase */}
                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-200 p-4">
                              <div className="flex items-center gap-3">
                                <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" title="Arrastar para reordenar" />
                                {editandoFase === fase.id ? (
                                  <div className="flex-1 space-y-2">
                                    <input
                                      type="text"
                                      value={fase.nome}
                                      onChange={(e) => {
                                        setFluxoAtual(prev => ({
                                          fases: prev.fases.map(f =>
                                            f.id === fase.id ? { ...f, nome: e.target.value } : f
                                          )
                                        }));
                                      }}
                                      className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm font-medium"
                                      placeholder="Nome da fase"
                                    />
                                    <input
                                      type="text"
                                      value={fase.descricao}
                                      onChange={(e) => {
                                        setFluxoAtual(prev => ({
                                          fases: prev.fases.map(f =>
                                            f.id === fase.id ? { ...f, descricao: e.target.value } : f
                                          )
                                        }));
                                      }}
                                      className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                                      placeholder="DescriçÍo da fase"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex-1">
                                    <h4 className="font-medium text-gray-900">
                                      {faseIndex + 1}. {fase.nome}
                                    </h4>
                                    {fase.descricao && (
                                      <p className="text-sm text-gray-600 mt-1">{fase.descricao}</p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                      {fase.tarefas.length} {fase.tarefas.length === 1 ? "tarefa" : "tarefas"}
                                    </p>
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  {editandoFase === fase.id ? (
                                    <button
                                      type="button"
                                      onClick={() => setEditandoFase(null)}
                                      className="p-2 text-green-600 hover:bg-green-50 rounded"
                                      title="Concluir ediçÍo"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setEditandoFase(fase.id)}
                                      className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                                      title="Editar fase"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`Excluir a fase "${fase.nome}"?`)) {
                                        setFluxoAtual(prev => ({
                                          fases: prev.fases.filter(f => f.id !== fase.id)
                                        }));
                                      }
                                    }}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                                    title="Excluir fase"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Lista de Tarefas da Fase */}
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="text-sm font-medium text-gray-700">Tarefas</h5>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const novaTarefa = {
                                      id: `tarefa-${Date.now()}`,
                                      nome: "Nova Tarefa",
                                      descricao: "",
                                      tempoEstimadoMinutos: 0,
                                      recursos: [],
                                    };
                                    setFluxoAtual(prev => ({
                                      fases: prev.fases.map(f =>
                                        f.id === fase.id
                                          ? { ...f, tarefas: [...f.tarefas, novaTarefa] }
                                          : f
                                      )
                                    }));
                                    setEditandoTarefa({ faseId: fase.id, tarefaId: novaTarefa.id });
                                  }}
                                  className="px-2 py-1 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" />
                                  Adicionar Tarefa
                                  </button>
                              </div>

                              {fase.tarefas.length === 0 ? (
                                <div className="text-center py-4 text-gray-400 text-sm border border-dashed border-gray-200 rounded">
                                  Nenhuma tarefa nesta fase
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {fase.tarefas.map((tarefa, tarefaIndex) => {
                                    const estaEditando = editandoTarefa?.faseId === fase.id && editandoTarefa?.tarefaId === tarefa.id;
                                    return (
                                      <div
                                        key={tarefa.id}
                                        className="bg-gray-50 border border-gray-200 rounded p-3"
                                        onDragOver={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          e.dataTransfer.dropEffect = 'copy';
                                          const target = e.currentTarget;
                                          target.classList.add('ring-2', 'ring-purple-400', 'bg-purple-50');
                                        }}
                                        onDragEnter={(e) => {
                                          e.preventDefault();
                                        }}
                                        onDragLeave={(e) => {
                                          const target = e.currentTarget;
                                          const rect = target.getBoundingClientRect();
                                          const x = e.clientX;
                                          const y = e.clientY;

                                          // Só remove o highlight se realmente saiu do elemento
                                          if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
                                            target.classList.remove('ring-2', 'ring-purple-400', 'bg-purple-50');
                                          }
                                        }}
                                        onDrop={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          const target = e.currentTarget;
                                          target.classList.remove('ring-2', 'ring-purple-400', 'bg-purple-50');

                                          // Recuperar dados do item arrastado
                                          let itemData = null;
                                          try {
                                            const jsonData = e.dataTransfer.getData('application/json');
                                            if (jsonData) {
                                              itemData = JSON.parse(jsonData);
                                            }
                                          } catch (err) {
                                            console.error('Erro ao parsear dados do drag:', err);
                                          }

                                          // Usar itemArrastando como fallback se dataTransfer falhar
                                          const item = itemArrastando;

                                          if (item) {
                                            // Mostrar seletor de tipo de recurso
                                            const tipos = [
                                              { value: 'ferramenta', label: '🔧 Ferramenta' },
                                              { value: 'insumo', label: '📦 Insumo' },
                                              { value: 'epi', label: '🦺 EPI' },
                                              { value: 'materialCinza', label: '🏗️ Material Cinza' },
                                              { value: 'acabamento', label: '✨ Acabamento' },
                                              { value: 'produto', label: '📱 Produto' },
                                            ];
                                            const tipoEscolhido = prompt(`Adicionar "${item.nome}" como:\n\n${tipos.map((t, i) => `${i + 1}. ${t.label}`).join('\n')}\n\nDigite o número (1-6):`);
                                            if (tipoEscolhido && tipoEscolhido.trim()) {
                                              const index = parseInt(tipoEscolhido) - 1;
                                              if (index >= 0 && index < tipos.length) {
                                                adicionarRecursoNaTarefa(fase.id, tarefa.id, item, tipos[index].value as any);
                                                toast({
                                                  title: "✅ Recurso adicionado",
                                                  description: `${item.nome} foi adicionado como ${tipos[index].label}`,
                                                });
                                              } else {
                                                toast({
                                                  title: "❌ Número inválido",
                                                  description: "Digite um número entre 1 e 6",
                                                  variant: "destructive",
                                                });
                                              }
                                            }
                                          }
                                        }}
                                      >
                                        {estaEditando ? (
                                          <div className="space-y-2">
                                            <input
                                              type="text"
                                              value={tarefa.nome}
                                              onChange={(e) => {
                                                setFluxoAtual(prev => ({
                                                  fases: prev.fases.map(f =>
                                                    f.id === fase.id
                                                      ? {
                                                          ...f,
                                                          tarefas: f.tarefas.map(t =>
                                                            t.id === tarefa.id ? { ...t, nome: e.target.value } : t
                                                          )
                                                        }
                                                      : f
                                                  )
                                                }));
                                              }}
                                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                              placeholder="Nome da tarefa"
                                            />
                                            <input
                                              type="text"
                                              value={tarefa.descricao}
                                              onChange={(e) => {
                                                setFluxoAtual(prev => ({
                                                  fases: prev.fases.map(f =>
                                                    f.id === fase.id
                                                      ? {
                                                          ...f,
                                                          tarefas: f.tarefas.map(t =>
                                                            t.id === tarefa.id ? { ...t, descricao: e.target.value } : t
                                                          )
                                                        }
                                                      : f
                                                  )
                                                }));
                                              }}
                                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                              placeholder="DescriçÍo"
                                            />
                                            <div className="flex items-center gap-2">
                                              <label className="text-xs text-gray-600">Tempo estimado (min):</label>
                                              <input
                                                type="number"
                                                value={tarefa.tempoEstimadoMinutos}
                                                onChange={(e) => {
                                                  setFluxoAtual(prev => ({
                                                    fases: prev.fases.map(f =>
                                                      f.id === fase.id
                                                        ? {
                                                            ...f,
                                                            tarefas: f.tarefas.map(t =>
                                                              t.id === tarefa.id
                                                                ? { ...t, tempoEstimadoMinutos: parseInt(e.target.value) || 0 }
                                                                : t
                                                            )
                                                          }
                                                        : f
                                                    )
                                                  }));
                                                }}
                                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                                min="0"
                                              />
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => setEditandoTarefa(null)}
                                              className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                            >
                                              Concluir
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="flex items-start gap-2">
                                            <GripVertical className="w-4 h-4 text-gray-400 cursor-grab mt-0.5" />
                                            <div className="flex-1">
                                              <p className="text-sm font-medium text-gray-900">
                                                {tarefaIndex + 1}. {tarefa.nome}
                                              </p>
                                              {tarefa.descricao && (
                                                <p className="text-xs text-gray-600 mt-1">{tarefa.descricao}</p>
                                              )}
                                              {tarefa.tempoEstimadoMinutos > 0 && (
                                                <p className="text-xs text-blue-600 mt-1">
                                                  ⏱ {tarefa.tempoEstimadoMinutos} min
                                                </p>
                                              )}

                                              {/* Recursos da Tarefa */}
                                              {tarefa.recursos && tarefa.recursos.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-gray-300">
                                                  <p className="text-xs font-medium text-gray-700 mb-2">Recursos:</p>
                                                  <div className="space-y-1">
                                                    {tarefa.recursos.map((recurso) => (
                                                      <div key={recurso.id} className="flex items-center gap-2 text-xs bg-white border border-gray-200 rounded px-2 py-1">
                                                        <select
                                                          value={recurso.tipo}
                                                          onChange={(e) => atualizarTipoRecurso(fase.id, tarefa.id, recurso.id, e.target.value as any)}
                                                          className="text-xs border-0 bg-transparent focus:ring-0 p-0 font-medium"
                                                          style={{ color:
                                                            recurso.tipo === 'ferramenta' ? '#2563eb' :
                                                            recurso.tipo === 'insumo' ? '#dc2626' :
                                                            recurso.tipo === 'epi' ? '#16a34a' :
                                                            recurso.tipo === 'materialCinza' ? '#6b7280' :
                                                            recurso.tipo === 'acabamento' ? '#9333ea' :
                                                            '#f59e0b'
                                                          }}
                                                        >
                                                          <option value="ferramenta">🔧 Ferramenta</option>
                                                          <option value="insumo">📦 Insumo</option>
                                                          <option value="epi">🦺 EPI</option>
                                                          <option value="materialCinza">🏗️ Mat. Cinza</option>
                                                          <option value="acabamento">✨ Acabamento</option>
                                                          <option value="produto">📱 Produto</option>
                                                        </select>
                                                        <span className="text-gray-600">•</span>
                                                        <span className="flex-1 truncate" title={recurso.itemNome}>
                                                          {recurso.itemNome}
                                                        </span>
                                                        <input
                                                          type="number"
                                                          value={recurso.quantidade}
                                                          onChange={(e) => atualizarQuantidadeRecurso(fase.id, tarefa.id, recurso.id, parseFloat(e.target.value) || 0)}
                                                          className="w-12 text-xs border border-gray-300 rounded px-1 py-0.5 text-center"
                                                          min="0"
                                                          step="0.1"
                                                        />
                                                        <button
                                                          type="button"
                                                          onClick={() => removerRecurso(fase.id, tarefa.id, recurso.id)}
                                                          className="text-red-500 hover:text-red-700"
                                                          title="Remover recurso"
                                                        >
                                                          <X className="w-3 h-3" />
                                                        </button>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}

                                              {/* Drop Zone Visual */}
                                              <div className="mt-2 pt-2 border-t border-dashed border-gray-300">
                                                <p className="text-xs text-gray-400 text-center">
                                                  Arraste itens aqui para adicionar recursos
                                                </p>
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <button
                                                type="button"
                                                onClick={() => setEditandoTarefa({ faseId: fase.id, tarefaId: tarefa.id })}
                                                className="p-1 text-gray-600 hover:bg-gray-200 rounded"
                                                title="Editar tarefa"
                                              >
                                                <Edit2 className="w-3 h-3" />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  if (confirm(`Excluir a tarefa "${tarefa.nome}"?`)) {
                                                    setFluxoAtual(prev => ({
                                                      fases: prev.fases.map(f =>
                                                        f.id === fase.id
                                                          ? { ...f, tarefas: f.tarefas.filter(t => t.id !== tarefa.id) }
                                                          : f
                                                      )
                                                    }));
                                                  }
                                                }}
                                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                title="Excluir tarefa"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    </div>

                    {/* Coluna 3: Itens Disponíveis */}
                    <div className="lg:col-span-1 space-y-4">
                      <div className="sticky top-0 bg-gray-100 pb-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Itens Disponíveis</h3>

                        {/* Busca de Itens */}
                        <div className="relative mb-3">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={buscaItens}
                            onChange={(e) => setBuscaItens(e.target.value)}
                            placeholder="Buscar item..."
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                          {buscaItens && (
                            <button
                              type="button"
                              onClick={() => setBuscaItens("")}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                            >
                              <X className="w-3 h-3 text-gray-400" />
                            </button>
                          )}
                        </div>

                        <p className="text-xs text-gray-500 mb-4">
                          {itensFiltrados.length} {itensFiltrados.length === 1 ? "item encontrado" : "itens encontrados"}
                          {buscaItens && ` de ${itensCategoria.length} total`}
                        </p>

                        <div className="bg-white border border-gray-200 rounded-lg max-h-[500px] overflow-y-auto">
                          {itensFiltrados.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">
                              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              {buscaItens ? "Nenhum item encontrado" : "Nenhum item cadastrado"}
                            </div>
                          ) : (
                            <div className="divide-y divide-gray-100">
                              {itensFiltrados.map((item) => (
                                <div
                                  key={item.id}
                                  draggable
                                  onDragStart={(e) => {
                                    e.dataTransfer.effectAllowed = 'copy';
                                    e.dataTransfer.setData('application/json', JSON.stringify({
                                      id: item.id,
                                      nome: item.nome,
                                      codigo: item.codigo,
                                    }));
                                    setItemArrastando(item);
                                    e.currentTarget.classList.add('opacity-50');
                                  }}
                                  onDragEnd={(e) => {
                                    e.currentTarget.classList.remove('opacity-50');
                                    setItemArrastando(null);
                                  }}
                                  className="p-3 hover:bg-purple-50 cursor-move transition-colors border-l-4 border-transparent hover:border-purple-500"
                                  title={`Arraste para adicionar como recurso - Código: ${item.codigo || 'sem código'}`}
                                >
                                  <div className="flex items-start gap-2">
                                    <GripVertical className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {item.nome}
                                      </p>
                                      {item.codigo && (
                                        <p className="text-xs text-gray-500 font-mono">
                                          {item.codigo}
                                        </p>
                                      )}
                                      {item.subcategoria && (
                                        <p className="text-xs text-purple-600 mt-1">
                                          {item.subcategoria.nome}
                                        </p>
                                      )}
                                      <p className="text-xs text-gray-600 mt-1">
                                        {item.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <p className="text-xs text-purple-800">
                            <strong>💡 Como usar:</strong> Arraste os itens e solte sobre uma tarefa para adicionar como recurso (ferramentas, insumos, EPIs, etc.)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  )
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
                    <GitCompare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      Selecione uma categoria acima para começar a gerenciar seu fluxo de trabalho
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer do Modal */}
            <div className="border-t border-gray-200 p-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setModalFluxosAberto(false);
                  setCategoriaFluxoSelecionada(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={salvarFluxo}
                disabled={!categoriaFluxoSelecionada || salvando}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {salvando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar Fluxo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


