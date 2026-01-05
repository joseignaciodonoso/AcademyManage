"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2,
  QrCode,
  Calendar,
  MapPin
} from "lucide-react"

export default function CheckinPage() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const classId = searchParams.get("classId")
  const token = searchParams.get("token")

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    className?: string
    time?: string
  } | null>(null)
  const [classInfo, setClassInfo] = useState<{
    id: string
    name: string
    startTime: string
    endTime: string
    branchName?: string
  } | null>(null)

  // Fetch class info
  useEffect(() => {
    if (classId && token) {
      fetch(`/api/attendance/class-info?classId=${classId}&token=${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.class) {
            setClassInfo(data.class)
          }
        })
        .catch(console.error)
    }
  }, [classId, token])

  const handleCheckin = useCallback(async () => {
    if (!classId || !token) {
      setResult({
        success: false,
        message: "QR inválido. Solicita un nuevo código al instructor."
      })
      return
    }

    try {
      setLoading(true)
      const res = await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, token })
      })

      const data = await res.json()

      if (res.ok) {
        setResult({
          success: true,
          message: "¡Asistencia registrada correctamente!",
          className: data.className,
          time: new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })
        })
      } else {
        setResult({
          success: false,
          message: data.error || "No se pudo registrar la asistencia"
        })
      }
    } catch (e) {
      setResult({
        success: false,
        message: "Error de conexión. Intenta nuevamente."
      })
    } finally {
      setLoading(false)
    }
  }, [classId, token])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto p-3 rounded-full bg-yellow-500/10 w-fit mb-4">
              <XCircle className="h-8 w-8 text-yellow-500" />
            </div>
            <CardTitle>Inicia sesión</CardTitle>
            <CardDescription>
              Debes iniciar sesión para registrar tu asistencia
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <a href="/login">Iniciar Sesión</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!classId || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto p-3 rounded-full bg-red-500/10 w-fit mb-4">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <CardTitle>QR Inválido</CardTitle>
            <CardDescription>
              El código QR no es válido o ha expirado. Solicita un nuevo código al instructor.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        {result ? (
          <>
            <CardHeader className="text-center">
              <div className={`mx-auto p-3 rounded-full w-fit mb-4 ${
                result.success ? "bg-green-500/10" : "bg-red-500/10"
              }`}>
                {result.success ? (
                  <CheckCircle className="h-10 w-10 text-green-500" />
                ) : (
                  <XCircle className="h-10 w-10 text-red-500" />
                )}
              </div>
              <CardTitle className={result.success ? "text-green-600" : "text-red-600"}>
                {result.success ? "¡Listo!" : "Error"}
              </CardTitle>
              <CardDescription className="text-base">
                {result.message}
              </CardDescription>
            </CardHeader>
            {result.success && (
              <CardContent className="space-y-3">
                {result.className && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                    <Calendar className="h-4 w-4" />
                    <span>{result.className}</span>
                  </div>
                )}
                {result.time && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                    <Clock className="h-4 w-4" />
                    <span>Registrado a las {result.time}</span>
                  </div>
                )}
                <div className="pt-4 text-center">
                  <Button variant="outline" asChild>
                    <a href="/app">Ir al Dashboard</a>
                  </Button>
                </div>
              </CardContent>
            )}
            {!result.success && (
              <CardContent className="text-center">
                <Button onClick={() => setResult(null)}>
                  Intentar nuevamente
                </Button>
              </CardContent>
            )}
          </>
        ) : (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto p-3 rounded-full bg-primary/10 w-fit mb-4">
                <QrCode className="h-10 w-10 text-primary" />
              </div>
              <CardTitle>Registrar Asistencia</CardTitle>
              <CardDescription>
                Confirma tu asistencia a la clase
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {classInfo && (
                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <h3 className="font-medium">{classInfo.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {new Date(classInfo.startTime).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })} - 
                      {new Date(classInfo.endTime).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  {classInfo.branchName && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{classInfo.branchName}</span>
                    </div>
                  )}
                </div>
              )}

              <Alert>
                <AlertDescription className="text-center">
                  Hola <strong>{session.user?.name}</strong>, confirma tu asistencia presionando el botón.
                </AlertDescription>
              </Alert>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handleCheckin}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmar Asistencia
                  </>
                )}
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}
