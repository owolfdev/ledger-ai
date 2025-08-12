// src/components/alerts/editable-receipt-error.tsx
"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface EditableReceiptErrorProps {
  errors: string[];
  rawData: string; // The JSON string that failed validation
  onRetry: (correctedData: string) => Promise<void>;
}

export function EditableReceiptError({
  errors,
  rawData,
  onRetry,
}: EditableReceiptErrorProps) {
  const [editedData, setEditedData] = useState(rawData);
  const [isValidating, setIsValidating] = useState(false);
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  // Pretty format the JSON for better editing
  const formatJSON = useCallback((jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonStr;
    }
  }, []);

  const handleFormatClick = () => {
    setEditedData(formatJSON(editedData));
  };

  const validateAndRetry = async () => {
    setIsValidating(true);
    setParseErrors([]);

    try {
      // Basic JSON validation
      JSON.parse(editedData);

      // Send to retry handler
      await onRetry(editedData);
    } catch (error) {
      if (error instanceof SyntaxError) {
        setParseErrors([`Invalid JSON: ${error.message}`]);
      } else if (error instanceof Error) {
        setParseErrors([error.message]);
      } else {
        setParseErrors(["Unknown validation error"]);
      }
    } finally {
      setIsValidating(false);
    }
  };

  const quickFixes = [
    {
      label: "Fix Items Sum",
      description: "Recalculate subtotal from items",
      action: () => {
        try {
          const data = JSON.parse(editedData);
          if (data.items && Array.isArray(data.items)) {
            const itemsSum = data.items.reduce(
              (sum: number, item: { price?: number }) =>
                sum + (typeof item.price === "number" ? item.price : 0),
              0
            );
            data.subtotal = Number(itemsSum.toFixed(2));
            // Also fix total if tax exists
            if (typeof data.tax === "number") {
              data.total = Number((data.subtotal + data.tax).toFixed(2));
            } else {
              data.total = data.subtotal;
            }

            setEditedData(JSON.stringify(data, null, 2));
          }
        } catch (e) {
          console.error(e);
          setParseErrors(["Cannot parse JSON for quick fix"]);
        }
      },
    },
    {
      label: "Fix Total",
      description: "Recalculate total from subtotal + tax",
      action: () => {
        try {
          const data = JSON.parse(editedData);
          if (typeof data.subtotal === "number") {
            const tax = typeof data.tax === "number" ? data.tax : 0;
            data.total = Number((data.subtotal + tax).toFixed(2));
            setEditedData(JSON.stringify(data, null, 2));
          }
        } catch (e) {
          console.error(e);
          setParseErrors(["Cannot parse JSON for quick fix"]);
        }
      },
    },
    {
      label: "Remove Tax",
      description: "Set tax to null if not applicable",
      action: () => {
        try {
          const data = JSON.parse(editedData);
          data.tax = null;
          data.total = data.subtotal;
          setEditedData(JSON.stringify(data, null, 2));
        } catch (e) {
          console.error(e);
          setParseErrors(["Cannot parse JSON for quick fix"]);
        }
      },
    },
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800 my-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
          <span className="text-lg">⚠️</span>
          Receipt Validation Failed - Fix and Retry
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Messages */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Validation Errors:</h4>
          {errors.map((error, index) => (
            <Alert key={index} variant="destructive">
              <AlertDescription>• {error}</AlertDescription>
            </Alert>
          ))}
        </div>

        {/* Parse Errors */}
        {parseErrors.length > 0 && (
          <div className="space-y-2">
            {parseErrors.map((error, index) => (
              <Alert key={index} variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Quick Fix Buttons */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Quick Fixes:</h4>
          <div className="flex flex-wrap gap-2">
            {quickFixes.map((fix, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={fix.action}
                className="text-xs"
                title={fix.description}
                disabled={isValidating}
              >
                {fix.label}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={handleFormatClick}
              className="text-xs"
              disabled={isValidating}
            >
              Format JSON
            </Button>
          </div>
        </div>

        {/* Editable Data */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Edit Receipt Data:</h4>
            <Badge variant="secondary" className="text-xs">
              JSON Format
            </Badge>
          </div>

          <Textarea
            value={editedData}
            onChange={(e) => setEditedData(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
            placeholder="Edit the JSON data to fix validation errors..."
            disabled={isValidating}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={validateAndRetry}
            disabled={isValidating}
            className="flex-1"
          >
            {isValidating ? "Validating..." : "Retry with Corrections"}
          </Button>

          <Button
            variant="outline"
            onClick={() => setEditedData(rawData)}
            disabled={isValidating}
          >
            Reset
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
          <strong>Tips:</strong>
          <ul className="mt-1 space-y-1 list-disc list-inside">
            <li>
              Use &quot;Quick Fixes&quot; to automatically correct common math
              errors
            </li>
            <li>
              Manually edit prices, subtotal, tax, or total values in the JSON
            </li>
            <li>
              Ensure all numeric values are valid numbers (no quotes around
              numbers)
            </li>
            <li>
              Click &quot;Format JSON&quot; to make the data more readable
            </li>
            <li>
              The &quot;Fix Items Sum&quot; button recalculates subtotal and
              total based on item prices
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
