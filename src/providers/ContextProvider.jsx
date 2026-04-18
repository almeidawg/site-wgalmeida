import { createContext, useContext, useState, useEffect } from 'react'
import { DEFAULT_USER_CONTEXT, normalizeUserContext } from '@/lib/userContext'

const WGContext = createContext(null)

const STORAGE_KEY = 'wg_context_v1'

export function ContextProvider({ children }) {
  const [context, setContext] = useState(DEFAULT_USER_CONTEXT)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setContext(normalizeUserContext(JSON.parse(saved)))
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeUserContext(context)))
    } catch {
      // ignore
    }
  }, [context])

  return (
    <WGContext.Provider value={{ context, setContext }}>
      {children}
    </WGContext.Provider>
  )
}

export const useWGContext = () => useContext(WGContext)
