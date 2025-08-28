// /lib/ledger/account-mappings.ts
// Account mapping types and loading functions

export interface AccountMapping {
  accountPath: string;
  type: "asset" | "liability" | "equity" | "income" | "expense";
  category: string;
  isDefault?: boolean;
}

export interface AccountMappingsData {
  paymentMethods: Record<string, AccountMapping>;
}

// Load account mappings from JSON file
export function loadAccountMappings(): AccountMappingsData {
  // For now, we'll use the fallback mappings which include all our current mappings
  // In Phase 3, this will read from the JSON file or database
  return getFallbackMappings();
}

// Get default payment method
export function getDefaultPaymentMethod(): string {
  const mappings = loadAccountMappings();
  const defaultMethod = Object.entries(mappings.paymentMethods).find(
    ([, mapping]) => mapping.isDefault
  );

  if (defaultMethod) {
    return defaultMethod[1].accountPath;
  }

  // Fallback to kasikorn if no default is set
  return "Assets:Bank:Kasikorn:Personal";
}

// Get payment method by alias
export function getPaymentMethodByAlias(alias: string): string | undefined {
  const mappings = loadAccountMappings();
  const mapping = mappings.paymentMethods[alias.toLowerCase()];
  return mapping?.accountPath;
}

// Fallback mappings in case JSON file is corrupted or missing
function getFallbackMappings(): AccountMappingsData {
  return {
    paymentMethods: {
      kasikorn: {
        accountPath: "Assets:Bank:Kasikorn:Personal",
        type: "asset",
        category: "bank",
        isDefault: true,
      },
      kbank: {
        accountPath: "Assets:Bank:Kasikorn:Personal",
        type: "asset",
        category: "bank",
      },
      "thai bank": {
        accountPath: "Assets:Bank:Kasikorn:Personal",
        type: "asset",
        category: "bank",
      },
      "thai-bank": {
        accountPath: "Assets:Bank:Kasikorn:Personal",
        type: "asset",
        category: "bank",
      },
      bank: {
        accountPath: "Assets:Bank:Kasikorn:Personal",
        type: "asset",
        category: "bank",
      },
      "credit kbank": {
        accountPath: "Liabilities:Kasikorn:Personal:CreditCard",
        type: "liability",
        category: "credit",
      },
      "channel 60": {
        accountPath: "Assets:Bank:Channel60:Savings",
        type: "asset",
        category: "bank",
      },
      "channel 60 current": {
        accountPath: "Assets:Bank:Channel60:Current",
        type: "asset",
        category: "bank",
      },
      "bkk bank": {
        accountPath: "Assets:Bank:BangkokBank:Personal:Savings",
        type: "asset",
        category: "bank",
      },
      cash: {
        accountPath: "Assets:Cash",
        type: "asset",
        category: "cash",
      },
      "credit card": {
        accountPath: "Liabilities:CreditCard",
        type: "liability",
        category: "credit",
      },
      "bank card": {
        accountPath: "Assets:Bank:Checking",
        type: "asset",
        category: "bank",
      },
      paypal: {
        accountPath: "Assets:PayPal",
        type: "asset",
        category: "digital",
      },
    },
  };
}
