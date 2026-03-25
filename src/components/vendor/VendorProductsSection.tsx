'use client'

import { useState, useEffect } from 'react'
import { ShoppingBag, ArrowRight } from 'lucide-react'
import VendorProductCard from './VendorProductCard'
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

interface VendorProductsSectionProps {
  limit?: number
  className?: string
}

export default function VendorProductsSection({ limit = 4, className = '' }: VendorProductsSectionProps) {
  const { t } = useTranslation()
  const [products, setProducts] = useState<VendorProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/vendor-products?limit=${limit}`)
      .then((r) => r.json())
      .then((data) => setProducts(data.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [limit])

  if (loading || products.length === 0) return null

  return (
    <section className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-orange-500" />
          <h2 className="text-2xl font-bold text-gray-900">{t('vendor.shopProducts')}</h2>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <VendorProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
