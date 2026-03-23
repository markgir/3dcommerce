import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        avatar: true,
        createdAt: true,
        _count: { select: { models: true, downloads: true } },
        models: {
          where: { isPublished: true },
          orderBy: { createdAt: 'desc' },
          include: {
            images: { where: { isMain: true }, take: 1 },
            category: true,
          },
        },
      },
    })

    return Response.json(user)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
