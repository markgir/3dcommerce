'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  Users,
  Megaphone,
  Plus,
  Trash2,
  Edit,
  ChevronDown,
  ChevronUp,
  Star,
  Eye,
  EyeOff,
  Database,
  RefreshCw,
  Bug,
} from 'lucide-react'

type Tab = 'overview' | 'models' | 'users' | 'ads' | 'update' | 'debug'

interface UpdateInfo {
  currentVersion: string
  currentSha: string
  latestSha: string
  currentMessage: string
  latestMessage: string
  branch: string
  updateAvailable: boolean
}

interface DebugInfo {
  timestamp: string
  system: {
    platform: string
    release: string
    hostname: string
    uptime: string
    cpus: number
    totalMemory: string
    freeMemory: string
    memoryUsage: string
  }
  runtime: {
    nodeVersion: string
    npmVersion: string
    processUptime: string
    pid: number
    cwd: string
  }
  application: {
    name: string
    version: string
    nextBuild: string
    nodeModules: string
    envFile: string
    envVars: string[]
  }
  git: {
    version: string
    branch: string
    lastCommit: string
    uncommittedChanges: string
    remote: string
  }
  database: {
    exists: boolean
    size: string
    path: string
    migrations: string[]
  }
  storage: {
    uploadedImages: string
    uploadedFiles: string
    disk: string
  }
  dependencies: {
    production: Record<string, string>
    dev: Record<string, string>
  }
  nodeEnv: string
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [stats, setStats] = useState({ models: 0, users: 0, downloads: 0, ads: 0 })
  const [models, setModels] = useState<ModelItem[]>([])
  const [users, setUsers] = useState<UserItem[]>([])
  const [ads, setAds] = useState<AdItem[]>([])
  const [loading, setLoading] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [seedMessage, setSeedMessage] = useState('')

  // Update state
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [updating, setUpdating] = useState(false)
  const [updateMessage, setUpdateMessage] = useState('')

  // Debug state
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [debugError, setDebugError] = useState('')

  // Ad form state
  const [showAdForm, setShowAdForm] = useState(false)
  const [adForm, setAdForm] = useState({
    title: '',
    type: 'CUSTOM',
    content: '',
    imageUrl: '',
    linkUrl: '',
    placement: 'SIDEBAR',
    isActive: true,
  })

  interface ModelItem {
    id: string
    title: string
    isFeatured: boolean
    isPublished: boolean
    downloads: number
    views: number
    createdAt: string
    user: { name: string; email: string }
    category: { name: string }
    images: { url: string; isMain: boolean }[]
  }

  interface UserItem {
    id: string
    name: string
    email: string
    role: string
    createdAt: string
    _count: { models: number; downloads: number }
  }

  interface AdItem {
    id: string
    title: string
    type: string
    placement: string
    isActive: boolean
    content?: string
    imageUrl?: string
    linkUrl?: string
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    if (status === 'authenticated') {
      if (session?.user?.role !== 'ADMIN') {
        return
      }
      loadStats()
    }
  }, [session, status, router])

  const loadStats = async () => {
    const [modelsRes, usersRes, adsRes] = await Promise.all([
      fetch('/api/admin/models?limit=100'),
      fetch('/api/admin/users?limit=100'),
      fetch('/api/admin/ads'),
    ])
    const [modelsData, usersData, adsData] = await Promise.all([
      modelsRes.json(),
      usersRes.json(),
      adsRes.json(),
    ])
    setStats({
      models: modelsData.total || 0,
      users: usersData.total || 0,
      downloads: 0,
      ads: Array.isArray(adsData) ? adsData.length : 0,
    })
    setModels(modelsData.models || [])
    setUsers(usersData.users || [])
    setAds(Array.isArray(adsData) ? adsData : [])
  }

  const loadTabData = async (tab: Tab) => {
    setLoading(true)
    try {
      if (tab === 'models') {
        const res = await fetch('/api/admin/models')
        const data = await res.json()
        setModels(data.models || [])
      } else if (tab === 'users') {
        const res = await fetch('/api/admin/users')
        const data = await res.json()
        setUsers(data.users || [])
      } else if (tab === 'ads') {
        const res = await fetch('/api/admin/ads')
        const data = await res.json()
        setAds(Array.isArray(data) ? data : [])
      } else if (tab === 'update') {
        const res = await fetch('/api/admin/update')
        const data = await res.json()
        if (!data.error) setUpdateInfo(data)
        else setUpdateMessage(data.error)
      } else if (tab === 'debug') {
        setDebugError('')
        const res = await fetch('/api/admin/debug')
        const data = await res.json()
        if (data.error) setDebugError(data.error)
        else setDebugInfo(data)
      }
    } finally {
      setLoading(false)
    }
  }

  const checkForUpdate = async () => {
    setLoading(true)
    setUpdateMessage('')
    try {
      const res = await fetch('/api/admin/update')
      const data = await res.json()
      if (data.error) setUpdateMessage(data.error)
      else setUpdateInfo(data)
    } finally {
      setLoading(false)
    }
  }

  const applyUpdate = async () => {
    if (!confirm('This will pull the latest code, install dependencies, run migrations, and rebuild the app. Continue?')) return
    setUpdating(true)
    setUpdateMessage('')
    try {
      const res = await fetch('/api/admin/update', { method: 'POST' })
      const data = await res.json()
      if (data.error) {
        setUpdateMessage(`Error: ${data.error}\n${data.details ?? ''}\n${data.output ?? ''}`)
      } else {
        setUpdateMessage(data.output ?? data.message)
        await checkForUpdate()
      }
    } finally {
      setUpdating(false)
    }
  }

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    loadTabData(tab)
  }

  const toggleFeature = async (id: string, isFeatured: boolean) => {
    await fetch('/api/admin/models', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isFeatured: !isFeatured }),
    })
    setModels((prev) => prev.map((m) => (m.id === id ? { ...m, isFeatured: !isFeatured } : m)))
  }

  const togglePublish = async (id: string, isPublished: boolean) => {
    await fetch('/api/admin/models', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isPublished: !isPublished }),
    })
    setModels((prev) => prev.map((m) => (m.id === id ? { ...m, isPublished: !isPublished } : m)))
  }

  const toggleUserRole = async (id: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN'
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, role: newRole }),
    })
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: newRole } : u)))
  }

  const createAd = async () => {
    const res = await fetch('/api/admin/ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adForm),
    })
    const ad = await res.json()
    setAds((prev) => [ad, ...prev])
    setShowAdForm(false)
    setAdForm({ title: '', type: 'CUSTOM', content: '', imageUrl: '', linkUrl: '', placement: 'SIDEBAR', isActive: true })
  }

  const deleteAd = async (id: string) => {
    await fetch(`/api/admin/ads?id=${id}`, { method: 'DELETE' })
    setAds((prev) => prev.filter((a) => a.id !== id))
  }

  const toggleAdActive = async (id: string, isActive: boolean) => {
    await fetch('/api/admin/ads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: !isActive }),
    })
    setAds((prev) => prev.map((a) => (a.id === id ? { ...a, isActive: !isActive } : a)))
  }

  const seedData = async () => {
    setSeeding(true)
    setSeedMessage('')
    const res = await fetch('/api/admin/seed', { method: 'POST' })
    const data = await res.json()
    setSeedMessage(data.message || data.error)
    setSeeding(false)
    loadStats()
  }

  if (status === 'loading') {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!session || session.user?.role !== 'ADMIN') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
        <p className="text-gray-500 mb-4">You need admin privileges to access this page.</p>
        <div className="bg-gray-100 rounded-xl p-6 text-left text-sm text-gray-700 mb-6">
          <p className="font-semibold mb-2">How to get admin access:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>If you ran the seed script, sign in with <strong>admin@3dprinthub.com</strong> / <strong>admin123456</strong></li>
            <li>The very first user to register on a fresh database automatically becomes admin</li>
            <li>An existing admin can promote your account from the admin dashboard</li>
          </ul>
        </div>
        <div className="flex gap-4 justify-center">
          <Link href="/auth/signin" className="text-orange-500 hover:underline">Sign In</Link>
          <Link href="/" className="text-gray-500 hover:underline">Go Home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <button
          onClick={seedData}
          disabled={seeding}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-xl text-sm transition-colors"
        >
          <Database className="w-4 h-4" />
          {seeding ? 'Seeding...' : 'Seed Demo Data'}
        </button>
      </div>

      {seedMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
          {seedMessage}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Models', value: stats.models, icon: Package, bgClass: 'bg-orange-50', textClass: 'text-orange-500' },
          { label: 'Total Users', value: stats.users, icon: Users, bgClass: 'bg-blue-50', textClass: 'text-blue-500' },
          { label: 'Total Downloads', value: stats.downloads, icon: ChevronDown, bgClass: 'bg-green-50', textClass: 'text-green-500' },
          { label: 'Active Ads', value: stats.ads, icon: Megaphone, bgClass: 'bg-purple-50', textClass: 'text-purple-500' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className={`w-10 h-10 rounded-xl ${stat.bgClass} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.textClass}`} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {([
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'models', label: 'Models', icon: Package },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'ads', label: 'Ads', icon: Megaphone },
          { id: 'update', label: 'Update', icon: RefreshCw },
          { id: 'debug', label: 'Debug', icon: Bug },
        ] as { id: Tab; label: string; icon: React.ElementType }[]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      ) : (
        <>
          {/* Overview */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">Recent Models</h3>
                <div className="space-y-3">
                  {models.slice(0, 5).map((model) => (
                    <div key={model.id} className="flex items-center justify-between">
                      <Link href={`/models/${model.id}`} className="text-sm text-gray-700 hover:text-orange-500 line-clamp-1">
                        {model.title}
                      </Link>
                      <span className="text-xs text-gray-400">{model.downloads} dl</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">Recent Users</h3>
                <div className="space-y-3">
                  {users.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-700">{user.name}</div>
                        <div className="text-xs text-gray-400">{user.email}</div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${user.role === 'ADMIN' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                        {user.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Models */}
          {activeTab === 'models' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Model</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Author</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Stats</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {models.map((model) => (
                    <tr key={model.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                            {model.images?.[0] ? (
                              <img src={model.images[0].url} alt="" className="w-full h-full object-cover" />
                            ) : null}
                          </div>
                          <div>
                            <Link href={`/models/${model.id}`} className="text-sm font-medium text-gray-900 hover:text-orange-500 line-clamp-1">
                              {model.title}
                            </Link>
                            <div className="flex items-center gap-1 mt-0.5">
                              {model.isFeatured && (
                                <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">Featured</span>
                              )}
                              {!model.isPublished && (
                                <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Hidden</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="text-sm text-gray-700">{model.user?.name}</div>
                        <div className="text-xs text-gray-400">{model.category?.name}</div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="text-xs text-gray-500">{model.downloads} downloads · {model.views} views</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => toggleFeature(model.id, model.isFeatured)}
                            title={model.isFeatured ? 'Remove from featured' : 'Add to featured'}
                            className={`p-1.5 rounded-lg transition-colors ${model.isFeatured ? 'text-yellow-500 bg-yellow-50' : 'text-gray-300 hover:text-yellow-400 hover:bg-yellow-50'}`}
                          >
                            <Star className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => togglePublish(model.id, model.isPublished)}
                            title={model.isPublished ? 'Hide model' : 'Publish model'}
                            className={`p-1.5 rounded-lg transition-colors ${model.isPublished ? 'text-green-500 bg-green-50' : 'text-gray-300 hover:text-green-400 hover:bg-green-50'}`}
                          >
                            {model.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Users */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Stats</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-sm text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-400">{user.email}</div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="text-xs text-gray-500">{user._count?.models || 0} models · {user._count?.downloads || 0} downloads</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${user.role === 'ADMIN' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <button
                            onClick={() => toggleUserRole(user.id, user.role)}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-orange-500 px-2 py-1 rounded-lg hover:bg-orange-50 transition-colors"
                          >
                            <Edit className="w-3 h-3" />
                            {user.role === 'ADMIN' ? 'Demote' : 'Promote'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Ads */}
          {activeTab === 'ads' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Advertisements</h3>
                <button
                  onClick={() => setShowAdForm(!showAdForm)}
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2 rounded-xl text-sm transition-colors"
                >
                  {showAdForm ? <ChevronUp className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {showAdForm ? 'Cancel' : 'New Ad'}
                </button>
              </div>

              {/* Ad Form */}
              {showAdForm && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-4">Create Advertisement</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                      <input
                        type="text"
                        value={adForm.title}
                        onChange={(e) => setAdForm({ ...adForm, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                      <select
                        value={adForm.type}
                        onChange={(e) => setAdForm({ ...adForm, type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
                      >
                        <option value="CUSTOM">Custom</option>
                        <option value="GOOGLE">Google AdSense</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Placement</label>
                      <select
                        value={adForm.placement}
                        onChange={(e) => setAdForm({ ...adForm, placement: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
                      >
                        <option value="SIDEBAR">Sidebar</option>
                        <option value="HEADER">Header</option>
                        <option value="FOOTER">Footer</option>
                        <option value="INLINE">Inline</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Link URL</label>
                      <input
                        type="url"
                        value={adForm.linkUrl}
                        onChange={(e) => setAdForm({ ...adForm, linkUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
                        placeholder="https://..."
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Image URL</label>
                      <input
                        type="url"
                        value={adForm.imageUrl}
                        onChange={(e) => setAdForm({ ...adForm, imageUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
                        placeholder="https://..."
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Ad Content / Code</label>
                      <textarea
                        value={adForm.content}
                        onChange={(e) => setAdForm({ ...adForm, content: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400 resize-none"
                        rows={3}
                        placeholder="HTML content or Google AdSense code..."
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={createAd}
                      disabled={!adForm.title}
                      className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium px-6 py-2 rounded-xl text-sm transition-colors"
                    >
                      Create Ad
                    </button>
                  </div>
                </div>
              )}

              {/* Ads list */}
              <div className="grid gap-3">
                {ads.map((ad) => (
                  <div key={ad.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm text-gray-900">{ad.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{ad.type}</span>
                        <span className="text-xs text-gray-400">{ad.placement}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${ad.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {ad.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleAdActive(ad.id, ad.isActive)}
                        className="text-xs text-gray-500 hover:text-orange-500 px-2 py-1 rounded border border-gray-200 hover:border-orange-200 transition-colors"
                      >
                        {ad.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => deleteAd(ad.id)}
                        className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {ads.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">No ads created yet</div>
                )}
              </div>
            </div>
          )}

          {/* Update */}
          {activeTab === 'update' && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Application Update</h3>
                  <button
                    onClick={checkForUpdate}
                    disabled={loading}
                    className="flex items-center gap-2 text-sm text-orange-500 hover:text-orange-600 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Check
                  </button>
                </div>

                {updateInfo ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Current version</div>
                        <div className="font-mono font-medium text-gray-900">{updateInfo.currentVersion}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Branch</div>
                        <div className="font-mono font-medium text-gray-900">{updateInfo.branch}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Local commit</div>
                        <div className="font-mono text-gray-700">{updateInfo.currentSha}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{updateInfo.currentMessage}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Remote commit</div>
                        <div className="font-mono text-gray-700">{updateInfo.latestSha}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{updateInfo.latestMessage}</div>
                      </div>
                    </div>

                    {updateInfo.updateAvailable ? (
                      <div className="flex items-center gap-3 mt-4 p-3 bg-orange-50 rounded-xl border border-orange-100">
                        <div className="flex-1 text-sm text-orange-800">A new version is available.</div>
                        <button
                          onClick={applyUpdate}
                          disabled={updating}
                          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                          <RefreshCw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
                          {updating ? 'Updating…' : 'Apply Update'}
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-100 text-sm text-green-800">
                        ✓ You are running the latest version.
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Click "Check" to compare local code with the remote repository.</p>
                )}
              </div>

              {updateMessage && (
                <div className="bg-gray-900 rounded-2xl p-4">
                  <pre className="text-xs text-green-400 whitespace-pre-wrap overflow-auto max-h-96">{updateMessage}</pre>
                </div>
              )}
            </div>
          )}

          {/* Debug */}
          {activeTab === 'debug' && (
            <div className="max-w-4xl space-y-6">
              {debugError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{debugError}</div>
              )}

              {debugInfo ? (
                <>
                  <div className="text-xs text-gray-400 mb-2">
                    Collected at: {new Date(debugInfo.timestamp).toLocaleString()} · Environment: {debugInfo.nodeEnv}
                  </div>

                  {/* System */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      System
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div><div className="text-xs text-gray-500">Platform</div><div className="font-mono text-gray-900">{debugInfo.system.platform}</div></div>
                      <div><div className="text-xs text-gray-500">Hostname</div><div className="font-mono text-gray-900">{debugInfo.system.hostname}</div></div>
                      <div><div className="text-xs text-gray-500">CPUs</div><div className="font-mono text-gray-900">{debugInfo.system.cpus}</div></div>
                      <div><div className="text-xs text-gray-500">Uptime</div><div className="font-mono text-gray-900">{debugInfo.system.uptime}</div></div>
                      <div><div className="text-xs text-gray-500">Total Memory</div><div className="font-mono text-gray-900">{debugInfo.system.totalMemory}</div></div>
                      <div><div className="text-xs text-gray-500">Free Memory</div><div className="font-mono text-gray-900">{debugInfo.system.freeMemory}</div></div>
                      <div><div className="text-xs text-gray-500">Memory Usage</div><div className="font-mono text-gray-900">{debugInfo.system.memoryUsage}</div></div>
                      <div><div className="text-xs text-gray-500">OS Release</div><div className="font-mono text-gray-900 truncate" title={debugInfo.system.release}>{debugInfo.system.release}</div></div>
                    </div>
                  </div>

                  {/* Runtime */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      Runtime
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div><div className="text-xs text-gray-500">Node.js</div><div className="font-mono text-gray-900">{debugInfo.runtime.nodeVersion}</div></div>
                      <div><div className="text-xs text-gray-500">npm</div><div className="font-mono text-gray-900">{debugInfo.runtime.npmVersion}</div></div>
                      <div><div className="text-xs text-gray-500">Process PID</div><div className="font-mono text-gray-900">{debugInfo.runtime.pid}</div></div>
                      <div><div className="text-xs text-gray-500">Process Uptime</div><div className="font-mono text-gray-900">{debugInfo.runtime.processUptime}</div></div>
                    </div>
                    <div className="mt-3 text-sm">
                      <div className="text-xs text-gray-500">Working Directory</div>
                      <div className="font-mono text-gray-900 text-xs break-all">{debugInfo.runtime.cwd}</div>
                    </div>
                  </div>

                  {/* Application */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                      Application
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
                      <div><div className="text-xs text-gray-500">Name</div><div className="font-mono text-gray-900">{debugInfo.application.name}</div></div>
                      <div><div className="text-xs text-gray-500">Version</div><div className="font-mono text-gray-900">{debugInfo.application.version}</div></div>
                      <div>
                        <div className="text-xs text-gray-500">Next.js Build</div>
                        <div className={`font-mono text-sm ${debugInfo.application.nextBuild === 'Present' ? 'text-green-600' : 'text-red-600'}`}>
                          {debugInfo.application.nextBuild}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">node_modules</div>
                        <div className={`font-mono text-sm ${debugInfo.application.nodeModules === 'Present' ? 'text-green-600' : 'text-red-600'}`}>
                          {debugInfo.application.nodeModules}
                        </div>
                      </div>
                    </div>
                    {debugInfo.application.envVars.length > 0 && (
                      <div>
                        <div className="text-xs text-gray-500 mb-2">Environment Variables ({debugInfo.application.envFile})</div>
                        <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs text-gray-700 space-y-0.5">
                          {debugInfo.application.envVars.map((v, i) => (
                            <div key={i}>{v}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Git */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      Git
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div><div className="text-xs text-gray-500">Git Version</div><div className="font-mono text-gray-900">{debugInfo.git.version}</div></div>
                      <div><div className="text-xs text-gray-500">Branch</div><div className="font-mono text-gray-900">{debugInfo.git.branch}</div></div>
                    </div>
                    <div className="text-sm mb-3">
                      <div className="text-xs text-gray-500">Last Commit</div>
                      <div className="font-mono text-gray-900 text-xs">{debugInfo.git.lastCommit}</div>
                    </div>
                    <div className="text-sm mb-3">
                      <div className="text-xs text-gray-500">Uncommitted Changes</div>
                      <pre className="font-mono text-xs text-gray-700 bg-gray-50 rounded-lg p-2 mt-1 whitespace-pre-wrap">{debugInfo.git.uncommittedChanges}</pre>
                    </div>
                    <div className="text-sm">
                      <div className="text-xs text-gray-500">Remote</div>
                      <pre className="font-mono text-xs text-gray-700 bg-gray-50 rounded-lg p-2 mt-1 whitespace-pre-wrap">{debugInfo.git.remote}</pre>
                    </div>
                  </div>

                  {/* Database & Storage */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                      Database &amp; Storage
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <div className="text-xs text-gray-500">Database</div>
                        <div className={`font-mono text-sm ${debugInfo.database.exists ? 'text-green-600' : 'text-red-600'}`}>
                          {debugInfo.database.exists ? `${debugInfo.database.path} (${debugInfo.database.size})` : 'Not found'}
                        </div>
                      </div>
                      <div><div className="text-xs text-gray-500">Uploaded Images</div><div className="font-mono text-gray-900">{debugInfo.storage.uploadedImages}</div></div>
                      <div><div className="text-xs text-gray-500">Uploaded Files</div><div className="font-mono text-gray-900">{debugInfo.storage.uploadedFiles}</div></div>
                      <div><div className="text-xs text-gray-500">Disk</div><div className="font-mono text-gray-900 text-xs truncate" title={debugInfo.storage.disk}>{debugInfo.storage.disk}</div></div>
                    </div>
                    {debugInfo.database.migrations.length > 0 && (
                      <div>
                        <div className="text-xs text-gray-500 mb-2">Migrations ({debugInfo.database.migrations.length})</div>
                        <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs text-gray-700 space-y-0.5">
                          {debugInfo.database.migrations.map((m) => (
                            <div key={m}>✓ {m}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dependencies */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      Dependencies
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <div className="text-xs font-semibold text-gray-500 mb-2">Production ({Object.keys(debugInfo.dependencies.production).length})</div>
                        <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs text-gray-700 space-y-0.5 max-h-60 overflow-auto">
                          {Object.entries(debugInfo.dependencies.production).map(([name, version]) => (
                            <div key={name}>{name}: <span className="text-gray-500">{version}</span></div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-500 mb-2">Development ({Object.keys(debugInfo.dependencies.dev).length})</div>
                        <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs text-gray-700 space-y-0.5 max-h-60 overflow-auto">
                          {Object.entries(debugInfo.dependencies.dev).map(([name, version]) => (
                            <div key={name}>{name}: <span className="text-gray-500">{version}</span></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : !debugError ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  )
}
