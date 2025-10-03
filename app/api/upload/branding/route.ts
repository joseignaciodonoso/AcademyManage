import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { requirePermission } from "@/lib/rbac"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    requirePermission(session.user.role, "branding:write")

    const formData = await request.formData()
    const file = formData.get("file") as File
    const type = formData.get("type") as string
    const academyId = formData.get("academyId") as string

    if (!file || !type || !academyId) {
      return NextResponse.json({ error: "Datos faltantes" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/svg+xml", "image/x-icon"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 })
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Archivo muy grande (máximo 2MB)" }, { status: 400 })
    }

    // TODO: Upload to S3/Vercel Blob
    // For now, we'll return a placeholder URL
    const fileName = `${academyId}-${type}-${Date.now()}.${file.name.split(".").pop()}`
    const url = `/placeholder-uploads/${fileName}`

    return NextResponse.json({ url })
  } catch (error) {
    console.error("Error uploading branding file:", error)
    return NextResponse.json({ error: "Error al subir archivo" }, { status: 500 })
  }
}
