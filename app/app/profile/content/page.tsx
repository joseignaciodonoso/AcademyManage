import "server-only"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getActiveMembership } from "@/lib/student-guards"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Video, FileText, Download, Lock } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ProfileContentPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/auth/signin")
  if (session.user.role !== "STUDENT") redirect("/unauthorized")

  const membership = await getActiveMembership(session.user.id)
  
  // If no active membership, show locked state
  if (!membership) {
    return (
      <div className="space-y-6 p-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contenido</h1>
          <p className="text-muted-foreground">Material de estudio y recursos</p>
        </div>

        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">
              Contenido Bloqueado
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300 max-w-md">
              Para acceder al contenido exclusivo, necesitas una membresía activa con pago confirmado.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fetch content for the academy
  const contents = await prisma.content.findMany({
    where: {
      academyId: membership.academyId,
      status: "PUBLISHED",
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const getContentIcon = (type: string) => {
    switch (type) {
      case "VIDEO":
        return Video
      case "DOCUMENT":
        return FileText
      default:
        return BookOpen
    }
  }

  const getContentBadge = (type: string) => {
    switch (type) {
      case "VIDEO":
        return { label: "Video", variant: "default" as const }
      case "DOCUMENT":
        return { label: "Documento", variant: "secondary" as const }
      case "ARTICLE":
        return { label: "Artículo", variant: "outline" as const }
      default:
        return { label: type, variant: "outline" as const }
    }
  }

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contenido</h1>
        <p className="text-muted-foreground">Material de estudio y recursos exclusivos</p>
      </div>

      {contents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Sin contenido disponible</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Aún no hay contenido publicado. El equipo de la academia pronto agregará material de estudio.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contents.map((content) => {
            const Icon = getContentIcon(content.type)
            const badge = getContentBadge(content.type)
            
            return (
              <Card key={content.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>
                  <CardTitle className="text-lg mt-3">{content.title}</CardTitle>
                  {content.description && (
                    <CardDescription className="line-clamp-2">
                      {content.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {new Date(content.createdAt).toLocaleDateString("es-CL", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    {content.url && (
                      <a
                        href={content.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                      >
                        <Download className="h-4 w-4" />
                        Ver
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
