import { AppShell } from "@/components/app-shell"
import { ReportsView } from "@/components/reports-view"

export default function ReportsPage() {
  return (
    <AppShell>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Reports & Analytics</h1>
            <p className="text-muted-foreground">
              View financial reports, analyze trends, and export data for your accounting needs.
            </p>
          </div>
          <ReportsView />
        </div>
      </div>
    </AppShell>
  )
}
