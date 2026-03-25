import { prisma } from '@/lib/prisma'
import HomeContent from './HomeContent'

async function getHomeData() {
  const [featuredModels, popularModels, categories, modelCount, userCount, downloadCount] = await Promise.all([
    prisma.model3D.findMany({
      where: { isFeatured: true, isPublished: true },
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        user: { select: { id: true, name: true, avatar: true } },
        images: { where: { isMain: true }, take: 1 },
      },
    }),
    prisma.model3D.findMany({
      where: { isPublished: true },
      take: 8,
      orderBy: { downloads: 'desc' },
      include: {
        category: true,
        user: { select: { id: true, name: true, avatar: true } },
        images: { where: { isMain: true }, take: 1 },
      },
    }),
    prisma.category.findMany({
      take: 8,
      include: { _count: { select: { models: true } } },
    }),
    prisma.model3D.count({ where: { isPublished: true } }),
    prisma.user.count(),
    prisma.download.count(),
  ])

  return { featuredModels, popularModels, categories, modelCount, userCount, downloadCount }
}

export default async function HomePage() {
  const data = await getHomeData()

  return <HomeContent {...JSON.parse(JSON.stringify(data))} />
}
