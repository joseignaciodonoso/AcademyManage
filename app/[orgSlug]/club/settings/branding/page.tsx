import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { BrandingSettings } from "@/components/admin/branding-settings"

export default async function ClubBrandingSettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/signin")
  }

  if (session.user.role !== "ACADEMY_ADMIN" && session.user.role !== "SUPER_ADMIN") {
    redirect("/unauthorized")
  }

  if (!session.user.academyId) {
    redirect("/auth/signin")
  }

  const academy = await prisma.academy.findUnique({
    where: { id: session.user.academyId },
  })

  if (!academy) {
    redirect("/auth/signin")
  }

  // Verify this is a club
  if (academy.type !== "CLUB") {
    redirect("/unauthorized")
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configuración de Branding</h1>
          <p className="text-muted-foreground">Personaliza la apariencia visual de tu club</p>
        </div>
      </div>

      <BrandingSettings academy={academy} />
    </div>
  )
}
