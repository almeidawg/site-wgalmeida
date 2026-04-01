// ============================================================
// COMPONENTE COMPARADOR DE PREÇOS
// WG Easy - Grupo WG Almeida
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, ExternalLink, RefreshCw,
  ShoppingCart, Store, Calendar, AlertTriangle, CheckCircle,
  Package, Filter
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { formatarMoedaBRL } from '../../lib/precificacaoAutomatizada';
import { CotacaoProduto, ProdutoCatalogo } from '../../lib/catalogoProdutosService';

interface ComparadorPrecosProps {
  produtoId?: string;
  codigoProduto?: string;
  onSelecionarCotacao?: (cotacao: CotacaoProduto) => void;
}

interface CotacaoComparada extends CotacaoProduto {
  economia?: number;
  percentualEconomia?: number;
  melhorPreco?: boolean;
}

export default function ComparadorPrecos({
  produtoId,
  codigoProduto,
  onSelecionarCotacao,
}: ComparadorPrecosProps) {
  const [loading, setLoading] = useState(true);
  const [produto, setProduto] = useState<ProdutoCatalogo | null>(null);
  const [cotacoes, setCotacoes] = useState<CotacaoComparada[]>([]);
  const [ordenacao, setOrdenacao] = useState<'preco' | 'data' | 'fornecedor'>('preco');

  // Carregar produto e cotações
  const carregarDados = useCallback(async () => {
    if (!produtoId && !codigoProduto) return;

    try {
      setLoading(true);

      // Buscar produto
      let query = supabase.from('pricelist').select('*');
      if (produtoId) {
        query = query.eq('id', produtoId);
      } else if (codigoProduto) {
        query = query.eq('codigo', codigoProduto);
      }
      const { data: produtoData } = await query.single();

      if (produtoData) {
        setProduto({
          id: produtoData.id,
          codigo_interno: produtoData.codigo,
          nome: produtoData.nome,
          descricao: produtoData.descricao,
          unidade: produtoData.unidade || 'UN',
          preco_referencia: produtoData.preco,
          marca: produtoData.marca,
          imagem_url: produtoData.imagem_url,
          ativo: true,
        });

        // Buscar cotações
        const { data: cotacoesData } = await supabase
          .from('cotacoes_produtos')
          .select('*')
          .eq('produto_id', produtoData.id)
          .eq('ativo', true)
          .order('preco', { ascending: true });

        if (cotacoesData && cotacoesData.length > 0) {
          const menorPreco = Math.min(...cotacoesData.map(c => c.preco));

          const cotacoesProcessadas: CotacaoComparada[] = cotacoesData.map(c => ({
            id: c.id,
            produto_id: c.produto_id,
            fornecedor_id: c.fornecedor_id,
            fornecedor_nome: c.fornecedor_nome,
            url_origem: c.url_origem,
            preco: c.preco,
            preco_promocional: c.preco_promocional,
            disponibilidade: c.disponibilidade,
            prazo_entrega_dias: c.prazo_entrega_dias,
            quantidade_minima: c.quantidade_minima,
            frete_incluso: c.frete_incluso,
            observacoes: c.observacoes,
            data_captura: c.data_captura,
            metodo_captura: c.metodo_captura,
            confiabilidade: c.confiabilidade,
            economia: c.preco - menorPreco,
            percentualEconomia: ((c.preco - menorPreco) / c.preco) * 100,
            melhorPreco: c.preco === menorPreco,
          }));

          setCotacoes(cotacoesProcessadas);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, [produtoId, codigoProduto]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Ordenar cotações
  const cotacoesOrdenadas = [...cotacoes].sort((a, b) => {
    switch (ordenacao) {
      case 'preco':
        return a.preco - b.preco;
      case 'data':
        return new Date(b.data_captura).getTime() - new Date(a.data_captura).getTime();
      case 'fornecedor':
        return (a.fornecedor_nome || '').localeCompare(b.fornecedor_nome || '');
      default:
        return 0;
    }
  });

  // Calcular estatísticas
  const estatisticas = cotacoes.length > 0 ? {
    menorPreco: Math.min(...cotacoes.map(c => c.preco)),
    maiorPreco: Math.max(...cotacoes.map(c => c.preco)),
    mediaPreco: cotacoes.reduce((sum, c) => sum + c.preco, 0) / cotacoes.length,
    economiaMaxima: Math.max(...cotacoes.map(c => c.preco)) - Math.min(...cotacoes.map(c => c.preco)),
    totalCotacoes: cotacoes.length,
  } : null;

  // Formatar data relativa
  const formatarDataRelativa = (data: string) => {
    const agora = new Date();
    const dataCaptura = new Date(data);
    const diffDias = Math.floor((agora.getTime() - dataCaptura.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDias === 0) return 'Hoje';
    if (diffDias === 1) return 'Ontem';
    if (diffDias < 7) return `${diffDias} dias atrás`;
    if (diffDias < 30) return `${Math.floor(diffDias / 7)} semana(s)`;
    return `${Math.floor(diffDias / 30)} mês(es)`;
  };

  // Renderizar status de disponibilidade
  const renderDisponibilidade = (status: string) => {
    switch (status) {
      case 'em_estoque':
        return (
          <span className="flex items-center gap-1 text-green-600 text-xs">
            <CheckCircle size={12} />
            Em estoque
          </span>
        );
      case 'sob_encomenda':
        return (
          <span className="flex items-center gap-1 text-amber-600 text-xs">
            <AlertTriangle size={12} />
            Sob encomenda
          </span>
        );
      case 'indisponivel':
        return (
          <span className="flex items-center gap-1 text-red-600 text-xs">
            <AlertTriangle size={12} />
            Indisponível
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <RefreshCw size={24} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (!produto) {
    return (
      <div className="p-6 text-center text-gray-500">
        <Package size={40} className="mx-auto text-gray-300 mb-2" />
        <p>Produto não encontrado</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header do Produto */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4">
        <div className="flex items-center gap-4">
          {produto.imagem_url && (
            <img
              src={produto.imagem_url}
              alt={produto.nome}
              className="w-16 h-16 object-cover rounded-lg bg-white"
            />
          )}
          <div className="flex-1 text-white">
            <h3 className="font-normal text-lg line-clamp-1">{produto.nome}</h3>
            <div className="flex items-center gap-3 text-blue-200 text-sm mt-1">
              {produto.codigo_interno && (
                <span className="bg-blue-500/30 px-2 py-0.5 rounded">
                  {produto.codigo_interno}
                </span>
              )}
              {produto.marca && <span>{produto.marca}</span>}
              <span>{produto.unidade}</span>
            </div>
          </div>
          <button
            onClick={carregarDados}
            className="p-2 hover:bg-white/20 rounded-lg transition"
            title="Atualizar"
          >
            <RefreshCw size={20} className="text-white" />
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      {estatisticas && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 border-b">
          <div className="text-center">
            <p className="text-xs text-gray-500">Menor Preço</p>
            <p className="text-lg font-normal text-green-600">
              {formatarMoedaBRL(estatisticas.menorPreco)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Maior Preço</p>
            <p className="text-lg font-normal text-red-600">
              {formatarMoedaBRL(estatisticas.maiorPreco)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Média</p>
            <p className="text-lg font-normal text-gray-700">
              {formatarMoedaBRL(estatisticas.mediaPreco)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Economia Máxima</p>
            <p className="text-lg font-normal text-blue-600">
              {formatarMoedaBRL(estatisticas.economiaMaxima)}
            </p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex items-center justify-between p-4 border-b">
        <p className="text-sm text-gray-600">
          {cotacoes.length} cotaçÍo(ões) encontrada(s)
        </p>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={ordenacao}
            onChange={(e) => setOrdenacao(e.target.value as 'preco' | 'data' | 'fornecedor')}
            className="text-sm border rounded px-2 py-1 border-gray-300 focus:border-blue-500"
          >
            <option value="preco">Menor Preço</option>
            <option value="data">Mais Recente</option>
            <option value="fornecedor">Fornecedor A-Z</option>
          </select>
        </div>
      </div>

      {/* Lista de Cotações */}
      <div className="divide-y max-h-96 overflow-y-auto">
        {cotacoesOrdenadas.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Store size={40} className="mx-auto text-gray-300 mb-2" />
            <p>Nenhuma cotaçÍo disponível</p>
            <p className="text-xs mt-1">Use a extensÍo para capturar preços</p>
          </div>
        ) : (
          cotacoesOrdenadas.map((cotacao, index) => (
            <div
              key={cotacao.id}
              className={`p-4 hover:bg-gray-50 transition cursor-pointer ${
                cotacao.melhorPreco ? 'bg-green-50' : ''
              }`}
              onClick={() => onSelecionarCotacao?.(cotacao)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Ranking */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-normal text-sm ${
                    index === 0 ? 'bg-green-100 text-green-700' :
                    index === 1 ? 'bg-blue-100 text-blue-700' :
                    index === 2 ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>

                  {/* Info do Fornecedor */}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-800">
                        {cotacao.fornecedor_nome || 'Fornecedor não identificado'}
                      </p>
                      {cotacao.melhorPreco && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                          Melhor Preço
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      {renderDisponibilidade(cotacao.disponibilidade)}
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {formatarDataRelativa(cotacao.data_captura)}
                      </span>
                      {cotacao.frete_incluso && (
                        <span className="text-blue-600">Frete grátis</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Preço */}
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    {cotacao.preco_promocional && cotacao.preco_promocional < cotacao.preco && (
                      <span className="text-sm text-gray-400 line-through">
                        {formatarMoedaBRL(cotacao.preco)}
                      </span>
                    )}
                    <p className={`text-xl font-normal ${
                      cotacao.melhorPreco ? 'text-green-600' : 'text-gray-800'
                    }`}>
                      {formatarMoedaBRL(cotacao.preco_promocional || cotacao.preco)}
                    </p>
                  </div>

                  {!cotacao.melhorPreco && cotacao.economia && cotacao.economia > 0 && (
                    <p className="text-xs text-red-500 flex items-center justify-end gap-1">
                      <TrendingUp size={12} />
                      +{formatarMoedaBRL(cotacao.economia)} ({cotacao.percentualEconomia?.toFixed(1)}%)
                    </p>
                  )}

                  {cotacao.prazo_entrega_dias && (
                    <p className="text-xs text-gray-500 mt-1">
                      Entrega em {cotacao.prazo_entrega_dias} dia(s)
                    </p>
                  )}
                </div>
              </div>

              {/* URL e Ações */}
              {cotacao.url_origem && (
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <a
                    href={cotacao.url_origem}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={12} />
                    Ver no site
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelecionarCotacao?.(cotacao);
                    }}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition"
                  >
                    <ShoppingCart size={12} />
                    Usar este preço
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Barra de confiabilidade */}
      {cotacoes.length > 0 && (
        <div className="p-4 bg-gray-50 border-t">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Confiabilidade dos dados</span>
            <span>
              {Math.round(cotacoes.reduce((sum, c) => sum + c.confiabilidade, 0) / cotacoes.length)}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-green-600"
              style={{
                width: `${cotacoes.reduce((sum, c) => sum + c.confiabilidade, 0) / cotacoes.length}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}


