import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { requirePermission } from "@/lib/rbac"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

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
    const allowedTypes = ["image/jpeg", "image/png", "image/svg+xml", "image/x-icon", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 })
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Archivo muy grande (máximo 2MB)" }, { status: 400 })
    }

    // Create upload directory for branding files
    const uploadDir = join(process.cwd(), "public", "uploads", "branding", academyId)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate filename based on type (logo, logoDark, favicon)
    const extension = file.name.split(".").pop() || "png"
    const fileName = `${type}.${extension}`
    const filepath = join(uploadDir, fileName)

    // Convert file to buffer and write to filesystem
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Return the public URL with cache-busting timestamp
    const url = `/uploads/branding/${academyId}/${fileName}?t=${Date.now()}`

    return NextResponse.json({ url })
  } catch (error) {
    console.error("Error uploading branding file:", error)
    return NextResponse.json({ error: "Error al subir archivo" }, { status: 500 })
  }
}
