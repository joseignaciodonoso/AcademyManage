"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns"

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
}

interface CalendarViewProps {
  classes: ClassSession[]
  onClassClick?: (classSession: ClassSession) => void
  onDateClick?: (date: Date) => void
  userRole: "student" | "coach" | "admin"
}

export function CalendarView({ classes, onClassClick, onDateClick, userRole }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"month" | "week">("month")

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getClassesForDate = (date: Date) => {
    return classes.filter((cls) => isSameDay(cls.startTime, date))
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(direction === "prev" ? subMonths(currentDate, 1) : addMonths(currentDate, 1))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">{format(currentDate, "MMMM yyyy")}</CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border">
              <Button variant={view === "month" ? "default" : "ghost"} size="sm" onClick={() => setView("month")}>
                Month
              </Button>
              <Button variant={view === "week" ? "default" : "ghost"} size="sm" onClick={() => setView("week")}>
                Week
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="p-2 text-center font-medium text-sm text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const dayClasses = getClassesForDate(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isToday = isSameDay(day, new Date())

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[120px] p-1 border rounded-lg cursor-pointer hover:bg-muted/50 ${
                  !isCurrentMonth ? "opacity-50" : ""
                } ${isToday ? "bg-primary/5 border-primary" : ""}`}
                onClick={() => onDateClick?.(day)}
              >
                <div className={`text-sm font-medium mb-1 ${isToday ? "text-primary" : ""}`}>{format(day, "d")}</div>
                <div className="space-y-1">
                  {dayClasses.slice(0, 3).map((cls) => (
                    <div
                      key={cls.id}
                      className="text-xs p-1 rounded bg-primary/10 text-primary cursor-pointer hover:bg-primary/20"
                      onClick={(e) => {
                        e.stopPropagation()
                        onClassClick?.(cls)
                      }}
                    >
                      <div className="font-medium truncate">{cls.title}</div>
                      <div className="flex items-center gap-1 text-xs opacity-75">
                        <Clock className="h-3 w-3" />
                        {format(cls.startTime, "HH:mm")}
                      </div>
                    </div>
                  ))}
                  {dayClasses.length > 3 && (
                    <div className="text-xs text-muted-foreground">+{dayClasses.length - 3} more</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
