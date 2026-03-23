import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const userId = session.user.id

    const existing = await prisma.like.findUnique({
      where: { modelId_userId: { modelId: id, userId } },
    })

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } })
      await prisma.model3D.update({
        where: { id },
        data: { likesCount: { decrement: 1 } },
      })
      return Response.json({ liked: false })
    } else {
      await prisma.like.create({ data: { modelId: id, userId } })
      await prisma.model3D.update({
        where: { id },
        data: { likesCount: { increment: 1 } },
      })
      return Response.json({ liked: true })
    }
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    const count = await prisma.like.count({ where: { modelId: id } })

    let userLiked = false
    if (session?.user) {
      const like = await prisma.like.findUnique({
        where: { modelId_userId: { modelId: id, userId: session.user.id } },
      })
      userLiked = !!like
    }

    return Response.json({ count, userLiked })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
