// src/lib/ledger/auto-tagger.ts
// Auto-tagging system for ledger entries and postings

import { createClient } from "@/utils/supabase/client";
import {
  AUTO_TAG_CONFIG,
  getRelevanceThreshold,
  shouldPrioritizeCategory,
} from "./auto-tag-config";

export interface TagMatch {
  tagId: string;
  name: string;
  category: string;
  priority: number;
  confidence: number;
  relevance: number; // NEW: Contextual relevance score
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
 * Focus on the most specific, meaningful part of the path
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

  // NEW: Focus on the last meaningful segment for posting-level tagging
  // This gives us the most specific, relevant keywords
  if (meaningfulSegments.length > 0) {
    const lastSegment = meaningfulSegments[meaningfulSegments.length - 1];
    return extractKeywords(lastSegment);
  }

  // Fallback: use all meaningful segments if no specific ones found
  const keywords = meaningfulSegments.flatMap((segment) => {
    const extracted = extractKeywords(segment);
    return extracted;
  });

  return keywords;
}

/**
 * Calculate contextual relevance between account path and tag
 * This helps avoid irrelevant tags like "street-food" on "pantry" purchases
 */
function calculateContextualRelevance(
  accountPath: string,
  tagName: string,
  tagCategory: string,
  context?: { accountPath?: string; entryDescription?: string }
): number {
  const accountLower = accountPath.toLowerCase();
  const tagLower = tagName.toLowerCase();

  // NEW: For posting-level tagging, we want to ALLOW relevant tags even if they seem "redundant"
  // Only apply redundancy filtering for entry-level tagging (when no accountPath in context)
  const isPostingLevelTagging = context?.accountPath !== undefined;

  // Check if tag is redundant with account path
  if (accountLower.includes(tagLower) || tagLower.includes(accountLower)) {
    if (isPostingLevelTagging) {
      // For posting-level tagging, redundant tags are actually GOOD
      return 1.0; // High relevance for exact matches at posting level
    } else {
      // For entry-level tagging, keep redundancy low
      return 0.1;
    }
  }

  // Check for contextually inappropriate combinations
  for (const mismatch of AUTO_TAG_CONFIG.CONTEXT_MISMATCHES) {
    if (
      accountLower.includes(mismatch.account) &&
      tagLower.includes(mismatch.tag)
    ) {
      return mismatch.relevance;
    }
  }

  // Check for redundant patterns - but only for entry-level tagging
  if (!isPostingLevelTagging) {
    for (const redundant of AUTO_TAG_CONFIG.REDUNDANT_PATTERNS) {
      if (
        accountLower.includes(redundant.account) &&
        tagLower.includes(redundant.tag)
      ) {
        return 0.1; // Very low relevance for redundant tags
      }
    }
  }

  // Check category alignment
  const accountCategory = extractAccountCategory(accountPath);
  if (accountCategory && tagCategory && accountCategory === tagCategory) {
    return 1.0; // Perfect category match
  }

  // Default relevance based on partial matches
  const accountWords = accountLower.split(/[:.\s]+/);
  const tagWords = tagLower.split(/[-\s]+/);

  let matches = 0;
  for (const accountWord of accountWords) {
    for (const tagWord of tagWords) {
      if (accountWord.length > 2 && tagWord.length > 2) {
        if (accountWord.includes(tagWord) || tagWord.includes(accountWord)) {
          matches++;
        }
      }
    }
  }

  return Math.min(
    matches / Math.max(accountWords.length, tagWords.length),
    1.0
  );
}

/**
 * Extract the main category from account path
 */
function extractAccountCategory(accountPath: string): string | null {
  const segments = accountPath.split(":");
  if (segments.length >= 3) {
    return segments[2].toLowerCase(); // e.g., "Food" from "Expenses:Personal:Food:Pantry"
  }
  return null;
}

/**
 * Find matching tags for given keywords with improved relevance filtering
 */
export async function findMatchingTags(
  keywords: string[],
  context?: { accountPath?: string; entryDescription?: string }
): Promise<TagMatch[]> {
  if (keywords.length === 0) return [];

  console.log("Debug - findMatchingTags called with:", { keywords, context });

  const supabase = createClient();

  // Find tags that match any of the keywords
  // Use simple ILIKE queries for better compatibility
  const allTags: Array<{
    id: string;
    name: string;
    category?: string;
    priority?: number;
    usage_count?: number;
  }> = [];

  // Query for each keyword separately and combine results
  for (const keyword of keywords) {
    const { data: keywordTags, error: keywordError } = await supabase
      .from("tags")
      .select("id, name, category, priority, usage_count")
      .eq("is_active", true)
      .ilike("name", `%${keyword}%`);

    if (!keywordError && keywordTags) {
      allTags.push(...keywordTags);
    }
  }

  // Remove duplicates and sort
  const uniqueTags = allTags.filter(
    (tag, index, self) => index === self.findIndex((t) => t.id === tag.id)
  );

  const tags = uniqueTags.sort((a, b) => {
    const aPriority = a.priority || 0;
    const bPriority = b.priority || 0;
    if (bPriority !== aPriority) return bPriority - aPriority;
    return (b.usage_count || 0) - (a.usage_count || 0);
  });

  const error = null; // No error in this approach

  if (error) {
    console.error("Error finding matching tags:", error);
    return [];
  }

  if (!tags) return [];

  // Calculate confidence and relevance scores
  const scoredTags = tags
    .map((tag) => {
      const matchedKeywords = keywords.filter((keyword) =>
        tag.name.toLowerCase().includes(keyword.toLowerCase())
      );

      const confidence = (matchedKeywords.length / keywords.length) * 100;

      // Calculate contextual relevance if context is provided
      let relevance = 1.0;
      if (context?.accountPath) {
        relevance = calculateContextualRelevance(
          context.accountPath,
          tag.name,
          tag.category || "uncategorized",
          context
        );
      }

      const result = {
        tagId: tag.id,
        name: tag.name,
        category: tag.category || "uncategorized",
        priority: tag.priority || 0,
        confidence,
        relevance,
      };

      console.log("Debug - Tag scored:", {
        name: result.name,
        confidence: result.confidence,
        relevance: result.relevance,
        priority: result.priority,
      });

      return result;
    })
    .filter((tag) => {
      // Higher confidence threshold for better quality
      if (tag.confidence < AUTO_TAG_CONFIG.MIN_CONFIDENCE) {
        console.log(
          `Debug - Filtered out ${tag.name}: confidence ${tag.confidence} < ${AUTO_TAG_CONFIG.MIN_CONFIDENCE}`
        );
        return false;
      }

      // Filter out contextually irrelevant tags
      if (tag.relevance < AUTO_TAG_CONFIG.MIN_RELEVANCE) {
        console.log(
          `Debug - Filtered out ${tag.name}: relevance ${tag.relevance} < ${AUTO_TAG_CONFIG.MIN_RELEVANCE}`
        );
        return false;
      }

      // Filter out redundant tags when context is available
      if (
        context?.accountPath &&
        tag.relevance < AUTO_TAG_CONFIG.MIN_RELEVANCE_WITH_CONTEXT
      ) {
        console.log(
          `Debug - Filtered out ${tag.name}: relevance ${tag.relevance} < ${AUTO_TAG_CONFIG.MIN_RELEVANCE_WITH_CONTEXT} (with context)`
        );
        return false;
      }

      console.log(`Debug - Tag ${tag.name} passed all filters`);
      return true;
    })
    .sort((a, b) => {
      // Sort by combined score (confidence + relevance + priority)
      const scoreA =
        a.confidence * AUTO_TAG_CONFIG.SCORING_WEIGHTS.confidence +
        a.relevance * AUTO_TAG_CONFIG.SCORING_WEIGHTS.relevance +
        a.priority * AUTO_TAG_CONFIG.SCORING_WEIGHTS.priority;
      const scoreB =
        b.confidence * AUTO_TAG_CONFIG.SCORING_WEIGHTS.confidence +
        b.relevance * AUTO_TAG_CONFIG.SCORING_WEIGHTS.relevance +
        b.priority * AUTO_TAG_CONFIG.SCORING_WEIGHTS.priority;
      return scoreB - scoreA;
    })
    .slice(0, AUTO_TAG_CONFIG.MAX_TAGS_PER_POSTING); // Limit to configured max tags

  return scoredTags;
}

/**
 * Auto-tag a ledger entry based on its data with improved relevance
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
  const entryTags = await findMatchingTags(keywords, {
    entryDescription: entryData.description,
  });

  // Process posting-level tags with context
  const postingTags = new Map<number, TagMatch[]>();

  for (const posting of entryData.postings) {
    const postingKeywords = extractAccountKeywords(posting.account);

    console.log("Debug - Processing posting:", {
      postingId: posting.id,
      account: posting.account,
      extractedKeywords: postingKeywords,
    });

    if (postingKeywords.length > 0) {
      const tags = await findMatchingTags(postingKeywords, {
        accountPath: posting.account,
        entryDescription: entryData.description,
      });

      console.log("Debug - Found posting tags:", {
        postingId: posting.id,
        tags: tags.map((t) => ({
          name: t.name,
          confidence: t.confidence,
          relevance: t.relevance,
        })),
      });

      if (tags.length > 0) {
        postingTags.set(posting.id, tags);
      }
    } else {
      console.log("Debug - No keywords extracted for posting:", posting.id);
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

  console.log("Debug - applyAutoTags called with:", {
    entryId,
    entryTagsCount: autoTagResult.entryTags.length,
    postingTagsCount: autoTagResult.postingTags.size,
    postingTags: Array.from(autoTagResult.postingTags.entries()).map(
      ([id, tags]) => ({
        postingId: id,
        tagNames: tags.map((t) => t.name),
      })
    ),
  });

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
