"use client"

import { useState, useEffect } from "react"
import { CalendarView } from "@/components/calendar/calendar-view"
import { ClassDetailsModal } from "@/components/calendar/class-details-modal"
import { ScheduleClassForm } from "@/components/calendar/schedule-class-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Users, Calendar, Clock } from "lucide-react"
import { useSession } from "next-auth/react"

interface ClassSession {
  id: string
  title: string
  startTime: Date
  endTime: Date
  instructor: string
  capacity: number
  enrolled: number
  location: string
  level: string
  status: "scheduled" | "cancelled" | "completed"
  description?: string
}

export default function AdminClassesPage() {
  const { data: session } = useSession()
  const [classes, setClasses] = useState<ClassSession[]>([])
  const [selectedClass, setSelectedClass] = useState<ClassSession | null>(null)
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [instructors, setInstructors] = useState([])
  const [locations, setLocations] = useState([])

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockClasses: ClassSession[] = [
      {
        id: "1",
        title: "Beginner Karate",
        startTime: new Date(2024, 11, 15, 10, 0),
        endTime: new Date(2024, 11, 15, 11, 0),
        instructor: "John Smith",
        capacity: 20,
        enrolled: 15,
        location: "Main Dojo",
        level: "beginner",
        status: "scheduled",
        description: "Introduction to basic karate techniques and forms.",
      },
      {
        id: "2",
        title: "Advanced Sparring",
        startTime: new Date(2024, 11, 16, 18, 0),
        endTime: new Date(2024, 11, 16, 19, 30),
        instructor: "Sarah Johnson",
        capacity: 12,
        enrolled: 10,
        location: "Training Room A",
        level: "advanced",
        status: "scheduled",
        description: "Advanced sparring techniques and competition preparation.",
      },
    ]
    setClasses(mockClasses)

    // Mock instructors and locations
    setInstructors([
      { id: "1", name: "John Smith" },
      { id: "2", name: "Sarah Johnson" },
      { id: "3", name: "Mike Chen" },
    ])

    setLocations([
      { id: "1", name: "Main Dojo" },
      { id: "2", name: "Training Room A" },
      { id: "3", name: "Training Room B" },
    ])
  }, [])

  const handleScheduleClass = async (classData: any) => {
    // TODO: Implement API call to schedule class
    console.log("Scheduling class:", classData)
  }

  const stats = [
    {
      title: "Total Classes",
      value: classes.length,
      icon: Calendar,
      description: "This month",
    },
    {
      title: "Total Students",
      value: classes.reduce((sum, cls) => sum + cls.enrolled, 0),
      icon: Users,
      description: "Enrolled",
    },
    {
      title: "Avg. Attendance",
      value: "85%",
      icon: Clock,
      description: "This month",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Class Management</h1>
          <p className="text-muted-foreground">Schedule and manage classes</p>
        </div>
        <Button onClick={() => setShowScheduleForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Class
        </Button>
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

      <CalendarView classes={classes} onClassClick={setSelectedClass} userRole="admin" />

      <ClassDetailsModal
        classSession={selectedClass}
        isOpen={!!selectedClass}
        onClose={() => setSelectedClass(null)}
        userRole="admin"
      />

      <ScheduleClassForm
        isOpen={showScheduleForm}
        onClose={() => setShowScheduleForm(false)}
        onSubmit={handleScheduleClass}
        instructors={instructors}
        locations={locations}
      />
    </div>
  )
}
