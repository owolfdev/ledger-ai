// /lib/ledger/hybrid-account-mapper.ts
// Hybrid approach: Rule-based speed + AI granularity for broad categories

import {
  mapAccount as ruleBasedMapAccount,
  type MapAccountOptions,
} from "./account-map";
import { mapAccountWithTags } from "./tag-aware-account-mapper";

interface AIAccountMapperOptions extends MapAccountOptions {
  useAI?: boolean;
  maxRetries?: number;
}

// Categories that should trigger AI enhancement for granularity
const BROAD_CATEGORIES_FOR_AI = [
  "Fruit",
  "Vegetables",
  "Meat",
  "Electronics",
  "Clothing",
  "Supplies",
  "Software",
  "Entertainment",
];

// Cache to avoid repeated AI calls
const aiEnhancementCache = new Map<
  string,
  { category: string; timestamp: number }
>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function getCacheKey(
  description: string,
  vendor?: string,
  business?: string
): string {
  return `${description.toLowerCase()}|${vendor?.toLowerCase() || ""}|${
    business || "Personal"
  }`;
}

function shouldEnhanceWithAI(accountPath: string): boolean {
  return BROAD_CATEGORIES_FOR_AI.some(
    (broad) =>
      accountPath.includes(`:${broad}`) && accountPath.endsWith(`:${broad}`)
  );
}

async function getAIEnhancement(
  description: string,
  currentCategory: string,
  vendor?: string,
  business?: string
): Promise<string | null> {
  const cacheKey = getCacheKey(description, vendor, business);
  const cached = aiEnhancementCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.category;
  }

  try {
    const response = await fetch("/api/account-mapping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description,
        currentCategory,
        vendor,
        business,
      }),
    });

    if (!response.ok) {
      throw new Error(`Account mapping API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // Only use if confidence is reasonable
    if (data.confidence && data.confidence >= 0.7) {
      // Cache the result
      aiEnhancementCache.set(cacheKey, {
        category: data.enhanced_category,
        timestamp: Date.now(),
      });

      return data.enhanced_category;
    } else {
      console.warn(
        `Low AI confidence (${data.confidence}) for "${description}", keeping original`
      );
      return null;
    }
  } catch (error) {
    console.error("AI enhancement failed:", error);
    return null;
  }
}

function buildAccountFromCategory(category: string, business: string): string {
  // Special case: Taxes don't use business prefix
  if (category.startsWith("Taxes:")) {
    return `Expenses:${category}`;
  }

  return `Expenses:${business}:${category}`;
}

export async function mapAccountWithHybridAI(
  description: string,
  opts: AIAccountMapperOptions = {}
): Promise<string> {
  const business = opts.business || "Personal";

  try {
    // First try tag-aware mapping (most accurate)
    const tagAwareAccount = await mapAccountWithTags(description, business);

    // If tag-aware mapping found a specific account (not Misc), use it
    if (!tagAwareAccount.includes(":Misc")) {
      return tagAwareAccount;
    }

    // Fall back to rule-based mapping if tag-aware didn't find a match
    const ruleBasedAccount = ruleBasedMapAccount(description, opts);

    // Extract the category part (everything after "Expenses:Business:")
    const accountParts = ruleBasedAccount.split(":");
    if (accountParts.length < 3) {
      return ruleBasedAccount; // Malformed account, return as-is
    }

    const categoryPath = accountParts.slice(2).join(":"); // e.g., "Food:Fruit"

    // Check if this category should be enhanced with AI
    if (opts.useAI !== false && shouldEnhanceWithAI(categoryPath)) {
      try {
        const enhancedCategory = await getAIEnhancement(
          description,
          categoryPath,
          opts.vendor,
          business
        );

        if (enhancedCategory) {
          return buildAccountFromCategory(enhancedCategory, business);
        }
      } catch (error) {
        console.error("AI enhancement failed, using rule-based result:", error);
      }
    }

    // Return original rule-based result if:
    // - AI disabled
    // - Category doesn't need enhancement
    // - AI enhancement failed
    // - AI confidence too low
    return ruleBasedAccount;
  } catch (error) {
    console.error(
      "Tag-aware mapping failed, falling back to rule-based:",
      error
    );
    return ruleBasedMapAccount(description, opts);
  }
}

// Synchronous version that maintains backward compatibility
export function mapAccount(
  description: string,
  opts: MapAccountOptions = {}
): string {
  // Just use rule-based mapping for synchronous calls
  return ruleBasedMapAccount(description, opts);
}

// Batch processing for multiple items
export async function mapAccountsBatchHybrid(
  items: Array<{ description: string; opts?: AIAccountMapperOptions }>
): Promise<string[]> {
  const results = await Promise.allSettled(
    items.map((item) => mapAccountWithHybridAI(item.description, item.opts))
  );

  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      console.error(
        `Hybrid batch mapping failed for item ${index}:`,
        result.reason
      );
      // Fallback to rule-based mapping
      return ruleBasedMapAccount(
        items[index].description,
        items[index].opts || {}
      );
    }
  });
}

// Utility functions
export function clearAIEnhancementCache(): void {
  aiEnhancementCache.clear();
}

export function getAIEnhancementCacheStats() {
  const now = Date.now();
  const entries = Array.from(aiEnhancementCache.entries());
  const validEntries = entries.filter(
    ([, value]) => now - value.timestamp < CACHE_DURATION
  );

  return {
    totalEntries: aiEnhancementCache.size,
    validEntries: validEntries.length,
    expiredEntries: entries.length - validEntries.length,
    broadCategories: BROAD_CATEGORIES_FOR_AI,
  };
}

// Helper to test if a description would benefit from AI enhancement
export function wouldBenefitFromAI(
  description: string,
  opts: MapAccountOptions = {}
): boolean {
  const ruleBasedAccount = ruleBasedMapAccount(description, opts);
  const categoryPath = ruleBasedAccount.split(":").slice(2).join(":");
  return shouldEnhanceWithAI(categoryPath);
}
