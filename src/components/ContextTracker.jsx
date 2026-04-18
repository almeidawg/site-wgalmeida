import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useWGContext } from '@/providers/ContextProvider'
import { inferIntentFromPath, inferStage } from '@/lib/decisionEngine'

export default function ContextTracker() {
  const { setContext } = useWGContext()
  const location = useLocation()

  useEffect(() => {
    const pathname = location.pathname
    const intent = inferIntentFromPath(pathname)

    setContext((prev) => {
      const paginas = [...new Set([...(prev.paginas || []), pathname])].slice(-20)
      const nextCtx = {
        ...prev,
        paginas,
        interesse: prev.interesse || intent || prev.interesse,
      }
      const inferredStage = inferStage(nextCtx)
      // Only promote stage, never demote (exploracao → decisao → acao)
      const STAGE_RANK = { exploracao: 0, decisao: 1, acao: 2 }
      const currentRank = STAGE_RANK[nextCtx.estagio] ?? 0
      const inferredRank = STAGE_RANK[inferredStage] ?? 0
      return {
        ...nextCtx,
        estagio: inferredRank > currentRank ? inferredStage : nextCtx.estagio,
      }
    })
  }, [location.pathname, setContext])

  return null
}
