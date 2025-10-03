import type { UserRole } from "@/lib/types"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      role: UserRole
      academyId?: string
      academy?: {
        id: string
        name: string
        slug: string
      }
    }
  }

  interface User {
    role: UserRole
    academyId?: string
    academy?: {
      id: string
      name: string
      slug: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole
    academyId?: string
    academy?: {
      id: string
      name: string
      slug: string
    }
  }
}
