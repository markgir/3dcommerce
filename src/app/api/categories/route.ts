import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { models: true } } },
      orderBy: { name: 'asc' },
    })
    return Response.json(categories)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
