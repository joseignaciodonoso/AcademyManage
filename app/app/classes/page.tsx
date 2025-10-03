"use client"

import { useState, useEffect } from "react"
import { CalendarView } from "@/components/calendar/calendar-view"
import { ClassDetailsModal } from "@/components/calendar/class-details-modal"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Users, Trophy } from "lucide-react"
import { useSession } from "next-auth/react"
import { Progress } from "@/components/ui/progress"

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

export default function StudentClassesPage() {
  const { data: session } = useSession()
  const [classes, setClasses] = useState<ClassSession[]>([])
  const [selectedClass, setSelectedClass] = useState<ClassSession | null>(null)
  const [enrolledClasses, setEnrolledClasses] = useState<string[]>([])

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
    setEnrolledClasses(["1"]) // Mock enrolled classes
  }, [])

  const handleBookClass = async (classId: string) => {
    // TODO: Implement API call to book class
    setEnrolledClasses((prev) => [...prev, classId])
  }

  const handleCancelBooking = async (classId: string) => {
    // TODO: Implement API call to cancel booking
    setEnrolledClasses((prev) => prev.filter((id) => id !== classId))
  }

  const upcomingClasses = classes
    .filter((cls) => enrolledClasses.includes(cls.id) && cls.startTime > new Date())
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

  const stats = [
    {
      title: "Classes This Week",
      value: upcomingClasses.length,
      icon: Calendar,
      description: "Enrolled",
    },
    {
      title: "Total Hours",
      value: "24h",
      icon: Clock,
      description: "This month",
    },
    {
      title: "Attendance Rate",
      value: "92%",
      icon: Users,
      description: "Last 30 days",
    },
    {
      title: "Current Level",
      value: "Intermediate",
      icon: Trophy,
      description: "Karate",
    },
  ]

  return (
    <div className="min-h-screen w-full bg-gray-900 text-white p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      <div className="absolute inset-0 gradient-bg opacity-20"></div>
      <div className="absolute top-10 -left-24 w-72 h-72 bg-blue-500 rounded-full mix-blend-lighten filter blur-xl opacity-30 animate-float"></div>
      <div className="absolute bottom-5 -right-20 w-80 h-80 bg-purple-600 rounded-full mix-blend-lighten filter blur-2xl opacity-40 animate-float animation-delay-3000"></div>
      
      <div className="relative z-10 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Mis Clases</h1>
          <p className="text-gray-400">Visualiza y gestiona tu horario de clases</p>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const gradientColors = [
            'from-blue-500 to-indigo-600',
            'from-green-500 to-emerald-600',
            'from-amber-500 to-orange-600',
            'from-purple-500 to-pink-600'
          ];
          const gradient = gradientColors[index % gradientColors.length];
          
          return (
            <Card key={stat.title} className="glass-effect rounded-2xl border-gray-700/50 overflow-hidden transition-all duration-300 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10">
              <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-br ${gradient} p-4`}>
                <CardTitle className="text-sm font-medium text-white/90">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-white/80" />
              </CardHeader>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <p className="text-xs text-gray-400 mt-1">{stat.description}</p>
                <Progress value={75} className="mt-4 h-2 bg-gray-700/50" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {upcomingClasses.length > 0 && (
        <Card className="glass-effect rounded-2xl border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white">Próximas Clases</CardTitle>
            <CardDescription className="text-gray-400">Tus clases programadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingClasses.slice(0, 3).map((cls) => (
                <div key={cls.id} className="flex items-center justify-between p-3 border border-gray-700/50 rounded-lg bg-gray-800/30 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600/20 rounded-lg">
                      <Calendar className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{cls.title}</h4>
                      <p className="text-sm text-gray-400">
                        {cls.startTime.toLocaleDateString()} at{" "}
                        {cls.startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="text-sm text-gray-500">
                        {cls.instructor} • {cls.location}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-600/20 text-green-400 border-green-600/30">{cls.level}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="glass-effect rounded-2xl border-gray-700/50">
        <CardHeader>
          <CardTitle className="text-white">Calendario de Clases</CardTitle>
          <CardDescription className="text-gray-400">Visualiza y reserva tus clases</CardDescription>
        </CardHeader>
        <CardContent>
          <CalendarView classes={classes} onClassClick={setSelectedClass} userRole="student" />
        </CardContent>
      </Card>

      <ClassDetailsModal
        classSession={selectedClass}
        isOpen={!!selectedClass}
        onClose={() => setSelectedClass(null)}
        onBook={handleBookClass}
        onCancel={handleCancelBooking}
        userRole="student"
        isEnrolled={selectedClass ? enrolledClasses.includes(selectedClass.id) : false}
      />
    </div>
  )
}
