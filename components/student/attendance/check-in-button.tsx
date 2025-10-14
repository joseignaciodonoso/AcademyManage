"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Check } from "lucide-react"

export function CheckInButton({ classId, onDone }: { classId: string; onDone?: () => void }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/student/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "No se pudo registrar asistencia")
      }
      setDone(true)
      if (onDone) onDone()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button onClick={handleClick} disabled={loading || done}>
        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : done ? <Check className="h-4 w-4 mr-2" /> : null}
        {done ? "Asistencia registrada" : "Registrar asistencia"}
      </Button>
      {error && <div className="text-xs text-red-500">{error}</div>}
    </div>
  )
}
