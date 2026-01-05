"use client"

import { useParams } from "next/navigation"

export default function TenantAppProfileSettingsPage() {
  const params = useParams<{ orgSlug: string }>()
  
  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">Configuración</h1>
      <p className="text-muted-foreground">Página de configuración en construcción</p>
    </div>
  )
}
