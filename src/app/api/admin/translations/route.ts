import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') return null
  return session
}

export async function GET(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return Response.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { searchParams } = request.nextUrl
    const locale = searchParams.get('locale')

    const where = locale ? { locale } : {}
    const overrides = await prisma.translation.findMany({
      where,
      orderBy: { key: 'asc' },
    })

    return Response.json(overrides)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return Response.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { locale, key, value } = await request.json()

    if (!locale || !key || typeof value !== 'string') {
      return Response.json({ error: 'locale, key, and value are required' }, { status: 400 })
    }

    const translation = await prisma.translation.upsert({
      where: { locale_key: { locale, key } },
      update: { value },
      create: { locale, key, value },
    })

    return Response.json(translation)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return Response.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { searchParams } = request.nextUrl
    const locale = searchParams.get('locale')
    const key = searchParams.get('key')

    if (!locale || !key) {
      return Response.json({ error: 'locale and key are required' }, { status: 400 })
    }

    await prisma.translation.delete({
      where: { locale_key: { locale, key } },
    })

    return Response.json({ message: 'Deleted' })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
