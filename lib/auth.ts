import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"

// Ensure NEXTAUTH_URL is always defined to prevent "Invalid URL" errors
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || "http://localhost:3001"

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 90 * 24 * 60 * 60, // 90 días (3 meses)
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Explicitly set the URL to prevent null URL errors
  ...(NEXTAUTH_URL ? { url: NEXTAUTH_URL } : {}),
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? `__Secure-next-auth.session-token` 
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 90 * 24 * 60 * 60, // 90 días
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production'
        ? `__Secure-next-auth.callback-url`
        : `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production'
        ? `__Host-next-auth.csrf-token`
        : `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
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
          throw new Error("Por favor ingresa tu correo y contraseña")
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        })

        if (!user) {
          throw new Error("No existe una cuenta con este correo electrónico")
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
          throw new Error("Esta cuenta no tiene contraseña configurada")
        }
        
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        
        if (!isPasswordValid) {
          throw new Error("La contraseña es incorrecta")
        }

        // For tenant login, verify user belongs to the academy
        if (credentials.orgSlug && academy) {
          if (academy.slug !== credentials.orgSlug) {
            // User doesn't belong to this academy
            throw new Error("No tienes acceso a esta organización")
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          academyId: user.academyId,
          academy: academy,
          orgSlug: academy?.slug,
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
        token.orgSlug = (user as any).orgSlug
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (token as any).role = u.role;
            (token as any).academyId = u.academyId;
            (token as any).academy = u.academy;
            (token as any).orgSlug = u.academy?.slug;
          }
        } catch {}
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const t = token as any;
        (session.user as any).id = t.sub;
        (session.user as any).role = t.role;
        (session.user as any).academyId = t.academyId;
        (session.user as any).academy = t.academy;
        (session.user as any).orgSlug = t.orgSlug;
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
}
