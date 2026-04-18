import { describe, expect, it } from 'vitest'
import {
  getNBAScore,
  getNextBestAction,
  inferIntentFromHistory,
  inferIntentFromPath,
  inferPropertyTypeFromPath,
  inferStage,
} from '@/lib/decisionEngine'

describe('decisionEngine', () => {
  it('infers intent from route', () => {
    expect(inferIntentFromPath('/moodboard')).toBe('design')
    expect(inferIntentFromPath('/calculo')).toBe('investimento')
    expect(inferIntentFromPath('/marcenaria')).toBe('marcenaria')
  })

  it('infers property type from route', () => {
    expect(inferPropertyTypeFromPath('/reforma-apartamento')).toBe('apartamento')
    expect(inferPropertyTypeFromPath('/arquitetura-corporativa')).toBe('corporativo')
    expect(inferPropertyTypeFromPath('/moodboard')).toBe('interiores')
  })

  it('promotes to acao when proposal or moodboard signals exist', () => {
    expect(
      inferStage({
        paginas: ['/moodboard', '/revista-estilos'],
        signals: { usedMoodboard: true },
      }, '/moodboard')
    ).toBe('acao')

    expect(
      inferStage({
        paginas: ['/blog/estilo'],
        signals: { viewedProposal: true },
      }, '/solicite-proposta')
    ).toBe('acao')
  })

  it('uses history when interest is not explicit', () => {
    expect(
      inferIntentFromHistory([
        '/blog/reforma-apartamento',
        '/obra-turn-key',
        '/arquitetura',
      ])
    ).toEqual({ intent: 'obra', score: 3 })
  })

  it('returns stage-aware next best action with manual fallback', () => {
    const action = getNextBestAction({
      interesse: 'design',
      estagio: 'decisao',
      paginas: ['/moodboard', '/revista-estilos'],
      signals: {},
    }, '/moodboard')

    expect(action.intent).toBe('design')
    expect(action.stage).toBe('decisao')
    expect(action.label).toBe('Gerar guia de estilo')
    expect(action.manual.label).toBe('Falar com especialista')
  })

  it('increases confidence with explicit context and action signals', () => {
    const score = getNBAScore({
      interesse: 'investimento',
      estagio: 'acao',
      paginas: ['/calculo', '/evf', '/iccri'],
      signals: {
        viewedEasyRealState: true,
        viewedProposal: true,
      },
    }, '/solicite-proposta')

    expect(score).toBeGreaterThanOrEqual(80)
  })
})
