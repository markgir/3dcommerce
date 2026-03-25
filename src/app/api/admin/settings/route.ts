import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

/** GET /api/admin/settings – fetch all site settings */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const settings = await prisma.siteSetting.findMany()
    const result: Record<string, string> = {}
    for (const s of settings) {
      result[s.key] = s.value
    }
    return Response.json(result)
  } catch {
    return Response.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

/** POST /api/admin/settings – update settings (supports logo file upload) */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const logo = formData.get('logo') as File | null

      if (logo && logo.size > 0) {
        const ext = logo.name.split('.').pop() || 'png'
        const allowedExts = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico']
        if (!allowedExts.includes(ext.toLowerCase())) {
          return Response.json({ error: 'Invalid file type. Allowed: ' + allowedExts.join(', ') }, { status: 400 })
        }

        if (logo.size > 2 * 1024 * 1024) {
          return Response.json({ error: 'File too large. Maximum 2MB.' }, { status: 400 })
        }

        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'images')
        await mkdir(uploadDir, { recursive: true })

        const filename = `logo-${uuidv4()}.${ext}`
        const buffer = Buffer.from(await logo.arrayBuffer())
        await writeFile(path.join(uploadDir, filename), buffer)

        const logoUrl = `/uploads/images/${filename}`
        await prisma.siteSetting.upsert({
          where: { key: 'logoUrl' },
          update: { value: logoUrl },
          create: { key: 'logoUrl', value: logoUrl },
        })
      }

      // Handle removeLogo flag
      const removeLogo = formData.get('removeLogo')
      if (removeLogo === 'true') {
        await prisma.siteSetting.deleteMany({ where: { key: 'logoUrl' } })
      }

      const settings = await prisma.siteSetting.findMany()
      const result: Record<string, string> = {}
      for (const s of settings) {
        result[s.key] = s.value
      }
      return Response.json(result)
    }

    // JSON body for simple key/value settings
    const body = await request.json()
    const { key, value } = body as { key?: string; value?: string }

    if (!key) {
      return Response.json({ error: 'Missing key' }, { status: 400 })
    }

    if (value === null || value === undefined || value === '') {
      await prisma.siteSetting.deleteMany({ where: { key } })
    } else {
      await prisma.siteSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    }

    const settings = await prisma.siteSetting.findMany()
    const result: Record<string, string> = {}
    for (const s of settings) {
      result[s.key] = s.value
    }
    return Response.json(result)
  } catch {
    return Response.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
