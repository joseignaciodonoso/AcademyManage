"use client"

import { useState, useEffect } from "react"
import { CurriculumBuilder } from "@/components/curriculum/curriculum-builder"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, BookOpen, Users, Award } from "lucide-react"

interface CurriculumLevel {
  id: string
  name: string
  description: string
  color: string
  order: number
  items: any[]
}

export default function AdminCurriculumPage() {
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("karate")
  const [levels, setLevels] = useState<CurriculumLevel[]>([])
  const [disciplines] = useState([
    { id: "karate", name: "Karate" },
    { id: "taekwondo", name: "Taekwondo" },
    { id: "jujitsu", name: "Jiu-Jitsu" },
    { id: "muay-thai", name: "Muay Thai" },
  ])

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockLevels: CurriculumLevel[] = [
      {
        id: "white",
        name: "White Belt",
        description: "Foundation level for beginners",
        color: "#ffffff",
        order: 0,
        items: [
          {
            id: "1",
            title: "Basic Stances",
            description: "Learn fundamental karate stances",
            type: "lesson",
            duration: 45,
            prerequisites: [],
            order: 0,
            isRequired: true,
          },
          {
            id: "2",
            title: "Basic Punches",
            description: "Introduction to basic punching techniques",
            type: "technique",
            duration: 30,
            prerequisites: ["1"],
            order: 1,
            isRequired: true,
          },
        ],
      },
      {
        id: "yellow",
        name: "Yellow Belt",
        description: "First advancement level",
        color: "#fbbf24",
        order: 1,
        items: [
          {
            id: "3",
            title: "Kata Heian Shodan",
            description: "Learn the first kata form",
            type: "video",
            duration: 60,
            prerequisites: ["1", "2"],
            order: 0,
            isRequired: true,
          },
        ],
      },
      {
        id: "orange",
        name: "Orange Belt",
        description: "Intermediate beginner level",
        color: "#f97316",
        order: 2,
        items: [],
      },
    ]
    setLevels(mockLevels)
  }, [selectedDiscipline])

  const handleSaveCurriculum = async (updatedLevels: CurriculumLevel[]) => {
    // TODO: Implement API call to save curriculum
    console.log("Saving curriculum:", updatedLevels)
    setLevels(updatedLevels)
  }

  const stats = [
    {
      title: "Total Disciplines",
      value: disciplines.length,
      icon: BookOpen,
      description: "Active curricula",
    },
    {
      title: "Belt Levels",
      value: levels.length,
      icon: Award,
      description: "In current discipline",
    },
    {
      title: "Total Content",
      value: levels.reduce((sum, level) => sum + level.items.length, 0),
      icon: Users,
      description: "Lessons & assessments",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Curriculum Management</h1>
          <p className="text-muted-foreground">Create and manage learning paths for your martial arts programs</p>
        </div>
        <div className="flex gap-2">
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
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Discipline
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      <CurriculumBuilder
        discipline={disciplines.find((d) => d.id === selectedDiscipline)?.name || ""}
        levels={levels}
        onSave={handleSaveCurriculum}
      />
    </div>
  )
}
