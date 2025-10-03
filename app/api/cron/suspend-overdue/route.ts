import { type NextRequest, NextResponse } from "next/server"
import { suspendOverdueStudents } from "@/lib/jobs/suspend-overdue-students"

/**
 * Cron endpoint to suspend students with overdue payments
 * 
 * Usage:
 * 1. Set up a cron job to call this endpoint daily:
 *    curl -X POST https://your-domain.com/api/cron/suspend-overdue \
 *      -H "Authorization: Bearer YOUR_CRON_SECRET"
 * 
 * 2. Or use Vercel Cron Jobs (vercel.json):
 *    {
 *      "crons": [{
 *        "path": "/api/cron/suspend-overdue",
 *        "schedule": "0 2 * * *"
 *      }]
 *    }
 * 
 * 3. Set CRON_SECRET in your .env file for security
 */

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Run the job
    const result = await suspendOverdueStudents()

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Suspended ${result.suspendedCount} students`,
        suspendedCount: result.suspendedCount,
      })
    } else {
      return NextResponse.json(
        { success: false, error: "Job failed", details: result.error },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("[Cron] Error in suspend-overdue endpoint:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}

// Allow GET for testing (remove in production)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await suspendOverdueStudents()

  return NextResponse.json({
    success: result.success,
    message: result.success
      ? `Would suspend ${result.suspendedCount} students`
      : "Job failed",
    suspendedCount: result.suspendedCount,
  })
}
