// Club Deportivo Types

export type SportType = "FOOTBALL" | "BASKETBALL"

export type AttendanceStatus = "PRESENT" | "ABSENT" | "JUSTIFIED"

export type CallupType = "STARTER" | "SUBSTITUTE"

export type MatchStatus = "SCHEDULED" | "IN_PROGRESS" | "FINISHED" | "CANCELLED"

export type MatchResult = "WIN" | "DRAW" | "LOSS"

export type ExpenseCategory = 
  | "FIELD_RENTAL" 
  | "EQUIPMENT" 
  | "TRANSPORTATION" 
  | "BALLS" 
  | "REFEREES" 
  | "OTHER"

// Player Profile
export interface PlayerProfile {
  id: string
  userId: string
  position: string
  shirtSize: string
  preferredNumber?: number
  isMinor: boolean
  guardianId?: string
  totalGoals: number
  totalAssists: number
  totalPoints: number
  totalRebounds: number
  totalSteals: number
  totalBlocks: number
  yellowCards: number
  redCards: number
  fouls: number
  matchesPlayed: number
  minutesPlayed: number
}

// Training Session
export interface TrainingSession {
  id: string
  academyId: string
  date: Date
  duration: number
  location?: string
  notes?: string
}

export interface TrainingAttendance {
  id: string
  sessionId: string
  playerId: string
  status: AttendanceStatus
  checkedInAt?: Date
  notes?: string
}

// Match
export interface Match {
  id: string
  academyId: string
  sport: SportType
  date: Date
  opponent: string
  location: string
  homeAway?: "HOME" | "AWAY"
  goalsFor?: number
  goalsAgainst?: number
  pointsFor?: number
  pointsAgainst?: number
  result?: MatchResult
  status: MatchStatus
  notes?: string
}

// Match Stats
export interface MatchPlayerStat {
  id: string
  matchId: string
  playerId: string
  // Football
  goals: number
  assists: number
  yellow: number
  red: number
  // Basketball
  points: number
  rebounds: number
  steals: number
  blocks: number
  fouls: number
  // Common
  minutes: number
}

// Callup
export interface MatchCallup {
  id: string
  matchId: string
  formation?: string
  publishedAt?: Date
}

export interface MatchCallupPlayer {
  id: string
  callupId: string
  playerId: string
  type: CallupType
  confirmed: boolean
}

// Evaluation
export interface PlayerEvaluation {
  id: string
  playerId: string
  coachId: string
  matchId?: string
  trainingId?: string
  technique: number
  tactics: number
  physical: number
  attitude: number
  strengths?: string
  improvements?: string
  notes?: string
  createdAt: Date
}

// API Payloads
export interface CreateTrainingSessionPayload {
  date: string // ISO date
  duration: number
  location?: string
  notes?: string
}

export interface MarkAttendancePayload {
  playerId: string
  status: AttendanceStatus
  notes?: string
}

export interface CreateMatchPayload {
  sport: SportType
  date: string // ISO date
  opponent: string
  location: string
  homeAway?: "HOME" | "AWAY"
  notes?: string
}

export interface UpdateMatchResultPayload {
  goalsFor?: number
  goalsAgainst?: number
  pointsFor?: number
  pointsAgainst?: number
  result?: MatchResult
  status: MatchStatus
}

export interface CreateCallupPayload {
  formation?: string
  starters: string[] // playerIds
  substitutes: string[] // playerIds
}

export interface UpdateMatchStatsPayload {
  playerId: string
  // Football stats
  goals?: number
  assists?: number
  yellow?: number
  red?: number
  // Basketball stats
  points?: number
  rebounds?: number
  steals?: number
  blocks?: number
  fouls?: number
  // Common
  minutes?: number
}

export interface CreateEvaluationPayload {
  playerId: string
  matchId?: string
  trainingId?: string
  technique: number // 1-10
  tactics: number // 1-10
  physical: number // 1-10
  attitude: number // 1-10
  strengths?: string
  improvements?: string
  notes?: string
}

// Team Metrics Response
export interface TeamMetrics {
  sport: SportType
  period: string
  
  // Record
  matchesPlayed: number
  wins: number
  draws?: number // Only football
  losses: number
  winRate: number
  
  // Offensive
  totalGoalsFor?: number // Football
  totalPointsFor?: number // Basketball
  avgGoalsPerMatch?: number
  avgPointsPerMatch?: number
  
  // Defensive
  totalGoalsAgainst?: number
  totalPointsAgainst?: number
  avgGoalsAgainstPerMatch?: number
  avgPointsAgainstPerMatch?: number
  
  // Differential
  goalDifferential?: number
  pointDifferential?: number
  
  // Discipline (Football)
  totalYellowCards?: number
  totalRedCards?: number
  
  // Attendance
  avgTrainingAttendance: number
  
  // Top performers
  topScorers: PlayerRanking[]
  topAssists: PlayerRanking[]
  topRebounds?: PlayerRanking[] // Basketball
  topSteals?: PlayerRanking[] // Basketball
  topBlocks?: PlayerRanking[] // Basketball
  
  // Recent form (last 5 matches)
  recentMatches: MatchSummary[]
}

export interface PlayerRanking {
  playerId: string
  playerName: string
  value: number
  matchesPlayed: number
  perMatch: number
}

export interface MatchSummary {
  id: string
  date: Date
  opponent: string
  result: MatchResult
  scoreFor: number
  scoreAgainst: number
}

// Player Metrics Response
export interface PlayerMetrics {
  playerId: string
  playerName: string
  sport: SportType
  
  // Participation
  matchesPlayed: number
  minutesPlayed: number
  avgMinutesPerMatch: number
  
  // Football stats
  totalGoals?: number
  totalAssists?: number
  goalsPerMatch?: number
  assistsPerMatch?: number
  goalsPer90?: number
  assistsPer90?: number
  yellowCards?: number
  redCards?: number
  
  // Basketball stats
  totalPoints?: number
  totalRebounds?: number
  totalSteals?: number
  totalBlocks?: number
  pointsPerGame?: number
  reboundsPerGame?: number
  assistsPerGame?: number
  pointsPer36?: number
  reboundsPer36?: number
  assistsPer36?: number
  fouls?: number
  
  // Attendance
  trainingAttendanceRate: number
  matchAttendanceRate: number
  
  // Evaluations
  avgTechnique?: number
  avgTactics?: number
  avgPhysical?: number
  avgAttitude?: number
  avgOverall?: number
  
  // Recent form (last 5 matches)
  recentStats: PlayerMatchStat[]
}

export interface PlayerMatchStat {
  matchId: string
  date: Date
  opponent: string
  goals?: number
  assists?: number
  points?: number
  rebounds?: number
  minutes: number
}

// Expense
export interface ClubExpense {
  id: string
  academyId: string
  concept: string
  category: ExpenseCategory
  amount: number
  currency: string
  date: Date
  receiptUrl?: string
  receiptName?: string
  createdBy: string
  createdAt: Date
}

export interface CreateExpensePayload {
  concept: string
  category: ExpenseCategory
  amount: number
  date: string // ISO date
  receiptUrl?: string
  receiptName?: string
}

// Announcement
export interface Announcement {
  id: string
  academyId: string
  title: string
  body: string
  audience: "TEAM" | "CATEGORY" | "ALL"
  publishedAt?: Date
  createdBy: string
  createdAt: Date
}

export interface CreateAnnouncementPayload {
  title: string
  body: string
  audience: "TEAM" | "CATEGORY" | "ALL"
  publishNow?: boolean
}

// Player Goal
export interface PlayerGoal {
  id: string
  userId: string
  title: string
  metric?: string
  target?: number
  dueDate?: Date
  status: "ACTIVE" | "DONE" | "FAILED"
  progress: number
}

export interface CreatePlayerGoalPayload {
  title: string
  metric?: string
  target?: number
  dueDate?: string // ISO date
}
