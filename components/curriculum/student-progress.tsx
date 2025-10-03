"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Circle, Play, FileText, Award, Clock } from "lucide-react"

interface ProgressItem {
  id: string
  title: string
  type: "lesson" | "technique" | "assessment" | "video"
  duration: number
  completed: boolean
  score?: number
  completedAt?: Date
  isRequired: boolean
}

interface LevelProgress {
  id: string
  name: string
  color: string
  items: ProgressItem[]
  completed: boolean
  completedAt?: Date
  certificate?: string
}

interface StudentProgressProps {
  discipline: string
  levels: LevelProgress[]
  currentLevel: string
  onStartItem: (itemId: string) => void
  onViewCertificate: (levelId: string) => void
}

export function StudentProgress({
  discipline,
  levels,
  currentLevel,
  onStartItem,
  onViewCertificate,
}: StudentProgressProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Play className="h-4 w-4" />
      case "assessment":
        return <Award className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "video":
        return "bg-red-100 text-red-800"
      case "assessment":
        return "bg-yellow-100 text-yellow-800"
      case "technique":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const calculateProgress = (items: ProgressItem[]) => {
    const completed = items.filter((item) => item.completed).length
    return items.length > 0 ? (completed / items.length) * 100 : 0
  }

  const getTotalDuration = (items: ProgressItem[]) => {
    return items.reduce((total, item) => total + item.duration, 0)
  }

  const getCompletedDuration = (items: ProgressItem[]) => {
    return items.filter((item) => item.completed).reduce((total, item) => total + item.duration, 0)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{discipline} Progress</h2>
        <p className="text-muted-foreground">Track your learning journey and achievements</p>
      </div>

      <div className="space-y-6">
        {levels.map((level) => {
          const progress = calculateProgress(level.items)
          const isCurrentLevel = level.id === currentLevel
          const isUnlocked =
            levels.findIndex((l) => l.id === level.id) <= levels.findIndex((l) => l.id === currentLevel)

          return (
            <Card key={level.id} className={isCurrentLevel ? "ring-2 ring-primary" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full`} style={{ backgroundColor: level.color }} />
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {level.name}
                        {isCurrentLevel && <Badge>Current</Badge>}
                        {level.completed && <Badge variant="secondary">Completed</Badge>}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>{level.items.length} items</span>
                        <span>{getTotalDuration(level.items)} min total</span>
                        {level.completed && level.completedAt && (
                          <span>Completed {level.completedAt.toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{Math.round(progress)}%</div>
                    {level.completed && level.certificate && (
                      <Button size="sm" variant="outline" onClick={() => onViewCertificate(level.id)}>
                        View Certificate
                      </Button>
                    )}
                  </div>
                </div>
                <Progress value={progress} className="mt-2" />
              </CardHeader>

              {isUnlocked && (
                <CardContent>
                  <div className="space-y-3">
                    {level.items.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          item.completed ? "bg-green-50 border-green-200" : "bg-background"
                        }`}
                      >
                        <div className="flex-shrink-0">
                          {item.completed ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {getTypeIcon(item.type)}
                          <Badge className={getTypeColor(item.type)}>{item.type}</Badge>
                        </div>

                        <div className="flex-1">
                          <h4 className="font-medium">{item.title}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {item.duration} min
                            </div>
                            {item.isRequired && <Badge variant="outline">Required</Badge>}
                            {item.completed && item.score && <span>Score: {item.score}%</span>}
                          </div>
                        </div>

                        <div>
                          {!item.completed ? (
                            <Button size="sm" onClick={() => onStartItem(item.id)}>
                              Start
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => onStartItem(item.id)}>
                              Review
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}

              {!isUnlocked && (
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Complete previous levels to unlock this content</p>
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
