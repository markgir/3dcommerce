import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const comments = await prisma.comment.findMany({
      where: { modelId: id },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return Response.json(comments)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { content } = await request.json()

    if (!content?.trim()) {
      return Response.json({ error: 'Comment content required' }, { status: 400 })
    }

    const comment = await prisma.comment.create({
      data: { modelId: id, userId: session.user.id, content: content.trim() },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    })

    return Response.json(comment, { status: 201 })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
