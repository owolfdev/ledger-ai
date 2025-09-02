/**
 * Business context normalizer for consistent account mapping
 * Ensures business names are consistently formatted and mapped
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../types/supabase";

export interface BusinessMapping {
  normalized: string;
  display: string;
  accountPrefix: string;
}

// Cache for business mappings to avoid repeated database calls
let businessMappingsCache: Record<string, BusinessMapping> | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get Supabase client
 */
function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables not configured");
  }

  return createClient<Database>(supabaseUrl, supabaseKey);
}

/**
 * Load business mappings from database
 */
async function loadBusinessMappings(): Promise<
  Record<string, BusinessMapping>
> {
  const now = Date.now();

  // Return cached data if still valid
  if (businessMappingsCache && now - cacheTimestamp < CACHE_DURATION) {
    return businessMappingsCache;
  }

  try {
    const supabase = getSupabase();

    // Load from business_contexts table
    const { data: businessContexts, error: contextError } = await supabase
      .from("business_contexts")
      .select("*")
      .eq("is_active", true);

    if (contextError) {
      console.warn("Failed to load business contexts:", contextError);
      return getFallbackMappings();
    }

    // Load from businesses table (user-specific)
    const { data: userBusinesses, error: businessError } = await supabase
      .from("businesses")
      .select("*");

    if (businessError) {
      console.warn("Failed to load user businesses:", businessError);
    }

    const mappings: Record<string, BusinessMapping> = {};

    // Add business contexts
    businessContexts?.forEach((context) => {
      const normalized = context.business_name.toLowerCase();
      mappings[normalized] = {
        normalized: context.business_name,
        display: context.business_name,
        accountPrefix: context.business_name,
      };
    });

    // Add user businesses
    userBusinesses?.forEach((business) => {
      const normalized = business.name.toLowerCase();
      mappings[normalized] = {
        normalized: business.name,
        display: business.name,
        accountPrefix: business.name,
      };
    });

    // Cache the results
    businessMappingsCache = mappings;
    cacheTimestamp = now;

    return mappings;
  } catch (error) {
    console.warn("Error loading business mappings:", error);
    return getFallbackMappings();
  }
}

/**
 * Fallback mappings when database is unavailable
 */
function getFallbackMappings(): Record<string, BusinessMapping> {
  return {
    personal: {
      normalized: "Personal",
      display: "Personal",
      accountPrefix: "Personal",
    },
    mybrick: {
      normalized: "MyBrick",
      display: "MyBrick",
      accountPrefix: "MyBrick",
    },
    channel60: {
      normalized: "Channel60",
      display: "Channel60",
      accountPrefix: "Channel60",
    },
  };
}

/**
 * Custom business name mappings for specific companies
 * These override the automatic normalization for cleaner account names
 */
function getCustomBusinessMappings(): Record<string, BusinessMapping> {
  return {
    // Keha Srisuk variations
    "keha srisuk co., ltd": {
      normalized: "Keha Srisuk Co., Ltd",
      display: "Keha Srisuk Co., Ltd",
      accountPrefix: "KehaSrisuk",
    },
    "keha srisuk co ltd": {
      normalized: "Keha Srisuk Co., Ltd",
      display: "Keha Srisuk Co., Ltd",
      accountPrefix: "KehaSrisuk",
    },
    "keha srisuk": {
      normalized: "Keha Srisuk Co., Ltd",
      display: "Keha Srisuk Co., Ltd",
      accountPrefix: "KehaSrisuk",
    },
    "kaha srisuk company account": {
      normalized: "Keha Srisuk Co., Ltd",
      display: "Keha Srisuk Co., Ltd",
      accountPrefix: "KehaSrisuk",
    },
    "kaha srisuk company": {
      normalized: "Keha Srisuk Co., Ltd",
      display: "Keha Srisuk Co., Ltd",
      accountPrefix: "KehaSrisuk",
    },

    // Madame Viraj variations
    "madame viraj co., ltd": {
      normalized: "Madame Viraj Co., Ltd",
      display: "Madame Viraj Co., Ltd",
      accountPrefix: "MadameViraj",
    },
    "madame viraj co ltd": {
      normalized: "Madame Viraj Co., Ltd",
      display: "Madame Viraj Co., Ltd",
      accountPrefix: "MadameViraj",
    },
    "madame viraj": {
      normalized: "Madame Viraj Co., Ltd",
      display: "Madame Viraj Co., Ltd",
      accountPrefix: "MadameViraj",
    },

    // Whiteline Industries variations
    "whiteline industries co., ltd": {
      normalized: "Whiteline Industries Co., Ltd",
      display: "Whiteline Industries Co., Ltd",
      accountPrefix: "WhitelineIndustries",
    },
    "whiteline industries co ltd": {
      normalized: "Whiteline Industries Co., Ltd",
      display: "Whiteline Industries Co., Ltd",
      accountPrefix: "WhitelineIndustries",
    },
    "whiteline industries": {
      normalized: "Whiteline Industries Co., Ltd",
      display: "Whiteline Industries Co., Ltd",
      accountPrefix: "WhitelineIndustries",
    },
    whiteline: {
      normalized: "Whiteline Industries Co., Ltd",
      display: "Whiteline Industries Co., Ltd",
      accountPrefix: "WhitelineIndustries",
    },
  };
}

/**
 * Normalize business name for consistent account mapping
 * @param businessName - Raw business name from user input
 * @returns Normalized business mapping
 */
export async function normalizeBusinessName(
  businessName: string
): Promise<BusinessMapping> {
  if (!businessName) {
    const mappings = await loadBusinessMappings();
    return mappings["personal"] || getFallbackMappings()["personal"];
  }

  const normalized = businessName.toLowerCase().trim();

  // Check custom mappings first (highest priority)
  const customMappings = getCustomBusinessMappings();
  if (customMappings[normalized]) {
    return customMappings[normalized];
  }

  const mappings = await loadBusinessMappings();

  // Check for exact matches in database
  if (mappings[normalized]) {
    return mappings[normalized];
  }

  // Check for partial matches
  for (const [key, mapping] of Object.entries(mappings)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return mapping;
    }
  }

  // For unknown businesses, create a normalized version
  const cleanName = businessName
    .replace(/[^a-zA-Z0-9\s]/g, "") // Remove special characters
    .replace(/\s+/g, "") // Remove spaces
    .replace(/^(.)/, (match) => match.toUpperCase()); // Capitalize first letter

  return {
    normalized: cleanName,
    display: businessName,
    accountPrefix: cleanName,
  };
}

/**
 * Synchronous version for backward compatibility (uses fallback mappings)
 * @param businessName - Raw business name from user input
 * @returns Normalized business mapping
 */
export function normalizeBusinessNameSync(
  businessName: string
): BusinessMapping {
  if (!businessName) {
    return getFallbackMappings()["personal"];
  }

  const normalized = businessName.toLowerCase().trim();

  // Check custom mappings first (highest priority)
  const customMappings = getCustomBusinessMappings();
  if (customMappings[normalized]) {
    return customMappings[normalized];
  }

  const mappings = getFallbackMappings();

  // Check for exact matches in fallback
  if (mappings[normalized]) {
    return mappings[normalized];
  }

  // Check for partial matches
  for (const [key, mapping] of Object.entries(mappings)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return mapping;
    }
  }

  // For unknown businesses, create a normalized version
  const cleanName = businessName
    .replace(/[^a-zA-Z0-9\s]/g, "") // Remove special characters
    .replace(/\s+/g, "") // Remove spaces
    .replace(/^(.)/, (match) => match.toUpperCase()); // Capitalize first letter

  return {
    normalized: cleanName,
    display: businessName,
    accountPrefix: cleanName,
  };
}

/**
 * Get account path with normalized business context
 * @param accountType - Type of account (Assets, Expenses, etc.)
 * @param businessName - Raw business name
 * @param category - Account category
 * @returns Full account path
 */
export async function buildAccountPath(
  accountType: string,
  businessName: string,
  category: string
): Promise<string> {
  const business = await normalizeBusinessName(businessName);
  return `${accountType}:${business.accountPrefix}:${category}`;
}

/**
 * Get all known business contexts
 */
export async function getKnownBusinesses(): Promise<BusinessMapping[]> {
  const mappings = await loadBusinessMappings();
  return Object.values(mappings);
}

/**
 * Check if a business name is known/standardized
 */
export async function isKnownBusiness(businessName: string): Promise<boolean> {
  const normalized = businessName.toLowerCase().trim();
  const mappings = await loadBusinessMappings();
  return mappings[normalized] !== undefined;
}
