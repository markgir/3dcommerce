import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') return null
  return session
}

export async function GET() {
  const session = await requireAdmin()
  if (!session) return Response.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const ads = await prisma.advertisement.findMany({ orderBy: { id: 'desc' } })
    return Response.json(ads)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return Response.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const data = await request.json()
    const ad = await prisma.advertisement.create({ data })
    return Response.json(ad, { status: 201 })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return Response.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { id, ...data } = await request.json()
    const ad = await prisma.advertisement.update({ where: { id }, data })
    return Response.json(ad)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return Response.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { searchParams } = request.nextUrl
    const id = searchParams.get('id')
    if (!id) return Response.json({ error: 'ID required' }, { status: 400 })
    await prisma.advertisement.delete({ where: { id } })
    return Response.json({ message: 'Deleted' })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
