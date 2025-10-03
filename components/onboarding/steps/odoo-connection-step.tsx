"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertTriangle, Loader2 } from "lucide-react"
import type { OnboardingData } from "../onboarding-wizard"

interface OdooConnectionStepProps {
  data: OnboardingData
  onUpdate: (data: Partial<OnboardingData>) => void
}

export function OdooConnectionStep({ data, onUpdate }: OdooConnectionStepProps) {
  const [testing, setTesting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<{
    status: "idle" | "success" | "error"
    message: string
  }>({ status: "idle", message: "" })

  const testConnection = async () => {
    setTesting(true)
    try {
      const response = await fetch("/api/odoo/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl: data.odooBaseUrl,
          database: data.odooDatabase,
          username: data.odooUsername,
          password: data.odooPassword,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setConnectionStatus({
          status: "success",
          message: "Conexión exitosa con Odoo",
        })
        onUpdate({ odooConnectionVerified: true })
      } else {
        setConnectionStatus({
          status: "error",
          message: result.error || "Error al conectar con Odoo",
        })
      }
    } catch (error) {
      setConnectionStatus({
        status: "error",
        message: "Error de red al conectar con Odoo",
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Configura la conexión con tu instancia de Odoo para procesar pagos y gestionar suscripciones.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Configuración de Odoo</CardTitle>
          <CardDescription>Ingresa los datos de conexión a tu instancia de Odoo 18</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="odooBaseUrl">URL Base de Odoo *</Label>
              <Input
                id="odooBaseUrl"
                value={data.odooBaseUrl || ""}
                onChange={(e) => onUpdate({ odooBaseUrl: e.target.value })}
                placeholder="http://localhost:8069"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="odooDatabase">Base de Datos *</Label>
              <Input
                id="odooDatabase"
                value={data.odooDatabase || ""}
                onChange={(e) => onUpdate({ odooDatabase: e.target.value })}
                placeholder="academia_db"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="odooUsername">Usuario API *</Label>
              <Input
                id="odooUsername"
                value={data.odooUsername || ""}
                onChange={(e) => onUpdate({ odooUsername: e.target.value })}
                placeholder="api_user"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="odooPassword">Contraseña *</Label>
              <Input
                id="odooPassword"
                type="password"
                value={data.odooPassword || ""}
                onChange={(e) => onUpdate({ odooPassword: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={testConnection}
              disabled={testing || !data.odooBaseUrl || !data.odooDatabase || !data.odooUsername || !data.odooPassword}
            >
              {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Probar Conexión
            </Button>
          </div>

          {connectionStatus.status !== "idle" && (
            <Alert variant={connectionStatus.status === "error" ? "destructive" : "default"}>
              {connectionStatus.status === "success" ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertDescription>{connectionStatus.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuración de Webhooks</CardTitle>
          <CardDescription>Configura los webhooks para recibir notificaciones de pagos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhookSecret">Secret Compartido</Label>
            <Input
              id="webhookSecret"
              value={data.webhookSecret || ""}
              onChange={(e) => onUpdate({ webhookSecret: e.target.value })}
              placeholder="tu_secret_seguro_aqui"
            />
            <p className="text-sm text-muted-foreground">
              Este secret se usará para verificar la autenticidad de los webhooks
            </p>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">URL del Webhook:</p>
            <code className="text-xs bg-background p-2 rounded block">
              {typeof window !== "undefined" ? window.location.origin : "https://tu-dominio.com"}/api/odoo/payment
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
