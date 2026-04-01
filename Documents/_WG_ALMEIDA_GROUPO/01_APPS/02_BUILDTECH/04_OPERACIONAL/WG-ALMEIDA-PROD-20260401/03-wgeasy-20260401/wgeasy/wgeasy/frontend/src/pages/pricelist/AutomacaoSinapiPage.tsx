// ============================================================
// PÁGINA: AutomaçÍo SINAPI
// Integra produtividade, sincronizaçÍo de preços e cronograma
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  produtividadeService,
  formatarDuracaoDias,
  formatarEquipe,
  type DadosProdutividade,
} from '@/lib/sinapiProdutividadeService';
import {
  pricelistSinapiSyncService,
  obterEstatisticasCoberturaSINAPI,
  type ResultadoSincronizacao,
  type ConfiguracaoSync,
} from '@/lib/pricelistSinapiSyncService';
import {
  cronogramaService,
  getLabelFase,
  getCorFase,
  type ItemQuantitativo,
  type ResultadoCronograma,
  type ConfiguracaoCronograma,
} from '@/lib/cronogramaGeracaoService';
import type { EstadoBrasil } from '@/lib/sinapiIntegracaoService';

// ============================================================
// TIPOS
// ============================================================

type AbaAtiva = 'produtividade' | 'sincronizacao' | 'cronograma';

interface EstatisticasCobertura {
  totalPricelist: number;
  comCodigoSINAPI: number;
  semCodigoSINAPI: number;
  percentualCobertura: number;
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function AutomacaoSinapiPage() {
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('produtividade');

  return (
    <div className="p-3 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/pricelist')}
            className="text-sm text-gray-600 hover:text-gray-800 mb-1"
          >
            ← Voltar para Pricelist
          </button>
          <h1 className="text-2xl font-normal text-[#2E2E2E]">AutomaçÍo SINAPI</h1>
          <p className="text-sm text-gray-600 mt-1">
            Produtividade, sincronizaçÍo de preços e geraçÍo de cronograma
          </p>
        </div>
      </div>

      {/* Abas */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {[
            { id: 'produtividade', label: 'Produtividade', icon: '⏱️' },
            { id: 'sincronizacao', label: 'SincronizaçÍo de Preços', icon: '🔄' },
            { id: 'cronograma', label: 'Gerador de Cronograma', icon: '📅' },
          ].map((aba) => (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id as AbaAtiva)}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                abaAtiva === aba.id
                  ? 'border-[#F25C26] text-[#F25C26]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {aba.icon} {aba.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Conteúdo das Abas */}
      {abaAtiva === 'produtividade' && <AbaProdutividade />}
      {abaAtiva === 'sincronizacao' && <AbaSincronizacao />}
      {abaAtiva === 'cronograma' && <AbaCronograma />}
    </div>
  );
}

// ============================================================
// ABA: PRODUTIVIDADE
// ============================================================

function AbaProdutividade() {
  const [termoBusca, setTermoBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [resultados, setResultados] = useState<DadosProdutividade[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [itemSelecionado, setItemSelecionado] = useState<DadosProdutividade | null>(null);
  const [quantidade, setQuantidade] = useState<number>(100);
  const [complexidade, setComplexidade] = useState<'baixa' | 'media' | 'alta'>('media');

  useEffect(() => {
    setCategorias(produtividadeService.listarCategorias());
    setResultados(produtividadeService.obterTodos().slice(0, 20));
  }, []);

  const handleBuscar = useCallback(() => {
    let results: DadosProdutividade[];

    if (categoriaFiltro) {
      results = produtividadeService.buscarPorCategoria(categoriaFiltro);
    } else if (termoBusca) {
      results = produtividadeService.buscarPorServico(termoBusca);
    } else {
      results = produtividadeService.obterTodos();
    }

    setResultados(results.slice(0, 50));
  }, [termoBusca, categoriaFiltro]);

  useEffect(() => {
    handleBuscar();
  }, [handleBuscar]);

  const resultado = itemSelecionado
    ? produtividadeService.calcularPrazo(itemSelecionado, quantidade, { complexidade })
    : null;

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Lista de Serviços */}
      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-lg font-medium text-[#2E2E2E] mb-3">Base de Produtividade SINAPI</h3>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Buscar serviço..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Todas categorias</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="max-h-[500px] overflow-y-auto space-y-2">
            {resultados.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setItemSelecionado(item)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  itemSelecionado === item
                    ? 'border-[#F25C26] bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.servico}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.categoria} {item.subcategoria ? `› ${item.subcategoria}` : ''}
                    </p>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {item.unidade}
                  </span>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-gray-600">
                  <span>Min: {item.produtividade_minima} {item.unidade_produtividade}</span>
                  <span>Méd: {item.produtividade_media} {item.unidade_produtividade}</span>
                  <span>Máx: {item.produtividade_maxima} {item.unidade_produtividade}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calculadora */}
      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-lg font-medium text-[#2E2E2E] mb-3">Calculadora de Prazo</h3>

          {itemSelecionado ? (
            <div className="space-y-4">
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{itemSelecionado.servico}</p>
                <p className="text-xs text-gray-600 mt-1">
                  Equipe padrÍo: {formatarEquipe(itemSelecionado.equipe_padrao)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade ({itemSelecionado.unidade})
                  </label>
                  <input
                    type="number"
                    value={quantidade}
                    onChange={(e) => setQuantidade(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Complexidade
                  </label>
                  <select
                    value={complexidade}
                    onChange={(e) => setComplexidade(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="baixa">Baixa (paredes retas, sem recortes)</option>
                    <option value="media">Média (condições normais)</option>
                    <option value="alta">Alta (muitos recortes, difícil acesso)</option>
                  </select>
                </div>
              </div>

              {resultado && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-sm font-medium text-green-800 mb-2">Resultado do Cálculo</h4>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Prazo de ExecuçÍo:</span>
                      <p className="font-medium text-green-700">
                        {formatarDuracaoDias(resultado.dias_trabalho)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Tempo de Cura:</span>
                      <p className="font-medium text-green-700">
                        {resultado.tempo_cura_adicional_dias > 0
                          ? `${resultado.tempo_cura_adicional_dias} dia(s)`
                          : 'NÍo necessário'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Prazo Total:</span>
                      <p className="font-bold text-lg text-green-800">
                        {formatarDuracaoDias(resultado.prazo_total_dias)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Produtividade:</span>
                      <p className="font-medium text-green-700">
                        {resultado.produtividade_usada.toFixed(1)} {resultado.unidade_produtividade}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-green-200">
                    <span className="text-xs text-gray-600">Equipe necessária:</span>
                    <p className="text-sm font-medium text-green-700">
                      {formatarEquipe(resultado.equipe_necessaria)}
                    </p>
                  </div>

                  {resultado.observacoes.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <span className="text-xs text-gray-600">Observações:</span>
                      <ul className="mt-1 text-xs text-gray-700 list-disc list-inside">
                        {resultado.observacoes.map((obs, i) => (
                          <li key={i}>{obs}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">
              Selecione um serviço na lista ao lado para calcular o prazo.
            </p>
          )}
        </div>

        {/* Dica */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Como usar</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>1. Busque o serviço por nome ou categoria</li>
            <li>2. Informe a quantidade a ser executada</li>
            <li>3. Selecione a complexidade da execuçÍo</li>
            <li>4. Veja o prazo estimado com base nos dados SINAPI/TCPO</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ABA: SINCRONIZAÇÍO
// ============================================================

function AbaSincronizacao() {
  const [estado, setEstado] = useState<EstadoBrasil>('SP');
  const [limiarDiferenca, setLimiarDiferenca] = useState(0.05);
  const [estatisticas, setEstatisticas] = useState<EstatisticasCobertura | null>(null);
  const [resultado, setResultado] = useState<ResultadoSincronizacao | null>(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    obterEstatisticasCoberturaSINAPI(estado).then(setEstatisticas);
  }, [estado]);

  const handleAnalisar = async () => {
    setCarregando(true);
    try {
      const config: ConfiguracaoSync = {
        estado,
        limiarDiferencaPreco: limiarDiferenca,
        incluirSemCodigo: true,
      };
      const res = await pricelistSinapiSyncService.analisarSincronizacao(config);
      setResultado(res);
    } catch (error) {
      console.error('Erro na análise:', error);
    } finally {
      setCarregando(false);
    }
  };

  const estados: EstadoBrasil[] = ['SP', 'RJ', 'MG', 'RS', 'PR', 'BA', 'SC', 'GO', 'DF'];

  return (
    <div className="space-y-6">
      {/* ConfiguraçÍo */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-lg font-medium text-[#2E2E2E] mb-4">ConfiguraçÍo da SincronizaçÍo</h3>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado SINAPI</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoBrasil)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {estados.map((uf) => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Limiar de Diferença
            </label>
            <select
              value={limiarDiferenca}
              onChange={(e) => setLimiarDiferenca(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value={0.03}>3% (rigoroso)</option>
              <option value={0.05}>5% (padrÍo)</option>
              <option value={0.10}>10% (tolerante)</option>
              <option value={0.15}>15% (flexível)</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleAnalisar}
              disabled={carregando}
              className="w-full px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {carregando ? 'Analisando...' : 'Analisar Pricelist'}
            </button>
          </div>
        </div>
      </div>

      {/* Estatísticas de Cobertura */}
      {estatisticas && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[#2E2E2E]">{estatisticas.totalPricelist}</p>
            <p className="text-xs text-gray-500 mt-1">Itens no Pricelist</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{estatisticas.comCodigoSINAPI}</p>
            <p className="text-xs text-gray-500 mt-1">Com código SINAPI</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-orange-500">{estatisticas.semCodigoSINAPI}</p>
            <p className="text-xs text-gray-500 mt-1">Sem código SINAPI</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {estatisticas.percentualCobertura.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Cobertura SINAPI</p>
          </div>
        </div>
      )}

      {/* Resultado da Análise */}
      {resultado && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-lg font-medium text-[#2E2E2E] mb-4">Resultado da Análise</h3>

          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xl font-bold text-gray-700">{resultado.totalAnalisado}</p>
              <p className="text-xs text-gray-500">Analisados</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-xl font-bold text-green-600">{resultado.comMatchExato}</p>
              <p className="text-xs text-gray-500">Match Exato</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <p className="text-xl font-bold text-yellow-600">{resultado.comMatchAproximado}</p>
              <p className="text-xs text-gray-500">Match Aproximado</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-xl font-bold text-red-600">{resultado.semMatch}</p>
              <p className="text-xs text-gray-500">Sem Match</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-xl font-bold text-orange-600">{resultado.precosDesatualizados}</p>
              <p className="text-xs text-gray-500">Desatualizados</p>
            </div>
          </div>

          {resultado.sugestoesAtualizacao.length > 0 && (
            <>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Sugestões de AtualizaçÍo ({resultado.sugestoesAtualizacao.length})
              </h4>
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Item</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Match</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-600">Preço Atual</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-600">Preço SINAPI</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-600">Diferença</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-600">AçÍo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {resultado.sugestoesAtualizacao.slice(0, 20).map((sugestao, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <p className="font-medium text-gray-900 truncate max-w-[200px]">
                            {sugestao.itemPricelist.nome}
                          </p>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            sugestao.tipoMatch === 'exato' ? 'bg-green-100 text-green-700' :
                            sugestao.tipoMatch === 'aproximado' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {sugestao.tipoMatch}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          R$ {sugestao.itemPricelist.preco?.toFixed(2) || '0,00'}
                        </td>
                        <td className="px-3 py-2 text-right">
                          R$ {sugestao.itemSINAPI?.preco_mediano?.toFixed(2) || '-'}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {sugestao.percentualDiferenca !== null && (
                            <span className={sugestao.percentualDiferenca > 0 ? 'text-red-600' : 'text-green-600'}>
                              {sugestao.percentualDiferenca > 0 ? '+' : ''}
                              {(sugestao.percentualDiferenca * 100).toFixed(1)}%
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            sugestao.recomendacao === 'atualizar' ? 'bg-red-100 text-red-700' :
                            sugestao.recomendacao === 'revisar' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {sugestao.recomendacao}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <p className="text-xs text-gray-500 mt-4">
            Tempo de processamento: {resultado.tempoProcessamentoMs}ms
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ABA: CRONOGRAMA
// ============================================================

function AbaCronograma() {
  const [itens, setItens] = useState<ItemQuantitativo[]>([
    { id: '1', descricao: 'DemoliçÍo de alvenaria', unidade: 'm²', quantidade: 50 },
    { id: '2', descricao: 'Alvenaria bloco cerâmico 14cm', unidade: 'm²', quantidade: 80 },
    { id: '3', descricao: 'Chapisco interno', unidade: 'm²', quantidade: 160 },
    { id: '4', descricao: 'Emboço interno', unidade: 'm²', quantidade: 160 },
    { id: '5', descricao: 'Ponto de tomada', unidade: 'un', quantidade: 20 },
    { id: '6', descricao: 'Ponto de água fria', unidade: 'un', quantidade: 10 },
    { id: '7', descricao: 'Piso cerâmico 45x45', unidade: 'm²', quantidade: 100 },
    { id: '8', descricao: 'Pintura látex PVA', unidade: 'm²', quantidade: 200 },
  ]);
  const [dataInicio, setDataInicio] = useState(() => {
    const hoje = new Date();
    return hoje.toISOString().split('T')[0];
  });
  const [complexidade, setComplexidade] = useState<'baixa' | 'media' | 'alta'>('media');
  const [cronograma, setCronograma] = useState<ResultadoCronograma | null>(null);
  const [novoItem, setNovoItem] = useState({ descricao: '', unidade: 'm²', quantidade: 0 });

  const handleGerarCronograma = () => {
    const config: ConfiguracaoCronograma = {
      dataInicio: new Date(dataInicio),
      complexidade,
      diasUteisSemana: 6,
      considerarCura: true,
      agruparPorFase: true,
      ordenarAutomatico: true,
    };

    const resultado = cronogramaService.gerarCronograma(itens, config);
    setCronograma(resultado);
  };

  const handleAdicionarItem = () => {
    if (!novoItem.descricao || novoItem.quantidade <= 0) return;

    setItens([
      ...itens,
      {
        id: String(Date.now()),
        ...novoItem,
      },
    ]);
    setNovoItem({ descricao: '', unidade: 'm²', quantidade: 0 });
  };

  const handleRemoverItem = (id: string) => {
    setItens(itens.filter((item) => item.id !== id));
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Lista de Itens */}
      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-lg font-medium text-[#2E2E2E] mb-3">Itens do Quantitativo</h3>

          {/* Adicionar Item */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="DescriçÍo do serviço"
              value={novoItem.descricao}
              onChange={(e) => setNovoItem({ ...novoItem, descricao: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <select
              value={novoItem.unidade}
              onChange={(e) => setNovoItem({ ...novoItem, unidade: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-20"
            >
              <option value="m²">m²</option>
              <option value="ml">ml</option>
              <option value="m³">m³</option>
              <option value="un">un</option>
              <option value="kg">kg</option>
            </select>
            <input
              type="number"
              placeholder="Qtd"
              value={novoItem.quantidade || ''}
              onChange={(e) => setNovoItem({ ...novoItem, quantidade: Number(e.target.value) })}
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <button
              onClick={handleAdicionarItem}
              className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
            >
              +
            </button>
          </div>

          {/* Lista */}
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {itens.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.descricao}</p>
                  <p className="text-xs text-gray-500">
                    {item.quantidade} {item.unidade}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoverItem(item.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ConfiguraçÍo */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-lg font-medium text-[#2E2E2E] mb-3">ConfiguraçÍo</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Complexidade</label>
              <select
                value={complexidade}
                onChange={(e) => setComplexidade(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGerarCronograma}
            className="w-full mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90"
          >
            Gerar Cronograma
          </button>
        </div>
      </div>

      {/* Cronograma Gerado */}
      <div className="space-y-4">
        {cronograma ? (
          <>
            {/* Resumo */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-lg font-medium text-[#2E2E2E] mb-3">Resumo do Cronograma</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-500">Data Início</span>
                  <p className="font-medium">
                    {cronograma.resumo.dataInicio.toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Data Fim</span>
                  <p className="font-medium">
                    {cronograma.resumo.dataFim.toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Dias Úteis</span>
                  <p className="font-medium">{cronograma.resumo.duracaoTotalDiasUteis} dias</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Dias Corridos</span>
                  <p className="font-medium">{cronograma.resumo.duracaoTotalDiasCorridos} dias</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <span className="text-xs text-gray-500">Equipe de Pico</span>
                <p className="text-sm font-medium">
                  {formatarEquipe(cronograma.resumo.equipePico)}
                </p>
              </div>
            </div>

            {/* Fases */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-lg font-medium text-[#2E2E2E] mb-3">Fases da Obra</h3>

              <div className="space-y-3">
                {Object.entries(cronograma.porFase).map(([fase, info]) => (
                  <div
                    key={fase}
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: `${getCorFase(fase as any)}15` }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getCorFase(fase as any) }}
                        />
                        <span className="font-medium">{getLabelFase(fase as any)}</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {info.duracaoDias} dias
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 ml-5">
                      {info.atividades.length} atividade(s) •{' '}
                      {info.dataInicio.toLocaleDateString('pt-BR')} -{' '}
                      {info.dataFim.toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Alertas */}
            {cronograma.alertas.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">Alertas</h4>
                <ul className="text-xs text-yellow-700 space-y-1">
                  {cronograma.alertas.map((alerta, idx) => (
                    <li key={idx}>⚠️ {alerta}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Atividades Detalhadas */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-lg font-medium text-[#2E2E2E] mb-3">Atividades</h3>

              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {cronograma.atividades.map((atividade) => (
                  <div
                    key={atividade.id}
                    className="p-3 border-l-4 bg-gray-50 rounded-r-lg"
                    style={{ borderColor: getCorFase(atividade.fase) }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{atividade.nome}</p>
                        <p className="text-xs text-gray-500">
                          {atividade.quantidade} {atividade.unidade} •{' '}
                          {atividade.duracao_dias_uteis} dias
                        </p>
                      </div>
                      <div className="text-right text-xs text-gray-600">
                        <p>{atividade.dataInicio.toLocaleDateString('pt-BR')}</p>
                        <p>{atividade.dataFim.toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-gray-500">
              Configure os itens do quantitativo e clique em "Gerar Cronograma"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

