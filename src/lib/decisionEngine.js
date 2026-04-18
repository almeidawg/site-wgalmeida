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
  return { intent: best, score: bestScore }
}

export function getNextBestAction(context = {}, pathname = '') {
  const { interesse, paginas = [] } = context
  const fromPath = inferIntentFromPath(pathname)
  const { intent: fromHistory, score: historyScore } = inferIntentFromHistory(paginas)
  const resolved = interesse || fromPath || fromHistory || 'default'
  const actions = getActions()
  return { ...actions[resolved] || actions.default, intent: resolved }
}

// Camada 5 — Next Best Action score: quão certo estamos da intenção e do estágio
export function getNBAScore(context = {}, pathname = '') {
  const { interesse, paginas = [], estagio = 'exploracao' } = context
  const fromPath = inferIntentFromPath(pathname)
  const { intent: fromHistory, score: historyScore } = inferIntentFromHistory(paginas)

  let confidence = 0

  // Interesse explícito (user escolheu) = alta confiança
  if (interesse) confidence += 40

  // Rota atual sinaliza intenção = confiança adicional
  if (fromPath) confidence += 20

  // Histórico: cada página de intenção consistente soma
  confidence += Math.min(historyScore * 8, 30)

  // Estágio avança a confiança
  if (estagio === 'decisao') confidence += 5
  if (estagio === 'acao') confidence += 10

  // Total máx 100
  return Math.min(confidence, 100)
}

// Retorna o estágio inferido a partir do comportamento
export function inferStage(context = {}) {
  const { paginas = [], estagio } = context
  if (estagio && estagio !== 'exploracao') return estagio

  const { score: historyScore } = inferIntentFromHistory(paginas)
  const totalPages = paginas.length

  if (totalPages >= 5 || historyScore >= 3) return 'decisao'
  if (totalPages >= 2 || historyScore >= 1) return 'exploracao'
  return 'exploracao'
}
