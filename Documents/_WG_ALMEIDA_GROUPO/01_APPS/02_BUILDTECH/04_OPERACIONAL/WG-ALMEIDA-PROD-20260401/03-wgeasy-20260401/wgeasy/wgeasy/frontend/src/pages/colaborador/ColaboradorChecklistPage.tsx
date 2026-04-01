/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// PAGINA: Checklist do Colaborador
// Sistema WG Easy - Grupo WG Almeida
// Réplica do CriacaoChecklistPage adaptada para área do colaborador
// ============================================================

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  Check,
  Circle,
  CheckCircle2,
  Trash2,
  Archive,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  ListChecks,
  ClipboardPaste,
  X,
  Palette,
  Calendar,
  Clock,
  User,
  Users,
  Filter,
  AlertCircle,
} from "lucide-react";
import MentionInput, { extrairMencoesDoTexto } from "@/components/common/MentionInput";
import { useToast } from "@/components/ui/use-toast";
import { useUsuarioLogado } from "@/hooks/useUsuarioLogado";
import { supabase } from "@/lib/supabaseClient";
import { obterAvatarUrl } from "@/utils/avatarUtils";

interface ClienteOption {
  id: string;
  nome: string;
  avatar_url?: string | null;
  foto_url?: string | null;
  avatar?: string | null;
}

import {
  listarNotasHierarquico,
  listarItensMencionados,
  criarNota,
  adicionarItem,
  toggleItemCheck,
  excluirItem,
  arquivarNota,
  excluirNota,
  atualizarItemDeadline,
  CORES_NOTAS,
  NotaSistema,
  NotaSistemaItem,
  FiltroChecklist,
} from "@/lib/notasSistemaApi";
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";

// ============================================================
// TIPOS
// ============================================================

type Prioridade = 'baixa' | 'media' | 'alta';

const PRIORIDADE_CONFIG: Record<Prioridade, { label: string; cor: string; bg: string }> = {
  baixa: { label: 'Baixa', cor: 'text-gray-600', bg: 'bg-gray-100' },
  media: { label: 'Média', cor: 'text-amber-600', bg: 'bg-amber-100' },
  alta: { label: 'Alta', cor: 'text-red-600', bg: 'bg-red-100' },
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function ColaboradorChecklistPage() {
  const { usuario, isMaster, isAdmin } = useUsuarioLogado();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const notaSelecionadaId = searchParams.get("nota");
  const notaRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Estados
  const [notas, setNotas] = useState<NotaSistema[]>([]);
  const [itensMencionados, setItensMencionados] = useState<NotaSistemaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());
  const [atualizandoItem, setAtualizandoItem] = useState<string | null>(null);
  const [filtroAtivo, setFiltroAtivo] = useState<FiltroChecklist>('minhas');

  // Estado do formulario de nova nota
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [novaNota, setNovaNota] = useState<{
    titulo: string;
    descricao: string;
    cor: (typeof CORES_NOTAS)[keyof typeof CORES_NOTAS];
    clienteVinculadoId: string;
    itens: Array<{ texto: string; mencionado_id?: string; deadline?: string; prioridade?: Prioridade }>;
  }>({
    titulo: "",
    descricao: "",
    cor: CORES_NOTAS.amarelo,
    clienteVinculadoId: "",
    itens: [],
  });
  const [novoItemTexto, setNovoItemTexto] = useState("");
  const [novoItemDeadline, setNovoItemDeadline] = useState("");
  const [novoItemPrioridade, setNovoItemPrioridade] = useState<Prioridade>('media');
  const [textoParaColar, setTextoParaColar] = useState("");
  const [mostrarColar, setMostrarColar] = useState(false);
  const [mostrarCores, setMostrarCores] = useState(false);
  const [criandoNota, setCriandoNota] = useState(false);

  // Estado para clientes (para vincular tarefas)
  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [carregandoClientes, setCarregandoClientes] = useState(false);
  const [clientesVinculados, setClientesVinculados] = useState<Record<string, ClienteOption>>({});

  // IDs do usuario atual
  const usuarioAtualId = usuario?.id;
  const pessoaAtualId = usuario?.pessoa_id;
  const authUserId = usuario?.auth_user_id;
  const tipoUsuario = usuario?.tipo_usuario || 'COLABORADOR';
  const isAdminOuMaster = isMaster || isAdmin;

  useEffect(() => {
    if (!notaSelecionadaId || notas.length === 0) return;
    if (!notas.some((nota) => nota.id === notaSelecionadaId)) return;

    setExpandidos((prev) => {
      const next = new Set(prev);
      next.add(notaSelecionadaId);
      return next;
    });

    const alvo = notaRefs.current[notaSelecionadaId];
    if (alvo) {
      alvo.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [notaSelecionadaId, notas]);

  // ============================================================
  // CARREGAR DADOS
  // ============================================================

  const carregarClientesVinculados = useCallback(async (clienteIds: string[]) => {
    if (clienteIds.length === 0) return;

    try {
      const { data, error } = await supabase
        .from("pessoas")
        .select("id, nome, avatar_url, foto_url, avatar")
        .in("id", clienteIds);

      if (error) throw error;

      setClientesVinculados((prev) => {
        const next = { ...prev };
        (data || []).forEach((cliente) => {
          next[cliente.id] = cliente as ClienteOption;
        });
        return next;
      });
    } catch (error) {
      console.error("Erro ao carregar clientes vinculados:", error);
    }
  }, []);

  const carregarDados = useCallback(async () => {
    if (!usuarioAtualId || !pessoaAtualId) {
      setNotas([]);
      setItensMencionados([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [notasData, mencionadosData] = await Promise.all([
        listarNotasHierarquico({
          usuarioId: usuarioAtualId,
          pessoaId: pessoaAtualId,
          tipoUsuario,
          filtro: filtroAtivo,
          authUserId,
        }),
        listarItensMencionados(pessoaAtualId),
      ]);

      setNotas(notasData);
      setItensMencionados(mencionadosData);

      const clienteIds = notasData
        .filter((nota) => nota.vinculo_tipo === 'cliente' && nota.vinculo_id)
        .map((nota) => nota.vinculo_id as string);

      if (clienteIds.length > 0) {
        carregarClientesVinculados(clienteIds);
      }

      if (notasData.length === 1) {
        setExpandidos(new Set([notasData[0].id]));
      }
    } catch (error) {
      console.error("Erro ao carregar tarefas:", error);
    } finally {
      setLoading(false);
    }
  }, [usuarioAtualId, pessoaAtualId, authUserId, tipoUsuario, filtroAtivo, carregarClientesVinculados]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const clientesCarregados = useRef(false);
  const carregarClientes = useCallback(async () => {
    if (clientesCarregados.current) return;
    clientesCarregados.current = true;

    setCarregandoClientes(true);
    try {
      const { data, error } = await supabase
        .from("pessoas")
        .select("id, nome, avatar_url, foto_url, avatar")
        .eq("tipo", "CLIENTE")
        .eq("ativo", true)
        .or("status.is.null,status.neq.concluido")
        .order("nome", { ascending: true })
        .limit(200);

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      clientesCarregados.current = false;
    } finally {
      setCarregandoClientes(false);
    }
  }, []);

  useEffect(() => {
    if (mostrarFormulario) {
      carregarClientes();
    }
  }, [mostrarFormulario, carregarClientes]);

  // ============================================================
  // ESTATISTICAS
  // ============================================================

  const resumo = useMemo(() => {
    let itensTotais = 0;
    let itensConcluidos = 0;
    let itensComDeadline = 0;
    let itensAtrasados = 0;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    notas.forEach((nota) => {
      const itens = nota.itens || [];
      itensTotais += itens.length;
      itensConcluidos += itens.filter((item) => item.checked).length;

      itens.forEach((item) => {
        if (item.deadline) {
          itensComDeadline++;
          const deadline = new Date(item.deadline);
          deadline.setHours(0, 0, 0, 0);
          if (deadline < hoje && !item.checked) {
            itensAtrasados++;
          }
        }
      });
    });

    const pendentes = Math.max(0, itensTotais - itensConcluidos);
    const progresso = itensTotais > 0 ? Math.round((itensConcluidos / itensTotais) * 100) : 0;
    const mencoesNaoLidas = itensMencionados.filter((item) => !item.checked).length;

    return {
      itensTotais,
      itensConcluidos,
      pendentes,
      progresso,
      notasTotais: notas.length,
      mencoesNaoLidas,
      itensComDeadline,
      itensAtrasados,
    };
  }, [notas, itensMencionados]);

  // ============================================================
  // HANDLERS
  // ============================================================

  const toggleExpandir = (noteId: string) => {
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(noteId)) next.delete(noteId);
      else next.add(noteId);
      return next;
    });
  };

  const handleToggleItem = async (nota: NotaSistema, item: NotaSistemaItem) => {
    if (!pessoaAtualId) return;

    setAtualizandoItem(item.id);
    try {
      const sucesso = await toggleItemCheck(item.id, !item.checked, pessoaAtualId);

      if (sucesso) {
        setNotas((prev) =>
          prev.map((n) => {
            if (n.id !== nota.id) return n;
            return {
              ...n,
              itens: n.itens?.map((i) =>
                i.id === item.id ? { ...i, checked: !item.checked } : i
              ),
            };
          })
        );
      } else {
        toast({
          title: "Erro",
          description: "NÍo foi possível atualizar o item.",
          variant: "destructive",
        });
      }
    } finally {
      setAtualizandoItem(null);
    }
  };

  const handleExcluirItem = async (nota: NotaSistema, itemId: string) => {
    if (!confirm("Excluir este item?")) return;

    const sucesso = await excluirItem(itemId);
    if (sucesso) {
      setNotas((prev) =>
        prev.map((n) => {
          if (n.id !== nota.id) return n;
          return {
            ...n,
            itens: n.itens?.filter((i) => i.id !== itemId),
          };
        })
      );
    }
  };

  const handleArquivarNota = async (notaId: string) => {
    if (!confirm("Arquivar esta tarefa?")) return;

    const sucesso = await arquivarNota(notaId);
    if (sucesso) {
      setNotas((prev) => prev.filter((n) => n.id !== notaId));
      toast({ title: "Tarefa arquivada" });
    }
  };

  const handleExcluirNota = async (notaId: string) => {
    if (!confirm("Excluir esta tarefa permanentemente?")) return;

    const sucesso = await excluirNota(notaId);
    if (sucesso) {
      setNotas((prev) => prev.filter((n) => n.id !== notaId));
      toast({ title: "Tarefa excluída" });
    }
  };

  // ============================================================
  // CRIAR NOTA
  // ============================================================

  const handleAddItemNovaNota = () => {
    const texto = novoItemTexto.trim();
    if (!texto) return;

    const mencoes = extrairMencoesDoTexto(texto);
    const mencionadoId = mencoes.length > 0 ? mencoes[0] : undefined;

    setNovaNota((prev) => ({
      ...prev,
      itens: [...prev.itens, {
        texto,
        mencionado_id: mencionadoId,
        deadline: novoItemDeadline || undefined,
        prioridade: novoItemPrioridade,
      }],
    }));
    setNovoItemTexto("");
    setNovoItemDeadline("");
    setNovoItemPrioridade('media');
  };

  const handleRemoverItemNovaNota = (index: number) => {
    setNovaNota((prev) => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== index),
    }));
  };

  const handleColarTexto = () => {
    const linhas = textoParaColar
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (linhas.length === 0) {
      toast({ title: "Nenhum item encontrado", variant: "destructive" });
      return;
    }

    setNovaNota((prev) => ({
      ...prev,
      itens: [...prev.itens, ...linhas.map((texto) => ({ texto, prioridade: 'media' as Prioridade }))],
    }));

    setTextoParaColar("");
    setMostrarColar(false);
    toast({ title: `${linhas.length} itens adicionados` });
  };

  const handleCriarNota = async () => {
    if (!novaNota.titulo.trim()) {
      toast({ title: "Digite um título para a tarefa", variant: "destructive" });
      return;
    }

    if (!pessoaAtualId) {
      toast({ title: "Usuário nÍo identificado", variant: "destructive" });
      return;
    }

    setCriandoNota(true);
    try {
      const clienteNome = novaNota.clienteVinculadoId
        ? clientes.find(c => c.id === novaNota.clienteVinculadoId)?.nome
        : undefined;

      const notaCriada = await criarNota(
        {
          titulo: novaNota.titulo.trim(),
          descricao: novaNota.descricao.trim() || undefined,
          cor: novaNota.cor,
          visibilidade: novaNota.clienteVinculadoId ? 'publica' : 'equipe',
          vinculo_tipo: novaNota.clienteVinculadoId ? 'cliente' : undefined,
          vinculo_id: novaNota.clienteVinculadoId || undefined,
          itens: novaNota.itens.map(item => ({
            texto: item.texto,
            mencionado_id: item.mencionado_id,
            deadline: item.deadline,
            prioridade: item.prioridade,
          })),
        },
        pessoaAtualId
      );

      if (notaCriada) {
        setNotas((prev) => [notaCriada, ...prev]);
        setNovaNota({
          titulo: "",
          descricao: "",
          cor: CORES_NOTAS.amarelo,
          clienteVinculadoId: "",
          itens: [],
        });
        setMostrarFormulario(false);
        const msgExtra = clienteNome ? ` (vinculada ao cliente ${clienteNome})` : '';
        toast({ title: `Tarefa criada com sucesso${msgExtra}` });

        if (novaNota.clienteVinculadoId) {
          const clienteLocal = clientes.find((c) => c.id === novaNota.clienteVinculadoId);
          if (clienteLocal) {
            setClientesVinculados((prev) => ({ ...prev, [clienteLocal.id]: clienteLocal }));
          } else {
            void carregarClientesVinculados([novaNota.clienteVinculadoId]);
          }
        }
      } else {
        toast({ title: "Erro ao criar tarefa", variant: "destructive" });
      }
    } finally {
      setCriandoNota(false);
    }
  };

  // ============================================================
  // ADICIONAR ITEM A NOTA EXISTENTE
  // ============================================================

  const [adicionandoItem, setAdicionandoItem] = useState<string | null>(null);
  const [novoItemNotaTexto, setNovoItemNotaTexto] = useState("");
  const [novoItemNotaDeadline, setNovoItemNotaDeadline] = useState("");
  const [novoItemNotaPrioridade, setNovoItemNotaPrioridade] = useState<Prioridade>('media');

  const handleAdicionarItemNota = async (notaId: string) => {
    if (!novoItemNotaTexto.trim() || !pessoaAtualId) return;

    const texto = novoItemNotaTexto.trim();
    const mencoes = extrairMencoesDoTexto(texto);
    const mencionadoId = mencoes.length > 0 ? mencoes[0] : undefined;

    const novoItem = await adicionarItem(
      {
        nota_id: notaId,
        texto,
        mencionado_id: mencionadoId,
        deadline: novoItemNotaDeadline || undefined,
        prioridade: novoItemNotaPrioridade,
      },
      pessoaAtualId
    );

    if (novoItem) {
      setNotas((prev) =>
        prev.map((n) => {
          if (n.id !== notaId) return n;
          return {
            ...n,
            itens: [...(n.itens || []), novoItem],
          };
        })
      );
      setNovoItemNotaTexto("");
      setNovoItemNotaDeadline("");
      setNovoItemNotaPrioridade('media');
      setAdicionandoItem(null);
    }
  };

  // ============================================================
  // FORMATAR DATA
  // ============================================================

  const formatarDeadline = (deadline: string | null | undefined) => {
    if (!deadline) return null;

    const data = new Date(deadline);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    data.setHours(0, 0, 0, 0);

    const diffDias = Math.ceil((data.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

    let cor = 'text-gray-500';
    let texto = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

    if (diffDias < 0) {
      cor = 'text-red-600 font-medium';
      texto = `Atrasado ${Math.abs(diffDias)}d`;
    } else if (diffDias === 0) {
      cor = 'text-orange-600 font-medium';
      texto = 'Hoje';
    } else if (diffDias === 1) {
      cor = 'text-amber-600';
      texto = 'AmanhÍ';
    } else if (diffDias <= 7) {
      cor = 'text-blue-600';
    }

    return { texto, cor };
  };

  // ============================================================
  // RENDER
  // ============================================================

  if (loading) {
    return (
      <div className={LAYOUT.pageContainer}>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={LAYOUT.pageContainer}>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <ListChecks className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h1 className={TYPOGRAPHY.sectionTitle}>Checklist Interno</h1>
                <p className={TYPOGRAPHY.cardSubtitle}>Tarefas e anotações da equipe</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={carregarDados}
                disabled={loading}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Atualizar"
              >
                <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={() => setMostrarFormulario(!mostrarFormulario)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nova Tarefa</span>
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setFiltroAtivo('minhas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filtroAtivo === 'minhas' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <User className="w-4 h-4" />
              Minhas
            </button>
            <button
              onClick={() => setFiltroAtivo('mencionado')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filtroAtivo === 'mencionado' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Users className="w-4 h-4" />
              Mencionado
              {resumo.mencoesNaoLidas > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {resumo.mencoesNaoLidas}
                </span>
              )}
            </button>
            {isAdminOuMaster && (
              <button
                onClick={() => setFiltroAtivo('todas')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filtroAtivo === 'todas' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Filter className="w-4 h-4" />
                Todas
              </button>
            )}
          </div>

          {/* Estatisticas */}
          <div className="grid gap-2 sm:grid-cols-4 mt-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <p className={TYPOGRAPHY.overline}>Pendentes</p>
              <p className={`${TYPOGRAPHY.statNumber} mt-1`}>{resumo.pendentes}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <p className={TYPOGRAPHY.overline}>Concluídos</p>
              <p className={`${TYPOGRAPHY.statNumber} mt-1`}>{resumo.itensConcluidos}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <p className={TYPOGRAPHY.overline}>Menções</p>
              <p className={`${TYPOGRAPHY.statNumber} mt-1`}>{resumo.mencoesNaoLidas}</p>
            </div>
            {resumo.itensAtrasados > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                <p className="text-xs font-medium text-red-600 uppercase">Atrasados</p>
                <p className="text-xl font-bold text-red-600 mt-1">{resumo.itensAtrasados}</p>
              </div>
            )}
          </div>

          {/* Barra de progresso */}
          <div className="mt-4">
            <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${resumo.progresso}%` }}
              />
            </div>
            <p className={`${TYPOGRAPHY.caption} mt-1`}>
              Progresso: {resumo.progresso}%
            </p>
          </div>
        </div>

        {/* Formulario Nova Nota */}
        {mostrarFormulario && (
          <div className="p-4 sm:p-6 border-b border-gray-100 bg-amber-50/30">
            <div className="space-y-3">
              <input
                type="text"
                value={novaNota.titulo}
                onChange={(e) => setNovaNota((prev) => ({ ...prev, titulo: e.target.value }))}
                placeholder="Título da tarefa"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                style={{ backgroundColor: novaNota.cor }}
              />

              <MentionInput
                value={novaNota.descricao}
                onChange={(value) => setNovaNota((prev) => ({ ...prev, descricao: value }))}
                placeholder="DescriçÍo (opcional) - use @ para mencionar"
                rows={2}
                disabled={criandoNota}
              />

              {/* Seletor de cliente */}
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <select
                  value={novaNota.clienteVinculadoId}
                  onChange={(e) => setNovaNota((prev) => ({ ...prev, clienteVinculadoId: e.target.value }))}
                  className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  disabled={criandoNota || carregandoClientes}
                >
                  <option value="">Sem vínculo com cliente (tarefa interna)</option>
                  {carregandoClientes ? (
                    <option disabled>Carregando clientes...</option>
                  ) : (
                    clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </option>
                    ))
                  )}
                </select>
                {novaNota.clienteVinculadoId && (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                    Visível na área do cliente
                  </span>
                )}
              </div>

              {/* Seletor de cor */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMostrarCores(!mostrarCores)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
                >
                  <Palette className="w-4 h-4" />
                  Cor
                </button>
                {mostrarCores && (
                  <div className="flex gap-1">
                    {Object.entries(CORES_NOTAS).map(([nome, cor]) => (
                      <button
                        key={nome}
                        type="button"
                        onClick={() => {
                          setNovaNota((prev) => ({ ...prev, cor }));
                          setMostrarCores(false);
                        }}
                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                          novaNota.cor === cor ? "border-gray-800 scale-110" : "border-gray-300"
                        }`}
                        style={{ backgroundColor: cor }}
                        title={nome}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Adicionar itens */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <MentionInput
                      value={novoItemTexto}
                      onChange={setNovoItemTexto}
                      placeholder="Novo item (@ para mencionar)"
                      rows={1}
                      disabled={criandoNota}
                      onSubmit={handleAddItemNovaNota}
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={novoItemDeadline}
                      onChange={(e) => setNovoItemDeadline(e.target.value)}
                      className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      title="Deadline"
                    />
                    <select
                      value={novoItemPrioridade}
                      onChange={(e) => setNovoItemPrioridade(e.target.value as Prioridade)}
                      className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAddItemNovaNota}
                      disabled={!novoItemTexto.trim()}
                      className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600 disabled:opacity-50 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMostrarColar(!mostrarColar)}
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
                >
                  <ClipboardPaste className="w-4 h-4" />
                  Colar lista (uma linha por item)
                </button>

                {mostrarColar && (
                  <div className="space-y-2">
                    <textarea
                      value={textoParaColar}
                      onChange={(e) => setTextoParaColar(e.target.value)}
                      placeholder="Cole aqui o texto - cada linha vira um item"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleColarTexto}
                        disabled={!textoParaColar.trim()}
                        className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600 disabled:opacity-50"
                      >
                        Converter em itens
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTextoParaColar("");
                          setMostrarColar(false);
                        }}
                        className="px-3 py-1.5 text-gray-600 hover:text-gray-900 text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Lista de itens adicionados */}
              {novaNota.itens.length > 0 && (
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                  {novaNota.itens.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200"
                    >
                      <Circle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="flex-1 text-sm text-gray-700 truncate">{item.texto}</span>
                      {item.deadline && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.deadline).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </span>
                      )}
                      {item.prioridade && item.prioridade !== 'media' && (
                        <span className={`px-1.5 py-0.5 text-xs rounded ${PRIORIDADE_CONFIG[item.prioridade].bg} ${PRIORIDADE_CONFIG[item.prioridade].cor}`}>
                          {PRIORIDADE_CONFIG[item.prioridade].label}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoverItemNovaNota(index)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <X className="w-3 h-3 text-gray-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Botoes */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCriarNota}
                  disabled={criandoNota || !novaNota.titulo.trim()}
                  className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
                >
                  {criandoNota ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Criando...
                    </span>
                  ) : (
                    "Criar Tarefa"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarFormulario(false);
                    setNovaNota({ titulo: "", descricao: "", cor: CORES_NOTAS.amarelo, clienteVinculadoId: "", itens: [] });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Notas */}
        <div className="p-4 sm:p-6 space-y-4">
          {notas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ListChecks className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className={TYPOGRAPHY.cardSubtitle}>Nenhuma tarefa ainda</p>
              <p className={TYPOGRAPHY.caption}>
                {filtroAtivo === 'minhas' && "Crie uma tarefa para começar"}
                {filtroAtivo === 'mencionado' && "Você nÍo foi mencionado em nenhuma tarefa"}
                {filtroAtivo === 'todas' && "Nenhuma tarefa no sistema"}
              </p>
            </div>
          ) : (
            notas.map((nota) => {
              const isExpandido = expandidos.has(nota.id);
              const totalItens = nota.itens?.length || 0;
              const itensConcluidos = nota.itens?.filter((i) => i.checked).length || 0;
              const progresso = totalItens > 0 ? (itensConcluidos / totalItens) * 100 : 0;
              const clienteVinculado = nota.vinculo_tipo === 'cliente' && nota.vinculo_id
                ? clientesVinculados[nota.vinculo_id]
                : undefined;
              const avatarCliente = clienteVinculado
                ? obterAvatarUrl(
                    clienteVinculado.nome,
                    clienteVinculado.avatar_url,
                    clienteVinculado.foto_url,
                    clienteVinculado.avatar,
                    undefined,
                    undefined,
                    64
                  )
                : null;

              return (
                <div
                  key={nota.id}
                  ref={(el) => {
                    notaRefs.current[nota.id] = el;
                  }}
                  className="rounded-xl overflow-hidden border border-gray-200"
                  style={{ backgroundColor: nota.cor }}
                >
                  {/* Header da nota */}
                  <button
                    type="button"
                    onClick={() => toggleExpandir(nota.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-black/5 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-white/60 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {avatarCliente ? (
                          <img
                            src={avatarCliente}
                            alt={clienteVinculado?.nome || "Cliente"}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <ListChecks className="w-4 h-4 text-amber-700" />
                        )}
                      </div>
                      <div className="text-left min-w-0">
                        <h4 className={`${TYPOGRAPHY.cardTitle} truncate`}>
                          {nota.titulo}
                        </h4>
                        <p className={TYPOGRAPHY.caption}>
                          {itensConcluidos} de {totalItens} concluídos
                          {nota.criado_por_nome && ` - por ${nota.criado_por_nome}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      <div className="hidden sm:block w-16 sm:w-20 h-2 bg-white/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all"
                          style={{ width: `${progresso}%` }}
                        />
                      </div>
                      <span className={`${TYPOGRAPHY.actionTitle} text-emerald-600`}>
                        {Math.round(progresso)}%
                      </span>
                      {isExpandido ? (
                        <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                      )}
                    </div>
                  </button>

                  {/* Conteudo expandido */}
                  {isExpandido && (
                    <div className="p-4 pt-0 space-y-2">
                      {nota.descricao && (
                        <p className={`${TYPOGRAPHY.bodySmall} p-2 bg-white/40 rounded-lg mb-3`}>
                          {nota.descricao}
                        </p>
                      )}

                      {/* Itens */}
                      {nota.itens && nota.itens.length > 0 ? (
                        nota.itens.map((item) => {
                          const isAtualizando = atualizandoItem === item.id;
                          const deadlineInfo = formatarDeadline(item.deadline);

                          return (
                            <div
                              key={item.id}
                              className={`flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border transition-all ${
                                item.checked
                                  ? "bg-emerald-50 border-emerald-200"
                                  : "bg-white border-gray-200"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleToggleItem(nota, item)}
                                disabled={isAtualizando}
                                className="mt-0.5 flex-shrink-0 cursor-pointer hover:scale-110 transition-transform disabled:opacity-50"
                              >
                                {isAtualizando ? (
                                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 animate-spin" />
                                ) : item.checked ? (
                                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                                ) : (
                                  <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                )}
                              </button>
                              <div className="flex-1 min-w-0">
                                <span
                                  className={`text-xs sm:text-sm ${
                                    item.checked ? "text-gray-400 line-through" : "text-gray-700"
                                  }`}
                                >
                                  {item.texto}
                                </span>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <span className="flex items-center gap-1 text-xs text-gray-500">
                                    <Calendar className="w-3 h-3" />
                                    Início: {new Date(item.criado_em).toLocaleDateString('pt-BR')}
                                  </span>
                                  {deadlineInfo && (
                                    <span className={`flex items-center gap-1 text-xs ${deadlineInfo.cor}`}>
                                      <Clock className="w-3 h-3" />
                                      {deadlineInfo.texto}
                                    </span>
                                  )}
                                  {item.checked_em && (
                                    <span className="flex items-center gap-1 text-xs text-emerald-600">
                                      <Check className="w-3 h-3" />
                                      ConclusÍo: {new Date(item.checked_em).toLocaleDateString('pt-BR')}
                                    </span>
                                  )}
                                  {item.prioridade && item.prioridade !== 'media' && (
                                    <span className={`px-1.5 py-0.5 text-xs rounded ${PRIORIDADE_CONFIG[item.prioridade].bg} ${PRIORIDADE_CONFIG[item.prioridade].cor}`}>
                                      {PRIORIDADE_CONFIG[item.prioridade].label}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleExcluirItem(nota, item.id)}
                                className="p-1 hover:bg-gray-100 rounded opacity-50 hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-3 h-3 text-gray-400" />
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <p className={`${TYPOGRAPHY.caption} text-center py-4`}>
                          Nenhum item nesta tarefa
                        </p>
                      )}

                      {/* Adicionar item */}
                      {adicionandoItem === nota.id ? (
                        <div className="space-y-2 mt-2">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <div className="flex-1">
                              <MentionInput
                                value={novoItemNotaTexto}
                                onChange={setNovoItemNotaTexto}
                                placeholder="Novo item..."
                                rows={1}
                                autoFocus
                                onSubmit={() => handleAdicionarItemNota(nota.id)}
                              />
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="date"
                                value={novoItemNotaDeadline}
                                onChange={(e) => setNovoItemNotaDeadline(e.target.value)}
                                className="px-2 py-1 border border-gray-200 rounded-lg text-sm"
                              />
                              <select
                                value={novoItemNotaPrioridade}
                                onChange={(e) => setNovoItemNotaPrioridade(e.target.value as Prioridade)}
                                className="px-2 py-1 border border-gray-200 rounded-lg text-sm"
                              >
                                <option value="baixa">Baixa</option>
                                <option value="media">Média</option>
                                <option value="alta">Alta</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleAdicionarItemNota(nota.id)}
                              className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAdicionandoItem(null);
                                setNovoItemNotaTexto("");
                                setNovoItemNotaDeadline("");
                                setNovoItemNotaPrioridade('media');
                              }}
                              className="px-3 py-1.5 text-gray-500 hover:text-gray-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAdicionandoItem(nota.id)}
                          className="flex items-center gap-2 w-full p-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-lg transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Adicionar item
                        </button>
                      )}

                      {/* Ações da nota */}
                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-200/50">
                        <span className={TYPOGRAPHY.caption}>
                          Criado em {new Date(nota.criado_em).toLocaleDateString('pt-BR')}
                        </span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleArquivarNota(nota.id)}
                            className="p-1.5 hover:bg-white/50 rounded text-gray-500"
                            title="Arquivar"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExcluirNota(nota.id)}
                            className="p-1.5 hover:bg-red-50 rounded text-gray-500 hover:text-red-600"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

