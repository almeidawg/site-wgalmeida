// ============================================================
// PÁGINA: Projetos Financeiros (Cronograma)
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listarProjetosCronograma, criarProjetoDoContrato } from "@/lib/cronogramaApi";
import { listarContratos } from "@/lib/contratosApi";
import type { ProjetoCompletoTimeline } from "@/types/cronograma";
import { formatarValor, formatarData, getUnidadeNegocioColor } from "@/types/contratos";

// Toast simples (placeholder)
const toast = {
  success: (msg: string) => console.log("✅", msg),
  error: (msg: string) => console.error("❌", msg),
};

export default function ProjetosFinanceirosPage() {
  const navigate = useNavigate();
  const [projetos, setProjetos] = useState<ProjetoCompletoTimeline[]>([]);
  const [contratos, setContratos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [criandoProjeto, setCriandoProjeto] = useState<string | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    try {
      // Projetos existentes
      const projetosData = await listarProjetosCronograma();
      setProjetos(projetosData as ProjetoCompletoTimeline[]);

      // Contratos ativos (todos status considerados ativos) que ainda nÍo têm cronograma
      const contratosData = await listarContratos();
      // Status ativos: ativo, aguardando_assinatura, assinado, aguardando, em_execucao, em_andamento
      const contratosSemCronograma = contratosData.filter(
        (c: any) => !["rascunho", "concluido", "cancelado"].includes(c.status) && !c.cronograma_id
      );

      setContratos(contratosSemCronograma);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  async function handleCriarProjeto(contratoId: string) {
    if (criandoProjeto) return;

    setCriandoProjeto(contratoId);
    try {
      const projetoId = await criarProjetoDoContrato(contratoId);
      toast.success("Projeto criado com sucesso!");

      navigate(`/cronograma/projeto/${projetoId}/timeline`);
    } catch (error: any) {
      console.error("Erro ao criar projeto:", error);
      toast.error(error.message || "Erro ao criar projeto");
    } finally {
      setCriandoProjeto(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-[#4C4C4C]">Carregando projetos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-light text-[#2E2E2E]">Projetos (Financeiro)</h1>
        <p className="text-sm text-[#4C4C4C] mt-2">
          Resumo de contratos ativos para acompanhamento financeiro.
        </p>
      </div>

      {/* Contratos sem Cronograma */}
      {contratos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-medium text-[#2E2E2E]">
              Contratos Disponíveis
            </h2>
            <span className="text-sm text-[#4C4C4C] bg-[#F3F3F3] px-3 py-1 rounded-full">
              {contratos.length} contrato{contratos.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {contratos.map((contrato) => (
              <div
                key={contrato.id}
                className="bg-white border border-[#E5E5E5] rounded-xl shadow-sm hover:shadow-md transition-all p-6"
              >
                {/* Cabeçalho do Card */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-normal text-lg"
                      style={{
                        background: getUnidadeNegocioColor(contrato.unidade_negocio),
                      }}
                    >
                      {contrato.numero?.substring(0, 2) || "CT"}
                    </div>
                    <div>
                      <h3 className="font-normal text-[#2E2E2E]">{contrato.numero}</h3>
                      <p className="text-xs text-[#4C4C4C]">
                        {contrato.unidade_negocio === "arquitetura" && "Arquitetura"}
                        {contrato.unidade_negocio === "engenharia" && "Engenharia"}
                        {contrato.unidade_negocio === "marcenaria" && "Marcenaria"}
                      </p>
                    </div>
                  </div>

                  <span className="px-2 py-1 bg-[#10B981] text-white text-xs rounded-full">
                    ativo
                  </span>
                </div>

                {/* Cliente */}
                <div className="mb-4">
                  <p className="text-sm text-[#4C4C4C] font-medium">
                    {contrato.cliente_nome || "Cliente nÍo informado"}
                  </p>
                </div>

                {/* Valores */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#4C4C4C]">Valor total</span>
                    <span className="text-sm font-normal text-[#2E2E2E]">
                      {formatarValor(contrato.valor_total)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#4C4C4C]">Entrada</span>
                    <span className="text-sm font-medium text-[#10B981]">
                      {formatarValor(contrato.valor_entrada || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#4C4C4C]">Parcelas</span>
                    <span className="text-sm text-[#4C4C4C]">
                      {contrato.numero_parcelas || 0}
                    </span>
                  </div>
                </div>

                {/* Datas */}
                <div className="space-y-1 mb-4 pt-3 border-t border-[#E5E5E5]">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#4C4C4C]">Início</span>
                    <span className="text-[#2E2E2E]">
                      {formatarData(contrato.data_inicio)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#4C4C4C]">PrevisÍo término</span>
                    <span className="text-[#2E2E2E]">
                      {formatarData(contrato.data_previsao_termino)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-3 border-t border-[#E5E5E5] text-sm">
                  {contrato.cliente_id && (
                    <button
                      onClick={() => navigate(`/pessoas/clientes/${contrato.cliente_id}`)}
                      className="text-[#2B4580] hover:text-primary"
                    >
                      Cliente
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/contratos/${contrato.id}`)}
                    className="text-[#2B4580] hover:text-primary"
                  >
                    Contrato
                  </button>
                  <button
                    onClick={() => navigate(`/financeiro/cobrancas`)}
                    className="text-[#2B4580] hover:text-primary"
                  >
                    Cobranças
                  </button>
                  <button
                    onClick={() => navigate(`/cronograma/projects`)}
                    className="text-[#2B4580] hover:text-primary"
                  >
                    Cronograma
                  </button>
                </div>

                {/* Ações */}
                <button
                  onClick={() => handleCriarProjeto(contrato.id)}
                  disabled={criandoProjeto === contrato.id}
                  className="w-full text-lg bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {criandoProjeto === contrato.id ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Criando...
                    </span>
                  ) : (
                    "Criar Cronograma"
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projetos Existentes */}
      {projetos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-medium text-[#2E2E2E]">
              Projetos em Andamento
            </h2>
            <span className="text-sm text-[#4C4C4C] bg-[#F3F3F3] px-3 py-1 rounded-full">
              {projetos.length} projeto{projetos.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {projetos.map((projeto) => (
              <div
                key={projeto.id}
                className="bg-white border border-[#E5E5E5] rounded-xl shadow-sm hover:shadow-md transition-all p-6 cursor-pointer"
                onClick={() => navigate(`/cronograma/projeto/${projeto.id}/timeline`)}
              >
                {/* Cabeçalho */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-normal text-lg"
                      style={{
                        background: getUnidadeNegocioColor(projeto.unidade_negocio as any),
                      }}
                    >
                      {projeto.contrato_numero?.substring(0, 2) || "PR"}
                    </div>
                    <div>
                      <h3 className="font-normal text-[#2E2E2E]">
                        {projeto.contrato_numero || projeto.titulo}
                      </h3>
                      <p className="text-xs text-[#4C4C4C]">
                        {projeto.tipo_projeto || "Projeto"}
                      </p>
                    </div>
                  </div>

                  <span
                    className="px-2 py-1 text-white text-xs rounded-full"
                    style={{
                      background:
                        projeto.status === "ativo"
                          ? "#3B82F6"
                          : projeto.status === "concluido"
                          ? "#10B981"
                          : "#9CA3AF",
                    }}
                  >
                    {projeto.status}
                  </span>
                </div>

                {/* Cliente */}
                <div className="mb-4">
                  <p className="text-sm text-[#4C4C4C] font-medium">
                    {projeto.cliente_nome || "Cliente nÍo informado"}
                  </p>
                </div>

                {/* Progresso */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-[#4C4C4C]">Progresso</span>
                    <span className="text-sm font-normal text-[#2E2E2E]">
                      {projeto.progresso_percentual}%
                    </span>
                  </div>
                  <div className="w-full bg-[#E5E5E5] rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${projeto.progresso_percentual}%` }}
                    />
                  </div>
                </div>

                {/* Estatísticas */}
                <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-[#E5E5E5]">
                  <div>
                    <p className="text-xs text-[#4C4C4C]">Total</p>
                    <p className="text-sm font-normal text-[#2E2E2E]">
                      {projeto.total_tarefas}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#4C4C4C]">Concluídas</p>
                    <p className="text-sm font-normal text-[#10B981]">
                      {projeto.tarefas_concluidas}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#4C4C4C]">Pendentes</p>
                    <p className="text-sm font-normal text-[#F59E0B]">
                      {projeto.tarefas_pendentes}
                    </p>
                  </div>
                </div>

                {/* Valor */}
                <div className="mt-4 pt-3 border-t border-[#E5E5E5]">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#4C4C4C]">Valor Total</span>
                    <span className="text-sm font-normal text-[#2E2E2E]">
                      {formatarValor(projeto.valor_total || 0)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {projetos.length === 0 && contratos.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">😕</div>
          <h3 className="text-2xl font-medium text-[#2E2E2E] mb-2">
            Nenhum projeto encontrado
          </h3>
          <p className="text-[#4C4C4C]">
            Contratos ativos aparecerÍo aqui para criaçÍo de cronogramas.
          </p>
        </div>
      )}
    </div>
  );
}

