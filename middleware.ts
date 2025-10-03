import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { UserRole } from "@/lib/types"

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const { pathname } = request.nextUrl

  // Public routes - allow access without authentication
  if (pathname.startsWith("/auth") || pathname === "/") {
    return NextResponse.next()
  }

  // API routes for authentication - allow without token
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  // Public API routes - allow without authentication
  if (pathname.startsWith("/api/odoo/ping")) {
    return NextResponse.next()
  }

  // Require authentication for all other protected routes
  if (!token) {
    const signInUrl = new URL("/auth/signin", request.url)
    signInUrl.searchParams.set("callbackUrl", request.url)
    return NextResponse.redirect(signInUrl)
  }

  // Role-based route protection
  if (pathname.startsWith("/admin")) {
    if (token.role !== UserRole.SUPER_ADMIN && token.role !== UserRole.ACADEMY_ADMIN) {
      return NextResponse.redirect(new URL("/unauthorized", request.url))
    }
  }

  if (pathname.startsWith("/coach")) {
    if (token.role !== UserRole.COACH && token.role !== UserRole.ACADEMY_ADMIN && token.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.redirect(new URL("/unauthorized", request.url))
    }
  }

  if (pathname.startsWith("/app")) {
    if (
      token.role !== UserRole.STUDENT &&
      token.role !== UserRole.ACADEMY_ADMIN &&
      token.role !== UserRole.SUPER_ADMIN
    ) {
      return NextResponse.redirect(new URL("/unauthorized", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
