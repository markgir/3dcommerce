'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'
import { Search, Upload, User, Menu, X, Printer, LogOut, Settings, Globe } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslation, type Locale } from '@/lib/i18n'
import { useSiteSettings } from '@/lib/siteSettings'

export default function Navbar() {
  const { data: session } = useSession()
  const { t, locale, setLocale } = useTranslation()
  const { logoUrl } = useSiteSettings()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/explore?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale)
    setLangMenuOpen(false)
  }

  return (
    <nav className="bg-gray-900 text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-orange-400">
            {logoUrl ? (
              <img src={logoUrl} alt={t('common.appName')} className="h-8 w-auto max-w-[160px] object-contain" />
            ) : (
              <>
                <Printer className="w-7 h-7" />
                <span>{t('common.appName')}</span>
              </>
            )}
          </Link>

          {/* Search - desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('nav.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 text-sm"
              />
            </div>
          </form>

          {/* Nav links - desktop */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/explore" className="text-gray-300 hover:text-white text-sm font-medium">
              {t('nav.explore')}
            </Link>
            {session ? (
              <>
                <Link
                  href="/upload"
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {t('nav.upload')}
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 text-gray-300 hover:text-white"
                  >
                    {session.user.image ? (
                      <img src={session.user.image} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-sm font-bold">
                        {session.user.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-1">
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        {t('nav.myProfile')}
                      </Link>
                      {session.user.role === 'ADMIN' && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Settings className="w-4 h-4" />
                          {t('nav.adminPanel')}
                        </Link>
                      )}
                      <button
                        onClick={() => signOut()}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700"
                      >
                        <LogOut className="w-4 h-4" />
                        {t('nav.signOut')}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/signin"
                  className="text-gray-300 hover:text-white text-sm font-medium"
                >
                  {t('nav.signIn')}
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
                >
                  {t('nav.signUp')}
                </Link>
              </div>
            )}
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1 text-gray-300 hover:text-white text-sm"
              >
                <Globe className="w-4 h-4" />
                <span className="uppercase">{locale}</span>
              </button>
              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-1">
                  <button
                    onClick={() => handleLocaleChange('pt')}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 ${locale === 'pt' ? 'text-orange-400 font-medium' : 'text-gray-300 hover:text-white'}`}
                  >
                    {t('lang.pt')}
                  </button>
                  <button
                    onClick={() => handleLocaleChange('en')}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 ${locale === 'en' ? 'text-orange-400 font-medium' : 'text-gray-300 hover:text-white'}`}
                  >
                    {t('lang.en')}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-300 hover:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 pt-2 border-t border-gray-700">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('nav.searchPlaceholder')}
                  className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 text-sm"
                />
              </div>
            </form>
            <div className="flex flex-col gap-2">
              <Link href="/explore" className="text-gray-300 hover:text-white py-2">{t('nav.explore')}</Link>
              {session ? (
                <>
                  <Link href="/upload" className="text-gray-300 hover:text-white py-2">{t('nav.uploadModel')}</Link>
                  <Link href="/profile" className="text-gray-300 hover:text-white py-2">{t('nav.myProfile')}</Link>
                  {session.user.role === 'ADMIN' && (
                    <Link href="/admin" className="text-gray-300 hover:text-white py-2">{t('nav.adminPanel')}</Link>
                  )}
                  <button onClick={() => signOut()} className="text-left text-gray-300 hover:text-white py-2">
                    {t('nav.signOut')}
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/signin" className="text-gray-300 hover:text-white py-2">{t('nav.signIn')}</Link>
                  <Link href="/auth/signup" className="text-gray-300 hover:text-white py-2">{t('nav.signUp')}</Link>
                </>
              )}
              {/* Mobile language switcher */}
              <div className="border-t border-gray-700 pt-2 mt-2 flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <button
                  onClick={() => handleLocaleChange('pt')}
                  className={`text-sm ${locale === 'pt' ? 'text-orange-400 font-medium' : 'text-gray-300'}`}
                >
                  PT
                </button>
                <span className="text-gray-600">|</span>
                <button
                  onClick={() => handleLocaleChange('en')}
                  className={`text-sm ${locale === 'en' ? 'text-orange-400 font-medium' : 'text-gray-300'}`}
                >
                  EN
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
