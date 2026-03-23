import { NextRequest } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const categoryId = formData.get('categoryId') as string
    const tags = formData.get('tags') as string
    const license = formData.get('license') as string
    const images = formData.getAll('images') as File[]
    const files = formData.getAll('files') as File[]

    if (!title || !description || !categoryId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(path.join(uploadDir, 'images'), { recursive: true })
    await mkdir(path.join(uploadDir, 'files'), { recursive: true })

    const savedImages: { url: string; isMain: boolean }[] = []
    for (const [idx, image] of images.entries()) {
      if (image.size === 0) continue
      const ext = image.name.split('.').pop() || 'jpg'
      const filename = `${uuidv4()}.${ext}`
      const buffer = Buffer.from(await image.arrayBuffer())
      await writeFile(path.join(uploadDir, 'images', filename), buffer)
      savedImages.push({ url: `/uploads/images/${filename}`, isMain: idx === 0 })
    }

    const savedFiles: { filename: string; url: string; size: number }[] = []
    for (const file of files) {
      if (file.size === 0) continue
      const ext = file.name.split('.').pop() || 'stl'
      const filename = `${uuidv4()}.${ext}`
      const buffer = Buffer.from(await file.arrayBuffer())
      await writeFile(path.join(uploadDir, 'files', filename), buffer)
      savedFiles.push({
        filename: file.name,
        url: `/uploads/files/${filename}`,
        size: file.size,
      })
    }

    const model = await prisma.model3D.create({
      data: {
        title,
        description,
        categoryId,
        tags: tags || '',
        userId: session.user.id,
        license: license || 'CC BY 4.0',
        images: { create: savedImages },
        files: { create: savedFiles },
      },
      include: { images: true, files: true, category: true },
    })

    return Response.json(model, { status: 201 })
  } catch (error) {
    console.error('Upload error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
