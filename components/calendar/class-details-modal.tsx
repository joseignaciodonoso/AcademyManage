"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, MapPin, User, Calendar } from "lucide-react"
import { format } from "date-fns"

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

interface ClassDetailsModalProps {
  classSession: ClassSession | null
  isOpen: boolean
  onClose: () => void
  onBook?: (classId: string) => void
  onCancel?: (classId: string) => void
  userRole: "student" | "coach" | "admin"
  isEnrolled?: boolean
}

export function ClassDetailsModal({
  classSession,
  isOpen,
  onClose,
  onBook,
  onCancel,
  userRole,
  isEnrolled = false,
}: ClassDetailsModalProps) {
  if (!classSession) return null

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

  const canBook =
    userRole === "student" &&
    classSession.status === "scheduled" &&
    !isEnrolled &&
    classSession.enrolled < classSession.capacity

  const canCancel = userRole === "student" && classSession.status === "scheduled" && isEnrolled

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {classSession.title}
            <Badge className={getStatusColor(classSession.status)}>{classSession.status}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{format(classSession.startTime, "MMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {format(classSession.startTime, "HH:mm")} - {format(classSession.endTime, "HH:mm")}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{classSession.instructor}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{classSession.location}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {classSession.enrolled}/{classSession.capacity} enrolled
              </span>
            </div>
            <Badge variant="outline">{classSession.level}</Badge>
          </div>

          {classSession.description && (
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">{classSession.description}</p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            {canBook && (
              <Button onClick={() => onBook?.(classSession.id)} className="flex-1">
                Book Class
              </Button>
            )}
            {canCancel && (
              <Button variant="outline" onClick={() => onCancel?.(classSession.id)} className="flex-1">
                Cancel Booking
              </Button>
            )}
            {userRole === "admin" && (
              <Button variant="outline" className="flex-1 bg-transparent">
                Manage Class
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
