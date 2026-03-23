import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import ModelCard from '@/components/models/ModelCard'
import AdBanner from '@/components/ads/AdBanner'
import { Search, Download, Users, Star, ArrowRight } from 'lucide-react'

async function getHomeData() {
  const [featuredModels, popularModels, categories, modelCount, userCount, downloadCount] = await Promise.all([
    prisma.model3D.findMany({
      where: { isFeatured: true, isPublished: true },
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        user: { select: { id: true, name: true, avatar: true } },
        images: { where: { isMain: true }, take: 1 },
      },
    }),
    prisma.model3D.findMany({
      where: { isPublished: true },
      take: 8,
      orderBy: { downloads: 'desc' },
      include: {
        category: true,
        user: { select: { id: true, name: true, avatar: true } },
        images: { where: { isMain: true }, take: 1 },
      },
    }),
    prisma.category.findMany({
      take: 8,
      include: { _count: { select: { models: true } } },
    }),
    prisma.model3D.count({ where: { isPublished: true } }),
    prisma.user.count(),
    prisma.download.count(),
  ])

  return { featuredModels, popularModels, categories, modelCount, userCount, downloadCount }
}

export default async function HomePage() {
  const { featuredModels, popularModels, categories, modelCount, userCount, downloadCount } = await getHomeData()

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            Discover & Share <span className="text-orange-400">3D Models</span>
          </h1>
          <p className="text-gray-300 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            Thousands of free 3D printing designs. Download, print, and share your creations with the community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/explore"
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-full transition-colors flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              Browse Models
            </Link>
            <Link
              href="/auth/signup"
              className="border border-gray-500 hover:border-gray-300 text-white font-semibold px-8 py-3 rounded-full transition-colors"
            >
              Upload Your Design
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-orange-500 py-6">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-3 gap-4 text-center text-white">
          <div>
            <div className="text-2xl md:text-3xl font-bold">{modelCount.toLocaleString()}+</div>
            <div className="text-orange-100 text-sm">Free Models</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-bold">{userCount.toLocaleString()}+</div>
            <div className="text-orange-100 text-sm">Creators</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-bold">{downloadCount.toLocaleString()}+</div>
            <div className="text-orange-100 text-sm">Downloads</div>
          </div>
        </div>
      </section>

      {/* Header Ad */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <AdBanner placement="header" />
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Browse by Category</h2>
            <Link href="/explore" className="text-orange-500 hover:text-orange-600 text-sm font-medium flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/explore?category=${cat.slug}`}
                className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all group"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                  style={{ backgroundColor: (cat.color || '#6366f1') + '20' }}
                >
                  {cat.icon || '📦'}
                </div>
                <span className="text-xs font-medium text-gray-700 text-center group-hover:text-orange-500 leading-tight">
                  {cat.name}
                </span>
                <span className="text-xs text-gray-400">{cat._count.models}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Models */}
      {featuredModels.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-orange-500" />
              <h2 className="text-2xl font-bold text-gray-900">Featured Models</h2>
            </div>
            <Link href="/explore?featured=true" className="text-orange-500 hover:text-orange-600 text-sm font-medium flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {featuredModels.map((model) => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
        </section>
      )}

      {/* Inline Ad */}
      <div className="max-w-7xl mx-auto px-4">
        <AdBanner placement="inline" />
      </div>

      {/* Popular Models */}
      {popularModels.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-orange-500" />
              <h2 className="text-2xl font-bold text-gray-900">Most Downloaded</h2>
            </div>
            <Link href="/explore?sort=popular" className="text-orange-500 hover:text-orange-600 text-sm font-medium flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {popularModels.map((model) => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {featuredModels.length === 0 && popularModels.length === 0 && (
        <section className="max-w-7xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-400 text-lg mb-4">No models yet. Be the first to upload!</p>
          <Link href="/upload" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-full transition-colors">
            Upload a Model
          </Link>
        </section>
      )}

      {/* CTA Section */}
      <section className="bg-gray-900 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <Users className="w-12 h-12 text-orange-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
          <p className="text-gray-300 mb-8 text-lg">
            Share your 3D designs, get feedback from the community, and help others print amazing things.
          </p>
          <Link
            href="/auth/signup"
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-full transition-colors"
          >
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer Ad */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <AdBanner placement="footer" />
      </div>
    </div>
  )
}
