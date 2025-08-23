// /lib/ledger/ai-account-mapper.ts
// AI-enhanced account mapping with rule-based fallback

import {
  mapAccount as ruleBasedMapAccount,
  type MapAccountOptions,
} from "./account-map";

interface AIAccountMapperOptions extends MapAccountOptions {
  useAI?: boolean; // Allow disabling AI for testing/fallback
  maxRetries?: number;
}

interface AICategorizationRequest {
  description: string;
  vendor?: string;
  business: string;
  context?: {
    recentCategories?: string[]; // Help AI be consistent
    userPreferences?: Record<string, string>; // User's custom mappings
  };
}

interface AICategorizationResponse {
  category: string;
  confidence: number; // 0-1 score
  reasoning?: string; // For debugging/user feedback
}

// Cache to avoid repeated API calls for identical inputs
const aiMappingCache = new Map<
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

async function callAIForCategorization(
  request: AICategorizationRequest
): Promise<AICategorizationResponse> {
  const prompt = `You are an expert accountant helping categorize business expenses. 

Business Context: ${request.business}
Item Description: "${request.description}"
Vendor: ${request.vendor || "Unknown"}

Create a specific, hierarchical account category following these patterns:
- Food items: Food:Fruit:Apples, Food:Vegetables:Leafy:Spinach, Food:Meat:Poultry:Chicken
- Electronics: Electronics:Audio:Headphones:Wireless, Electronics:Computing:Laptops:Business
- Office: Office:Supplies:Paper:Printer, Office:Furniture:Chairs:Ergonomic
- Transport: Transport:Fuel:Gasoline, Transport:Public:Metro:Monthly
- Professional: Professional:Software:Design:Adobe, Professional:Consulting:Legal:Contract

Guidelines:
1. Be specific (apples not just fruit, wireless headphones not just electronics)
2. Use 2-4 levels of hierarchy (Category:SubCategory:Type:Specific)
3. Use PascalCase with no spaces (Food:Fruit:GreenApples not Food:Fruit:Green Apples)
4. Consider the business context (Personal vs MyBrick vs Channel60)
5. Avoid generic terms like "Misc" or "Other"

Respond with JSON: {"category": "Food:Fruit:Apples", "confidence": 0.95, "reasoning": "Apple is a specific fruit type"}`;

  try {
    const response = await fetch("/api/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.1, // Low temperature for consistent categorization
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("No AI response received");
    }

    // Parse JSON response
    const parsed = JSON.parse(aiResponse);

    // Validate response structure
    if (!parsed.category || typeof parsed.category !== "string") {
      throw new Error("Invalid AI response format");
    }

    return {
      category: parsed.category,
      confidence: parsed.confidence || 0.5,
      reasoning: parsed.reasoning || "",
    };
  } catch (error) {
    console.error("AI categorization failed:", error);
    throw error;
  }
}

function buildAccountFromCategory(category: string, business: string): string {
  // Special case: Taxes don't use business prefix
  if (category.startsWith("Taxes:")) {
    return `Expenses:${category}`;
  }

  return `Expenses:${business}:${category}`;
}

export async function mapAccountWithAI(
  description: string,
  opts: AIAccountMapperOptions = {}
): Promise<string> {
  const business = opts.business || "Personal";

  // First try rule-based mapping
  const ruleBasedCategory = ruleBasedMapAccount(description, opts);

  // If rule-based mapping didn't return "Misc", use it
  if (!ruleBasedCategory.endsWith(":Misc")) {
    return ruleBasedCategory;
  }

  // Skip AI if disabled
  if (opts.useAI === false) {
    return ruleBasedCategory;
  }

  try {
    // Check cache first
    const cacheKey = getCacheKey(description, opts.vendor, business);
    const cached = aiMappingCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return buildAccountFromCategory(cached.category, business);
    }

    // Call AI for categorization
    const aiResponse = await callAIForCategorization({
      description,
      vendor: opts.vendor,
      business,
    });

    // Only use AI result if confidence is reasonable
    if (aiResponse.confidence >= 0.6) {
      // Cache the result
      aiMappingCache.set(cacheKey, {
        category: aiResponse.category,
        timestamp: Date.now(),
      });

      return buildAccountFromCategory(aiResponse.category, business);
    } else {
      console.warn(
        `Low AI confidence (${aiResponse.confidence}) for "${description}", using rule fallback`
      );
      return ruleBasedCategory;
    }
  } catch (error) {
    console.error("AI mapping failed, using rule fallback:", error);
    return ruleBasedCategory;
  }
}

// Synchronous version that maintains original interface
export function mapAccount(
  description: string,
  opts: MapAccountOptions = {}
): string {
  // For now, just use rule-based mapping
  // This maintains backward compatibility
  return ruleBasedMapAccount(description, opts);
}

// Batch processing for multiple items (more efficient)
export async function mapAccountsBatch(
  items: Array<{ description: string; opts?: AIAccountMapperOptions }>
): Promise<string[]> {
  const results = await Promise.allSettled(
    items.map((item) => mapAccountWithAI(item.description, item.opts))
  );

  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      console.error(`Batch mapping failed for item ${index}:`, result.reason);
      // Fallback to rule-based mapping
      return ruleBasedMapAccount(
        items[index].description,
        items[index].opts || {}
      );
    }
  });
}

// Utility to clear cache (useful for testing or user preference changes)
export function clearAIMappingCache(): void {
  aiMappingCache.clear();
}

// Get cache stats for monitoring
export function getAICacheStats() {
  const now = Date.now();
  const entries = Array.from(aiMappingCache.entries());
  const validEntries = entries.filter(
    ([, value]) => now - value.timestamp < CACHE_DURATION
  );

  return {
    totalEntries: aiMappingCache.size,
    validEntries: validEntries.length,
    expiredEntries: entries.length - validEntries.length,
  };
}
