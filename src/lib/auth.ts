import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) return null

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null

        // Auto-promote the first user to ADMIN on sign-in if no admins exist.
        // Uses a transaction for atomicity, consistent with the registration route.
        let role = user.role
        if (role !== 'ADMIN') {
          role = await prisma.$transaction(async (tx) => {
            const adminCount = await tx.user.count({ where: { role: 'ADMIN' } })
            if (adminCount === 0) {
              await tx.user.update({
                where: { id: user.id },
                data: { role: 'ADMIN' },
              })
              return 'ADMIN'
            }
            return user.role
          })
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role,
          image: user.avatar,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role ?? 'USER'
      } else if (token.id) {
        // Always refresh role from database to reflect any changes
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        })
        if (dbUser) {
          token.role = dbUser.role
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
