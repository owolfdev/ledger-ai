// src/lib/ledger/auto-tag-config.ts
// Configuration for auto-tagging behavior - easily adjustable rules

export const AUTO_TAG_CONFIG = {
  // Confidence thresholds
  MIN_CONFIDENCE: 40, // Increased from 10 to require better keyword matches
  MIN_RELEVANCE: 0.3, // Minimum contextual relevance score
  MIN_RELEVANCE_WITH_CONTEXT: 0.5, // Higher threshold when account context is available

  // Tag limits
  MAX_TAGS_PER_POSTING: 3, // Reduced from 5 to prevent tag spam

  // Context mismatch rules - tags that should never be applied to certain account types
  CONTEXT_MISMATCHES: [
    // Food context mismatches
    {
      account: "pantry",
      tag: "street-food",
      relevance: 0.0,
      reason: "Pantry items are not street food",
    },
    {
      account: "pantry",
      tag: "food-court",
      relevance: 0.0,
      reason: "Pantry items are not from food courts",
    },
    {
      account: "coffee",
      tag: "street-food",
      relevance: 0.0,
      reason: "Coffee beans are not street food",
    },
    {
      account: "coffee",
      tag: "food-court",
      relevance: 0.0,
      reason: "Coffee beans are not from food courts",
    },
    {
      account: "restaurant",
      tag: "pantry",
      relevance: 0.1,
      reason: "Restaurant meals are not pantry items",
    },
    {
      account: "grocery",
      tag: "street-food",
      relevance: 0.1,
      reason: "Grocery stores are not street food",
    },
    {
      account: "cafe",
      tag: "pantry",
      relevance: 0.1,
      reason: "Cafe items are not pantry items",
    },
    {
      account: "takeout",
      tag: "pantry",
      relevance: 0.1,
      reason: "Takeout items are not pantry items",
    },

    // Location context mismatches
    {
      account: "online",
      tag: "local",
      relevance: 0.1,
      reason: "Online purchases are not local",
    },
    {
      account: "local",
      tag: "online",
      relevance: 0.1,
      reason: "Local purchases are not online",
    },
    {
      account: "delivery",
      tag: "local",
      relevance: 0.2,
      reason: "Delivery may not be local",
    },

    // Quality context mismatches
    {
      account: "premium",
      tag: "budget",
      relevance: 0.2,
      reason: "Premium items are not budget",
    },
    {
      account: "budget",
      tag: "premium",
      relevance: 0.2,
      reason: "Budget items are not premium",
    },
    {
      account: "organic",
      tag: "conventional",
      relevance: 0.2,
      reason: "Organic items are not conventional",
    },

    // Business context mismatches
    {
      account: "personal",
      tag: "business",
      relevance: 0.1,
      reason: "Personal expenses are not business",
    },
    {
      account: "business",
      tag: "personal",
      relevance: 0.1,
      reason: "Business expenses are not personal",
    },

    // Time context mismatches
    {
      account: "breakfast",
      tag: "dinner",
      relevance: 0.3,
      reason: "Breakfast items are not dinner",
    },
    {
      account: "lunch",
      tag: "breakfast",
      relevance: 0.3,
      reason: "Lunch items are not breakfast",
    },
    {
      account: "dinner",
      tag: "breakfast",
      relevance: 0.3,
      reason: "Dinner items are not breakfast",
    },

    // NEW: Misc account should be conservative
    {
      account: "misc",
      tag: "coffee",
      relevance: 0.2,
      reason:
        "Misc expenses are unlikely to be coffee unless specifically mentioned",
    },
    {
      account: "misc",
      tag: "condo-fees",
      relevance: 0.2,
      reason:
        "Misc expenses are unlikely to be condo fees unless specifically mentioned",
    },
  ],

  // Redundant tag patterns - tags that add no value when account already indicates the same thing
  REDUNDANT_PATTERNS: [
    {
      account: "pantry",
      tag: "pantry",
      reason: "Account path already indicates pantry",
    },
    {
      account: "restaurant",
      tag: "restaurant",
      reason: "Account path already indicates restaurant",
    },
    {
      account: "grocery",
      tag: "grocery",
      reason: "Account path already indicates grocery",
    },
    {
      account: "coffee",
      tag: "coffee",
      reason: "Account path already indicates coffee",
    },
    {
      account: "online",
      tag: "online",
      reason: "Account path already indicates online",
    },
    {
      account: "local",
      tag: "local",
      reason: "Account path already indicates local",
    },
    {
      account: "cafe",
      tag: "cafe",
      reason: "Account path already indicates cafe",
    },
    {
      account: "takeout",
      tag: "takeout",
      reason: "Account path already indicates takeout",
    },
    {
      account: "delivery",
      tag: "delivery",
      reason: "Account path already indicates delivery",
    },
    {
      account: "premium",
      tag: "premium",
      reason: "Account path already indicates premium",
    },
    {
      account: "budget",
      tag: "budget",
      reason: "Account path already indicates budget",
    },
    {
      account: "organic",
      tag: "organic",
      reason: "Account path already indicates organic",
    },
    {
      account: "conventional",
      tag: "conventional",
      reason: "Account path already indicates conventional",
    },
    {
      account: "personal",
      tag: "personal",
      reason: "Account path already indicates personal",
    },
    {
      account: "business",
      tag: "business",
      reason: "Account path already indicates business",
    },
    {
      account: "breakfast",
      tag: "breakfast",
      reason: "Account path already indicates breakfast",
    },
    {
      account: "lunch",
      tag: "lunch",
      reason: "Account path already indicates lunch",
    },
    {
      account: "dinner",
      tag: "dinner",
      reason: "Account path already indicates dinner",
    },
    // NEW: Misc account redundancy
    {
      account: "misc",
      tag: "miscellaneous",
      reason: "Account path already indicates miscellaneous",
    },
  ],

  // Scoring weights for tag ranking
  SCORING_WEIGHTS: {
    confidence: 0.5, // Increased weight for confidence - prefer exact matches
    relevance: 0.3, // Slightly reduced weight for relevance
    priority: 0.2, // Keep priority weight the same
  },

  // Tag categories that should be prioritized for certain account types
  PRIORITY_CATEGORIES: {
    food: ["ingredient", "cuisine", "diet", "allergen", "quality"],
    transportation: ["mode", "distance", "purpose", "fuel"],
    entertainment: ["medium", "genre", "venue", "activity"],
    shopping: ["category", "brand", "quality", "season"],
    health: ["type", "provider", "urgency", "coverage"],
    utilities: ["service", "provider", "usage", "billing"],
    business: ["legal", "professional", "service"], // NEW: Business category priorities
  },

  // Minimum relevance scores for different tag categories
  CATEGORY_RELEVANCE_THRESHOLDS: {
    food: 0.4, // Food tags need higher relevance
    transportation: 0.5, // Transportation tags need very high relevance
    entertainment: 0.3, // Entertainment tags can be more flexible
    shopping: 0.4, // Shopping tags need good relevance
    health: 0.6, // Health tags need very high relevance
    utilities: 0.5, // Utility tags need high relevance
    business: 0.4, // NEW: Business tags need good relevance
    default: 0.3, // Default threshold for other categories
  },
} as const;

// Helper function to get relevance threshold for a tag category
export function getRelevanceThreshold(tagCategory: string): number {
  return (
    AUTO_TAG_CONFIG.CATEGORY_RELEVANCE_THRESHOLDS[
      tagCategory as keyof typeof AUTO_TAG_CONFIG.CATEGORY_RELEVANCE_THRESHOLDS
    ] || AUTO_TAG_CONFIG.CATEGORY_RELEVANCE_THRESHOLDS.default
  );
}

// Helper function to check if a tag category should be prioritized for an account
export function shouldPrioritizeCategory(
  accountPath: string,
  tagCategory: string
): boolean {
  const accountLower = accountPath.toLowerCase();

  for (const [category, keywords] of Object.entries(
    AUTO_TAG_CONFIG.PRIORITY_CATEGORIES
  )) {
    if (tagCategory === category) {
      return keywords.some((keyword) => accountLower.includes(keyword));
    }
  }

  return false;
}
