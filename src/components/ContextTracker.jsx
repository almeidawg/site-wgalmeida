import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useWGContext } from '@/providers/ContextProvider'
import { inferIntentFromPath } from '@/lib/decisionEngine'

export default function ContextTracker() {
  const { setContext } = useWGContext()
  const location = useLocation()

  useEffect(() => {
    const pathname = location.pathname
    const intent = inferIntentFromPath(pathname)

    setContext((prev) => {
      const paginas = [...new Set([...(prev.paginas || []), pathname])].slice(-20)
      return {
        ...prev,
        paginas,
        interesse: prev.interesse || intent || prev.interesse,
      }
    })
  }, [location.pathname, setContext])

  return null
}
