// ============================================================
// COMPONENTE: Input com Autocomplete de Menções @
// Sistema WG Easy - Grupo WG Almeida
// ============================================================
// Componente reutilizável para input de texto com menções de usuários
// Exibe @Nome no textarea, mas salva como @[uuid] para processamento
// ============================================================

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";

// ============================================================
// TIPOS
// ============================================================

interface Usuario {
  id: string;
  nome: string;
  email?: string;
  avatar_url?: string;
}

interface MentionInputProps {
  value: string; // Formato interno: @[uuid]
  onChange: (value: string) => void; // Retorna formato @[uuid]
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
  onSubmit?: () => void; // Ctrl+Enter para enviar
  onlyColaboradores?: boolean; // Restringir menções a colaboradores
}

interface MentionSuggestion {
  id: string;
  nome: string;
  email?: string;
  avatar_url?: string;
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function MentionInput({
  value,
  onChange,
  placeholder = "Digite sua mensagem... Use @ para mencionar alguém",
  rows = 3,
  disabled = false,
  className = "",
  autoFocus = false,
  onSubmit,
  onlyColaboradores = false,
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState<number | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Cache de usuários para evitar múltiplas requisições
  const [usuariosCache, setUsuariosCache] = useState<Usuario[]>([]);

  // Carregar usuários do sistema (usuarios com login + todas as pessoas)
  useEffect(() => {
    async function carregarUsuarios() {
      try {
        const usuariosMap = new Map<string, Usuario>();

        // 1. Carregar usuários com login
        const { data: usuariosData } = await supabase
          .from("usuarios")
          .select(`
            id,
            pessoa:pessoas!usuarios_pessoa_id_fkey (
              id,
              nome,
              email,
              avatar_url,
              tipo
            )
          `)
          .eq("ativo", true)
          .limit(100);

        if (usuariosData) {
          usuariosData.forEach((u) => {
            const pessoa = Array.isArray(u.pessoa) ? u.pessoa[0] : u.pessoa;
            if (!pessoa?.nome) return;
            if (onlyColaboradores && pessoa?.tipo !== "COLABORADOR") return;
              usuariosMap.set(u.id, {
                id: u.id,
                nome: pessoa.nome,
                email: pessoa.email,
                avatar_url: pessoa.avatar_url,
              });
          });
        }

        // 2. Carregar pessoas (opcionalmente só colaboradores)
        let pessoasQuery = supabase
          .from("pessoas")
          .select("id, nome, email, avatar_url, tipo")
          .eq("ativo", true);

        if (onlyColaboradores) {
          pessoasQuery = pessoasQuery.eq("tipo", "COLABORADOR");
        }

        const { data: pessoasData } = await pessoasQuery.limit(200);

        if (pessoasData) {
          pessoasData.forEach((p) => {
            // Só adiciona se não existir já (evita duplicar usuários com login)
            if (!usuariosMap.has(p.id) && p.nome) {
              usuariosMap.set(p.id, {
                id: p.id,
                nome: p.nome,
                email: p.email,
                avatar_url: p.avatar_url,
              });
            }
          });
        }

        setUsuariosCache(Array.from(usuariosMap.values()));
      } catch (err) {
        console.error("Erro ao carregar usuários para menções:", err);
      }
    }

    carregarUsuarios();
  }, [onlyColaboradores]);

  // Converter valor interno (@[uuid]) para exibiçÍo (@Nome)
  const displayValue = useMemo(() => {
    if (!value || usuariosCache.length === 0) return value;

    let display = value;
    const mentionRegex = /@\[([^\]]+)\]/g;
    let match;

    // Substituir cada @[uuid] por @Nome
    const replacements: Array<{ from: string; to: string }> = [];
    while ((match = mentionRegex.exec(value)) !== null) {
      const userId = match[1];
      const usuario = usuariosCache.find((u) => u.id === userId);
      if (usuario) {
        replacements.push({ from: match[0], to: `@${usuario.nome}` });
      }
    }

    // Aplicar substituições (em ordem reversa para não afetar índices)
    replacements.forEach(({ from, to }) => {
      display = display.replace(from, to);
    });

    return display;
  }, [value, usuariosCache]);

  // Converter exibiçÍo (@Nome) de volta para interno (@[uuid])
  const convertDisplayToInternal = useCallback(
    (displayText: string): string => {
      let internal = displayText;

      // Encontrar todos os @Nome e converter para @[uuid]
      usuariosCache.forEach((usuario) => {
        // Regex para encontrar @Nome (nome completo ou primeiro nome)
        const nomeCompleto = usuario.nome;
        const primeiroNome = nomeCompleto.split(" ")[0];

        // Tentar match com nome completo primeiro
        const regexCompleto = new RegExp(`@${escapeRegex(nomeCompleto)}(?![\\w])`, "gi");
        internal = internal.replace(regexCompleto, `@[${usuario.id}]`);

        // Depois tentar com primeiro nome (se ainda tiver @primeiroNome solto)
        const regexPrimeiro = new RegExp(`@${escapeRegex(primeiroNome)}(?![\\w\\[])`, "gi");
        internal = internal.replace(regexPrimeiro, `@[${usuario.id}]`);
      });

      return internal;
    },
    [usuariosCache]
  );

  // Detectar quando o usuário digita @
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newDisplayValue = e.target.value;
      const cursorPos = e.target.selectionStart || 0;

      // Verificar se estamos em um contexto de mençÍo
      const textBeforeCursor = newDisplayValue.substring(0, cursorPos);
      const lastAtIndex = textBeforeCursor.lastIndexOf("@");

      if (lastAtIndex !== -1) {
        // Extrair texto após o @
        const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);

        // Verificar se é um @ válido (início de palavra, sem espaço depois ainda)
        const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : " ";
        const isValidMention = charBeforeAt === " " || charBeforeAt === "\n" || lastAtIndex === 0;

        // Se não tem espaço após o @ e é válido, mostrar sugestões
        if (isValidMention && !textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
          setMentionStart(lastAtIndex);
          setShowSuggestions(true);
          setSelectedIndex(0);

          // Filtrar sugestões
          const filtered = usuariosCache.filter(
            (u) =>
              u.nome.toLowerCase().includes(textAfterAt.toLowerCase()) ||
              (u.email && u.email.toLowerCase().includes(textAfterAt.toLowerCase()))
          );
          setSuggestions(filtered.slice(0, 8));
        } else {
          setShowSuggestions(false);
          setMentionStart(null);
        }
      } else {
        setShowSuggestions(false);
        setMentionStart(null);
      }

      // Converter para formato interno e notificar pai
      const internalValue = convertDisplayToInternal(newDisplayValue);
      onChange(internalValue);
    },
    [onChange, usuariosCache, convertDisplayToInternal]
  );

  // Inserir mençÍo selecionada
  const insertMention = useCallback(
    (usuario: MentionSuggestion) => {
      if (mentionStart === null || !textareaRef.current) return;

      const currentDisplay = textareaRef.current.value;
      const cursorPos = textareaRef.current.selectionStart || 0;

      // Texto antes do @
      const beforeMention = currentDisplay.substring(0, mentionStart);
      // Texto após o cursor (onde o usuário estava digitando)
      const afterMention = currentDisplay.substring(cursorPos);

      // Inserir @Nome (visualmente)
      const mentionDisplay = `@${usuario.nome}`;

      // Converter para interno (@[uuid])
      const newInternalValue = beforeMention + `@[${usuario.id}]` + " " + convertDisplayToInternal(afterMention);

      // Notificar pai com valor interno
      onChange(newInternalValue);
      setShowSuggestions(false);
      setMentionStart(null);

      // Focar e posicionar cursor após a mençÍo
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = mentionStart + mentionDisplay.length + 1;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    },
    [mentionStart, onChange, convertDisplayToInternal]
  );

  // NavegaçÍo por teclado nas sugestões
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Ctrl+Enter para enviar
      if (e.ctrlKey && e.key === "Enter" && onSubmit) {
        e.preventDefault();
        onSubmit();
        return;
      }

      if (!showSuggestions || suggestions.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % suggestions.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
          break;
        case "Enter":
          e.preventDefault();
          insertMention(suggestions[selectedIndex]);
          break;
        case "Escape":
          e.preventDefault();
          setShowSuggestions(false);
          break;
        case "Tab":
          e.preventDefault();
          insertMention(suggestions[selectedIndex]);
          break;
      }
    },
    [showSuggestions, suggestions, selectedIndex, insertMention, onSubmit]
  );

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      {/* Textarea - mostra @Nome */}
      <textarea
        ref={textareaRef}
        value={displayValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        autoFocus={autoFocus}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F25C26] focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      />

      {/* Dropdown de sugestões */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-64 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
        >
          <div className="px-3 py-2 text-xs text-gray-500 border-b bg-gray-50">
            Mencionar usuário
          </div>
          {suggestions.map((usuario, index) => (
            <button
              key={usuario.id}
              type="button"
              onClick={() => insertMention(usuario)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                index === selectedIndex ? "bg-orange-50 border-l-2 border-[#F25C26]" : ""
              }`}
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 overflow-hidden flex-shrink-0">
                {usuario.avatar_url ? (
                  <img
                    src={usuario.avatar_url}
                    alt={usuario.nome}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  usuario.nome.charAt(0).toUpperCase()
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {usuario.nome}
                </p>
                {usuario.email && (
                  <p className="text-xs text-gray-500 truncate">{usuario.email}</p>
                )}
              </div>
            </button>
          ))}

          {/* Dica de navegaçÍo */}
          <div className="px-3 py-2 text-[10px] text-gray-400 border-t bg-gray-50 flex items-center gap-2">
            <span className="px-1 py-0.5 bg-gray-200 rounded text-gray-600">↑↓</span>
            navegar
            <span className="px-1 py-0.5 bg-gray-200 rounded text-gray-600">Enter</span>
            selecionar
            <span className="px-1 py-0.5 bg-gray-200 rounded text-gray-600">Esc</span>
            fechar
          </div>
        </div>
      )}
    </div>
  );
}

// FunçÍo auxiliar para escapar caracteres especiais em regex
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ============================================================
// UTILITÁRIOS EXPORTADOS
// ============================================================

/**
 * Extrair IDs de usuários mencionados de um texto
 */
export function extrairMencoesDoTexto(texto: string): string[] {
  const regex = /@\[([^\]]+)\]/g;
  const mencoes: string[] = [];
  let match;

  while ((match = regex.exec(texto)) !== null) {
    mencoes.push(match[1]);
  }

  return [...new Set(mencoes)];
}

/**
 * Formatar texto substituindo @[id] por @Nome para exibiçÍo
 */
export function formatarTextoComMencoes(
  texto: string,
  usuarios: Array<{ id: string; nome: string }>
): string {
  let resultado = texto;

  usuarios.forEach((u) => {
    const regex = new RegExp(`@\\[${u.id}\\]`, "g");
    resultado = resultado.replace(regex, `@${u.nome}`);
  });

  return resultado;
}

/**
 * Renderizar texto com menções como elementos clicáveis
 */
export function renderizarMencoesComoLinks(
  texto: string,
  usuarios: Array<{ id: string; nome: string }>,
  onMentionClick?: (userId: string) => void
): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /@\[([^\]]+)\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(texto)) !== null) {
    // Texto antes da mençÍo
    if (match.index > lastIndex) {
      parts.push(texto.substring(lastIndex, match.index));
    }

    // MençÍo
    const userId = match[1];
    const usuario = usuarios.find((u) => u.id === userId);

    if (usuario) {
      parts.push(
        <span
          key={`mention-${match.index}`}
          className="inline-flex items-center px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium cursor-pointer hover:bg-blue-200 transition-colors"
          onClick={() => onMentionClick?.(userId)}
        >
          @{usuario.nome}
        </span>
      );
    } else {
      parts.push(
        <span
          key={`mention-${match.index}`}
          className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded"
        >
          @usuário
        </span>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Texto restante
  if (lastIndex < texto.length) {
    parts.push(texto.substring(lastIndex));
  }

  return parts;
}


