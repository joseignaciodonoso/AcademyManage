import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-simple"
import { hasPermission } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"

// DELETE /api/admin/students/[id] - Delete student
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (!hasPermission(session.user.role, "students:write")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const studentId = params.id

    // Verify student exists and belongs to the same academy
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, academyId: true, role: true },
    })

    if (!student) {
      return NextResponse.json({ error: "Estudiante no encontrado" }, { status: 404 })
    }

    if (student.role !== "STUDENT") {
      return NextResponse.json({ error: "El usuario no es un estudiante" }, { status: 400 })
    }

    // Academy scoping: ACADEMY_ADMIN can only delete students from their academy
    if (session.user.role === "ACADEMY_ADMIN" && student.academyId !== session.user.academyId) {
      return NextResponse.json({ error: "Sin permisos para este estudiante" }, { status: 403 })
    }

    // Delete student (cascade will handle related records)
    await prisma.user.delete({
      where: { id: studentId },
    })

    return NextResponse.json({ success: true, message: "Estudiante eliminado" })
  } catch (error: any) {
    console.error("Error deleting student:", error)
    return NextResponse.json({ error: "Error al eliminar estudiante" }, { status: 500 })
  }
}

// PATCH /api/admin/students/[id] - Update student (suspend/activate)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (!hasPermission(session.user.role, "students:write")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const studentId = params.id
    const body = await request.json().catch(() => null)
    const { status, name, email, phone } = body || {}

    // Verify student exists and belongs to the same academy
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, academyId: true, role: true, status: true, email: true },
    })

    if (!student) {
      return NextResponse.json({ error: "Estudiante no encontrado" }, { status: 404 })
    }

    if (student.role !== "STUDENT") {
      return NextResponse.json({ error: "El usuario no es un estudiante" }, { status: 400 })
    }

    // Academy scoping
    if (session.user.role === "ACADEMY_ADMIN" && student.academyId !== session.user.academyId) {
      return NextResponse.json({ error: "Sin permisos para este estudiante" }, { status: 403 })
    }

    // Validate fields
    const updateData: any = {}
    if (status !== undefined) {
      if (!["ACTIVE", "INACTIVE", "SUSPENDED"].includes(status)) {
        return NextResponse.json(
          { error: "Estado inválido. Debe ser ACTIVE, INACTIVE o SUSPENDED" },
          { status: 400 }
        )
      }
      updateData.status = status
    }
    if (typeof name === 'string' && name.trim()) {
      updateData.name = name.trim()
    }
    if (typeof phone === 'string') {
      updateData.phone = phone.trim()
    }
    if (typeof email === 'string' && email.trim()) {
      const newEmail = email.trim().toLowerCase()
      if (newEmail !== student.email?.toLowerCase()) {
        const exists = await prisma.user.findUnique({ where: { email: newEmail } })
        if (exists && exists.id !== studentId) {
          return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 })
        }
      }
      updateData.email = newEmail
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No hay datos para actualizar" }, { status: 400 })
    }

    // Update student
    const updatedStudent = await prisma.user.update({
      where: { id: studentId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Estudiante actualizado",
      student: updatedStudent,
    })
  } catch (error: any) {
    console.error("Error updating student:", error)
    return NextResponse.json({ error: "Error al actualizar estudiante" }, { status: 500 })
  }
}
