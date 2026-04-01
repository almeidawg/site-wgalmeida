import { useState } from "react";
import { EtapaChecklist as IEtapaChecklist, formatarDataHora } from "@/types/etapas";
import { supabase } from "@/lib/supabaseClient";
import { Check, Square, AlertCircle, Plus, Trash2 } from "lucide-react";

type Props = {
  etapaId: string;
  checklist: IEtapaChecklist[];
  onUpdate: () => void;
  readonly?: boolean;
};

export default function EtapaChecklist({
  etapaId,
  checklist,
  onUpdate,
  readonly = false,
}: Props) {
  const [adicionandoItem, setAdicionandoItem] = useState(false);
  const [novoItem, setNovoItem] = useState("");
  const [novaDescricao, setNovaDescricao] = useState("");
  const [obrigatorio, setObrigatorio] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Ordenar checklist
  const checklistOrdenado = [...checklist].sort((a, b) => a.ordem - b.ordem);
  const totalItens = checklist.length;
  const itensConcluidos = checklist.filter((item) => item.concluido).length;
  const percentualConcluido =
    totalItens > 0 ? Math.round((itensConcluidos / totalItens) * 100) : 0;

  async function toggleItem(item: IEtapaChecklist) {
    if (readonly) return;

    const novoConcluido = !item.concluido;

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    const { error } = await supabase
      .from("obras_etapas_checklist")
      .update({
        concluido: novoConcluido,
        data_conclusao: novoConcluido ? new Date().toISOString() : null,
        concluido_por_id: novoConcluido ? user?.id : null,
        concluido_por_nome: novoConcluido ? user?.email : null,
      })
      .eq("id", item.id);

    if (error) {
      console.error("Erro ao atualizar checklist:", error);
      alert("Erro ao atualizar item do checklist");
      return;
    }

    onUpdate();
  }

  async function adicionarItem() {
    if (!novoItem.trim()) {
      alert("Digite o nome do item");
      return;
    }

    setSalvando(true);

    const novaOrdem = Math.max(...checklist.map((c) => c.ordem), 0) + 1;

    const { error } = await supabase.from("obras_etapas_checklist").insert({
      etapa_id: etapaId,
      item: novoItem,
      descricao: novaDescricao || null,
      ordem: novaOrdem,
      obrigatorio,
    });

    setSalvando(false);

    if (error) {
      console.error("Erro ao adicionar item:", error);
      alert("Erro ao adicionar item ao checklist");
      return;
    }

    setNovoItem("");
    setNovaDescricao("");
    setObrigatorio(false);
    setAdicionandoItem(false);
    onUpdate();
  }

  async function removerItem(item: IEtapaChecklist) {
    if (readonly) return;

    if (!confirm(`Deseja remover o item "${item.item}"?`)) {
      return;
    }

    const { error } = await supabase
      .from("obras_etapas_checklist")
      .delete()
      .eq("id", item.id);

    if (error) {
      console.error("Erro ao remover item:", error);
      alert("Erro ao remover item do checklist");
      return;
    }

    onUpdate();
  }

  return (
    <div className="etapa-checklist bg-white rounded-lg border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-normal text-gray-900">Checklist</h3>
          <p className="text-sm text-gray-600">
            {itensConcluidos} de {totalItens} itens concluídos ({percentualConcluido}%)
          </p>
        </div>

        {!readonly && (
          <button
            onClick={() => setAdicionandoItem(!adicionandoItem)}
            className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors text-sm"
          >
            <Plus size={16} />
            Adicionar Item
          </button>
        )}
      </div>

      {/* Barra de Progresso */}
      <div className="mb-4">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all"
            style={{ width: `${percentualConcluido}%` }}
          />
        </div>
      </div>

      {/* Formulário de Novo Item */}
      {adicionandoItem && !readonly && (
        <div className="mb-4 p-4 bg-gray-50 rounded border border-gray-200">
          <h4 className="text-sm font-normal text-gray-900 mb-3">
            Novo Item do Checklist
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item *
              </label>
              <input
                type="text"
                value={novoItem}
                onChange={(e) => setNovoItem(e.target.value)}
                placeholder="Ex: Verificar nivelamento do piso"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DescriçÍo (opcional)
              </label>
              <textarea
                value={novaDescricao}
                onChange={(e) => setNovaDescricao(e.target.value)}
                placeholder="Detalhes adicionais sobre este item..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="obrigatorio"
                checked={obrigatorio}
                onChange={(e) => setObrigatorio(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="obrigatorio" className="text-sm text-gray-700">
                Item obrigatório
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={adicionarItem}
                disabled={salvando}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {salvando ? "Salvando..." : "Adicionar"}
              </button>
              <button
                onClick={() => {
                  setAdicionandoItem(false);
                  setNovoItem("");
                  setNovaDescricao("");
                  setObrigatorio(false);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Itens */}
      {checklistOrdenado.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Nenhum item no checklist</p>
          {!readonly && (
            <p className="text-sm mt-2">
              Clique em "Adicionar Item" para começar
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        {checklistOrdenado.map((item) => (
          <div
            key={item.id}
            className={`p-3 rounded border transition-colors ${
              item.concluido
                ? "bg-green-50 border-green-200"
                : "bg-white border-gray-200 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Checkbox */}
              <button
                onClick={() => toggleItem(item)}
                disabled={readonly}
                className={`flex-shrink-0 mt-0.5 ${
                  readonly ? "cursor-default" : "cursor-pointer"
                }`}
              >
                {item.concluido ? (
                  <Check
                    size={20}
                    className="text-green-600"
                    style={{
                      border: "2px solid currentColor",
                      borderRadius: "4px",
                    }}
                  />
                ) : (
                  <Square size={20} className="text-gray-400" />
                )}
              </button>

              {/* Conteúdo */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p
                      className={`font-medium ${
                        item.concluido
                          ? "text-green-900 line-through"
                          : "text-gray-900"
                      }`}
                    >
                      {item.item}
                      {item.obrigatorio && (
                        <span className="ml-2 text-red-500 text-sm">*</span>
                      )}
                    </p>
                    {item.descricao && (
                      <p className="text-sm text-gray-600 mt-1">
                        {item.descricao}
                      </p>
                    )}
                    {item.concluido && item.data_conclusao && (
                      <p className="text-xs text-green-600 mt-1">
                        Concluído em {formatarDataHora(item.data_conclusao)}
                        {item.concluido_por_nome &&
                          ` por ${item.concluido_por_nome}`}
                      </p>
                    )}
                  </div>

                  {!readonly && (
                    <button
                      onClick={() => removerItem(item)}
                      className="ml-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Remover item"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Aviso sobre itens obrigatórios */}
      {checklist.some((item) => item.obrigatorio && !item.concluido) && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded flex items-start gap-2">
          <AlertCircle size={16} className="text-yellow-600 mt-0.5" />
          <p className="text-sm text-yellow-800">
            Existem itens obrigatórios pendentes que precisam ser concluídos
          </p>
        </div>
      )}
    </div>
  );
}

