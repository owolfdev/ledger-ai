"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TeamSettings } from "@/components/team-settings"
import { BillingSettings } from "@/components/billing-settings"
import { DataSettings } from "@/components/data-settings"
import { PreferencesSettings } from "@/components/preferences-settings"
import { Users, CreditCard, Database, Settings } from "lucide-react"

export function SettingsView() {
  return (
    <Tabs defaultValue="team" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="team" className="flex items-center space-x-2">
          <Users className="h-4 w-4" />
          <span>Team</span>
        </TabsTrigger>
        <TabsTrigger value="billing" className="flex items-center space-x-2">
          <CreditCard className="h-4 w-4" />
          <span>Billing</span>
        </TabsTrigger>
        <TabsTrigger value="data" className="flex items-center space-x-2">
          <Database className="h-4 w-4" />
          <span>Data</span>
        </TabsTrigger>
        <TabsTrigger value="preferences" className="flex items-center space-x-2">
          <Settings className="h-4 w-4" />
          <span>Preferences</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="team" className="mt-6">
        <TeamSettings />
      </TabsContent>

      <TabsContent value="billing" className="mt-6">
        <BillingSettings />
      </TabsContent>

      <TabsContent value="data" className="mt-6">
        <DataSettings />
      </TabsContent>

      <TabsContent value="preferences" className="mt-6">
        <PreferencesSettings />
      </TabsContent>
    </Tabs>
  )
}
