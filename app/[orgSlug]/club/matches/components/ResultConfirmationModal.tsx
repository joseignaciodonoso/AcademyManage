import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Calendar } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Match {
  id: string
  date: string
  opponent: string
  location: string
}

interface ResultConfirmationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  match: Match | null
  onConfirm: (confirmed: boolean) => void
}

export function ResultConfirmationModal({
  open,
  onOpenChange,
  match,
  onConfirm,
}: ResultConfirmationModalProps) {
  if (!match) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar Resultado del Partido</DialogTitle>
          <DialogDescription>
            ¿Se jugó este partido?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <p className="font-semibold text-lg">vs {match.opponent}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(match.date), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{match.location}</p>
          </div>

          <p className="text-sm text-muted-foreground">
            Si el partido se jugó, podrás cargar los resultados. Si no se realizó, se marcará como cancelado.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onConfirm(false)}
            className="flex-1"
          >
            <XCircle className="h-4 w-4 mr-2" />
            No se jugó
          </Button>
          <Button
            onClick={() => onConfirm(true)}
            className="flex-1"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Sí, cargar resultado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
