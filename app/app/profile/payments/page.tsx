"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type PaymentRecord = {
  id: string
  amount: number
  method: string
  status: "PAID" | "FAILED"
  createdAt: string
}

const STORAGE_KEY = "simulated_payments"

export default function ProfilePaymentsPage() {
  const [amount, setAmount] = useState<string>("")
  const [method, setMethod] = useState<string>("CARD")
  const [processing, setProcessing] = useState(false)
  const [history, setHistory] = useState<PaymentRecord[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setHistory(JSON.parse(raw))
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
    } catch {}
  }, [history])

  const amountNumber = useMemo(() => {
    const n = Number(amount)
    return Number.isFinite(n) && n > 0 ? Math.round(n) : 0
  }, [amount])

  const simulatePayment = async () => {
    if (!amountNumber) return
    setProcessing(true)
    // Simulate delay
    await new Promise((r) => setTimeout(r, 900))
    const rec: PaymentRecord = {
      id: crypto.randomUUID(),
      amount: amountNumber,
      method,
      status: "PAID",
      createdAt: new Date().toISOString(),
    }
    setHistory((h) => [rec, ...h])
    setProcessing(false)
    setAmount("")
  }

  return (
    <div className="p-4 space-y-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Simular pago</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm mb-1">Monto (CLP)</label>
              <Input
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="Ej: 25000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Método</label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CARD">Tarjeta (simulada)</SelectItem>
                  <SelectItem value="TRANSFER">Transferencia (simulada)</SelectItem>
                  <SelectItem value="CASH">Efectivo (simulado)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full" disabled={!amountNumber || processing} onClick={simulatePayment}>
                {processing ? "Procesando..." : "Simular pago"}
              </Button>
            </div>
          </div>
          <p className="text-xs text-[hsl(var(--foreground))]/60">
            Este flujo es una simulación local. No realiza cargos reales. Los pagos quedan guardados en tu navegador.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Historial</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-sm text-[hsl(var(--foreground))]/60">Sin pagos aún.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-40">Fecha</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{new Date(p.createdAt).toLocaleString("es-CL")}</TableCell>
                      <TableCell>
                        {p.method === "CARD" ? "Tarjeta" : p.method === "TRANSFER" ? "Transferencia" : "Efectivo"}
                      </TableCell>
                      <TableCell className="text-right">{new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(p.amount)}</TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/30">
                          Pagado
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
