"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

type Props = {
  hasActivePlan: boolean
  prefix?: string
  children: React.ReactNode
}

export function StudentGuard({ hasActivePlan, prefix = "", children }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Si tiene plan activo, permitir acceso a todo
    if (hasActivePlan) return

    // Extraer la parte de la ruta después del prefix
    const relativePath = prefix ? pathname.replace(prefix, "") : pathname

    // Rutas permitidas sin plan activo
    const allowedPaths = [
      "/app",           // Página principal (muestra bienvenida)
      "/app/billing",   // Historial de pagos
      "/app/subscribe", // Flujo de suscripción
      "/app/profile",   // Perfil del usuario
    ]

    const isAllowed = allowedPaths.some((p) => 
      relativePath === p || 
      relativePath.startsWith(p + "/") ||
      pathname === `${prefix}${p}` ||
      pathname.startsWith(`${prefix}${p}/`)
    )

    // Si no está en una ruta permitida, redirigir a la página principal
    // que mostrará la pantalla de bienvenida
    if (!isAllowed) {
      router.replace(`${prefix}/app`)
    }
  }, [hasActivePlan, pathname, router, prefix])

  return <>{children}</>
}
