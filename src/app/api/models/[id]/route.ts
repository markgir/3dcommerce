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
    const model = await prisma.model3D.findUnique({
      where: { id },
      include: {
        category: true,
        user: { select: { id: true, name: true, avatar: true, bio: true } },
        images: true,
        files: true,
        comments: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!model || !model.isPublished) {
      return Response.json({ error: 'Model not found' }, { status: 404 })
    }

    // Increment view count
    await prisma.model3D.update({
      where: { id },
      data: { views: { increment: 1 } },
    })

    return Response.json(model)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const model = await prisma.model3D.findUnique({ where: { id } })
    if (!model) {
      return Response.json({ error: 'Model not found' }, { status: 404 })
    }

    if (model.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.model3D.delete({ where: { id } })
    return Response.json({ message: 'Model deleted' })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
