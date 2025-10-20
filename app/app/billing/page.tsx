import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PaymentHistory } from "@/components/student/billing/payment-history"
import Link from "next/link"
import { Button } from "@/components/ui/button"

// Force dynamic server rendering
export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

export default async function BillingPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect("/auth/signin")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis Pagos</h1>
          <p className="text-muted-foreground">Historial de pagos y transacciones</p>
        </div>
        <Button asChild>
          <Link href="/app/subscribe">Registrar pago</Link>
        </Button>
      </div>

      <PaymentHistory />
    </div>
  )
}
