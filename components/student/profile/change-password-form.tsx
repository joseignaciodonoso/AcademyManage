"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff } from "lucide-react"

const STRONG = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/

export function ChangePasswordForm() {
  const [current, setCurrent] = useState("")
  const [pwd, setPwd] = useState("")
  const [pwd2, setPwd2] = useState("")
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  const onSubmit = async () => {
    setError(null)
    setOk(false)
    if (pwd !== pwd2) return setError("Las contraseñas no coinciden")
    if (!STRONG.test(pwd)) return setError("Debe tener 8+ caracteres, mayúscula, minúscula y número")
    setLoading(true)
    try {
      const res = await fetch("/api/app/me/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: pwd }),
      })
      const data = await res.json().catch(()=>({}))
      if (!res.ok) throw new Error(data.error || "Error al cambiar contraseña")
      setOk(true)
      setCurrent("")
      setPwd("")
      setPwd2("")
    } catch (e: any) {
      setError(e.message || "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cambiar contraseña</CardTitle>
        <CardDescription>Actualiza la contraseña de tu cuenta</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
        )}
        {ok && (
          <Alert><AlertDescription>Contraseña actualizada correctamente.</AlertDescription></Alert>
        )}
        <div className="space-y-2">
          <Label>Contraseña actual</Label>
          <Input type={show ? "text" : "password"} value={current} onChange={(e)=>setCurrent(e.target.value)} placeholder="Ingresa tu contraseña actual" />
        </div>
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
        <div className="pt-2">
          <Button onClick={onSubmit} disabled={loading}>{loading ? "Guardando..." : "Guardar"}</Button>
        </div>
      </CardContent>
    </Card>
  )
}
