// ============================================================
// NOTAS COLABORATIVAS - ESTILO KEEP
// Sistema WG Easy - Grupo WG Almeida
// Notas com checklist, menções e colaboraçÍo em tempo real
// ============================================================

import { useState, useEffect, useCallback, useMemo } from "react";
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
  ClipboardList,
  ClipboardPaste,
  X,
  Palette,
} from "lucide-react";
import MentionInput, { extrairMencoesDoTexto } from "@/components/common/MentionInput";
import { useToast } from "@/components/ui/use-toast";
import { useUsuarioLogado } from "@/hooks/useUsuarioLogado";
import {
  listarNotas,
  listarItensMencionados,
  criarNota,
  adicionarItem,
  toggleItemCheck,
  excluirItem,
  arquivarNota,
  excluirNota,
  CORES_NOTAS,
  NotaSistema,
  NotaSistemaItem,
} from "@/lib/notasSistemaApi";
import { TYPOGRAPHY } from "@/constants/typography";

// ============================================================
// TIPOS
// ============================================================

interface NotasColaborativasProps {
  pessoaId?: string;
  compacto?: boolean;
  className?: string;
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function NotasColaborativas({
  pessoaId,
  compacto = false,
  className = "",
}: NotasColaborativasProps) {
  const { usuario } = useUsuarioLogado();
  const { toast } = useToast();

  // Estados
  const [notas, setNotas] = useState<NotaSistema[]>([]);
  const [itensMencionados, setItensMencionados] = useState<NotaSistemaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());
  const [atualizandoItem, setAtualizandoItem] = useState<string | null>(null);

  // Estado do formulário de nova nota
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [novaNota, setNovaNota] = useState<{
    titulo: string;
    descricao: string;
    cor: string;
    itens: Array<{ texto: string; mencionado_id?: string }>;
  }>({
    titulo: "",
    descricao: "",
    cor: CORES_NOTAS.amarelo,
    itens: [],
  });
  const [novoItemTexto, setNovoItemTexto] = useState("");
  const [textoParaColar, setTextoParaColar] = useState("");
  const [mostrarColar, setMostrarColar] = useState(false);
  const [mostrarCores, setMostrarCores] = useState(false);
  const [criandoNota, setCriandoNota] = useState(false);

  // ID do usuário atual
  const usuarioAtualId = pessoaId || usuario?.pessoa_id;

  // ============================================================
  // CARREGAR DADOS
  // ============================================================

  const carregarDados = useCallback(async () => {
    if (!usuarioAtualId) {
      setNotas([]);
      setItensMencionados([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [notasData, mencionadosData] = await Promise.all([
        listarNotas(usuario?.id, usuarioAtualId),
        listarItensMencionados(usuarioAtualId),
      ]);

      setNotas(notasData);
      setItensMencionados(mencionadosData);

      // Expandir primeira nota se houver apenas uma
      if (notasData.length === 1) {
        setExpandidos(new Set([notasData[0].id]));
      }
    } catch (error) {
      console.error("Erro ao carregar notas:", error);
      toast({
        title: "Erro ao carregar notas",
        description: "não foi possível carregar as notas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [usuarioAtualId, usuario?.id, toast]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // ============================================================
  // ESTATÍSTICAS
  // ============================================================

  const resumo = useMemo(() => {
    let itensTotais = 0;
    let itensConcluidos = 0;

    notas.forEach((nota) => {
      const itens = nota.itens || [];
      itensTotais += itens.length;
      itensConcluidos += itens.filter((item) => item.checked).length;
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
    if (!usuarioAtualId) return;

    setAtualizandoItem(item.id);
    try {
      const sucesso = await toggleItemCheck(item.id, !item.checked, usuarioAtualId);

      if (sucesso) {
        // Atualizar estado local
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
          description: "não foi possível atualizar o item.",
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
    if (!confirm("Arquivar esta nota?")) return;

    const sucesso = await arquivarNota(notaId);
    if (sucesso) {
      setNotas((prev) => prev.filter((n) => n.id !== notaId));
      toast({ title: "Nota arquivada" });
    }
  };

  const handleExcluirNota = async (notaId: string) => {
    if (!confirm("Excluir esta nota permanentemente?")) return;

    const sucesso = await excluirNota(notaId);
    if (sucesso) {
      setNotas((prev) => prev.filter((n) => n.id !== notaId));
      toast({ title: "Nota excluída" });
    }
  };

  // ============================================================
  // CRIAR NOTA
  // ============================================================

  const handleAddItemNovaNota = () => {
    const texto = novoItemTexto.trim();
    if (!texto) return;

    // Extrair menções do texto
    const mencoes = extrairMencoesDoTexto(texto);
    const mencionadoId = mencoes.length > 0 ? mencoes[0] : undefined;

    setNovaNota((prev) => ({
      ...prev,
      itens: [...prev.itens, { texto, mencionado_id: mencionadoId }],
    }));
    setNovoItemTexto("");
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
      itens: [...prev.itens, ...linhas.map((texto) => ({ texto }))],
    }));

    setTextoParaColar("");
    setMostrarColar(false);
    toast({ title: `${linhas.length} itens adicionados` });
  };

  const handleCriarNota = async () => {
    if (!novaNota.titulo.trim()) {
      toast({ title: "Digite um título para a nota", variant: "destructive" });
      return;
    }

    if (!usuarioAtualId) {
      toast({ title: "Usuário não identificado", variant: "destructive" });
      return;
    }

    setCriandoNota(true);
    try {
      const notaCriada = await criarNota(
        {
          titulo: novaNota.titulo.trim(),
          descricao: novaNota.descricao.trim() || undefined,
          cor: novaNota.cor,
          itens: novaNota.itens,
        },
        usuarioAtualId
      );

      if (notaCriada) {
        setNotas((prev) => [notaCriada, ...prev]);
        setNovaNota({
          titulo: "",
          descricao: "",
          cor: CORES_NOTAS.amarelo,
          itens: [],
        });
        setMostrarFormulario(false);
        toast({ title: "Nota criada com sucesso" });
      } else {
        toast({ title: "Erro ao criar nota", variant: "destructive" });
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

  const handleAdicionarItemNota = async (notaId: string) => {
    if (!novoItemNotaTexto.trim() || !usuarioAtualId) return;

    const texto = novoItemNotaTexto.trim();
    const mencoes = extrairMencoesDoTexto(texto);
    const mencionadoId = mencoes.length > 0 ? mencoes[0] : undefined;

    const novoItem = await adicionarItem(
      {
        nota_id: notaId,
        texto,
        mencionado_id: mencionadoId,
      },
      usuarioAtualId
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
      setAdicionandoItem(null);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  if (loading) {
    return (
      <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className={TYPOGRAPHY.sectionTitle}>Notas da Equipe</h3>
              <p className={TYPOGRAPHY.cardSubtitle}>Checklists e tarefas colaborativas</p>
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
              <span className="hidden sm:inline">Nova Nota</span>
            </button>
          </div>
        </div>

        {/* Estatísticas */}
        {!compacto && (
          <div className="grid gap-2 sm:grid-cols-3 mt-4">
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
          </div>
        )}

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

      {/* Formulário Nova Nota */}
      {mostrarFormulario && (
        <div className="p-4 sm:p-6 border-b border-gray-100 bg-amber-50/30">
          <div className="space-y-3">
            {/* Título */}
            <input
              type="text"
              value={novaNota.titulo}
              onChange={(e) => setNovaNota((prev) => ({ ...prev, titulo: e.target.value }))}
              placeholder="Título da nota"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              style={{ backgroundColor: novaNota.cor }}
            />

            {/* DescriçÍo com menções */}
            <MentionInput
              value={novaNota.descricao}
              onChange={(value) => setNovaNota((prev) => ({ ...prev, descricao: value }))}
              placeholder="DescriçÍo (opcional) - use @ para mencionar"
              rows={2}
              disabled={criandoNota}
            />

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
              <div className="flex gap-2">
                <MentionInput
                  value={novoItemTexto}
                  onChange={setNovoItemTexto}
                  placeholder="Novo item (@ para mencionar)"
                  rows={1}
                  disabled={criandoNota}
                  onSubmit={handleAddItemNovaNota}
                />
                <button
                  type="button"
                  onClick={handleAddItemNovaNota}
                  disabled={!novoItemTexto.trim()}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600 disabled:opacity-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* BotÍo colar */}
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

            {/* Botões */}
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
                  "Criar Nota"
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMostrarFormulario(false);
                  setNovaNota({ titulo: "", descricao: "", cor: CORES_NOTAS.amarelo, itens: [] });
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
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className={TYPOGRAPHY.cardSubtitle}>Nenhuma nota ainda</p>
            <p className={TYPOGRAPHY.caption}>Crie uma nota para começar</p>
          </div>
        ) : (
          notas.map((nota) => {
            const isExpandido = expandidos.has(nota.id);
            const totalItens = nota.itens?.length || 0;
            const itensConcluidos = nota.itens?.filter((i) => i.checked).length || 0;
            const progresso = totalItens > 0 ? (itensConcluidos / totalItens) * 100 : 0;

            return (
              <div
                key={nota.id}
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
                    <div className="w-8 h-8 bg-white/60 rounded-lg flex items-center justify-center flex-shrink-0">
                      <ClipboardList className="w-4 h-4 text-amber-700" />
                    </div>
                    <div className="text-left min-w-0">
                      <h4 className={`${TYPOGRAPHY.cardTitle} truncate`}>
                        {nota.titulo}
                      </h4>
                      <p className={TYPOGRAPHY.caption}>
                        {itensConcluidos} de {totalItens} concluídos
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

                {/* Conteúdo expandido */}
                {isExpandido && (
                  <div className="p-4 pt-0 space-y-2">
                    {/* DescriçÍo */}
                    {nota.descricao && (
                      <p className={`${TYPOGRAPHY.bodySmall} p-2 bg-white/40 rounded-lg mb-3`}>
                        {nota.descricao}
                      </p>
                    )}

                    {/* Itens */}
                    {nota.itens && nota.itens.length > 0 ? (
                      nota.itens.map((item) => {
                        const isAtualizando = atualizandoItem === item.id;

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
                            <span
                              className={`flex-1 text-xs sm:text-sm ${
                                item.checked ? "text-gray-400 line-through" : "text-gray-700"
                              }`}
                            >
                              {item.texto}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleExcluirItem(nota, item.id)}
                              className="p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3 h-3 text-gray-400" />
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <p className={`${TYPOGRAPHY.caption} text-center py-4`}>
                        Nenhum item nesta nota
                      </p>
                    )}

                    {/* Adicionar item */}
                    {adicionandoItem === nota.id ? (
                      <div className="flex gap-2 mt-2">
                        <MentionInput
                          value={novoItemNotaTexto}
                          onChange={setNovoItemNotaTexto}
                          placeholder="Novo item..."
                          rows={1}
                          autoFocus
                          onSubmit={() => handleAdicionarItemNota(nota.id)}
                        />
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
                          }}
                          className="px-3 py-1.5 text-gray-500 hover:text-gray-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
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
                        Por {nota.criado_por_nome}
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
  );
}


