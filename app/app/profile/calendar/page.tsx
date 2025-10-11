"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ProfileCalendarPage() {
  return (
    <div className="p-4">
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Calendario</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[hsl(var(--foreground))]/70">
            Tu agenda de clases, eventos y recordatorios aparecerá aquí.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
