// Página pública para aceitar serviço via link
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Truck,
  MapPin,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useServicoAceite } from '../hooks/useServicoAceite';

export default function AceitarServicoPage() {
  const { token } = useParams<{ token: string }>();
  const {
    servico,
    loading,
    processando,
    error,
    aceito,
    mensagemAceite,
    carregarPorTokenServico,
    aceitar,
  } = useServicoAceite();

  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    if (token) {
      carregarPorTokenServico(token);
    }
  }, [token, carregarPorTokenServico]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const handleAceitar = async () => {
    if (!token) return;
    setConfirmando(true);
    await aceitar(token);
    setConfirmando(false);
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando serviço...</p>
        </div>
      </div>
    );
  }

  // Erro
  if (error && !servico) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-normal text-gray-900 mb-2">
            Link Indisponível
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">
            Se você acredita que isso é um erro, entre em contato com a empresa.
          </p>
        </motion.div>
      </div>
    );
  }

  // Aceito com sucesso
  if (aceito) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-xl font-normal text-gray-900 mb-2">
            Serviço Aceito!
          </h1>
          <p className="text-gray-600 mb-6">
            {mensagemAceite || 'Você aceitou o serviço com sucesso. Entraremos em contato em breve.'}
          </p>
          <div className="bg-green-50 rounded-lg p-4 text-left">
            <p className="text-sm text-green-800">
              <strong>Próximos passos:</strong>
            </p>
            <ul className="text-sm text-green-700 mt-2 space-y-1">
              <li>- Aguarde o contato da equipe</li>
              <li>- Verifique os detalhes do serviço</li>
              <li>- Execute conforme combinado</li>
            </ul>
          </div>
        </motion.div>
      </div>
    );
  }

  // Serviço disponível para aceite
  if (servico) {
    return (
      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Truck className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-normal text-gray-900">
              SolicitaçÍo de Serviço
            </h1>
            <p className="text-gray-600">{servico.numero}</p>
          </motion.div>

          {/* Card do Serviço */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden"
          >
            {/* Categoria */}
            {servico.categoria && (
              <div
                className="px-6 py-3"
                style={{ backgroundColor: (servico.categoria.cor || '#3B82F6') + '20' }}
              >
                <span
                  className="text-sm font-medium"
                  style={{ color: servico.categoria.cor || '#3B82F6' }}
                >
                  {servico.categoria.nome}
                </span>
              </div>
            )}

            <div className="p-6 space-y-6">
              {/* Título e DescriçÍo */}
              <div>
                <h2 className="text-lg font-normal text-gray-900 mb-2">
                  {servico.titulo}
                </h2>
                {servico.descricao && (
                  <p className="text-gray-600 text-sm">{servico.descricao}</p>
                )}
              </div>

              {/* Endereços */}
              <div className="space-y-4">
                {servico.coletar_endereco_completo && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-gray-500" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium">
                        Coletar em
                      </p>
                      <p className="text-sm text-gray-900">
                        {servico.coletar_endereco_completo}
                      </p>
                      {servico.coletar_referencia && (
                        <p className="text-xs text-gray-500 mt-1">
                          Ref: {servico.coletar_referencia}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {servico.entregar_endereco_completo && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-green-600" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium">
                        Entregar em
                      </p>
                      <p className="text-sm text-gray-900">
                        {servico.entregar_endereco_completo}
                      </p>
                      {servico.entregar_referencia && (
                        <p className="text-xs text-gray-500 mt-1">
                          Ref: {servico.entregar_referencia}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Data e Valor */}
              <div className="grid grid-cols-2 gap-4">
                {servico.data_necessidade && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs uppercase font-medium">Data</span>
                    </div>
                    <p className="text-sm font-normal text-gray-900">
                      {formatDate(servico.data_necessidade)}
                    </p>
                  </div>
                )}

                <div className="bg-green-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-600 mb-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-xs uppercase font-medium">Valor</span>
                  </div>
                  <p className="text-lg font-normal text-green-600">
                    {formatCurrency(servico.valor_servico)}
                  </p>
                </div>
              </div>

              {/* Erro */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <p className="text-sm text-amber-800">{error}</p>
                </div>
              )}

              {/* BotÍo Aceitar */}
              {!error && (
                <button
                  onClick={handleAceitar}
                  disabled={processando || confirmando}
                  className="w-full py-4 bg-green-600 text-white font-normal rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processando || confirmando ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      ACEITAR SERVIÇO
                    </>
                  )}
                </button>
              )}

              {/* Aviso */}
              <p className="text-xs text-center text-gray-500">
                Ao aceitar, você confirma que pode realizar este serviço.
                <br />
                O primeiro a aceitar garante o serviço.
              </p>
            </div>
          </motion.div>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-xs text-gray-500">
              Grupo WG Almeida
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

