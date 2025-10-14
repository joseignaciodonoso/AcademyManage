"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Upload } from "lucide-react"

export function PaymentProof({ membershipId, amount, onSubmitted }: { membershipId?: string; amount?: number; onSubmitted?: () => void }) {
  const [proofUrl, setProofUrl] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch("/api/student/payments/proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofUrl, membershipId, amount }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "No se pudo subir el comprobante")
      }
      setMessage("Comprobante enviado. Será revisado por un administrador.")
      setProofUrl("")
      onSubmitted?.()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subir Comprobante de Transferencia</CardTitle>
        <CardDescription>Adjunta el enlace a tu comprobante (Drive/Dropbox/Imagen pública)</CardDescription>
      </CardHeader>
      <CardContent>
        {message && (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={onSubmit} className="flex gap-2 items-center">
          <Input
            placeholder="https://... (URL de tu comprobante)"
            value={proofUrl}
            onChange={(e) => setProofUrl(e.target.value)}
            required
          />
          <Button type="submit" disabled={submitting || !proofUrl}>
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Enviar
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
