import { createClient } from "@supabase/supabase-js";
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

export class DatabaseAccountMapper {
  private supabase: any;
  private cache = new Map<string, any>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Lazy initialization of Supabase client
  }

  private getSupabase() {
    if (!this.supabase) {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
      );
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
      return {
        account: patternMapping.account_path,
        account_type: patternMapping.account_type,
        confidence: 0.8,
        source: "pattern",
        business_context: patternMapping.business_context || undefined,
      };
    }

    // Try vendor-specific mappings as fallback (for unknown items)
    if (normalizedVendor) {
      const vendorMapping = await this.findVendorMapping(
        normalizedVendor,
        businessContext
      );
      if (vendorMapping) {
        return {
          account: vendorMapping.account_path,
          account_type: vendorMapping.account_type,
          confidence: 0.7, // Lower confidence since it's a fallback
          source: "vendor",
          business_context: vendorMapping.business_context || undefined,
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
  }

  /**
   * Detect account type from description using patterns
   */
  async detectAccountType(
    description: string
  ): Promise<AccountTypeDetectionResult> {
    const normalizedDescription = description.toLowerCase().trim();

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
        } catch (error) {
          console.warn(`Invalid regex pattern: ${pattern.pattern}`, error);
        }
      }
    }

    // Default to expense
    return {
      account_type: "expense",
      confidence: 0.5,
    };
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

    const cacheKey = `user_mapping:${userId}:${description}:${businessContext}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const { data, error } = await this.getSupabase()
      .from("user_mappings")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .or(`business_context.is.null,business_context.eq.${businessContext}`)
      .order("priority", { ascending: false });

    if (error) {
      console.error("Error fetching user mappings:", error);
      return null;
    }

    // Find the best matching pattern
    for (const mapping of data || []) {
      try {
        const regex = new RegExp(mapping.description_pattern, "i");
        if (regex.test(description)) {
          this.setCached(cacheKey, mapping);
          return mapping;
        }
      } catch (error) {
        console.warn(
          `Invalid user mapping pattern: ${mapping.description_pattern}`,
          error
        );
      }
    }

    return null;
  }

  /**
   * Find vendor-specific mapping
   */
  private async findVendorMapping(
    vendor: string,
    businessContext?: string
  ): Promise<VendorMapping | null> {
    const cacheKey = `vendor_mapping:${vendor}:${businessContext}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const { data, error } = await this.getSupabase()
      .from("vendor_mappings")
      .select("*")
      .eq("is_active", true)
      .or(`business_context.is.null,business_context.eq.${businessContext}`)
      .or(`vendor_name.eq.${vendor},vendor_pattern.ilike.%${vendor}%`);

    if (error) {
      console.error("Error fetching vendor mappings:", error);
      return null;
    }

    // Find exact match first, then pattern match
    const exactMatch = data?.find(
      (m) => m.vendor_name.toLowerCase() === vendor
    );
    if (exactMatch) {
      this.setCached(cacheKey, exactMatch);
      return exactMatch;
    }

    // Try pattern matching
    for (const mapping of data || []) {
      if (mapping.vendor_pattern) {
        try {
          const regex = new RegExp(mapping.vendor_pattern, "i");
          if (regex.test(vendor)) {
            this.setCached(cacheKey, mapping);
            return mapping;
          }
        } catch (error) {
          console.warn(
            `Invalid vendor pattern: ${mapping.vendor_pattern}`,
            error
          );
        }
      }
    }

    return null;
  }

  /**
   * Find pattern-based mapping
   */
  private async findPatternMapping(
    description: string,
    businessContext?: string
  ): Promise<AccountPattern | null> {
    const cacheKey = `pattern_mapping:${description}:${businessContext}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const { data, error } = await this.getSupabase()
      .from("account_patterns")
      .select("*")
      .eq("is_active", true)
      .or(`business_context.is.null,business_context.eq.${businessContext}`)
      .order("priority", { ascending: false });

    if (error) {
      console.error("Error fetching account patterns:", error);
      return null;
    }

    // Try each pattern in priority order
    for (const pattern of data || []) {
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
          } catch (error) {
            console.warn(`Invalid regex pattern: ${pattern.pattern}`, error);
          }
          break;
      }

      if (matches) {
        this.setCached(cacheKey, pattern);
        return pattern;
      }
    }

    return null;
  }

  /**
   * Get business default account type
   */
  private async getBusinessDefaultAccountType(
    businessName: string
  ): Promise<AccountType | null> {
    const cacheKey = `business_default:${businessName}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const { data, error } = await this.getSupabase()
      .from("business_contexts")
      .select("default_account_type")
      .eq("business_name", businessName)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      return null;
    }

    this.setCached(cacheKey, data.default_account_type);
    return data.default_account_type;
  }

  /**
   * Get account type patterns
   */
  private async getAccountTypePatterns(): Promise<AccountTypePattern[]> {
    const cacheKey = "account_type_patterns";
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const { data, error } = await this.getSupabase()
      .from("account_type_patterns")
      .select("*")
      .eq("is_active", true)
      .order("confidence", { ascending: false });

    if (error) {
      console.error("Error fetching account type patterns:", error);
      return [];
    }

    this.setCached(cacheKey, data || []);
    return data || [];
  }

  // CRUD Operations for Admin Interface

  /**
   * Create a new account pattern
   */
  async createAccountPattern(
    pattern: InsertAccountPattern
  ): Promise<AccountPattern | null> {
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
  }

  /**
   * Create a new vendor mapping
   */
  async createVendorMapping(
    mapping: InsertVendorMapping
  ): Promise<VendorMapping | null> {
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
  }

  /**
   * Create a new user mapping
   */
  async createUserMapping(
    mapping: InsertUserMapping
  ): Promise<UserMapping | null> {
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
  }

  /**
   * Get all account patterns with optional filtering
   */
  async getAccountPatterns(
    filter?: AccountPatternFilter
  ): Promise<AccountPattern[]> {
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
  }

  /**
   * Get all vendor mappings with optional filtering
   */
  async getVendorMappings(
    filter?: VendorMappingFilter
  ): Promise<VendorMapping[]> {
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
  }

  /**
   * Get user mappings
   */
  async getUserMappings(filter: UserMappingFilter): Promise<UserMapping[]> {
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
  }

  // Cache management
  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
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
}
