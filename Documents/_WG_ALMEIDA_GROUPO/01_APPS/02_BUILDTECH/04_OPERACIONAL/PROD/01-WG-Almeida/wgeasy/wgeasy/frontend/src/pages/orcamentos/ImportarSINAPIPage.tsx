/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// PÁGINA DE IMPORTAÇÍO SINAPI
// WG Easy - Grupo WG Almeida
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Database, Upload, Download, Search, FileSpreadsheet,
  Calendar, MapPin, CheckCircle, AlertTriangle, Clock,
  ExternalLink, Filter, RefreshCw, Info, History, X
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import {
  sinapiService,
  EstadoBrasil,
  ItemSINAPI,
  SINAPI_CODIGOS_REFORMA,
  formatarCodigoSINAPI,
  getURLPlanilhaSINAPI,
} from '../../lib/sinapiIntegracaoService';
import { formatarMoedaBRL } from '../../lib/precificacaoAutomatizada';
import SinapiImporter, {
  gerarTemplateExcel,
  obterHistoricoImportacoes,
} from '../../lib/sinapiImportScript';
import { useUsuarioLogado } from '../../hooks/useUsuarioLogado';

const ESTADOS_BRASIL: { sigla: EstadoBrasil; nome: string }[] = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'MaranhÍo' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'SP', nome: 'SÍo Paulo' },
  { sigla: 'TO', nome: 'Tocantins' },
];

interface StatusAtualizacao {
  estado: EstadoBrasil;
  ultimaAtualizacao: string | null;
  diasDesdeAtualizacao: number;
  precisaAtualizar: boolean;
}

interface HistoricoItem {
  id: string;
  estado: string;
  mes_referencia: string;
  tipo_tabela: string;
  arquivo_origem: string;
  total_insumos: number;
  total_composicoes: number;
  status: string;
  created_at: string;
}

export default function ImportarSINAPIPage() {
  const { showToast } = useToast();
  const { usuario } = useUsuarioLogado();
  const [loading, setLoading] = useState(false);
  const [importando, setImportando] = useState(false);
  const [estadoSelecionado, setEstadoSelecionado] = useState<EstadoBrasil>('SP');
  const [tipoImportacao, setTipoImportacao] = useState<'insumos' | 'composicoes'>('insumos');
  const [desoneracao, setDesoneracao] = useState<'desonerado' | 'nao_desonerado'>('nao_desonerado');
  const [mesReferencia, setMesReferencia] = useState(() => {
    const hoje = new Date();
    hoje.setMonth(hoje.getMonth() - 1); // Mês anterior
    return hoje.toISOString().slice(0, 7);
  });
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [statusAtualizacoes, setStatusAtualizacoes] = useState<StatusAtualizacao[]>([]);
  const [progressoImportacao, setProgressoImportacao] = useState<string | null>(null);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);

  // Busca
  const [termoBusca, setTermoBusca] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState<ItemSINAPI[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [totalResultados, setTotalResultados] = useState(0);
  const [pagina, setPagina] = useState(1);

  // Carregar status de atualizações
  useEffect(() => {
    async function carregarStatus() {
      const statusList: StatusAtualizacao[] = [];
      for (const estado of ['SP', 'RJ', 'MG', 'PR', 'RS', 'BA'] as EstadoBrasil[]) {
        const status = await sinapiService.verificarNecessidadeAtualizacao(estado);
        statusList.push({
          estado,
          ultimaAtualizacao: status.ultimaAtualizacao,
          diasDesdeAtualizacao: status.diasDesdeAtualizacao,
          precisaAtualizar: status.precisaAtualizar,
        });
      }
      setStatusAtualizacoes(statusList);
    }
    carregarStatus();
  }, []);

  // Buscar itens SINAPI
  const buscarItens = useCallback(async (novaPagina = 1) => {
    if (!termoBusca.trim()) {
      setResultadosBusca([]);
      return;
    }

    try {
      setBuscando(true);
      const resultado = await sinapiService.buscarItens({
        termo: termoBusca,
        estado: estadoSelecionado,
        pagina: novaPagina,
        por_pagina: 20,
      });

      setResultadosBusca(resultado.itens);
      setTotalResultados(resultado.total);
      setPagina(novaPagina);
    } catch (error) {
      console.error('Erro na busca:', error);
      showToast('Erro ao buscar itens SINAPI', 'error');
    } finally {
      setBuscando(false);
    }
  }, [termoBusca, estadoSelecionado, showToast]);

  // Carregar histórico de importações
  const carregarHistorico = useCallback(async () => {
    if (!usuario?.empresa_id) return;
    const dados = await obterHistoricoImportacoes(usuario.empresa_id);
    setHistorico(dados);
  }, [usuario?.empresa_id]);

  useEffect(() => {
    if (mostrarHistorico && usuario?.empresa_id) {
      carregarHistorico();
    }
  }, [mostrarHistorico, usuario?.empresa_id, carregarHistorico]);

  // Baixar template Excel
  const baixarTemplate = async () => {
    const blob = await gerarTemplateExcel();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_sinapi.xlsx';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Template baixado com sucesso', 'success');
  };

  // Importar arquivo usando o novo script
  const importarArquivo = async () => {
    if (!arquivo) {
      showToast('Selecione um arquivo para importar', 'error');
      return;
    }

    if (!usuario?.empresa_id) {
      showToast('Usuário nÍo identificado', 'error');
      return;
    }

    try {
      setImportando(true);
      setProgressoImportacao('Iniciando importaçÍo...');

      const importer = new SinapiImporter(
        usuario.empresa_id,
        estadoSelecionado,
        mesReferencia,
        desoneracao === 'desonerado'
      );

      setProgressoImportacao('Processando arquivo Excel...');
      const resultado = await importer.importarExcel(arquivo);

      if (resultado.sucesso) {
        const tempo = (resultado.tempoProcessamento / 1000).toFixed(1);
        showToast(
          `ImportaçÍo concluída em ${tempo}s: ${resultado.insumosImportados} insumos, ${resultado.composicoesImportadas} composições`,
          'success'
        );
        setArquivo(null);

        // Recarregar status
        const statusList: StatusAtualizacao[] = [];
        for (const estado of ['SP', 'RJ', 'MG', 'PR', 'RS', 'BA'] as EstadoBrasil[]) {
          const status = await sinapiService.verificarNecessidadeAtualizacao(estado);
          statusList.push({
            estado,
            ultimaAtualizacao: status.ultimaAtualizacao,
            diasDesdeAtualizacao: status.diasDesdeAtualizacao,
            precisaAtualizar: status.precisaAtualizar,
          });
        }
        setStatusAtualizacoes(statusList);
      } else {
        showToast(`ImportaçÍo com erros: ${resultado.erros.slice(0, 2).join(', ')}`, 'error');
      }

      if (resultado.avisos.length > 0) {
        console.warn('Avisos da importaçÍo:', resultado.avisos);
      }
    } catch (error) {
      console.error('Erro na importaçÍo:', error);
      showToast('Erro ao importar arquivo', 'error');
    } finally {
      setImportando(false);
      setProgressoImportacao(null);
    }
  };

  // Gerar URL de download
  const gerarURLDownload = () => {
    const url = getURLPlanilhaSINAPI(estadoSelecionado, mesReferencia, tipoImportacao, desoneracao);
    window.open(url, '_blank');
  };

  // Renderizar card de código SINAPI frequente
  const renderCodigoFrequente = (categoria: string, codigos: Record<string, string>) => (
    <div key={categoria} className="bg-white rounded-lg border p-4">
      <h4 className="font-medium text-gray-800 mb-3 capitalize">{categoria.replace(/_/g, ' ')}</h4>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {Object.entries(codigos).slice(0, 6).map(([nome, codigo]) => (
          <div key={codigo} className="flex items-center gap-2">
            <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{codigo}</span>
            <span className="text-gray-600 truncate capitalize">{nome.replace(/_/g, ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[18px] sm:text-[24px] font-normal text-gray-800 flex items-center gap-2">
            <Database className="text-blue-600" />
            IntegraçÍo SINAPI
          </h1>
          <p className="text-[12px] text-gray-500 mt-1">
            Sistema Nacional de Pesquisa de Custos e ÍÍndices da ConstruçÍo Civil
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMostrarHistorico(true)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition border"
          >
            <History size={18} />
            <span className="text-[14px]">Histórico</span>
          </button>
          <a
            href="https://www.caixa.gov.br/poder-publico/modernizacao-gestao/sinapi/Paginas/default.aspx"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
          >
            <ExternalLink size={18} />
            <span className="text-[14px]">Site da Caixa</span>
          </a>
        </div>
      </div>

      {/* Status de Atualizações */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-6 border border-gray-200">
        <h3 className="text-[16px] font-normal text-gray-700 mb-3 flex items-center gap-2">
          <Clock size={18} />
          Status das Atualizações
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {statusAtualizacoes.map(status => (
            <div
              key={status.estado}
              className={`p-3 rounded-lg border ${
                status.precisaAtualizar
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-green-50 border-green-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-normal text-gray-800">{status.estado}</span>
                {status.precisaAtualizar ? (
                  <AlertTriangle size={16} className="text-amber-500" />
                ) : (
                  <CheckCircle size={16} className="text-green-500" />
                )}
              </div>
              <p className="text-xs text-gray-600">
                {status.ultimaAtualizacao
                  ? `${status.diasDesdeAtualizacao} dias atrás`
                  : 'Nunca atualizado'}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel de ImportaçÍo */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4">
            <h2 className="text-[16px] font-normal text-white flex items-center gap-2">
              <Upload size={20} />
              Importar Dados SINAPI
            </h2>
          </div>

          <div className="p-3 sm:p-6 space-y-4">
            {/* Estado */}
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Estado</label>
              <select
                value={estadoSelecionado}
                onChange={(e) => setEstadoSelecionado(e.target.value as EstadoBrasil)}
                className="w-full p-2 border rounded border-gray-300 focus:border-blue-500 text-[14px]"
              >
                {ESTADOS_BRASIL.map(estado => (
                  <option key={estado.sigla} value={estado.sigla}>
                    {estado.sigla} - {estado.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Mês de Referência */}
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Mês de Referência</label>
              <input
                type="month"
                value={mesReferencia}
                onChange={(e) => setMesReferencia(e.target.value)}
                className="w-full p-2 border rounded border-gray-300 focus:border-blue-500 text-[14px]"
              />
            </div>

            {/* Tipo de ImportaçÍo */}
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Tipo de Dados</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tipo"
                    value="insumos"
                    checked={tipoImportacao === 'insumos'}
                    onChange={() => setTipoImportacao('insumos')}
                    className="text-blue-600"
                  />
                  <span className="text-[14px]">Insumos</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tipo"
                    value="composicoes"
                    checked={tipoImportacao === 'composicoes'}
                    onChange={() => setTipoImportacao('composicoes')}
                    className="text-blue-600"
                  />
                  <span className="text-[14px]">Composições</span>
                </label>
              </div>
            </div>

            {/* DesoneraçÍo */}
            <div>
              <label className="text-sm text-gray-600 mb-1 block">DesoneraçÍo</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="desoneracao"
                    value="nao_desonerado"
                    checked={desoneracao === 'nao_desonerado'}
                    onChange={() => setDesoneracao('nao_desonerado')}
                    className="text-blue-600"
                  />
                  <span className="text-[14px]">NÍo Desonerado</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="desoneracao"
                    value="desonerado"
                    checked={desoneracao === 'desonerado'}
                    onChange={() => setDesoneracao('desonerado')}
                    className="text-blue-600"
                  />
                  <span className="text-[14px]">Desonerado</span>
                </label>
              </div>
            </div>

            {/* Download da Planilha */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info size={16} className="text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Baixe a planilha oficial da Caixa ou nosso template:</p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={gerarURLDownload}
                      className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded hover:bg-primary-dark transition text-xs"
                    >
                      <Download size={14} />
                      Planilha SINAPI
                    </button>
                    <button
                      onClick={baixarTemplate}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 transition text-xs"
                    >
                      <FileSpreadsheet size={14} />
                      Template Excel
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Upload de Arquivo */}
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Arquivo Excel (.xlsx)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setArquivo(e.target.files?.[0] || null)}
                  className="hidden"
                  id="arquivo-sinapi"
                />
                <label htmlFor="arquivo-sinapi" className="cursor-pointer">
                  <FileSpreadsheet size={40} className="mx-auto text-gray-400 mb-2" />
                  {arquivo ? (
                    <p className="text-sm text-green-600 font-medium">{arquivo.name}</p>
                  ) : (
                    <p className="text-sm text-gray-500">Clique ou arraste o arquivo aqui</p>
                  )}
                </label>
              </div>
            </div>

            {/* Progresso da ImportaçÍo */}
            {progressoImportacao && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-indigo-700">
                  <RefreshCw size={16} className="animate-spin" />
                  <span className="text-sm font-medium">{progressoImportacao}</span>
                </div>
              </div>
            )}

            {/* BotÍo de Importar */}
            <button
              onClick={importarArquivo}
              disabled={!arquivo || importando}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {importando ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Importar Dados
                </>
              )}
            </button>
          </div>
        </div>

        {/* Painel de Busca */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4">
            <h2 className="text-[16px] font-normal text-white flex items-center gap-2">
              <Search size={20} />
              Consultar Base SINAPI
            </h2>
          </div>

          <div className="p-6">
            {/* Campo de Busca */}
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por código ou descriçÍo..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && buscarItens()}
                  className="w-full pl-10 p-2 border rounded border-gray-300 focus:border-green-500 text-lg"
                />
              </div>
              <button
                onClick={() => buscarItens()}
                disabled={buscando}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 transition"
              >
                {buscando ? <RefreshCw size={18} className="animate-spin" /> : 'Buscar'}
              </button>
            </div>

            {/* Resultados */}
            {totalResultados > 0 && (
              <p className="text-sm text-gray-500 mb-3">
                {totalResultados} resultado(s) encontrado(s)
              </p>
            )}

            <div className="max-h-80 overflow-y-auto space-y-2">
              {resultadosBusca.length === 0 && termoBusca && !buscando ? (
                <div className="text-center py-8 text-gray-500">
                  <Database size={40} className="mx-auto text-gray-300 mb-2" />
                  <p>Nenhum item encontrado</p>
                  <p className="text-xs mt-1">Verifique se a base SINAPI foi importada</p>
                </div>
              ) : (
                resultadosBusca.map(item => (
                  <div
                    key={`${item.codigo}-${item.estado}`}
                    className="p-3 border rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            {formatarCodigoSINAPI(item.codigo)}
                          </span>
                          <span className="text-xs text-gray-500">{item.unidade}</span>
                        </div>
                        <p className="text-sm text-gray-800 line-clamp-2">{item.descricao}</p>
                      </div>
                      <div className="text-right ml-3">
                        <p className="font-normal text-green-600">
                          {formatarMoedaBRL(item.preco_mediano)}
                        </p>
                        <p className="text-xs text-gray-500">{item.data_referencia}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* PaginaçÍo */}
            {totalResultados > 20 && (
              <div className="flex justify-center gap-2 mt-4">
                <button
                  onClick={() => buscarItens(pagina - 1)}
                  disabled={pagina === 1 || buscando}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="px-3 py-1 text-sm">
                  Página {pagina} de {Math.ceil(totalResultados / 20)}
                </span>
                <button
                  onClick={() => buscarItens(pagina + 1)}
                  disabled={pagina >= Math.ceil(totalResultados / 20) || buscando}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Códigos Frequentes */}
      <div className="mt-6">
        <h3 className="text-[16px] font-normal text-gray-800 mb-4 flex items-center gap-2">
          <Filter size={20} className="text-blue-600" />
          Códigos SINAPI Frequentes em Reformas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(SINAPI_CODIGOS_REFORMA).slice(0, 6).map(([cat, codigos]) =>
            renderCodigoFrequente(cat, codigos)
          )}
        </div>
      </div>

      {/* SQL para criar tabelas */}
      <div className="mt-6 bg-gray-50 rounded-xl border p-4">
        <details>
          <summary className="cursor-pointer font-medium text-gray-700">
            SQL para criar tabelas (para administradores)
          </summary>
          <pre className="mt-4 p-4 bg-gray-900 text-green-400 rounded-lg text-xs overflow-x-auto">
            {sinapiService.gerarMigracaoSQL()}
          </pre>
        </details>
      </div>

      {/* Modal de Histórico */}
      {mostrarHistorico && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-gray-700 to-gray-800 p-4 flex items-center justify-between">
              <h2 className="text-[16px] font-normal text-white flex items-center gap-2">
                <History size={20} />
                Histórico de Importações
              </h2>
              <button
                onClick={() => setMostrarHistorico(false)}
                className="text-white/80 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {historico.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Database size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-[12px]">Nenhuma importaçÍo realizada ainda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historico.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-lg border ${
                        item.status === 'sucesso'
                          ? 'bg-green-50 border-green-200'
                          : item.status === 'parcial'
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {item.status === 'sucesso' ? (
                              <CheckCircle size={16} className="text-green-600" />
                            ) : item.status === 'parcial' ? (
                              <AlertTriangle size={16} className="text-amber-600" />
                            ) : (
                              <X size={16} className="text-red-600" />
                            )}
                            <span className="font-medium text-gray-800">
                              {item.estado} - {item.mes_referencia}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              item.tipo_tabela === 'desonerado'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {item.tipo_tabela === 'desonerado' ? 'Desonerado' : 'NÍo Desonerado'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            Arquivo: {item.arquivo_origem}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Insumos: {item.total_insumos}</span>
                            <span>Composições: {item.total_composicoes}</span>
                          </div>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          <p>{new Date(item.created_at).toLocaleDateString('pt-BR')}</p>
                          <p>{new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t p-4 flex justify-end">
              <button
                onClick={() => setMostrarHistorico(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-[14px]"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

