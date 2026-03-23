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

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          createdAt: true,
          _count: { select: { models: true, downloads: true } },
        },
      }),
      prisma.user.count(),
    ])

    return Response.json({ users, total, page, limit })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return Response.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { id, role } = await request.json()
    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    })
    return Response.json(user)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
