import { AppShell } from "@/components/app-shell"
import { SmartTerminal } from "@/components/smart-terminal"

export default function HomePage() {
  return (
    <AppShell>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Smart Terminal</h1>
            <p className="text-muted-foreground">
              Enter accounting commands or describe transactions in natural language. AI will help you create accurate
              entries.
            </p>
          </div>
          <SmartTerminal />
        </div>
      </div>
    </AppShell>
  )
}
