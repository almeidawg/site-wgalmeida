import { ArrowRight, Clock3, DollarSign, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { trackCtaClick } from '@/lib/analytics'
import { PRODUCT_URLS } from '@/data/company';

const CONTEXT_VARIANTS = {
  custo: {
    title: 'Liz · assistente de decisao com base no ICCRI',
    description: 'Quer avancar no planejamento? Estas recomendacoes conectam custo, prazo e potencial de valorizacao.',
    links: [
      { ctaId: 'liz_custo_calcular_reforma', label: 'Calcular custo da reforma', href: `${PRODUCT_URLS.obraeasy}/evf4`, external: true, icon: DollarSign },
      { ctaId: 'liz_custo_tempo_obra', label: 'Ver tempo estimado de obra', to: '/blog/quanto-tempo-leva-reforma-completa-alto-padrao', icon: Clock3 },
      { ctaId: 'liz_custo_avaliar_valorizacao', label: 'Avaliar valorizacao do imovel', href: `${PRODUCT_URLS.easyrealstate}/calculo`, external: true, icon: TrendingUp },
    ],
  },
  tempo: {
    title: 'Liz · assistente de decisao com base no ICCRI',
    description: 'Ajuste seu cronograma com previsibilidade e conecte prazo com custo antes de iniciar a obra.',
    links: [
      { ctaId: 'liz_tempo_etapas_cronograma', label: 'Entender etapas e cronograma', to: '/blog/etapas-reforma-completa', icon: Clock3 },
      { ctaId: 'liz_tempo_custo_reforma', label: 'Ver custo estimado da reforma', href: `${PRODUCT_URLS.obraeasy}/evf4`, external: true, icon: DollarSign },
      { ctaId: 'liz_tempo_impacto_valor', label: 'Avaliar impacto no valor do imovel', href: `${PRODUCT_URLS.easyrealstate}/calculo`, external: true, icon: TrendingUp },
    ],
  },
  investimento: {
    title: 'Liz · assistente de decisao com base no ICCRI',
    description: 'Use o ICCRI para comparar cenarios de compra, reforma e valorizacao com foco financeiro.',
    links: [
      { ctaId: 'liz_investimento_simular_investimento', label: 'Simular investimento imobiliario', to: '/easy-real-state', icon: TrendingUp },
      { ctaId: 'liz_investimento_viabilidade_reforma', label: 'Calcular viabilidade de reforma', href: `${PRODUCT_URLS.obraeasy}/evf4`, external: true, icon: DollarSign },
      { ctaId: 'liz_investimento_prazos_decisao', label: 'Ver prazos para tomada de decisao', to: '/blog/quanto-tempo-leva-reforma-completa-alto-padrao', icon: Clock3 },
    ],
  },
}

const renderSmartLink = (item, context = 'custo') => {
  const Icon = item.icon || ArrowRight
  const destination = item.href || item.to || ''

  const handleClick = () => {
    trackCtaClick({
      ctaId: item.ctaId || 'liz_cta',
      ctaLabel: item.label,
      ctaContext: `liz_${context}`,
      ctaDestination: destination,
    })
  }

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] transition-colors hover:border-wg-blue/50 hover:bg-[#F9FAFB]"
      >
        <span className="inline-flex items-center gap-2">
          <Icon className="h-4 w-4 text-wg-blue" />
          {item.label}
        </span>
        <ArrowRight className="h-4 w-4 text-wg-blue transition-transform group-hover:translate-x-0.5" />
      </a>
    )
  }

  return (
    <Link
      to={item.to}
      onClick={handleClick}
      className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] transition-colors hover:border-wg-blue/50 hover:bg-[#F9FAFB]"
    >
      <span className="inline-flex items-center gap-2">
        <Icon className="h-4 w-4 text-wg-blue" />
        {item.label}
      </span>
      <ArrowRight className="h-4 w-4 text-wg-blue transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

export default function LizAssistant({ context = 'custo', className = '' }) {
  const variant = CONTEXT_VARIANTS[context] || CONTEXT_VARIANTS.custo

  return (
    <section className={`rounded-2xl border border-gray-200 bg-[#F5F7FB] p-6 md:p-7 ${className}`.trim()}>
      <p className="mb-2 text-xs uppercase tracking-[0.12em] text-wg-gray">Sugestoes inteligentes baseadas no ICCRI</p>
      <h2 className="mb-3 text-xl font-inter font-light text-wg-black">{variant.title}</h2>
      <p className="mb-5 text-[15px] leading-[1.6] text-[#4C4C4C]">{variant.description}</p>

      <div className="space-y-3">
        {variant.links.map((item) => (
          <div key={item.to || item.href}>{renderSmartLink(item, context)}</div>
        ))}
      </div>
    </section>
  )
}
