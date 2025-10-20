"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar as UiCalendar } from "@/components/ui/calendar"
import { 
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  User
} from "lucide-react"
import { format, startOfMonth, endOfMonth, isSameDay, addMonths, subMonths } from "date-fns"
import { es } from "date-fns/locale"

interface ClassData {
  id: string
  title: string
  startTime: Date
  endTime: Date
  level: string
  discipline: string
  maxCapacity: number | null
  branch: { name: string } | null
  coach: { name: string } | null
}

interface StudentCalendarViewProps {
  classes: ClassData[]
}

export function StudentCalendarView({ classes }: StudentCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  // Get classes grouped by date
  const classesByDate = useMemo(() => {
    const grouped: Record<string, ClassData[]> = {}
    classes.forEach(cls => {
      const dateKey = format(cls.startTime, 'yyyy-MM-dd')
      if (!grouped[dateKey]) grouped[dateKey] = []
      grouped[dateKey].push(cls)
    })
    return grouped
  }, [classes])

  // Get classes for selected date
  const selectedDateClasses = useMemo(() => {
    if (!selectedDate) return []
    const dateKey = format(selectedDate, 'yyyy-MM-dd')
    return (classesByDate[dateKey] || []).sort((a, b) => 
      a.startTime.getTime() - b.startTime.getTime()
    )
  }, [selectedDate, classesByDate])

  // Dates that have classes
  const datesWithClasses = useMemo(() => {
    return classes.map(cls => cls.startTime)
  }, [classes])

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar View */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            Selecciona un día para ver las clases programadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UiCalendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            locale={es}
            modifiers={{
              hasClasses: datesWithClasses
            }}
            modifiersClassNames={{
              hasClasses: "bg-primary/10 font-bold"
            }}
            className="rounded-md border"
          />
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-primary/10 border border-primary/30" />
              <span>Días con clases</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Classes for Selected Date */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {selectedDate ? format(selectedDate, "EEEE dd 'de' MMMM", { locale: es }) : "Selecciona una fecha"}
          </CardTitle>
          <CardDescription>
            {selectedDateClasses.length} {selectedDateClasses.length === 1 ? "clase programada" : "clases programadas"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedDateClasses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay clases programadas para este día</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDateClasses.map((cls) => (
                <Card key={cls.id} className="border-2">
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h4 className="font-semibold">{cls.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {cls.level}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {cls.discipline}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {format(cls.startTime, 'HH:mm')} - {format(cls.endTime, 'HH:mm')}
                        </span>
                      </div>

                      {cls.coach && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>{cls.coach.name}</span>
                        </div>
                      )}

                      {cls.branch && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{cls.branch.name}</span>
                        </div>
                      )}

                      {cls.maxCapacity && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>Capacidad: {cls.maxCapacity} personas</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
