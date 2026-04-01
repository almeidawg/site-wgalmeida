// ============================================================
// COMPONENTE: CEOChecklistCard
// Sistema WG Easy - Grupo WG Almeida
// ============================================================
// Checklist avancado para o Dashboard do CEO/Founder
// Suporta mencoes @ para notificar usuarios
// Usa tabelas ceo_checklist_diario/itens
// ============================================================

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { ChangeEvent, ReactNode } from "react";
import {
  obterChecklistDiario,
  adicionarItemComMencoes,
  toggleItemConcluido,
  removerItem,
  calcularProgresso,
  buscarUsuariosParaMencao,
  type CEOChecklist,
  type CEOChecklistItem,
  type UsuarioParaMencao,
} from "@/lib/ceoChecklistApi";
import { Check, Plus, Trash2, AtSign, CheckCircle2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

// Funcao para formatar texto com mencoes para exibicao
function formatarTextoComMencoes(texto: string, usuarios: UsuarioParaMencao[]): ReactNode[] {
  const partes: ReactNode[] = [];
  let ultimoindice = 0;

  // Regex para @[uuid] (formato salvo)
  const regexId = /@\[([^\]]+)\]/g;
  // Regex para @nome (formato exibicao)
  const regexNome = /@([a-zA-ZÀ-ÿ]+(?:\s+[a-zA-ZÀ-ÿ]+)?)/gi;

  // Primeiro processar @[uuid]
  let match;
  while ((match = regexId.exec(texto)) !== null) {
    if (match.index > ultimoindice) {
      partes.push(texto.substring(ultimoindice, match.index));
    }

    const usuarioId = match[1];
    const usuario = usuarios.find(u => u.id === usuarioId);
    const nomeExibir = usuario?.nome || usuarioId.substring(0, 8);

    partes.push(
      <span
        key={`id-${match.index}`}
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium"
      >
        <AtSign size={10} />
        {nomeExibir}
      </span>
    );

    ultimoindice = match.index + match[0].length;
  }

  // Se nao encontrou @[uuid], tentar @nome
  if (partes.length === 0) {
    while ((match = regexNome.exec(texto)) !== null) {
      if (match.index > ultimoindice) {
        partes.push(texto.substring(ultimoindice, match.index));
      }

      const nome = match[1];
      partes.push(
        <span
          key={`nome-${match.index}`}
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium"
        >
          <AtSign size={10} />
          {nome}
        </span>
      );

      ultimoindice = match.index + match[0].length;
    }
  }

  // Adicionar o resto do texto
  if (ultimoindice < texto.length) {
    partes.push(texto.substring(ultimoindice));
  }

  return partes.length > 0 ? partes : [texto];
}

interface CEOChecklistCardProps {
  usuarioId: string;
  onUpdate?: () => void;
  readOnly?: boolean;
  maxItems?: number;
  compact?: boolean;
}

export function CEOChecklistCard({
  usuarioId,
  onUpdate,
  readOnly = false,
  maxItems = 10,
  compact = false,
}: CEOChecklistCardProps) {
  const [checklist, setChecklist] = useState<CEOChecklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [newItemText, setNewItemText] = useState("");
  const [addingItem, setAddingItem] = useState(false);
  const [savingItem, setSavingItem] = useState(false);

  // Estados para mencoes
  const [usuarios, setUsuarios] = useState<UsuarioParaMencao[]>([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionPosition, setMentionPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Carregar checklist
  const loadChecklist = useCallback(async () => {
    if (!usuarioId) return;

    try {
      setLoading(true);
      const data = await obterChecklistDiario(usuarioId);
      setChecklist(data);
    } catch (error) {
      console.error("Erro ao carregar checklist:", error);
      toast.error("Erro ao carregar checklist");
    } finally {
      setLoading(false);
    }
  }, [usuarioId]);

  // Carregar usuarios para mencoes
  const loadUsuariosParaMencao = useCallback(async (termo: string) => {
    if (termo.length < 2) {
      setUsuarios([]);
      return;
    }
    try {
      const data = await buscarUsuariosParaMencao(termo);
      setUsuarios(data);
    } catch (error) {
      console.error("Erro ao buscar usuarios:", error);
    }
  }, []);

  useEffect(() => {
    loadChecklist();
  }, [loadChecklist]);

  // Handler para input com deteccao de @
  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setNewItemText(value);

    const cursorPos = e.target.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf("@");

    if (atIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(atIndex + 1);
      if (!textAfterAt.includes(" ") && !textAfterAt.includes("[")) {
        setShowMentionDropdown(true);
        setMentionSearch(textAfterAt.toLowerCase());
        setMentionPosition(atIndex);
        loadUsuariosParaMencao(textAfterAt);
        return;
      }
    }

    setShowMentionDropdown(false);
  }

  // Inserir mencao selecionada
  function insertMention(usuario: UsuarioParaMencao) {
    const beforeMention = newItemText.substring(0, mentionPosition);
    const afterMention = newItemText.substring(
      mentionPosition + mentionSearch.length + 1
    );
    // Usar @nome para exibicao (sera convertido para @[id] ao salvar pela API)
    const mentionDisplay = `@${usuario.nome} `;

    setNewItemText(beforeMention + mentionDisplay + afterMention);
    setShowMentionDropdown(false);
    setMentionSearch("");
    inputRef.current?.focus();
  }

  // Toggle item concluido
  async function toggleItem(item: CEOChecklistItem) {
    if (readOnly) return;

    try {
      await toggleItemConcluido(item.id, !item.concluido);

      setChecklist((prev) => {
        if (!prev?.itens) return prev;
        return {
          ...prev,
          itens: prev.itens.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  concluido: !i.concluido,
                  concluido_em: !i.concluido ? new Date().toISOString() : null,
                }
              : i
          ),
        };
      });

      onUpdate?.();
    } catch (error) {
      console.error("Erro ao atualizar item:", error);
      toast.error("Erro ao atualizar item");
    }
  }

  // Adicionar novo item
  async function addItem() {
    if (!newItemText.trim() || readOnly || !checklist?.id) return;

    try {
      setSavingItem(true);

      const novoItem = await adicionarItemComMencoes(
        checklist.id,
        { texto: newItemText.trim() },
        usuarioId
      );

      setChecklist((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          itens: [novoItem, ...(prev.itens || [])],
        };
      });

      setNewItemText("");
      setAddingItem(false);
      setShowMentionDropdown(false);
      toast.success("Tarefa adicionada");
      onUpdate?.();
    } catch (error) {
      console.error("Erro ao adicionar item:", error);
      toast.error("Erro ao adicionar item");
    } finally {
      setSavingItem(false);
    }
  }

  // Remover item
  async function deleteItem(itemId: string) {
    if (readOnly) return;

    try {
      await removerItem(itemId);

      setChecklist((prev) => {
        if (!prev?.itens) return prev;
        return {
          ...prev,
          itens: prev.itens.filter((i) => i.id !== itemId),
        };
      });

      toast.success("Tarefa removida");
      onUpdate?.();
    } catch (error) {
      console.error("Erro ao remover item:", error);
      toast.error("Erro ao remover item");
    }
  }

  // Calcular progresso
  const progress = useMemo(() => {
    if (!checklist?.itens || checklist.itens.length === 0) return 0;
    return calcularProgresso(checklist.itens);
  }, [checklist?.itens]);

  const totalItems = checklist?.itens?.length || 0;
  const completedItems = checklist?.itens?.filter((i) => i.concluido).length || 0;
  const displayItems = checklist?.itens?.slice(0, maxItems) || [];

  // Skeleton loading
  if (loading) {
    return (
      <div className={compact ? "" : "bg-white border rounded-lg p-4"}>
        <Skeleton className="h-6 w-1/3 mb-4" />
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-2/3" />
        </div>
      </div>
    );
  }

  // Versao compacta para dashboard
  if (compact) {
    return (
      <>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-normal text-gray-900">Checklist do Dia</h3>
              <p className="text-xs text-gray-500">
                {progress}% concluido - {completedItems}/{totalItems} tarefas
              </p>
            </div>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={() => setAddingItem(true)}
              className="p-1.5 hover:bg-emerald-100 rounded-lg transition-colors"
              title="Adicionar tarefa"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
            </button>
          )}
        </div>

        {/* Barra de progresso */}
        {totalItems > 0 && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Input para novo item */}
        {addingItem && !readOnly && (
          <div className="mb-4 relative">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newItemText}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !showMentionDropdown) addItem();
                  if (e.key === "Escape") {
                    setAddingItem(false);
                    setNewItemText("");
                  }
                }}
                onBlur={() => setTimeout(() => setShowMentionDropdown(false), 200)}
                placeholder="Nova tarefa... (use @ para mencionar)"
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500"
                autoFocus
              />
              <button
                type="button"
                onClick={addItem}
                disabled={savingItem || !newItemText.trim()}
                className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 disabled:opacity-50 transition-colors"
              >
                {savingItem ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddingItem(false);
                  setNewItemText("");
                }}
                className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dropdown de mencoes */}
            {showMentionDropdown && usuarios.length > 0 && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                {usuarios.map((usuario) => (
                  <button
                    type="button"
                    key={usuario.id}
                    onClick={() => insertMention(usuario)}
                    className="w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center gap-2 text-sm"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-medium">
                      {usuario.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{usuario.nome}</div>
                      <div className="text-xs text-gray-500">{usuario.tipo_usuario}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Items */}
        <div className="space-y-2 max-h-[250px] overflow-y-auto">
          {displayItems.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Nenhuma tarefa para hoje</p>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => setAddingItem(true)}
                  className="mt-2 text-xs text-emerald-600 hover:text-emerald-700"
                >
                  Adicionar primeira tarefa
                </button>
              )}
            </div>
          ) : (
            displayItems.map((item) => (
              <div
                key={item.id}
                className={`group flex items-center gap-3 p-3 rounded-xl transition-all ${
                  item.concluido
                    ? "bg-emerald-50 border border-emerald-100"
                    : "bg-gray-50 hover:bg-gray-100 border border-transparent"
                }`}
              >
                {/* Checkbox */}
                <button
                  type="button"
                  onClick={() => toggleItem(item)}
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    item.concluido
                      ? "bg-emerald-500"
                      : "border-2 border-gray-300 hover:border-emerald-400"
                  } ${readOnly ? "cursor-default" : "cursor-pointer"}`}
                  disabled={readOnly}
                >
                  {item.concluido && <Check className="w-3 h-3 text-white" />}
                </button>

                {/* Texto */}
                <span
                  onClick={() => !readOnly && toggleItem(item)}
                  className={`flex-1 text-sm cursor-pointer ${
                    item.concluido ? "text-gray-400 line-through" : "text-gray-700"
                  }`}
                >
                  {formatarTextoComMencoes(item.texto, usuarios)}
                </span>

                {/* Prioridade badge */}
                {item.prioridade === "alta" && !item.concluido && (
                  <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                    Alta
                  </span>
                )}

                {/* Delete */}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => deleteItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                    title="Remover tarefa"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </>
    );
  }

  // Versao completa (card)
  return (
    <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-normal text-gray-900">Checklist do Dia</h3>
              <p className="text-xs text-gray-500">
                Tarefas e lembretes diarios
              </p>
            </div>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={() => setAddingItem(!addingItem)}
              className="p-1.5 hover:bg-emerald-100 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        {totalItems > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>{completedItems} de {totalItems} concluidos</span>
              <span className="font-normal">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        {/* Add New Item */}
        {addingItem && !readOnly && (
          <div className="relative flex gap-2 mb-4 pb-3 border-b">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={newItemText}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !showMentionDropdown) addItem();
                  if (e.key === "Escape") setAddingItem(false);
                }}
                onBlur={() => setTimeout(() => setShowMentionDropdown(false), 200)}
                placeholder="Nova tarefa... (use @ para mencionar)"
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />

              {/* Dropdown de mencoes */}
              {showMentionDropdown && usuarios.length > 0 && (
                <div className="absolute bottom-full left-0 mb-1 w-full bg-white border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                  {usuarios.map((usuario) => (
                    <button
                      type="button"
                      key={usuario.id}
                      onClick={() => insertMention(usuario)}
                      className="w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center gap-2 text-sm"
                    >
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-medium">
                        {usuario.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{usuario.nome}</div>
                        <div className="text-xs text-gray-500">{usuario.tipo_usuario}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={addItem}
              disabled={!newItemText.trim() || savingItem}
              className="px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {savingItem ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={16} />}
            </button>
          </div>
        )}

        {/* Items */}
        {displayItems.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            Nenhuma tarefa para hoje
          </p>
        ) : (
          displayItems.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 group transition-colors"
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleItem(item)}
                className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  item.concluido
                    ? "bg-emerald-500 border-emerald-500"
                    : "border-gray-300 hover:border-emerald-400"
                } ${readOnly ? "cursor-default" : "cursor-pointer"}`}
                disabled={readOnly}
              >
                {item.concluido && <Check size={12} className="text-white" />}
              </button>

              {/* Texto */}
              <div className="flex-1">
                <p
                  className={`text-sm ${
                    item.concluido ? "line-through text-gray-400" : "text-gray-700"
                  }`}
                >
                  {formatarTextoComMencoes(item.texto, usuarios)}
                </p>
                {item.concluido && item.concluido_em && (
                  <p className="text-xs text-gray-400 mt-1">
                    Concluido em{" "}
                    {new Date(item.concluido_em).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>

              {/* Prioridade */}
              {item.prioridade === "alta" && !item.concluido && (
                <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
                  Alta
                </span>
              )}

              {/* Delete */}
              {!readOnly && (
                <button
                  onClick={() => deleteItem(item.id)}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:bg-red-50 rounded transition-all"
                  title="Remover tarefa"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CEOChecklistCard;


