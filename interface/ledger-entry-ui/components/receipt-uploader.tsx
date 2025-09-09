"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Upload, X, Eye, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadProgress: number
  ocrStatus: "pending" | "processing" | "completed" | "failed"
  extractedData?: {
    amount?: number
    vendor?: string
    date?: string
    items?: string[]
  }
}

interface ReceiptUploaderProps {
  onUpload: (files: File[]) => void
  maxFiles?: number
}

export function ReceiptUploader({ onUpload, maxFiles = 5 }: ReceiptUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith("image/"))

    if (droppedFiles.length > 0) {
      handleFileUpload(droppedFiles)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length > 0) {
      handleFileUpload(selectedFiles)
    }
  }

  const handleFileUpload = (newFiles: File[]) => {
    const filesToUpload = newFiles.slice(0, maxFiles - files.length)

    filesToUpload.forEach((file) => {
      const fileId = Math.random().toString(36).substr(2, 9)
      const uploadedFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
        uploadProgress: 0,
        ocrStatus: "pending",
      }

      setFiles((prev) => [...prev, uploadedFile])

      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, uploadProgress: Math.min(f.uploadProgress + 10, 100) } : f)),
        )
      }, 200)

      // Simulate OCR processing
      setTimeout(() => {
        clearInterval(uploadInterval)
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  uploadProgress: 100,
                  ocrStatus: "processing",
                }
              : f,
          ),
        )

        // Complete OCR after delay
        setTimeout(() => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileId
                ? {
                    ...f,
                    ocrStatus: "completed",
                    extractedData: {
                      amount: 25.5,
                      vendor: "Starbucks",
                      date: "2024-01-15",
                      items: ["Coffee", "Pastry"],
                    },
                  }
                : f,
            ),
          )
        }, 2000)
      }, 2000)
    })

    onUpload(filesToUpload)
  }

  const removeFile = (fileId: string) => {
    setFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === fileId)
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.url)
      }
      return prev.filter((f) => f.id !== fileId)
    })
  }

  const getOCRStatusIcon = (status: UploadedFile["ocrStatus"]) => {
    switch (status) {
      case "pending":
        return <AlertCircle className="h-3 w-3 text-yellow-500" />
      case "processing":
        return <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />
      case "completed":
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case "failed":
        return <AlertCircle className="h-3 w-3 text-red-500" />
    }
  }

  const getOCRStatusText = (status: UploadedFile["ocrStatus"]) => {
    switch (status) {
      case "pending":
        return "Pending"
      case "processing":
        return "Processing"
      case "completed":
        return "Completed"
      case "failed":
        return "Failed"
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Upload className="h-8 w-8 text-muted-foreground mb-4" />
          <div className="text-center">
            <p className="text-sm font-medium mb-1">Drop receipt images here, or click to browse</p>
            <p className="text-xs text-muted-foreground mb-4">Supports PNG, JPG, JPEG up to 10MB each</p>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="receipt-upload"
            />
            <Button asChild variant="outline" size="sm">
              <label htmlFor="receipt-upload" className="cursor-pointer">
                Choose Files
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Uploaded Receipts ({files.length})</h4>
          <div className="grid gap-3">
            {files.map((file) => (
              <Card key={file.id} className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <img
                      src={file.url || "/placeholder.svg"}
                      alt={file.name}
                      className="h-16 w-16 object-cover rounded-lg border"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          {getOCRStatusIcon(file.ocrStatus)}
                          <span className="text-xs text-muted-foreground">{getOCRStatusText(file.ocrStatus)}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {file.uploadProgress < 100 && <Progress value={file.uploadProgress} className="h-1 mb-2" />}

                    {file.extractedData && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          ${file.extractedData.amount}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {file.extractedData.vendor}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {file.extractedData.date}
                        </Badge>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" className="h-6 text-xs bg-transparent">
                        <Eye className="mr-1 h-3 w-3" />
                        View
                      </Button>
                      {file.extractedData && (
                        <Button variant="outline" size="sm" className="h-6 text-xs bg-transparent">
                          Create Entry
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
