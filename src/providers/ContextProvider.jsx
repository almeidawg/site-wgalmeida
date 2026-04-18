import { createContext, useContext, useState, useEffect } from 'react'

const WGContext = createContext(null)

const STORAGE_KEY = 'wg_context_v1'

const DEFAULT_CONTEXT = {
  interesse: null,
  estagio: 'exploracao',
  paginas: [],
  origem: null,
}

export function ContextProvider({ children }) {
  const [context, setContext] = useState(DEFAULT_CONTEXT)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setContext(JSON.parse(saved))
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(context))
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
