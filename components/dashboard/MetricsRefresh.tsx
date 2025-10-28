"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { MetricsLoader } from "./MetricsLoader"

interface MetricsRefreshProps {
  userId: string
  hasData: boolean
}

export function MetricsRefresh({ userId, hasData }: MetricsRefreshProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const fromLogin = searchParams.get('from') === 'login' || 
                     sessionStorage.getItem('justLoggedIn') === 'true'

    if (fromLogin) {
      // Limpiar el flag
      sessionStorage.removeItem('justLoggedIn')
      
      // Si no hay datos, mostrar loader y refrescar
      if (!hasData) {
        setIsRefreshing(true)
        const timer = setTimeout(() => {
          router.refresh()
        }, 1500) // Dar más tiempo para que se establezca la sesión

        return () => clearTimeout(timer)
      }
    }
  }, [hasData, router, searchParams])

  // También refrescar si no hay datos después de un tiempo
  useEffect(() => {
    if (!hasData && !isRefreshing) {
      const timer = setTimeout(() => {
        setIsRefreshing(true)
        router.refresh()
      }, 2000) // Esperar 2 segundos para que la sesión se establezca

      return () => clearTimeout(timer)
    }
  }, [hasData, isRefreshing, router])

  // Mostrar loader si estamos refrescando y no hay datos
  if (isRefreshing && !hasData) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="w-full max-w-6xl p-4">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold mb-2">Cargando tu dashboard...</h2>
            <p className="text-muted-foreground">Preparando tus métricas personalizadas</p>
          </div>
          <MetricsLoader />
        </div>
      </div>
    )
  }

  return null
}
