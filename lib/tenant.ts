import type { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

export async function getAcademyBySlug(slug: string) {
  return prisma.academy.findUnique({
    where: { slug },
    select: { id: true, slug: true, name: true },
  })
}

export function getOrgSlugFromRequest(req: NextRequest): string | undefined {
  const h = req.headers.get("x-org-slug")
  if (h && typeof h === "string" && h.trim().length > 0) return h
  return undefined
}

export async function requireAcademyFromRequest(req: NextRequest) {
  const slug = getOrgSlugFromRequest(req)
  if (!slug) return null
  return getAcademyBySlug(slug)
}
