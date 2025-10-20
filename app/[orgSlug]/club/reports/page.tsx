"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { FileText, Download, FileSpreadsheet, Calendar, Users, Trophy, Activity } from "lucide-react"
import { toast } from "sonner"

export default function ReportsPage() {
  const params = useParams()
  const [loading, setLoading] = useState(false)
  const [reportType, setReportType] = useState<string>("")
  const [format, setFormat] = useState<"pdf" | "excel">("pdf")
  const [period, setPeriod] = useState("30d")
  const [includeCharts, setIncludeCharts] = useState(true)

  const reportTypes = [
    {
      id: "team-performance",
      name: "Rendimiento del Equipo",
      description: "Estadísticas generales del equipo, récord, goles/puntos",
      icon: Trophy,
    },
    {
      id: "player-stats",
      name: "Estadísticas de Jugadores",
      description: "Detalle individual de cada jugador con métricas clave",
      icon: Users,
    },
    {
      id: "match-history",
      name: "Historial de Partidos",
      description: "Lista completa de partidos con resultados y estadísticas",
      icon: Calendar,
    },
    {
      id: "training-attendance",
      name: "Asistencia a Entrenamientos",
      description: "Reporte de asistencia por jugador y sesión",
      icon: Activity,
    },
    {
      id: "player-evaluations",
      name: "Evaluaciones de Jugadores",
      description: "Calificaciones y feedback de evaluaciones",
      icon: FileText,
    },
  ]

  const handleExport = async () => {
    if (!reportType) {
      toast.error("Selecciona un tipo de reporte")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/club/reports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType,
          format,
          period,
          includeCharts,
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `reporte-${reportType}-${new Date().toISOString().split("T")[0]}.${format === "pdf" ? "pdf" : "xlsx"}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast.success("Reporte generado exitosamente")
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al generar reporte")
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error al generar reporte")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Reportes y Exportación</h1>
        <p className="text-muted-foreground">
          Genera reportes detallados en PDF o Excel
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración</CardTitle>
              <CardDescription>
                Personaliza tu reporte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Format */}
              <div className="space-y-2">
                <Label>Formato</Label>
                <Select value={format} onValueChange={(v) => setFormat(v as "pdf" | "excel")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        PDF
                      </div>
                    </SelectItem>
                    <SelectItem value="excel">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        Excel
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Period */}
              <div className="space-y-2">
                <Label>Período</Label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Últimos 7 días</SelectItem>
                    <SelectItem value="30d">Últimos 30 días</SelectItem>
                    <SelectItem value="90d">Últimos 90 días</SelectItem>
                    <SelectItem value="365d">Último año</SelectItem>
                    <SelectItem value="all">Todo el tiempo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Options */}
              {format === "pdf" && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="charts"
                    checked={includeCharts}
                    onCheckedChange={(checked) => setIncludeCharts(checked as boolean)}
                  />
                  <label
                    htmlFor="charts"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Incluir gráficos
                  </label>
                </div>
              )}

              {/* Export Button */}
              <Button
                onClick={handleExport}
                disabled={loading || !reportType}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Reporte
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Report Types */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Tipo de Reporte</CardTitle>
              <CardDescription>
                Selecciona el reporte que deseas generar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {reportTypes.map((report) => {
                  const Icon = report.icon
                  const isSelected = reportType === report.id
                  
                  return (
                    <div
                      key={report.id}
                      onClick={() => setReportType(report.id)}
                      className={`
                        flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-all
                        ${isSelected 
                          ? "border-primary bg-primary/5 shadow-md" 
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                        }
                      `}
                    >
                      <div className={`
                        flex h-12 w-12 items-center justify-center rounded-lg
                        ${isSelected 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted text-muted-foreground"
                        }
                      `}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{report.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {report.description}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Información sobre Reportes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">📄 Formato PDF</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Ideal para presentaciones y documentos oficiales</li>
                <li>• Incluye gráficos y visualizaciones</li>
                <li>• Formato profesional con logo del club</li>
                <li>• Listo para imprimir</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">📊 Formato Excel</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Ideal para análisis de datos</li>
                <li>• Datos en formato tabular editable</li>
                <li>• Compatible con Excel y Google Sheets</li>
                <li>• Permite crear gráficos personalizados</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
