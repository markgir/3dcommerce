'use client'

import Link from 'next/link'
import { Printer, Github, Twitter, Mail } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { useSiteSettings } from '@/lib/siteSettings'

export default function Footer() {
  const { t } = useTranslation()
  const { logoUrl } = useSiteSettings()

  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-orange-400 mb-3">
              {logoUrl ? (
                <img src={logoUrl} alt={t('common.appName')} className="h-7 w-auto max-w-[160px] object-contain" />
              ) : (
                <>
                  <Printer className="w-6 h-6" />
                  <span>{t('common.appName')}</span>
                </>
              )}
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              {t('footer.description')}
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">{t('footer.explore')}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/explore" className="hover:text-white transition-colors">{t('footer.allModels')}</Link></li>
              <li><Link href="/explore?featured=true" className="hover:text-white transition-colors">{t('footer.featured')}</Link></li>
              <li><Link href="/explore?sort=popular" className="hover:text-white transition-colors">{t('footer.mostDownloaded')}</Link></li>
              <li><Link href="/explore?sort=likes" className="hover:text-white transition-colors">{t('footer.mostLiked')}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">{t('footer.community')}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/auth/signup" className="hover:text-white transition-colors">{t('footer.joinUs')}</Link></li>
              <li><Link href="/upload" className="hover:text-white transition-colors">{t('footer.uploadAModel')}</Link></li>
              <li><Link href="/profile" className="hover:text-white transition-colors">{t('footer.myProfile')}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">{t('footer.about')}</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.aboutUs')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.terms')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.privacy')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t('footer.contact')}</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            {t('footer.copyright')}
          </p>
          <p className="text-sm text-gray-500">
            {t('footer.madeWith')}
          </p>
        </div>
      </div>
    </footer>
  )
}
