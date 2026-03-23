import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ModelDetailClient from './ModelDetailClient'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const model = await prisma.model3D.findUnique({
    where: { id },
    include: { category: true, user: { select: { name: true } } },
  })
  if (!model) return { title: 'Model Not Found' }
  return {
    title: `${model.title} – 3D Print Hub`,
    description: model.description,
  }
}

export default async function ModelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const model = await prisma.model3D.findUnique({
    where: { id, isPublished: true },
    include: {
      category: true,
      user: { select: { id: true, name: true, avatar: true, bio: true } },
      images: true,
      files: true,
      comments: {
        include: { user: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })

  if (!model) notFound()

  return <ModelDetailClient model={model} />
}
