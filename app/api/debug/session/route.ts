import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getToken } from "next-auth/jwt"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    // getToken requires the actual NextRequest to read cookies
    // We reconstruct a minimal NextRequest-like object via headers
    const token = await getToken({
      req: req as any,
      secret: process.env.NEXTAUTH_SECRET,
    })

    return NextResponse.json({
      ok: true,
      env: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || null,
        has_SECRET: Boolean(process.env.NEXTAUTH_SECRET),
      },
      session,
      token,
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}
