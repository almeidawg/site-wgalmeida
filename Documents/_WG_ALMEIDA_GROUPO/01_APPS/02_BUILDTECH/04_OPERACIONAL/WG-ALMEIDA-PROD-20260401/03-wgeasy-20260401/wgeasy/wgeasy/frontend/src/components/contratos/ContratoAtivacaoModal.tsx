// ============================================================
// COMPONENTE: Modal de AtivaçÍo de Contrato
// Permite ativar contrato e gerar integrações automáticas
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import React, { useState } from "react";
import {
  ativarContrato,
  type AtivarContratoRequest,
  type AtivarContratoResult,
  type ConfiguracaoParcelas,
} from "@/lib/workflows/contratoWorkflow";

// ============================================================
// TIPOS
// ============================================================

interface ContratoAtivacaoModalProps {
  contrato_id: string;
  contrato_numero: string;
  valor_total: number;
  onClose: () => void;
  onSuccess: (resultado: AtivarContratoResult) => void;
}

// ============================================================
// COMPONENTE
// ============================================================

const ContratoAtivacaoModal: React.FC<ContratoAtivacaoModalProps> = ({
  contrato_id,
  contrato_numero,
  valor_total,
  onClose,
  onSuccess,
}) => {
  const [gerarFinanceiro, setGerarFinanceiro] = useState(true);
  const [gerarCompras, setGerarCompras] = useState(true);
  const [gerarCronograma, setGerarCronograma] = useState(true);

  // ConfiguraçÍo de parcelas
  const [configurarParcelas, setConfigurarParcelas] = useState(false);
  const [numeroParcelas, setNumeroParcelas] = useState(1);
  const [diaVencimento, setDiaVencimento] = useState(10);
  const [periodicidade, setPeriodicidade] = useState<"mensal" | "quinzenal" | "semanal">("mensal");
  const [temEntrada, setTemEntrada] = useState(false);
  const [valorEntrada, setValorEntrada] = useState(0);

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Calcular valor das parcelas
  const valorRestante = temEntrada ? valor_total - valorEntrada : valor_total;
  const parcelasRestantes = temEntrada ? numeroParcelas - 1 : numeroParcelas;
  const valorParcela = parcelasRestantes > 0 ? valorRestante / parcelasRestantes : 0;

  // Submeter ativaçÍo
  const handleAtivar = async () => {
    setLoading(true);
    setErro(null);

    try {
      const request: AtivarContratoRequest = {
        contrato_id,
        gerar_financeiro: gerarFinanceiro,
        gerar_compras: gerarCompras,
        gerar_cronograma: gerarCronograma,
        ativacao_automatica: true, // Permite ativar mesmo sem assinaturas
      };

      // Adicionar configuraçÍo de parcelas se habilitado
      if (gerarFinanceiro && configurarParcelas) {
        const config: ConfiguracaoParcelas = {
          numero_parcelas: numeroParcelas,
          dia_vencimento: diaVencimento,
          periodicidade,
        };

        if (temEntrada) {
          config.primeira_parcela_entrada = true;
          config.valor_entrada = valorEntrada;
        }

        request.configuracao_parcelas = config;
      }

      const resultado = await ativarContrato(request);

      if (resultado.sucesso) {
        onSuccess(resultado);
      } else {
        setErro(resultado.mensagem);
      }
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : "Erro inesperado";
      setErro(`Erro ao ativar contrato: ${mensagem}`);
    } finally {
      setLoading(false);
    }
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
                Ativar Contrato
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {contrato_numero} • R$ {valor_total.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </p>
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
          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
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
              <div className="flex-1">
                <p className="text-sm font-normal text-blue-900 mb-1">
                  AtivaçÍo de Contrato
                </p>
                <p className="text-sm text-blue-700">
                  A ativaçÍo irá disparar as integrações automáticas selecionadas abaixo.
                  Certifique-se de que o contrato está assinado por ambas as partes.
                </p>
              </div>
            </div>
          </div>

          {/* Opções de IntegraçÍo */}
          <div className="space-y-4 mb-6">
            <h3 className="text-sm font-normal text-[#2E2E2E]">
              Integrações Automáticas
            </h3>

            {/* Financeiro */}
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gerarFinanceiro}
                  onChange={(e) => setGerarFinanceiro(e.target.checked)}
                  className="w-4 h-4 text-[#F25C26] border-gray-300 rounded focus:ring-[#F25C26] mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-normal text-gray-900">
                      Gerar Financeiro
                    </span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Cria registro de receita no módulo financeiro
                  </p>
                </div>
              </label>

              {/* ConfiguraçÍo de Parcelas */}
              {gerarFinanceiro && (
                <div className="mt-4 pl-7">
                  <label className="flex items-center gap-2 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={configurarParcelas}
                      onChange={(e) => setConfigurarParcelas(e.target.checked)}
                      className="w-4 h-4 text-[#F25C26] border-gray-300 rounded focus:ring-[#F25C26]"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Configurar parcelas
                    </span>
                  </label>

                  {configurarParcelas && (
                    <div className="bg-gray-50 rounded-lg p-3 space-y-3">
                      {/* Número de parcelas */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Número de Parcelas
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="120"
                          value={numeroParcelas}
                          onChange={(e) => setNumeroParcelas(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F25C26] focus:border-transparent"
                        />
                      </div>

                      {/* Periodicidade */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Periodicidade
                        </label>
                        <select
                          value={periodicidade}
                          onChange={(e) =>
                            setPeriodicidade(
                              e.target.value as "mensal" | "quinzenal" | "semanal"
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F25C26] focus:border-transparent"
                        >
                          <option value="mensal">Mensal</option>
                          <option value="quinzenal">Quinzenal</option>
                          <option value="semanal">Semanal</option>
                        </select>
                      </div>

                      {/* Dia de vencimento */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Dia de Vencimento
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={diaVencimento}
                          onChange={(e) => setDiaVencimento(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F25C26] focus:border-transparent"
                        />
                      </div>

                      {/* Entrada */}
                      <div>
                        <label className="flex items-center gap-2 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={temEntrada}
                            onChange={(e) => setTemEntrada(e.target.checked)}
                            className="w-4 h-4 text-[#F25C26] border-gray-300 rounded focus:ring-[#F25C26]"
                          />
                          <span className="text-xs font-medium text-gray-700">
                            Primeira parcela como entrada
                          </span>
                        </label>
                        {temEntrada && (
                          <input
                            type="number"
                            min="0"
                            max={valor_total}
                            step="0.01"
                            value={valorEntrada}
                            onChange={(e) => setValorEntrada(Number(e.target.value))}
                            placeholder="Valor da entrada"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F25C26] focus:border-transparent"
                          />
                        )}
                      </div>

                      {/* Resumo */}
                      <div className="border-t border-gray-200 pt-3 mt-3">
                        <div className="text-xs space-y-1">
                          {temEntrada && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Entrada:</span>
                              <span className="font-normal">
                                R$ {valorEntrada.toLocaleString("pt-BR", {
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              {parcelasRestantes}x de:
                            </span>
                            <span className="font-normal">
                              R$ {valorParcela.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-gray-200">
                            <span className="text-gray-700 font-normal">Total:</span>
                            <span className="font-normal text-[#F25C26]">
                              R$ {valor_total.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Compras */}
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gerarCompras}
                  onChange={(e) => setGerarCompras(e.target.checked)}
                  className="w-4 h-4 text-[#F25C26] border-gray-300 rounded focus:ring-[#F25C26] mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-normal text-gray-900">
                      Gerar Pedido de Compra
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Cria pedido de compra com os materiais do contrato
                  </p>
                </div>
              </label>
            </div>

            {/* Cronograma */}
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gerarCronograma}
                  onChange={(e) => setGerarCronograma(e.target.checked)}
                  className="w-4 h-4 text-[#F25C26] border-gray-300 rounded focus:ring-[#F25C26] mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-normal text-gray-900">
                      Gerar Cronograma
                    </span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Cria projeto com tarefas baseadas nos itens do contrato
                  </p>
                </div>
              </label>
            </div>
          </div>

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
            onClick={handleAtivar}
            disabled={loading}
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
                <span>Ativando...</span>
              </>
            ) : (
              "Ativar Contrato"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContratoAtivacaoModal;

