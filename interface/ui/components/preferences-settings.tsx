"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

interface Preferences {
  currency: string
  locale: string
  dateFormat: string
  timeZone: string
  defaultExpenseAccount: string
  defaultIncomeAccount: string
  defaultAssetAccount: string
  autoSuggestAccounts: boolean
  enableNotifications: boolean
  darkMode: boolean
  compactView: boolean
}

const currencies = [
  { value: "USD", label: "US Dollar (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "GBP", label: "British Pound (GBP)" },
  { value: "THB", label: "Thai Baht (THB)" },
  { value: "JPY", label: "Japanese Yen (JPY)" },
]

const locales = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "th-TH", label: "Thai (Thailand)" },
  { value: "ja-JP", label: "Japanese (Japan)" },
]

const dateFormats = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (US)" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (UK)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (ISO)" },
]

const timeZones = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
  { value: "Asia/Bangkok", label: "Indochina Time (ICT)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
]

const defaultAccounts = [
  "Assets:Bank:Checking",
  "Assets:Bank:Savings",
  "Assets:Cash",
  "Expenses:General",
  "Expenses:Office:Supplies",
  "Income:Consulting",
  "Income:Sales",
]

export function PreferencesSettings() {
  const [preferences, setPreferences] = useState<Preferences>({
    currency: "USD",
    locale: "en-US",
    dateFormat: "MM/DD/YYYY",
    timeZone: "America/New_York",
    defaultExpenseAccount: "Expenses:General",
    defaultIncomeAccount: "Income:Consulting",
    defaultAssetAccount: "Assets:Bank:Checking",
    autoSuggestAccounts: true,
    enableNotifications: true,
    darkMode: false,
    compactView: false,
  })

  const updatePreference = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setPreferences((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    // Save preferences
    console.log("Saving preferences:", preferences)
  }

  const handleReset = () => {
    // Reset to defaults
    setPreferences({
      currency: "USD",
      locale: "en-US",
      dateFormat: "MM/DD/YYYY",
      timeZone: "America/New_York",
      defaultExpenseAccount: "Expenses:General",
      defaultIncomeAccount: "Income:Consulting",
      defaultAssetAccount: "Assets:Bank:Checking",
      autoSuggestAccounts: true,
      enableNotifications: true,
      darkMode: false,
      compactView: false,
    })
  }

  return (
    <div className="space-y-6">
      {/* Regional Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Regional Settings</CardTitle>
          <p className="text-sm text-muted-foreground">Configure currency, locale, and formatting preferences</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="currency">Default Currency</Label>
              <Select value={preferences.currency} onValueChange={(value) => updatePreference("currency", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="locale">Language & Locale</Label>
              <Select value={preferences.locale} onValueChange={(value) => updatePreference("locale", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locales.map((locale) => (
                    <SelectItem key={locale.value} value={locale.value}>
                      {locale.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-format">Date Format</Label>
              <Select value={preferences.dateFormat} onValueChange={(value) => updatePreference("dateFormat", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateFormats.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Time Zone</Label>
              <Select value={preferences.timeZone} onValueChange={(value) => updatePreference("timeZone", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeZones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Default Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Default Accounts</CardTitle>
          <p className="text-sm text-muted-foreground">Set default accounts for quick entry creation</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="default-expense">Default Expense Account</Label>
              <Select
                value={preferences.defaultExpenseAccount}
                onValueChange={(value) => updatePreference("defaultExpenseAccount", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {defaultAccounts
                    .filter((account) => account.startsWith("Expenses:"))
                    .map((account) => (
                      <SelectItem key={account} value={account}>
                        {account}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-income">Default Income Account</Label>
              <Select
                value={preferences.defaultIncomeAccount}
                onValueChange={(value) => updatePreference("defaultIncomeAccount", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {defaultAccounts
                    .filter((account) => account.startsWith("Income:"))
                    .map((account) => (
                      <SelectItem key={account} value={account}>
                        {account}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-asset">Default Asset Account</Label>
              <Select
                value={preferences.defaultAssetAccount}
                onValueChange={(value) => updatePreference("defaultAssetAccount", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {defaultAccounts
                    .filter((account) => account.startsWith("Assets:"))
                    .map((account) => (
                      <SelectItem key={account} value={account}>
                        {account}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interface Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Interface Settings</CardTitle>
          <p className="text-sm text-muted-foreground">Customize your Ledger AI experience</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-suggest">Auto-suggest Accounts</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically suggest account mappings based on transaction descriptions
                </p>
              </div>
              <Switch
                id="auto-suggest"
                checked={preferences.autoSuggestAccounts}
                onCheckedChange={(checked) => updatePreference("autoSuggestAccounts", checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Enable Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications for important events and updates</p>
              </div>
              <Switch
                id="notifications"
                checked={preferences.enableNotifications}
                onCheckedChange={(checked) => updatePreference("enableNotifications", checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="compact-view">Compact View</Label>
                <p className="text-sm text-muted-foreground">Use a more compact layout to show more information</p>
              </div>
              <Switch
                id="compact-view"
                checked={preferences.compactView}
                onCheckedChange={(checked) => updatePreference("compactView", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handleReset}>
              Reset to Defaults
            </Button>
            <Button onClick={handleSave}>Save Preferences</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
