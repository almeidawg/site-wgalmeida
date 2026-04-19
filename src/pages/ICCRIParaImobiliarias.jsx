import ICCRILinksBlock from '@/components/ICCRILinksBlock'
import LizAssistant from '@/components/LizAssistant'
import SEO from '@/components/SEO'
import { trackCtaClick } from '@/lib/analytics'
import { motion } from '@/lib/motion-lite'
import { ArrowRight, Building2, Landmark, LineChart, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PRODUCT_URLS, WG_PRODUCT_MESSAGES } from '@/data/company';

const PAGE_URL = 'https://wgalmeida.com.br/iccri-para-imobiliarias'

const schema = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${PAGE_URL}#webpage`,
    url: PAGE_URL,
    name: 'ICCRI para Imobiliarias, Corretores e Bancos',
    description:
      'Aplicacao do ICCRI para precificacao, simulacao de reforma e leitura de valorizacao no mercado imobiliario.',
    isPartOf: { '@id': 'https://wgalmeida.com.br/#website' },
    about: { '@id': 'https://wgalmeida.com.br/iccri#dataset-iccri' },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'ICCRI para Imobiliárias',
    serviceType: 'Análise técnica de custo de reforma e viabilidade imobiliária',
    provider: {
      '@type': 'Organization',
      '@id': 'https://wgalmeida.com.br/#organization',
      name: 'Grupo WG Almeida',
      url: 'https://wgalmeida.com.br',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Brasil',
    },
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: PAGE_URL,
    },
  },
]

export default function ICCRIParaImobiliarias() {
  return (
    <>
      <SEO
        pathname="/iccri-para-imobiliarias"
        title="ICCRI para Imobiliárias, Corretores e Bancos | WG Almeida"
        description="Use o ICCRI como referência técnica para precificação, estudo de reforma, AVM e tomada de decisão no mercado imobiliário."
        keywords="iccri para imobiliarias, calculadora preco m2 corretor, avm, obraeasy, estudo de viabilidade de reforma"
        url={PAGE_URL}
        schema={schema}
      />

      <section className="wg-page-hero wg-page-hero--default hero-under-header bg-wg-black text-white">
        <div className="container-custom py-14 md:py-20">
          <motion.h1
            className="text-4xl md:text-5xl font-inter font-light mb-4"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            ICCRI para imobiliárias, corretores, bancos e construtoras
          </motion.h1>
          <motion.p
            className="max-w-4xl text-lg text-white/80"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            Transforme custo de reforma em decisão comercial com método técnico. O ICCRI conecta
            dados reais de obra, simulação de viabilidade, leitura operacional e potencial de valorização.
          </motion.p>
          <motion.p
            className="mt-4 max-w-4xl text-base text-white/65"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.18 }}
          >
            No ecossistema WG, isso ajuda a separar quando a tese ainda está em fase experimental,
            quando já pode ser conduzida de forma assistida e quando começa a ficar mais defensável
            com base real de mercado, obra e execução.
          </motion.p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-custom grid grid-cols-1 gap-8 lg:grid-cols-12">
          <article className="lg:col-span-8 space-y-8">
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="text-2xl font-inter font-light text-wg-black mb-3">
                Como usar o ICCRI na operação comercial
              </h2>
              <p className="text-wg-gray leading-relaxed mb-5">
                Use o ICCRI para criar previsibilidade em propostas, leitura de margem e argumento
                de venda baseado em dados. O foco é reduzir incerteza no momento de decisão e traduzir a complexidade da obra em uma leitura mais didática.
              </p>
              <ul className="space-y-3 text-[#334155]">
                <li className="flex items-start gap-2">
                  <LineChart className="mt-0.5 h-4 w-4 text-wg-blue" />
                  Precificação técnica por padrão e faixa de reforma.
                </li>
                <li className="flex items-start gap-2">
                  <Users className="mt-0.5 h-4 w-4 text-wg-blue" />
                  Conversa consultiva com cliente final baseada em cenários.
                </li>
                <li className="flex items-start gap-2">
                  <Landmark className="mt-0.5 h-4 w-4 text-wg-blue" />
                  Apoio a bancos e crédito com leitura objetiva de investimento.
                </li>
              </ul>
              <p className="mt-5 text-sm leading-relaxed text-wg-gray">
                O papel do ICCRI aqui não é prometer certeza artificial. Ele ajuda a organizar custo,
                etapas e escopo para que a tese do ativo possa evoluir com mais clareza para uma leitura
                experimental, assistida ou mais defensável conforme a base real cresce.
              </p>
            </div>

            <div className="rounded-2xl border border-wg-orange/30 bg-wg-gray-light p-6">
              <h2 className="text-2xl font-inter font-light text-wg-black mb-3">
                Fluxo recomendado para parceiros
              </h2>
              <ol className="list-decimal space-y-2 pl-5 text-[#334155]">
                <li>Use o ICCRI para estimativa inicial e leitura das etapas operacionais da obra.</li>
                <li>Valide viabilidade com EVF no Obra Easy.</li>
                <li>Projete valorização com AVM para orientar a decisão.</li>
                <li>Encaminhe o cliente para proposta executiva integrada.</li>
              </ol>

              <p className="mt-4 text-sm leading-relaxed text-wg-gray">
                {WG_PRODUCT_MESSAGES.marketReferences}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-wg-gray">
                Quando conectado ao Easy Real State e ao ObraEasy, o ICCRI deixa de ser só referência
                de custo e passa a apoiar a defesa da captura de valor com base em fechamento real,
                custo executado e leitura operacional da obra.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={`${PRODUCT_URLS.obraeasy}/evf4`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    trackCtaClick({
                      ctaId: 'iccri_b2b_obraeasy',
                      ctaLabel: 'Simular EVF no Obra Easy',
                      ctaContext: 'iccri_b2b',
                      ctaDestination: `${PRODUCT_URLS.obraeasy}/evf4`,
                    })
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-wg-orange px-4 py-2 text-white"
                >
                  Simular EVF no Obra Easy
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href={`${PRODUCT_URLS.easyrealstate}/calculo`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    trackCtaClick({
                      ctaId: 'iccri_b2b_avm',
                      ctaLabel: 'Rodar AVM no EasyRealState',
                      ctaContext: 'iccri_b2b',
                      ctaDestination: `${PRODUCT_URLS.easyrealstate}/calculo`,
                    })
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-wg-blue px-4 py-2 text-wg-blue"
                >
                  Rodar AVM no EasyRealState
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>

            <LizAssistant context="investimento" />
            <ICCRILinksBlock context="investimento" />
          </article>

          <aside className="lg:col-span-4 space-y-5">
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 text-lg font-inter font-light text-wg-black">
                Segmentos atendidos
              </h3>
              <div className="space-y-3 text-sm text-wg-gray">
                <p className="flex items-start gap-2">
                  <Building2 className="mt-0.5 h-4 w-4 text-wg-blue" />
                  Imobiliárias e corretores de alto padrão.
                </p>
                <p className="flex items-start gap-2">
                  <Landmark className="mt-0.5 h-4 w-4 text-wg-blue" />
                  Bancos e instituições com análise de crédito imobiliário.
                </p>
                <p className="flex items-start gap-2">
                  <Users className="mt-0.5 h-4 w-4 text-wg-blue" />
                  Investidores e construtoras com foco em margem e previsibilidade.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="mb-3 text-lg font-inter font-light text-wg-black">Acesso rapido</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link className="text-wg-blue hover:underline" to="/iccri">
                    Ver índice ICCRI completo
                  </Link>
                </li>
                <li>
                  <Link className="text-wg-blue hover:underline" to="/blog/tabela-precos-reforma-2026-iccri">
                    Tabela ICCRI 2026
                  </Link>
                </li>
                <li>
                  <Link className="text-wg-blue hover:underline" to="/blog/calculadora-preco-m2-corretores-imobiliarias">
                    Conteúdo para corretores e imobiliárias
                  </Link>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
