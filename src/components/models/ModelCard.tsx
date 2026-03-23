import Link from 'next/link'
import { Download, Heart, Eye, Tag } from 'lucide-react'

interface ModelCardProps {
  model: {
    id: string
    title: string
    description: string
    downloads: number
    likesCount: number
    views: number
    tags: string
    createdAt: string | Date
    images: { url: string; isMain: boolean }[]
    category: { name: string; slug: string; color?: string | null }
    user: { id: string; name: string; avatar?: string | null }
  }
}

export default function ModelCard({ model }: ModelCardProps) {
  const mainImage = model.images.find((img) => img.isMain) || model.images[0]
  const tagList = model.tags ? model.tags.split(',').slice(0, 3) : []

  return (
    <Link href={`/models/${model.id}`} className="group block">
      <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200">
        {/* Image */}
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
          {mainImage ? (
            <img
              src={mainImage.url}
              alt={model.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <svg className="w-16 h-16 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.16L20 8.5v7L12 19.84 4 15.5v-7L12 4.16z" />
              </svg>
            </div>
          )}
          {/* Category badge */}
          <div className="absolute top-2 left-2">
            <span
              className="text-xs font-medium px-2 py-1 rounded-full text-white"
              style={{ backgroundColor: model.category.color || '#6366f1' }}
            >
              {model.category.name}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-3">
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 mb-1 group-hover:text-orange-500 transition-colors">
            {model.title}
          </h3>
          <p className="text-gray-500 text-xs line-clamp-2 mb-2">{model.description}</p>

          {/* Tags */}
          {tagList.length > 0 && (
            <div className="flex gap-1 flex-wrap mb-2">
              {tagList.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-0.5 text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                  <Tag className="w-2.5 h-2.5" />
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-50">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Download className="w-3 h-3" />
                {model.downloads.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {model.likesCount.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {model.views.toLocaleString()}
              </span>
            </div>
            <span className="text-gray-400 text-xs">{model.user.name}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
