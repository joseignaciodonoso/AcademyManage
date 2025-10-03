"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, MapPin } from "lucide-react"
import type { OnboardingData } from "../onboarding-wizard"

interface Branch {
  id: string
  name: string
  address: string
  phone?: string
  email?: string
  capacity?: number
}

interface BranchesStepProps {
  data: OnboardingData
  onUpdate: (data: Partial<OnboardingData>) => void
}

export function BranchesStep({ data, onUpdate }: BranchesStepProps) {
  const branches = data.branches || []

  const addBranch = () => {
    const newBranch: Branch = {
      id: Date.now().toString(),
      name: "",
      address: "",
    }
    onUpdate({ branches: [...branches, newBranch] })
  }

  const updateBranch = (id: string, updates: Partial<Branch>) => {
    const updatedBranches = branches.map((branch) => (branch.id === id ? { ...branch, ...updates } : branch))
    onUpdate({ branches: updatedBranches })
  }

  const removeBranch = (id: string) => {
    const updatedBranches = branches.filter((branch) => branch.id !== id)
    onUpdate({ branches: updatedBranches })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Sedes de la Academia</h3>
          <p className="text-sm text-muted-foreground">Configura las diferentes sedes donde impartes clases</p>
        </div>
        <Button onClick={addBranch}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Sede
        </Button>
      </div>

      {branches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay sedes configuradas</h3>
            <p className="text-muted-foreground text-center mb-4">
              Agrega al menos una sede para continuar con la configuración
            </p>
            <Button onClick={addBranch}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Primera Sede
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {branches.map((branch, index) => (
            <Card key={branch.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Sede {index + 1}
                    {branch.name && ` - ${branch.name}`}
                  </CardTitle>
                  {branches.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBranch(branch.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`branch-name-${branch.id}`}>Nombre de la Sede *</Label>
                    <Input
                      id={`branch-name-${branch.id}`}
                      value={branch.name}
                      onChange={(e) => updateBranch(branch.id, { name: e.target.value })}
                      placeholder="Sede Centro, Sede Norte, etc."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`branch-capacity-${branch.id}`}>Capacidad Máxima</Label>
                    <Input
                      id={`branch-capacity-${branch.id}`}
                      type="number"
                      value={branch.capacity || ""}
                      onChange={(e) =>
                        updateBranch(branch.id, { capacity: Number.parseInt(e.target.value) || undefined })
                      }
                      placeholder="50"
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`branch-phone-${branch.id}`}>Teléfono</Label>
                    <Input
                      id={`branch-phone-${branch.id}`}
                      value={branch.phone || ""}
                      onChange={(e) => updateBranch(branch.id, { phone: e.target.value })}
                      placeholder="+56 9 1234 5678"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`branch-email-${branch.id}`}>Email</Label>
                    <Input
                      id={`branch-email-${branch.id}`}
                      type="email"
                      value={branch.email || ""}
                      onChange={(e) => updateBranch(branch.id, { email: e.target.value })}
                      placeholder="sede@academia.cl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`branch-address-${branch.id}`}>Dirección *</Label>
                  <Textarea
                    id={`branch-address-${branch.id}`}
                    value={branch.address}
                    onChange={(e) => updateBranch(branch.id, { address: e.target.value })}
                    placeholder="Av. Providencia 1234, Providencia, Santiago"
                    rows={2}
                    required
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {branches.length > 0 && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={addBranch}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Otra Sede
          </Button>
        </div>
      )}
    </div>
  )
}
