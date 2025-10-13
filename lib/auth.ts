import type { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import type { UserRole } from "@/lib/types"

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
          include: {
            academy: true,
          },
        })

        if (!user) {
          return null
        }

        // Verify password
        if (!user.password) {
          return null
        }
        
        const bcrypt = require("bcryptjs")
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        
        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          academyId: user.academyId,
          academy: user.academy,
        } as any
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.academyId = (user as any).academyId
        token.academy = (user as any).academy
        return token
      }
      // No user object (subsequent requests). Refresh critical fields from DB in case they changed (e.g., academyId after onboarding)
      if (token?.sub) {
        try {
          const u = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { role: true, academyId: true, academy: { select: { id: true, name: true, slug: true } } },
          })
          if (u) {
            token.role = u.role
            token.academyId = u.academyId as any
            token.academy = u.academy as any
          }
        } catch {}
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as UserRole
        session.user.academyId = token.academyId as string
        session.user.academy = token.academy as any
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
}
