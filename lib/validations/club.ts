import { z } from "zod"

// Enums
export const SportTypeSchema = z.enum(["FOOTBALL", "BASKETBALL"])

export const AttendanceStatusSchema = z.enum(["PRESENT", "ABSENT", "JUSTIFIED"])

export const CallupTypeSchema = z.enum(["STARTER", "SUBSTITUTE"])

export const MatchStatusSchema = z.enum(["SCHEDULED", "IN_PROGRESS", "FINISHED", "CANCELLED"])

export const MatchResultSchema = z.enum(["WIN", "DRAW", "LOSS"])

export const ExpenseCategorySchema = z.enum([
  "FIELD_RENTAL",
  "EQUIPMENT",
  "TRANSPORTATION",
  "BALLS",
  "REFEREES",
  "OTHER"
])

// Training Session
export const CreateTrainingSessionSchema = z.object({
  date: z.string().datetime(),
  duration: z.number().int().min(15).max(300), // 15 min to 5 hours
  location: z.string().optional(),
  notes: z.string().optional(),
})

export const MarkAttendanceSchema = z.object({
  playerId: z.string().cuid(),
  status: AttendanceStatusSchema,
  notes: z.string().optional(),
})

export const BulkAttendanceSchema = z.object({
  attendances: z.array(MarkAttendanceSchema),
})

// Match
export const CreateMatchSchema = z.object({
  sport: SportTypeSchema,
  date: z.string().datetime(),
  opponent: z.string().min(1).max(100),
  location: z.string().min(1).max(200),
  homeAway: z.enum(["HOME", "AWAY"]).optional(),
  notes: z.string().optional(),
})

export const UpdateMatchResultSchema = z.object({
  goalsFor: z.number().int().min(0).optional(),
  goalsAgainst: z.number().int().min(0).optional(),
  pointsFor: z.number().int().min(0).optional(),
  pointsAgainst: z.number().int().min(0).optional(),
  result: MatchResultSchema.optional(),
  status: MatchStatusSchema,
})

// Callup
export const CreateCallupSchema = z.object({
  formation: z.string().optional(), // e.g., "4-4-2"
  starters: z.array(z.string().cuid()).min(1),
  substitutes: z.array(z.string().cuid()),
}).refine(
  (data) => {
    // No duplicates between starters and substitutes
    const allPlayers = [...data.starters, ...data.substitutes]
    return new Set(allPlayers).size === allPlayers.length
  },
  { message: "A player cannot be both starter and substitute" }
)

// Match Stats
export const UpdateMatchStatsSchema = z.object({
  playerId: z.string().cuid(),
  // Football
  goals: z.number().int().min(0).optional(),
  assists: z.number().int().min(0).optional(),
  yellow: z.number().int().min(0).max(2).optional(), // Max 2 yellows
  red: z.number().int().min(0).max(1).optional(), // Max 1 red
  // Basketball
  points: z.number().int().min(0).optional(),
  rebounds: z.number().int().min(0).optional(),
  steals: z.number().int().min(0).optional(),
  blocks: z.number().int().min(0).optional(),
  fouls: z.number().int().min(0).max(6).optional(), // Max 6 fouls in basketball
  // Common
  minutes: z.number().int().min(0).max(120).optional(), // Max 120 minutes
})

export const BulkMatchStatsSchema = z.object({
  stats: z.array(UpdateMatchStatsSchema),
})

// Validation helper: ensure stats match sport type
export function validateStatsForSport(
  stats: z.infer<typeof UpdateMatchStatsSchema>,
  sport: "FOOTBALL" | "BASKETBALL"
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (sport === "FOOTBALL") {
    // Football: only goals, assists, yellow, red, minutes allowed
    if (stats.points !== undefined) errors.push("Points not allowed for football")
    if (stats.rebounds !== undefined) errors.push("Rebounds not allowed for football")
    if (stats.steals !== undefined) errors.push("Steals not allowed for football")
    if (stats.blocks !== undefined) errors.push("Blocks not allowed for football")
    if (stats.fouls !== undefined) errors.push("Fouls not allowed for football")
  } else if (sport === "BASKETBALL") {
    // Basketball: only points, rebounds, assists, steals, blocks, fouls, minutes allowed
    if (stats.goals !== undefined) errors.push("Goals not allowed for basketball")
    if (stats.yellow !== undefined) errors.push("Yellow cards not allowed for basketball")
    if (stats.red !== undefined) errors.push("Red cards not allowed for basketball")
  }
  
  return { valid: errors.length === 0, errors }
}

// Evaluation
export const CreateEvaluationSchema = z.object({
  playerId: z.string().cuid(),
  matchId: z.string().cuid().optional(),
  trainingId: z.string().cuid().optional(),
  technique: z.number().int().min(1).max(10),
  tactics: z.number().int().min(1).max(10),
  physical: z.number().int().min(1).max(10),
  attitude: z.number().int().min(1).max(10),
  strengths: z.string().max(500).optional(),
  improvements: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
}).refine(
  (data) => data.matchId || data.trainingId,
  { message: "Either matchId or trainingId must be provided" }
)

// Expense
export const CreateExpenseSchema = z.object({
  concept: z.string().min(1).max(200),
  category: ExpenseCategorySchema,
  amount: z.number().positive(),
  date: z.string().datetime(),
  receiptUrl: z.string().url().optional(),
  receiptName: z.string().optional(),
})

// Announcement
export const CreateAnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  audience: z.enum(["TEAM", "CATEGORY", "ALL"]),
  publishNow: z.boolean().optional().default(true),
})

// Player Goal
export const CreatePlayerGoalSchema = z.object({
  title: z.string().min(1).max(200),
  metric: z.string().optional(),
  target: z.number().positive().optional(),
  dueDate: z.string().datetime().optional(),
})

export const UpdatePlayerGoalSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  target: z.number().positive().optional(),
  dueDate: z.string().datetime().optional(),
  status: z.enum(["ACTIVE", "DONE", "FAILED"]).optional(),
  progress: z.number().min(0).max(100).optional(),
})

// Player Profile
export const CreatePlayerProfileSchema = z.object({
  position: z.string().min(1).max(50),
  shirtSize: z.enum(["XS", "S", "M", "L", "XL", "XXL"]),
  preferredNumber: z.number().int().min(0).max(99).optional(),
  isMinor: z.boolean().default(false),
  guardianId: z.string().cuid().optional(),
})

// Query params
export const MetricsQuerySchema = z.object({
  sport: SportTypeSchema.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  period: z.enum(["7d", "30d", "90d", "365d", "all"]).optional().default("30d"),
})
