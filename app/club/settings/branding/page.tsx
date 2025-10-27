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
    <div className="min-h-screen w-full bg-[hsl(var(--background))] text-[hsl(var(--foreground))] p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 gradient-bg opacity-20"></div>
      <div className="absolute top-10 -left-24 w-72 h-72 bg-[hsl(var(--primary))] rounded-full mix-blend-lighten filter blur-xl opacity-30 animate-float"></div>
      <div className="absolute bottom-5 -right-20 w-80 h-80 bg-[hsl(var(--accent))] rounded-full mix-blend-lighten filter blur-2xl opacity-40 animate-float animation-delay-3000"></div>

      <div className="relative z-10 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Configuración de Branding</h1>
            <p className="text-[hsl(var(--foreground))]/70">Personaliza la apariencia visual de tu club</p>
          </div>
        </div>

        <BrandingSettings academy={academy} />
      </div>
    </div>
  )
}
