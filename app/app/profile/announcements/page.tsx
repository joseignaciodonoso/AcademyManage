"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ProfileAnnouncementsPage() {
  return (
    <div className="p-4">
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Anuncios</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[hsl(var(--foreground))]/70">
            Aquí verás comunicados, noticias y avisos importantes de tu academia.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
