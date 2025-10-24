"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { OnboardingData } from "../onboarding-wizard"

interface AcademyDataStepProps {
  data: OnboardingData
  onUpdate: (data: Partial<OnboardingData>) => void
  organizationType?: "ACADEMY" | "CLUB" | "OTHER"
}

const DISCIPLINES = [
  "Karate",
  "Taekwondo",
  "Judo",
  "Jiu-Jitsu",
  "Muay Thai",
  "Kickboxing",
  "MMA",
  "Aikido",
  "Kung Fu",
  "Capoeira",
  "Otro",
]

const SPORTS = [
  "Basketball",
  "Football",
  "Volleyball",
  "Tennis",
  "Rugby",
  "Hockey",
  "Otro",
]

export function AcademyDataStep({ data, onUpdate, organizationType = "ACADEMY" }: AcademyDataStepProps) {
  const isClub = organizationType === "CLUB"
  const nameLabel = isClub ? "Nombre del Club *" : "Nombre de la Academia *"
  const namePlaceholder = isClub ? "Club Deportivo Shohoku" : "Academia de Karate Santiago"
  const primaryLabel = isClub ? "Deporte Principal *" : "Disciplina Principal *"
  const primaryPlaceholder = isClub ? "Selecciona un deporte" : "Selecciona una disciplina"
  const scheduleLabel = isClub ? "Horarios de Entrenamientos" : "Horarios de Atención"
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="academyName">{nameLabel}</Label>
          <Input
            id="academyName"
            value={data.academyName || ""}
            onChange={(e) => onUpdate({ academyName: e.target.value })}
            placeholder={namePlaceholder}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="discipline">{primaryLabel}</Label>
          <Select value={data.discipline || ""} onValueChange={(value) => onUpdate({ discipline: value })}>
            <SelectTrigger>
              <SelectValue placeholder={primaryPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {(isClub ? SPORTS : DISCIPLINES).map((val) => (
                <SelectItem key={val} value={val}>
                  {val}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            value={data.phone || ""}
            onChange={(e) => onUpdate({ phone: e.target.value })}
            placeholder="+56 9 1234 5678"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email de Contacto</Label>
          <Input
            id="email"
            type="email"
            value={data.email || ""}
            onChange={(e) => onUpdate({ email: e.target.value })}
            placeholder="contacto@academia.cl"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mainBranchAddress">Dirección de la Sede Principal</Label>
        <Textarea
          id="mainBranchAddress"
          value={data.mainBranchAddress || ""}
          onChange={(e) => onUpdate({ mainBranchAddress: e.target.value })}
          placeholder="Av. Providencia 1234, Providencia, Santiago"
          rows={2}
        />
      </div>

      <div className="space-y-4">
        <Label>{scheduleLabel}</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { key: "monday", label: "Lunes" },
            { key: "tuesday", label: "Martes" },
            { key: "wednesday", label: "Miércoles" },
            { key: "thursday", label: "Jueves" },
            { key: "friday", label: "Viernes" },
            { key: "saturday", label: "Sábado" },
            { key: "sunday", label: "Domingo" },
          ].map(({ key, label }) => (
            <div key={key} className="space-y-2">
              <Label className="text-sm font-medium">{label}</Label>
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={data.operatingHours?.[key]?.open || ""}
                  onChange={(e) =>
                    onUpdate({
                      operatingHours: {
                        ...data.operatingHours,
                        [key]: e.target.value
                          ? {
                              open: e.target.value,
                              close: data.operatingHours?.[key]?.close || "",
                            }
                          : null,
                      },
                    })
                  }
                  className="text-xs"
                />
                <Input
                  type="time"
                  value={data.operatingHours?.[key]?.close || ""}
                  onChange={(e) =>
                    onUpdate({
                      operatingHours: {
                        ...data.operatingHours,
                        [key]: e.target.value
                          ? {
                              open: data.operatingHours?.[key]?.open || "",
                              close: e.target.value,
                            }
                          : null,
                      },
                    })
                  }
                  className="text-xs"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
