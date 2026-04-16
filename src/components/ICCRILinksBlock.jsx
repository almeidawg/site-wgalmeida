import { BarChart3, Calculator, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { trackCtaClick } from '@/lib/analytics'
import { PRODUCT_URLS } from '@/data/company';

const CONTEXT_LABEL = {
  custo: 'custo de reforma',
  tempo: 'prazos de obra',
  investimento: 'valorização e investimento',
}

const RELATED_CONTENT = [
  { to: '/blog/tabela-precos-reforma-2026-iccri', label: 'Tabela de preços de reforma atualizada (ICCRI)' },
  { to: '/blog/custo-reforma-m2-sao-paulo', label: 'Custo de reforma por m² em 2026' },
  { to: '/blog/quanto-custa-reforma-apartamento-100m2', label: 'Quanto custa reformar um apartamento de 100 m²' },
  { to: '/blog/quanto-tempo-leva-reforma-completa-alto-padrao', label: 'Quanto tempo leva uma reforma completa' },
  { to: '/blog/como-calcular-custo-de-obra', label: 'Como calcular o custo de uma obra' },
  { to: '/blog/custo-marcenaria-planejada', label: 'Custo de marcenaria planejada' },
]

const TOOL_LINKS = [
  { href: `${PRODUCT_URLS.obraeasy}/evf4`, label: 'Simulador de custo de obra (Obra Easy)', external: true },
  { href: `${PRODUCT_URLS.easyrealstate}/calculo`, label: 'Avaliacao imobiliaria (AVM)', external: true },
  { to: '/easy-real-state', label: 'Calculadora de investimento imobiliário (EasyRealState)' },
  { to: '/moodboard-generator', label: 'Gerador de moodboard (BuildTech)' },
  { to: '/room-visualizer', label: 'Visualizador de ambientes' },
]

const renderNavLink = (item) => {
  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#334155] font-light transition-colors hover:text-wg-blue"
      >
        {item.label}
      </a>
    )
  }

  return (
    <Link to={item.to} className="text-[#334155] font-light transition-colors hover:text-wg-blue">
      {item.label}
    </Link>
  )
}

export default function ICCRILinksBlock({ context = 'custo', className = '' }) {
  const contextLabel = CONTEXT_LABEL[context] || CONTEXT_LABEL.custo

  return (
    <section className={`rounded-2xl border border-gray-200 bg-[#FAFAFA] p-6 md:p-8 ${className}`.trim()}>
      <p className="mb-2 text-xs font-light uppercase tracking-[0.12em] text-wg-gray">
        Baseado no ICCRI 2026 · índice de custo de reforma da WG Almeida
      </p>

      <h2 className="mb-3 text-2xl font-suisse font-light text-wg-black">
        Planeje sua reforma com dados reais
      </h2>

      <p className="mb-6 text-[15px] font-light leading-[1.65] text-[#4C4C4C]">
        O ICCRI é o índice proprietário da WG Almeida baseado em dados reais de obras.
        Esta página conecta conteúdo, ferramentas e simulações para apoiar decisões de {contextLabel}.
      </p>

      <div className="mb-8 rounded-xl border border-[#E5E7EB] bg-white p-5">
        <h3 className="mb-2 flex items-center gap-2 text-lg font-light text-wg-black">
          <Calculator className="h-4 w-4 text-wg-orange" />
          Calcule agora o custo da sua reforma
        </h3>
        <p className="mb-4 text-sm font-light text-[#4C4C4C]">
          Simule valores considerando metragem, padrão de acabamento e localização.
        </p>
        <a
          href={`${PRODUCT_URLS.obraeasy}/evf4`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            trackCtaClick({
              ctaId: 'iccri_links_calculadora',
              ctaLabel: 'Acessar calculadora',
              ctaContext: `iccri_links_${context}`,
              ctaDestination: `${PRODUCT_URLS.obraeasy}/evf4`,
            })
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-wg-orange px-4 py-2 text-sm font-light text-white"
        >
          Acessar calculadora
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <div className="mb-6 grid gap-8 lg:grid-cols-3 lg:gap-6">
        <div>
          <h3 className="mb-3 text-lg font-light text-wg-black">Conteúdos que podem te ajudar</h3>
          <ul className="space-y-2 text-sm font-light text-[#334155]">
            {RELATED_CONTENT.map((item) => (
              <li key={item.to}>{renderNavLink(item)}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 flex items-center gap-2 text-lg font-light text-wg-black">
            <BarChart3 className="h-4 w-4 text-wg-blue" />
            Ferramentas para simular e decidir
          </h3>
          <ul className="space-y-2 text-sm font-light text-[#334155]">
            {TOOL_LINKS.map((item) => (
              <li key={item.to || item.href}>{renderNavLink(item)}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-light text-wg-black">Para quem é este conteúdo</h3>
          <ul className="space-y-1 text-sm font-light text-[#334155]">
            <li className="font-light" style={{ fontWeight: 300 }}>Quem está planejando uma reforma</li>
            <li className="font-light" style={{ fontWeight: 300 }}>Quem deseja comprar imóvel para reformar</li>
            <li className="font-light" style={{ fontWeight: 300 }}>Corretores e imobiliárias</li>
            <li className="font-light" style={{ fontWeight: 300 }}>Investidores imobiliários</li>
            <li className="font-light" style={{ fontWeight: 300 }}>Bancos e análise de crédito</li>
          </ul>
        </div>
      </div>

      <p className="text-sm font-light leading-relaxed text-[#6B7280]">
        Quanto mais informação você tiver, menor o risco e maior o controle do seu investimento.
      </p>
    </section>
  )
}
