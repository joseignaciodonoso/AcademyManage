"use client"

import React from "react"
import Link from "next/link"
import { Calendar } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function CoachSchedulePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agenda del Coach</h1>
          <p className="text-muted-foreground">Próximas clases y eventos asignados</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] flex items-center justify-center">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Calendario</CardTitle>
              <CardDescription>Vista de calendario del horario del coach</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Integra aquí la vista de calendario del coach o reutiliza el componente de calendario existente según corresponda.
          </div>
          <div className="mt-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/coach/schedule">Actualizar</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
