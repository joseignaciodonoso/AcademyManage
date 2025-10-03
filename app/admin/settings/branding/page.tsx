import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { BrandingSettings } from "@/components/admin/branding-settings"

export default async function BrandingSettingsPage() {
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

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Configuración de Branding</h1>
        <p className="text-muted-foreground">Personaliza la apariencia visual de tu academia</p>
      </div>

      <BrandingSettings academy={academy} />
    </div>
  )
}
