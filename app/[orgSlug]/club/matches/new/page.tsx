"use client"

import { useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"

export default function NewMatchPage() {
  const params = useParams() as { orgSlug: string }
  const router = useRouter()
  const searchParams = useSearchParams()
  const dateParam = searchParams.get("date")

  useEffect(() => {
    // Auto redirect to calendar after a brief delay to show the message
    const timer = setTimeout(() => {
      const calendarUrl = dateParam 
        ? `/${params.orgSlug}/admin/calendar?date=${dateParam}&type=match`
        : `/${params.orgSlug}/admin/calendar`
      router.push(calendarUrl)
    }, 3000)
    return () => clearTimeout(timer)
  }, [params.orgSlug, router, dateParam])

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
              onClick={() => {
                const calendarUrl = dateParam 
                  ? `/${params.orgSlug}/admin/calendar?date=${dateParam}&type=match`
                  : `/${params.orgSlug}/admin/calendar`
                router.push(calendarUrl)
              }}
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
