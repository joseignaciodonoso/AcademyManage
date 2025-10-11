"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ProfileSettingsPage() {
  return (
    <div className="p-4">
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Mi perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Nombre</label>
              <Input placeholder="Tu nombre" />
            </div>
            <div>
              <label className="block text-sm mb-1">Email</label>
              <Input placeholder="tu@email.com" disabled />
            </div>
          </div>
          <div className="flex gap-2">
            <Button>Guardar</Button>
            <Button variant="outline">Cancelar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
