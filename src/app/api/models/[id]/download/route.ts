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
    const { id } = await params

    await prisma.model3D.update({
      where: { id },
      data: { downloads: { increment: 1 } },
    })

    await prisma.download.create({
      data: {
        modelId: id,
        userId: session?.user?.id || null,
      },
    })

    const model = await prisma.model3D.findUnique({
      where: { id },
      include: { files: true },
    })

    return Response.json({ files: model?.files || [] })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
