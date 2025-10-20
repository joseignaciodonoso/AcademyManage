"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { QrCode, CheckCircle2, XCircle, Users, Calendar, Maximize2, Minimize2 } from "lucide-react"
import { Html5QrcodeScanner } from "html5-qrcode"

interface CheckInResult {
  success: boolean
  userName: string
  message: string
  type?: "training" | "class"
  sessionName?: string
}

export default function KioskPage() {
  const params = useParams()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [lastResult, setLastResult] = useState<CheckInResult | null>(null)
  const [stats, setStats] = useState({ present: 0, total: 0 })
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const [mode, setMode] = useState<"auto" | "manual">("auto")

  useEffect(() => {
    // Initialize scanner
    if (mode === "auto") {
      initScanner()
    }

    return () => {
      // Cleanup scanner
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error)
      }
    }
  }, [mode])

  const initScanner = () => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      false
    )

    scanner.render(onScanSuccess, onScanError)
    scannerRef.current = scanner
    setScanning(true)
  }

  const onScanSuccess = async (decodedText: string) => {
    try {
      // Parse QR code (format: "USER_ID:SESSION_ID:TYPE")
      const [userId, sessionId, type] = decodedText.split(":")

      if (!userId || !sessionId || !type) {
        setLastResult({
          success: false,
          userName: "Desconocido",
          message: "Código QR inválido",
        })
        return
      }

      // Send check-in request
      const endpoint = type === "training" 
        ? "/api/club/training-sessions/checkin"
        : "/api/attendance/checkin"

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          sessionId,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setLastResult({
          success: true,
          userName: data.userName || "Usuario",
          message: data.message || "Check-in exitoso",
          type: type as "training" | "class",
          sessionName: data.sessionName,
        })
        
        // Update stats
        setStats(prev => ({
          present: prev.present + 1,
          total: prev.total,
        }))

        // Play success sound
        playSound("success")
      } else {
        setLastResult({
          success: false,
          userName: data.userName || "Usuario",
          message: data.error || "Error en check-in",
        })
        
        // Play error sound
        playSound("error")
      }

      // Clear result after 3 seconds
      setTimeout(() => {
        setLastResult(null)
      }, 3000)
    } catch (error) {
      console.error("Error processing QR:", error)
      setLastResult({
        success: false,
        userName: "Desconocido",
        message: "Error al procesar código QR",
      })
      playSound("error")
    }
  }

  const onScanError = (error: any) => {
    // Ignore scan errors (they happen constantly while scanning)
    // console.warn("QR scan error:", error)
  }

  const playSound = (type: "success" | "error") => {
    // Create audio context for feedback
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    if (type === "success") {
      oscillator.frequency.value = 800
      gainNode.gain.value = 0.3
    } else {
      oscillator.frequency.value = 200
      gainNode.gain.value = 0.5
    }

    oscillator.start()
    setTimeout(() => oscillator.stop(), 200)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 ${isFullscreen ? 'p-4' : 'p-6'}`}>
      <div className="container mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Kiosko de Asistencia</h1>
            <p className="text-muted-foreground text-lg">
              Escanea tu código QR para registrar asistencia
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize2 className="h-5 w-5" />
              ) : (
                <Maximize2 className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Presentes Hoy</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.present}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estado</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {scanning ? (
                  <Badge variant="default" className="text-lg">
                    Escaneando
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-lg">
                    Detenido
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* QR Scanner */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-6 w-6" />
                Escáner QR
              </CardTitle>
              <CardDescription>
                Posiciona el código QR frente a la cámara
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                id="qr-reader" 
                className="w-full rounded-lg overflow-hidden border-2 border-dashed border-primary/20"
              />
              
              {!scanning && (
                <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
                  <div className="text-center">
                    <QrCode className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Cámara desactivada
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() => setMode("auto")}
                    >
                      Activar Escáner
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Result Display */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Último Check-In</CardTitle>
              <CardDescription>
                Resultado del último escaneo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lastResult ? (
                <div className={`p-8 rounded-lg border-2 ${
                  lastResult.success 
                    ? 'bg-green-50 dark:bg-green-950 border-green-500' 
                    : 'bg-red-50 dark:bg-red-950 border-red-500'
                }`}>
                  <div className="flex items-center justify-center mb-4">
                    {lastResult.success ? (
                      <CheckCircle2 className="h-20 w-20 text-green-600" />
                    ) : (
                      <XCircle className="h-20 w-20 text-red-600" />
                    )}
                  </div>
                  
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold">
                      {lastResult.userName}
                    </h3>
                    
                    {lastResult.sessionName && (
                      <p className="text-sm text-muted-foreground">
                        {lastResult.sessionName}
                      </p>
                    )}
                    
                    <p className={`text-lg font-medium ${
                      lastResult.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                    }`}>
                      {lastResult.message}
                    </p>
                    
                    {lastResult.type && (
                      <Badge variant="outline" className="mt-2">
                        {lastResult.type === "training" ? "Entrenamiento" : "Clase"}
                      </Badge>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
                  <div className="text-center">
                    <QrCode className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Esperando escaneo...
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instrucciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Abre tu código QR</h4>
                  <p className="text-sm text-muted-foreground">
                    Desde tu perfil o app móvil
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Escanea el código</h4>
                  <p className="text-sm text-muted-foreground">
                    Posiciónalo frente a la cámara
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Confirma asistencia</h4>
                  <p className="text-sm text-muted-foreground">
                    Verás un mensaje de confirmación
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
