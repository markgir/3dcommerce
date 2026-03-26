import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '8', 10), 50)

    const products = await prisma.vendorProduct.findMany({
      where: { isActive: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        vendor: { select: { name: true } },
      },
    })

    return Response.json({ products })
  } catch {
    return Response.json({ products: [] }, { status: 500 })
  }
}
