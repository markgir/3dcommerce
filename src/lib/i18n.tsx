'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import pt from '@/lib/translations/pt'
import en from '@/lib/translations/en'

export type Locale = 'pt' | 'en'
export type TranslationKey = keyof typeof pt

const translations: Record<Locale, Record<string, string>> = { pt, en }

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey) => string
}

const I18nContext = createContext<I18nContextType>({
  locale: 'pt',
  setLocale: () => {},
  t: (key) => key,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('pt')

  useEffect(() => {
    const saved = localStorage.getItem('locale') as Locale | null
    if (saved && translations[saved]) {
      setLocaleState(saved)
      document.documentElement.lang = saved
    }
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('locale', newLocale)
    document.documentElement.lang = newLocale
  }, [])

  const t = useCallback(
    (key: TranslationKey): string => translations[locale]?.[key] ?? key,
    [locale]
  )

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslation() {
  return useContext(I18nContext)
}
