import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import {
  Loader2, CheckCircle, ChevronRight, Search,
  ArrowLeft, Star, ExternalLink, Package, Sparkles
} from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Modulo {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  categoria: string;
  path_rota: string | null;
  icone_emoji: string;
  destaque: boolean;
  rota_ativa: boolean;
}

const CATEGORIAS = [
  'Todos',
  'Financeiro', 'Kanban', 'Cronograma', 'Controle', 'Vendas',
  'Comercial', 'Projetos', 'ProduçÍo', 'Operações', 'Relacionamento',
  'Jurídico', 'Plataforma', 'RH', 'OrganizaçÍo', 'Experiência',
  'Saúde', 'Fitness', 'Food', 'Imobiliária', 'Agência', 'Eventos',
];

interface Vertical { id: string; emoji: string; label: string; slugs: string[]; }

const VERTICAIS: Vertical[] = [
  { id: 'construcao',  emoji: '🏗️', label: 'ConstruçÍo',   slugs: ['financeiro','cronograma','gantt','planejamento','orcamentos','contratos','pessoas','compras','diario-obra','financeiro-obras','checklists','quantitativos','pricelist','bdi','cronograma-fisico-financeiro','portal-cliente','propostas','dashboard-executivo','comparador-precos','drive-documentos','cotacoes-fornecedores','precificacao-automatica','ia-analise-projeto'] },
  { id: 'arquitetura', emoji: '🏛️', label: 'Arquitetura',  slugs: ['oportunidades','propostas','contratos','kanban-arquitetura','analise-projeto','moodboard','memorial-acabamentos','evf','cronograma','portal-cliente','pessoas','financeiro','jornada-cliente','drive-documentos','ia-analise-projeto','relatorios-ia'] },
  { id: 'marcenaria',  emoji: '🪵', label: 'Marcenaria',   slugs: ['marcenaria','oportunidades','propostas','contratos','financeiro','cronograma','compras','pricelist','bdi','composicoes','portal-cliente','pessoas','moodboard','kanban-comercial','relatorios-financeiros'] },
  { id: 'imobiliaria', emoji: '🏘️', label: 'Imobiliária', slugs: ['gestao-imoveis','vistoria','cobranca-aluguel','portal-inquilino','contratos','oportunidades','pessoas','financeiro','kanban-comercial','drive-documentos','assinatura-digital','nps'] },
  { id: 'clinica',     emoji: '🏥', label: 'Clínica',      slugs: ['agenda-consultas','prontuario','plano-tratamento','anamnese','faturamento-saude','financeiro','pessoas','contratos','cobrancas','nps','portal-cliente','drive-documentos','assinatura-digital','whatsapp'] },
  { id: 'academia',    emoji: '🏋️', label: 'Academia',    slugs: ['grade-aulas','plano-treino','avaliacao-fisica','controle-acesso','pessoas','financeiro','cobrancas','contratos','checkin','nps','whatsapp','comissionamento'] },
  { id: 'restaurante', emoji: '🍽️', label: 'Restaurante', slugs: ['cardapio-digital','gestao-mesas','ficha-tecnica','pedidos-delivery','estoque-insumos','financeiro','pessoas','cobrancas','nps','qr-code','whatsapp'] },
  { id: 'eventos',     emoji: '🎪', label: 'Eventos',      slugs: ['timeline-evento','checkin','fornecedores-evento','orcamento-evento','contratos','propostas','financeiro','pessoas','cronograma','checklists','assinatura-digital','nps','qr-code'] },
  { id: 'agencia',     emoji: '🎨', label: 'Agência',      slugs: ['briefings','aprovacao-criativa','portfolio','medicao-campanha','contratos','oportunidades','propostas','cronograma','financeiro','pessoas','moodboard','kanban-comercial','drive-documentos','relatorios-ia'] },
  { id: 'condominios', emoji: '🏢', label: 'Condomínio',   slugs: ['gestao-imoveis','cobranca-aluguel','portal-inquilino','pessoas','financeiro','contratos','controle-acesso','drive-documentos','nps','chat-interno','qr-code'] },
  { id: 'varejo',      emoji: '🛍️', label: 'Varejo',      slugs: ['pessoas','oportunidades','financeiro','cobrancas','compras','deposito','nps','whatsapp','qr-code','relatorios-financeiros','dashboard-executivo'] },
  { id: 'tecnologia',  emoji: '💻', label: 'Tech / SaaS',  slugs: ['dashboard','oportunidades','kanban-comercial','contratos','financeiro','pessoas','automacoes','integracoes','white-label','landing-pages','relatorios-ia','okrs','kpis','time-tracking','chat-interno'] },
];

const KEYWORD_MAP: Record<string, string[]> = {
  'cliente':       ['oportunidades', 'portal-cliente', 'pessoas', 'kanban-comercial'],
  'venda':         ['oportunidades', 'propostas', 'orcamentos', 'kanban-comercial', 'automacao-comercial'],
  'crm':           ['oportunidades', 'pessoas', 'kanban-comercial'],
  'pagamento':     ['financeiro', 'comissionamento', 'cobrancas'],
  'financeiro':    ['financeiro', 'dashboard-financeiro', 'fluxo-caixa', 'relatorios-financeiros'],
  'cobrança':      ['cobrancas', 'financeiro', 'dividas'],
  'fluxo':         ['fluxo-caixa', 'dashboard-financeiro'],
  'dre':           ['dre', 'dashboard-financeiro', 'relatorios-financeiros'],
  'orçamento':     ['orcamentos', 'pricelist', 'bdi', 'sinapi', 'curva-abc'],
  'proposta':      ['propostas', 'orcamentos', 'proposta-automatica'],
  'contrato':      ['contratos', 'juridico', 'assinatura-digital'],
  'jurídico':      ['juridico', 'contratos', 'auditoria'],
  'projeto':       ['cronograma', 'planejamento', 'checklists', 'gantt', 'milestones'],
  'obra':          ['cronograma', 'financeiro-obras', 'diario-obra', 'quantitativos', 'cronograma-fisico-financeiro'],
  'gantt':         ['gantt', 'cronograma', 'cronograma-fisico-financeiro', 'baseline'],
  'kanban':        ['kanban-comercial', 'kanban-compras', 'kanban-cronograma', 'kanban-assistencia'],
  'entrega':       ['cronograma', 'checklists', 'milestones', 'termos-aceite'],
  'arquitetura':   ['kanban-arquitetura', 'analise-projeto', 'arquitetura', 'memorial-acabamentos'],
  'engenharia':    ['kanban-engenharia', 'engenharia', 'quantitativos', 'cronograma-fisico-financeiro'],
  'marcenaria':    ['marcenaria'],
  'compra':        ['compras', 'kanban-compras', 'deposito', 'pricelist', 'composicoes'],
  'fornecedor':    ['fornecedores', 'compras', 'pessoas'],
  'estoque':       ['deposito', 'compras'],
  'planejamento':  ['planejamento', 'cronograma', 'okrs', 'composicoes'],
  'pessoas':       ['pessoas', 'colaboradores', 'fornecedores'],
  'equipe':        ['pessoas', 'colaboradores', 'comissionamento', 'avaliacao-desempenho'],
  'rh':            ['colaboradores', 'ponto-eletronico', 'avaliacao-desempenho', 'escala-trabalho'],
  'serviço':       ['servicos', 'assistencia', 'kanban-assistencia'],
  'assistência':   ['assistencia', 'kanban-assistencia', 'garantias'],
  'relatório':     ['relatorios-central', 'relatorios-financeiros', 'dashboard-executivo', 'kpis'],
  'indicador':     ['kpis', 'dashboard-executivo', 'cronograma-graficos'],
  'saas':          ['dashboard', 'onboarding', 'portal-cliente', 'landing-pages'],
  'whatsapp':      ['whatsapp', 'automacao-comercial'],
  'documento':     ['documentos', 'juridico', 'wiki', 'assinatura-digital'],
  'reuniÍo':       ['reunioes', 'okrs'],
  'meta':          ['okrs', 'kpis', 'dashboard-executivo'],
  'hora':          ['time-tracking', 'cronograma'],
  'banco':         ['contas-bancarias', 'conciliacao-bancaria', 'importar-extrato'],
  'custo':         ['bdi', 'composicoes', 'curva-abc', 'financeiro-obras'],
  'sinapi':        ['sinapi', 'pricelist', 'bdi'],
};

export default function SaaSBuilderPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);

  // Step 1 — Identidade
  const [productName, setProductName] = useState('');
  const [productSlug, setProductSlug] = useState('');
  const [productDesc, setProductDesc] = useState('');

  // Step 2 — SeleçÍo de módulos
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
  const [briefing, setBriefing] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todos');
  const [apenasDisponiveis, setApenasDisponiveis] = useState(false);
  const [verticalAtiva, setVerticalAtiva] = useState<string | null>(null);

  // Busca do catálogo
  const { data: catalogo = [], isLoading } = useQuery<Modulo[]>({
    queryKey: ['saas_module_catalog_v2'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saas_modulos_catalogo')
        .select('id, nome, slug, descricao, categoria, path_rota, icone_emoji, destaque, rota_ativa')
        .eq('ativo', true)
        .order('destaque', { ascending: false })
        .order('nome', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Filtro por busca + categoria + disponibilidade
  const modulosFiltrados = useMemo(() => {
    return catalogo.filter(m => {
      const matchCategoria = categoriaAtiva === 'Todos' || m.categoria === categoriaAtiva;
      const termoBusca = busca.toLowerCase();
      const matchBusca = !busca
        || m.nome.toLowerCase().includes(termoBusca)
        || (m.descricao ?? '').toLowerCase().includes(termoBusca)
        || m.categoria.toLowerCase().includes(termoBusca)
        || m.slug.toLowerCase().includes(termoBusca);
      const matchDisponivel = !apenasDisponiveis || m.rota_ativa;
      return matchCategoria && matchBusca && matchDisponivel;
    });
  }, [catalogo, busca, categoriaAtiva, apenasDisponiveis]);

  // Contagem por categoria
  const contagemPorCategoria = useMemo(() => {
    const counts: Record<string, number> = { Todos: catalogo.length };
    catalogo.forEach(m => {
      counts[m.categoria] = (counts[m.categoria] ?? 0) + 1;
    });
    return counts;
  }, [catalogo]);

  const toggleModule = (id: string) => {
    setSelectedModules(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Análise de briefing por IA (local, keywords)
  const handleAnalyzeBriefing = async () => {
    setIsAnalyzing(true);
    await new Promise(r => setTimeout(r, 1200));

    const texto = briefing.toLowerCase();
    const slugsSugeridos = new Set<string>();

    for (const [keyword, slugs] of Object.entries(KEYWORD_MAP)) {
      if (texto.includes(keyword)) {
        slugs.forEach(s => slugsSugeridos.add(s));
      }
    }

    const idsSugeridos = new Set<string>();
    catalogo.forEach(m => {
      if (slugsSugeridos.has(m.slug)) idsSugeridos.add(m.id);
    });

    setSelectedModules(idsSugeridos);
    setIsAnalyzing(false);
    toast({
      title: `${idsSugeridos.size} módulos sugeridos`,
      description: 'Revise e ajuste a seleçÍo antes de criar o produto.',
    });
  };

  // MutaçÍo — criar produto + associar módulos
  const createProductMutation = useMutation({
    mutationFn: async () => {
      const { data: prod, error: eProd } = await supabase
        .from('saas_produtos')
        .insert({ nome: productName, slug: productSlug, descricao: productDesc })
        .select('id')
        .single();
      if (eProd) throw eProd;

      const assoc = Array.from(selectedModules).map(modulo_id => ({
        produto_id: prod.id,
        modulo_id,
      }));

      if (assoc.length > 0) {
        const { error: eAssoc } = await supabase.from('saas_produtos_modulos').insert(assoc);
        if (eAssoc) throw eAssoc;
      }
      return prod.id;
    },
    onSuccess: () => {
      toast({ title: `Produto "${productName}" criado com sucesso!`, variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['saas_products_list'] });
      setStep(3);
    },
    onError: (err: any) => {
      toast({ title: 'Erro ao criar produto', description: err.message, variant: 'destructive' });
    },
  });

  // ── UI ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto p-6 md:p-10">

        {/* Cabeçalho */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="text-orange-500" size={28} />
              Construtor de Produtos SaaS
            </h1>
            <p className="text-gray-500 mt-1">
              Monte um produto SaaS selecionando os módulos que ele vai incluir.
            </p>
          </div>
          <button
            onClick={() => navigate('/admin-saas')}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft size={15} /> Voltar
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-10 select-none">
          {[
            { n: 1, label: 'Identidade' },
            { n: 2, label: 'Módulos' },
            { n: 3, label: 'Concluído' },
          ].map(({ n, label }, i, arr) => (
            <React.Fragment key={n}>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step > n ? 'bg-green-500 text-white'
                  : step === n ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 text-gray-400'
                }`}>
                  {step > n ? <CheckCircle size={14} /> : n}
                </div>
                <span className={`text-sm font-medium ${step === n ? 'text-gray-900' : 'text-gray-400'}`}>
                  {label}
                </span>
              </div>
              {i < arr.length - 1 && (
                <div className={`flex-1 h-px ${step > n ? 'bg-green-300' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── PASSO 1: IDENTIDADE ─────────────────────────── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-lg">
            <h2 className="text-lg font-bold text-gray-800 mb-6">Identidade do Produto</h2>
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Nome do Produto</label>
                <Input
                  placeholder="Ex: EasyEvents, WillHub, ClinicaFácil"
                  value={productName}
                  onChange={e => {
                    setProductName(e.target.value);
                    setProductSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Slug (URL)</label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">app.wg.com/</span>
                  <Input
                    placeholder="easy-events"
                    value={productSlug}
                    onChange={e => setProductSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">DescriçÍo</label>
                <Textarea
                  placeholder="Descreva o propósito deste produto SaaS..."
                  value={productDesc}
                  onChange={e => setProductDesc(e.target.value)}
                  rows={3}
                />
              </div>
              <Button
                onClick={() => setStep(2)}
                disabled={!productName.trim() || !productSlug.trim()}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                Próximo: Selecionar Módulos <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── PASSO 2: MÓDULOS ────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-6">

            {/* Seletor de Cenário de Negócio */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-bold text-gray-800">Atalho por Segmento</p>
                  <p className="text-xs text-gray-400">Selecione o tipo de negócio para pré-selecionar os módulos mais relevantes.</p>
                </div>
                {verticalAtiva && (
                  <button onClick={() => { setVerticalAtiva(null); setSelectedModules(new Set()); }} className="text-xs text-gray-400 hover:text-red-500 underline">
                    Limpar
                  </button>
                )}
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
                {VERTICAIS.map(v => (
                  <button
                    key={v.id}
                    onClick={() => {
                      if (verticalAtiva === v.id) {
                        setVerticalAtiva(null);
                        setSelectedModules(new Set());
                      } else {
                        setVerticalAtiva(v.id);
                        const ids = new Set<string>();
                        catalogo.forEach(m => { if (v.slugs.includes(m.slug)) ids.add(m.id); });
                        setSelectedModules(ids);
                        setCategoriaAtiva('Todos');
                      }
                    }}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all text-center ${
                      verticalAtiva === v.id
                        ? 'border-orange-400 bg-orange-50 shadow-sm'
                        : 'border-gray-100 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <span className="text-xl">{v.emoji}</span>
                    <span className={`text-[10px] font-semibold leading-tight ${verticalAtiva === v.id ? 'text-orange-700' : 'text-gray-500'}`}>
                      {v.label}
                    </span>
                    {verticalAtiva === v.id && (
                      <span className="text-[9px] text-orange-500 font-bold">
                        {v.slugs.filter(s => catalogo.some(m => m.slug === s)).length} módulos
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

          {/* Briefing IA */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="text-orange-500" size={18} />
                <h3 className="font-bold text-gray-800">Análise Inteligente por Briefing</h3>
              </div>
              <p className="text-sm text-gray-500 mb-3">
                Descreva o negócio do cliente e a IA sugere os módulos ideais.
              </p>
              <Textarea
                placeholder="Ex: 'Agência de eventos que precisa de CRM, orçamentos, contratos, cronograma e financeiro integrado...'"
                value={briefing}
                onChange={e => setBriefing(e.target.value)}
                rows={3}
                className="bg-white border-orange-100"
              />
              <Button
                onClick={handleAnalyzeBriefing}
                disabled={!briefing.trim() || isAnalyzing}
                variant="outline"
                className="mt-3 border-orange-300 text-orange-600 hover:bg-orange-100"
              >
                {isAnalyzing
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analisando...</>
                  : <><Sparkles className="mr-2 h-4 w-4" /> Sugerir Módulos</>
                }
              </Button>
            </div>

            {/* Filtros */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                  <Input
                    placeholder="Buscar módulos..."
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none text-sm text-gray-500">
                    <input
                      type="checkbox"
                      checked={apenasDisponiveis}
                      onChange={e => setApenasDisponiveis(e.target.checked)}
                      className="accent-green-500 w-3.5 h-3.5"
                    />
                    <span>Só disponíveis</span>
                  </label>
                  <span className="text-gray-300">|</span>
                  <span className="text-sm text-gray-500">
                    <span className="font-semibold text-orange-600">{selectedModules.size}</span> sel.
                  </span>
                  {selectedModules.size > 0 && (
                    <button onClick={() => setSelectedModules(new Set())} className="text-xs text-gray-400 hover:text-red-500 underline">
                      Limpar
                    </button>
                  )}
                </div>
              </div>

              {/* Tabs de categoria */}
              <div className="flex flex-wrap gap-2">
                {CATEGORIAS.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoriaAtiva(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      categoriaAtiva === cat
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                    {contagemPorCategoria[cat] != null && (
                      <span className={`ml-1.5 ${categoriaAtiva === cat ? 'text-orange-100' : 'text-gray-400'}`}>
                        {contagemPorCategoria[cat]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid de módulos */}
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-orange-400" size={28} />
              </div>
            ) : modulosFiltrados.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Package size={40} className="mx-auto mb-3 opacity-30" />
                <p>Nenhum módulo encontrado para "{busca}"</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {modulosFiltrados.map(modulo => {
                  const selected = selectedModules.has(modulo.id);
                  return (
                    <div
                      key={modulo.id}
                      onClick={() => toggleModule(modulo.id)}
                      className={`relative bg-white rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
                        selected
                          ? 'border-orange-400 bg-orange-50 shadow-sm'
                          : 'border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      {/* Badge topo direito */}
                      {selected ? (
                        <CheckCircle size={16} className="absolute top-3 right-3 text-orange-500" />
                      ) : modulo.destaque ? (
                        <Star size={12} className="absolute top-3 right-3 text-amber-400 fill-amber-400" />
                      ) : null}

                      {/* Badge disponibilidade */}
                      <span className={`absolute top-3 left-3 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        modulo.rota_ativa
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {modulo.rota_ativa ? '✓ Disponível' : '⏳ Em breve'}
                      </span>

                      <div className="text-2xl mt-5 mb-2">{modulo.icone_emoji}</div>

                      <p className={`text-sm font-bold leading-tight mb-1 ${selected ? 'text-orange-700' : 'text-gray-800'}`}>
                        {modulo.nome}
                      </p>

                      {modulo.descricao && (
                        <p className="text-xs text-gray-400 leading-snug line-clamp-2 mb-2">
                          {modulo.descricao}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-auto pt-1">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                          selected ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {modulo.categoria}
                        </span>
                        {modulo.path_rota && (
                          <span className="text-[10px] text-gray-300 font-mono flex items-center gap-0.5">
                            <ExternalLink size={9} />
                            {modulo.path_rota}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Rodapé com ações */}
            <div className="flex items-center justify-between pt-2 sticky bottom-0 bg-gray-50/80 backdrop-blur py-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
              </Button>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">
                  <b className="text-orange-600">{selectedModules.size}</b> módulo(s) selecionado(s)
                </span>
                <Button
                  onClick={() => createProductMutation.mutate()}
                  disabled={selectedModules.size === 0 || createProductMutation.isPending}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6"
                >
                  {createProductMutation.isPending
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando...</>
                    : <><Sparkles className="mr-2 h-4 w-4" /> Criar Produto SaaS</>
                  }
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── PASSO 3: SUCESSO ────────────────────────────── */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-green-500" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Produto Criado!</h2>
            <p className="text-gray-500 mb-1">
              <span className="font-semibold text-gray-800">"{productName}"</span> foi criado com{' '}
              <span className="font-semibold text-orange-600">{selectedModules.size} módulos</span>.
            </p>
            <p className="text-sm text-gray-400 mb-8">
              Agora associe tenants (clientes) a este produto em <b>Clientes SaaS</b>.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => navigate('/admin-saas/clientes')}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Ver Clientes SaaS
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/admin-saas/produtos')}
              >
                Ver Produtos
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setStep(1);
                  setProductName('');
                  setProductSlug('');
                  setProductDesc('');
                  setSelectedModules(new Set());
                  setBriefing('');
                }}
              >
                Criar Outro
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

