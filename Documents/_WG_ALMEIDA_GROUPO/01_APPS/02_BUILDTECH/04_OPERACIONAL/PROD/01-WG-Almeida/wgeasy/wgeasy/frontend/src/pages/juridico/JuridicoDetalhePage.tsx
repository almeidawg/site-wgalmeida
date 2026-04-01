import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  Calendar,
  DollarSign,
  FileText,
} from "lucide-react";
import { useSwipe } from "@/hooks/useSwipe";
import {
  obterAssistencia,
  obterHistoricoAssistencia,
  deletarAssistencia,
  type AssistenciaJuridica,
} from "@/lib/juridicoApi";

interface HistoricoItem {
  id: string;
  tipo_movimentacao: string;
  descricao: string;
  usuario_nome: string | null;
  created_at: string;
}

export function JuridicoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { onTouchStart, onTouchEnd } = useSwipe({
    onSwipeLeft: () => navigate("/"),
    onSwipeRight: () => navigate("/juridico"),
  });

  const [assistencia, setAssistencia] = useState<AssistenciaJuridica | null>(
    null
  );
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        setError("ID nÍo fornecido");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [assistenciaData, historicoData] = await Promise.all([
          obterAssistencia(id),
          obterHistoricoAssistencia(id),
        ]);

        setAssistencia(assistenciaData);
        setHistorico(historicoData);
      } catch (err) {
        console.error("Erro ao carregar:", err);
        setError("Falha ao carregar os dados.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;

    try {
      setDeleting(true);
      await deletarAssistencia(id);
      navigate("/juridico");
    } catch (err) {
      console.error("Erro ao deletar:", err);
      setError("Falha ao deletar a assistência.");
      setDeleting(false);
    }
  };

  const statusColors = {
    PENDENTE: "bg-gray-100 text-gray-800",
    EM_ANALISE: "bg-blue-100 text-blue-800",
    EM_ANDAMENTO: "bg-cyan-100 text-cyan-800",
    RESOLVIDO: "bg-green-100 text-green-800",
    ARQUIVADO: "bg-slate-100 text-slate-800",
  };

  const priorityColors = {
    BAIXA: "bg-blue-100 text-blue-800",
    MEDIA: "bg-yellow-100 text-yellow-800",
    ALTA: "bg-orange-100 text-orange-800",
    URGENTE: "bg-red-100 text-red-800",
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

  if (!assistencia) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <button
          onClick={() => navigate("/juridico")}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 font-medium"
        >
          <ArrowLeft size={20} />
          Voltar
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-600" size={20} />
          <p className="text-red-800">Assistência nÍo encontrada.</p>
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
      <div className="max-w-4xl mx-auto">
        {/* Header com navegaçÍo */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <button
            onClick={() => navigate("/juridico")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium w-fit"
          >
            <ArrowLeft size={20} />
            Voltar
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/juridico/${id}/editar`)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
            >
              <Edit2 size={18} />
              Editar
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <Trash2 size={18} />
              Deletar
            </button>
          </div>
        </div>

        {/* Erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 mb-6">
            <AlertCircle className="text-red-600" size={20} />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Título e Status */}
        <div className="bg-white rounded-lg shadow p-6 md:p-8 mb-6">
          <h1 className="text-[18px] sm:text-[24px] font-normal text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">⚖️</span>
            {assistencia.titulo}
          </h1>

          <div className="flex flex-wrap gap-3 mb-4">
            <span
              className={`inline-block px-4 py-2 rounded-full text-sm font-normal ${
                statusColors[assistencia.status]
              }`}
            >
              {assistencia.status.replace(/_/g, " ")}
            </span>
            <span
              className={`inline-block px-4 py-2 rounded-full text-sm font-normal ${
                priorityColors[assistencia.prioridade]
              }`}
            >
              {assistencia.prioridade}
            </span>
            <span className="inline-block px-4 py-2 rounded-full text-sm font-normal bg-purple-100 text-purple-800">
              {assistencia.tipo_processo.replace(/_/g, " ")}
            </span>
          </div>

          <p className="text-gray-600">{assistencia.descricao}</p>
        </div>

        {/* Informações Principais */}
        <div className="bg-white rounded-lg shadow p-6 md:p-8 mb-6">
          <h2 className="text-[20px] font-normal text-gray-900 mb-4">
            Informações do Processo
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Solicitante
              </label>
              <p className="text-gray-900">{assistencia.tipo_solicitante}</p>
            </div>

            {assistencia.numero_processo && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número do Processo
                </label>
                <p className="text-gray-900">{assistencia.numero_processo}</p>
              </div>
            )}

            {assistencia.vara && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vara
                </label>
                <p className="text-gray-900">{assistencia.vara}</p>
              </div>
            )}

            {assistencia.comarca && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comarca
                </label>
                <p className="text-gray-900">{assistencia.comarca}</p>
              </div>
            )}

            {assistencia.advogado_responsavel && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Advogado Responsável
                </label>
                <p className="text-gray-900">
                  {assistencia.advogado_responsavel}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-gray-600" />
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Data de Abertura
                </label>
                <p className="text-gray-900">
                  {new Date(assistencia.data_abertura).toLocaleDateString(
                    "pt-BR"
                  )}
                </p>
              </div>
            </div>

            {assistencia.data_audiencia && (
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-gray-600" />
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Data da Audiência
                  </label>
                  <p className="text-gray-900">
                    {new Date(assistencia.data_audiencia).toLocaleDateString(
                      "pt-BR"
                    )}
                  </p>
                </div>
              </div>
            )}

            {assistencia.data_encerramento && (
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-gray-600" />
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Data de Encerramento
                  </label>
                  <p className="text-gray-900">
                    {new Date(assistencia.data_encerramento).toLocaleDateString(
                      "pt-BR"
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Informações Financeiras */}
        {(assistencia.valor_causa || assistencia.valor_acordo) && (
          <div className="bg-white rounded-lg shadow p-6 md:p-8 mb-6">
            <h2 className="text-[20px] font-normal text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign size={24} className="text-green-600" />
              Informações Financeiras
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {assistencia.valor_causa && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor da Causa
                  </label>
                  <p className="text-[20px] font-normal text-gray-900">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(assistencia.valor_causa)}
                  </p>
                </div>
              )}

              {assistencia.valor_acordo && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor do Acordo
                  </label>
                  <p className="text-[20px] font-normal text-green-600">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(assistencia.valor_acordo)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Observações */}
        {assistencia.observacoes && (
          <div className="bg-white rounded-lg shadow p-6 md:p-8 mb-6">
            <h2 className="text-[20px] font-normal text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={24} className="text-blue-600" />
              Observações
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {assistencia.observacoes}
            </p>
          </div>
        )}

        {/* Histórico */}
        {historico.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 md:p-8">
            <h2 className="text-[20px] font-normal text-gray-900 mb-4">
              Histórico de Movimentações
            </h2>

            <div className="space-y-3">
              {historico.map((item) => (
                <div
                  key={item.id}
                  className="border-l-4 border-blue-500 pl-4 py-2"
                >
                  <p className="font-medium text-gray-900">
                    {item.tipo_movimentacao}
                  </p>
                  <p className="text-gray-700 text-sm">{item.descricao}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {item.usuario_nome && `Por: ${item.usuario_nome} • `}
                    {new Date(item.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal de ConfirmaçÍo de ExclusÍo */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm">
              <h3 className="text-[20px] font-normal text-gray-900 mb-2">
                Confirmar ExclusÍo
              </h3>
              <p className="text-[14px] text-gray-600 mb-6">
                Tem certeza que deseja deletar esta assistência jurídica? Esta
                açÍo nÍo pode ser desfeita.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-300 text-[14px] text-gray-900 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-[14px] text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  {deleting ? "Deletando..." : "Deletar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

