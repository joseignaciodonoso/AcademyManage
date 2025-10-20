"use client"

// Tenantized wrapper that reuses the existing admin dashboard UI
// This keeps the same dashboard while enabling URLs like /:org/admin/dashboard

import DashboardPage from "../../../admin/dashboard/page"

export default function TenantAdminDashboardPage() {
  return <DashboardPage />
}
