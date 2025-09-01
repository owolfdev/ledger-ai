// Database schema types for account mapping system

export type AccountType =
  | "expense"
  | "asset"
  | "liability"
  | "income"
  | "equity";
export type PatternType = "regex" | "exact" | "contains";

// Database table types
export interface AccountPattern {
  id: number;
  pattern_type: PatternType;
  pattern: string;
  account_path: string;
  account_type: AccountType;
  business_context?: string | null;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VendorMapping {
  id: number;
  vendor_name: string;
  vendor_pattern?: string | null;
  account_path: string;
  account_type: AccountType;
  business_context?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessContext {
  id: number;
  business_name: string;
  default_account_type: AccountType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserMapping {
  id: number;
  user_id: string;
  description_pattern: string;
  account_path: string;
  account_type: AccountType;
  business_context?: string | null;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountTypePattern {
  id: number;
  pattern: string;
  account_type: AccountType;
  confidence: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Insert types (for creating new records)
export type InsertAccountPattern = Omit<
  AccountPattern,
  "id" | "created_at" | "updated_at"
>;
export type InsertVendorMapping = Omit<
  VendorMapping,
  "id" | "created_at" | "updated_at"
>;
export type InsertBusinessContext = Omit<
  BusinessContext,
  "id" | "created_at" | "updated_at"
>;
export type InsertUserMapping = Omit<
  UserMapping,
  "id" | "created_at" | "updated_at"
>;
export type InsertAccountTypePattern = Omit<
  AccountTypePattern,
  "id" | "created_at" | "updated_at"
>;

// Update types (for updating existing records)
export type UpdateAccountPattern = Partial<
  Omit<AccountPattern, "id" | "created_at" | "updated_at">
>;
export type UpdateVendorMapping = Partial<
  Omit<VendorMapping, "id" | "created_at" | "updated_at">
>;
export type UpdateBusinessContext = Partial<
  Omit<BusinessContext, "id" | "created_at" | "updated_at">
>;
export type UpdateUserMapping = Partial<
  Omit<UserMapping, "id" | "created_at" | "updated_at">
>;
export type UpdateAccountTypePattern = Partial<
  Omit<AccountTypePattern, "id" | "created_at" | "updated_at">
>;

// Mapping result types
export interface MappingResult {
  account: string;
  account_type: AccountType;
  confidence: number;
  source:
    | "pattern"
    | "vendor"
    | "user"
    | "business_default"
    | "ai"
    | "static_fallback";
  business_context?: string;
}

export interface AccountTypeDetectionResult {
  account_type: AccountType;
  confidence: number;
  pattern_matched?: string;
}

// Query filter types
export interface AccountPatternFilter {
  business_context?: string;
  account_type?: AccountType;
  is_active?: boolean;
}

export interface VendorMappingFilter {
  business_context?: string;
  account_type?: AccountType;
  is_active?: boolean;
}

export interface UserMappingFilter {
  user_id: string;
  business_context?: string;
  account_type?: AccountType;
  is_active?: boolean;
}
