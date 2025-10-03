"use client"

import { useState, useEffect } from "react"
import { StudentProgress } from "@/components/curriculum/student-progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Clock, Award, Target } from "lucide-react"

interface LevelProgress {
  id: string
  name: string
  color: string
  items: any[]
  completed: boolean
  completedAt?: Date
  certificate?: string
}

export default function StudentCurriculumPage() {
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("karate")
  const [levels, setLevels] = useState<LevelProgress[]>([])
  const [currentLevel, setCurrentLevel] = useState<string>("yellow")
  const [disciplines] = useState([
    { id: "karate", name: "Karate" },
    { id: "taekwondo", name: "Taekwondo" },
  ])

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockLevels: LevelProgress[] = [
      {
        id: "white",
        name: "White Belt",
        color: "#ffffff",
        completed: true,
        completedAt: new Date("2024-10-15"),
        certificate: "cert-white-123",
        items: [
          {
            id: "1",
            title: "Basic Stances",
            type: "lesson",
            duration: 45,
            completed: true,
            score: 95,
            completedAt: new Date("2024-10-10"),
            isRequired: true,
          },
          {
            id: "2",
            title: "Basic Punches",
            type: "technique",
            duration: 30,
            completed: true,
            score: 88,
            completedAt: new Date("2024-10-12"),
            isRequired: true,
          },
        ],
      },
      {
        id: "yellow",
        name: "Yellow Belt",
        color: "#fbbf24",
        completed: false,
        items: [
          {
            id: "3",
            title: "Kata Heian Shodan",
            type: "video",
            duration: 60,
            completed: true,
            score: 92,
            completedAt: new Date("2024-11-01"),
            isRequired: true,
          },
          {
            id: "4",
            title: "Yellow Belt Assessment",
            type: "assessment",
            duration: 90,
            completed: false,
            isRequired: true,
          },
        ],
      },
      {
        id: "orange",
        name: "Orange Belt",
        color: "#f97316",
        completed: false,
        items: [
          {
            id: "5",
            title: "Advanced Combinations",
            type: "lesson",
            duration: 45,
            completed: false,
            isRequired: true,
          },
        ],
      },
    ]
    setLevels(mockLevels)
  }, [selectedDiscipline])

  const handleStartItem = async (itemId: string) => {
    // TODO: Implement navigation to content item
    console.log("Starting item:", itemId)
  }

  const handleViewCertificate = async (levelId: string) => {
    // TODO: Implement certificate viewing
    console.log("Viewing certificate for level:", levelId)
  }

  const totalItems = levels.reduce((sum, level) => sum + level.items.length, 0)
  const completedItems = levels.reduce((sum, level) => sum + level.items.filter((item) => item.completed).length, 0)
  const totalDuration = levels.reduce(
    (sum, level) => sum + level.items.reduce((itemSum, item) => itemSum + item.duration, 0),
    0,
  )
  const completedDuration = levels.reduce(
    (sum, level) =>
      sum + level.items.filter((item) => item.completed).reduce((itemSum, item) => itemSum + item.duration, 0),
    0,
  )

  const stats = [
    {
      title: "Current Level",
      value: levels.find((l) => l.id === currentLevel)?.name || "N/A",
      icon: Award,
      description: "Active belt level",
    },
    {
      title: "Progress",
      value: `${completedItems}/${totalItems}`,
      icon: Target,
      description: "Items completed",
    },
    {
      title: "Study Time",
      value: `${Math.round(completedDuration / 60)}h`,
      icon: Clock,
      description: "Hours completed",
    },
    {
      title: "Certificates",
      value: levels.filter((l) => l.completed).length,
      icon: BookOpen,
      description: "Belts earned",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Curriculum</h1>
          <p className="text-muted-foreground">Track your progress and continue learning</p>
        </div>
        <Select value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select discipline" />
          </SelectTrigger>
          <SelectContent>
            {disciplines.map((discipline) => (
              <SelectItem key={discipline.id} value={discipline.id}>
                {discipline.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <StudentProgress
        discipline={disciplines.find((d) => d.id === selectedDiscipline)?.name || ""}
        levels={levels}
        currentLevel={currentLevel}
        onStartItem={handleStartItem}
        onViewCertificate={handleViewCertificate}
      />
    </div>
  )
}
