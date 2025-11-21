'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

/**
 * Componente que gestiona la duración de la sesión basado en la preferencia "Recordarme"
 * Debe ser incluido en el layout principal de la aplicación
 */
export default function SessionManager() {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'authenticated' && typeof window !== 'undefined') {
      const rememberMe = localStorage.getItem('rememberMe') === 'true'
      
      // Configurar la duración de la cookie de sesión
      if (rememberMe) {
        // Si "Recordarme" está activo, extender la cookie a 90 días
        const maxAge = 90 * 24 * 60 * 60 // 90 días en segundos
        document.cookie = `next-auth.session-token=${getCookie('next-auth.session-token')}; max-age=${maxAge}; path=/; samesite=lax`
        document.cookie = `__Secure-next-auth.session-token=${getCookie('__Secure-next-auth.session-token')}; max-age=${maxAge}; path=/; secure; samesite=lax`
      } else {
        // Si no está activo, usar sesión de navegador (se borra al cerrar)
        // Las cookies sin max-age son cookies de sesión
        const sessionToken = getCookie('next-auth.session-token')
        const secureToken = getCookie('__Secure-next-auth.session-token')
        
        if (sessionToken) {
          document.cookie = `next-auth.session-token=${sessionToken}; path=/; samesite=lax`
        }
        if (secureToken) {
          document.cookie = `__Secure-next-auth.session-token=${secureToken}; path=/; secure; samesite=lax`
        }
      }
    }
  }, [status])

  return null
}

// Función auxiliar para obtener el valor de una cookie
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null
  }
  
  return null
}
