"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"

const PLAY_APP_URL = "https://v0-basketball-play-interface.vercel.app/"

export default function CoachPlaysPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Volver">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Armar Jugadas</h1>
          <p className="text-muted-foreground">Herramienta embebida para diseño de jugadas de básquetbol</p>
        </div>
        
      </div>

      <Card className="w-full overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Editor</CardTitle>
          <CardDescription>
            {loading ? "Cargando la aplicación…" : "Aplicación lista"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading && (
            <div className="h-[70vh] w-full animate-pulse bg-muted" />
          )}
          <iframe
            title="Basketball Plays"
            src={PLAY_APP_URL}
            className="w-full h-[80vh] border-0"
            onLoad={() => setLoading(false)}
            referrerPolicy="no-referrer"
          />
        </CardContent>
      </Card>
    </div>
  )
}
