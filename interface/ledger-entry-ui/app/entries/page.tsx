import { AppShell } from "@/components/app-shell"
import { EntriesList } from "@/components/entries-list"

export default function EntriesPage() {
  return (
    <AppShell>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Entries</h1>
            <p className="text-muted-foreground">
              View, edit, and manage all your accounting entries. Filter by date, type, or account.
            </p>
          </div>
          <EntriesList />
        </div>
      </div>
    </AppShell>
  )
}
