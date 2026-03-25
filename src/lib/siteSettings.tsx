'use client'

import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react'

interface SiteSettingsContextType {
  logoUrl: string | null
  refresh: () => Promise<void>
}

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  logoUrl: null,
  refresh: async () => {},
})

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const didFetch = useRef(false)

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        setLogoUrl(data.logoUrl || null)
      }
    } catch {
      // silently ignore
    }
  }, [])

  useEffect(() => {
    if (!didFetch.current) {
      didFetch.current = true
      fetchSettings()
    }
  }, [fetchSettings])

  return (
    <SiteSettingsContext.Provider value={{ logoUrl, refresh: fetchSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  )
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext)
}
