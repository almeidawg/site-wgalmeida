import { useLocation } from 'react-router-dom'
import { useWGContext } from '@/providers/ContextProvider'
import { getNextBestAction, getNBAScore, inferStage } from '@/lib/decisionEngine'

export function useNextBestAction() {
  const location = useLocation()
  const ctx = useWGContext()
  const context = ctx?.context || {}
  const action = getNextBestAction(context, location.pathname)
  const score = getNBAScore(context, location.pathname)
  const stage = inferStage(context)
  return { ...action, score, stage }
}
