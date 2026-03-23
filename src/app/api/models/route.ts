import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'newest'
    const featured = searchParams.get('featured')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')

    const where: Record<string, unknown> = { isPublished: true }

    if (category) {
      where.category = { slug: category }
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { tags: { contains: search } },
      ]
    }

    if (featured === 'true') {
      where.isFeatured = true
    }

    const orderBy: Record<string, string> =
      sort === 'popular'
        ? { downloads: 'desc' }
        : sort === 'likes'
          ? { likesCount: 'desc' }
          : { createdAt: 'desc' }

    const [models, total] = await Promise.all([
      prisma.model3D.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: true,
          user: { select: { id: true, name: true, avatar: true } },
          images: { where: { isMain: true }, take: 1 },
        },
      }),
      prisma.model3D.count({ where }),
    ])

    return Response.json({ models, total, page, limit })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
