import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'VENDOR') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const products = await prisma.vendorProduct.findMany({
      where: { vendorId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json({ products })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'VENDOR') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, price, imageUrl, linkUrl, productType } = body

    if (!name || !description || price == null || price < 0) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const product = await prisma.vendorProduct.create({
      data: {
        vendorId: session.user.id,
        name,
        description,
        price: parseFloat(price),
        imageUrl: imageUrl || null,
        linkUrl: linkUrl || null,
        productType: productType || 'FILAMENT',
      },
    })

    return Response.json(product, { status: 201 })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'VENDOR') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, description, price, imageUrl, linkUrl, productType, isActive } = body

    if (!id) {
      return Response.json({ error: 'Product ID required' }, { status: 400 })
    }

    const existing = await prisma.vendorProduct.findFirst({
      where: { id, vendorId: session.user.id },
    })

    if (!existing) {
      return Response.json({ error: 'Product not found' }, { status: 404 })
    }

    const product = await prisma.vendorProduct.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
        ...(linkUrl !== undefined && { linkUrl: linkUrl || null }),
        ...(productType !== undefined && { productType }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return Response.json(product)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'VENDOR') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return Response.json({ error: 'Product ID required' }, { status: 400 })
    }

    const existing = await prisma.vendorProduct.findFirst({
      where: { id, vendorId: session.user.id },
    })

    if (!existing) {
      return Response.json({ error: 'Product not found' }, { status: 404 })
    }

    await prisma.vendorProduct.delete({ where: { id } })

    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
