import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/rbac"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const qAcademyId = searchParams.get("academyId")

    const targetAcademyId = session.user.role === "SUPER_ADMIN" && qAcademyId
      ? qAcademyId
      : session.user.academyId

    if (!targetAcademyId) {
      return NextResponse.json({ error: "Academia no especificada" }, { status: 400 })
    }

    const academy = await prisma.academy.findUnique({ where: { id: targetAcademyId } })
    if (!academy) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 404 })
    }

    // Original app look & feel (baseline) – used by client when not configured
    const ORIGINAL = {
      brandPrimary: "#3b82f6", // blue-500
      brandSecondary: "#64748b", // slate-500
      brandAccent: "#8b5cf6", // violet-500
      brandNeutral: "#1f2937", // slate-800
      brandBackground: "#0b1220", // dark base
      brandForeground: "#e5e7eb", // gray-200
    }

    // Prisma defaults – determine if branding has been configured
    const PRISMA_DEFAULT = {
      brandPrimary: "#000000",
      brandSecondary: "#666666",
      brandAccent: "#0066cc",
      brandNeutral: "#f5f5f5",
      brandBackground: "#ffffff",
      brandForeground: "#000000",
    }

    const isPrismaDefault = (
      (academy.brandPrimary || "").toLowerCase() === PRISMA_DEFAULT.brandPrimary &&
      (academy.brandSecondary || "").toLowerCase() === PRISMA_DEFAULT.brandSecondary &&
      (academy.brandAccent || "").toLowerCase() === PRISMA_DEFAULT.brandAccent &&
      (academy.brandNeutral || "").toLowerCase() === PRISMA_DEFAULT.brandNeutral &&
      (academy.brandBackground || "").toLowerCase() === PRISMA_DEFAULT.brandBackground &&
      (academy.brandForeground || "").toLowerCase() === PRISMA_DEFAULT.brandForeground &&
      !academy.logoUrl && !academy.logoDarkUrl && !academy.faviconUrl
    )

    const configured = !isPrismaDefault

    return NextResponse.json({
      name: academy.name,
      brandPrimary: academy.brandPrimary,
      brandSecondary: academy.brandSecondary,
      brandAccent: academy.brandAccent,
      brandNeutral: academy.brandNeutral,
      brandBackground: academy.brandBackground,
      brandForeground: academy.brandForeground,
      defaultThemeMode: academy.defaultThemeMode,
      logoUrl: academy.logoUrl,
      logoDarkUrl: academy.logoDarkUrl,
      faviconUrl: academy.faviconUrl,
      ogImageUrl: academy.ogImageUrl,
      configured,
      original: ORIGINAL,
    })
  } catch (error) {
    console.error("GET /api/admin/branding error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (!hasPermission(session.user.role as any, "branding:write")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const body = await req.json()
    const {
      name,
      brandPrimary,
      brandSecondary,
      brandAccent,
      brandNeutral,
      brandBackground,
      brandForeground,
      defaultThemeMode,
      logoUrl,
      logoDarkUrl,
      faviconUrl,
      ogImageUrl,
      academyId,
      resetToOriginal,
    } = body || {}

    const targetAcademyId = session.user.role === "SUPER_ADMIN" && academyId
      ? academyId
      : session.user.academyId

    if (!targetAcademyId) {
      return NextResponse.json({ error: "Academia no especificada" }, { status: 400 })
    }

    const updated = await prisma.academy.update({
      where: { id: targetAcademyId },
      data: resetToOriginal
        ? {
            // Reset to Prisma defaults to indicate "unconfigured"
            brandPrimary: "#000000",
            brandSecondary: "#666666",
            brandAccent: "#0066cc",
            brandNeutral: "#f5f5f5",
            brandBackground: "#ffffff",
            brandForeground: "#000000",
            defaultThemeMode: "system",
            logoUrl: null,
            logoDarkUrl: null,
            faviconUrl: null,
            ogImageUrl: null,
            ...(name ? { name } : {}),
          }
        : {
            ...(name ? { name } : {}),
            ...(brandPrimary ? { brandPrimary } : {}),
            ...(brandSecondary ? { brandSecondary } : {}),
            ...(brandAccent ? { brandAccent } : {}),
            ...(brandNeutral ? { brandNeutral } : {}),
            ...(brandBackground ? { brandBackground } : {}),
            ...(brandForeground ? { brandForeground } : {}),
            ...(defaultThemeMode ? { defaultThemeMode } : {}),
            ...(logoUrl !== undefined ? { logoUrl } : {}),
            ...(logoDarkUrl !== undefined ? { logoDarkUrl } : {}),
            ...(faviconUrl !== undefined ? { faviconUrl } : {}),
            ...(ogImageUrl !== undefined ? { ogImageUrl } : {}),
          },
    })

    return NextResponse.json({ ok: true, name: updated.name })
  } catch (error) {
    console.error("PUT /api/admin/branding error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
