import { prisma } from '@/lib/prisma'

/** GET /api/settings – public endpoint to fetch site settings (logo, etc.) */
export async function GET() {
  try {
    const settings = await prisma.siteSetting.findMany()
    const result: Record<string, string> = {}
    for (const s of settings) {
      result[s.key] = s.value
    }
    return Response.json(result)
  } catch {
    return Response.json({})
  }
}
