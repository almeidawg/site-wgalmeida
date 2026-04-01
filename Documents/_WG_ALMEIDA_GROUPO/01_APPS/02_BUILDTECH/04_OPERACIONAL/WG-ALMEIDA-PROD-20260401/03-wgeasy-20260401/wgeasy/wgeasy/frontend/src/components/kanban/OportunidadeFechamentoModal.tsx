// ============================================================
// COMPONENTE: Modal de Fechamento de Oportunidade
// Permite fechar oportunidade e gerar contratos
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import React, { useState, useEffect } from "react";
import type { UnidadeNegocio } from "@/types/contratos";
import {
  fecharOportunidade,
  validarFechamentoOportunidade,
  type ValidacaoOportunidade,
  type OportunidadeFechamentoResult,
} from "@/lib/workflows/oportunidadeWorkflow";

// ============================================================
// TIPOS
// ============================================================

interface OportunidadeFechamentoModalProps {
  oportunidade_id: string;
  oportunidade_titulo: string;
  onClose: () => void;
  onSuccess: (resultado: OportunidadeFechamentoResult) => void;
}

// ============================================================
// COMPONENTE
// ============================================================

const OportunidadeFechamentoModal: React.FC<OportunidadeFechamentoModalProps> = ({
  oportunidade_id,
  oportunidade_titulo,
  onClose,
  onSuccess,
}) => {
  const [unidadesSelecionadas, setUnidadesSelecionadas] = useState<
    UnidadeNegocio[]
  >([]);
  const [observacoes, setObservacoes] = useState("");
  const [gerarContratos, setGerarContratos] = useState(true);
  const [loading, setLoading] = useState(false);
  const [validacao, setValidacao] = useState<ValidacaoOportunidade | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Validar ao montar o componente
  useEffect(() => {
    async function validar() {
      try {
        const resultado = await validarFechamentoOportunidade(oportunidade_id);
        setValidacao(resultado);
      } catch (error: any) {
        setErro(`Erro ao validar oportunidade: ${error.message}`);
      }
    }
    validar();
  }, [oportunidade_id]);

  // Alternar seleçÍo de unidade
  const toggleUnidade = (unidade: UnidadeNegocio) => {
    setUnidadesSelecionadas((prev) =>
      prev.includes(unidade)
        ? prev.filter((u) => u !== unidade)
        : [...prev, unidade]
    );
  };

  // Submeter fechamento
  const handleFechar = async () => {
    if (!validacao?.pode_fechar) {
      setErro("não é possível fechar a oportunidade devido às validações");
      return;
    }

    if (gerarContratos && unidadesSelecionadas.length === 0) {
      setErro("Selecione pelo menos uma unidade de negócio para gerar contratos");
      return;
    }

    setLoading(true);
    setErro(null);

    try {
      const resultado = await fecharOportunidade({
        oportunidade_id,
        unidades_negocio: unidadesSelecionadas,
        observacoes: observacoes || undefined,
        gerar_contratos: gerarContratos,
      });

      if (resultado.sucesso) {
        onSuccess(resultado);
      } else {
        setErro(resultado.mensagem);
      }
    } catch (error: any) {
      setErro(`Erro ao fechar oportunidade: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Cores das unidades de negócio
  const UNIDADE_COLORS: Record<UnidadeNegocio, string> = {
    arquitetura: "#8B5CF6",
    engenharia: "#3B82F6",
    marcenaria: "#F59E0B",
    moma_engenharia: "#3B82F6",
    moma_planejados: "#8B5CF6",
  };

  const UNIDADE_LABELS: Record<UnidadeNegocio, string> = {
    arquitetura: "Arquitetura",
    engenharia: "Engenharia",
    marcenaria: "Marcenaria",
    moma_engenharia: "MOMA Engenharia",
    moma_planejados: "MOMA Planejados",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-normal text-[#2E2E2E]">
                Fechar Oportunidade
              </h2>
              <p className="text-sm text-gray-600 mt-1">{oportunidade_titulo}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-light"
              disabled={loading}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          {/* ValidaçÍo do Checklist */}
          {validacao && (
            <div className="mb-6">
              <h3 className="text-sm font-normal text-[#2E2E2E] mb-3">
                Status da ValidaçÍo
              </h3>

              {/* Bloqueios */}
              {validacao.motivos_bloqueio.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-normal text-red-900 mb-1">
                        não é possível fechar
                      </p>
                      <ul className="text-sm text-red-700 space-y-1">
                        {validacao.motivos_bloqueio.map((motivo, i) => (
                          <li key={i}>• {motivo}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Avisos */}
              {validacao.avisos.length > 0 && validacao.pode_fechar && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-normal text-yellow-900 mb-1">
                        Avisos
                      </p>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {validacao.avisos.map((aviso, i) => (
                          <li key={i}>• {aviso}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Resumo do Checklist */}
              {validacao.resumo_checklist &&
                validacao.resumo_checklist.total_checklist > 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Progresso do Checklist
                      </span>
                      <span className="text-sm font-normal text-[#F25C26]">
                        {validacao.resumo_checklist.percentual_concluido}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-gradient-to-r from-[#F25C26] to-[#e04a1a] transition-all"
                        style={{
                          width: `${validacao.resumo_checklist.percentual_concluido}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-600">
                      {validacao.resumo_checklist.checklist_concluidos} de{" "}
                      {validacao.resumo_checklist.total_checklist} itens concluídos
                    </p>
                  </div>
                )}

              {/* Sucesso */}
              {validacao.pode_fechar && validacao.motivos_bloqueio.length === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm font-normal text-green-900">
                      Oportunidade pronta para ser fechada
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* OpçÍo de gerar contratos */}
          {validacao?.pode_fechar && (
            <>
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gerarContratos}
                    onChange={(e) => setGerarContratos(e.target.checked)}
                    className="w-4 h-4 text-[#F25C26] border-gray-300 rounded focus:ring-[#F25C26]"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Gerar contratos automaticamente
                  </span>
                </label>
              </div>

              {/* SeleçÍo de Unidades de Negócio */}
              {gerarContratos && (
                <div className="mb-4">
                  <label className="block text-sm font-normal text-[#2E2E2E] mb-3">
                    Unidades de Negócio
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(
                      ["arquitetura", "engenharia", "marcenaria"] as UnidadeNegocio[]
                    ).map((unidade) => (
                      <button
                        key={unidade}
                        type="button"
                        onClick={() => toggleUnidade(unidade)}
                        className={`
                          px-4 py-3 rounded-lg border-2 text-sm font-normal transition-all
                          ${
                            unidadesSelecionadas.includes(unidade)
                              ? "border-current text-white"
                              : "border-gray-200 text-gray-700 hover:border-gray-300"
                          }
                        `}
                        style={
                          unidadesSelecionadas.includes(unidade)
                            ? { backgroundColor: UNIDADE_COLORS[unidade] }
                            : {}
                        }
                      >
                        {UNIDADE_LABELS[unidade]}
                      </button>
                    ))}
                  </div>
                  {unidadesSelecionadas.length > 0 && (
                    <p className="text-xs text-gray-600 mt-2">
                      {unidadesSelecionadas.length} contrato(s) será(Ío) criado(s)
                    </p>
                  )}
                </div>
              )}

              {/* Observações */}
              <div className="mb-4">
                <label className="block text-sm font-normal text-[#2E2E2E] mb-2">
                  Observações (opcional)
                </label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F25C26] focus:border-transparent resize-none"
                  placeholder="Adicione observações sobre o fechamento..."
                />
              </div>
            </>
          )}

          {/* Erro */}
          {erro && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700">{erro}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleFechar}
            disabled={loading || !validacao?.pode_fechar}
            className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Fechando...</span>
              </>
            ) : (
              "Fechar Oportunidade"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OportunidadeFechamentoModal;



