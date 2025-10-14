"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Copy } from "lucide-react"

export function BankTransferInfo({
  bank = "Banco Estado",
  accountType = "Cuenta Vista",
  accountNumber = "12345678",
  holder = "Academy Pro SpA",
  rut = "76.123.456-7",
  email = "pagos@academy.pro",
}: {
  bank?: string
  accountType?: string
  accountNumber?: string
  holder?: string
  rut?: string
  email?: string
}) {
  const [copied, setCopied] = useState<string>("")
  const [brand, setBrand] = useState({ bank, accountType, accountNumber, holder, rut, email })

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/public/branding", { cache: "no-store" })
        if (res.ok) {
          const d = await res.json()
          setBrand({
            bank: d.bank || bank,
            accountType: d.accountType || accountType,
            accountNumber: d.accountNumber || accountNumber,
            holder: d.holder || holder,
            rut: d.rut || rut,
            email: d.email || email,
          })
        }
      } catch {}
    })()
  }, [])

  const copyText = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(label)
      setTimeout(() => setCopied(""), 1200)
    } catch {}
  }

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
      <div className="text-sm text-muted-foreground sm:col-span-2">{label}</div>
      <div className="sm:col-span-3 flex items-center gap-2">
        <Input value={value} readOnly className="bg-transparent" />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => copyText(label, value)}
          className="shrink-0"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos para Transferencia</CardTitle>
        <CardDescription>Realiza la transferencia y sube el comprobante</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Row label="Banco" value={brand.bank} />
        <Row label="Tipo de Cuenta" value={brand.accountType} />
        <Row label="Número de Cuenta" value={brand.accountNumber} />
        <Row label="Titular" value={brand.holder} />
        <Row label="RUT" value={brand.rut} />
        <Row label="Email de pago" value={brand.email} />
        {copied && (
          <div className="text-xs text-emerald-600">{copied} copiado al portapapeles</div>
        )}
      </CardContent>
    </Card>
  )
}
