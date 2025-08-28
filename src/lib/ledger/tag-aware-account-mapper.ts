// src/lib/ledger/tag-aware-account-mapper.ts
// Dynamic account mapping system that generates patterns from existing tags

import { createClient } from "@/utils/supabase/client";

export interface TagInfo {
  id: string;
  name: string;
  category: string;
  priority: number;
}

export interface DynamicMappingRule {
  pattern: RegExp;
  category: string;
  priority: number;
}

export interface AccountMappingResult {
  account: string;
  confidence: number;
  matchedTag: TagInfo;
}

/**
 * Get all available tags from the database
 */
async function getAllTags(): Promise<TagInfo[]> {
  const supabase = createClient();

  const { data: tags, error } = await supabase
    .from("tags")
    .select("id, name, category, priority")
    .eq("is_active", true)
    .order("priority", { ascending: false });

  if (error) {
    console.error("Error fetching tags for account mapping:", error);
    return [];
  }

  return tags || [];
}

/**
 * Generate dynamic mapping rules from tags
 */
function generateMappingRules(tags: TagInfo[]): DynamicMappingRule[] {
  const rules: DynamicMappingRule[] = [];

  // Group tags by category
  const tagsByCategory = new Map<string, TagInfo[]>();

  for (const tag of tags) {
    if (!tagsByCategory.has(tag.category)) {
      tagsByCategory.set(tag.category, []);
    }
    tagsByCategory.get(tag.category)!.push(tag);
  }

  // Generate rules for each category
  for (const [category, categoryTags] of tagsByCategory) {
    for (const tag of categoryTags) {
      // Create pattern for the tag name
      const pattern = new RegExp(
        `\\b(${tag.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\b`,
        "i"
      );

      // Determine account category based on tag category
      let accountCategory: string;

      switch (category) {
        case "food":
          // For food items, create granular categories
          if (
            tag.name.includes("dairy") ||
            tag.name.includes("milk") ||
            tag.name.includes("cheese")
          ) {
            accountCategory = `Food:Dairy:${
              tag.name.charAt(0).toUpperCase() + tag.name.slice(1)
            }`;
          } else if (
            tag.name.includes("meat") ||
            tag.name.includes("beef") ||
            tag.name.includes("chicken")
          ) {
            accountCategory = `Food:Meat:${
              tag.name.charAt(0).toUpperCase() + tag.name.slice(1)
            }`;
          } else if (
            tag.name.includes("grain") ||
            tag.name.includes("bread") ||
            tag.name.includes("rice")
          ) {
            accountCategory = `Food:Grains:${
              tag.name.charAt(0).toUpperCase() + tag.name.slice(1)
            }`;
          } else if (
            tag.name.includes("fruit") ||
            tag.name.includes("apple") ||
            tag.name.includes("banana")
          ) {
            accountCategory = `Food:Fruit:${
              tag.name.charAt(0).toUpperCase() + tag.name.slice(1)
            }`;
          } else if (
            tag.name.includes("vegetable") ||
            tag.name.includes("tomato") ||
            tag.name.includes("carrot")
          ) {
            accountCategory = `Food:Vegetables:${
              tag.name.charAt(0).toUpperCase() + tag.name.slice(1)
            }`;
          } else if (
            tag.name.includes("pantry") ||
            tag.name.includes("jam") ||
            tag.name.includes("oil")
          ) {
            accountCategory = `Food:Pantry:${
              tag.name.charAt(0).toUpperCase() + tag.name.slice(1)
            }`;
          } else {
            // Default food category
            accountCategory = `Food:${
              tag.name.charAt(0).toUpperCase() + tag.name.slice(1)
            }`;
          }
          break;

        case "transportation":
          accountCategory = `Transport:${
            tag.name.charAt(0).toUpperCase() + tag.name.slice(1)
          }`;
          break;

        case "business":
          accountCategory = `Business:${
            tag.name.charAt(0).toUpperCase() + tag.name.slice(1)
          }`;
          break;

        case "health":
          accountCategory = `Health:${
            tag.name.charAt(0).toUpperCase() + tag.name.slice(1)
          }`;
          break;

        case "entertainment":
          accountCategory = `Entertainment:${
            tag.name.charAt(0).toUpperCase() + tag.name.slice(1)
          }`;
          break;

        case "shopping":
          accountCategory = `Shopping:${
            tag.name.charAt(0).toUpperCase() + tag.name.slice(1)
          }`;
          break;

        case "home":
          accountCategory = `Home:${
            tag.name.charAt(0).toUpperCase() + tag.name.slice(1)
          }`;
          break;

        case "utilities":
          accountCategory = `Utilities:${
            tag.name.charAt(0).toUpperCase() + tag.name.slice(1)
          }`;
          break;

        default:
          accountCategory = `${
            tag.name.charAt(0).toUpperCase() + tag.name.slice(1)
          }`;
      }

      rules.push({
        pattern,
        category: accountCategory,
        priority: tag.priority || 0,
      });
    }
  }

  // Sort by priority (highest first)
  return rules.sort((a, b) => b.priority - a.priority);
}

/**
 * Map account using dynamic rules generated from tags
 */
export async function mapAccountWithTags(
  description: string,
  business: string = "Personal"
): Promise<string> {
  try {
    // Get all available tags
    const tags = await getAllTags();

    if (tags.length === 0) {
      console.warn("No tags found, falling back to generic mapping");
      return `Expenses:${business}:Misc`;
    }

    // Generate dynamic mapping rules
    const rules = generateMappingRules(tags);

    // Find the best matching rule
    for (const rule of rules) {
      if (rule.pattern.test(description)) {
        return `Expenses:${business}:${rule.category}`;
      }
    }

    // No match found, return generic account
    return `Expenses:${business}:Misc`;
  } catch (error) {
    console.error("Error in tag-aware account mapping:", error);
    return `Expenses:${business}:Misc`;
  }
}

/**
 * Get mapping statistics for debugging
 */
export async function getMappingStats(): Promise<{
  totalTags: number;
  generatedRules: number;
  categories: string[];
}> {
  const tags = await getAllTags();
  const rules = generateMappingRules(tags);
  const categories = [...new Set(rules.map((r) => r.category))];

  return {
    totalTags: tags.length,
    generatedRules: rules.length,
    categories,
  };
}

/**
 * Pre-generate all mapping rules for performance
 */
let cachedRules: DynamicMappingRule[] | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getCachedMappingRules(): Promise<DynamicMappingRule[]> {
  const now = Date.now();

  if (!cachedRules || now - lastCacheTime > CACHE_DURATION) {
    const tags = await getAllTags();
    cachedRules = generateMappingRules(tags);
    lastCacheTime = now;
  }

  return cachedRules;
}

/**
 * Clear the mapping rules cache
 */
export function clearMappingCache(): void {
  cachedRules = null;
  lastCacheTime = 0;
}
