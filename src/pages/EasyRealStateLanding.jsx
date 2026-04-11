import SEO from '@/components/SEO'
import { Button } from '@/components/ui/button'
import { motion } from '@/lib/motion-lite'
import { withBasePath } from '@/utils/assetPaths'
import {
  ArrowRight, CheckCircle, MapPin, TrendingUp, Users,
  Shield, BarChart3, Building2, Phone, Zap, Calculator, Link2
} from 'lucide-react'
import { Link } from 'react-router-dom'

const EasyRealStateLanding = () => {
  const pageUrl = 'https://wgalmeida.com.br/easy-real-state'

  const planos = [
    {
      label: 'Gratuito',
      price: 'R$ 0',
      period: '/sempre',
      desc: '3 avaliações por mês',
      cor: '#60a5fa',
      destaque: false,
      features: [
        '3 cálculos de m²/mês',
        'Dados reais de mercado',
        'Link para compartilhar',
      ],
      cta: 'Começar grátis',
      href: 'https://easyrealstate.wgalmeida.com.br/calculo',
    },
    {
      label: 'Pro Corretor',
      price: 'R$ 49',
      period: '/mês',
      desc: 'Para corretores autônomos',
      cor: '#f97316',
      destaque: true,
      features: [
        'Avaliações ilimitadas',
        'Histórico de análises',
        'Link personalizado para cliente',
        'Integração com ObraEasy (EVF)',
        'Relatório em PDF',
        'Suporte por WhatsApp',
      ],
      cta: 'Assinar Pro',
      href: 'https://easyrealstate.wgalmeida.com.br/calculo',
    },
    {
      label: 'Imobiliária',
      price: 'R$ 149',
      period: '/mês',
      desc: 'Para times e imobiliárias',
      cor: '#a855f7',
      destaque: false,
      features: [
        'Tudo do Pro',
        'Múltiplos corretores',
        'White-label (sua marca)',
        'Dashboard com métricas',
        'API de integração',
        'Suporte prioritário',
      ],
      cta: 'Falar com consultor',
      href: 'tel:+5511984650002',
    },
  ]

  const funcionalidades = [
    {
      icon: Calculator,
      titulo: 'Calculadora de Valor de Mercado',
      desc: 'Preço por m² por bairro em São Paulo, baseado em transações reais (FipeZAP, DataZAP, QuintoAndar). Atualizado continuamente.',
    },
    {
      icon: MapPin,
      titulo: 'Cobertura por Bairro',
      desc: 'Itaim Bibi, Pinheiros, Jardins, Moema, Cerqueira César, Brooklin e muito mais. Dados segmentados por tipologia e padrão.',
    },
    {
      icon: Link2,
      titulo: 'Link de Reforma Integrado',
      desc: 'Após o cálculo do valor, seu cliente vê o custo estimado de reforma via ObraEasy. Dois estudos em um · na mesma conversa.',
    },
    {
      icon: BarChart3,
      titulo: 'Relatório Profissional',
      desc: 'PDF pronto para enviar ao cliente. Valor estimado, faixa mínima e máxima, bairro, tipologia e fonte dos dados.',
    },
    {
      icon: Shield,
      titulo: 'Dados Verificados',
      desc: 'Fontes: FipeZAP, DataZAP, QuintoAndar e base própria de 53+ transações reais em SP. Metodologia transparente.',
    },
    {
      icon: TrendingUp,
      titulo: 'Histórico e Pipeline',
      desc: 'Salve todas as análises e acompanhe o histórico de cada cliente e imóvel. Seu CRM de avaliação imobiliária.',
    },
  ]

  const bairros = [
    'Itaim Bibi', 'Pinheiros', 'Jardins', 'Moema', 'Cerqueira César',
    'Brooklin', 'Vila Nova Conceição', 'Campo Belo', 'Higienópolis',
    'Vila Mariana', 'Morumbi', 'Perdizes',
  ]

  const comoFunciona = [
    {
      numero: '01',
      titulo: 'Informe o imóvel',
      desc: 'Bairro, tipologia (apartamento ou casa), área em m² e padrão de acabamento.',
    },
    {
      numero: '02',
      titulo: 'Receba o valor estimado',
      desc: 'Preço por m² baseado em transações reais do mercado. Faixa mínima, estimada e máxima.',
    },
    {
      numero: '03',
      titulo: 'Envie para seu cliente',
      desc: 'Link público ou PDF profissional com sua marca. Credibilidade técnica na proposta.',
    },
    {
      numero: '04',
      titulo: 'Ofereça o estudo de reforma',
      desc: 'Com um clique, seu cliente acessa o ObraEasy e descobre quanto custa reformar o imóvel.',
    },
  ]

  // Duas modalidades de contratação
  const modalidades = [
    {
      titulo: 'Somente o Sistema',
      subtitulo: 'EasyRealState SaaS',
      desc: 'Acesse a calculadora de valor de mercado e gerencie suas avaliações. Ideal para quem já tem site próprio ou não precisa de presença digital nova.',
      itens: [
        'Calculadora de m² com dados reais',
        'Histórico e gestão de análises',
        'Link de compartilhamento',
        'Integração com ObraEasy',
        'Planos a partir de R$0',
      ],
      cta: 'Criar conta grátis',
      href: 'https://easyrealstate.wgalmeida.com.br/calculo',
      destaque: false,
    },
    {
      titulo: 'Site + Sistema',
      subtitulo: 'Solução completa personalizada',
      desc: 'Site imobiliário profissional com catálogo de imóveis, área do corretor, CRM completo e o sistema EasyRealState integrado. Projeto desenvolvido pela WG BuildTech.',
      itens: [
        'Site institucional com sua marca',
        'Catálogo de imóveis exclusivos',
        'Área do corretor parceiro (login)',
        'CRM completo (leads, pipeline, comissões)',
        'Sistema EasyRealState integrado',
        'Suporte e manutenção inclusos',
      ],
      cta: 'Falar com consultor',
      href: 'tel:+5511984650002',
      destaque: true,
    },
  ]

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'EasyRealState · Calculadora de Valor Imobiliário',
    description:
      'Plataforma para corretores e imobiliárias calcular o valor de mercado de imóveis em São Paulo. Dados reais de FipeZAP, DataZAP e QuintoAndar. Integração com estudo de reforma via ObraEasy.',
    url: pageUrl,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: [
      { '@type': 'Offer', price: '0', priceCurrency: 'BRL', name: 'Gratuito' },
      { '@type': 'Offer', price: '49', priceCurrency: 'BRL', name: 'Pro Corretor' },
      { '@type': 'Offer', price: '149', priceCurrency: 'BRL', name: 'Imobiliária' },
    ],
  }

  return (
    <>
      <SEO
        pathname="/easy-real-state"
        title="EasyRealState · Calculadora de Valor de Imóvel para Corretores"
        description="Calcule o valor de mercado de imóveis em São Paulo com dados reais. Para corretores e imobiliárias. Integrado com estudo de reforma ObraEasy. Grátis para começar."
        keywords="calculadora valor imóvel, preço m² são paulo, avaliação imobiliária, ferramenta corretor, software imobiliário, EasyRealState, quanto vale meu imóvel"
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
            className="absolute inset-0 bg-cover bg-center opacity-25"
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
              Para Corretores e Imobiliárias
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.18 }}
              className="wg-page-hero-title"
            >
              Quanto vale o imóvel <span className="text-wg-orange">do seu cliente?</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="wg-page-hero-subtitle max-w-3xl"
            >
              Calculadora de valor de mercado por m² com dados reais de São Paulo. Apresente avaliações profissionais em segundos e ainda mostre o custo de reforma.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="wg-page-hero-body max-w-3xl"
            >
              Dados: FipeZAP · DataZAP · QuintoAndar · 53+ transações reais em SP.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="wg-page-hero-actions"
            >
              <a href="https://easyrealstate.wgalmeida.com.br/calculo" target="_blank" rel="noopener noreferrer">
                <Button className="btn-apple text-base px-6 py-3">
                  <Calculator className="mr-2 w-4 h-4" />
                  Calcular agora · é grátis
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </a>
              <a href="tel:+5511984650002" className="inline-flex items-center justify-center rounded-2xl border border-white/45 bg-white/5 px-6 py-3 text-sm text-white transition-colors hover:bg-white hover:text-wg-black">
                Quero site + sistema
              </a>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-xs text-white/40"
            >
              Grátis para começar · Sem cartão de crédito
            </motion.p>
          </div>
        </div>
      </section>

      {/* DUAS MODALIDADES */}
      <section className="section-padding-tight-top bg-wg-gray-light">
        <div className="container-custom">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-wg-orange text-sm tracking-widest uppercase mb-4 block">Duas formas de usar</span>
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black">
              Só o sistema ou a solução completa
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {modalidades.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className={`rounded-2xl p-8 relative ${m.destaque ? 'bg-wg-black text-white ring-2 ring-wg-orange' : 'bg-white'}`}>
                {m.destaque && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-wg-orange text-white text-xs px-4 py-1 rounded-full uppercase tracking-wider">
                    Solução completa
                  </span>
                )}
                <span className={`text-xs tracking-widest uppercase mb-2 block ${m.destaque ? 'text-wg-orange' : 'text-wg-orange'}`}>{m.subtitulo}</span>
                <h3 className={`text-2xl font-inter mb-3 ${m.destaque ? 'text-white' : 'text-wg-black'}`}>{m.titulo}</h3>
                <p className={`text-sm mb-6 leading-relaxed ${m.destaque ? 'text-white/60' : 'text-wg-gray'}`}>{m.desc}</p>
                <ul className="space-y-3 mb-8">
                  {m.itens.map((item, j) => (
                    <li key={j} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-wg-orange flex-shrink-0" />
                      <span className={`text-sm font-light ${m.destaque ? 'text-white/80' : 'text-wg-gray'}`}>{item}</span>
                    </li>
                  ))}
                </ul>
                <a href={m.href} target={m.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
                  <Button className={`w-full rounded-2xl py-3 ${m.destaque ? 'bg-wg-orange text-white hover:bg-wg-orange/90' : 'bg-wg-gray-light text-wg-black hover:bg-wg-gray-light/80'}`}>
                    {m.cta} <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </a>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-wg-gray text-sm mt-8 max-w-2xl mx-auto">
            Projeto de site personalizado desenvolvido pela WG BuildTech para corretoras e imobiliárias.
            Baseado no projeto Capadócia Brokers · site de exclusividades imobiliárias premium em São Paulo.
          </p>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-wg-orange text-sm tracking-widest uppercase mb-4 block">Como funciona</span>
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black">
              Do valor do imóvel ao custo da reforma · em um clique
            </h2>
          </motion.div>
          <div className="max-w-4xl mx-auto space-y-6">
            {comoFunciona.map((etapa, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-wg-gray-light rounded-2xl p-6 shadow-sm flex items-start gap-6">
                <div className="flex-shrink-0 w-16 h-16 bg-wg-orange rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">{etapa.numero}</span>
                </div>
                <div>
                  <h3 className="text-xl font-inter text-wg-black mb-2">{etapa.titulo}</h3>
                  <p className="text-wg-gray font-light">{etapa.desc}</p>
                  {i === 3 && (
                    <span className="inline-block mt-2 text-xs bg-wg-orange/10 text-wg-orange px-3 py-1 rounded-full">
                      ✦ Integrado com ObraEasy · exclusivo
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section className="section-padding bg-wg-gray-light">
        <div className="container-custom">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-wg-orange text-sm tracking-widest uppercase mb-4 block">Recursos da plataforma</span>
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black">
              Tudo que um corretor precisa para fechar mais negócios
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {funcionalidades.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6">
                <f.icon className="w-10 h-10 text-wg-orange mb-4" />
                <h3 className="text-lg font-inter text-wg-black mb-2">{f.titulo}</h3>
                <p className="text-wg-gray font-light text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* BAIRROS */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <span className="text-wg-orange text-sm tracking-widest uppercase mb-4 block">Cobertura atual</span>
            <h2 className="text-3xl font-inter font-light text-wg-black mb-3">Bairros com dados reais de mercado</h2>
            <p className="text-wg-gray max-w-xl mx-auto">São Paulo · dados de transações reais atualizados continuamente</p>
          </motion.div>
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {bairros.map((b, i) => (
              <motion.span key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="inline-flex items-center gap-1 px-4 py-2 bg-wg-gray-light rounded-full text-sm text-wg-black">
                <MapPin className="w-3 h-3 text-wg-orange" />
                {b}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section className="section-padding bg-wg-gray-light">
        <div className="container-custom">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-wg-orange text-sm tracking-widest uppercase mb-4 block">Planos</span>
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black mb-4">
              Do corretor autônomo à grande imobiliária
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
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
                <a href={plano.href} target={plano.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
                  <Button className={`w-full rounded-2xl py-3 ${plano.destaque ? 'bg-wg-orange text-white hover:bg-wg-orange/90' : 'bg-wg-gray-light text-wg-black hover:bg-wg-gray-light/80'}`}>
                    {plano.cta}
                  </Button>
                </a>
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
            <h2 className="text-3xl md:text-4xl font-inter font-light mb-4">
              Feche mais negócios com dados reais
            </h2>
            <p className="text-white/70 mb-10 text-lg leading-relaxed">
              Apresente avaliações profissionais aos seus clientes e ainda mostre o custo de
              reforma do imóvel · tudo em uma só ferramenta.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://easyrealstate.wgalmeida.com.br/calculo" target="_blank" rel="noopener noreferrer">
                <Button className="btn-apple text-lg px-8 py-4">
                  <Zap className="mr-2 w-5 h-5" />
                  Calcular agora · grátis
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

export default EasyRealStateLanding

