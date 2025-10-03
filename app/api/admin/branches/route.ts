import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/rbac"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    requirePermission(session.user.role, "branch:read")

    const academyId = session.user.academyId
    if (!academyId && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Missing academy" }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    const requestedAcademyId = searchParams.get("academyId") || academyId || undefined

    const branches = await prisma.branch.findMany({
      where: requestedAcademyId ? { academyId: requestedAcademyId } : undefined,
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        mondayOpen: true,
        mondayClose: true,
        tuesdayOpen: true,
        tuesdayClose: true,
        wednesdayOpen: true,
        wednesdayClose: true,
        thursdayOpen: true,
        thursdayClose: true,
        fridayOpen: true,
        fridayClose: true,
        saturdayOpen: true,
        saturdayClose: true,
        sundayOpen: true,
        sundayClose: true,
        _count: { select: { coaches: true } },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ branches })
  } catch (e) {
    console.error("GET /admin/branches error", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    requirePermission(session.user.role, "branch:write")

    const body = await req.json().catch(() => ({}))
    const {
      name,
      address,
      phone,
      email,
      academyId: bodyAcademyId,
      mondayOpen,
      mondayClose,
      tuesdayOpen,
      tuesdayClose,
      wednesdayOpen,
      wednesdayClose,
      thursdayOpen,
      thursdayClose,
      fridayOpen,
      fridayClose,
      saturdayOpen,
      saturdayClose,
      sundayOpen,
      sundayClose,
    } = body || {}

    if (!name || !address) {
      return NextResponse.json({ error: "Nombre y dirección son obligatorios" }, { status: 400 })
    }

    const academyId = session.user.role === "SUPER_ADMIN" ? (bodyAcademyId || session.user.academyId) : session.user.academyId
    if (!academyId) {
      return NextResponse.json({ error: "Academia no definida" }, { status: 400 })
    }

    const created = await prisma.branch.create({
      data: {
        academyId,
        name,
        address,
        phone,
        email,
        mondayOpen,
        mondayClose,
        tuesdayOpen,
        tuesdayClose,
        wednesdayOpen,
        wednesdayClose,
        thursdayOpen,
        thursdayClose,
        fridayOpen,
        fridayClose,
        saturdayOpen,
        saturdayClose,
        sundayOpen,
        sundayClose,
      },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        mondayOpen: true,
        mondayClose: true,
        tuesdayOpen: true,
        tuesdayClose: true,
        wednesdayOpen: true,
        wednesdayClose: true,
        thursdayOpen: true,
        thursdayClose: true,
        fridayOpen: true,
        fridayClose: true,
        saturdayOpen: true,
        saturdayClose: true,
        sundayOpen: true,
        sundayClose: true,
      },
    })

    return NextResponse.json({ branch: created }, { status: 201 })
  } catch (e) {
    console.error("POST /admin/branches error", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
