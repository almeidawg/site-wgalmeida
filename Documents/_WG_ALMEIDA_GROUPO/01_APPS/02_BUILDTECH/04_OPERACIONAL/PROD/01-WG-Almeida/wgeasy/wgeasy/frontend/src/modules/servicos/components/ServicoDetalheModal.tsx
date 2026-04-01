/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// Modal de detalhes do serviço com ações
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Truck,
  MapPin,
  DollarSign,
  Calendar,
  User,
  Send,
  Play,
  CheckCircle,
  XCircle,
  MessageCircle,
  Copy,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { useServicos } from '../hooks/useServicos';
import { usePrestadores } from '../hooks/usePrestadores';
import {
  gerarMensagemWhatsApp,
  gerarLinkAceitePrestador,
  abrirWhatsApp,
  copiarParaClipboard,
} from '../services/whatsappService';
import type { SolicitacaoServico, StatusServico, Prestador } from '../types';
import { STATUS_SERVICO_CONFIG } from '../types';

interface ServicoDetalheModalProps {
  servico: SolicitacaoServico;
  onClose: () => void;
  onUpdate: () => void;
}

export function ServicoDetalheModal({ servico, onClose, onUpdate }: ServicoDetalheModalProps) {
  const { alterarStatus, marcarEnviado, loading } = useServicos();
  const { prestadores, carregarPorCategoria, selecionarPrestador, desselecionarPrestador, prestadoresSelecionados, convidar, limparSelecao } = usePrestadores();

  const [showPrestadores, setShowPrestadores] = useState(false);
  const [showCancelar, setShowCancelar] = useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const statusConfig = STATUS_SERVICO_CONFIG[servico.status];
  const proximosStatus = statusConfig.proximo || [];

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

  const formatDateTime = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('pt-BR');
  };

  const handleCarregarPrestadores = async () => {
    await carregarPorCategoria(servico.categoria_id);
    setShowPrestadores(true);
  };

  const handleEnviarWhatsApp = async (prestador: Prestador) => {
    // Primeiro, convidar o prestador se ainda não foi
    setEnviando(true);
    try {
      selecionarPrestador(prestador);
      const convites = await convidar(servico.id);
      const convite = convites.find(c => c.prestador_id === prestador.id);

      if (convite) {
        const linkAceite = gerarLinkAceitePrestador(convite.token);
        const mensagem = gerarMensagemWhatsApp(servico, linkAceite);
        abrirWhatsApp(mensagem, prestador.telefone);

        // Marcar como enviado se ainda estiver em "criado"
        if (servico.status === 'criado') {
          await marcarEnviado(servico.id);
        }

        onUpdate();
      }
    } catch (error) {
      console.error('Erro ao enviar:', error);
    } finally {
      setEnviando(false);
      limparSelecao();
    }
  };

  const handleCopiarLink = async () => {
    const linkAceite = `${window.location.origin}/servico/aceitar/${servico.token_aceite}`;
    const sucesso = await copiarParaClipboard(linkAceite);
    if (sucesso) {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  const handleAlterarStatus = async (novoStatus: StatusServico) => {
    if (novoStatus === 'cancelado') {
      setShowCancelar(true);
      return;
    }

    await alterarStatus(servico.id, novoStatus);
    onUpdate();
  };

  const handleCancelar = async () => {
    await alterarStatus(servico.id, 'cancelado', motivoCancelamento);
    onUpdate();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden m-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Truck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-normal text-gray-900">
                  {servico.numero}
                </h2>
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: statusConfig.corBg,
                    color: statusConfig.cor,
                  }}
                >
                  {statusConfig.label}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
            <div className="space-y-6">
              {/* Info Principal */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {servico.titulo}
                </h3>
                {servico.descricao && (
                  <p className="text-gray-600">{servico.descricao}</p>
                )}
                <div className="flex items-center gap-4 mt-3">
                  {servico.categoria && (
                    <span
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: (servico.categoria.cor || '#6B7280') + '20',
                        color: servico.categoria.cor || '#6B7280',
                      }}
                    >
                      {servico.categoria.nome}
                    </span>
                  )}
                  <span className="text-sm text-gray-500">
                    {servico.tipo_vinculo === 'avulso' ? 'Serviço Avulso' : `Projeto: ${servico.projeto?.numero || '-'}`}
                  </span>
                </div>
              </div>

              {/* Endereços */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    Coletar em
                  </div>
                  <p className="text-sm text-gray-600">
                    {servico.coletar_endereco_completo || 'não informado'}
                  </p>
                  {servico.coletar_referencia && (
                    <p className="text-xs text-gray-500 mt-1">
                      Ref: {servico.coletar_referencia}
                    </p>
                  )}
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 text-green-600" />
                    Entregar em
                  </div>
                  <p className="text-sm text-gray-600">
                    {servico.entregar_endereco_completo || 'não informado'}
                  </p>
                  {servico.entregar_referencia && (
                    <p className="text-xs text-gray-500 mt-1">
                      Ref: {servico.entregar_referencia}
                    </p>
                  )}
                </div>
              </div>

              {/* Valor e Datas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Valor</p>
                  <p className="text-lg font-normal text-green-600 flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {formatCurrency(servico.valor_servico)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Data Necessária</p>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {formatDate(servico.data_necessidade)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Criado em</p>
                  <p className="text-sm text-gray-600">
                    {formatDateTime(servico.criado_em)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Forma Pagamento</p>
                  <p className="text-sm text-gray-600">
                    {servico.forma_pagamento || '-'}
                  </p>
                </div>
              </div>

              {/* Prestador (se aceito) */}
              {servico.prestador && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 text-blue-600" />
                    Prestador
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {servico.prestador.nome}
                  </p>
                  {servico.prestador.telefone && (
                    <p className="text-xs text-gray-500">{servico.prestador.telefone}</p>
                  )}
                  {servico.data_aceite && (
                    <p className="text-xs text-gray-500 mt-1">
                      Aceito em: {formatDateTime(servico.data_aceite)}
                    </p>
                  )}
                </div>
              )}

              {/* Prestadores Convidados */}
              {servico.convidados && servico.convidados.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Prestadores Convidados ({servico.convidados.length})
                  </p>
                  <div className="space-y-2">
                    {servico.convidados.map((conv) => (
                      <div
                        key={conv.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {conv.prestador?.nome}
                          </p>
                          <p className="text-xs text-gray-500">
                            {conv.status === 'convidado' && 'Aguardando resposta'}
                            {conv.status === 'visualizado' && 'Visualizou o link'}
                            {conv.status === 'aceito' && 'Aceitou'}
                            {conv.status === 'recusado' && 'Recusou'}
                            {conv.status === 'expirado' && 'Expirado'}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            conv.status === 'aceito'
                              ? 'bg-green-100 text-green-700'
                              : conv.status === 'visualizado'
                              ? 'bg-blue-100 text-blue-700'
                              : conv.status === 'recusado' || conv.status === 'expirado'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {conv.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SeleçÍo de Prestadores */}
              {showPrestadores && servico.status === 'criado' && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Selecione prestadores para enviar via WhatsApp
                  </p>
                  {prestadores.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Nenhum prestador cadastrado para esta categoria.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {prestadores.map((prest) => (
                        <div
                          key={prest.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {prest.nome}
                            </p>
                            <p className="text-xs text-gray-500">
                              {prest.telefone || 'Sem telefone'}
                            </p>
                          </div>
                          <button
                            onClick={() => handleEnviarWhatsApp(prest)}
                            disabled={!prest.telefone || enviando}
                            className="flex items-center gap-1 px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <MessageCircle className="w-3 h-3" />
                            Enviar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Modal Cancelar */}
              {showCancelar && (
                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <p className="text-sm font-medium text-red-700 mb-2">
                    Motivo do cancelamento
                  </p>
                  <textarea
                    value={motivoCancelamento}
                    onChange={(e) => setMotivoCancelamento(e.target.value)}
                    rows={2}
                    placeholder="Informe o motivo..."
                    className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setShowCancelar(false)}
                      className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={handleCancelar}
                      disabled={loading}
                      className="px-3 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      Confirmar Cancelamento
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            {/* Link */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopiarLink}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Copy className="w-3 h-3" />
                {copiado ? 'Copiado!' : 'Copiar Link'}
              </button>
            </div>

            {/* Ações de Status */}
            <div className="flex items-center gap-2">
              {servico.status === 'criado' && (
                <button
                  onClick={handleCarregarPrestadores}
                  disabled={loading}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                  Enviar para Prestadores
                </button>
              )}

              {proximosStatus.includes('em_andamento') && (
                <button
                  onClick={() => handleAlterarStatus('em_andamento')}
                  disabled={loading}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
                >
                  <Play className="w-3 h-3" />
                  Iniciar ExecuçÍo
                </button>
              )}

              {proximosStatus.includes('concluido') && (
                <button
                  onClick={() => handleAlterarStatus('concluido')}
                  disabled={loading}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle className="w-3 h-3" />
                  Concluir
                </button>
              )}

              {proximosStatus.includes('cancelado') && !showCancelar && (
                <button
                  onClick={() => handleAlterarStatus('cancelado')}
                  disabled={loading}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  <XCircle className="w-3 h-3" />
                  Cancelar
                </button>
              )}

              <button
                onClick={onClose}
                className="px-4 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Fechar
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}


