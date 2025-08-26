// src/commands/smart/storage-health-check-command.ts
"use client";

import { TerminalOutputRendererProps } from "@/types/terminal";
import { createClient } from "@/utils/supabase/client";

export type SetHistory = React.Dispatch<
  React.SetStateAction<TerminalOutputRendererProps[]>
>;

export async function handleStorageHealthCheck(
  setHistory: SetHistory,
  cmd: string,
  arg: string
): Promise<boolean> {
  setHistory((h) => [
    ...(h ?? []),
    { type: "input", content: cmd },
    {
      type: "output",
      content: "_Checking storage health..._",
      format: "markdown",
    },
  ]);

  try {
    const supabase = createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      updateHistoryWithError(setHistory, "Authentication required");
      return true;
    }

    setHistory((h) => [
      ...h,
      {
        type: "output",
        content: "🔍 **Storage Health Check**",
        format: "markdown",
      },
    ]);

    // Get all files from the receipts bucket for this user
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from("receipts")
      .list(user.id, {
        limit: 1000,
        offset: 0,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (storageError) {
      updateHistoryWithError(
        setHistory,
        `Storage scan failed: ${storageError.message}`
      );
      return true;
    }

    if (!storageFiles || storageFiles.length === 0) {
      setHistory((h) => [
        ...h,
        {
          type: "output",
          content: "📁 **No files found in storage bucket**",
          format: "markdown",
        },
      ]);
      return true;
    }

    setHistory((h) => [
      ...h,
      {
        type: "output",
        content: `📁 **Found ${storageFiles.length} files in storage**`,
        format: "markdown",
      },
    ]);

    // Show detailed file information
    const fileDetails = storageFiles.map((file, index) => {
      const { data: publicUrl } = supabase.storage
        .from("receipts")
        .getPublicUrl(`${user.id}/${file.name}`);

      return {
        index: index + 1,
        name: file.name,
        size: file.metadata?.size || 0,
        created: file.created_at || "unknown",
        updated: file.updated_at || "unknown",
        publicUrl: publicUrl?.publicUrl || "unknown",
        path: `${user.id}/${file.name}`,
      };
    });

    // Display file details
    setHistory((h) => [
      ...h,
      {
        type: "output",
        content: "📋 **File Details:**",
        format: "markdown",
      },
      {
        type: "output",
        content: fileDetails
          .map(
            (file) =>
              `${file.index}. **${file.name}**\n` +
              `   Path: \`${file.path}\`\n` +
              `   Size: ${formatBytes(file.size)}\n` +
              `   Created: ${file.created}\n` +
              `   Updated: ${file.updated}\n` +
              `   Public URL: \`${file.publicUrl}\``
          )
          .join("\n\n"),
        format: "markdown",
      },
    ]);

    // Test URL accessibility
    setHistory((h) => [
      ...h,
      {
        type: "output",
        content: "🧪 **Testing URL Accessibility...**",
        format: "markdown",
      },
    ]);

    const accessibilityResults = await Promise.all(
      fileDetails.slice(0, 3).map(async (file) => {
        try {
          const response = await fetch(file.publicUrl, { method: "HEAD" });
          return {
            name: file.name,
            accessible: response.ok,
            status: response.status,
            statusText: response.statusText,
          };
        } catch (error) {
          return {
            name: file.name,
            accessible: false,
            status: "ERROR",
            statusText:
              error instanceof Error ? error.message : "Unknown error",
          };
        }
      })
    );

    setHistory((h) => [
      ...h,
      {
        type: "output",
        content: "🔗 **URL Accessibility Test (First 3 files):**",
        format: "markdown",
      },
      {
        type: "output",
        content: accessibilityResults
          .map(
            (result) =>
              `${result.name}: ${result.accessible ? "✅" : "❌"} (${
                result.status
              } ${result.statusText})`
          )
          .join("\n"),
        format: "markdown",
      },
    ]);

    // Show storage bucket info
    setHistory((h) => [
      ...h,
      {
        type: "output",
        content: "ℹ️ **Storage Bucket Info:**",
        format: "markdown",
      },
      {
        type: "output",
        content: `- Bucket: \`receipts\`
- User ID: \`${user.id}\`
- Total files: \`${storageFiles.length}\`
- Total size: \`${formatBytes(
          storageFiles.reduce((sum, f) => sum + (f.metadata?.size || 0), 0)
        )}\``,
        format: "markdown",
      },
    ]);

    return true;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    updateHistoryWithError(setHistory, message);
    return true;
  }
}

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Helper function to update history with error
function updateHistoryWithError(setHistory: SetHistory, error: string): void {
  setHistory((h) => [
    ...h,
    {
      type: "output",
      content: `❌ **Error:** ${error}`,
      format: "markdown",
    },
  ]);
}
