import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Calendar, Clock, MapPin } from "lucide-react"
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

interface MatchCardProps {
  match: Match
  onSelect: () => void
  isPending?: boolean
  showResult?: boolean
}

export function MatchCard({ match, onSelect, isPending, showResult }: MatchCardProps) {
  const getScore = () => {
    if (match.sport === "FOOTBALL") {
      return match.goalsFor !== undefined && match.goalsAgainst !== undefined
        ? `${match.goalsFor} - ${match.goalsAgainst}`
        : "- - -"
    } else {
      return match.pointsFor !== undefined && match.pointsAgainst !== undefined
        ? `${match.pointsFor} - ${match.pointsAgainst}`
        : "- - -"
    }
  }

  const getResultBadge = () => {
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

  return (
    <Card 
      className={`cursor-pointer hover:shadow-lg transition-all duration-200 ${
        isPending ? 'border-orange-200 bg-orange-50/50' : 'border-l-4 border-l-primary/20'
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-xl">vs {match.opponent}</h3>
                {isPending && (
                  <Badge variant="outline" className="text-orange-600 border-orange-300 mt-1">
                    Requiere atención
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-muted-foreground ml-13">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(match.date), "EEEE, d 'de' MMMM, yyyy", { locale: es })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{format(new Date(match.date), "HH:mm")}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{match.location}</span>
              </div>
            </div>
          </div>
          
          <div className="text-right space-y-2">
            {showResult && match.status === "FINISHED" ? (
              <>
                <div className="font-mono text-2xl font-bold mb-2">
                  {getScore()}
                </div>
                {getResultBadge()}
              </>
            ) : (
              <Badge variant={match.homeAway === "HOME" ? "default" : "secondary"}>
                {match.homeAway === "HOME" ? "Local" : "Visita"}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
