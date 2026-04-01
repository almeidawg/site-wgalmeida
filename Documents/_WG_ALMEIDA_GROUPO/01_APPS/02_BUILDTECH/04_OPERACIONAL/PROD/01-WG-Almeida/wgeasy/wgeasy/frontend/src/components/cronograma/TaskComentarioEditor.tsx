// ============================================================
// COMPONENTE: Editor de Comentários de Tasks
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import React, { useState, useEffect } from "react";
import {
  criarComentario,
  atualizarComentario,
  extrairMencoes,
  type TaskComentario,
} from "@/lib/taskComentariosApi";
import MentionInput from "@/components/common/MentionInput";

// ============================================================
// TIPOS
// ============================================================

interface TaskComentarioEditorProps {
  task_id: string;
  comentarioEditando?: TaskComentario;
  onSucesso?: () => void;
  onCancelar?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

// ============================================================
// COMPONENTE
// ============================================================

const TaskComentarioEditor: React.FC<TaskComentarioEditorProps> = ({
  task_id,
  comentarioEditando,
  onSucesso,
  onCancelar,
  placeholder = "Adicione um comentário...",
  autoFocus = false,
}) => {
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrandoDicas, setMostrandoDicas] = useState(false);

  // Preencher campo se estiver editando
  useEffect(() => {
    if (comentarioEditando) {
      setComentario(comentarioEditando.comentario);
    }
  }, [comentarioEditando]);

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();

    if (!comentario.trim()) {
      setErro("Digite um comentário");
      return;
    }

    setLoading(true);
    setErro(null);

    try {
      const mencoes = extrairMencoes(comentario);

      if (comentarioEditando) {
        // Atualizar comentário existente
        await atualizarComentario(
          comentarioEditando.id,
          comentario.trim(),
          mencoes
        );
      } else {
        // Criar novo comentário
        await criarComentario({
          task_id,
          comentario: comentario.trim(),
          mencoes,
        });
      }

      // Limpar campo e notificar sucesso
      setComentario("");
      if (onSucesso) onSucesso();
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : "Erro ao salvar comentário";
      setErro(mensagem);
    } finally {
      setLoading(false);
    }
  }

  function handleCancelar() {
    setComentario("");
    setErro(null);
    if (onCancelar) onCancelar();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Campo de texto com menções */}
      <div className="relative">
        <MentionInput
          value={comentario}
          onChange={setComentario}
          placeholder={placeholder}
          rows={3}
          autoFocus={autoFocus}
          disabled={loading}
          onSubmit={handleSubmit}
        />

        {/* BotÍo de dicas */}
        <button
          type="button"
          onClick={() => setMostrandoDicas(!mostrandoDicas)}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 rounded z-10"
          title="Dicas de formataçÍo"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
      </div>

      {/* Dicas de formataçÍo */}
      {mostrandoDicas && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
          <p className="font-normal text-blue-900 mb-2">
            Dicas de formataçÍo:
          </p>
          <ul className="space-y-1 text-blue-700">
            <li>
              • Digite <code className="bg-blue-100 px-1 rounded">@</code> para mencionar alguém
            </li>
            <li>• Use <code className="bg-blue-100 px-1 rounded">Ctrl+Enter</code> para enviar rapidamente</li>
            <li>• Quebras de linha sÍo preservadas</li>
            <li>• Comentários editados sÍo marcados como "(editado)"</li>
          </ul>
        </div>
      )}

      {/* Erro */}
      {erro && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-sm text-red-700">
          {erro}
        </div>
      )}

      {/* Botões */}
      <div className="flex items-center justify-between gap-3">
        {/* Info */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{comentario.length} caracteres</span>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2">
          {(comentarioEditando || onCancelar) && (
            <button
              type="button"
              onClick={handleCancelar}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !comentario.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                <span>
                  {comentarioEditando ? "Atualizar" : "Comentar"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default TaskComentarioEditor;

