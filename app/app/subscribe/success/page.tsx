import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"

export default function SubscribeSuccessPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const provider = String(searchParams.provider || "")
  const status = String(searchParams.status || "success")
  const paymentId = String(searchParams.paymentId || "")

  const title = status === "success" ? "Pago confirmado" : "Estado recibido"
  const desc = status === "success"
    ? "Tu pago fue procesado correctamente. Tu membresía se activará en breve."
    : "Hemos recibido el resultado del pago. Si no ves reflejado el cambio, revisa Facturación."

  return (
    <div className="max-w-xl mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-col items-center text-center gap-2">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {desc}
            {provider && (
              <>
                <br />
                Método: <span className="font-medium">{provider}</span>
              </>
            )}
            {paymentId && (
              <>
                <br />
                ID de pago: <span className="font-mono text-xs">{paymentId}</span>
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2 justify-center">
          <Button asChild>
            <Link href="/app/billing">Ir a Facturación</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/app">Ir al Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
