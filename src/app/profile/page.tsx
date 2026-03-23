'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Download, Heart, Package, Calendar, User } from 'lucide-react'

interface Model {
  id: string
  title: string
  downloads: number
  likesCount: number
  views: number
  createdAt: string
  images: { url: string; isMain: boolean }[]
  category: { name: string; slug: string; color?: string }
}

interface UserData {
  id: string
  name: string
  email: string
  bio?: string
  avatar?: string
  createdAt: string
  _count: { models: number; downloads: number }
  models: Model[]
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetch(`/api/profile`)
        .then((r) => r.json())
        .then((data) => {
          setUserData(data)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    } else if (status !== 'loading') {
      setLoading(false)
    }
  }, [session, status])

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign in to view your profile</h2>
        <Link href="/auth/signin" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-full transition-colors">
          Sign In
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-2xl flex-shrink-0">
            {session.user?.image ? (
              <img src={session.user.image} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              session.user?.name?.[0]?.toUpperCase()
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{session.user?.name}</h1>
            <p className="text-gray-500 text-sm">{session.user?.email}</p>
            {userData?.bio && <p className="text-gray-600 text-sm mt-2">{userData.bio}</p>}
            {userData?.createdAt && (
              <p className="text-gray-400 text-xs mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Joined {new Date(userData.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
              </p>
            )}
          </div>
          <Link
            href="/upload"
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            Upload Model
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{userData?._count.models || 0}</div>
            <div className="text-xs text-gray-400">Models</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{userData?._count.downloads || 0}</div>
            <div className="text-xs text-gray-400">Downloads</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {userData?.models.reduce((sum, m) => sum + m.likesCount, 0) || 0}
            </div>
            <div className="text-xs text-gray-400">Likes</div>
          </div>
        </div>
      </div>

      {/* Models */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">My Models</h2>
      {userData?.models && userData.models.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {userData.models.map((model) => {
            const mainImage = model.images?.find((img) => img.isMain) || model.images?.[0]
            return (
              <Link key={model.id} href={`/models/${model.id}`} className="group block">
                <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all">
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    {mainImage ? (
                      <img src={mainImage.url} alt={model.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-10 h-10 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-gray-900 text-sm line-clamp-1 group-hover:text-orange-500">{model.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Download className="w-3 h-3" />{model.downloads}</span>
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{model.likesCount}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">You haven&apos;t uploaded any models yet</p>
          <Link href="/upload" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-full transition-colors">
            Upload Your First Model
          </Link>
        </div>
      )}
    </div>
  )
}
