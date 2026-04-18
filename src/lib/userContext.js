export const STAGE_RANK = {
  exploracao: 0,
  decisao: 1,
  acao: 2,
}

export const DEFAULT_USER_CONTEXT = {
  interesse: null,
  tipoImovel: null,
  faixaValor: null,
  estagio: 'exploracao',
  origem: null,
  paginas: [],
  lastPath: '',
  recommendedAction: null,
  updatedAt: null,
  signals: {
    viewedProposal: false,
    usedMoodboard: false,
    viewedInvestment: false,
    viewedObraEasy: false,
    viewedEasyRealState: false,
  },
}

const normalizePages = (value) => (
  Array.isArray(value)
    ? value.filter((entry) => typeof entry === 'string' && entry.trim())
    : []
)

const normalizeSignals = (value) => ({
  ...DEFAULT_USER_CONTEXT.signals,
  ...(value && typeof value === 'object' ? value : {}),
})

export function normalizeUserContext(value) {
  if (!value || typeof value !== 'object') {
    return { ...DEFAULT_USER_CONTEXT }
  }

  return {
    ...DEFAULT_USER_CONTEXT,
    ...value,
    paginas: normalizePages(value.paginas),
    signals: normalizeSignals(value.signals),
  }
}

export function promoteStage(currentStage = 'exploracao', nextStage = 'exploracao') {
  const currentRank = STAGE_RANK[currentStage] ?? 0
  const nextRank = STAGE_RANK[nextStage] ?? 0
  return nextRank > currentRank ? nextStage : currentStage
}
