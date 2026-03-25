import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'VENDOR') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orders = await prisma.vendorOrder.findMany({
      where: {
        product: { vendorId: session.user.id },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { name: true } },
        buyer: { select: { name: true, email: true } },
      },
    })

    const totalSales = orders.reduce((sum, o) => sum + o.totalPrice, 0)
    const totalCommission = orders.reduce((sum, o) => sum + o.commission, 0)

    return Response.json({
      orders,
      totalSales,
      totalCommission,
      netRevenue: totalSales - totalCommission,
    })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
