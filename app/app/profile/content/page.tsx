"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ProfileContentPage() {
  return (
    <div className="p-4">
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Contenido</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[hsl(var(--foreground))]/70">
            Tus contenidos, material de estudio y recursos aparecerán aquí.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
