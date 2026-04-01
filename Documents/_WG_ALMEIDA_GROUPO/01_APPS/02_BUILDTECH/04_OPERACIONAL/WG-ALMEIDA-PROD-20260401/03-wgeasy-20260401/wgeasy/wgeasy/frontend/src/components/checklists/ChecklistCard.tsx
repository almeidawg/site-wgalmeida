// ============================================================
// COMPONENTE: ChecklistCard
// Sistema WG Easy - Grupo WG Almeida
// ============================================================
// Exibe um checklist com seus itens
// Permite marcar/desmarcar itens como concluídos
// Suporta menções com @ para notificar usuários
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import { Checklist, ChecklistItem } from "@/types/checklist";
import { Check, Plus, Trash2, AtSign } from "lucide-react";
import { toast } from "sonner";

// Tipos para menções
interface Usuario {
  id: string;
  pessoa_id: string;
  nome: string;
  email: string;
}

// FunçÍo para extrair menções do texto
function extrairMencoes(texto: string): string[] {
  const regex = /@\[([^\]]+)\]/g;
  const mencoes: string[] = [];
  let match;
  while ((match = regex.exec(texto)) !== null) {
    mencoes.push(match[1]);
  }
  return [...new Set(mencoes)];
}

// FunçÍo para formatar texto com menções para exibiçÍo
function formatarTextoComMencoes(texto: string, usuarios: Usuario[]): ReactNode[] {
  const partes: ReactNode[] = [];
  let ultimoindice = 0;
  const regex = /@\[([^\]]+)\]/g;
  let match;

  while ((match = regex.exec(texto)) !== null) {
    // Adiciona texto antes da mençÍo
    if (match.index > ultimoindice) {
      partes.push(texto.substring(ultimoindice, match.index));
    }

    // Encontra o usuário mencionado
    const usuarioId = match[1];
    const usuario = usuarios.find(u => u.id === usuarioId || u.pessoa_id === usuarioId);
    const nomeExibir = usuario?.nome || usuarioId.split("-")[0];

    partes.push(
      <span
        key={match.index}
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium"
      >
        <AtSign size={10} />
        {nomeExibir}
      </span>
    );

    ultimoindice = match.index + match[0].length;
  }

  // Adiciona o resto do texto
  if (ultimoindice < texto.length) {
    partes.push(texto.substring(ultimoindice));
  }

  return partes.length > 0 ? partes : [texto];
}

interface ChecklistCardProps {
  checklist: Checklist;
  onUpdate?: () => void;
  onDelete?: () => void;
  readOnly?: boolean;
}

export function ChecklistCard({
  checklist,
  onUpdate,
  onDelete,
  readOnly = false,
}: ChecklistCardProps) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemText, setNewItemText] = useState("");
  const [addingItem, setAddingItem] = useState(false);

  // Estados para menções
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionPosition, setMentionPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  // Mapeamento de nomes mencionados para IDs (para converter ao salvar)
  const [mentionedUsers, setMentionedUsers] = useState<Map<string, string>>(new Map());

  // Carregar lista de usuários para menções (usuarios com login + todas as pessoas)
  const loadUsuarios = useCallback(async () => {
    try {
      const usuariosMap = new Map<string, { id: string; pessoa_id: string; nome: string; email: string }>();

      type UsuarioRow = {
        id: string;
        pessoa_id: string | null;
        pessoas?: { nome: string | null; email?: string | null } | Array<{ nome: string | null; email?: string | null }> | null;
      };

      // 1. Carregar usuários com login
      const { data: usuariosData } = await supabase
        .from("usuarios")
        .select(`
          id,
          pessoa_id,
          pessoas!inner(nome, email)
        `)
        .eq("ativo", true)
        .limit(100);

      if (usuariosData) {
        usuariosData.forEach((u: UsuarioRow) => {
          const pessoa = Array.isArray(u.pessoas) ? u.pessoas[0] : u.pessoas;
          if (pessoa?.nome) {
            const pessoaId = u.pessoa_id || u.id;
            usuariosMap.set(u.pessoa_id || u.id, {
              id: u.id,
              pessoa_id: pessoaId,
              nome: pessoa.nome || "",
              email: pessoa.email || "",
            });
          }
        });
      }

      type PessoaRow = { id: string; nome: string | null; email?: string | null };

      // 2. Carregar todas as pessoas (para permitir menções de qualquer pessoa)
      const { data: pessoasData } = await supabase
        .from("pessoas")
        .select("id, nome, email")
        .eq("ativo", true)
        .limit(200);

      if (pessoasData) {
        pessoasData.forEach((p: PessoaRow) => {
          if (!usuariosMap.has(p.id) && p.nome) {
            usuariosMap.set(p.id, {
              id: p.id,
              pessoa_id: p.id,
              nome: p.nome || "",
              email: p.email || "",
            });
          }
        });
      }

      setUsuarios(Array.from(usuariosMap.values()));
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    }
  }, []);

  // Criar notificações para menções
  async function criarNotificacoesMencoes(texto: string, itemId: string) {
    const mencoes = extrairMencoes(texto);
    if (mencoes.length === 0) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      const autorEmail = userData?.user?.email || "Alguém";

      // Buscar nome do autor
      const { data: autorData } = await supabase
        .from("pessoas")
        .select("nome")
        .eq("email", autorEmail)
        .maybeSingle();

      const autorNome = autorData?.nome || autorEmail.split("@")[0];

      // Criar notificações para cada mencionado
      for (const mencionadoId of mencoes) {
        // Buscar pessoa_id do usuário mencionado
        const usuario = usuarios.find(u => u.id === mencionadoId || u.pessoa_id === mencionadoId);
        if (!usuario) continue;

        await supabase.from("notificacoes_sistema").insert({
          tipo: "mencao",
          titulo: `${autorNome} mencionou você em um checklist`,
          mensagem: `Checklist: ${checklist.titulo}`,
          referencia_tipo: "checklist_item",
          referencia_id: itemId,
          destinatario_id: usuario.pessoa_id,
          para_todos_admins: false,
          url_acao: null,
          texto_acao: "Ver checklist"
        });
      }
    } catch (error) {
      console.error("Erro ao criar notificações de mençÍo:", error);
    }
  }

  // Handler para input com detecçÍo de @
  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setNewItemText(value);

    // Detectar @ para mençÍo
    const cursorPos = e.target.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf("@");

    if (atIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(atIndex + 1);
      // Verifica se não há espaço depois do @ (ainda está digitando o nome)
      if (!textAfterAt.includes(" ") && !textAfterAt.includes("[")) {
        setShowMentionDropdown(true);
        setMentionSearch(textAfterAt.toLowerCase());
        setMentionPosition(atIndex);
        return;
      }
    }

    setShowMentionDropdown(false);
  }

  // Inserir mençÍo selecionada (mostra @Nome, armazena mapeamento para @[uuid])
  function insertMention(usuario: Usuario) {
    const beforeMention = newItemText.substring(0, mentionPosition);
    const afterMention = newItemText.substring(
      mentionPosition + mentionSearch.length + 1
    );
    // Mostrar @Nome no input (não o UUID)
    const mentionDisplay = `@${usuario.nome} `;

    // Armazenar mapeamento nome -> id para converter ao salvar
    setMentionedUsers((prev) => {
      const newMap = new Map(prev);
      newMap.set(usuario.nome.toLowerCase(), usuario.pessoa_id);
      return newMap;
    });

    setNewItemText(beforeMention + mentionDisplay + afterMention);
    setShowMentionDropdown(false);
    setMentionSearch("");
    inputRef.current?.focus();
  }

  // Converter texto com @Nome para @[uuid] antes de salvar
  function convertNamesToIds(texto: string): string {
    let result = texto;
    mentionedUsers.forEach((id, nome) => {
      // Regex para encontrar @Nome (case insensitive)
      const regex = new RegExp(`@${nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w])`, 'gi');
      result = result.replace(regex, `@[${id}]`);
    });
    return result;
  }

  // Filtrar usuários para dropdown
  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.nome.toLowerCase().includes(mentionSearch) ||
      u.email.toLowerCase().includes(mentionSearch)
  ).slice(0, 5);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("checklist_itens")
        .select("*")
        .eq("checklist_id", checklist.id)
        .order("ordem", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Erro ao carregar itens:", error);
      toast.error("Erro ao carregar checklist");
    } finally {
      setLoading(false);
    }
  }, [checklist.id]);

  // Carregar itens do checklist e usuários
  useEffect(() => {
    loadItems();
    loadUsuarios();
  }, [loadItems, loadUsuarios]);

  // Toggle item concluído
  async function toggleItem(item: ChecklistItem) {
    if (readOnly) return;

    try {
      const { error } = await supabase
        .from("checklist_itens")
        .update({
          concluido: !item.concluido,
          concluido_em: !item.concluido ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      if (error) throw error;

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                concluido: !i.concluido,
                concluido_em: !i.concluido ? new Date().toISOString() : null,
              }
            : i
        )
      );

      onUpdate?.();
    } catch (error) {
      console.error("Erro ao atualizar item:", error);
      toast.error("Erro ao atualizar item");
    }
  }

  // Adicionar novo item
  async function addItem() {
    if (!newItemText.trim() || readOnly) return;

    try {
      setAddingItem(true);
      const maxOrdem = items.reduce((max, item) => Math.max(max, item.ordem), 0);

      // Converter @Nome para @[uuid] antes de salvar
      const textoComIds = convertNamesToIds(newItemText.trim());

      const { data, error } = await supabase
        .from("checklist_itens")
        .insert({
          checklist_id: checklist.id,
          texto: textoComIds,
          ordem: maxOrdem + 1,
        })
        .select()
        .single();

      if (error) throw error;

      // Criar notificações para menções (usar texto com IDs)
      await criarNotificacoesMencoes(textoComIds, data.id);

      setItems((prev) => [...prev, data]);
      setNewItemText("");
      setMentionedUsers(new Map()); // Limpar mapeamento após salvar
      setShowMentionDropdown(false);
      toast.success("Item adicionado");
      onUpdate?.();
    } catch (error) {
      console.error("Erro ao adicionar item:", error);
      toast.error("Erro ao adicionar item");
    } finally {
      setAddingItem(false);
    }
  }

  // Deletar item
  async function deleteItem(itemId: string) {
    if (readOnly) return;

    try {
      const { error } = await supabase
        .from("checklist_itens")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      setItems((prev) => prev.filter((i) => i.id !== itemId));
      toast.success("Item removido");
      onUpdate?.();
    } catch (error) {
      console.error("Erro ao deletar item:", error);
      toast.error("Erro ao deletar item");
    }
  }

  // Calcular progresso
  const totalItems = items.length;
  const completedItems = items.filter((i) => i.concluido).length;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  if (loading) {
    return (
      <div className="bg-white border rounded-lg p-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-normal text-gray-900">{checklist.titulo}</h3>
            {checklist.descricao && (
              <p className="text-xs text-gray-500 mt-1">{checklist.descricao}</p>
            )}
          </div>
          {onDelete && !readOnly && (
            <button
              onClick={onDelete}
              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Excluir checklist"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        {totalItems > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>{completedItems} de {totalItems} concluídos</span>
              <span className="font-normal">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-green-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="p-4 space-y-2">
        {items.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">
            Nenhum item neste checklist
          </p>
        )}

        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 group transition-colors"
          >
            {/* Checkbox */}
            <button
              onClick={() => toggleItem(item)}
              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                item.concluido
                  ? "bg-green-500 border-green-500"
                  : "border-gray-300 hover:border-green-400"
              } ${readOnly ? "cursor-default" : "cursor-pointer"}`}
              disabled={readOnly}
            >
              {item.concluido && <Check size={14} className="text-white" />}
            </button>

            {/* Texto */}
            <div className="flex-1">
              <p
                className={`text-sm ${
                  item.concluido
                    ? "line-through text-gray-400"
                    : "text-gray-700"
                }`}
              >
                {formatarTextoComMencoes(item.texto, usuarios)}
              </p>
              {item.concluido && item.concluido_em && (
                <p className="text-xs text-gray-400 mt-1">
                  Concluído em{" "}
                  {new Date(item.concluido_em).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>

            {/* Delete */}
            {!readOnly && (
              <button
                onClick={() => deleteItem(item.id)}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:bg-red-50 rounded transition-all"
                title="Remover item"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}

        {/* Add New Item */}
        {!readOnly && (
          <div className="relative flex gap-2 mt-4 pt-3 border-t">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={newItemText}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !showMentionDropdown) addItem();
                  if (e.key === "Escape") setShowMentionDropdown(false);
                }}
                onBlur={() => setTimeout(() => setShowMentionDropdown(false), 200)}
                placeholder="Adicionar um item... (use @ para mencionar)"
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Dropdown de menções */}
              {showMentionDropdown && usuariosFiltrados.length > 0 && (
                <div className="absolute bottom-full left-0 mb-1 w-full bg-white border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                  {usuariosFiltrados.map((usuario) => (
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
                        <div className="text-xs text-gray-500">{usuario.email}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={addItem}
              disabled={!newItemText.trim() || addingItem}
              className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


