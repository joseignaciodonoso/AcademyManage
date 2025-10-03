"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { KPIMetrics } from "@/lib/kpis/calculator"

interface PopularClassesProps {
  popularClasses: KPIMetrics["popularClasses"]
}

export function PopularClasses({ popularClasses }: PopularClassesProps) {
  const maxCount = Math.max(...popularClasses.map((c) => c.count))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clases Más Populares</CardTitle>
        <CardDescription>Top 5 clases con mayor inscripción</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {popularClasses.map((classItem, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                  {index + 1}
                </Badge>
                <div className="flex-1">
                  <p className="font-medium">{classItem.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={maxCount > 0 ? (classItem.count / maxCount) * 100 : 0} className="h-2 flex-1" />
                    <span className="text-sm text-muted-foreground min-w-0">{classItem.count} inscritos</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
