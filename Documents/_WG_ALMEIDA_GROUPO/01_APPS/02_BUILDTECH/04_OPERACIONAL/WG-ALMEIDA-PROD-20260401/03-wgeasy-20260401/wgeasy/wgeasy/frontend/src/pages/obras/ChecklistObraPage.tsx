/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// CHECKLIST DINÂMICO POR OBRA
// Baseado em análise do Obra Prima
// WG Easy - Grupo WG Almeida
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  CheckSquare, Square, Plus, Trash2, Edit2, Save, X,
  ChevronDown, ChevronRight, Clock, CheckCircle, AlertTriangle,
  Building2, Calendar, User, Filter, Search, Download,
  Upload, RefreshCw, Settings, Copy, Folder
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { normalizeSearchTerm } from '@/utils/searchUtils';
import { useUsuarioLogado } from '../../hooks/useUsuarioLogado';
import { useParams, useNavigate } from 'react-router-dom';

// Tipos
interface ItemChecklist {
  id: string;
  titulo: string;
  descricao?: string;
  obrigatorio: boolean;
  concluido: boolean;
  data_conclusao?: string;
  responsavel_id?: string;
  responsavel_nome?: string;
  observacoes?: string;
  ordem: number;
}

interface CategoriaChecklist {
  id: string;
  nome: string;
  icone?: string;
  cor: string;
  ordem: number;
  itens: ItemChecklist[];
  expandida: boolean;
}

interface ModeloChecklist {
  id: string;
  nome: string;
  descricao?: string;
  categorias: {
    nome: string;
    itens: { titulo: string; obrigatorio: boolean }[];
  }[];
}

// Modelos pré-definidos de checklist
const MODELOS_PREDEFINIDOS: ModeloChecklist[] = [
  {
    id: 'reforma_residencial',
    nome: 'Reforma Residencial',
    descricao: 'Checklist completo para reformas residenciais',
    categorias: [
      {
        nome: 'Pré-Obra',
        itens: [
          { titulo: 'Contrato assinado', obrigatorio: true },
          { titulo: 'ART/RRT registrada', obrigatorio: true },
          { titulo: 'Projeto aprovado na prefeitura', obrigatorio: false },
          { titulo: 'Alvará de construçÍo', obrigatorio: false },
          { titulo: 'Cronograma aprovado pelo cliente', obrigatorio: true },
          { titulo: 'Orçamento aprovado', obrigatorio: true },
        ],
      },
      {
        nome: 'DemoliçÍo',
        itens: [
          { titulo: 'Desligamento de água e luz', obrigatorio: true },
          { titulo: 'ProteçÍo de áreas nÍo afetadas', obrigatorio: true },
          { titulo: 'RemoçÍo de entulho', obrigatorio: true },
          { titulo: 'Limpeza pós-demoliçÍo', obrigatorio: true },
        ],
      },
      {
        nome: 'Estrutura',
        itens: [
          { titulo: 'VerificaçÍo de fundações existentes', obrigatorio: true },
          { titulo: 'Reforço estrutural (se necessário)', obrigatorio: false },
          { titulo: 'ExecuçÍo de novos elementos estruturais', obrigatorio: false },
          { titulo: 'Laudo de conformidade estrutural', obrigatorio: false },
        ],
      },
      {
        nome: 'Instalações Hidráulicas',
        itens: [
          { titulo: 'Projeto hidráulico aprovado', obrigatorio: true },
          { titulo: 'Passagem de tubulações', obrigatorio: true },
          { titulo: 'Teste de pressÍo', obrigatorio: true },
          { titulo: 'InstalaçÍo de louças e metais', obrigatorio: true },
          { titulo: 'Teste de funcionamento', obrigatorio: true },
        ],
      },
      {
        nome: 'Instalações Elétricas',
        itens: [
          { titulo: 'Projeto elétrico aprovado', obrigatorio: true },
          { titulo: 'Passagem de eletrodutos', obrigatorio: true },
          { titulo: 'InstalaçÍo de fiaçÍo', obrigatorio: true },
          { titulo: 'Montagem de quadro elétrico', obrigatorio: true },
          { titulo: 'InstalaçÍo de tomadas e interruptores', obrigatorio: true },
          { titulo: 'Teste de funcionamento', obrigatorio: true },
        ],
      },
      {
        nome: 'Acabamentos',
        itens: [
          { titulo: 'Reboco/gesso concluído', obrigatorio: true },
          { titulo: 'Pintura de fundo', obrigatorio: true },
          { titulo: 'Assentamento de pisos', obrigatorio: true },
          { titulo: 'Assentamento de revestimentos', obrigatorio: true },
          { titulo: 'Pintura final', obrigatorio: true },
          { titulo: 'InstalaçÍo de rodapés', obrigatorio: false },
        ],
      },
      {
        nome: 'Entrega',
        itens: [
          { titulo: 'Limpeza final', obrigatorio: true },
          { titulo: 'Vistoria com cliente', obrigatorio: true },
          { titulo: 'CorreçÍo de pendências', obrigatorio: true },
          { titulo: 'Termo de entrega assinado', obrigatorio: true },
          { titulo: 'Entrega de manuais e garantias', obrigatorio: true },
        ],
      },
    ],
  },
  {
    id: 'construcao_nova',
    nome: 'ConstruçÍo Nova',
    descricao: 'Checklist para obras novas do zero',
    categorias: [
      {
        nome: 'DocumentaçÍo',
        itens: [
          { titulo: 'Projeto arquitetônico aprovado', obrigatorio: true },
          { titulo: 'Projeto estrutural', obrigatorio: true },
          { titulo: 'Projetos complementares', obrigatorio: true },
          { titulo: 'Alvará de construçÍo', obrigatorio: true },
          { titulo: 'ART/RRT de todos os responsáveis', obrigatorio: true },
        ],
      },
      {
        nome: 'FundaçÍo',
        itens: [
          { titulo: 'Sondagem de solo', obrigatorio: true },
          { titulo: 'LocaçÍo da obra', obrigatorio: true },
          { titulo: 'EscavaçÍo', obrigatorio: true },
          { titulo: 'ExecuçÍo de fundações', obrigatorio: true },
          { titulo: 'ImpermeabilizaçÍo de fundações', obrigatorio: true },
        ],
      },
      {
        nome: 'Estrutura',
        itens: [
          { titulo: 'Pilares térreo', obrigatorio: true },
          { titulo: 'Vigas térreo', obrigatorio: true },
          { titulo: 'Laje térreo', obrigatorio: true },
          { titulo: 'Estrutura pavimento superior', obrigatorio: false },
          { titulo: 'Estrutura de cobertura', obrigatorio: true },
        ],
      },
      {
        nome: 'Alvenaria',
        itens: [
          { titulo: 'Alvenaria de vedaçÍo', obrigatorio: true },
          { titulo: 'Vergas e contravergas', obrigatorio: true },
          { titulo: 'Encunhamento', obrigatorio: true },
        ],
      },
      {
        nome: 'Cobertura',
        itens: [
          { titulo: 'Estrutura de madeira/metálica', obrigatorio: true },
          { titulo: 'InstalaçÍo de telhas', obrigatorio: true },
          { titulo: 'Rufos e calhas', obrigatorio: true },
          { titulo: 'ImpermeabilizaçÍo', obrigatorio: true },
        ],
      },
    ],
  },
];

// Cores das categorias
const CORES_CATEGORIAS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

export default function ChecklistObraPage() {
  const { showToast } = useToast();
  const { usuario } = useUsuarioLogado();
  const { obraId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [obra, setObra] = useState<{ id: string; nome: string } | null>(null);
  const [categorias, setCategorias] = useState<CategoriaChecklist[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pendentes' | 'concluidos'>('todos');

  // Modais
  const [modalModelo, setModalModelo] = useState(false);
  const [modalNovaCategoria, setModalNovaCategoria] = useState(false);
  const [modalNovoItem, setModalNovoItem] = useState<string | null>(null);
  const [novaCategoriaNome, setNovaCategoriaNome] = useState('');
  const [novoItemTitulo, setNovoItemTitulo] = useState('');
  const [novoItemObrigatorio, setNovoItemObrigatorio] = useState(false);

  // Carregar dados
  useEffect(() => {
    if (obraId && usuario?.empresa_id) {
      carregarDados();
    }
  }, [obraId, usuario?.empresa_id]);

  const carregarDados = async () => {
    if (!obraId || !usuario?.empresa_id) return;
    setLoading(true);

    try {
      // Carregar obra
      const { data: obraData } = await supabase
        .from('obras')
        .select('id, nome')
        .eq('id', obraId)
        .single();

      if (obraData) setObra(obraData);

      // Carregar checklist existente
      const { data: checklistData } = await supabase
        .from('obra_checklist_categorias')
        .select(`
          *,
          itens:obra_checklist_itens(*)
        `)
        .eq('obra_id', obraId)
        .order('ordem');

      if (checklistData && checklistData.length > 0) {
        setCategorias(checklistData.map((cat, index) => ({
          id: cat.id,
          nome: cat.nome,
          icone: cat.icone,
          cor: cat.cor || CORES_CATEGORIAS[index % CORES_CATEGORIAS.length],
          ordem: cat.ordem,
          expandida: true,
          itens: (cat.itens || []).map((item: any) => ({
            id: item.id,
            titulo: item.titulo,
            descricao: item.descricao,
            obrigatorio: item.obrigatorio,
            concluido: item.concluido,
            data_conclusao: item.data_conclusao,
            responsavel_id: item.responsavel_id,
            responsavel_nome: item.responsavel_nome,
            observacoes: item.observacoes,
            ordem: item.ordem,
          })).sort((a: ItemChecklist, b: ItemChecklist) => a.ordem - b.ordem),
        })));
      }

    } catch (error) {
      console.error('Erro ao carregar checklist:', error);
      showToast('Erro ao carregar checklist', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Aplicar modelo
  const aplicarModelo = async (modelo: ModeloChecklist) => {
    if (!obraId) return;
    setSalvando(true);

    try {
      // Criar categorias e itens
      for (let i = 0; i < modelo.categorias.length; i++) {
        const cat = modelo.categorias[i];

        const { data: categoriaCriada, error: erroCat } = await supabase
          .from('obra_checklist_categorias')
          .insert({
            obra_id: obraId,
            nome: cat.nome,
            cor: CORES_CATEGORIAS[i % CORES_CATEGORIAS.length],
            ordem: i,
          })
          .select()
          .single();

        if (erroCat) throw erroCat;

        // Criar itens da categoria
        const itens = cat.itens.map((item, j) => ({
          categoria_id: categoriaCriada.id,
          titulo: item.titulo,
          obrigatorio: item.obrigatorio,
          concluido: false,
          ordem: j,
        }));

        const { error: erroItens } = await supabase
          .from('obra_checklist_itens')
          .insert(itens);

        if (erroItens) throw erroItens;
      }

      showToast('Modelo aplicado com sucesso!', 'success');
      setModalModelo(false);
      carregarDados();

    } catch (error) {
      console.error('Erro ao aplicar modelo:', error);
      showToast('Erro ao aplicar modelo', 'error');
    } finally {
      setSalvando(false);
    }
  };

  // Toggle item concluído
  const toggleItem = async (categoriaId: string, itemId: string) => {
    const categoria = categorias.find(c => c.id === categoriaId);
    const item = categoria?.itens.find(i => i.id === itemId);
    if (!item) return;

    const novoConcluido = !item.concluido;

    // Atualizar localmente
    setCategorias(prev => prev.map(cat => {
      if (cat.id !== categoriaId) return cat;
      return {
        ...cat,
        itens: cat.itens.map(i => {
          if (i.id !== itemId) return i;
          return {
            ...i,
            concluido: novoConcluido,
            data_conclusao: novoConcluido ? new Date().toISOString() : undefined,
          };
        }),
      };
    }));

    // Salvar no banco
    try {
      await supabase
        .from('obra_checklist_itens')
        .update({
          concluido: novoConcluido,
          data_conclusao: novoConcluido ? new Date().toISOString() : null,
        })
        .eq('id', itemId);
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      showToast('Erro ao salvar', 'error');
    }
  };

  // Adicionar categoria
  const adicionarCategoria = async () => {
    if (!novaCategoriaNome.trim() || !obraId) return;
    setSalvando(true);

    try {
      const { data, error } = await supabase
        .from('obra_checklist_categorias')
        .insert({
          obra_id: obraId,
          nome: novaCategoriaNome.trim(),
          cor: CORES_CATEGORIAS[categorias.length % CORES_CATEGORIAS.length],
          ordem: categorias.length,
        })
        .select()
        .single();

      if (error) throw error;

      setCategorias(prev => [...prev, {
        id: data.id,
        nome: data.nome,
        cor: data.cor,
        ordem: data.ordem,
        expandida: true,
        itens: [],
      }]);

      setNovaCategoriaNome('');
      setModalNovaCategoria(false);
      showToast('Categoria adicionada!', 'success');

    } catch (error) {
      console.error('Erro ao adicionar categoria:', error);
      showToast('Erro ao adicionar categoria', 'error');
    } finally {
      setSalvando(false);
    }
  };

  // Adicionar item
  const adicionarItem = async (categoriaId: string) => {
    if (!novoItemTitulo.trim()) return;
    setSalvando(true);

    const categoria = categorias.find(c => c.id === categoriaId);
    if (!categoria) return;

    try {
      const { data, error } = await supabase
        .from('obra_checklist_itens')
        .insert({
          categoria_id: categoriaId,
          titulo: novoItemTitulo.trim(),
          obrigatorio: novoItemObrigatorio,
          concluido: false,
          ordem: categoria.itens.length,
        })
        .select()
        .single();

      if (error) throw error;

      setCategorias(prev => prev.map(cat => {
        if (cat.id !== categoriaId) return cat;
        return {
          ...cat,
          itens: [...cat.itens, {
            id: data.id,
            titulo: data.titulo,
            obrigatorio: data.obrigatorio,
            concluido: false,
            ordem: data.ordem,
          }],
        };
      }));

      setNovoItemTitulo('');
      setNovoItemObrigatorio(false);
      setModalNovoItem(null);
      showToast('Item adicionado!', 'success');

    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      showToast('Erro ao adicionar item', 'error');
    } finally {
      setSalvando(false);
    }
  };

  // Calcular progresso
  const calcularProgresso = () => {
    let totalItens = 0;
    let itensConcluidos = 0;
    let itensObrigatorios = 0;
    let obrigatoriosConcluidos = 0;

    categorias.forEach(cat => {
      cat.itens.forEach(item => {
        totalItens++;
        if (item.concluido) itensConcluidos++;
        if (item.obrigatorio) {
          itensObrigatorios++;
          if (item.concluido) obrigatoriosConcluidos++;
        }
      });
    });

    return {
      total: totalItens,
      concluidos: itensConcluidos,
      percentual: totalItens > 0 ? (itensConcluidos / totalItens) * 100 : 0,
      obrigatorios: itensObrigatorios,
      obrigatoriosConcluidos,
      percentualObrigatorios: itensObrigatorios > 0 ? (obrigatoriosConcluidos / itensObrigatorios) * 100 : 0,
    };
  };

  const progresso = calcularProgresso();

  // Filtrar itens
  const categoriasFiltered = categorias.map(cat => ({
    ...cat,
    itens: cat.itens.filter(item => {
      const termo = normalizeSearchTerm(busca);
      const matchBusca = !busca || normalizeSearchTerm(item.titulo).includes(termo);
      const matchStatus = filtroStatus === 'todos' ||
        (filtroStatus === 'pendentes' && !item.concluido) ||
        (filtroStatus === 'concluidos' && item.concluido);
      return matchBusca && matchStatus;
    }),
  })).filter(cat => cat.itens.length > 0 || !busca);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-normal text-gray-800 flex items-center gap-2">
            <CheckSquare className="text-green-600" />
            Checklist da Obra
          </h1>
          <p className="text-[16px] text-gray-500 mt-1">
            {obra?.nome || 'Carregando...'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {categorias.length === 0 && (
            <button
              onClick={() => setModalModelo(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition text-lg"
            >
              <Copy size={18} />
              Usar Modelo
            </button>
          )}
          <button
            onClick={() => setModalNovaCategoria(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-lg"
          >
            <Plus size={18} />
            Nova Categoria
          </button>
        </div>
      </div>

      {/* Progresso Geral */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[20px] font-normal text-gray-800">Progresso Geral</h3>
          <span className="text-2xl font-normal text-green-600">
            {progresso.percentual.toFixed(0)}%
          </span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${progresso.percentual}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[16px] text-gray-500">
          <span>{progresso.concluidos} de {progresso.total} itens concluidos</span>
          <span className="flex items-center gap-1">
            <AlertTriangle size={14} className="text-orange-500" />
            {progresso.obrigatoriosConcluidos}/{progresso.obrigatorios} obrigatorios
          </span>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar itens..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-lg"
          />
        </div>
        <div className="flex gap-2">
          {(['todos', 'pendentes', 'concluidos'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFiltroStatus(status)}
              className={`px-4 py-2 rounded-lg text-lg font-medium transition ${
                filtroStatus === status
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status === 'todos' ? 'Todos' : status === 'pendentes' ? 'Pendentes' : 'Concluidos'}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Categorias */}
      {categoriasFiltered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <Folder size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-[20px] font-medium text-gray-600 mb-2">Nenhum checklist criado</h3>
          <p className="text-[16px] text-gray-400 mb-4">
            Comece usando um modelo pre-definido ou crie suas proprias categorias
          </p>
          <button
            onClick={() => setModalModelo(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark text-lg"
          >
            <Copy size={18} />
            Usar Modelo
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {categoriasFiltered.map(categoria => {
            const itensCategoria = categoria.itens.length;
            const concluidosCategoria = categoria.itens.filter(i => i.concluido).length;
            const percentualCategoria = itensCategoria > 0 ? (concluidosCategoria / itensCategoria) * 100 : 0;

            return (
              <div key={categoria.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {/* Header da Categoria */}
                <div
                  className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => setCategorias(prev => prev.map(c =>
                    c.id === categoria.id ? { ...c, expandida: !c.expandida } : c
                  ))}
                >
                  <div
                    className="w-1 h-10 rounded-full"
                    style={{ backgroundColor: categoria.cor }}
                  />
                  {categoria.expandida ? (
                    <ChevronDown size={20} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={20} className="text-gray-400" />
                  )}
                  <div className="flex-1">
                    <h3 className="text-[20px] font-normal text-gray-800">{categoria.nome}</h3>
                    <p className="text-sm text-gray-500">
                      {concluidosCategoria}/{itensCategoria} itens - {percentualCategoria.toFixed(0)}% concluido
                    </p>
                  </div>
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${percentualCategoria}%`, backgroundColor: categoria.cor }}
                    />
                  </div>
                </div>

                {/* Itens da Categoria */}
                {categoria.expandida && (
                  <div className="border-t">
                    {categoria.itens.map(item => (
                      <div
                        key={item.id}
                        className={`p-3 flex items-center gap-3 border-b last:border-b-0 hover:bg-gray-50 transition ${
                          item.concluido ? 'bg-green-50/50' : ''
                        }`}
                      >
                        <button
                          onClick={() => toggleItem(categoria.id, item.id)}
                          className="flex-shrink-0"
                        >
                          {item.concluido ? (
                            <CheckSquare size={22} className="text-green-600" />
                          ) : (
                            <Square size={22} className="text-gray-300 hover:text-gray-400" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-lg ${item.concluido ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                            {item.titulo}
                          </p>
                          {item.data_conclusao && (
                            <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
                              <Clock size={12} />
                              Concluido em {new Date(item.data_conclusao).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                        {item.obrigatorio && (
                          <span className="text-sm px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
                            Obrigatorio
                          </span>
                        )}
                      </div>
                    ))}

                    {/* BotÍo adicionar item */}
                    <button
                      onClick={() => setModalNovoItem(categoria.id)}
                      className="w-full p-3 text-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2 transition"
                    >
                      <Plus size={16} />
                      Adicionar item
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Selecionar Modelo */}
      {modalModelo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between">
              <h2 className="text-[20px] font-normal text-white">Selecionar Modelo de Checklist</h2>
              <button onClick={() => setModalModelo(false)} className="text-white/80 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
              {MODELOS_PREDEFINIDOS.map(modelo => (
                <div
                  key={modelo.id}
                  className="p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer transition"
                  onClick={() => aplicarModelo(modelo)}
                >
                  <h3 className="text-[20px] font-normal text-gray-800">{modelo.nome}</h3>
                  <p className="text-[16px] text-gray-500 mt-1">{modelo.descricao}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {modelo.categorias.map((cat, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 rounded"
                        style={{ backgroundColor: CORES_CATEGORIAS[i % CORES_CATEGORIAS.length] + '20', color: CORES_CATEGORIAS[i % CORES_CATEGORIAS.length] }}
                      >
                        {cat.nome} ({cat.itens.length})
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Categoria */}
      {modalNovaCategoria && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-4 border-b">
              <h2 className="text-[20px] font-normal text-gray-800">Nova Categoria</h2>
            </div>
            <div className="p-4">
              <input
                type="text"
                placeholder="Nome da categoria"
                value={novaCategoriaNome}
                onChange={(e) => setNovaCategoriaNome(e.target.value)}
                className="w-full p-3 border rounded-lg text-lg"
                autoFocus
              />
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setModalNovaCategoria(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-lg"
              >
                Cancelar
              </button>
              <button
                onClick={adicionarCategoria}
                disabled={!novaCategoriaNome.trim() || salvando}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:bg-gray-400 text-lg"
              >
                {salvando ? 'Salvando...' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Item */}
      {modalNovoItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-4 border-b">
              <h2 className="text-[20px] font-normal text-gray-800">Novo Item</h2>
            </div>
            <div className="p-4 space-y-4">
              <input
                type="text"
                placeholder="Titulo do item"
                value={novoItemTitulo}
                onChange={(e) => setNovoItemTitulo(e.target.value)}
                className="w-full p-3 border rounded-lg text-lg"
                autoFocus
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={novoItemObrigatorio}
                  onChange={(e) => setNovoItemObrigatorio(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-lg text-gray-600">Item obrigatorio</span>
              </label>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setModalNovoItem(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-lg"
              >
                Cancelar
              </button>
              <button
                onClick={() => adicionarItem(modalNovoItem)}
                disabled={!novoItemTitulo.trim() || salvando}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:bg-gray-400 text-lg"
              >
                {salvando ? 'Salvando...' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

