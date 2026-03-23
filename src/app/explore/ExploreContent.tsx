'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import ModelCard from '@/components/models/ModelCard'
import AdBanner from '@/components/ads/AdBanner'
import { Search, Filter, SortAsc } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  icon?: string
  color?: string
}

interface Model {
  id: string
  title: string
  description: string
  downloads: number
  likesCount: number
  views: number
  tags: string
  createdAt: string
  images: { url: string; isMain: boolean }[]
  category: { name: string; slug: string; color?: string }
  user: { id: string; name: string; avatar?: string }
}

export default function ExploreContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [models, setModels] = useState<Model[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''
  const sort = searchParams.get('sort') || 'newest'
  const featured = searchParams.get('featured') || ''

  const fetchModels = useCallback(async (currentPage: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        sort,
        ...(search && { search }),
        ...(category && { category }),
        ...(featured && { featured }),
      })
      const res = await fetch(`/api/models?${params}`)
      const data = await res.json()
      if (currentPage === 1) {
        setModels(data.models)
      } else {
        setModels((prev) => [...prev, ...data.models])
      }
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }, [search, category, sort, featured])

  useEffect(() => {
    setPage(1)
    fetchModels(1)
  }, [fetchModels])

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then(setCategories)
  }, [])

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/explore?${params}`)
  }

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchModels(nextPage)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 sticky top-20">
            {/* Search */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <Search className="w-4 h-4" /> Search
              </label>
              <input
                type="text"
                defaultValue={search}
                placeholder="Search models..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updateFilter('search', (e.target as HTMLInputElement).value)
                  }
                }}
              />
            </div>

            {/* Sort */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <SortAsc className="w-4 h-4" /> Sort By
              </label>
              <select
                value={sort}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
              >
                <option value="newest">Newest First</option>
                <option value="popular">Most Downloaded</option>
                <option value="likes">Most Liked</option>
              </select>
            </div>

            {/* Category filter */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <Filter className="w-4 h-4" /> Category
              </label>
              <div className="space-y-1">
                <button
                  onClick={() => updateFilter('category', '')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!category ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => updateFilter('category', cat.slug)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${category === cat.slug ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <span>{cat.icon || '📦'}</span>
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Ad in sidebar */}
            <AdBanner placement="sidebar" />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1">
          {/* Active filters */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-500">{total.toLocaleString()} models</span>
              {search && (
                <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">
                  Search: &quot;{search}&quot;
                  <button onClick={() => updateFilter('search', '')} className="ml-1 text-orange-400 hover:text-orange-600">×</button>
                </span>
              )}
              {category && (
                <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">
                  {categories.find((c) => c.slug === category)?.name}
                  <button onClick={() => updateFilter('category', '')} className="ml-1 text-orange-400 hover:text-orange-600">×</button>
                </span>
              )}
              {featured && (
                <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">
                  Featured
                  <button onClick={() => updateFilter('featured', '')} className="ml-1 text-orange-400 hover:text-orange-600">×</button>
                </span>
              )}
            </div>
          </div>

          {loading && models.length === 0 ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : models.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">No models found</p>
              <p className="text-gray-300 text-sm mt-2">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {models.map((model) => (
                  <ModelCard key={model.id} model={model} />
                ))}
              </div>

              {models.length < total && (
                <div className="text-center mt-8">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold px-8 py-3 rounded-full transition-colors"
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
