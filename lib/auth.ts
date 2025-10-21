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
        orgSlug: { label: "Organization", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        })

        if (!user) {
          return null
        }

        // Fetch academy if user has academyId
        let academy = null
        if (user.academyId) {
          academy = await prisma.academy.findUnique({
            where: { id: user.academyId }
          })
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

        let org: { id: string; slug: string; type: string } | null = null
        let orgRole: UserRole | null = null
        if (credentials.orgSlug) {
          // Cast prisma to any to access freshly added models during transition
          const p: any = prisma
          if (p.organization?.findUnique) {
            org = await p.organization.findUnique({
              where: { slug: credentials.orgSlug },
              select: { id: true, slug: true, type: true },
            })
            if (!org) {
              // If slug invalid, reject to avoid cross-tenant auth
              return null
            }
            // Try to get role through membership; fallback to user's global role
            if (p.organizationMember?.findUnique) {
              const member = await p.organizationMember.findUnique({
                where: { organizationId_userId: { organizationId: org.id, userId: user.id } },
              })
              if (member) {
                orgRole = (member.role as unknown) as UserRole
              }
            } else {
              // Delegate not available yet (likely needs server restart after schema change)
              // Proceed without tenant binding (backward compatible)
            }
          } else {
            // Delegate not available yet (likely needs server restart after schema change)
            // Proceed without tenant binding (backward compatible)
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          academyId: user.academyId,
          academy: academy,
          orgId: org?.id,
          orgSlug: org?.slug,
          orgRole: orgRole ?? user.role,
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
        token.orgId = (user as any).orgId
        token.orgSlug = (user as any).orgSlug
        token.orgRole = (user as any).orgRole
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
        session.user.role = (token.role as unknown) as UserRole
        session.user.academyId = token.academyId as string
        session.user.academy = token.academy as any
        // Multi-tenant additions
        ;(session.user as any).orgId = token.orgId as string | undefined
        ;(session.user as any).orgSlug = token.orgSlug as string | undefined
        ;(session.user as any).orgRole = (token.orgRole as unknown) as UserRole | undefined
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
}
