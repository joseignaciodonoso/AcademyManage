"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, KeyRound } from "lucide-react"

export function ResetPasswordDialog({ studentId, studentEmail }: { studentId: string; studentEmail?: string }) {
  const [open, setOpen] = useState(false)
  const [pwd, setPwd] = useState("")
  const [pwd2, setPwd2] = useState("")
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  const strong = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/

  const onSubmit = async () => {
    setError(null)
    setOk(false)
    if (pwd !== pwd2) {
      setError("Las contraseñas no coinciden")
      return
    }
    if (!strong.test(pwd)) {
      setError("Debe tener 8+ caracteres, mayúscula, minúscula y número")
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/students/${studentId}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: pwd }),
      })
      const data = await res.json().catch(()=>({}))
      if (!res.ok) throw new Error(data.error || "Error al cambiar contraseña")
      setOk(true)
      setPwd("")
      setPwd2("")
    } catch (e: any) {
      setError(e.message || "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2"><KeyRound className="h-4 w-4"/> Cambiar Contraseña</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar contraseña</DialogTitle>
          <DialogDescription>
            {studentEmail ? <>Alumno: <span className="font-medium">{studentEmail}</span></> : "Define una nueva contraseña para el alumno"}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
        )}
        {ok && (
          <Alert><AlertDescription>Contraseña actualizada correctamente.</AlertDescription></Alert>
        )}

        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Nueva contraseña</Label>
            <div className="relative">
              <Input type={show ? "text" : "password"} value={pwd} onChange={(e)=>setPwd(e.target.value)} placeholder="Nueva contraseña" className="pr-10" />
              <button type="button" onClick={()=>setShow(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {show ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Confirmar contraseña</Label>
            <Input type={show ? "text" : "password"} value={pwd2} onChange={(e)=>setPwd2(e.target.value)} placeholder="Repite la contraseña" />
          </div>
          <p className="text-xs text-muted-foreground">Requisitos: 8+ caracteres, mayúscula, minúscula y número.</p>
        </div>

        <DialogFooter>
          <Button onClick={onSubmit} disabled={loading}>{loading ? "Guardando..." : "Guardar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
