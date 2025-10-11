"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"

export function HeaderAcademyName({ initialName }: { initialName: string }) {
  const { data: session } = useSession()
  const [name, setName] = useState(initialName || "Academia")

  const loadName = async () => {
    try {
      const academyId = (session?.user as any)?.academyId as string | undefined
      if (!academyId) return
      const res = await fetch(`/api/admin/branding?academyId=${academyId}`, { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      if (data?.name) setName(data.name as string)
    } catch {}
  }

  useEffect(() => {
    loadName()
    const handler = (e: Event) => {
      const ev = e as CustomEvent<{ name?: string }>
      if (ev.detail?.name) setName(ev.detail.name)
      else loadName()
    }
    window.addEventListener("branding:updated", handler as EventListener)
    return () => window.removeEventListener("branding:updated", handler as EventListener)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user])

  return <h2 className="text-lg font-bold text-white leading-tight">{name}</h2>
}
