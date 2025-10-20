"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { QrCode, Download, Printer } from "lucide-react"
import QRCodeStyling from "qr-code-styling"

export default function ProfileQRPage() {
  const { data: session } = useSession()
  const [qrCode, setQrCode] = useState<QRCodeStyling | null>(null)
  const [activeSession, setActiveSession] = useState<any>(null)

  useEffect(() => {
    if (session?.user?.id) {
      fetchActiveSession()
    }
  }, [session])

  useEffect(() => {
    if (session?.user?.id && activeSession) {
      generateQR()
    }
  }, [session, activeSession])

  const fetchActiveSession = async () => {
    try {
      // Get today's class or training session
      const response = await fetch("/api/attendance/today")
      if (response.ok) {
        const data = await response.json()
        if (data.session) {
          setActiveSession(data.session)
        }
      }
    } catch (error) {
      console.error("Error fetching active session:", error)
    }
  }

  const generateQR = () => {
    if (!session?.user?.id || !activeSession) return

    // QR Format: "USER_ID:SESSION_ID:TYPE"
    const qrData = `${session.user.id}:${activeSession.id}:${activeSession.type}`

    const qr = new QRCodeStyling({
      width: 300,
      height: 300,
      data: qrData,
      margin: 10,
      qrOptions: {
        typeNumber: 0,
        mode: "Byte",
        errorCorrectionLevel: "H",
      },
      imageOptions: {
        hideBackgroundDots: true,
        imageSize: 0.4,
        margin: 5,
      },
      dotsOptions: {
        color: "#000000",
        type: "rounded",
      },
      backgroundOptions: {
        color: "#ffffff",
      },
      cornersSquareOptions: {
        color: "#000000",
        type: "extra-rounded",
      },
      cornersDotOptions: {
        color: "#000000",
        type: "dot",
      },
    })

    setQrCode(qr)

    // Render QR code
    const qrContainer = document.getElementById("qr-code-container")
    if (qrContainer) {
      qrContainer.innerHTML = ""
      qr.append(qrContainer)
    }
  }

  const downloadQR = () => {
    if (qrCode) {
      qrCode.download({
        name: `qr-${session?.user?.name?.replace(/\s+/g, "-")}`,
        extension: "png",
      })
    }
  }

  const printQR = () => {
    window.print()
  }

  if (!session) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>Debes iniciar sesión para ver tu código QR</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mi Código QR</h1>
        <p className="text-muted-foreground">
          Usa este código para registrar tu asistencia
        </p>
      </div>

      {!activeSession ? (
        <Alert>
          <AlertDescription>
            No hay clases o entrenamientos programados para hoy.
            El código QR se generará automáticamente cuando haya una sesión activa.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* QR Code Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-6 w-6" />
                Tu Código QR
              </CardTitle>
              <CardDescription>
                Escanea este código en el kiosko de asistencia
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <div 
                id="qr-code-container" 
                className="border-4 border-primary/20 rounded-lg p-4 bg-white"
              />
              
              <div className="text-center">
                <p className="font-semibold text-lg">{session.user.name}</p>
                <p className="text-sm text-muted-foreground">
                  {activeSession.type === "training" ? "Entrenamiento" : "Clase"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {activeSession.name}
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={downloadQR} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
                <Button onClick={printQR} variant="outline">
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Cómo Usar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Guarda tu código</h4>
                  <p className="text-sm text-muted-foreground">
                    Descarga o toma una captura de pantalla de tu código QR
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Ve al kiosko</h4>
                  <p className="text-sm text-muted-foreground">
                    Busca el kiosko de asistencia en tu sede
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Escanea</h4>
                  <p className="text-sm text-muted-foreground">
                    Muestra tu código QR a la cámara del kiosko
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Confirma</h4>
                  <p className="text-sm text-muted-foreground">
                    Verás un mensaje de confirmación en pantalla
                  </p>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Importante:</strong> Este código QR es único y personal.
                  No lo compartas con otros usuarios.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #qr-code-container,
          #qr-code-container * {
            visibility: visible;
          }
          #qr-code-container {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </div>
  )
}
