'use client'

import { SessionProvider } from 'next-auth/react'
import { I18nProvider } from '@/lib/i18n'
import { SiteSettingsProvider } from '@/lib/siteSettings'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <I18nProvider>
        <SiteSettingsProvider>{children}</SiteSettingsProvider>
      </I18nProvider>
    </SessionProvider>
  )
}
