import { COMPANY, PRODUCT_URLS } from '@/data/company'
import { STAGE_RANK } from '@/lib/userContext'

const ROUTE_INTENT_MAP = [
  { match: ['/arquitetura', '/construtora', '/obra-turn-key', '/reforma-apartamento', '/obraeasy'], interesse: 'obra' },
  { match: ['/engenharia'], interesse: 'obra' },
  { match: ['/marcenaria'], interesse: 'marcenaria' },
  { match: ['/moodboard', '/visualizador', '/room-visualizer', '/estilos', '/revista-estilos'], interesse: 'design' },
  { match: ['/easyrealestate', '/imovel', '/calculo', '/iccri', '/evf'], interesse: 'investimento' },
  { match: ['/blog/custo', '/blog/quanto', '/blog/reforma', '/blog/custo-marcenaria'], interesse: 'obra' },
  { match: ['/blog/marcas-luxo', '/blog/paleta', '/blog/estilo', '/blog/design', '/blog/decoracao'], interesse: 'design' },
  { match: ['/blog/evf', '/blog/tabela-precos', '/blog/iccri', '/blog/valoriza'], interesse: 'investimento' },
]

const PROPERTY_ROUTE_RULES = [
  { match: ['/reforma-apartamento', '/apartamento'], tipoImovel: 'apartamento' },
  { match: ['/arquitetura-corporativa', '/corporativa', '/escritorio'], tipoImovel: 'corporativo' },
  { match: ['/casa', '/residencia'], tipoImovel: 'casa' },
  { match: ['/interiores', '/moodboard', '/estilos'], tipoImovel: 'interiores' },
]

const ACTION_LIBRARY = {
  obra: {
    exploracao: {
      label: 'Simular custo da sua obra',
      href: `${PRODUCT_URLS.obraeasy}?source=site&intent=obra&stage=exploracao`,
      external: true,
      reason: 'Seu contexto indica interesse em obra. O melhor proximo passo e transformar curiosidade em faixa de custo e escopo inicial.',
      secondary: {
        label: 'Comecar meu projeto',
        href: '/solicite-proposta?service=Or%C3%A7amento+de+Obra&intent=obra&stage=exploracao',
        external: false,
      },
    },
    decisao: {
      label: 'Comecar meu projeto',
      href: '/solicite-proposta?service=Or%C3%A7amento+de+Obra&intent=obra&stage=decisao',
      external: false,
      reason: 'Voce ja demonstrou sinais de decisao. O melhor proximo passo e consolidar dados para briefing, proposta e atendimento tecnico.',
      secondary: {
        label: 'Abrir no ObraEasy',
        href: `${PRODUCT_URLS.obraeasy}?source=site&intent=obra&stage=decisao`,
        external: true,
      },
    },
    acao: {
      label: 'Falar com especialista da obra',
      href: '/solicite-proposta?service=Or%C3%A7amento+de+Obra&intent=obra&stage=acao',
      external: false,
      reason: 'Seu comportamento indica prontidao para acao. O melhor proximo passo e atendimento humano com contexto tecnico preservado.',
      secondary: {
        label: 'Revisar simulacao',
        href: `${PRODUCT_URLS.obraeasy}?source=site&intent=obra&stage=acao`,
        external: true,
      },
    },
  },
  marcenaria: {
    exploracao: {
      label: 'Orcar marcenaria sob medida',
      href: '/solicite-proposta?service=Marcenaria&intent=marcenaria&stage=exploracao',
      external: false,
      reason: 'Voce esta avaliando marcenaria. O melhor proximo passo e sair da inspiracao e registrar medidas, estilo e nivel de acabamento.',
      secondary: {
        label: 'Ver portfolio',
        href: '/marcenaria',
        external: false,
      },
    },
    decisao: {
      label: 'Iniciar briefing de marcenaria',
      href: '/solicite-proposta?service=Marcenaria&intent=marcenaria&stage=decisao',
      external: false,
      reason: 'Voce ja tem contexto suficiente para transformar referencia visual em briefing e proposta.',
      secondary: {
        label: 'Ver exemplos reais',
        href: '/marcenaria',
        external: false,
      },
    },
    acao: {
      label: 'Falar com especialista em marcenaria',
      href: '/solicite-proposta?service=Marcenaria&intent=marcenaria&stage=acao',
      external: false,
      reason: 'A jornada chegou em momento de validacao pratica. O melhor proximo passo e atendimento humano para medicao, escopo e producao.',
      secondary: {
        label: 'Rever referencias',
        href: '/moodboard',
        external: false,
      },
    },
  },
  design: {
    exploracao: {
      label: 'Criar seu projeto com esse estilo',
      href: '/moodboard',
      external: false,
      reason: 'Voce esta explorando repertorio visual. O melhor proximo passo e transformar gosto em direcao estetica organizada.',
      secondary: {
        label: 'Ver exemplos reais',
        href: '/revista-estilos',
        external: false,
      },
    },
    decisao: {
      label: 'Gerar guia de estilo',
      href: '/moodboard',
      external: false,
      reason: 'Seu contexto indica decisao visual em andamento. O melhor proximo passo e consolidar referencias, paleta e ambientes em um documento compartilhavel.',
      secondary: {
        label: 'Levar para proposta',
        href: '/solicite-proposta?service=Sistema%20de%20Experi%C3%AAncia%20Visual&context=moodboard&intent=design&stage=decisao',
        external: false,
      },
    },
    acao: {
      label: 'Levar para projeto',
      href: '/solicite-proposta?service=Sistema%20de%20Experi%C3%AAncia%20Visual&context=moodboard&intent=design&stage=acao',
      external: false,
      reason: 'Voce ja organizou preferencia visual. O melhor proximo passo e converter essa direcao em briefing, proposta e escopo real.',
      secondary: {
        label: 'Abrir guia publico',
        href: '/moodboard',
        external: false,
      },
    },
  },
  investimento: {
    exploracao: {
      label: 'Ver analise do imovel',
      href: `${PRODUCT_URLS.easyrealstate}?source=site&intent=investimento&stage=exploracao`,
      external: true,
      reason: 'Voce demonstrou interesse em ativo e viabilidade. O melhor proximo passo e validar leitura de valor antes de avancar.',
      secondary: {
        label: 'Ver viabilidade do investimento',
        href: `${PRODUCT_URLS.obraeasy}/evf4?source=site&intent=investimento&stage=exploracao`,
        external: true,
      },
    },
    decisao: {
      label: 'Ver viabilidade do investimento',
      href: `${PRODUCT_URLS.obraeasy}/evf4?source=site&intent=investimento&stage=decisao`,
      external: true,
      reason: 'Voce esta comparando decisao com impacto financeiro. O melhor proximo passo e unir valor atual, potencial e custo de obra.',
      secondary: {
        label: 'Falar sobre o ativo',
        href: '/solicite-proposta?service=An%C3%A1lise+de+Viabilidade&intent=investimento&stage=decisao',
        external: false,
      },
    },
    acao: {
      label: 'Falar com especialista do ativo',
      href: '/solicite-proposta?service=An%C3%A1lise+de+Viabilidade&intent=investimento&stage=acao',
      external: false,
      reason: 'Seu contexto indica prontidao para uma leitura assistida. O melhor proximo passo e atendimento com EVF, AVM e custo conectados.',
      secondary: {
        label: 'Abrir Easy Real State',
        href: `${PRODUCT_URLS.easyrealstate}?source=site&intent=investimento&stage=acao`,
        external: true,
      },
    },
  },
  default: {
    exploracao: {
      label: 'Comecar meu projeto',
      href: '/solicite-proposta',
      external: false,
      reason: 'O sistema ainda esta consolidando seu contexto. O melhor proximo passo e abrir uma entrada guiada para a equipe enquadrar seu caso.',
      secondary: {
        label: 'Ver frentes da WG',
        href: '/buildtech',
        external: false,
      },
    },
  },
}

const MANUAL_ACTION_BY_INTENT = {
  obra: 'obra e reforma',
  marcenaria: 'marcenaria sob medida',
  design: 'experiencia visual e projeto',
  investimento: 'analise de viabilidade',
  default: 'seu projeto',
}

export function inferIntentFromPath(pathname = '') {
  for (const { match, interesse } of ROUTE_INTENT_MAP) {
    if (match.some((prefix) => pathname.startsWith(prefix))) return interesse
  }
  return null
}

export function inferPropertyTypeFromPath(pathname = '') {
  for (const { match, tipoImovel } of PROPERTY_ROUTE_RULES) {
    if (match.some((prefix) => pathname.startsWith(prefix) || pathname.includes(prefix))) return tipoImovel
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
    if (score > bestScore) {
      best = intent
      bestScore = score
    }
  }

  return { intent: best, score: bestScore }
}

export function inferStage(context = {}, pathname = '') {
  const explicitStage = context?.estagio
  const paginas = Array.isArray(context?.paginas) ? context.paginas : []
  const signals = context?.signals || {}
  const totalPages = paginas.length
  const { score: historyScore } = inferIntentFromHistory(paginas)
  const isActionRoute = pathname.startsWith('/solicite-proposta') || pathname.startsWith('/moodboard/share')
  const isDecisionRoute = pathname.startsWith('/moodboard') || pathname.startsWith('/room-visualizer')

  let inferredStage = 'exploracao'

  if (
    signals.viewedProposal
    || signals.usedMoodboard
    || signals.viewedObraEasy
    || signals.viewedEasyRealState
    || isActionRoute
  ) {
    inferredStage = 'acao'
  } else if (isDecisionRoute || totalPages >= 4 || historyScore >= 2) {
    inferredStage = 'decisao'
  }

  if ((STAGE_RANK[explicitStage] ?? 0) > (STAGE_RANK[inferredStage] ?? 0)) {
    return explicitStage
  }

  return inferredStage
}

export function getNBAScore(context = {}, pathname = '') {
  const { interesse, paginas = [], signals = {} } = context
  const fromPath = inferIntentFromPath(pathname)
  const { score: historyScore } = inferIntentFromHistory(paginas)
  const stage = inferStage(context, pathname)

  let confidence = 0
  if (interesse) confidence += 35
  if (fromPath) confidence += 20
  confidence += Math.min(historyScore * 10, 30)
  if (signals.viewedProposal || signals.usedMoodboard) confidence += 10
  if (signals.viewedObraEasy || signals.viewedEasyRealState) confidence += 10
  if (stage === 'decisao') confidence += 5
  if (stage === 'acao') confidence += 10

  return Math.min(confidence, 100)
}

const getManualAction = (intent = 'default') => ({
  label: 'Falar com especialista',
  href: `${COMPANY.whatsapp}?text=${encodeURIComponent(`Quero atendimento assistido sobre ${MANUAL_ACTION_BY_INTENT[intent] || MANUAL_ACTION_BY_INTENT.default}.`)}`,
  external: true,
})

export function getNextBestAction(context = {}, pathname = '') {
  const resolvedIntent =
    context?.interesse ||
    inferIntentFromPath(pathname) ||
    inferIntentFromHistory(context?.paginas || []).intent ||
    'default'

  const resolvedStage = inferStage(context, pathname)
  const score = getNBAScore(context, pathname)
  const typeFromPath = inferPropertyTypeFromPath(pathname)
  const library = ACTION_LIBRARY[resolvedIntent] || ACTION_LIBRARY.default
  const action = library[resolvedStage] || library.exploracao || ACTION_LIBRARY.default.exploracao

  return {
    ...action,
    intent: resolvedIntent,
    stage: resolvedStage,
    score,
    tipoImovel: context?.tipoImovel || typeFromPath || null,
    manual: getManualAction(resolvedIntent),
  }
}
