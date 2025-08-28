// src/lib/ledger/auto-tagger.ts
// Auto-tagging system for ledger entries and postings

import { createClient } from "@/utils/supabase/client";

export interface TagMatch {
  tagId: string;
  name: string;
  category: string;
  priority: number;
  confidence: number;
}

export interface AutoTagResult {
  entryTags: TagMatch[];
  postingTags: Map<number, TagMatch[]>; // posting_id -> tags
}

/**
 * Extract keywords from text for tag matching
 */
export function extractKeywords(text: string): string[] {
  if (!text) return [];

  return text
    .toLowerCase()
    .split(/[\s,.-]+/)
    .map((word) => word.trim())
    .filter(
      (word) =>
        word.length > 2 &&
        !/^(the|and|or|for|with|from|to|in|on|at|by|of|a|an)$/.test(word)
    )
    .slice(0, 20); // Limit to prevent excessive processing
}

/**
 * Extract keywords from account path (e.g., "Expenses:Personal:Food:Coffee")
 */
export function extractAccountKeywords(accountPath: string): string[] {
  if (!accountPath) return [];

  const segments = accountPath.split(":");

  // Filter out generic path segments and focus on meaningful keywords
  const meaningfulSegments = segments
    .map((segment) => segment.toLowerCase())
    .filter((segment) => segment.length > 2)
    .filter(
      (segment) =>
        !/^(expenses|personal|business|assets|liabilities|income)$/.test(
          segment
        )
    );

  const keywords = meaningfulSegments.flatMap((segment) => {
    const extracted = extractKeywords(segment);
    return extracted;
  });

  return keywords;
}

/**
 * Find matching tags for given keywords
 */
export async function findMatchingTags(
  keywords: string[]
): Promise<TagMatch[]> {
  if (keywords.length === 0) return [];

  const supabase = createClient();

  // Find tags that match any of the keywords
  const { data: tags, error } = await supabase
    .from("tags")
    .select("id, name, category, priority, usage_count")
    .eq("is_active", true)
    .or(keywords.map((k) => `name.ilike.%${k}%`).join(","))
    .order("priority", { ascending: false })
    .order("usage_count", { ascending: false });

  if (error) {
    console.error("Error finding matching tags:", error);
    return [];
  }

  if (!tags) return [];

  // Calculate confidence scores based on match quality
  return tags
    .map((tag) => {
      const matchedKeywords = keywords.filter((keyword) =>
        tag.name.toLowerCase().includes(keyword.toLowerCase())
      );

      const confidence = (matchedKeywords.length / keywords.length) * 100;

      return {
        tagId: tag.id,
        name: tag.name,
        category: tag.category || "uncategorized",
        priority: tag.priority || 0,
        confidence,
      };
    })
    .filter((tag) => tag.confidence > 20); // Only return relevant matches
}

/**
 * Auto-tag a ledger entry based on its data
 */
export async function autoTagEntry(entryData: {
  description: string;
  memo?: string | null;
  business?: string | null;
  postings: Array<{
    id: number;
    account: string;
    amount: number;
    currency: string;
  }>;
}): Promise<AutoTagResult> {
  const keywords: string[] = [];

  // Extract keywords from entry-level data
  if (entryData.description) {
    keywords.push(...extractKeywords(entryData.description));
  }

  if (entryData.memo) {
    keywords.push(...extractKeywords(entryData.memo));
  }

  if (entryData.business) {
    keywords.push(...extractKeywords(entryData.business));
  }

  // Find entry-level tags
  const entryTags = await findMatchingTags(keywords);

  // Process posting-level tags
  const postingTags = new Map<number, TagMatch[]>();

  for (const posting of entryData.postings) {
    const postingKeywords = extractAccountKeywords(posting.account);

    if (postingKeywords.length > 0) {
      const tags = await findMatchingTags(postingKeywords);
      if (tags.length > 0) {
        postingTags.set(posting.id, tags);
      }
    }
  }

  return {
    entryTags,
    postingTags,
  };
}

/**
 * Apply tags to database
 */
export async function applyAutoTags(
  entryId: number,
  autoTagResult: AutoTagResult
): Promise<void> {
  const supabase = createClient();

  // Apply entry-level tags
  if (autoTagResult.entryTags.length > 0) {
    const entryTagRows = autoTagResult.entryTags.map((tag) => ({
      entry_id: entryId,
      tag_id: tag.tagId,
    }));

    const { error: entryTagError } = await supabase
      .from("entry_tags")
      .insert(entryTagRows);

    if (entryTagError) {
      console.error("Error applying entry tags:", entryTagError);
    }
  }

  // Apply posting-level tags
  for (const [postingId, tags] of autoTagResult.postingTags) {
    if (tags.length > 0) {
      const postingTagRows = tags.map((tag) => ({
        posting_id: postingId,
        tag_id: tag.tagId,
      }));

      const { error: postingTagError } = await supabase
        .from("posting_tags")
        .insert(postingTagRows);

      if (postingTagError) {
        console.error("Error applying posting tags:", postingTagError);
      }
    }
  }

  // Update usage counts for used tags
  const allTagIds = [
    ...autoTagResult.entryTags.map((t) => t.tagId),
    ...Array.from(autoTagResult.postingTags.values())
      .flat()
      .map((t) => t.tagId),
  ];

  if (allTagIds.length > 0) {
    // For now, skip usage count updates to avoid complexity
    // TODO: Implement proper usage count updates later
    // console.log("Would update usage counts for tags:", allTagIds);
  }
}
