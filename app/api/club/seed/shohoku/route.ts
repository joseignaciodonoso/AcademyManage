import { NextResponse, type NextRequest } from "next/server"

// Deprecated: Shohoku seed endpoint
export async function POST(_req: NextRequest) {
  return NextResponse.json({ error: "Deprecated seed endpoint" }, { status: 410 })
}
