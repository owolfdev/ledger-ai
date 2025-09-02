import { AppShell } from "@/components/app-shell"
import { SettingsView } from "@/components/settings-view"

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
            <p className="text-muted-foreground">
              Manage your team, billing, data, and preferences for your Ledger AI workspace.
            </p>
          </div>
          <SettingsView />
        </div>
      </div>
    </AppShell>
  )
}
