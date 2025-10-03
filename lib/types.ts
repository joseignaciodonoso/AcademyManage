// Standalone enum definitions that work independently of Prisma
export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ACADEMY_ADMIN = "ACADEMY_ADMIN",
  COACH = "COACH",
  ASSISTANT_COACH = "ASSISTANT_COACH",
  STUDENT = "STUDENT",
  FINANCE = "FINANCE",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

export enum PlanType {
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  ANNUAL = "ANNUAL",
}

export enum PlanStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export enum MembershipStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
  CANCELLED = "CANCELLED",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export enum PaymentType {
  SUBSCRIPTION = "SUBSCRIPTION",
  ONE_TIME = "ONE_TIME",
}

export enum ContentType {
  VIDEO = "VIDEO",
  DOCUMENT = "DOCUMENT",
  IMAGE = "IMAGE",
  QUIZ = "QUIZ",
}

export enum ContentVisibility {
  PUBLIC = "PUBLIC",
  MEMBERS_ONLY = "MEMBERS_ONLY",
  LEVEL_RESTRICTED = "LEVEL_RESTRICTED",
}

export enum ClassStatus {
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum EnrollmentStatus {
  ENROLLED = "ENROLLED",
  WAITLISTED = "WAITLISTED",
  CANCELLED = "CANCELLED",
}

export enum AttendanceStatus {
  PRESENT = "PRESENT",
  ABSENT = "ABSENT",
  LATE = "LATE",
  EXCUSED = "EXCUSED",
}

export enum AuditAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
}

// Basic type definitions for when Prisma types aren't available
export type Academy = {
  id: string
  name: string
  slug: string
  description?: string
  logo?: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  createdAt: Date
  updatedAt: Date
}

export type User = {
  id: string
  email: string
  name: string
  role: UserRole
  status: UserStatus
  academyId?: string
  createdAt: Date
  updatedAt: Date
}

export type Plan = {
  id: string
  name: string
  description?: string
  price: number
  type: PlanType
  status: PlanStatus
  academyId: string
  createdAt: Date
  updatedAt: Date
}

// Additional basic types can be added as needed
export type Branch = any
export type Membership = any
export type Payment = any
export type Curriculum = any
export type Module = any
export type Unit = any
export type Technique = any
export type Content = any
export type Class = any
export type Enrollment = any
export type Attendance = any
export type Assessment = any
export type KpiCache = any
export type AuditLog = any
