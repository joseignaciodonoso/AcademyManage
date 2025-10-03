/**
 * Job to automatically suspend students with overdue payments (>7 days past due)
 * This should be run daily via a cron job or scheduled task
 */

import { prisma } from "@/lib/prisma"
import { addDays, isPast } from "date-fns"

export async function suspendOverdueStudents() {
  try {
    console.log("[Job] Starting suspend overdue students job...")

    // Find all active students with memberships
    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        status: "ACTIVE",
        memberships: {
          some: {
            status: "ACTIVE",
          },
        },
      },
      include: {
        memberships: {
          where: { status: "ACTIVE" },
          include: {
            plan: true,
            payments: {
              where: { status: "PAID" },
              orderBy: { paidAt: "desc" },
              take: 1,
            },
          },
        },
      },
    })

    let suspendedCount = 0
    const today = new Date()

    for (const student of students) {
      let userSuspended = false
      for (const membership of student.memberships) {
        if (userSuspended) break
        // Guard: if there is no next billing date, skip (cannot determine overdue)
        const nextBillingDate = membership.nextBillingDate
        if (!nextBillingDate) continue
        const gracePeriodEnd = addDays(nextBillingDate, 7)

        if (isPast(gracePeriodEnd)) {
          // Check if there's a recent successful payment after the due date
          const lastPayment = membership.payments[0]
          const hasRecentPayment =
            Boolean(lastPayment?.paidAt && lastPayment.paidAt > nextBillingDate)

          if (!hasRecentPayment) {
            // Suspend the student (user status), once
            await prisma.user.update({
              where: { id: student.id },
              data: { status: "SUSPENDED" },
            })
            userSuspended = true

            // Mark membership as past due
            await prisma.membership.update({
              where: { id: membership.id },
              data: { status: "PAST_DUE" },
            })

            console.log(
              `[Job] Suspended student ${student.name} (${student.email}) - Payment overdue by ${Math.floor(
                (today.getTime() - gracePeriodEnd.getTime()) / (1000 * 60 * 60 * 24)
              )} days`
            )

            suspendedCount++

            // TODO: Send notification email to student
            // await sendSuspensionEmail(student.email, student.name)
          }
        }
      }
    }

    console.log(`[Job] Suspended ${suspendedCount} students with overdue payments`)
    return { success: true, suspendedCount }
  } catch (error) {
    console.error("[Job] Error suspending overdue students:", error)
    return { success: false, error }
  }
}

// Optional: Function to send suspension notification email
// async function sendSuspensionEmail(email: string, name: string) {
//   // Implement email sending logic here
//   // e.g., using nodemailer, sendgrid, etc.
// }
