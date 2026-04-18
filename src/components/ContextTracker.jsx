import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useWGContext } from '@/providers/ContextProvider'
import {
  getNextBestAction,
  inferIntentFromPath,
  inferPropertyTypeFromPath,
  inferStage,
} from '@/lib/decisionEngine'
import { promoteStage } from '@/lib/userContext'

const getSignalsFromPath = (pathname = '') => ({
  viewedProposal: pathname.startsWith('/solicite-proposta'),
  usedMoodboard: pathname.startsWith('/moodboard') || pathname.startsWith('/room-visualizer'),
  viewedInvestment: pathname.startsWith('/calculo') || pathname.startsWith('/iccri') || pathname.startsWith('/evf'),
  viewedObraEasy: pathname.startsWith('/obraeasy'),
  viewedEasyRealState: pathname.startsWith('/easyrealestate') || pathname.startsWith('/imovel'),
})

export default function ContextTracker() {
  const { setContext } = useWGContext()
  const location = useLocation()

  useEffect(() => {
    const pathname = location.pathname
    const query = new URLSearchParams(location.search)
    const intent = inferIntentFromPath(pathname)
    const tipoImovel = inferPropertyTypeFromPath(pathname)
    const nextSignals = getSignalsFromPath(pathname)
    const explicitStage = query.get('stage')

    setContext((prev) => {
      const paginas = [...new Set([...(prev.paginas || []), pathname])].slice(-20)
      const nextCtx = {
        ...prev,
        paginas,
        interesse: prev.interesse || intent || prev.interesse,
        tipoImovel: prev.tipoImovel || query.get('propertyType') || tipoImovel || null,
        faixaValor: prev.faixaValor || query.get('valueRange') || null,
        origem: prev.origem || query.get('source') || pathname,
        lastPath: pathname,
        updatedAt: new Date().toISOString(),
        signals: {
          ...(prev.signals || {}),
          viewedProposal: prev?.signals?.viewedProposal || nextSignals.viewedProposal,
          usedMoodboard: prev?.signals?.usedMoodboard || nextSignals.usedMoodboard,
          viewedInvestment: prev?.signals?.viewedInvestment || nextSignals.viewedInvestment,
          viewedObraEasy: prev?.signals?.viewedObraEasy || nextSignals.viewedObraEasy,
          viewedEasyRealState: prev?.signals?.viewedEasyRealState || nextSignals.viewedEasyRealState,
        },
      }
      const inferredStage = inferStage(nextCtx, pathname)
      const promotedStage = explicitStage
        ? promoteStage(inferStage(nextCtx, pathname), explicitStage)
        : promoteStage(nextCtx.estagio, inferredStage)
      const action = getNextBestAction({ ...nextCtx, estagio: promotedStage }, pathname)

      return {
        ...nextCtx,
        estagio: promotedStage,
        recommendedAction: {
          label: action.label,
          href: action.href,
          intent: action.intent,
          stage: action.stage,
          score: action.score,
        },
      }
    })
  }, [location.pathname, location.search, setContext])

  return null
}
