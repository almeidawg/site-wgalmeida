import { useNavigate } from 'react-router-dom';
import {
  Receipt,
  Zap,
  TrendingUp,
  TrendingDown,
  Calendar,
  FolderKanban,
  Target,
  Sparkles,
  Heart,
  ClipboardList,
  Award,
  Rocket,
  Star,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertTriangle,
  Clock,
  CheckCircle2,
  CreditCard,
  ChevronRight,
} from 'lucide-react';
import { useHabitos, useHumor, useMetas, useSonhos, useCursos, useSaude, useTerapia } from '@/modules/willhub';
import { useDashboardPessoal } from '@/modules/financeiro-pessoal/hooks';

const QUICK_LINKS = [
  { title: 'Plano Dopamina', description: 'Gestao do reservatorio TDAH', icon: Zap, path: '/sistema/william-hub/dopamina', color: '#A855F7' },
  { title: 'Disciplina', description: 'Habitos diarios e score', icon: Award, path: '/sistema/william-hub/habitos', color: '#F25C26' },
  { title: 'Meu Financeiro', description: 'Contas, lancamentos e cartoes', icon: Receipt, path: '/sistema/william-hub/financeiro', color: '#22C55E' },
  { title: 'Agenda', description: 'Compromissos e eventos', icon: Calendar, path: '/sistema/william-hub/agenda', color: '#8B5CF6' },
  { title: 'Projetos', description: 'Gerencie seus projetos', icon: FolderKanban, path: '/sistema/william-hub/projetos', color: '#EC4899' },
  { title: 'Theo', description: 'Cuidados e conquistas', icon: Star, path: '/sistema/william-hub/theo', color: '#3B82F6' },
  { title: 'Metas', description: 'Objetivos e progresso', icon: Target, path: '/sistema/william-hub/metas', color: '#F59E0B' },
  { title: 'Sonhos', description: 'Aspiracoes e desejos', icon: Sparkles, path: '/sistema/william-hub/sonhos', color: '#A855F7' },
  { title: 'Humor', description: 'Como voce esta se sentindo', icon: Heart, path: '/sistema/william-hub/humor', color: '#F97316' },
  { title: 'Notas', description: 'Anotacoes pessoais', icon: ClipboardList, path: '/sistema/william-hub/notas', color: '#06B6D4' },
  { title: 'Saude', description: 'Consultas e especialistas', icon: Heart, path: '/sistema/william-hub/saude', color: '#EF4444' },
  { title: 'Terapia', description: 'Sessoes e insights', icon: Heart, path: '/sistema/william-hub/terapia', color: '#8B5CF6' },
  { title: 'Desenvolvimento', description: 'Cursos e aprendizado', icon: Rocket, path: '/sistema/william-hub/cursos', color: '#06B6D4' },
];

export default function WillHubDashboard() {
  const navigate = useNavigate();
  const { data: dadosPessoais, loading: loadingPessoal } = useDashboardPessoal();
  const { disciplinaScore, habitosConcluidos } = useHabitos();
  const { humorHoje } = useHumor();
  const { metas } = useMetas();
  const { sonhos } = useSonhos();
  const { concluidos: cursosConcluidos } = useCursos();
  const { consultas } = useSaude();
  const { totalSessoes } = useTerapia();

  const now = new Date();
  const hora = now.getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  // Sistema de pontuacao global
  const metasConcluidas = metas.filter(m => m.status === 'concluida').length;
  const sonhosRealizados = sonhos.filter(s => s.status === 'realizado').length;
  const consultasConcluidas = consultas.filter(c => c.status === 'concluida').length;
  const cursosFinalizados = cursosConcluidos.length;

  const pontuacao = {
    habitos: habitosConcluidos * 5,
    metas: metasConcluidas * 50,
    sonhos: sonhosRealizados * 100,
    cursos: cursosFinalizados * 75,
    consultas: consultasConcluidas * 30,
    terapia: totalSessoes * 20,
    humor: humorHoje ? 10 : 0,
  };

  const totalPontos = Object.values(pontuacao).reduce((a, b) => a + b, 0);

  return (
    <div className="px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[26px] text-gray-900">{saudacao}, William</h1>
        <p className="text-sm text-gray-500 mt-1">
          {now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Conquistas / Score */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            <h2 className="text-[16px] text-gray-900">Conquistas WillHub</h2>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-2xl font-bold text-primary">{totalPontos}</span>
            <span className="text-xs text-gray-400">pts</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Habitos hoje', valor: pontuacao.habitos, detalhe: `${habitosConcluidos} concluidos`, cor: '#F25C26' },
            { label: 'Metas', valor: pontuacao.metas, detalhe: `${metasConcluidas} concluidas`, cor: '#F59E0B' },
            { label: 'Cursos', valor: pontuacao.cursos, detalhe: `${cursosFinalizados} finalizados`, cor: '#06B6D4' },
            { label: 'Saude', valor: pontuacao.consultas + pontuacao.terapia, detalhe: `${consultasConcluidas} consultas + ${totalSessoes} sessoes`, cor: '#8B5CF6' },
          ].map(item => (
            <div key={item.label} className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className="text-lg font-bold" style={{ color: item.cor }}>+{item.valor}</p>
              <p className="text-[10px] text-gray-400">{item.detalhe}</p>
            </div>
          ))}
        </div>
        {disciplinaScore > 0 && (
          <div className="mt-4 flex items-center gap-3">
            <span className="text-xs text-gray-500">Disciplina hoje</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${disciplinaScore}%` }} />
            </div>
            <span className="text-xs font-medium text-primary">{disciplinaScore}%</span>
          </div>
        )}
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {QUICK_LINKS.map(link => (
          <button key={link.path} onClick={() => navigate(link.path)}
            className="flex items-start gap-4 p-5 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-gray-300 transition-all text-left group">
            <div className="p-3 rounded-lg shrink-0" style={{ backgroundColor: `${link.color}15` }}>
              <link.icon className="w-6 h-6" style={{ color: link.color }} />
            </div>
            <div>
              <h3 className="text-[16px] text-gray-900 group-hover:text-primary transition-colors">{link.title}</h3>
              <p className="text-sm text-gray-500 mt-0.5">{link.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Minhas Finanças Pessoais */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-[16px] text-gray-900">Minhas Finanças</h3>
              <p className="text-sm text-gray-500">Controle pessoal do CEO</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/meu-financeiro')}
            className="text-sm text-orange-600 hover:text-orange-700 transition-colors flex items-center gap-1"
          >
            Ver completo <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {loadingPessoal ? (
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : dadosPessoais ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-orange-600 to-orange-500">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-4 h-4 text-white/80" />
                  <span className="text-xs text-white/80">Saldo Total</span>
                </div>
                <p className="text-xl text-white">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(dadosPessoais.saldo_total)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500 to-orange-400">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowUpCircle className="w-4 h-4 text-white/80" />
                  <span className="text-xs text-white/80">Receitas</span>
                </div>
                <p className="text-xl text-white">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(dadosPessoais.receitas_mes)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-orange-400 to-amber-400">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowDownCircle className="w-4 h-4 text-white/80" />
                  <span className="text-xs text-white/80">Despesas</span>
                </div>
                <p className="text-xl text-white">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(dadosPessoais.despesas_mes)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-400 to-amber-300">
                <div className="flex items-center gap-2 mb-2">
                  {dadosPessoais.balanco_mes >= 0
                    ? <TrendingUp className="w-4 h-4 text-white/80" />
                    : <TrendingDown className="w-4 h-4 text-white/80" />}
                  <span className="text-xs text-white/80">Balanço</span>
                </div>
                <p className={`text-xl ${dadosPessoais.balanco_mes >= 0 ? 'text-white' : 'text-red-600'}`}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(dadosPessoais.balanco_mes)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Alertas Pessoais
                </h4>
                <div className="space-y-2">
                  {dadosPessoais.lancamentos_vencidos > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-100 rounded-lg">
                      <Clock className="w-4 h-4 text-red-500" />
                      <span className="text-xs text-red-700"><strong>{dadosPessoais.lancamentos_vencidos}</strong> vencido(s)</span>
                    </div>
                  )}
                  {dadosPessoais.lancamentos_pendentes > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-100 rounded-lg">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span className="text-xs text-amber-700"><strong>{dadosPessoais.lancamentos_pendentes}</strong> pendente(s)</span>
                    </div>
                  )}
                  {dadosPessoais.lancamentos_vencidos === 0 && dadosPessoais.lancamentos_pendentes === 0 && (
                    <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs text-emerald-700">Tudo em dia!</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-500" />
                  Minhas Contas
                </h4>
                {dadosPessoais.contas.length > 0 ? (
                  <div className="space-y-2">
                    {dadosPessoais.contas.slice(0, 3).map((conta) => (
                      <div key={conta.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: conta.cor }} />
                          <span className="text-xs text-gray-600">{conta.nome}</span>
                        </div>
                        <span className="text-xs font-medium text-gray-900">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(conta.saldo_atual)}
                        </span>
                      </div>
                    ))}
                    {dadosPessoais.contas.length > 3 && (
                      <p className="text-xs text-gray-400 text-center">+{dadosPessoais.contas.length - 3} contas</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-4">Nenhuma conta cadastrada</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Wallet className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Dados nÍo disponíveis</p>
            <button type="button" onClick={() => navigate('/meu-financeiro')} className="mt-2 text-xs text-orange-600 hover:text-orange-700">
              Configurar finanças pessoais
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-5 bg-white border border-gray-200 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="text-[16px] text-gray-900">WillHub</h3>
        </div>
        <p className="text-sm text-gray-500">
          Seu painel pessoal integrado ao WG Easy. Cada conquista pontua — habitos, metas, cursos, consultas e terapia.
        </p>
      </div>
    </div>
  );
}

