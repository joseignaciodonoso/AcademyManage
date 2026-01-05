"use client"

import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function TenantAppSubscribeSuccessPage() {
  const params = useParams<{ orgSlug: string }>()
  const prefix = `/${params.orgSlug}`
  
  return (
    <div className="max-w-lg mx-auto p-4">
      <Card className="border-green-500/20">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">¡Pago Exitoso!</h2>
            <p className="text-[hsl(var(--foreground))]/60 max-w-md mx-auto">
              Tu suscripción ha sido activada correctamente. Ya puedes acceder a todas las clases y contenido.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
            <Button asChild variant="outline">
              <Link href={`${prefix}/app/billing`}>
                Ver mis pagos
              </Link>
            </Button>
            <Button asChild>
              <Link href={`${prefix}/app`}>
                Ir al inicio
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
