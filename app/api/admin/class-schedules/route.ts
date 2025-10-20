import { NextResponse, type NextRequest } from "next/server"

export async function GET(_req: NextRequest) {
  return NextResponse.json({ error: "Class schedules feature disabled" }, { status: 410 })
}

export async function POST(_req: NextRequest) {
  return NextResponse.json({ error: "Class schedules feature disabled" }, { status: 410 })
}
