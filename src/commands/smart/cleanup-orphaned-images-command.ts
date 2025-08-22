// src/commands/smart/cleanup-orphaned-images-command.ts
"use client";

import { TerminalOutputRendererProps } from "@/types/terminal";
import { createClient } from "@/utils/supabase/client";

export type SetHistory = React.Dispatch<
  React.SetStateAction<TerminalOutputRendererProps[]>
>;

interface OrphanedImageInfo {
  path: string;
  size: number;
  lastModified: string;
}

export async function handleCleanupOrphanedImages(
  setHistory: SetHistory,
  cmd: string,
  arg: string
): Promise<boolean> {
  setHistory((h) => [
    ...(h ?? []),
    { type: "input", content: cmd },
    {
      type: "output",
      content: "_Scanning for orphaned images..._",
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
        content: "🔍 **Step 1: Scanning storage bucket...**",
        format: "markdown",
      },
    ]);

    // Get all images from the receipts bucket
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from("receipts")
      .list(user.id, {
        limit: 1000, // Adjust if needed
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
          content: "✅ **No images found in storage bucket**",
          format: "markdown",
        },
      ]);
      return true;
    }

    setHistory((h) => [
      ...h,
      {
        type: "output",
        content: `📁 **Found ${storageFiles.length} images in storage**`,
        format: "markdown",
      },
    ]);

    // Get all image URLs from the database
    setHistory((h) => [
      ...h,
      {
        type: "output",
        content: "🔍 **Step 2: Checking database references...**",
        format: "markdown",
      },
    ]);

    const { data: dbEntries, error: dbError } = await supabase
      .from("ledger_entries")
      .select("image_url")
      .not("image_url", "is", null);

    if (dbError) {
      updateHistoryWithError(
        setHistory,
        `Database query failed: ${dbError.message}`
      );
      return true;
    }

    const dbImageUrls = new Set(
      dbEntries?.map((entry) => entry.image_url).filter(Boolean) as string[]
    );

    setHistory((h) => [
      ...h,
      {
        type: "output",
        content: `📊 **Found ${dbImageUrls.size} images referenced in database**`,
        format: "markdown",
      },
    ]);

    // Find orphaned images
    const orphanedImages: OrphanedImageInfo[] = [];
    const errors: string[] = [];

    for (const file of storageFiles) {
      try {
        // Construct the full URL to match against database URLs
        const { data: publicUrl } = supabase.storage
          .from("receipts")
          .getPublicUrl(`${user.id}/${file.name}`);

        if (!publicUrl?.publicUrl) {
          errors.push(`Failed to get public URL for ${file.name}`);
          continue;
        }

        // Check if this image is referenced in the database
        if (!dbImageUrls.has(publicUrl.publicUrl)) {
          orphanedImages.push({
            path: `${user.id}/${file.name}`,
            size: file.metadata?.size || 0,
            lastModified: file.updated_at || file.created_at || "unknown",
          });
        }
      } catch (error) {
        errors.push(`Error processing ${file.name}: ${error}`);
      }
    }

    setHistory((h) => [
      ...h,
      {
        type: "output",
        content: `🚨 **Found ${orphanedImages.length} orphaned images**`,
        format: "markdown",
      },
    ]);

    if (orphanedImages.length === 0) {
      setHistory((h) => [
        ...h,
        {
          type: "output",
          content:
            "✅ **No orphaned images found. All images are properly referenced!**",
          format: "markdown",
        },
      ]);
      return true;
    }

    // Show orphaned images list
    setHistory((h) => [
      ...h,
      {
        type: "output",
        content: "📋 **Orphaned Images List:**",
        format: "markdown",
      },
      {
        type: "output",
        content: orphanedImages
          .map(
            (img, index) =>
              `${index + 1}. **${img.path}**\n   Size: ${formatBytes(
                img.size
              )}\n   Modified: ${img.lastModified}`
          )
          .join("\n\n"),
        format: "markdown",
      },
    ]);

    // Ask for confirmation if not using --force flag
    if (!arg.includes("--force")) {
      setHistory((h) => [
        ...h,
        {
          type: "output",
          content:
            "⚠️ **To delete these orphaned images, run:**\n```\ncleanup-orphaned-images --force\n```",
          format: "markdown",
        },
      ]);
      return true;
    }

    // Delete orphaned images
    setHistory((h) => [
      ...h,
      {
        type: "output",
        content: "🗑️ **Step 3: Deleting orphaned images...**",
        format: "markdown",
      },
    ]);

    const deletePromises = orphanedImages.map(async (img) => {
      try {
        const { error: deleteError } = await supabase.storage
          .from("receipts")
          .remove([img.path]);

        if (deleteError) {
          throw new Error(deleteError.message);
        }

        return { success: true, path: img.path };
      } catch (error) {
        return { success: false, path: img.path, error: String(error) };
      }
    });

    const deleteResults = await Promise.all(deletePromises);
    const successfulDeletions = deleteResults.filter((r) => r.success);
    const failedDeletions = deleteResults.filter((r) => !r.success);

    // Report results
    setHistory((h) => [
      ...h,
      {
        type: "output",
        content:
          `✅ **Cleanup Complete!**\n\n` +
          `🗑️ **Deleted:** ${successfulDeletions.length} images\n` +
          `❌ **Failed:** ${failedDeletions.length} images\n` +
          `📊 **Total processed:** ${orphanedImages.length} images`,
        format: "markdown",
      },
    ]);

    if (failedDeletions.length > 0) {
      setHistory((h) => [
        ...h,
        {
          type: "output",
          content:
            "❌ **Failed Deletions:**\n" +
            failedDeletions.map((f) => `- ${f.path}: ${f.error}`).join("\n"),
          format: "markdown",
        },
      ]);
    }

    if (errors.length > 0) {
      setHistory((h) => [
        ...h,
        {
          type: "output",
          content:
            "⚠️ **Processing Errors:**\n" +
            errors.map((e) => `- ${e}`).join("\n"),
          format: "markdown",
        },
      ]);
    }

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
