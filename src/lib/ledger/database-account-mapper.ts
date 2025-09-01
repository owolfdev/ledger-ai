import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type {
  AccountPattern,
  VendorMapping,
  BusinessContext,
  UserMapping,
  AccountTypePattern,
  MappingResult,
  AccountTypeDetectionResult,
  AccountType,
  AccountPatternFilter,
  VendorMappingFilter,
  UserMappingFilter,
  InsertAccountPattern,
  InsertVendorMapping,
  InsertUserMapping,
} from "@/types/account-mappings";

// Define database schema types for better type safety
interface Database {
  public: {
    Tables: {
      account_patterns: {
        Row: AccountPattern;
        Insert: InsertAccountPattern;
        Update: Partial<InsertAccountPattern>;
      };
      vendor_mappings: {
        Row: VendorMapping;
        Insert: InsertVendorMapping;
        Update: Partial<InsertVendorMapping>;
      };
      user_mappings: {
        Row: UserMapping;
        Insert: InsertUserMapping;
        Update: Partial<InsertUserMapping>;
      };
      account_type_patterns: {
        Row: AccountTypePattern;
        Insert: Partial<AccountTypePattern>;
        Update: Partial<AccountTypePattern>;
      };
      business_contexts: {
        Row: BusinessContext;
        Insert: Partial<BusinessContext>;
        Update: Partial<BusinessContext>;
      };
    };
  };
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class DatabaseAccountMapper {
  private supabase: SupabaseClient<Database> | null = null;
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Lazy initialization of Supabase client
  }

  private getSupabase(): SupabaseClient<Database> {
    if (!this.supabase) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!url || !key) {
        throw new Error(
          "Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
        );
      }

      this.supabase = createClient<Database>(url, key);
    }
    return this.supabase;
  }

  /**
   * Main mapping function that tries all mapping strategies
   */
  async mapAccount(
    description: string,
    vendor?: string,
    businessContext?: string,
    userId?: string
  ): Promise<MappingResult> {
    const normalizedDescription = description.toLowerCase().trim();
    const normalizedVendor = vendor?.toLowerCase().trim();

    try {
      // Try user-specific mappings first (highest priority)
      if (userId) {
        const userMapping = await this.findUserMapping(
          normalizedDescription,
          businessContext,
          userId
        );
        if (userMapping) {
          return {
            account: userMapping.account_path,
            account_type: userMapping.account_type,
            confidence: 0.95,
            source: "user",
            business_context: userMapping.business_context || undefined,
          };
        }
      }

      // Try pattern-based mappings FIRST (higher priority for specific items)
      const patternMapping = await this.findPatternMapping(
        normalizedDescription,
        businessContext
      );
      if (patternMapping) {
        // Build account path dynamically with business context
        let accountPath = patternMapping.account_path;

        // If pattern has business context, use it as-is
        if (patternMapping.business_context) {
          accountPath = patternMapping.account_path;
        } else {
          // Otherwise, inject business context into the path
          // Convert "Expenses:Food:Coffee" to "Expenses:Channel60:Food:Coffee"
          const pathParts = patternMapping.account_path.split(":");
          if (pathParts.length >= 3 && businessContext) {
            // Insert business context after "Expenses"
            pathParts.splice(1, 0, businessContext);
            accountPath = pathParts.join(":");
          }
        }

        return {
          account: accountPath,
          account_type: patternMapping.account_type,
          confidence: 0.8,
          source: "pattern",
          business_context: patternMapping.business_context || businessContext,
        };
      }

      // Try vendor-specific mappings as fallback (for unknown items)
      if (normalizedVendor) {
        const vendorMapping = await this.findVendorMapping(
          normalizedVendor,
          businessContext
        );
        if (vendorMapping) {
          // Build account path dynamically with business context
          let accountPath = vendorMapping.account_path;

          // If vendor mapping has business context, use it as-is
          if (vendorMapping.business_context) {
            accountPath = vendorMapping.account_path;
          } else {
            // Otherwise, inject business context into the path
            const pathParts = vendorMapping.account_path.split(":");
            if (pathParts.length >= 3 && businessContext) {
              // Insert business context after "Expenses"
              pathParts.splice(1, 0, businessContext);
              accountPath = pathParts.join(":");
            }
          }

          return {
            account: accountPath,
            account_type: vendorMapping.account_type,
            confidence: 0.7, // Lower confidence since it's a fallback
            source: "vendor",
            business_context: vendorMapping.business_context || businessContext,
          };
        }
      }

      // Fallback to business default
      if (businessContext) {
        const businessDefault = await this.getBusinessDefaultAccountType(
          businessContext
        );
        if (businessDefault) {
          return {
            account: `Expenses:${businessContext}:Misc`,
            account_type: businessDefault,
            confidence: 0.5,
            source: "business_default",
            business_context: businessContext,
          };
        }
      }

      // Final fallback
      return {
        account: "Expenses:Misc",
        account_type: "expense",
        confidence: 0.3,
        source: "pattern",
      };
    } catch (error) {
      console.error("Error in mapAccount:", error);
      // Return safe fallback on any error
      return {
        account: "Expenses:Misc",
        account_type: "expense",
        confidence: 0.1,
        source: "pattern",
      };
    }
  }

  /**
   * Detect account type from description using patterns
   */
  async detectAccountType(
    description: string
  ): Promise<AccountTypeDetectionResult> {
    const normalizedDescription = description.toLowerCase().trim();

    try {
      const patterns = await this.getAccountTypePatterns();

      for (const pattern of patterns) {
        if (pattern.is_active) {
          try {
            const regex = new RegExp(pattern.pattern, "i");
            if (regex.test(normalizedDescription)) {
              return {
                account_type: pattern.account_type,
                confidence: pattern.confidence,
                pattern_matched: pattern.pattern,
              };
            }
          } catch (regexError) {
            console.warn(
              `Invalid regex pattern: ${pattern.pattern}`,
              regexError
            );
            continue;
          }
        }
      }

      // Default to expense
      return {
        account_type: "expense",
        confidence: 0.5,
      };
    } catch (error) {
      console.error("Error in detectAccountType:", error);
      return {
        account_type: "expense",
        confidence: 0.1,
      };
    }
  }

  /**
   * Find user-specific mapping
   */
  private async findUserMapping(
    description: string,
    businessContext?: string,
    userId?: string
  ): Promise<UserMapping | null> {
    if (!userId) return null;

    const cacheKey = `user_mapping:${userId}:${description}:${
      businessContext || ""
    }`;
    const cached = this.getCached<UserMapping>(cacheKey);
    if (cached) return cached;

    try {
      let query = this.getSupabase()
        .from("user_mappings")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("priority", { ascending: false });

      if (businessContext) {
        query = query.or(
          `business_context.is.null,business_context.eq.${businessContext}`
        );
      } else {
        query = query.is("business_context", null);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching user mappings:", error);
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      // Find the best matching pattern
      for (const mapping of data) {
        try {
          const regex = new RegExp(mapping.description_pattern, "i");
          if (regex.test(description)) {
            this.setCached(cacheKey, mapping);
            return mapping;
          }
        } catch (regexError) {
          console.warn(
            `Invalid user mapping pattern: ${mapping.description_pattern}`,
            regexError
          );
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error("Error in findUserMapping:", error);
      return null;
    }
  }

  /**
   * Find vendor-specific mapping
   */
  private async findVendorMapping(
    vendor: string,
    businessContext?: string
  ): Promise<VendorMapping | null> {
    const cacheKey = `vendor_mapping:${vendor}:${businessContext || ""}`;
    const cached = this.getCached<VendorMapping>(cacheKey);
    if (cached) return cached;

    try {
      let query = this.getSupabase()
        .from("vendor_mappings")
        .select("*")
        .eq("is_active", true)
        .or(`vendor_name.eq.${vendor},vendor_pattern.ilike.%${vendor}%`);

      if (businessContext) {
        query = query.or(
          `business_context.is.null,business_context.eq.${businessContext}`
        );
      } else {
        query = query.is("business_context", null);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching vendor mappings:", error);
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      // Find exact match first, then pattern match
      const exactMatch = data.find(
        (m) => m.vendor_name.toLowerCase() === vendor
      );
      if (exactMatch) {
        this.setCached(cacheKey, exactMatch);
        return exactMatch;
      }

      // Try pattern matching
      for (const mapping of data) {
        if (mapping.vendor_pattern) {
          try {
            const regex = new RegExp(mapping.vendor_pattern, "i");
            if (regex.test(vendor)) {
              this.setCached(cacheKey, mapping);
              return mapping;
            }
          } catch (regexError) {
            console.warn(
              `Invalid vendor pattern: ${mapping.vendor_pattern}`,
              regexError
            );
            continue;
          }
        }
      }

      return null;
    } catch (error) {
      console.error("Error in findVendorMapping:", error);
      return null;
    }
  }

  /**
   * Find pattern-based mapping
   */
  private async findPatternMapping(
    description: string,
    businessContext?: string
  ): Promise<AccountPattern | null> {
    const cacheKey = `pattern_mapping:${description}:${businessContext || ""}`;
    const cached = this.getCached<AccountPattern>(cacheKey);
    if (cached) return cached;

    try {
      let query = this.getSupabase()
        .from("account_patterns")
        .select("*")
        .eq("is_active", true)
        .order("priority", { ascending: false });

      if (businessContext) {
        query = query.or(
          `business_context.is.null,business_context.eq.${businessContext}`
        );
      } else {
        query = query.is("business_context", null);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching account patterns:", error);
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      // Try each pattern in priority order
      for (const pattern of data) {
        let matches = false;

        switch (pattern.pattern_type) {
          case "exact":
            matches = description === pattern.pattern.toLowerCase();
            break;
          case "contains":
            matches = description.includes(pattern.pattern.toLowerCase());
            break;
          case "regex":
            try {
              const regex = new RegExp(pattern.pattern, "i");
              matches = regex.test(description);
            } catch (regexError) {
              console.warn(
                `Invalid regex pattern: ${pattern.pattern}`,
                regexError
              );
              continue;
            }
            break;
          default:
            console.warn(`Unknown pattern type: ${pattern.pattern_type}`);
            continue;
        }

        if (matches) {
          this.setCached(cacheKey, pattern);
          return pattern;
        }
      }

      return null;
    } catch (error) {
      console.error("Error in findPatternMapping:", error);
      return null;
    }
  }

  /**
   * Get business default account type
   */
  private async getBusinessDefaultAccountType(
    businessName: string
  ): Promise<AccountType | null> {
    const cacheKey = `business_default:${businessName}`;
    const cached = this.getCached<AccountType>(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await this.getSupabase()
        .from("business_contexts")
        .select("default_account_type")
        .eq("business_name", businessName)
        .eq("is_active", true)
        .single();

      if (error) {
        console.error("Error fetching business default:", error);
        return null;
      }

      if (!data?.default_account_type) {
        return null;
      }

      this.setCached(cacheKey, data.default_account_type);
      return data.default_account_type;
    } catch (error) {
      console.error("Error in getBusinessDefaultAccountType:", error);
      return null;
    }
  }

  /**
   * Get account type patterns
   */
  private async getAccountTypePatterns(): Promise<AccountTypePattern[]> {
    const cacheKey = "account_type_patterns";
    const cached = this.getCached<AccountTypePattern[]>(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await this.getSupabase()
        .from("account_type_patterns")
        .select("*")
        .eq("is_active", true)
        .order("confidence", { ascending: false });

      if (error) {
        console.error("Error fetching account type patterns:", error);
        return [];
      }

      const patterns = data || [];
      this.setCached(cacheKey, patterns);
      return patterns;
    } catch (error) {
      console.error("Error in getAccountTypePatterns:", error);
      return [];
    }
  }

  // CRUD Operations for Admin Interface

  /**
   * Create a new account pattern
   */
  async createAccountPattern(
    pattern: InsertAccountPattern
  ): Promise<AccountPattern | null> {
    try {
      const { data, error } = await this.getSupabase()
        .from("account_patterns")
        .insert(pattern)
        .select()
        .single();

      if (error) {
        console.error("Error creating account pattern:", error);
        return null;
      }

      this.clearCache();
      return data;
    } catch (error) {
      console.error("Error in createAccountPattern:", error);
      return null;
    }
  }

  /**
   * Create a new vendor mapping
   */
  async createVendorMapping(
    mapping: InsertVendorMapping
  ): Promise<VendorMapping | null> {
    try {
      const { data, error } = await this.getSupabase()
        .from("vendor_mappings")
        .insert(mapping)
        .select()
        .single();

      if (error) {
        console.error("Error creating vendor mapping:", error);
        return null;
      }

      this.clearCache();
      return data;
    } catch (error) {
      console.error("Error in createVendorMapping:", error);
      return null;
    }
  }

  /**
   * Create a new user mapping
   */
  async createUserMapping(
    mapping: InsertUserMapping
  ): Promise<UserMapping | null> {
    try {
      const { data, error } = await this.getSupabase()
        .from("user_mappings")
        .insert(mapping)
        .select()
        .single();

      if (error) {
        console.error("Error creating user mapping:", error);
        return null;
      }

      this.clearCache();
      return data;
    } catch (error) {
      console.error("Error in createUserMapping:", error);
      return null;
    }
  }

  /**
   * Get all account patterns with optional filtering
   */
  async getAccountPatterns(
    filter?: AccountPatternFilter
  ): Promise<AccountPattern[]> {
    try {
      let query = this.getSupabase()
        .from("account_patterns")
        .select("*")
        .order("priority", { ascending: false });

      if (filter?.business_context) {
        query = query.or(
          `business_context.is.null,business_context.eq.${filter.business_context}`
        );
      }
      if (filter?.account_type) {
        query = query.eq("account_type", filter.account_type);
      }
      if (filter?.is_active !== undefined) {
        query = query.eq("is_active", filter.is_active);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching account patterns:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error in getAccountPatterns:", error);
      return [];
    }
  }

  /**
   * Get all vendor mappings with optional filtering
   */
  async getVendorMappings(
    filter?: VendorMappingFilter
  ): Promise<VendorMapping[]> {
    try {
      let query = this.getSupabase()
        .from("vendor_mappings")
        .select("*")
        .order("vendor_name");

      if (filter?.business_context) {
        query = query.or(
          `business_context.is.null,business_context.eq.${filter.business_context}`
        );
      }
      if (filter?.account_type) {
        query = query.eq("account_type", filter.account_type);
      }
      if (filter?.is_active !== undefined) {
        query = query.eq("is_active", filter.is_active);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching vendor mappings:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error in getVendorMappings:", error);
      return [];
    }
  }

  /**
   * Get user mappings
   */
  async getUserMappings(filter: UserMappingFilter): Promise<UserMapping[]> {
    try {
      let query = this.getSupabase()
        .from("user_mappings")
        .select("*")
        .eq("user_id", filter.user_id)
        .order("priority", { ascending: false });

      if (filter.business_context) {
        query = query.or(
          `business_context.is.null,business_context.eq.${filter.business_context}`
        );
      }
      if (filter.account_type) {
        query = query.eq("account_type", filter.account_type);
      }
      if (filter.is_active !== undefined) {
        query = query.eq("is_active", filter.is_active);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching user mappings:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error in getUserMappings:", error);
      return [];
    }
  }

  // Cache management with proper typing
  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    if (Date.now() - cached.timestamp >= this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  private setCached<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  private clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear specific cache entries by pattern
   */
  clearCacheByPattern(pattern: string): void {
    const regex = new RegExp(pattern, "i");
    for (const [key] of this.cache) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}
