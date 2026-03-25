'use client'

import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react'
import pt from '@/lib/translations/pt'
import en from '@/lib/translations/en'

export type Locale = 'pt' | 'en'
export type TranslationKey = keyof typeof pt

const defaultTranslations: Record<Locale, Record<string, string>> = { pt, en }

function getInitialLocale(): Locale {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('locale') as Locale | null
    if (saved && defaultTranslations[saved]) {
      return saved
    }
  }
  return 'pt'
}

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey) => string
  refreshOverrides: () => Promise<void>
}

const I18nContext = createContext<I18nContextType>({
  locale: 'pt',
  setLocale: () => {},
  t: (key) => key,
  refreshOverrides: async () => {},
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale)
  const [overrides, setOverrides] = useState<Record<string, Record<string, string>>>({})
  const didFetch = useRef(false)

  const fetchOverrides = useCallback(async () => {
    try {
      const res = await fetch('/api/translations')
      if (res.ok) {
        const data = await res.json()
        setOverrides(data)
      }
    } catch {
      // silently ignore – use defaults
    }
  }, [])

  useEffect(() => {
    if (!didFetch.current) {
      didFetch.current = true
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchOverrides()
    }
  }, [fetchOverrides])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('locale', newLocale)
    document.documentElement.lang = newLocale
  }, [])

  const t = useCallback(
    (key: TranslationKey): string =>
      overrides[locale]?.[key] ?? defaultTranslations[locale]?.[key] ?? key,
    [locale, overrides]
  )

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, refreshOverrides: fetchOverrides }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslation() {
  return useContext(I18nContext)
}

export { defaultTranslations }
