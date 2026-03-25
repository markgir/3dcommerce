'use client'

import { ExternalLink, ShoppingCart } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

interface VendorProduct {
  id: string
  name: string
  description: string
  price: number
  imageUrl?: string | null
  linkUrl?: string | null
  productType: string
  vendor: { name: string }
}

export default function VendorProductCard({ product }: { product: VendorProduct }) {
  const { t } = useTranslation()

  const typeLabels: Record<string, string> = {
    FILAMENT: t('vendor.typeFilament'),
    PRINTER: t('vendor.typePrinter'),
    ACCESSORY: t('vendor.typeAccessory'),
    OTHER: t('vendor.typeOther'),
  }

  const typeColors: Record<string, string> = {
    FILAMENT: 'bg-blue-100 text-blue-700',
    PRINTER: 'bg-green-100 text-green-700',
    ACCESSORY: 'bg-purple-100 text-purple-700',
    OTHER: 'bg-gray-100 text-gray-700',
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 transition-all duration-200 flex flex-col">
      {/* Image */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
            <ShoppingCart className="w-12 h-12 text-orange-300" />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${typeColors[product.productType] || typeColors.OTHER}`}>
            {typeLabels[product.productType] || product.productType}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 mb-1">
          {product.name}
        </h3>
        <p className="text-gray-500 text-xs line-clamp-2 mb-2">{product.description}</p>

        <div className="mt-auto pt-2 border-t border-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-bold text-orange-500">€{product.price.toFixed(2)}</span>
            <span className="text-xs text-gray-400">{t('vendor.soldBy')} {product.vendor.name}</span>
          </div>
          {product.linkUrl && (
            <a
              href={product.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {t('vendor.buyNow')}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
