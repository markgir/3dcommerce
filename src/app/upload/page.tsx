'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Upload, X, Plus, FileText } from 'lucide-react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'

interface Category {
  id: string
  name: string
  slug: string
  icon?: string
}

export default function UploadPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useTranslation()

  const [categories, setCategories] = useState<Category[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [tags, setTags] = useState('')
  const [license, setLicense] = useState('CC BY 4.0')
  const [images, setImages] = useState<File[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then(setCategories)
  }, [])

  if (status === 'loading') {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('upload.signInRequired')}</h2>
        <p className="text-gray-500 mb-6">{t('upload.signInMessage')}</p>
        <Link href="/auth/signin" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-full transition-colors">
          {t('nav.signIn')}
        </Link>
      </div>
    )
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    setImages((prev) => [...prev, ...selected])
    const previews = selected.map((f) => URL.createObjectURL(f))
    setImagePreviews((prev) => [...prev, ...previews])
  }

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx))
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    setFiles((prev) => [...prev, ...selected])
  }

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!categoryId) {
      setError(t('upload.selectCategoryError'))
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('description', description)
      formData.append('categoryId', categoryId)
      formData.append('tags', tags)
      formData.append('license', license)
      images.forEach((img) => formData.append('images', img))
      files.forEach((f) => formData.append('files', f))

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || t('upload.failed'))
        setLoading(false)
        return
      }

      router.push(`/models/${data.id}`)
    } catch {
      setError(t('upload.somethingWrong'))
      setLoading(false)
    }
  }

  const licenses = ['CC BY 4.0', 'CC BY-SA 4.0', 'CC BY-NC 4.0', 'CC BY-NC-SA 4.0', 'CC0', 'All Rights Reserved']

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('upload.title')}</h1>
      <p className="text-gray-500 mb-8">{t('upload.subtitle')}</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">{t('upload.basicInfo')}</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('upload.modelTitle')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={100}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400"
                placeholder={t('upload.modelTitlePlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('upload.descriptionLabel')} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 resize-none"
                placeholder={t('upload.descriptionPlaceholder')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('upload.categoryLabel')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400"
                >
                  <option value="">{t('upload.selectCategory')}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('upload.licenseLabel')}</label>
                <select
                  value={license}
                  onChange={(e) => setLicense(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400"
                >
                  {licenses.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('upload.tagsLabel')}</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400"
                placeholder={t('upload.tagsPlaceholder')}
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">{t('upload.photos')}</h2>
          <p className="text-sm text-gray-500 mb-4">{t('upload.photosDesc')}</p>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
            {imagePreviews.map((preview, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                <img src={preview} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
                {idx === 0 && (
                  <div className="absolute bottom-1 left-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded">
                    {t('upload.main')}
                  </div>
                )}
              </div>
            ))}

            <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-orange-400 cursor-pointer flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-orange-500 transition-colors">
              <Plus className="w-6 h-6" />
              <span className="text-xs">{t('upload.addPhoto')}</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
            </label>
          </div>
        </div>

        {/* Files */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">{t('upload.3dFiles')}</h2>
          <p className="text-sm text-gray-500 mb-4">{t('upload.3dFilesDesc')}</p>

          <div className="space-y-2 mb-3">
            {files.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{file.name}</div>
                    <div className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <label className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 hover:border-orange-400 rounded-xl cursor-pointer text-gray-500 hover:text-orange-500 transition-colors">
            <Upload className="w-5 h-5" />
            <div>
              <span className="font-medium text-sm">{t('upload.clickToAddFiles')}</span>
              <p className="text-xs text-gray-400">{t('upload.fileTypes')}</p>
            </div>
            <input
              type="file"
              accept=".stl,.obj,.3mf,.step,.stp,.gcode,.zip,.rar"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-colors text-lg"
        >
          {loading ? t('upload.uploading') : t('upload.publishModel')}
        </button>
      </form>
    </div>
  )
}
