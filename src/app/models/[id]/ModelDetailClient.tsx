'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import AdBanner from '@/components/ads/AdBanner'
import {
  Download,
  Heart,
  Eye,
  Tag,
  Calendar,
  User,
  MessageSquare,
  Share2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react'

interface Comment {
  id: string
  content: string
  createdAt: Date | string
  user: { id: string; name: string; avatar?: string | null }
}

interface ModelFile {
  id: string
  filename: string
  url: string
  size: number
}

interface ModelImage {
  id: string
  url: string
  isMain: boolean
}

interface Model {
  id: string
  title: string
  description: string
  tags: string
  license: string
  downloads: number
  likesCount: number
  views: number
  createdAt: Date | string
  category: { id: string; name: string; slug: string; color?: string | null }
  user: { id: string; name: string; avatar?: string | null; bio?: string | null }
  images: ModelImage[]
  files: ModelFile[]
  comments: Comment[]
}

export default function ModelDetailClient({ model }: { model: Model }) {
  const { data: session } = useSession()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [downloading, setDownloading] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(model.likesCount)
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState(model.comments)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [downloadFiles, setDownloadFiles] = useState<ModelFile[]>([])
  const [showDownloadModal, setShowDownloadModal] = useState(false)

  const tagList = model.tags ? model.tags.split(',').filter(Boolean) : []

  const handleLike = async () => {
    if (!session) {
      window.location.href = '/auth/signin'
      return
    }
    const res = await fetch(`/api/models/${model.id}/like`, { method: 'POST' })
    const data = await res.json()
    setLiked(data.liked)
    setLikesCount((prev) => (data.liked ? prev + 1 : prev - 1))
  }

  const handleDownload = async () => {
    setDownloading(true)
    const res = await fetch(`/api/models/${model.id}/download`, { method: 'POST' })
    const data = await res.json()
    setDownloadFiles(data.files || [])
    setShowDownloadModal(true)
    setDownloading(false)
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session || !comment.trim()) return
    setSubmittingComment(true)
    const res = await fetch(`/api/models/${model.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: comment }),
    })
    const newComment = await res.json()
    if (res.ok) {
      setComments([newComment, ...comments])
      setComment('')
    }
    setSubmittingComment(false)
  }

  const formatDate = (date: string | Date) =>
    new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/explore" className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Explore
      </Link>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left column */}
        <div className="lg:flex-1">
          {/* Image gallery */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 mb-6">
            <div className="relative aspect-square bg-gray-100">
              {model.images.length > 0 ? (
                <img
                  src={model.images[currentImageIndex]?.url}
                  alt={model.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-24 h-24 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.16L20 8.5v7L12 19.84 4 15.5v-7L12 4.16z" />
                  </svg>
                </div>
              )}
              {model.images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex((i) => (i - 1 + model.images.length) % model.images.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 shadow hover:bg-white"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((i) => (i + 1) % model.images.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 shadow hover:bg-white"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
            {/* Thumbnails */}
            {model.images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {model.images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${idx === currentImageIndex ? 'border-orange-400' : 'border-transparent'}`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ad */}
          <AdBanner placement="inline" className="mb-6" />

          {/* Comments */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-orange-500" />
              Comments ({comments.length})
            </h3>

            {session ? (
              <form onSubmit={handleComment} className="mb-6">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts or ask a question..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 resize-none"
                  rows={3}
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={submittingComment || !comment.trim()}
                    className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium px-6 py-2 rounded-lg text-sm transition-colors"
                  >
                    {submittingComment ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-gray-500 mb-4">
                <Link href="/auth/signin" className="text-orange-500 hover:underline">Sign in</Link> to leave a comment
              </p>
            )}

            <div className="space-y-4">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 text-orange-600 font-semibold text-xs">
                    {c.user.avatar ? (
                      <img src={c.user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      c.user.name[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">{c.user.name}</span>
                      <span className="text-xs text-gray-400">{formatDate(c.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700">{c.content}</p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-4">No comments yet. Be the first!</p>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-20">
            {/* Category */}
            <div className="mb-3">
              <Link
                href={`/explore?category=${model.category.slug}`}
                className="inline-flex text-xs font-medium px-3 py-1 rounded-full text-white"
                style={{ backgroundColor: model.category.color || '#6366f1' }}
              >
                {model.category.name}
              </Link>
            </div>

            <h1 className="text-xl font-bold text-gray-900 mb-2">{model.title}</h1>

            {/* Author */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold text-xs">
                <User className="w-4 h-4" />
              </div>
              <span className="text-sm text-gray-600">{model.user.name}</span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4 py-3 border-y border-gray-100">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-gray-500 mb-0.5">
                  <Download className="w-4 h-4" />
                </div>
                <div className="text-sm font-semibold text-gray-900">{model.downloads.toLocaleString()}</div>
                <div className="text-xs text-gray-400">Downloads</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-gray-500 mb-0.5">
                  <Heart className="w-4 h-4" />
                </div>
                <div className="text-sm font-semibold text-gray-900">{likesCount.toLocaleString()}</div>
                <div className="text-xs text-gray-400">Likes</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-gray-500 mb-0.5">
                  <Eye className="w-4 h-4" />
                </div>
                <div className="text-sm font-semibold text-gray-900">{model.views.toLocaleString()}</div>
                <div className="text-xs text-gray-400">Views</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                {downloading ? 'Preparing...' : 'Download'}
              </button>
              <button
                onClick={handleLike}
                className={`p-3 rounded-xl border transition-colors ${liked ? 'bg-red-50 border-red-200 text-red-500' : 'border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-400'}`}
              >
                <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(window.location.href)}
                className="p-3 rounded-xl border border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600 transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 text-sm mb-2">Description</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{model.description}</p>
            </div>

            {/* Tags */}
            {tagList.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-1">
                  <Tag className="w-4 h-4" /> Tags
                </h3>
                <div className="flex flex-wrap gap-1">
                  {tagList.map((tag) => (
                    <Link
                      key={tag}
                      href={`/explore?search=${encodeURIComponent(tag.trim())}`}
                      className="text-xs bg-gray-100 hover:bg-orange-50 hover:text-orange-600 text-gray-600 px-2 py-1 rounded-full transition-colors"
                    >
                      {tag.trim()}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Details */}
            <div className="space-y-2 text-xs text-gray-500 border-t border-gray-100 pt-4">
              <div className="flex justify-between">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Published</span>
                <span>{formatDate(model.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>License</span>
                <span className="font-medium text-gray-700">{model.license}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Files</span>
                <span>{model.files.length} file{model.files.length !== 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Ad */}
            <div className="mt-4">
              <AdBanner placement="sidebar" />
            </div>
          </div>
        </div>
      </div>

      {/* Download Modal */}
      {showDownloadModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
          onClick={() => setShowDownloadModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
              <Download className="w-5 h-5 text-orange-500" />
              Download Files
            </h3>
            {downloadFiles.length > 0 ? (
              <div className="space-y-2">
                {downloadFiles.map((file) => (
                  <a
                    key={file.id}
                    href={file.url}
                    download={file.filename}
                    className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:border-orange-200 hover:bg-orange-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-400 group-hover:text-orange-500" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{file.filename}</div>
                        <div className="text-xs text-gray-400">{formatFileSize(file.size)}</div>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-gray-300 group-hover:text-orange-500" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No files available for download</p>
            )}
            {/* Ad in download modal */}
            <div className="mt-4">
              <AdBanner placement="inline" />
            </div>
            <button
              onClick={() => setShowDownloadModal(false)}
              className="w-full mt-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
