"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Bell, Send, Users, Calendar, Trophy, Activity, Mail, MessageSquare } from "lucide-react"
import { toast } from "sonner"

interface Member {
  id: string
  name: string
  email: string
}

export default function NotificationsPage() {
  const params = useParams()
  const [loading, setLoading] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [notificationType, setNotificationType] = useState<string>("")
  const [channel, setChannel] = useState<"email" | "whatsapp">("email")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      const response = await fetch("/api/club/members")
      if (response.ok) {
        const data = await response.json()
        setMembers(data.members)
      }
    } catch (error) {
      console.error("Error fetching members:", error)
    }
  }

  const notificationTypes = [
    {
      id: "callup",
      name: "Convocatoria a Partido",
      icon: Trophy,
      template: "Has sido convocado para el próximo partido. Revisa los detalles en la plataforma.",
    },
    {
      id: "training",
      name: "Recordatorio de Entrenamiento",
      icon: Activity,
      template: "Recordatorio: Tienes entrenamiento programado. No olvides asistir.",
    },
    {
      id: "match-result",
      name: "Resultado de Partido",
      icon: Trophy,
      template: "El partido ha finalizado. Revisa el resultado y las estadísticas.",
    },
    {
      id: "evaluation",
      name: "Nueva Evaluación",
      icon: Calendar,
      template: "Se ha publicado tu evaluación del último partido. Revísala en tu perfil.",
    },
    {
      id: "custom",
      name: "Mensaje Personalizado",
      icon: MessageSquare,
      template: "",
    },
  ]

  const handleSelectAll = () => {
    if (selectedMembers.length === members.length) {
      setSelectedMembers([])
    } else {
      setSelectedMembers(members.map(m => m.id))
    }
  }

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  const handleTypeChange = (typeId: string) => {
    setNotificationType(typeId)
    const type = notificationTypes.find(t => t.id === typeId)
    if (type && type.template) {
      setMessage(type.template)
      setSubject(type.name)
    } else {
      setMessage("")
      setSubject("")
    }
  }

  const handleSend = async () => {
    if (selectedMembers.length === 0) {
      toast.error("Selecciona al menos un destinatario")
      return
    }

    if (!message.trim()) {
      toast.error("Escribe un mensaje")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/club/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: selectedMembers,
          channel,
          subject,
          message,
          notificationType,
        }),
      })

      if (response.ok) {
        toast.success(`Notificación enviada a ${selectedMembers.length} destinatario(s)`)
        setSelectedMembers([])
        setMessage("")
        setSubject("")
        setNotificationType("")
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al enviar notificación")
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error al enviar notificación")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Notificaciones</h1>
        <p className="text-muted-foreground">
          Envía mensajes y alertas a los jugadores
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Tipo de Notificación</CardTitle>
              <CardDescription>
                Selecciona una plantilla o crea un mensaje personalizado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {notificationTypes.map((type) => {
                  const Icon = type.icon
                  const isSelected = notificationType === type.id
                  
                  return (
                    <div
                      key={type.id}
                      onClick={() => handleTypeChange(type.id)}
                      className={`
                        flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all
                        ${isSelected 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                        }
                      `}
                    >
                      <div className={`
                        flex h-10 w-10 items-center justify-center rounded-lg
                        ${isSelected 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted text-muted-foreground"
                        }
                      `}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{type.name}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Message Composition */}
          <Card>
            <CardHeader>
              <CardTitle>Mensaje</CardTitle>
              <CardDescription>
                Personaliza el contenido de la notificación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Channel */}
              <div className="space-y-2">
                <Label>Canal de Envío</Label>
                <Select value={channel} onValueChange={(v) => setChannel(v as "email" | "whatsapp")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </div>
                    </SelectItem>
                    <SelectItem value="whatsapp">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        WhatsApp
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Subject (Email only) */}
              {channel === "email" && (
                <div className="space-y-2">
                  <Label htmlFor="subject">Asunto</Label>
                  <input
                    id="subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Asunto del email"
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  />
                </div>
              )}

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">Mensaje</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escribe tu mensaje aquí..."
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  {message.length} caracteres
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={loading || selectedMembers.length === 0 || !message.trim()}
            size="lg"
            className="w-full"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar a {selectedMembers.length} destinatario(s)
              </>
            )}
          </Button>
        </div>

        {/* Recipients */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Destinatarios
                  </CardTitle>
                  <CardDescription>
                    {selectedMembers.length} de {members.length} seleccionados
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedMembers.length === members.length ? "Deseleccionar" : "Todos"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleMemberToggle(member.id)}
                  >
                    <Checkbox
                      checked={selectedMembers.includes(member.id)}
                      onCheckedChange={() => handleMemberToggle(member.id)}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
