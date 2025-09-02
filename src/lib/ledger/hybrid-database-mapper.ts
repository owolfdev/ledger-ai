import { DatabaseAccountMapper } from "./database-account-mapper";
import { mapAccount as mapAccountStatic } from "./account-map";
import type { MappingResult, AccountType } from "@/types/account-mappings";

export type AIAccountMapperOptions = {
  vendor?: string;
  price?: number;
  business?: string;
  useAI?: boolean;
  type?: string; // NEW: transaction type
};

export class HybridDatabaseMapper {
  private dbMapper: DatabaseAccountMapper;

  constructor() {
    this.dbMapper = new DatabaseAccountMapper();
  }

  /**
   * Main mapping function that tries database first, then falls back to static patterns
   */
  async mapAccount(
    description: string,
    vendor?: string,
    businessContext?: string,
    userId?: string,
    type?: string
  ): Promise<MappingResult> {
    try {
      // Try database mapping first
      const dbResult = await this.dbMapper.mapAccount(
        description,
        vendor,
        businessContext,
        userId,
        type
      );

      // If database mapping has good confidence, use it
      if (dbResult.confidence >= 0.5) {
        return dbResult;
      }

      // Fallback to static mapping
      const staticAccount = mapAccountStatic(description, {
        vendor,
        business: businessContext || "Personal",
        type: type || "expense",
      });

      return {
        account: staticAccount,
        account_type: type || "expense", // Use the actual transaction type
        confidence: 0.4, // Lower confidence for static fallback
        source: "static_fallback",
        business_context: businessContext,
      };
    } catch (error) {
      console.warn("Database mapping failed, falling back to static:", error);

      // Fallback to static mapping on error
      const staticAccount = mapAccountStatic(description, {
        vendor,
        business: businessContext || "Personal",
        type: type || "expense",
      });

      return {
        account: staticAccount,
        account_type: type || "expense", // Use the actual transaction type
        confidence: 0.3,
        source: "static_fallback",
        business_context: businessContext,
      };
    }
  }

  /**
   * Detect account type from description
   */
  async detectAccountType(
    description: string
  ): Promise<{ account_type: AccountType; confidence: number }> {
    try {
      const result = await this.dbMapper.detectAccountType(description);
      return result;
    } catch (error) {
      console.warn("Account type detection failed:", error);

      // Default to expense for static fallback
      return {
        account_type: "expense",
        confidence: 0.3,
      };
    }
  }

  /**
   * Get database mapper instance for direct access
   */
  getDatabaseMapper(): DatabaseAccountMapper {
    return this.dbMapper;
  }
}

// Export a singleton instance
export const hybridDatabaseMapper = new HybridDatabaseMapper();

/**
 * Compatibility function that matches the existing mapAccountWithHybridAI interface
 */
export async function mapAccountWithHybridAI(
  description: string,
  opts: AIAccountMapperOptions = {}
): Promise<string> {
  const business = opts.business || "Personal";

  try {
    const result = await hybridDatabaseMapper.mapAccount(
      description,
      opts.vendor,
      business,
      undefined, // userId
      opts.type // type parameter
    );

    return result.account;
  } catch (error) {
    console.warn("Database mapping failed, falling back to static:", error);

    // Fallback to static mapping
    return mapAccountStatic(description, {
      vendor: opts.vendor,
      business,
      type: opts.type || "expense",
    });
  }
}

/**
 * Synchronous version for backward compatibility
 */
export function mapAccount(
  description: string,
  opts: { vendor?: string; business?: string } = {}
): string {
  return mapAccountStatic(description, opts);
}

/**
 * Batch processing for multiple items
 */
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
        `Database batch mapping failed for item ${index}:`,
        result.reason
      );
      // Fallback to static mapping
      return mapAccountStatic(
        items[index].description,
        items[index].opts || {}
      );
    }
  });
}
