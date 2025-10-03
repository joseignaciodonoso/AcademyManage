import { prisma } from "@/lib/prisma"
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns"

export interface KPIMetrics {
  // Financial KPIs
  mrr: number // Monthly Recurring Revenue
  arpu: number // Average Revenue Per User
  churnRate: number // Monthly churn rate
  ltv: number // Customer Lifetime Value
  totalRevenue: number
  failedPayments: number
  recoveredPayments: number

  // Student KPIs
  activeStudents: number
  newStudents: number
  totalStudents: number
  studentsAtRisk: number // Low attendance

  // Operational KPIs
  averageAttendance: number
  classOccupancyRate: number
  popularClasses: Array<{ name: string; count: number }>
  branchPerformance: Array<{ branchName: string; students: number; revenue: number }>

  // Growth KPIs
  growthRate: number
  retentionRate: number
}

export class KPICalculator {
  private academyId: string

  constructor(academyId: string) {
    this.academyId = academyId
  }

  async calculateKPIs(month?: Date, branchId?: string): Promise<KPIMetrics> {
    const targetMonth = month || new Date()
    const startDate = startOfMonth(targetMonth)
    const endDate = endOfMonth(targetMonth)
    const previousMonth = subMonths(targetMonth, 1)
    const previousStartDate = startOfMonth(previousMonth)
    const previousEndDate = endOfMonth(previousMonth)

    const [financialMetrics, studentMetrics, operationalMetrics, growthMetrics] = await Promise.all([
      this.calculateFinancialKPIs(startDate, endDate, previousStartDate, previousEndDate),
      this.calculateStudentKPIs(startDate, endDate, previousStartDate, previousEndDate),
      this.calculateOperationalKPIs(startDate, endDate, branchId),
      this.calculateGrowthKPIs(startDate, endDate, previousStartDate, previousEndDate),
    ])

    return {
      ...financialMetrics,
      ...studentMetrics,
      ...operationalMetrics,
      ...growthMetrics,
    }
  }

  private async calculateFinancialKPIs(startDate: Date, endDate: Date, previousStartDate: Date, previousEndDate: Date) {
    // Get active memberships and their payments
    const activeMemberships = await prisma.membership.findMany({
      where: {
        academyId: this.academyId,
        status: "ACTIVE",
        startDate: { lte: endDate },
        OR: [{ endDate: null }, { endDate: { gte: startDate } }],
      },
      include: {
        plan: true,
        payments: {
          where: {
            createdAt: { gte: startDate, lte: endDate },
          },
        },
      },
    })

    // Calculate MRR (Monthly Recurring Revenue)
    const mrr = activeMemberships.reduce((total, membership) => {
      const monthlyPrice = membership.plan.type === "YEARLY" ? membership.plan.price / 12 : membership.plan.price
      return total + monthlyPrice
    }, 0)

    // Calculate total revenue for the period
    const totalRevenue = activeMemberships.reduce((total, membership) => {
      return (
        total +
        membership.payments.reduce((sum, payment) => {
          return payment.status === "PAID" ? sum + payment.amount : sum
        }, 0)
      )
    }, 0)

    // Calculate ARPU (Average Revenue Per User)
    const arpu = activeMemberships.length > 0 ? totalRevenue / activeMemberships.length : 0

    // Calculate failed and recovered payments
    const allPayments = await prisma.payment.findMany({
      where: {
        academyId: this.academyId,
        createdAt: { gte: startDate, lte: endDate },
      },
    })

    const failedPayments = allPayments.filter((p) => p.status === "FAILED").length
    const recoveredPayments = allPayments.filter((p) => p.status === "PAID" && p.createdAt > p.updatedAt).length

    // Calculate churn rate
    const previousActiveMemberships = await prisma.membership.count({
      where: {
        academyId: this.academyId,
        status: "ACTIVE",
        startDate: { lte: previousEndDate },
        OR: [{ endDate: null }, { endDate: { gte: previousStartDate } }],
      },
    })

    const canceledMemberships = await prisma.membership.count({
      where: {
        academyId: this.academyId,
        status: "CANCELED",
        updatedAt: { gte: startDate, lte: endDate },
      },
    })

    const churnRate = previousActiveMemberships > 0 ? (canceledMemberships / previousActiveMemberships) * 100 : 0

    // Calculate LTV (simplified: ARPU / churn rate)
    const ltv = churnRate > 0 ? (arpu * 12) / (churnRate / 100) : arpu * 24

    return {
      mrr,
      arpu,
      churnRate,
      ltv,
      totalRevenue,
      failedPayments,
      recoveredPayments,
    }
  }

  private async calculateStudentKPIs(startDate: Date, endDate: Date, previousStartDate: Date, previousEndDate: Date) {
    // Active students
    const activeStudents = await prisma.user.count({
      where: {
        academyId: this.academyId,
        role: "STUDENT",
        status: "ACTIVE",
        memberships: {
          some: {
            status: "ACTIVE",
            startDate: { lte: endDate },
            OR: [{ endDate: null }, { endDate: { gte: startDate } }],
          },
        },
      },
    })

    // New students this month
    const newStudents = await prisma.user.count({
      where: {
        academyId: this.academyId,
        role: "STUDENT",
        createdAt: { gte: startDate, lte: endDate },
      },
    })

    // Total students
    const totalStudents = await prisma.user.count({
      where: {
        academyId: this.academyId,
        role: "STUDENT",
      },
    })

    // Students at risk (low attendance in last 2 weeks)
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    const studentsWithLowAttendance = await prisma.user.findMany({
      where: {
        academyId: this.academyId,
        role: "STUDENT",
        status: "ACTIVE",
      },
      include: {
        attendances: {
          where: {
            createdAt: { gte: twoWeeksAgo },
            status: "PRESENT",
          },
        },
      },
    })

    const studentsAtRisk = studentsWithLowAttendance.filter((student) => student.attendances.length < 2).length

    return {
      activeStudents,
      newStudents,
      totalStudents,
      studentsAtRisk,
    }
  }

  private async calculateOperationalKPIs(startDate: Date, endDate: Date, branchId?: string) {
    // Average attendance rate
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        class: { academyId: this.academyId, ...(branchId ? { branchId } : {}) },
      },
    })

    const presentCount = attendanceRecords.filter((a) => a.status === "PRESENT").length
    const averageAttendance = attendanceRecords.length > 0 ? (presentCount / attendanceRecords.length) * 100 : 0

    // Class occupancy rate
    const classes = await prisma.class.findMany({
      where: {
        academyId: this.academyId,
        ...(branchId ? { branchId } : {}),
        startTime: { gte: startDate, lte: endDate },
      },
      include: {
        enrollments: true,
      },
    })

    const totalCapacity = classes.reduce((sum, cls) => sum + cls.maxCapacity, 0)
    const totalEnrollments = classes.reduce((sum, cls) => sum + cls.enrollments.length, 0)
    const classOccupancyRate = totalCapacity > 0 ? (totalEnrollments / totalCapacity) * 100 : 0

    // Popular classes
    const classPopularity = classes
      .map((cls) => ({
        name: cls.title,
        count: cls.enrollments.length,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Branch performance
    const branches = await prisma.branch.findMany({
      where: { academyId: this.academyId, ...(branchId ? { id: branchId } : {}) },
      include: {
        classes: {
          where: { startTime: { gte: startDate, lte: endDate } },
          include: { enrollments: true },
        },
        enrollments: {
          where: { createdAt: { gte: startDate, lte: endDate } },
          include: { user: { include: { memberships: { include: { plan: true } } } } },
        },
      },
    })

    const branchPerformance = branches.map((branch) => ({
      branchName: branch.name,
      students: new Set(branch.enrollments.map((e) => e.userId)).size,
      revenue: branch.enrollments.reduce((sum, enrollment) => {
        const activeMembership = enrollment.user.memberships.find((m) => m.status === "ACTIVE")
        return sum + (activeMembership?.plan.price || 0)
      }, 0),
    }))

    return {
      averageAttendance,
      classOccupancyRate,
      popularClasses: classPopularity,
      branchPerformance,
    }
  }

  private async calculateGrowthKPIs(startDate: Date, endDate: Date, previousStartDate: Date, previousEndDate: Date) {
    const currentMonthStudents = await prisma.user.count({
      where: {
        academyId: this.academyId,
        role: "STUDENT",
        status: "ACTIVE",
        createdAt: { lte: endDate },
      },
    })

    const previousMonthStudents = await prisma.user.count({
      where: {
        academyId: this.academyId,
        role: "STUDENT",
        status: "ACTIVE",
        createdAt: { lte: previousEndDate },
      },
    })

    const growthRate =
      previousMonthStudents > 0 ? ((currentMonthStudents - previousMonthStudents) / previousMonthStudents) * 100 : 0

    // Retention rate (students who were active last month and are still active)
    const retainedStudents = await prisma.user.count({
      where: {
        academyId: this.academyId,
        role: "STUDENT",
        status: "ACTIVE",
        createdAt: { lte: previousEndDate },
        memberships: {
          some: {
            status: "ACTIVE",
            startDate: { lte: endDate },
            OR: [{ endDate: null }, { endDate: { gte: startDate } }],
          },
        },
      },
    })

    const retentionRate = previousMonthStudents > 0 ? (retainedStudents / previousMonthStudents) * 100 : 0

    return {
      growthRate,
      retentionRate,
    }
  }

  async cacheKPIs(month: Date, metrics: KPIMetrics): Promise<void> {
    const period = format(month, "yyyy-MM")

    // Delete existing cache for this period
    await prisma.kpiCache.deleteMany({
      where: {
        academyId: this.academyId,
        period,
      },
    })

    // Create new cache entries (only numeric values)
    const cacheEntries = Object.entries(metrics)
      .filter(([_, value]) => typeof value === "number")
      .map(([metric, value]) => ({
        academyId: this.academyId,
        metric,
        value: value as number,
        period,
      }))

    if (cacheEntries.length > 0) {
      await prisma.kpiCache.createMany({
        data: cacheEntries,
      })
    }
  }

  async getCachedKPIs(month: Date): Promise<KPIMetrics | null> {
    const period = format(month, "yyyy-MM")

    const cachedMetrics = await prisma.kpiCache.findMany({
      where: {
        academyId: this.academyId,
        period,
      },
    })

    if (cachedMetrics.length === 0) return null

    // Reconstruct metrics from cache (only numeric values are cached)
    // Arrays and objects like branchPerformance and popularClasses are not cached
    const metrics = {} as any
    for (const cached of cachedMetrics) {
      metrics[cached.metric] = cached.value
    }

    // Set default empty arrays for non-cached complex fields
    metrics.popularClasses = []
    metrics.branchPerformance = []

    return metrics as KPIMetrics
  }
}

export function createKPICalculator(academyId: string): KPICalculator {
  return new KPICalculator(academyId)
}
