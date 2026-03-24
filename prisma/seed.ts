import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import bcrypt from 'bcryptjs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.resolve(__dirname, '../prisma/dev.db')

const adapter = new PrismaLibSql({ url: `file:${dbPath}` })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // Create categories
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
  console.log('✓ Categories created')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123456', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@3dprinthub.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@3dprinthub.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  })
  console.log(`✓ Admin user created: ${admin.email} / admin123456`)

  // Create demo user
  const demoPassword = await bcrypt.hash('demo123456', 12)
  const demo = await prisma.user.upsert({
    where: { email: 'demo@3dprinthub.com' },
    update: {},
    create: {
      name: 'Demo Creator',
      email: 'demo@3dprinthub.com',
      password: demoPassword,
      bio: '3D printing enthusiast and maker',
    },
  })
  console.log(`✓ Demo user created: ${demo.email} / demo123456`)

  // Create sample models
  const art = await prisma.category.findUnique({ where: { slug: 'art' } })
  const tools = await prisma.category.findUnique({ where: { slug: 'tools' } })
  const toys = await prisma.category.findUnique({ where: { slug: 'toys' } })
  const home = await prisma.category.findUnique({ where: { slug: 'home' } })

  if (art && tools && toys && home) {
    const models = [
      {
        title: 'Geometric Flower Vase',
        description: 'A beautiful geometric flower vase perfect for home decoration. Easy to print with standard settings. No supports needed. Print at 0.2mm layer height for best results.',
        categoryId: art.id,
        tags: 'vase,home,decoration,geometric,flower',
        isFeatured: true,
        downloads: 342,
        likesCount: 89,
        views: 1203,
      },
      {
        title: 'Cable Management Clips',
        description: 'Practical cable management clips to keep your desk organized. Fits cables from 3mm to 8mm diameter. Print 4-6 for a clean setup.',
        categoryId: tools.id,
        tags: 'cable,organizer,desk,practical,clips',
        isFeatured: true,
        downloads: 567,
        likesCount: 134,
        views: 2045,
      },
      {
        title: 'Articulated Dragon',
        description: 'A fully articulated dragon that moves at every joint! Print in place design - no assembly needed. Amazing conversation piece and stress toy.',
        categoryId: toys.id,
        tags: 'dragon,articulated,print-in-place,toy,fantasy',
        isFeatured: true,
        downloads: 892,
        likesCount: 278,
        views: 4521,
      },
      {
        title: 'Phone Stand with Adjustable Angle',
        description: 'Universal phone stand with adjustable viewing angle from 45° to 90°. Compatible with any smartphone up to 7 inches.',
        categoryId: tools.id,
        tags: 'phone,stand,adjustable,desk,smartphone',
        downloads: 445,
        likesCount: 102,
        views: 1876,
      },
      {
        title: 'Miniature Chess Set',
        description: 'Complete miniature chess set. Includes all 32 pieces and a foldable board. Perfect for travel. All pieces have weighted bases.',
        categoryId: toys.id,
        tags: 'chess,game,miniature,board-game,travel',
        downloads: 321,
        likesCount: 67,
        views: 1234,
      },
      {
        title: 'Spiral Lamp Shade',
        description: 'Beautiful spiral lamp shade that creates amazing light patterns on the wall. Fits standard E27 bulb holders. PLA or PETG recommended.',
        categoryId: home.id,
        tags: 'lamp,light,spiral,decoration,ambient',
        isFeatured: true,
        downloads: 234,
        likesCount: 78,
        views: 987,
      },
    ]

    for (const modelData of models) {
      await prisma.model3D.create({
        data: {
          ...modelData,
          userId: demo.id,
          license: 'CC BY 4.0',
        },
      })
    }
    console.log(`✓ ${models.length} sample models created`)
  }

  console.log('\nSeed complete! 🎉')
  console.log('\nAdmin login: admin@3dprinthub.com / admin123456')
  console.log('Demo login:  demo@3dprinthub.com / demo123456')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
