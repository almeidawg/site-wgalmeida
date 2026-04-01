/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { useSwipe } from "@/hooks/useSwipe";
import { useUsuarioLogado } from "@/hooks/useUsuarioLogado";
import {
  obterAssistencia,
  criarAssistencia,
  atualizarAssistencia,
  type AssistenciaJuridica,
  type TipoSolicitante,
  type TipoProcesso,
  type StatusAssistencia,
  type Prioridade,
} from "@/lib/juridicoApi";

interface FormData {
  tipo_solicitante: TipoSolicitante;
  tipo_processo: TipoProcesso;
  titulo: string;
  descricao: string;
  status: StatusAssistencia;
  prioridade: Prioridade;
  numero_processo: string;
  vara: string;
  comarca: string;
  advogado_responsavel: string;
  valor_causa: string;
  valor_acordo: string;
  data_abertura: string;
  data_audiencia: string;
  data_encerramento: string;
  observacoes: string;
}

const initialFormData: FormData = {
  tipo_solicitante: "CLIENTE",
  tipo_processo: "TRABALHISTA",
  titulo: "",
  descricao: "",
  status: "PENDENTE",
  prioridade: "MEDIA",
  numero_processo: "",
  vara: "",
  comarca: "",
  advogado_responsavel: "",
  valor_causa: "",
  valor_acordo: "",
  data_abertura: new Date().toISOString().split("T")[0],
  data_audiencia: "",
  data_encerramento: "",
  observacoes: "",
};

export function JuridicoFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id && id !== "novo";
  const { usuario } = useUsuarioLogado();

  const { onTouchStart, onTouchEnd } = useSwipe({
    onSwipeLeft: () => navigate("/"),
    onSwipeRight: () => navigate(-1),
  });

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!isEditMode) return;

      try {
        setLoading(true);
        setError(null);
        const assistencia = await obterAssistencia(id!);

        setFormData({
          tipo_solicitante: assistencia.tipo_solicitante,
          tipo_processo: assistencia.tipo_processo,
          titulo: assistencia.titulo,
          descricao: assistencia.descricao || "",
          status: assistencia.status,
          prioridade: assistencia.prioridade,
          numero_processo: assistencia.numero_processo || "",
          vara: assistencia.vara || "",
          comarca: assistencia.comarca || "",
          advogado_responsavel: assistencia.advogado_responsavel || "",
          valor_causa: assistencia.valor_causa?.toString() || "",
          valor_acordo: assistencia.valor_acordo?.toString() || "",
          data_abertura: assistencia.data_abertura,
          data_audiencia: assistencia.data_audiencia || "",
          data_encerramento: assistencia.data_encerramento || "",
          observacoes: assistencia.observacoes || "",
        });
      } catch (err) {
        console.error("Erro ao carregar:", err);
        setError("Falha ao carregar os dados da assistência.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, isEditMode]);

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titulo.trim()) {
      setError("Título é obrigatório");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const submitData = {
        ...formData,
        descricao: formData.descricao || null,
        numero_processo: formData.numero_processo || null,
        vara: formData.vara || null,
        comarca: formData.comarca || null,
        advogado_responsavel: formData.advogado_responsavel || null,
        valor_causa: formData.valor_causa
          ? parseFloat(formData.valor_causa)
          : 0,
        valor_acordo: formData.valor_acordo
          ? parseFloat(formData.valor_acordo)
          : null,
        data_audiencia: formData.data_audiencia || null,
        data_encerramento: formData.data_encerramento || null,
        observacoes: formData.observacoes || null,
        solicitante_id: usuario?.id ?? "00000000-0000-0000-0000-000000000000",
      };

      if (isEditMode) {
        await atualizarAssistencia(id!, submitData);
      } else {
        await criarAssistencia(submitData as any);
      }

      navigate("/juridico");
    } catch (err) {
      console.error("Erro ao salvar:", err);
      setError("Falha ao salvar a assistência.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2
            className="animate-spin text-blue-600 mb-3 mx-auto"
            size={32}
          />
          <p className="text-gray-600">Carregando assistência...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="min-h-screen bg-gray-50 p-4 md:p-8"
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/juridico")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            <ArrowLeft size={20} />
            Voltar
          </button>
          <h1 className="text-[18px] sm:text-[24px] font-normal text-gray-900 flex items-center gap-2">
            <span className="text-xl">⚖️</span>
            {isEditMode ? "Editar Assistência" : "Nova Assistência Jurídica"}
          </h1>
        </div>

        {/* Erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 mb-6">
            <AlertCircle className="text-red-600" size={20} />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Formulário */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow p-6 md:p-8 space-y-6"
        >
          {/* SeçÍo 1: Informações Básicas */}
          <div>
            <h2 className="text-[20px] font-normal text-gray-900 mb-4">
              Informações Básicas
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Solicitante *
                  </label>
                  <select
                    value={formData.tipo_solicitante}
                    onChange={(e) =>
                      handleChange("tipo_solicitante", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="CLIENTE">Cliente</option>
                    <option value="COLABORADOR">Colaborador</option>
                    <option value="FORNECEDOR">Fornecedor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Processo *
                  </label>
                  <select
                    value={formData.tipo_processo}
                    onChange={(e) =>
                      handleChange("tipo_processo", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="TRABALHISTA">Trabalhista</option>
                    <option value="CLIENTE_CONTRA_EMPRESA">
                      Cliente Contra Empresa
                    </option>
                    <option value="EMPRESA_CONTRA_CLIENTE">
                      Empresa Contra Cliente
                    </option>
                    <option value="INTERMEDIACAO">IntermediaçÍo</option>
                    <option value="OUTRO">Outro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => handleChange("titulo", e.target.value)}
                  placeholder="Título da assistência jurídica"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DescriçÍo
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => handleChange("descricao", e.target.value)}
                  placeholder="DescriçÍo detalhada do caso"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* SeçÍo 2: Status e Prioridade */}
          <div>
            <h2 className="text-[20px] font-normal text-gray-900 mb-4">
              Status e Prioridade
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="PENDENTE">Pendente</option>
                  <option value="EM_ANALISE">Em Análise</option>
                  <option value="EM_ANDAMENTO">Em Andamento</option>
                  <option value="RESOLVIDO">Resolvido</option>
                  <option value="ARQUIVADO">Arquivado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridade
                </label>
                <select
                  value={formData.prioridade}
                  onChange={(e) => handleChange("prioridade", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="BAIXA">Baixa</option>
                  <option value="MEDIA">Média</option>
                  <option value="ALTA">Alta</option>
                  <option value="URGENTE">Urgente</option>
                </select>
              </div>
            </div>
          </div>

          {/* SeçÍo 3: Dados do Processo */}
          <div>
            <h2 className="text-[20px] font-normal text-gray-900 mb-4">
              Dados do Processo Judicial
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número do Processo
                  </label>
                  <input
                    type="text"
                    value={formData.numero_processo}
                    onChange={(e) =>
                      handleChange("numero_processo", e.target.value)
                    }
                    placeholder="Ex: 0012345-98.2023.8.01.3800"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vara
                  </label>
                  <input
                    type="text"
                    value={formData.vara}
                    onChange={(e) => handleChange("vara", e.target.value)}
                    placeholder="Ex: 2ª Vara Cível"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comarca
                  </label>
                  <input
                    type="text"
                    value={formData.comarca}
                    onChange={(e) => handleChange("comarca", e.target.value)}
                    placeholder="Ex: SÍo Paulo"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Advogado Responsável
                  </label>
                  <input
                    type="text"
                    value={formData.advogado_responsavel}
                    onChange={(e) =>
                      handleChange("advogado_responsavel", e.target.value)
                    }
                    placeholder="Nome do advogado"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SeçÍo 4: Valores */}
          <div>
            <h2 className="text-[20px] font-normal text-gray-900 mb-4">
              Valores Envolvidos
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor da Causa (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.valor_causa}
                  onChange={(e) => handleChange("valor_causa", e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor do Acordo (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.valor_acordo}
                  onChange={(e) => handleChange("valor_acordo", e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* SeçÍo 5: Datas Importantes */}
          <div>
            <h2 className="text-[20px] font-normal text-gray-900 mb-4">
              Datas Importantes
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Abertura
                </label>
                <input
                  type="date"
                  value={formData.data_abertura}
                  onChange={(e) =>
                    handleChange("data_abertura", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data da Audiência
                </label>
                <input
                  type="date"
                  value={formData.data_audiencia}
                  onChange={(e) =>
                    handleChange("data_audiencia", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Encerramento
                </label>
                <input
                  type="date"
                  value={formData.data_encerramento}
                  onChange={(e) =>
                    handleChange("data_encerramento", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* SeçÍo 6: Observações */}
          <div>
            <h2 className="text-[20px] font-normal text-gray-900 mb-4">
              Observações
            </h2>

            <textarea
              value={formData.observacoes}
              onChange={(e) => handleChange("observacoes", e.target.value)}
              placeholder="Observações e informações adicionais"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Botões de AçÍo */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate("/juridico")}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition text-[14px] font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition text-[14px] font-medium disabled:opacity-50"
            >
              {submitting ? "Salvando..." : isEditMode ? "Atualizar" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

