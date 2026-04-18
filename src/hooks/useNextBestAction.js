import { useLocation } from 'react-router-dom'
import { useWGContext } from '@/providers/ContextProvider'
import { getNextBestAction } from '@/lib/decisionEngine'

export function useNextBestAction() {
  const location = useLocation()
  const ctx = useWGContext()
  const context = ctx?.context || {}
  return getNextBestAction(context, location.pathname)
}
