import SEO from '@/components/SEO'
import { Button } from '@/components/ui/button'
import { motion } from '@/lib/motion-lite'
import { withBasePath } from '@/utils/assetPaths'
import {
  ArrowRight, CheckCircle, Calculator, TrendingUp, Users,
  Shield, FileText, BarChart3, Building2, Phone, Zap
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { OBRAEASY_PRECOS, PRODUCT_URLS } from '@/data/company'

const ObraEasyLanding = () => {
  const pageUrl = 'https://wgalmeida.com.br/obraeasy'

  const planos = [
    {
      id: 'free',
      label: 'Gratuito',
      price: 'R$ 0',
      period: '/sempre',
      desc: 'Para conhecer a plataforma',
      cor: '#60a5fa',
      destaque: false,
      features: [
        '1 Estudo de Viabilidade (EVF)',
        '1 projeto ativo',
        'Link público do EVF',
      ],
      cta: 'Começar grátis',
      href: `${PRODUCT_URLS.obraeasy}/cadastro`,
    },
    {
      id: 'pro',
      label: OBRAEASY_PRECOS.pro.label,
      price: OBRAEASY_PRECOS.pro.price,
      period: '/mês',
      desc: 'Para quem está reformando ou construindo',
      cor: '#f97316',
      destaque: true,
      features: [
        'EVFs ilimitados',
        'Projetos ilimitados',
        'Link público do EVF',
        'Comparativo de orçamentos',
        'Cronograma automático',
        'Contratos digitais',
        'Financeiro da obra',
      ],
      cta: 'Assinar Pro',
      href: `${PRODUCT_URLS.obraeasy}/planos`,
    },
    {
      id: 'business',
      label: OBRAEASY_PRECOS.business.label,
      price: OBRAEASY_PRECOS.business.price,
      period: '/mês',
      desc: 'Para construtores e gestores de múltiplas obras',
      cor: '#a855f7',
      destaque: false,
      features: [
        'Tudo do Pro',
        'White-label (sua marca no EVF)',
        'Múltiplos clientes e obras',
        'Diário de obra + análise de projeto',
        'Módulo financeiro por projeto',
        'Relatórios mensais automáticos',
        'Suporte prioritário 24h',
      ],
      cta: 'Assinar Business',
      href: `${PRODUCT_URLS.obraeasy}/planos`,
    },
    {
      id: 'solo',
      label: OBRAEASY_PRECOS.solo.label,
      price: OBRAEASY_PRECOS.solo.price,
      period: '/mês',
      desc: 'Para corretores que indicam clientes e ganham comissão',
      cor: '#f97316',
      destaque: false,
      features: [
        'Tudo do Business',
        'Painel de indicações rastreáveis',
        'Link exclusivo de indicação',
        'Comissão automática (5%) por cliente ativo',
        'Até 20 clientes indicados',
        'Relatório mensal de comissões',
      ],
      cta: 'Quero ser parceiro',
      href: PRODUCT_URLS.corretor,
    },
    {
      id: 'completo',
      label: OBRAEASY_PRECOS.completo.label,
      price: OBRAEASY_PRECOS.completo.price,
      period: '/mês',
      desc: 'Para imobiliárias e corretores de alto volume',
      cor: '#16a34a',
      destaque: false,
      features: [
        'Tudo do Solo',
        'Clientes ilimitados',
        'Site profissional com portfólio',
        'SEO local para sua região',
        'Comissão 5% recorrente por cliente',
        'Onboarding com especialista WG',
      ],
      cta: 'Assinar Completo',
      href: PRODUCT_URLS.corretor,
    },
  ]

  const funcionalidades = [
    {
      icon: Calculator,
      titulo: 'Estudo de Viabilidade Financeira (EVF)',
      desc: 'Calcule o custo real da obra em segundos. Baseado em dados reais de SINAPI, CUB/SINDUSCON e transações de mercado em São Paulo.',
    },
    {
      icon: BarChart3,
      titulo: 'Cronograma e Acompanhamento',
      desc: 'Gerencie etapas, prazos e tarefas. Metodologia ágil: cada etapa é validada antes de liberar a próxima.',
    },
    {
      icon: FileText,
      titulo: 'Contratos e Financeiro',
      desc: 'Contratos digitais, medições, pagamentos e relatórios financeiros da obra em um só lugar.',
    },
    {
      icon: Users,
      titulo: 'Gestão de Equipes e Fornecedores',
      desc: 'Cadastre empreiteiros, fornecedores e profissionais. Cada um sabe exatamente o que fazer e quando.',
    },
    {
      icon: Shield,
      titulo: 'Controle Total da Obra',
      desc: 'Tudo passa pelo sistema: orçamentos, contratos, pagamentos, liberação de etapas e acompanhamento em tempo real.',
    },
    {
      icon: TrendingUp,
      titulo: 'Índices ICCRI e Dados de Mercado',
      desc: 'Preços atualizados mensalmente com base nos índices oficiais da construção civil. Sem achismo, sem surpresa.',
    },
    {
      icon: FileText,
      titulo: 'Diário de Obra',
      desc: 'Registre fotos, medições, ocorrências e visitas por categoria. Timeline cronológica com exportação em PDF para o cliente.',
    },
    {
      icon: BarChart3,
      titulo: 'Módulo Financeiro por Projeto',
      desc: 'DRE simplificado, lançamentos de receitas e despesas, fluxo de caixa previsto vs realizado por projeto.',
    },
    {
      icon: Shield,
      titulo: 'Análise de Viabilidade e Risco',
      desc: '4 cenários (pessimista, base, otimista, stress), score de risco e alertas inteligentes sobre desvios de custo e prazo.',
    },
  ]

  const publicoAlvo = [
    {
      perfil: 'Quem vai reformar ou construir',
      desc: 'Entenda o custo real antes de começar. Acompanhe cada etapa sem precisar entender de obra.',
      icone: Building2,
    },
    {
      perfil: 'Corretor e Imobiliária',
      desc: 'Apresente o estudo de viabilidade para seu cliente junto com a proposta de venda. Fecha mais negócios.',
      icone: Users,
    },
    {
      perfil: 'Construtora e Empreiteiro',
      desc: 'Gerencie múltiplas obras, equipes e fornecedores com controle total e metodologia ágil.',
      icone: TrendingUp,
    },
  ]

  const comoFunciona = [
    {
      numero: '01',
      titulo: 'Informe os dados da obra',
      desc: 'Tipo de imóvel, metragem, padrão de acabamento e cidade. Leva menos de 2 minutos.',
    },
    {
      numero: '02',
      titulo: 'Receba o EVF completo',
      desc: 'Estudo de Viabilidade Financeira com custo por etapa, materiais, mão de obra e cronograma.',
    },
    {
      numero: '03',
      titulo: 'Compartilhe com seu cliente',
      desc: 'Link público gerado automaticamente. Envie pelo WhatsApp ou e-mail com sua marca.',
    },
    {
      numero: '04',
      titulo: 'Acompanhe a execução',
      desc: 'Contratos, financeiro, equipes e etapas · tudo centralizado no sistema.',
    },
  ]

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ObraEasy · Plataforma de Gestão de Obras',
    description:
      'Sistema de gestão de obras com Estudo de Viabilidade Financeira (EVF), cronograma automático, contratos digitais e financeiro da obra. Para clientes finais, corretores e construtoras.',
    url: pageUrl,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: [
      { '@type': 'Offer', price: '0', priceCurrency: 'BRL', name: 'Gratuito' },
      ...Object.values(OBRAEASY_PRECOS).map(p => ({ '@type': 'Offer', price: p.price.replace('R$ ', '').replace(',', '.'), priceCurrency: 'BRL', name: p.label })),
    ],
  }

  return (
    <>
      <SEO
        pathname="/obraeasy"
        title="ObraEasy · Gerencie sua Obra do Orçamento à Entrega"
        description="Plataforma de gestão de obras com EVF, cronograma, contratos e financeiro. Para clientes, corretores e construtoras. Grátis para começar."
        keywords="gestão de obras, estudo de viabilidade financeira, EVF, software para obras, orçamento de reforma, plataforma de obras, ObraEasy"
        url={pageUrl}
        schema={schema}
      />

      {/* HERO */}
      <section className="wg-page-hero wg-page-hero--store hero-under-header">
        <motion.div
          className="absolute inset-0 z-0"
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(${withBasePath('/images/banners/ARQ.webp')})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-wg-black/90 via-wg-black/70 to-wg-black" />
        </motion.div>

        <div className="container-custom">
          <div className="wg-page-hero-content px-4 pt-8 md:pt-10">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08 }}
              className="wg-page-hero-kicker text-wg-orange"
            >
              Plataforma de Gestão de Obras
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.18 }}
              className="wg-page-hero-title"
            >
              Gerencie sua obra do orçamento <span className="text-wg-orange">à entrega</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="wg-page-hero-subtitle max-w-3xl"
            >
              Estudo de Viabilidade Financeira, cronograma automático, contratos digitais e controle financeiro em uma plataforma simples e profissional.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="wg-page-hero-body max-w-3xl"
            >
              Dados de referência: SINAPI · CUB/SINDUSCON · FipeZAP, combinados com curadoria operacional WG Almeida.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="wg-page-hero-actions"
            >
              <a href="https://obraeasy.wgalmeida.com.br/evf4" target="_blank" rel="noopener noreferrer">
                <Button className="btn-apple text-base px-6 py-3">
                  <Calculator className="mr-2 w-4 h-4" />
                  Calcular minha obra grátis
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </a>
                      <a href="https://obraeasy.wgalmeida.com.br/landing/corretor" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-wg-black transition-all rounded-2xl px-6 py-3 text-sm">
                  Sou corretor ou parceiro
                </Button>
              </a>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-xs text-white/50"
            >
              Grátis para começar · Sem cartão de crédito · Cancele quando quiser
            </motion.p>
          </div>
        </div>
      </section>

      {/* PARA QUEM É */}
      <section className="section-padding-tight-top bg-white">
        <div className="container-custom">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-wg-orange text-sm tracking-widest uppercase mb-4 block">Para quem é o ObraEasy</span>
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black">
              Uma plataforma, três perfis de uso
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {publicoAlvo.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="bg-wg-gray-light rounded-2xl p-8 text-center">
                <p.icone className="w-12 h-12 text-wg-orange mx-auto mb-4" />
                <h3 className="text-xl font-inter text-wg-black mb-3">{p.perfil}</h3>
                <p className="text-wg-gray font-light leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="section-padding bg-wg-gray-light">
        <div className="container-custom">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-wg-orange text-sm tracking-widest uppercase mb-4 block">Como funciona</span>
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black">
              Do dado bruto ao estudo completo em minutos
            </h2>
          </motion.div>
          <div className="max-w-4xl mx-auto space-y-6">
            {comoFunciona.map((etapa, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm flex items-start gap-6">
                <div className="flex-shrink-0 w-16 h-16 bg-wg-orange rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">{etapa.numero}</span>
                </div>
                <div>
                  <h3 className="text-xl font-inter text-wg-black mb-2">{etapa.titulo}</h3>
                  <p className="text-wg-gray font-light">{etapa.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <a href="https://obraeasy.wgalmeida.com.br/evf4" target="_blank" rel="noopener noreferrer">
              <Button className="btn-apple">
                <Zap className="mr-2 w-5 h-5" />
                Testar agora · é grátis
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-wg-orange text-sm tracking-widest uppercase mb-4 block">O que está incluso</span>
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black">
              Tudo que você precisa para controlar a obra
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {funcionalidades.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-wg-gray-light rounded-2xl p-6">
                <f.icon className="w-10 h-10 text-wg-orange mb-4" />
                <h3 className="text-lg font-inter text-wg-black mb-2">{f.titulo}</h3>
                <p className="text-wg-gray font-light text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section className="section-padding bg-wg-gray-light">
        <div className="container-custom">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-wg-orange text-sm tracking-widest uppercase mb-4 block">Planos e preços</span>
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black mb-4">
              Escolha o plano ideal para sua obra
            </h2>
            <p className="text-wg-gray max-w-xl mx-auto">Cancele a qualquer momento. Sem fidelidade, sem taxa de adesão.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6 max-w-6xl mx-auto">
            {planos.map((plano, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className={`rounded-2xl p-8 relative ${plano.destaque ? 'bg-wg-black text-white ring-2 ring-wg-orange' : 'bg-white'}`}>
                {plano.destaque && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-wg-orange text-white text-xs px-4 py-1 rounded-full uppercase tracking-wider">
                    Mais popular
                  </span>
                )}
                <h3 className={`text-xl font-inter mb-1 ${plano.destaque ? 'text-white' : 'text-wg-black'}`}>{plano.label}</h3>
                <p className={`text-sm mb-4 ${plano.destaque ? 'text-white/60' : 'text-wg-gray'}`}>{plano.desc}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className={`text-3xl font-light ${plano.destaque ? 'text-white' : 'text-wg-black'}`}>{plano.price}</span>
                  <span className={`text-sm ${plano.destaque ? 'text-white/50' : 'text-wg-gray'}`}>{plano.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plano.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: plano.cor }} />
                      <span className={`text-sm font-light ${plano.destaque ? 'text-white/80' : 'text-wg-gray'}`}>{f}</span>
                    </li>
                  ))}
                </ul>
                <a href={plano.href} target="_blank" rel="noopener noreferrer">
                  <Button className={`w-full rounded-2xl py-3 ${plano.destaque ? 'bg-wg-orange text-white hover:bg-wg-orange/90' : 'bg-wg-gray-light text-wg-black hover:bg-wg-gray-light/80'}`}>
                    {plano.cta}
                  </Button>
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CREDIBILIDADE */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { num: '15+', label: 'anos de experiência em obra' },
              { num: '200+', label: 'obras entregues em SP' },
              { num: 'SINAPI', label: 'base oficial de preços' },
              { num: '100%', label: 'online, sem papel' },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="text-3xl md:text-4xl font-inter font-light text-wg-orange mb-2">{stat.num}</div>
                <div className="text-wg-gray text-sm font-light">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="section-padding bg-gradient-to-br from-wg-black to-wg-black/90 text-white">
        <div className="container-custom text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-3xl mx-auto">
            <Zap className="w-12 h-12 mx-auto mb-6 text-wg-orange" />
            <h2 className="text-3xl md:text-4xl font-inter font-light mb-6">
              Comece grátis hoje mesmo
            </h2>
            <p className="text-white/70 mb-10 text-lg leading-relaxed">
              Crie sua conta, calcule o custo da sua obra e receba o Estudo de Viabilidade
              Financeira completo em menos de 3 minutos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://obraeasy.wgalmeida.com.br/cadastro" target="_blank" rel="noopener noreferrer">
                <Button className="btn-apple text-lg px-8 py-4">
                  Criar conta grátis
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </a>
              <a href="tel:+5511984650002" className="inline-flex items-center gap-2 px-6 py-4 border-2 border-white text-white rounded-2xl hover:bg-white hover:text-wg-black transition-all text-lg">
                <Phone className="w-5 h-5" />
                +55 (11) 98465-0002
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}

export default ObraEasyLanding
