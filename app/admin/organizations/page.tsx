"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Building2, ExternalLink, Search } from "lucide-react"

interface OrgItem { id: string; name: string; slug: string }

export default function OrganizationsAdminPage() {
  const [items, setItems] = useState<OrgItem[]>([])
  const [filtered, setFiltered] = useState<OrgItem[]>([])
  const [q, setQ] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/admin/organizations", { cache: "no-store" })
        if (!res.ok) throw new Error("No autorizado o error del servidor")
        const data = await res.json()
        const list: OrgItem[] = data.items || []
        setItems(list)
        setFiltered(list)
      } catch (e: any) {
        setError(e?.message || "Error al cargar organizaciones")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    const term = q.trim().toLowerCase()
    if (!term) { setFiltered(items); return }
    setFiltered(items.filter(o => o.name.toLowerCase().includes(term) || o.slug.toLowerCase().includes(term)))
  }, [q, items])

  return (
    <div className="min-h-screen w-full p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Organizaciones</h1>
            <p className="text-muted-foreground">Gestiona academias y clubes (solo SuperAdmin)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Buscar por nombre o slug" className="pl-9" />
          </div>
        </div>

        {loading && <div className="text-sm text-muted-foreground">Cargando...</div>}
        {error && <div className="text-sm text-red-400">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((o) => (
            <Card key={o.id} className="border-border/60">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{o.name}</CardTitle>
                    <CardDescription className="text-xs">/{o.slug}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex items-center gap-2">
                <Button asChild size="sm">
                  <Link href={`/${o.slug}/admin/dashboard`}>
                    Abrir Dashboard <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/${o.slug}/admin/students`}>Alumnos</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/${o.slug}/admin/calendar`}>Calendario</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
