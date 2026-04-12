import { BarChart3, Calculator, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { trackCtaClick } from '@/lib/analytics'

const CONTEXT_LABEL = {
  custo: 'custo de reforma',
  tempo: 'prazos de obra',
  investimento: 'valorizacao e investimento',
}

const RELATED_CONTENT = [
  { to: '/blog/tabela-precos-reforma-2026-iccri', label: 'Tabela de precos de reforma atualizada (ICCRI)' },
  { to: '/blog/custo-reforma-m2-sao-paulo', label: 'Custo de reforma por m2 em 2026' },
  { to: '/blog/quanto-custa-reforma-apartamento-100m2', label: 'Quanto custa reformar um apartamento de 100m2' },
  { to: '/blog/quanto-tempo-leva-reforma-completa-alto-padrao', label: 'Quanto tempo leva uma reforma completa' },
  { to: '/blog/como-calcular-custo-de-obra', label: 'Como calcular o custo de uma obra' },
  { to: '/blog/custo-marcenaria-planejada', label: 'Custo de marcenaria planejada' },
]

const TOOL_LINKS = [
  { href: 'https://obraeasy.wgalmeida.com.br/evf4', label: 'Simulador de custo de obra (Obra Easy)', external: true },
  { href: 'https://easyrealstate.wgalmeida.com.br/calculo', label: 'Avaliacao imobiliaria (AVM)', external: true },
  { to: '/easy-real-state', label: 'Calculadora de investimento imobiliario (EasyRealState)' },
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
        className="inline-flex items-center gap-1.5 text-wg-blue hover:underline"
      >
        {item.label}
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    )
  }

  return (
    <Link to={item.to} className="text-wg-blue hover:underline">
      {item.label}
    </Link>
  )
}

export default function ICCRILinksBlock({ context = 'custo', className = '' }) {
  const contextLabel = CONTEXT_LABEL[context] || CONTEXT_LABEL.custo

  return (
    <section className={`rounded-2xl border border-gray-200 bg-[#FAFAFA] p-6 md:p-8 ${className}`.trim()}>
      <p className="mb-2 text-xs uppercase tracking-[0.12em] text-wg-gray">
        Baseado no ICCRI 2026 · indice de custo de reforma da WG Almeida
      </p>

      <h2 className="mb-3 text-2xl font-inter font-light text-wg-black">
        Planeje sua reforma com dados reais
      </h2>

      <p className="mb-6 text-[15px] leading-[1.65] text-[#4C4C4C]">
        O ICCRI e o indice proprietario da WG Almeida baseado em dados reais de obras.
        Esta pagina conecta conteudo, ferramentas e simulacoes para apoiar decisoes de {contextLabel}.
      </p>

      <div className="mb-8 rounded-xl border border-[#E5E7EB] bg-white p-5">
        <h3 className="mb-2 flex items-center gap-2 text-lg font-light text-wg-black">
          <Calculator className="h-4 w-4 text-wg-orange" />
          Calcule agora o custo da sua reforma
        </h3>
        <p className="mb-4 text-sm text-[#4C4C4C]">
          Simule valores considerando metragem, padrao de acabamento e localizacao.
        </p>
        <a
          href="https://obraeasy.wgalmeida.com.br/evf4"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            trackCtaClick({
              ctaId: 'iccri_links_calculadora',
              ctaLabel: 'Acessar calculadora',
              ctaContext: `iccri_links_${context}`,
              ctaDestination: 'https://obraeasy.wgalmeida.com.br/evf4',
            })
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-wg-orange px-4 py-2 text-sm text-white"
        >
          Acessar calculadora
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <div className="mb-8">
        <h3 className="mb-3 text-lg font-light text-wg-black">Conteudos que podem te ajudar</h3>
        <ul className="space-y-2 text-sm text-[#334155]">
          {RELATED_CONTENT.map((item) => (
            <li key={item.to}>{renderNavLink(item)}</li>
          ))}
        </ul>
      </div>

      <div className="mb-8">
        <h3 className="mb-3 flex items-center gap-2 text-lg font-light text-wg-black">
          <BarChart3 className="h-4 w-4 text-wg-blue" />
          Ferramentas para simular e decidir
        </h3>
        <ul className="space-y-2 text-sm text-[#334155]">
          {TOOL_LINKS.map((item) => (
            <li key={item.to || item.href}>{renderNavLink(item)}</li>
          ))}
        </ul>
      </div>

      <div className="mb-6">
        <h3 className="mb-3 text-lg font-light text-wg-black">Para quem e este conteudo</h3>
        <ul className="space-y-1 text-sm text-[#334155]">
          <li>Quem esta planejando uma reforma</li>
          <li>Quem deseja comprar imovel para reformar</li>
          <li>Corretores e imobiliarias</li>
          <li>Investidores imobiliarios</li>
          <li>Bancos e analise de credito</li>
        </ul>
      </div>

      <p className="text-sm leading-relaxed text-[#6B7280]">
        Quanto mais informacao voce tiver, menor o risco e maior o controle do seu investimento.
      </p>
    </section>
  )
}
