"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Download, Upload, Key, Plus, Copy, Trash2, Eye, EyeOff, FileText, AlertTriangle } from "lucide-react"

interface APIKey {
  id: string
  name: string
  key: string
  created: string
  lastUsed: string
  permissions: string[]
}

interface AuditLogEntry {
  id: string
  action: string
  user: string
  timestamp: string
  details: string
}

const mockAPIKeys: APIKey[] = [
  {
    id: "1",
    name: "Production API",
    key: "lk_live_1234567890abcdef",
    created: "2024-01-15",
    lastUsed: "2 hours ago",
    permissions: ["read", "write"],
  },
  {
    id: "2",
    name: "Development API",
    key: "lk_test_abcdef1234567890",
    created: "2024-01-10",
    lastUsed: "1 week ago",
    permissions: ["read"],
  },
]

const mockAuditLog: AuditLogEntry[] = [
  {
    id: "1",
    action: "Entry Created",
    user: "john@acme.com",
    timestamp: "2024-01-20 14:30:00",
    details: "Created expense entry for $25.50",
  },
  {
    id: "2",
    action: "Data Exported",
    user: "jane@acme.com",
    timestamp: "2024-01-20 10:15:00",
    details: "Exported ledger data as CSV",
  },
  {
    id: "3",
    action: "Team Member Invited",
    user: "john@acme.com",
    timestamp: "2024-01-19 16:45:00",
    details: "Invited bob@acme.com as User",
  },
]

export function DataSettings() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>(mockAPIKeys)
  const [showCreateKeyDialog, setShowCreateKeyDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [importData, setImportData] = useState("")

  const handleCreateAPIKey = () => {
    if (newKeyName) {
      const newKey: APIKey = {
        id: Math.random().toString(36).substr(2, 9),
        name: newKeyName,
        key: `lk_live_${Math.random().toString(36).substr(2, 16)}`,
        created: new Date().toISOString().split("T")[0],
        lastUsed: "Never",
        permissions: ["read", "write"],
      }
      setApiKeys([...apiKeys, newKey])
      setNewKeyName("")
      setShowCreateKeyDialog(false)
    }
  }

  const handleDeleteAPIKey = (keyId: string) => {
    setApiKeys(apiKeys.filter((key) => key.id !== keyId))
  }

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys)
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId)
    } else {
      newVisible.add(keyId)
    }
    setVisibleKeys(newVisible)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleExportData = () => {
    // Simulate data export
    const blob = new Blob(["Mock ledger data..."], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "ledger-export.ledger"
    a.click()
    setShowExportDialog(false)
  }

  const handleImportData = () => {
    // Simulate data import
    console.log("Importing data:", importData)
    setImportData("")
    setShowImportDialog(false)
  }

  return (
    <div className="space-y-6">
      {/* Data Export/Import */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <p className="text-sm text-muted-foreground">Export your data or import from other systems</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <Download className="h-5 w-5 text-blue-600" />
              <div>
                <h4 className="font-medium">Export Ledger Data</h4>
                <p className="text-sm text-muted-foreground">Download all your accounting data in .ledger format</p>
              </div>
            </div>
            <Button onClick={() => setShowExportDialog(true)}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <Upload className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="font-medium">Import Ledger Data</h4>
                <p className="text-sm text-muted-foreground">Import accounting data from .ledger files</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setShowImportDialog(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>API Keys</CardTitle>
              <p className="text-sm text-muted-foreground">Manage API keys for integrations and automation</p>
            </div>
            <Button onClick={() => setShowCreateKeyDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create API Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((apiKey) => (
                <TableRow key={apiKey.id}>
                  <TableCell className="font-medium">{apiKey.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                        {visibleKeys.has(apiKey.id) ? apiKey.key : "•".repeat(20)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                      >
                        {visibleKeys.has(apiKey.id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(apiKey.key)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      {apiKey.permissions.map((permission) => (
                        <Badge key={permission} variant="secondary" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{apiKey.lastUsed}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteAPIKey(apiKey.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Audit Log */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
          <p className="text-sm text-muted-foreground">Track all actions performed in your workspace</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockAuditLog.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.action}</TableCell>
                  <TableCell className="font-mono text-sm">{entry.user}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{entry.timestamp}</TableCell>
                  <TableCell className="text-sm">{entry.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create API Key Dialog */}
      <Dialog open={showCreateKeyDialog} onOpenChange={setShowCreateKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>Create a new API key for integrations and automation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="key-name">Key Name</Label>
              <Input
                id="key-name"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g., Production API, Development API"
              />
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Keep your API key secure</p>
                  <p className="text-muted-foreground">
                    This key will have full access to your account. Store it securely and never share it publicly.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateKeyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAPIKey} disabled={!newKeyName}>
              <Key className="mr-2 h-4 w-4" />
              Create Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Ledger Data</DialogTitle>
            <DialogDescription>Download all your accounting data in standard .ledger format.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-start space-x-2">
                <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Export includes:</p>
                  <ul className="text-muted-foreground mt-1 space-y-1">
                    <li>• All accounting entries and transactions</li>
                    <li>• Account hierarchy and balances</li>
                    <li>• Metadata and descriptions</li>
                    <li>• Compatible with other ledger tools</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleExportData}>
              <Download className="mr-2 h-4 w-4" />
              Download Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Ledger Data</DialogTitle>
            <DialogDescription>Import accounting data from .ledger files or other formats.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="import-data">Ledger Data</Label>
              <Textarea
                id="import-data"
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="Paste your .ledger file content here..."
                rows={8}
                className="font-mono text-sm"
              />
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Import will merge with existing data</p>
                  <p className="text-muted-foreground">
                    Make sure to backup your current data before importing. Duplicate entries will be skipped.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleImportData} disabled={!importData.trim()}>
              <Upload className="mr-2 h-4 w-4" />
              Import Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
