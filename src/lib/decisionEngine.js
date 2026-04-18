import { PRODUCT_URLS } from '@/data/company'

const ROUTE_INTENT_MAP = [
  { match: ['/arquitetura', '/construtora', '/obra-turn-key', '/reforma-apartamento'], interesse: 'obra' },
  { match: ['/engenharia'], interesse: 'obra' },
  { match: ['/marcenaria'], interesse: 'marcenaria' },
  { match: ['/moodboard', '/visualizador', '/room-visualizer', '/estilos', '/revista-estilos'], interesse: 'design' },
  { match: ['/easyrealestate', '/imovel', '/calculo', '/iccri', '/evf'], interesse: 'investimento' },
  { match: ['/obraeasy'], interesse: 'obra' },
  { match: ['/blog/custo', '/blog/quanto', '/blog/reforma', '/blog/custo-marcenaria'], interesse: 'obra' },
  { match: ['/blog/marcas-luxo', '/blog/paleta', '/blog/estilo', '/blog/design', '/blog/decoracao'], interesse: 'design' },
  { match: ['/blog/evf', '/blog/tabela-precos', '/blog/iccri', '/blog/valoriza'], interesse: 'investimento' },
]

// Camada 4: destinos integrados ObraEasy / EasyRealState / site
const getActions = () => ({
  obra: {
    label: 'Simular custo da obra',
    href: '/solicite-proposta?service=Orçamento+de+Obra&intent=obra',
    secondary: {
      label: 'Abrir no ObraEasy',
      href: `${PRODUCT_URLS.obraeasy}?source=site&intent=obra`,
      external: true,
    },
  },
  marcenaria: {
    label: 'Orçar marcenaria sob medida',
    href: '/solicite-proposta?service=Marcenaria&intent=marcenaria',
    secondary: {
      label: 'Ver portfólio',
      href: '/marcenaria',
      external: false,
    },
  },
  design: {
    label: 'Criar meu guia de estilo',
    href: '/moodboard',
    secondary: {
      label: 'Levar para projeto',
      href: '/solicite-proposta?context=moodboard&intent=design',
      external: false,
    },
  },
  investimento: {
    label: 'Ver viabilidade do investimento',
    href: `${PRODUCT_URLS.obraeasy}/evf4?source=site&intent=investimento`,
    external: true,
    secondary: {
      label: 'Ver ICCRI 2026',
      href: '/iccri',
      external: false,
    },
  },
  default: {
    label: 'Começar meu projeto',
    href: '/solicite-proposta',
    secondary: null,
  },
})

export function inferIntentFromPath(pathname = '') {
  for (const { match, interesse } of ROUTE_INTENT_MAP) {
    if (match.some((prefix) => pathname.startsWith(prefix))) return interesse
  }
  return null
}

export function inferIntentFromHistory(paginas = []) {
  const counts = {}
  for (const path of paginas) {
    const intent = inferIntentFromPath(path)
    if (intent) counts[intent] = (counts[intent] || 0) + 1
  }
  let best = null
  let bestScore = 0
  for (const [intent, score] of Object.entries(counts)) {
    if (score > bestScore) { bestScore = score; best = intent }
  }
  return best
}

export function getNextBestAction(context = {}, pathname = '') {
  const { interesse, paginas = [] } = context
  const fromPath = inferIntentFromPath(pathname)
  const fromHistory = inferIntentFromHistory(paginas)
  const resolved = interesse || fromPath || fromHistory || 'default'
  const actions = getActions()
  return { ...actions[resolved] || actions.default, intent: resolved }
}
