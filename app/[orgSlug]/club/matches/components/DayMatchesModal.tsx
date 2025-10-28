import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Match {
  id: string
  sport: "FOOTBALL" | "BASKETBALL"
  date: string
  opponent: string
  location: string
  homeAway?: "HOME" | "AWAY"
  status: "SCHEDULED" | "IN_PROGRESS" | "FINISHED" | "CANCELLED"
  goalsFor?: number
  goalsAgainst?: number
  pointsFor?: number
  pointsAgainst?: number
  result?: "WIN" | "DRAW" | "LOSS"
}

interface DayMatchesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: Date | undefined
  matches: Match[]
  onMatchSelect: (matchId: string) => void
}

export function DayMatchesModal({
  open,
  onOpenChange,
  date,
  matches,
  onMatchSelect,
}: DayMatchesModalProps) {
  const getStatusBadge = (match: Match) => {
    switch (match.status) {
      case "SCHEDULED":
        return <Badge className="bg-blue-100 text-blue-700">Programado</Badge>
      case "IN_PROGRESS":
        return <Badge className="bg-green-100 text-green-700">En Curso</Badge>
      case "FINISHED":
        return <Badge className="bg-gray-100 text-gray-700">Finalizado</Badge>
      case "CANCELLED":
        return <Badge className="bg-red-100 text-red-700">Cancelado</Badge>
    }
  }

  const getResultBadge = (match: Match) => {
    if (!match.result) return null
    
    switch (match.result) {
      case "WIN":
        return <Badge className="bg-green-100 text-green-700">Victoria</Badge>
      case "DRAW":
        return <Badge className="bg-yellow-100 text-yellow-700">Empate</Badge>
      case "LOSS":
        return <Badge className="bg-red-100 text-red-700">Derrota</Badge>
    }
  }

  const getScore = (match: Match) => {
    if (match.sport === "FOOTBALL") {
      return match.goalsFor !== undefined && match.goalsAgainst !== undefined
        ? `${match.goalsFor} - ${match.goalsAgainst}`
        : null
    } else {
      return match.pointsFor !== undefined && match.pointsAgainst !== undefined
        ? `${match.pointsFor} - ${match.pointsAgainst}`
        : null
    }
  }

  if (!date) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {format(date, "d 'de' MMMM, yyyy", { locale: es })}
          </DialogTitle>
          <DialogDescription>
            {matches.length} partido(s) este día
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {matches.map((match) => (
            <Card
              key={match.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onMatchSelect(match.id)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">vs {match.opponent}</h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {format(new Date(match.date), "HH:mm")}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {match.location}
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    {getStatusBadge(match)}
                    {match.result && getResultBadge(match)}
                    {match.status === "FINISHED" && getScore(match) && (
                      <p className="font-mono text-xl font-bold">{getScore(match)}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
