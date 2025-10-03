"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, GripVertical, Play, FileText, Award } from "lucide-react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"

interface CurriculumItem {
  id: string
  title: string
  description: string
  type: "lesson" | "technique" | "assessment" | "video"
  duration: number
  prerequisites: string[]
  order: number
  content?: string
  videoUrl?: string
  isRequired: boolean
}

interface CurriculumLevel {
  id: string
  name: string
  description: string
  color: string
  order: number
  items: CurriculumItem[]
}

interface CurriculumBuilderProps {
  discipline: string
  levels: CurriculumLevel[]
  onSave: (levels: CurriculumLevel[]) => void
}

export function CurriculumBuilder({ discipline, levels: initialLevels, onSave }: CurriculumBuilderProps) {
  const [levels, setLevels] = useState<CurriculumLevel[]>(initialLevels)
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)
  const [showAddItem, setShowAddItem] = useState(false)
  const [editingItem, setEditingItem] = useState<CurriculumItem | null>(null)

  const [newItem, setNewItem] = useState<Partial<CurriculumItem>>({
    title: "",
    description: "",
    type: "lesson",
    duration: 30,
    prerequisites: [],
    isRequired: true,
  })

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const { source, destination } = result
    const levelId = source.droppableId

    setLevels((prevLevels) =>
      prevLevels.map((level) => {
        if (level.id === levelId) {
          const items = Array.from(level.items)
          const [reorderedItem] = items.splice(source.index, 1)
          items.splice(destination.index, 0, reorderedItem)

          return {
            ...level,
            items: items.map((item, index) => ({ ...item, order: index })),
          }
        }
        return level
      }),
    )
  }

  const addItem = () => {
    if (!selectedLevel || !newItem.title) return

    const item: CurriculumItem = {
      id: Date.now().toString(),
      title: newItem.title!,
      description: newItem.description || "",
      type: newItem.type as CurriculumItem["type"],
      duration: newItem.duration || 30,
      prerequisites: newItem.prerequisites || [],
      order: 0,
      content: newItem.content,
      videoUrl: newItem.videoUrl,
      isRequired: newItem.isRequired || true,
    }

    setLevels((prevLevels) =>
      prevLevels.map((level) => {
        if (level.id === selectedLevel) {
          return {
            ...level,
            items: [...level.items, { ...item, order: level.items.length }],
          }
        }
        return level
      }),
    )

    setNewItem({
      title: "",
      description: "",
      type: "lesson",
      duration: 30,
      prerequisites: [],
      isRequired: true,
    })
    setShowAddItem(false)
  }

  const deleteItem = (levelId: string, itemId: string) => {
    setLevels((prevLevels) =>
      prevLevels.map((level) => {
        if (level.id === levelId) {
          return {
            ...level,
            items: level.items.filter((item) => item.id !== itemId),
          }
        }
        return level
      }),
    )
  }

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{discipline} Curriculum</h2>
          <p className="text-muted-foreground">Build and organize your curriculum by belt levels</p>
        </div>
        <Button onClick={() => onSave(levels)}>Save Curriculum</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Level Selection */}
        <div className="space-y-4">
          <h3 className="font-semibold">Belt Levels</h3>
          {levels.map((level) => (
            <Card
              key={level.id}
              className={`cursor-pointer transition-colors ${selectedLevel === level.id ? "ring-2 ring-primary" : ""}`}
              onClick={() => setSelectedLevel(level.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full`} style={{ backgroundColor: level.color }} />
                  <CardTitle className="text-sm">{level.name}</CardTitle>
                </div>
                <p className="text-xs text-muted-foreground">{level.items.length} items</p>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Content Management */}
        <div className="lg:col-span-2">
          {selectedLevel ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{levels.find((l) => l.id === selectedLevel)?.name} Content</h3>
                <Button size="sm" onClick={() => setShowAddItem(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {showAddItem && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Add New Item</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={newItem.title}
                          onChange={(e) => setNewItem((prev) => ({ ...prev, title: e.target.value }))}
                          placeholder="Item title"
                        />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select
                          value={newItem.type}
                          onValueChange={(value) =>
                            setNewItem((prev) => ({ ...prev, type: value as CurriculumItem["type"] }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lesson">Lesson</SelectItem>
                            <SelectItem value="technique">Technique</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="assessment">Assessment</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={newItem.description}
                        onChange={(e) => setNewItem((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Item description"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Duration (minutes)</Label>
                        <Input
                          type="number"
                          value={newItem.duration}
                          onChange={(e) =>
                            setNewItem((prev) => ({ ...prev, duration: Number.parseInt(e.target.value) }))
                          }
                        />
                      </div>
                      <div>
                        <Label>Required</Label>
                        <Select
                          value={newItem.isRequired ? "true" : "false"}
                          onValueChange={(value) => setNewItem((prev) => ({ ...prev, isRequired: value === "true" }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Required</SelectItem>
                            <SelectItem value="false">Optional</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={addItem}>Add Item</Button>
                      <Button variant="outline" onClick={() => setShowAddItem(false)}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId={selectedLevel}>
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                      {levels
                        .find((l) => l.id === selectedLevel)
                        ?.items.sort((a, b) => a.order - b.order)
                        .map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="hover:shadow-md transition-shadow"
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-3">
                                    <div {...provided.dragHandleProps}>
                                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {getTypeIcon(item.type)}
                                      <Badge className={getTypeColor(item.type)}>{item.type}</Badge>
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-medium">{item.title}</h4>
                                      <p className="text-sm text-muted-foreground">{item.description}</p>
                                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                        <span>{item.duration} min</span>
                                        {item.isRequired && <Badge variant="outline">Required</Badge>}
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button size="sm" variant="ghost" onClick={() => setEditingItem(item)}>
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => deleteItem(selectedLevel, item.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Select a belt level to manage its content</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
