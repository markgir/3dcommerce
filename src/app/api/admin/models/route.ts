import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    return null
  }
  return session
}

export async function GET(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return Response.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { user: { name: { contains: search } } },
      ]
    }

    const [models, total] = await Promise.all([
      prisma.model3D.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: true,
          user: { select: { id: true, name: true, email: true } },
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

export async function PATCH(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return Response.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { id, ...data } = await request.json()
    const model = await prisma.model3D.update({ where: { id }, data })
    return Response.json(model)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
