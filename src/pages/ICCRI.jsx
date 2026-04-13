import SEO from '@/components/SEO'
import ICCRILinksBlock from '@/components/ICCRILinksBlock'
import LizAssistant from '@/components/LizAssistant'
import { motion } from '@/lib/motion-lite'
import { ArrowRight, BarChart3, Building2, Calculator, Landmark, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PRODUCT_URLS } from '@/data/company';

const ICCRI_PAGE_URL = 'https://wgalmeida.com.br/iccri'

const BASE_RANGE_BY_STANDARD = {
  economico: { min: 1500, max: 2500 },
  medio: { min: 2500, max: 4500 },
  alto: { min: 4500, max: 8000 },
}

const CITY_FACTOR = {
  'sao paulo': 1,
  'sao paulo - sp': 1,
  default: 0.9,
}

const toBrl = (value) =>
  Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

const getCityFactor = (city) => {
  const normalized = String(city || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  return CITY_FACTOR[normalized] || CITY_FACTOR.default
}

export default function ICCRI() {
  const [area, setArea] = useState('80')
  const [standard, setStandard] = useState('medio')
  const [city, setCity] = useState('Sao Paulo')

  const simulation = useMemo(() => {
    const parsedArea = Number.parseFloat(area)
    if (!Number.isFinite(parsedArea) || parsedArea <= 0) return null

    const range = BASE_RANGE_BY_STANDARD[standard] || BASE_RANGE_BY_STANDARD.medio
    const factor = getCityFactor(city)
    const min = parsedArea * range.min * factor
    const max = parsedArea * range.max * factor

    return {
      min,
      max,
      cityFactor: factor,
      parsedArea,
    }
  }, [area, city, standard])

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${ICCRI_PAGE_URL}#webpage`,
      url: ICCRI_PAGE_URL,
      name: 'ICCRI - Indice de Custo de Construcao e Reforma Inteligente',
      description:
        'Indice proprietario da WG Almeida para estimativa de custo de reforma por m2, com simulador de faixa de investimento em 2026.',
      isPartOf: { '@id': 'https://wgalmeida.com.br/#website' },
      about: { '@id': `${ICCRI_PAGE_URL}#dataset-iccri` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      '@id': `${ICCRI_PAGE_URL}#dataset-iccri`,
      name: 'ICCRI 2026 - Indice de Custo de Construcao e Reforma Inteligente',
      description:
        'Dataset proprietario da WG Almeida com faixas de custo de reforma por m2 e fatores de ajuste de localizacao e complexidade.',
      url: ICCRI_PAGE_URL,
      creator: {
        '@type': 'Organization',
        '@id': 'https://wgalmeida.com.br/#organization',
        name: 'Grupo WG Almeida',
      },
      inLanguage: 'pt-BR',
      temporalCoverage: '2020/2026',
      spatialCoverage: {
        '@type': 'City',
        name: 'Sao Paulo',
      },
      isAccessibleForFree: true,
      variableMeasured: [
        { '@type': 'PropertyValue', name: 'custo_reforma_m2_economico' },
        { '@type': 'PropertyValue', name: 'custo_reforma_m2_medio' },
        { '@type': 'PropertyValue', name: 'custo_reforma_m2_alto_padrao' },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'O que e o ICCRI?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'O ICCRI e o indice proprietario da WG Almeida para estimar custo de reforma por m2 com base em dados reais de obras.',
          },
        },
        {
          '@type': 'Question',
          name: 'Com que frequencia o ICCRI e atualizado?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A atualizacao e periodica com base em variacao de materiais, mao de obra e historico operacional consolidado pela equipe tecnica.',
          },
        },
      ],
    },
  ]

  return (
    <>
      <SEO
        pathname="/iccri"
        title="ICCRI 2026 | Indice de Custo de Construcao e Reforma Inteligente"
        description="Indice proprietario da WG Almeida para estimar custo de reforma por m2, com simulador de faixa de investimento para cliente final, corretores e parceiros."
        keywords="iccri, custo reforma m2, tabela custo reforma 2026, simulador custo obra, evf, avm, easyrealstate, obraeasy"
        url={ICCRI_PAGE_URL}
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
            ICCRI · Indice de Custo de Construcao e Reforma Inteligente
          </motion.h1>
          <motion.p
            className="max-w-4xl text-lg text-white/80"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            O ICCRI e um indice proprietario da WG Almeida baseado em dados reais de obras.
            Ele organiza faixas de custo por m2 para tomada de decisao com previsibilidade.
          </motion.p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-custom grid grid-cols-1 lg:grid-cols-12 gap-8">
          <article className="lg:col-span-8 space-y-10">
            <div className="rounded-2xl border border-gray-200 bg-wg-gray-light p-6">
              <h2 className="text-2xl font-inter font-light text-wg-black mb-3">Quanto custa reformar em 2026?</h2>
              <p className="text-wg-gray leading-relaxed mb-4">
                Segundo o ICCRI 2026, o custo estimado por m2 varia por padrao de acabamento:
              </p>
              <ul className="space-y-2 text-wg-black">
                <li>Economico: R$ 1.500 a R$ 2.500/m2</li>
                <li>Medio padrao: R$ 2.500 a R$ 4.500/m2</li>
                <li>Alto padrao: R$ 4.500 a R$ 8.000/m2</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-wg-orange/30 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-wg-orange">
                <Calculator className="w-5 h-5" />
                <h2 className="text-2xl font-inter font-light text-wg-black">Simule seu custo agora</h2>
              </div>
              <p className="text-wg-gray mb-5">
                Preencha metragem, padrao e cidade para obter uma faixa rapida de investimento.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex flex-col gap-2 text-sm text-wg-gray">
                  Metragem (m2)
                  <input
                    type="number"
                    min="1"
                    value={area}
                    onChange={(event) => setArea(event.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-wg-black"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm text-wg-gray">
                  Padrao
                  <select
                    value={standard}
                    onChange={(event) => setStandard(event.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-wg-black"
                  >
                    <option value="economico">Economico</option>
                    <option value="medio">Medio padrao</option>
                    <option value="alto">Alto padrao</option>
                  </select>
                </label>

                <label className="flex flex-col gap-2 text-sm text-wg-gray">
                  Cidade
                  <input
                    type="text"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-wg-black"
                  />
                </label>
              </div>

              <div className="mt-5 rounded-xl bg-wg-black p-5 text-white">
                {simulation ? (
                  <>
                    <p className="text-white/70 text-sm mb-1">
                      Estimativa para {simulation.parsedArea}m2 · fator cidade {simulation.cityFactor.toFixed(2)}
                    </p>
                    <p className="text-2xl font-light">
                      {toBrl(simulation.min)} ate {toBrl(simulation.max)}
                    </p>
                  </>
                ) : (
                  <p className="text-white/75">Informe uma metragem valida para calcular.</p>
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={`${PRODUCT_URLS.obraeasy}/evf4`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-wg-orange px-4 py-2 text-white"
                >
                  Calcule seu custo agora
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href={`${PRODUCT_URLS.easyrealstate}/calculo`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-wg-blue px-4 py-2 text-wg-blue"
                >
                  Avaliar com AVM
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-inter font-light text-wg-black mb-3">Como o ICCRI e calculado</h2>
              <ul className="space-y-2 text-wg-gray leading-relaxed">
                <li>Custos reais de obras executadas</li>
                <li>Dados historicos operacionais da WG Almeida</li>
                <li>Variacao de materiais e mao de obra</li>
                <li>Complexidade tecnica dos projetos</li>
              </ul>
            </div>

            <LizAssistant context="custo" />
            <ICCRILinksBlock context="custo" />
          </article>

          <aside className="lg:col-span-4 space-y-5">
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="text-lg font-inter font-light text-wg-black mb-4">Para quem o ICCRI e util</h3>
              <div className="space-y-4 text-sm text-wg-gray">
                <p className="flex items-start gap-2">
                  <Building2 className="w-4 h-4 mt-0.5 text-wg-blue" />
                  Cliente final: planejamento com seguranca e previsibilidade.
                </p>
                <p className="flex items-start gap-2">
                  <Users className="w-4 h-4 mt-0.5 text-wg-blue" />
                  Corretores e imobiliarias: precificacao e potencial de valorizacao.
                </p>
                <p className="flex items-start gap-2">
                  <Landmark className="w-4 h-4 mt-0.5 text-wg-blue" />
                  Bancos e construtoras: benchmark para analise de decisao.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="text-lg font-inter font-light text-wg-black mb-3">Conteudos relacionados</h3>
              <ul className="space-y-2 text-sm">
                <li><Link className="text-wg-blue hover:underline" to="/blog/tabela-precos-reforma-2026-iccri">Tabela ICCRI 2026</Link></li>
                <li><Link className="text-wg-blue hover:underline" to="/blog/custo-reforma-m2-sao-paulo">Custo de reforma por m2 em Sao Paulo</Link></li>
                <li><Link className="text-wg-blue hover:underline" to="/blog/quanto-custa-reforma-apartamento-100m2">Quanto custa reformar 100m2</Link></li>
                <li><Link className="text-wg-blue hover:underline" to="/blog/como-calcular-custo-de-obra">Como calcular custo de obra</Link></li>
                <li><Link className="text-wg-blue hover:underline" to="/blog/custo-marcenaria-planejada">Custo de marcenaria planejada</Link></li>
              </ul>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-wg-orange" />
                <h3 className="text-lg font-inter font-light text-wg-black">Ferramentas</h3>
              </div>
              <ul className="space-y-2 text-sm">
                <li><a className="text-wg-blue hover:underline" href={`${PRODUCT_URLS.obraeasy}/evf4`} target="_blank" rel="noopener noreferrer">Simulador de custo de obra (ObraEasy)</a></li>
                <li><a className="text-wg-blue hover:underline" href={`${PRODUCT_URLS.easyrealstate}/calculo`} target="_blank" rel="noopener noreferrer">Avaliacao imobiliaria (AVM)</a></li>
                <li><Link className="text-wg-blue hover:underline" to="/easy-real-state">Calculadora EasyRealState</Link></li>
                <li><Link className="text-wg-blue hover:underline" to="/buildtech">Ecossistema BuildTech</Link></li>
                <li><Link className="text-wg-blue hover:underline" to="/tools/moodboard-generator">Tool: Moodboard Generator</Link></li>
                <li><Link className="text-wg-blue hover:underline" to="/tools/room-visualizer">Tool: Room Visualizer</Link></li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
