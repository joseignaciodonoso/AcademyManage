import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const academy = await prisma.academy.findUnique({
      where: { slug: params.slug },
      select: {
        name: true,
        slug: true,
        type: true,
        logoUrl: true,
        brandPrimary: true,
      }
    })

    if (!academy) {
      return NextResponse.json({ error: "Academy not found" }, { status: 404 })
    }

    return NextResponse.json(academy)
  } catch (error) {
    console.error("Error fetching academy:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
