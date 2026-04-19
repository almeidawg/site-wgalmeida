import SEO from '@/components/SEO'
import { Button } from '@/components/ui/button'
import { motion } from '@/lib/motion-lite'
import { withBasePath } from '@/utils/assetPaths'
import {
  ArrowRight, CheckCircle, Calculator, TrendingUp, Users,
  Shield, FileText, BarChart3, Building2, Phone, Zap, Layers3, Landmark
} from 'lucide-react'
import { COMPANY, OBRAEASY_PRECOS, PRODUCT_URLS, WG_PRODUCT_MESSAGES } from '@/data/company'
import { getPublicPageImageSrc } from '@/data/publicPageImageCatalog';

const ObraEasyLanding = () => {
  const obraEasyHeroImage = getPublicPageImageSrc('obraEasy', '/images/banners/ARQ.webp')
  const pageUrl = `${PRODUCT_URLS.site}/obraeasy`

  const planos = [
    {
      id: 'free',
      label: 'Gratuito',
      price: 'R$ 0',
      period: '/sempre',
      desc: 'Para conhecer a experiência',
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
        'Suporte prioritário',
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
      desc: 'Calcule o custo real da obra em segundos. O EVF usa referências de mercado e organiza a obra por etapas operacionais, materiais, mão de obra e produtos sem complicar a tomada de decisão.',
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
      desc: 'Cadastre empreiteiros, fornecedores e profissionais. Cada um sabe exatamente o que fazer e quando, com menos coordenação manual.',
    },
    {
      icon: Shield,
      titulo: 'Controle Total da Obra',
      desc: 'Tudo passa pela mesma leitura operacional: orçamentos, contratos, pagamentos, liberação de etapas e acompanhamento em tempo real, com menos ruído e mais previsibilidade.',
    },
    {
      icon: TrendingUp,
      titulo: 'ICCRI e Dados de Mercado',
      desc: 'SINAPI, CUB/SINDUSCON e outras bases entram como referência. O ICCRI transforma isso em leitura operacional WG, sem achismo e sem surpresa.',
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
      desc: 'Tipo de imóvel, metragem, padrão de acabamento e cidade em um fluxo direto e objetivo.',
    },
    {
      numero: '02',
      titulo: 'Receba o EVF completo',
      desc: 'Estudo de Viabilidade Financeira com custo por etapa operacional, materiais, mão de obra e cronograma.',
    },
    {
      numero: '03',
      titulo: 'Compartilhe com seu cliente',
      desc: 'Link público gerado automaticamente. Envie pelo WhatsApp ou e-mail com sua marca.',
    },
    {
      numero: '04',
      titulo: 'Acompanhe a execução',
      desc: 'Contratos, financeiro, equipes e etapas · tudo centralizado na mesma leitura operacional.',
    },
  ]

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ObraEasy · Plataforma de Gestão de Obras',
        description:
      'Experiência digital de gestão de obras com Estudo de Viabilidade Financeira (EVF), cronograma automático, contratos digitais e financeiro da obra. Para clientes finais, corretores e construtoras.',
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
            style={{ backgroundImage: `url(${withBasePath(obraEasyHeroImage)})` }}
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
              B2B para retrofit, reforma, incorporação leve e operação imobiliária
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.18 }}
              className="wg-page-hero-title"
            >
              Custo real, etapa operacional e <span className="text-wg-orange">execução controlada</span> no mesmo fluxo.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="wg-page-hero-subtitle max-w-3xl"
            >
              O ObraEasy conecta EVF, ICCRI, cronograma, financeiro e execução real para apoiar decisões de obra com menos achismo, mais previsibilidade e leitura comercial mais forte.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="wg-page-hero-body max-w-3xl"
            >
              {WG_PRODUCT_MESSAGES.obraeasyB2B}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.48 }}
              className="wg-page-hero-body max-w-3xl"
            >
              {WG_PRODUCT_MESSAGES.wgAutomationPromise}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.56 }}
              className="wg-page-hero-body max-w-3xl"
            >
              {WG_PRODUCT_MESSAGES.obraeasyCapture}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="wg-page-hero-actions"
            >
              <Button asChild className="btn-apple text-base px-6 py-3">
                <a href={`${PRODUCT_URLS.obraeasy}/evf4`} target="_blank" rel="noopener noreferrer">
                  <Calculator className="mr-2 w-4 h-4" />
                  Ver metodologia em ação
                  <ArrowRight className="ml-2 w-4 h-4" />
                </a>
              </Button>
              <Button asChild variant="outline" className="border-white/35 bg-white/5 px-6 py-3 text-sm text-white hover:border-white hover:bg-white hover:text-wg-black">
                <a href={COMPANY.ceoWhatsapp} target="_blank" rel="noopener noreferrer">
                  Fale com o CEO
                </a>
              </Button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-xs text-white/50"
            >
              Entrada rápida para validação · leitura executiva para decisores · implantação consultiva quando fizer sentido
            </motion.p>
          </div>
        </div>
      </section>

      {/* MECANISMO */ }
      <section className="section-padding-tight-top bg-white">
        <div className="container-custom">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-wg-orange text-sm tracking-widest uppercase mb-4 block">Mecanismo de decisão</span>
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black">
              Três camadas para sair do orçamento solto
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Calculator,
                title: 'EVF',
                desc: 'Leitura inicial de custo, prazo e sensibilidade para validar se a obra faz sentido antes de contratar no escuro.',
              },
              {
                icon: Layers3,
                title: 'ICCRI + Etapas WG',
                desc: 'A obra deixa de ser lista de itens e passa a ser uma sequência operacional com medição, aprovação, produção paralela e execução.',
              },
              {
                icon: Landmark,
                title: 'Financeiro + captura de valor',
                desc: 'A leitura conecta orçamento, contratação, realizado e potencial pós-obra para apoiar retrofit, revenda e obra de maior ticket.',
              },
            ].map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }} className="rounded-2xl bg-wg-gray-light p-8">
                <item.icon className="mb-4 h-10 w-10 text-wg-orange" />
                <h3 className="mb-3 text-xl font-inter text-wg-black">{item.title}</h3>
                <p className="text-sm leading-relaxed text-wg-gray font-light">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PARA QUEM É */}
      <section className="section-padding-tight-top bg-white">
        <div className="container-custom">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-wg-orange text-sm tracking-widest uppercase mb-4 block">Para quem é o ObraEasy</span>
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black">
              Uma experiência, três perfis de uso
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
            <Button asChild className="btn-apple">
              <a href={`${PRODUCT_URLS.obraeasy}/evf4`} target="_blank" rel="noopener noreferrer">
                <Zap className="mr-2 w-5 h-5" />
                Testar agora · é grátis
                <ArrowRight className="ml-2 w-5 h-5" />
              </a>
            </Button>
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
                <Button asChild className={`w-full rounded-2xl py-3 ${plano.destaque ? 'bg-wg-orange text-white hover:bg-wg-orange/90' : 'bg-wg-gray-light text-wg-black hover:bg-wg-gray-light/80'}`}>
                  <a href={plano.href} target="_blank" rel="noopener noreferrer">
                    {plano.cta}
                  </a>
                </Button>
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
              { num: 'EVF', label: 'estudo estruturado para decisão inicial' },
              { num: 'Cronograma', label: 'etapas e sequência operacional visíveis' },
              { num: 'SINAPI', label: 'base oficial de preços' },
              { num: 'Digital', label: 'fluxo online, sem papelada operacional' },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="text-3xl md:text-4xl font-inter font-light text-wg-orange mb-2">{stat.num}</div>
                <div className="text-wg-gray text-sm font-light">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* BASE METODOLOGICA */}
      <section className="section-padding bg-wg-gray-light">
        <div className="container-custom">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mx-auto max-w-5xl rounded-[2rem] bg-white p-8 md:p-12">
            <span className="mb-4 block text-center text-sm uppercase tracking-widest text-wg-orange">Base metodológica</span>
            <h2 className="mb-4 text-center text-3xl font-inter font-light text-wg-black md:text-4xl">
              Referência de mercado entra como base. A decisão nasce da metodologia WG.
            </h2>
            <p className="mx-auto mb-10 max-w-3xl text-center text-wg-gray font-light leading-relaxed">
              {WG_PRODUCT_MESSAGES.obraeasyBenchmarks}
            </p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-2xl bg-wg-gray-light p-6">
                <h3 className="mb-3 text-lg font-inter text-wg-black">Referências brasileiras</h3>
                <ul className="space-y-2 text-sm font-light text-wg-gray">
                  <li>SINAPI para composição oficial de custos</li>
                  <li>CUB / SINDUSCON para referência setorial</li>
                  <li>FipeZap para contexto de mercado imobiliário</li>
                </ul>
              </div>
              <div className="rounded-2xl bg-wg-gray-light p-6">
                <h3 className="mb-3 text-lg font-inter text-wg-black">Leitura proprietária WG</h3>
                <ul className="space-y-2 text-sm font-light text-wg-gray">
                  <li>ICCRI para categorias, serviços e composições</li>
                  <li>Etapas operacionais WG para sequência real da obra</li>
                  <li>Financeiro, medições e execução para validar o realizado</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="section-padding bg-gradient-to-br from-wg-black to-wg-black/90 text-white">
        <div className="container-custom text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-3xl mx-auto">
            <Zap className="w-12 h-12 mx-auto mb-6 text-wg-orange" />
            <h2 className="text-3xl md:text-4xl font-inter font-light mb-6">
              Coloque custo, etapa e execução na mesma conversa
            </h2>
            <p className="text-white/70 mb-10 text-lg leading-relaxed">
              Se a sua operação vende retrofit, reforma, implantação ou obra de maior ticket, a conversa certa não é só orçamento. É previsibilidade, método e execução controlada.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="btn-apple text-lg px-8 py-4">
                <a href={`${PRODUCT_URLS.obraeasy}/cadastro`} target="_blank" rel="noopener noreferrer">
                  Solicitar ativação
                  <ArrowRight className="ml-2 w-5 h-5" />
                </a>
              </Button>
              <a href={COMPANY.ceoWhatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-4 border-2 border-white text-white rounded-2xl hover:bg-white hover:text-wg-black transition-all text-lg">
                <Phone className="w-5 h-5" />
                Fale com o CEO · {COMPANY.ceoPhone}
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}

export default ObraEasyLanding
