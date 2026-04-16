import SEO from '@/components/SEO'
import { Button } from '@/components/ui/button'
import { motion } from '@/lib/motion-lite'
import { withBasePath } from '@/utils/assetPaths'
import {
  ArrowRight, CheckCircle, MapPin, TrendingUp, Users,
  Shield, BarChart3, Building2, Phone, Zap, Calculator, Link2
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { COMPANY, EASYREALSTATE_PRECOS, PRODUCT_URLS, WG_PRODUCT_MESSAGES } from '@/data/company';

const EasyRealStateLanding = () => {
  const pageUrl = `${PRODUCT_URLS.site}/easy-real-state`

  const planos = [
    {
      label: 'Cálculo Público',
      price: 'R$ 0',
      period: '/entrada',
      desc: 'Para validar a metodologia',
      cor: '#60a5fa',
      destaque: false,
      features: [
        'AVM público em São Paulo',
        'Link para compartilhar',
        'Sem cartão e sem login',
      ],
      cta: 'Abrir cálculo',
      href: `${PRODUCT_URLS.easyrealstate}/calculo`,
    },
    {
      label: 'Trial Assistido',
      price: '7 dias',
      period: '/ativação',
      desc: 'Para validar aderência com apoio da equipe',
      cor: '#f97316',
      destaque: true,
      features: [
        'Cadastro validado pela equipe',
        'Acesso inicial ao núcleo do produto',
        'Onboarding assistido',
        'Leitura de casos reais de captação',
        'Suporte por WhatsApp',
        'Sem cartão de crédito',
      ],
      cta: 'Solicitar trial',
      href: `${PRODUCT_URLS.easyrealstate}/cadastro`,
    },
    {
      label: 'Site + Sistema',
      price: EASYREALSTATE_PRECOS.imobiliaria.price,
      period: '',
      desc: 'Para operação imobiliária completa',
      cor: '#a855f7',
      destaque: false,
      features: [
        'Site imobiliário com sua marca',
        'Sistema EasyRealState no mesmo fluxo',
        'Estrutura para time comercial',
        'Projeto e implantação consultiva',
        'White-label por tenant',
        'Suporte prioritário',
      ],
      cta: 'Falar com consultor',
      href: 'tel:+5511984650002',
    },
  ]

  const funcionalidades = [
    {
      icon: Calculator,
      titulo: 'AVM comercial com leitura real',
      desc: 'Preço por m² com transações reais, regras de micro-mercado e fatores comerciais do imóvel, sem exigir leitura técnica pesada do usuário.',
    },
    {
      icon: MapPin,
      titulo: 'Cobertura por Bairro',
      desc: 'Itaim Bibi, Pinheiros, Jardins, Moema, Cerqueira César, Brooklin e muito mais. Dados segmentados por tipologia e padrão.',
    },
    {
      icon: Link2,
      titulo: 'Link compartilhável de avaliação',
      desc: 'O corretor consegue enviar a leitura ao cliente sem reescrever argumento manualmente, com a lógica pesada já organizada por trás.',
    },
    {
      icon: BarChart3,
      titulo: 'Faixa e contexto de mercado',
      desc: 'Não é um número solto. O resultado mostra faixa estimada, contexto do bairro e leitura auxiliar de oferta de forma objetiva e acionável.',
    },
    {
      icon: Shield,
      titulo: 'Dados Verificados',
      desc: 'Fontes: transações reais, comparáveis de mercado e metodologia operacional revisada. Leitura transparente da origem dos dados.',
    },
    {
      icon: TrendingUp,
      titulo: 'Núcleo operacional em evolução',
      desc: 'Leads, imóveis, agenda e pipeline já aparecem no produto e evoluem para a operação comercial completa.',
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
      desc: 'Link público com faixa estimada e leitura comercial do imóvel. Credibilidade técnica na proposta.',
    },
    {
      numero: '04',
      titulo: 'Evolua para o próximo passo',
      desc: 'Quando fizer sentido, o ecossistema conecta AVM, ICCRI, EVF e estudo de reforma no mesmo raciocínio comercial.',
    },
  ]

  // Duas modalidades de contratação
  const modalidades = [
    {
      titulo: 'Somente o Sistema',
      subtitulo: 'EasyRealState SaaS',
      desc: 'Use o AVM público e solicite o trial assistido para validar a aderência da experiência antes de estruturar a operação completa.',
      itens: [
        'AVM público com dados reais',
        'Trial assistido com a equipe',
        'Link de compartilhamento',
        'Base para evolução operacional',
        'Entrada sem cartão',
      ],
      cta: 'Solicitar trial',
      href: `${PRODUCT_URLS.easyrealstate}/cadastro`,
      destaque: false,
    },
    {
      titulo: 'Site + Sistema',
      subtitulo: 'Solução completa personalizada',
      desc: 'Site imobiliário profissional com catálogo, operação comercial e a leitura Easy Real State conectada ao ecossistema WG. Projeto consultivo da WG BuildTech.',
      itens: [
        'Site institucional com sua marca',
        'Catálogo de imóveis exclusivos',
        'Área do corretor parceiro (login)',
        'Operação comercial estruturada',
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
      'Experiência digital para corretores e imobiliárias lerem o valor de mercado de imóveis em São Paulo com base transacional, leitura comercial e trial assistido.',
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
        description="Use o EasyRealState para ler valor de mercado com base real em São Paulo. AVM comercial, link compartilhável e trial assistido para corretores e imobiliárias."
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
              B2B para corretores, imobiliárias e decisores de investimento
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.18 }}
              className="wg-page-hero-title"
            >
              Valor atual, fechamento real e <span className="text-wg-orange">captura de valor</span> na mesma leitura.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="wg-page-hero-subtitle max-w-3xl"
            >
              O Easy Real State cruza AVM, ITBI, contexto de mercado e potencial pós-obra para apoiar decisões imobiliárias de maior complexidade e ticket.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="wg-page-hero-body max-w-3xl"
            >
              {WG_PRODUCT_MESSAGES.easyRealStateB2B}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.48 }}
              className="wg-page-hero-body max-w-3xl"
            >
              {WG_PRODUCT_MESSAGES.wgExperienceCore}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.54 }}
              className="wg-page-hero-body max-w-3xl"
            >
              {WG_PRODUCT_MESSAGES.easyRealStateConfidence}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="wg-page-hero-actions"
            >
              <a href={`${PRODUCT_URLS.easyrealstate}/calculo`} target="_blank" rel="noopener noreferrer">
                <Button className="btn-apple text-base px-6 py-3">
                  <Calculator className="mr-2 w-4 h-4" />
                  Ver metodologia em ação
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </a>
              <a href={COMPANY.ceoWhatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-2xl border border-white/45 bg-white/5 px-6 py-3 text-sm text-white transition-colors hover:bg-white hover:text-wg-black">
                Fale com o CEO
              </a>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.62 }}
              className="text-xs text-white/40"
            >
              AVM · ITBI · potencial pós-obra · tese experimental, assistida ou defensável conforme a base real do caso
            </motion.p>
          </div>
        </div>
      </section>

      <section className="section-padding-tight-top bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-orange-100 bg-orange-50 p-6">
              <span className="text-xs tracking-widest uppercase text-orange-700 block mb-2">Camada 1</span>
              <h3 className="text-xl font-inter text-wg-black mb-2">AVM · valor atual</h3>
              <p className="text-sm text-wg-gray font-light">
                Preço por m², comparáveis, contexto de bairro e score de confiança.
              </p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-6">
              <span className="text-xs tracking-widest uppercase text-sky-700 block mb-2">Camada 2</span>
              <h3 className="text-xl font-inter text-wg-black mb-2">ITBI · fechamento real</h3>
              <p className="text-sm text-wg-gray font-light">
                Ticket real, liquidez e faixa observada de fechamento no bairro ou CEP.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6">
              <span className="text-xs tracking-widest uppercase text-emerald-700 block mb-2">Camada 3</span>
              <h3 className="text-xl font-inter text-wg-black mb-2">Pós-obra · captura</h3>
              <p className="text-sm text-wg-gray font-light">
                Potencial pós-obra com base em custo real, escopo real e inteligência operacional WG.
              </p>
            </div>
            <div className="rounded-2xl border border-fuchsia-100 bg-fuchsia-50 p-6">
              <span className="text-xs tracking-widest uppercase text-fuchsia-700 block mb-2">Camada 4</span>
              <h3 className="text-xl font-inter text-wg-black mb-2">Confiança da tese</h3>
              <p className="text-sm text-wg-gray font-light">
                A leitura não precisa fingir certeza. O motor indica quando a tese ainda é experimental, quando já está assistida por base real e quando começa a ficar defensável.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* DUAS MODALIDADES */}
      <section className="section-padding-tight-top bg-wg-gray-light">
        <div className="container-custom">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-wg-orange text-sm tracking-widest uppercase mb-4 block">Duas formas de contratar</span>
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black">
              Validação assistida ou operação imobiliária completa
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
            <span className="text-wg-orange text-sm tracking-widest uppercase mb-4 block">Mecanismo de decisão</span>
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black">
              Do valor do ativo ao potencial de captura
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
            <span className="text-wg-orange text-sm tracking-widest uppercase mb-4 block">Recursos da experiência</span>
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

      <section className="section-padding bg-white">
        <div className="container-custom">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-4xl mx-auto text-center mb-10">
            <span className="text-wg-orange text-sm tracking-widest uppercase mb-4 block">Base metodológica</span>
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black mb-4">
              Desenvolvido com leitura de mercado nacional e internacional
            </h2>
            <p className="text-wg-gray font-light leading-relaxed">
              {WG_PRODUCT_MESSAGES.easyRealStateBenchmarks}
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="rounded-2xl bg-wg-gray-light p-6">
              <h3 className="text-lg font-inter text-wg-black mb-3">Referências brasileiras</h3>
              <ul className="space-y-2 text-sm text-wg-gray font-light">
                <li>• Loft Dados</li>
                <li>• FipeZap</li>
                <li>• DataZAP</li>
              </ul>
            </div>
            <div className="rounded-2xl bg-wg-gray-light p-6">
              <h3 className="text-lg font-inter text-wg-black mb-3">Referências internacionais</h3>
              <ul className="space-y-2 text-sm text-wg-gray font-light">
                <li>• Zillow Zestimate</li>
                <li>• HouseCanary</li>
                <li>• Redfin</li>
              </ul>
            </div>
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
              Se o ativo pede decisão séria, a leitura também precisa ser séria
            </h2>
            <p className="text-white/70 mb-10 text-lg leading-relaxed">
              Use o Easy Real State para defender valor atual, fechamento real e potencial pós-obra com muito mais clareza comercial e técnica.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={`${PRODUCT_URLS.easyrealstate}/calculo`} target="_blank" rel="noopener noreferrer">
                <Button className="btn-apple text-lg px-8 py-4">
                  <Zap className="mr-2 w-5 h-5" />
                  Ver metodologia em ação
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </a>
              <a href={`tel:${COMPANY.ceoPhoneRaw}`} className="inline-flex items-center gap-2 px-6 py-4 border-2 border-white text-white rounded-2xl hover:bg-white hover:text-wg-black transition-all text-lg">
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

export default EasyRealStateLanding

