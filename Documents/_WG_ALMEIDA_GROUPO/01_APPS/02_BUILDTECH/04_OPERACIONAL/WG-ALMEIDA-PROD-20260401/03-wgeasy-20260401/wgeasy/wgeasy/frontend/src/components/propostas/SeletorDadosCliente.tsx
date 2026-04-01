// ============================================================
// COMPONENTE: Seletor de Dados do Cliente
// Busca análises de projeto e quantitativos vinculados ao cliente
// para importar dados na criaçÍo de propostas
// ============================================================

import { useState, useEffect } from "react";
import { FileText, Package, ChevronRight, CheckCircle, AlertCircle, Loader2, X } from "lucide-react";
import { listarAnalisesAprovadas } from "@/lib/analiseProjetoApi";
import { listarQuantitativosProjetos } from "@/services/quantitativosApi";
import type { AnaliseProjetoCompleta } from "@/types/analiseProjeto";
import type { QuantitativoProjetoCompleto } from "@/types/quantitativos";

// ============================================================
// TIPOS
// ============================================================

export interface DadosImportados {
  tipo: "analise" | "quantitativo" | "nenhum";
  analise?: AnaliseProjetoCompleta;
  quantitativo?: QuantitativoProjetoCompleto;
}

interface SeletorDadosClienteProps {
  clienteId: string;
  clienteNome: string;
  onSelecionar: (dados: DadosImportados) => void;
  onFechar: () => void;
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function SeletorDadosCliente({
  clienteId,
  clienteNome,
  onSelecionar,
  onFechar,
}: SeletorDadosClienteProps) {
  const [loading, setLoading] = useState(true);
  const [analises, setAnalises] = useState<AnaliseProjetoCompleta[]>([]);
  const [quantitativos, setQuantitativos] = useState<QuantitativoProjetoCompleto[]>([]);
  const [selecionado, setSelecionado] = useState<{
    tipo: "analise" | "quantitativo" | null;
    id: string | null;
  }>({ tipo: null, id: null });

  // Carregar dados do cliente
  useEffect(() => {
    async function carregarDados() {
      if (!clienteId) return;

      setLoading(true);
      try {
        // Buscar em paralelo
        const [analisesData, quantitativosData] = await Promise.all([
          listarAnalisesAprovadas(clienteId).catch(() => []),
          listarQuantitativosProjetos({ cliente_id: clienteId }).catch(() => []),
        ]);

        setAnalises(analisesData || []);
        setQuantitativos(quantitativosData || []);
      } catch (error) {
        console.error("Erro ao carregar dados do cliente:", error);
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, [clienteId]);

  // Confirmar seleçÍo
  function confirmarSelecao() {
    if (!selecionado.tipo || !selecionado.id) {
      onSelecionar({ tipo: "nenhum" });
      return;
    }

    if (selecionado.tipo === "analise") {
      const analise = analises.find((a) => a.id === selecionado.id);
      if (analise) {
        onSelecionar({ tipo: "analise", analise });
      }
    } else if (selecionado.tipo === "quantitativo") {
      const quantitativo = quantitativos.find((q) => q.id === selecionado.id);
      if (quantitativo) {
        onSelecionar({ tipo: "quantitativo", quantitativo });
      }
    }
  }

  // Formatar data
  function formatarData(data: string): string {
    return parseDataLocal(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function parseDataLocal(valor: string) {
    const isoSemHora = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoSemHora) {
      const [, ano, mes, dia] = isoSemHora;
      return new Date(Number(ano), Number(mes) - 1, Number(dia));
    }
    return new Date(valor);
  }

  const temDados = analises.length > 0 || quantitativos.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-white">
          <div>
            <h2 className="text-base font-normal text-gray-900">
              Dados Disponíveis
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Cliente: <span className="font-medium text-gray-700">{clienteNome}</span>
            </p>
          </div>
          <button
            onClick={onFechar}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Loader2 size={32} className="animate-spin mb-3" />
              <p className="text-sm">Buscando dados do cliente...</p>
            </div>
          ) : !temDados ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <AlertCircle size={40} className="mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">Nenhum dado encontrado</p>
              <p className="text-xs text-gray-400 mt-1">
                Este cliente não possui análises de projeto ou quantitativos aprovados.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Análises de Projeto */}
              {analises.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText size={16} className="text-blue-500" />
                    <h3 className="text-sm font-normal text-gray-700">
                      Análises de Projeto
                    </h3>
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                      {analises.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {analises.map((analise) => (
                      <button
                        key={analise.id}
                        onClick={() =>
                          setSelecionado({
                            tipo: "analise",
                            id: analise.id,
                          })
                        }
                        className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                          selecionado.tipo === "analise" && selecionado.id === analise.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm text-gray-900">
                                {analise.titulo || `Análise ${analise.numero || ""}`}
                              </p>
                              {selecionado.tipo === "analise" &&
                                selecionado.id === analise.id && (
                                  <CheckCircle size={16} className="text-blue-500" />
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {analise.tipo_projeto === "reforma"
                                ? "Reforma"
                                : analise.tipo_projeto === "obra_nova"
                                ? "Obra Nova"
                                : "AmpliaçÍo"}{" "}
                              • {formatarData(analise.criado_em)}
                            </p>

                            {/* Resumo de dados */}
                            <div className="flex gap-3 mt-2">
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                {analise.total_ambientes || 0} ambientes
                              </span>
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                {(analise.total_area_piso || 0).toFixed(1)} m²
                              </span>
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                {(analise.total_perimetro || 0).toFixed(1)} ml
                              </span>
                            </div>
                          </div>
                          <ChevronRight
                            size={18}
                            className={`text-gray-300 ${
                              selecionado.tipo === "analise" &&
                              selecionado.id === analise.id
                                ? "text-blue-400"
                                : ""
                            }`}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantitativos */}
              {quantitativos.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Package size={16} className="text-purple-500" />
                    <h3 className="text-sm font-normal text-gray-700">
                      Quantitativos
                    </h3>
                    <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                      {quantitativos.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {quantitativos.map((qtd) => (
                      <button
                        key={qtd.id}
                        onClick={() =>
                          setSelecionado({
                            tipo: "quantitativo",
                            id: qtd.id,
                          })
                        }
                        className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                          selecionado.tipo === "quantitativo" && selecionado.id === qtd.id
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm text-gray-900">
                                {qtd.nome || `Quantitativo ${qtd.numero || ""}`}
                              </p>
                              {selecionado.tipo === "quantitativo" &&
                                selecionado.id === qtd.id && (
                                  <CheckCircle size={16} className="text-purple-500" />
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {qtd.nucleo === "arquitetura"
                                ? "Arquitetura"
                                : qtd.nucleo === "engenharia"
                                ? "Engenharia"
                                : "Marcenaria"}{" "}
                              • {formatarData(qtd.criado_em)}
                            </p>

                            {/* Resumo de dados */}
                            <div className="flex gap-3 mt-2">
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                {qtd.total_ambientes || 0} ambientes
                              </span>
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                {qtd.total_itens || 0} itens
                              </span>
                              {qtd.valor_total && (
                                <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded">
                                  R$ {qtd.valor_total.toLocaleString("pt-BR")}
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight
                            size={18}
                            className={`text-gray-300 ${
                              selecionado.tipo === "quantitativo" &&
                              selecionado.id === qtd.id
                                ? "text-purple-400"
                                : ""
                            }`}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <button
            onClick={() => onSelecionar({ tipo: "nenhum" })}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Iniciar do Zero
          </button>

          <div className="flex gap-2">
            <button
              onClick={onFechar}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmarSelecao}
              disabled={!selecionado.tipo}
              className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${
                selecionado.tipo
                  ? "bg-primary text-white hover:bg-[#E04D1A]"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              Usar Selecionado
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


