'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslation } from '@/lib/i18n'
import {
  Package,
  ShoppingCart,
  Plus,
  Pencil,
  Trash2,
  DollarSign,
  TrendingUp,
  X,
} from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  price: number
  imageUrl?: string | null
  linkUrl?: string | null
  productType: string
  isActive: boolean
  createdAt: string
}

interface Order {
  id: string
  quantity: number
  unitPrice: number
  totalPrice: number
  commission: number
  status: string
  createdAt: string
  product: { name: string }
  buyer: { name: string; email: string }
}

export default function VendorPage() {
  const { data: session, status } = useSession()
  const { t } = useTranslation()
  const [tab, setTab] = useState<'overview' | 'products' | 'orders'>('overview')
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [totalSales, setTotalSales] = useState(0)
  const [totalCommission, setTotalCommission] = useState(0)
  const [netRevenue, setNetRevenue] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    linkUrl: '',
    productType: 'FILAMENT',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const fetchProducts = useCallback(async () => {
    const res = await fetch('/api/vendor/products')
    const data = await res.json()
    setProducts(data.products || [])
  }, [])

  const fetchOrders = useCallback(async () => {
    const res = await fetch('/api/vendor/orders')
    const data = await res.json()
    setOrders(data.orders || [])
    setTotalSales(data.totalSales || 0)
    setTotalCommission(data.totalCommission || 0)
    setNetRevenue(data.netRevenue || 0)
  }, [])

  useEffect(() => {
    if (session?.user.role === 'VENDOR') {
      Promise.all([fetchProducts(), fetchOrders()]).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [session, fetchProducts, fetchOrders])

  const openNewForm = () => {
    setEditingProduct(null)
    setFormData({ name: '', description: '', price: '', imageUrl: '', linkUrl: '', productType: 'FILAMENT' })
    setShowForm(true)
  }

  const openEditForm = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      imageUrl: product.imageUrl || '',
      linkUrl: product.linkUrl || '',
      productType: product.productType,
    })
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const method = editingProduct ? 'PATCH' : 'POST'
      const body = editingProduct
        ? { id: editingProduct.id, ...formData, price: parseFloat(formData.price) }
        : { ...formData, price: parseFloat(formData.price) }

      const res = await fetch('/api/vendor/products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        setMessage(t('vendor.saved'))
        setShowForm(false)
        fetchProducts()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('vendor.deleteConfirm'))) return
    const res = await fetch(`/api/vendor/products?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setMessage(t('vendor.deleted'))
      fetchProducts()
    }
  }

  const handleToggleActive = async (product: Product) => {
    await fetch('/api/vendor/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: product.id, isActive: !product.isActive }),
    })
    fetchProducts()
  }

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('pt-PT', { year: 'numeric', month: 'short', day: 'numeric' })

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!session || session.user.role !== 'VENDOR') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('vendor.title')}</h1>
        <p className="text-gray-500">You need a vendor account to access this page.</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('vendor.title')}</h1>
      </div>

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-green-400 hover:text-green-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 mb-6">
        {(['overview', 'products', 'orders'] as const).map((t2) => (
          <button
            key={t2}
            onClick={() => setTab(t2)}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              tab === t2 ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t(`vendor.${t2}`)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-8 h-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{products.filter(p => p.isActive).length}</div>
                <div className="text-sm text-gray-500">{t('vendor.productCount')}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <ShoppingCart className="w-8 h-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
                <div className="text-sm text-gray-500">{t('vendor.orderCount')}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-8 h-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-gray-900">€{totalSales.toFixed(2)}</div>
                <div className="text-sm text-gray-500">{t('vendor.totalSales')}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-8 h-8 text-purple-500" />
              <div>
                <div className="text-2xl font-bold text-gray-900">€{netRevenue.toFixed(2)}</div>
                <div className="text-sm text-gray-500">{t('vendor.netRevenue')}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Tab */}
      {tab === 'products' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={openNewForm}
              className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('vendor.addProduct')}
            </button>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">{t('vendor.noProducts')}</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">{t('vendor.productName')}</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">{t('vendor.productType')}</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">{t('vendor.productPrice')}</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">{t('vendor.orderStatus')}</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <span className="font-medium text-gray-900">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{product.productType}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">€{product.price.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleActive(product)}
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
                            product.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {product.isActive ? t('vendor.active') : t('vendor.inactive')}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => openEditForm(product)} className="text-gray-400 hover:text-orange-500 mr-2">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="text-gray-400 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {tab === 'orders' && (
        <div>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
              <div className="text-lg font-bold text-gray-900">€{totalSales.toFixed(2)}</div>
              <div className="text-xs text-gray-500">{t('vendor.totalSales')}</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
              <div className="text-lg font-bold text-red-500">€{totalCommission.toFixed(2)}</div>
              <div className="text-xs text-gray-500">{t('vendor.totalCommission')}</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
              <div className="text-lg font-bold text-green-600">€{netRevenue.toFixed(2)}</div>
              <div className="text-xs text-gray-500">{t('vendor.netRevenue')}</div>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">{t('vendor.noOrders')}</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">{t('vendor.products')}</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">{t('vendor.buyer')}</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">{t('vendor.quantity')}</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">{t('vendor.productPrice')}</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">{t('vendor.commission')}</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">{t('vendor.orderStatus')}</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">{t('vendor.date')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{order.product.name}</td>
                      <td className="px-4 py-3 text-gray-600">{order.buyer.name}</td>
                      <td className="px-4 py-3 text-gray-600">{order.quantity}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">€{order.totalPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-red-500">€{order.commission.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                          order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {order.status === 'COMPLETED' ? t('vendor.orderCompleted') :
                           order.status === 'CANCELLED' ? t('vendor.orderCancelled') :
                           t('vendor.orderPending')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900 text-lg">
                {editingProduct ? t('vendor.editProduct') : t('vendor.addProduct')}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('vendor.productName')}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('vendor.productNamePlaceholder')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('vendor.productDescription')}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('vendor.productDescriptionPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400 resize-none"
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('vendor.productPrice')}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder={t('vendor.productPricePlaceholder')}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('vendor.productType')}</label>
                  <select
                    value={formData.productType}
                    onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
                  >
                    <option value="FILAMENT">{t('vendor.typeFilament')}</option>
                    <option value="PRINTER">{t('vendor.typePrinter')}</option>
                    <option value="ACCESSORY">{t('vendor.typeAccessory')}</option>
                    <option value="OTHER">{t('vendor.typeOther')}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('vendor.productImage')}</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder={t('vendor.productImagePlaceholder')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('vendor.productLink')}</label>
                <input
                  type="url"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  placeholder={t('vendor.productLinkPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors"
                >
                  {saving ? t('common.loading') : t('common.save')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
