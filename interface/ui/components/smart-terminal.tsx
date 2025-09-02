"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { CommandPalette } from "@/components/command-palette"
import { EntryPreview } from "@/components/entry-preview"
import { Terminal, ArrowUp, ArrowDown, Check, Sparkles, Copy, RotateCcw, Eye, Zap } from "lucide-react"

interface CommandHistory {
  command: string
  timestamp: Date
  result?: "success" | "error"
  suggestion?: string
  parsedEntry?: any
}

interface AIMapping {
  original: string
  suggested: string
  confidence: number
}

const sampleCommands = [
  "ex -i coffee 100 -v Starbucks",
  'in -i consultancy 5000 -c "Acme Corp"',
  "as -i laptop 2000 -p credit-card",
  "li -i credit-card 500 -p bank",
  "tr -f checking -t savings 1000",
]

const learnedMappings: AIMapping[] = [
  { original: "starbucks", suggested: "Expenses:Meals:Coffee", confidence: 95 },
  { original: "uber", suggested: "Expenses:Travel:Rideshare", confidence: 90 },
  { original: "aws", suggested: "Expenses:Technology:CloudServices", confidence: 88 },
]

export function SmartTerminal() {
  const [command, setCommand] = useState("")
  const [history, setHistory] = useState<CommandHistory[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewEntry, setPreviewEntry] = useState<any>(null)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [naturalLanguageInput, setNaturalLanguageInput] = useState("")
  const [showNLInput, setShowNLInput] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const nlInputRef = useRef<HTMLTextAreaElement>(null)

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (command.length > 10 && !isCommandSyntax(command)) {
      setTimeout(() => {
        const suggestion = generateAISuggestion(command)
        setAiSuggestion(suggestion)
      }, 500)
    } else {
      setAiSuggestion(null)
    }
  }, [command])

  const isCommandSyntax = (cmd: string) => {
    return /^(ex|in|as|li|tr)\s/.test(cmd.trim())
  }

  const generateAISuggestion = (input: string): string => {
    const lower = input.toLowerCase()

    // Check learned mappings
    const mapping = learnedMappings.find((m) => lower.includes(m.original))

    if (lower.includes("coffee") || lower.includes("starbucks")) {
      return `ex -i coffee 100 -v "Starbucks" -a "${mapping?.suggested || "Expenses:Meals:Coffee"}"`
    } else if (lower.includes("laptop") || lower.includes("computer")) {
      return 'as -i laptop 2000 -p "credit-card" -a "Assets:Equipment:Computers"'
    } else if (lower.includes("consulting") || lower.includes("freelance")) {
      return 'in -i consulting 5000 -c "Client Name" -a "Income:Consulting"'
    } else if (lower.includes("uber") || lower.includes("taxi")) {
      return `ex -i rideshare 25 -v "Uber" -a "${mapping?.suggested || "Expenses:Travel:Rideshare"}"`
    }

    return 'ex -i expense 100 -v "Vendor Name" -a "Expenses:General"'
  }

  const parseCommand = (cmd: string) => {
    const parts = cmd.trim().split(/\s+/)
    const type = parts[0]

    // Mock parsing - in real app this would be more sophisticated
    const mockEntry = {
      date: new Date().toISOString().split("T")[0],
      description: `Transaction from ${type} command`,
      postings: [
        {
          account: "Expenses:General",
          debit: 100,
          currency: "USD",
        },
        {
          account: "Assets:Bank:Checking",
          credit: 100,
          currency: "USD",
        },
      ],
      isBalanced: true,
      totalAmount: 100,
      currency: "USD",
    }

    return mockEntry
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!command.trim()) return

    setIsProcessing(true)

    // Parse command and create entry preview
    const parsedEntry = parseCommand(command)

    const newEntry: CommandHistory = {
      command: command.trim(),
      timestamp: new Date(),
      result: "success",
      parsedEntry,
    }

    setHistory((prev) => [newEntry, ...prev])
    setPreviewEntry(parsedEntry)
    setShowPreview(true)
    setCommand("")
    setHistoryIndex(-1)
    setAiSuggestion(null)

    setTimeout(() => {
      setIsProcessing(false)
    }, 1000)
  }

  const handlePreview = () => {
    if (command.trim()) {
      const parsedEntry = parseCommand(command)
      setPreviewEntry(parsedEntry)
      setShowPreview(true)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault()
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1
        setHistoryIndex(newIndex)
        setCommand(history[newIndex].command)
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setCommand(history[newIndex].command)
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setCommand("")
      }
    } else if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault()
      handlePreview()
    }
  }

  const acceptSuggestion = () => {
    if (aiSuggestion) {
      setCommand(aiSuggestion)
      setAiSuggestion(null)
      inputRef.current?.focus()
    }
  }

  const copySampleCommand = (cmd: string) => {
    setCommand(cmd)
    inputRef.current?.focus()
  }

  const handleCommandSelect = (selectedCommand: string) => {
    setCommand(selectedCommand)
    inputRef.current?.focus()
  }

  const processNaturalLanguage = () => {
    if (naturalLanguageInput.trim()) {
      const suggestion = generateAISuggestion(naturalLanguageInput)
      setCommand(suggestion)
      setNaturalLanguageInput("")
      setShowNLInput(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="space-y-6">
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onCommandSelect={handleCommandSelect}
      />

      {/* Terminal Input */}
      <Card className="border-2 border-primary/20">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Terminal className="h-5 w-5 text-primary" />
                <span className="text-sm font-mono text-muted-foreground">ledger-ai $</span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNLInput(!showNLInput)}
                  className="text-xs"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Natural Language
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCommandPaletteOpen(true)}
                  className="text-xs"
                >
                  ⌘K
                </Button>
              </div>
            </div>

            {/* Natural Language Input */}
            {showNLInput && (
              <div className="space-y-2">
                <Textarea
                  ref={nlInputRef}
                  value={naturalLanguageInput}
                  onChange={(e) => setNaturalLanguageInput(e.target.value)}
                  placeholder="Describe your transaction in plain English... e.g., 'I bought coffee at Starbucks for $5'"
                  className="min-h-[80px]"
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowNLInput(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={processNaturalLanguage}
                    disabled={!naturalLanguageInput.trim()}
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Generate Command
                  </Button>
                </div>
              </div>
            )}

            <div className="relative">
              <Input
                ref={inputRef}
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter command or describe transaction..."
                className="font-mono text-base py-3 pr-32"
                disabled={isProcessing}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handlePreview}
                  disabled={!command.trim()}
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setCommand("")}>
                  <RotateCcw className="h-3 w-3" />
                </Button>
                <Button type="submit" size="sm" disabled={!command.trim() || isProcessing} className="h-6">
                  {isProcessing ? "..." : "↵"}
                </Button>
              </div>
            </div>

            {/* AI Suggestion */}
            {aiSuggestion && (
              <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg border">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">AI Generated:</span>
                <code className="font-mono text-sm bg-background px-2 py-1 rounded flex-1">{aiSuggestion}</code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={acceptSuggestion}
                  className="ml-auto bg-transparent"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Accept
                </Button>
              </div>
            )}
          </form>

          {/* Keyboard Shortcuts */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <span className="flex items-center space-x-1">
                <ArrowUp className="h-3 w-3" />
                <ArrowDown className="h-3 w-3" />
                <span>History</span>
              </span>
              <span>⌘K Command Palette</span>
              <span>⇧↵ Preview</span>
              <span>↵ Execute</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entry Preview */}
      {showPreview && previewEntry && (
        <EntryPreview
          entry={previewEntry}
          onAccept={() => {
            setShowPreview(false)
            setPreviewEntry(null)
            // In real app, would save to database
          }}
          onReject={() => {
            setShowPreview(false)
            setPreviewEntry(null)
          }}
        />
      )}

      {/* AI Account Mappings */}
      {learnedMappings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-primary" />
              Learned Account Mappings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {learnedMappings.map((mapping, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <code className="font-mono text-sm bg-background px-2 py-1 rounded">{mapping.original}</code>
                    <span className="text-muted-foreground">→</span>
                    <code className="font-mono text-sm">{mapping.suggested}</code>
                  </div>
                  <Badge variant="secondary">{mapping.confidence}% confidence</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sample Commands */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sample Commands</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {sampleCommands.map((cmd, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => copySampleCommand(cmd)}
              >
                <code className="font-mono text-sm">{cmd}</code>
                <Copy className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Command History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Commands</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.slice(0, 5).map((entry, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant={entry.result === "success" ? "default" : "destructive"}>
                      {entry.result === "success" ? "Success" : "Error"}
                    </Badge>
                    <code className="font-mono text-sm">{entry.command}</code>
                  </div>
                  <span className="text-xs text-muted-foreground">{entry.timestamp.toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
