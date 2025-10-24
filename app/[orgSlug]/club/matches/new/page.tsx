"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"

export default function NewMatchPage() {
  const params = useParams() as { orgSlug: string }
  const router = useRouter()

  useEffect(() => {
    // Auto redirect to calendar after a brief delay to show the message
    const timer = setTimeout(() => {
      router.push(`/${params.orgSlug}/admin/calendar`)
    }, 3000)
    return () => clearTimeout(timer)
  }, [params.orgSlug, router])

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Calendar className="h-16 w-16 text-primary" />
          </div>
          <CardTitle>Los partidos se gestionan desde el Calendario</CardTitle>
          <CardDescription>
            Para crear un nuevo partido, dirígete al calendario de administrador y crea un evento de tipo "Campeonato".
            El partido se generará automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Serás redirigido al calendario en unos segundos...
          </p>
          <div className="flex justify-center gap-2">
            <Button 
              onClick={() => router.push(`/${params.orgSlug}/admin/calendar`)}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Ir al Calendario
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              Volver
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
