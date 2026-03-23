import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const categories = [
      { name: 'Art & Sculptures', slug: 'art', icon: '🎨', color: '#e74c3c' },
      { name: 'Gadgets & Electronics', slug: 'gadgets', icon: '⚡', color: '#3498db' },
      { name: 'Tools & Hardware', slug: 'tools', icon: '🔧', color: '#e67e22' },
      { name: 'Toys & Games', slug: 'toys', icon: '🎮', color: '#9b59b6' },
      { name: 'Architecture', slug: 'architecture', icon: '🏛️', color: '#1abc9c' },
      { name: 'Jewelry', slug: 'jewelry', icon: '💍', color: '#f39c12' },
      { name: 'Fashion', slug: 'fashion', icon: '👗', color: '#e91e63' },
      { name: 'Education', slug: 'education', icon: '📚', color: '#2196f3' },
      { name: 'Home & Garden', slug: 'home', icon: '🏡', color: '#4caf50' },
      { name: 'Vehicles', slug: 'vehicles', icon: '🚗', color: '#795548' },
    ]

    for (const cat of categories) {
      await prisma.category.upsert({
        where: { slug: cat.slug },
        update: {},
        create: cat,
      })
    }

    // Create demo user
    const hashedPassword = await bcrypt.hash('demo123456', 12)
    const demoUser = await prisma.user.upsert({
      where: { email: 'demo@3dprint.com' },
      update: {},
      create: {
        name: 'Demo User',
        email: 'demo@3dprint.com',
        password: hashedPassword,
        bio: '3D printing enthusiast',
      },
    })

    const artCategory = await prisma.category.findUnique({ where: { slug: 'art' } })
    const toolsCategory = await prisma.category.findUnique({ where: { slug: 'tools' } })
    const toysCategory = await prisma.category.findUnique({ where: { slug: 'toys' } })

    if (artCategory && toolsCategory && toysCategory) {
      const sampleModels = [
        {
          title: 'Geometric Flower Vase',
          description: 'A beautiful geometric flower vase perfect for home decoration. Easy to print and assemble.',
          categoryId: artCategory.id,
          tags: 'vase,home,decoration,geometric',
          isFeatured: true,
          license: 'CC BY 4.0',
        },
        {
          title: 'Cable Management Clips',
          description: 'Practical cable clips to keep your desk organized. Fits standard 5mm cables.',
          categoryId: toolsCategory.id,
          tags: 'cable,organizer,desk,practical',
          isFeatured: true,
          license: 'CC BY-SA 4.0',
        },
        {
          title: 'Articulated Dragon',
          description: 'A fully articulated dragon that moves! Print in place, no supports needed.',
          categoryId: toysCategory.id,
          tags: 'dragon,articulated,print-in-place,toy',
          isFeatured: true,
          license: 'CC BY 4.0',
        },
        {
          title: 'Phone Stand with Adjustable Angle',
          description: 'Universal phone stand with adjustable viewing angle. Works with any smartphone.',
          categoryId: toolsCategory.id,
          tags: 'phone,stand,adjustable,practical',
          isFeatured: false,
          license: 'CC0',
        },
        {
          title: 'Miniature Chess Set',
          description: 'Full chess set with all pieces. Perfect for travel. Includes board and storage box.',
          categoryId: toysCategory.id,
          tags: 'chess,game,miniature,board-game',
          isFeatured: false,
          license: 'CC BY 4.0',
        },
        {
          title: 'Spiral Lamp Shade',
          description: 'Beautiful spiral lamp shade that creates amazing light patterns on the wall.',
          categoryId: artCategory.id,
          tags: 'lamp,light,spiral,decoration',
          isFeatured: false,
          license: 'CC BY-NC 4.0',
        },
      ]

      for (const modelData of sampleModels) {
        await prisma.model3D.create({
          data: {
            ...modelData,
            userId: demoUser.id,
            downloads: Math.floor(Math.random() * 500),
            likesCount: Math.floor(Math.random() * 200),
            views: Math.floor(Math.random() * 2000),
          },
        })
      }
    }

    return Response.json({ message: 'Seed data created successfully' })
  } catch (error) {
    console.error('Seed error:', error)
    return Response.json({ error: 'Seed failed' }, { status: 500 })
  }
}
