"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ProfileHomePage() {
  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Bienvenido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[hsl(var(--foreground))]/70">
              Este es tu inicio. Desde aquí podrás ver atajos a tus próximas clases, pagos recientes y novedades.
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Resumen rápido</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2 text-[hsl(var(--foreground))]/80">
              <li>• Próxima clase: —</li>
              <li>• Último pago: —</li>
              <li>• Anuncios nuevos: —</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
