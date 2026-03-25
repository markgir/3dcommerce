import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const overrides = await prisma.translation.findMany()

    const result: Record<string, Record<string, string>> = {}
    for (const row of overrides) {
      if (!result[row.locale]) result[row.locale] = {}
      result[row.locale][row.key] = row.value
    }

    return Response.json(result)
  } catch {
    return Response.json({})
  }
}
