import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (password.length < 6) {
      return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return Response.json({ error: 'Email already registered' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    // Use a transaction to atomically check for existing admins and create the user.
    // The first registered user gets ADMIN role when no admin exists in the database.
    const user = await prisma.$transaction(async (tx) => {
      const adminCount = await tx.user.count({ where: { role: 'ADMIN' } })
      const role = adminCount === 0 ? 'ADMIN' : 'USER'

      return tx.user.create({
        data: { name, email, password: hashedPassword, role },
      })
    })

    return Response.json(
      { message: 'User created successfully', userId: user.id },
      { status: 201 }
    )
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
