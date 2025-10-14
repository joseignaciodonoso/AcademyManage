import Link from "next/link"
import { Button } from "@/components/ui/button"
import AuthLayout from "@/components/auth/AuthLayout"
import { ShieldAlert } from "lucide-react"

export default function UnauthorizedPage() {
  return (
    <AuthLayout
      title="Acceso no autorizado"
      subtitle="No tienes permisos para acceder a esta sección del panel. Si crees que es un error, contacta al administrador de tu academia."
      Icon={ShieldAlert}
    >
      <div className="flex items-center justify-center">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button asChild>
              <Link href="/auth/signin">Iniciar sesión</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Volver al inicio</Link>
            </Button>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
