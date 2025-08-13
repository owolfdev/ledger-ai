// /lib/ledger/account-map.ts
// Deterministic description→account mapper with business context support

export type MapAccountOptions = {
  vendor?: string;
  price?: number; // for future threshold-based routing
  business?: string; // NEW: business context for account hierarchy
};

// Business rules - maps description patterns to account categories (without business prefix)
const DESC_CATEGORY_RULES: Array<{ pattern: RegExp; category: string }> = [
  // Electronics
  {
    pattern: /(iphone|ipad|macbook|apple\s*watch|airpods)/i,
    category: "Electronics:Apple",
  },
  {
    pattern: /(pixel\s*(phone|buds|tablet)|google\s*(nest|home))/i,
    category: "Electronics:Google",
  },
  {
    pattern: /(samsung\s*(galaxy|buds|tablet)|android\s*phone)/i,
    category: "Electronics:Mobile",
  },
  {
    pattern: /(laptop|notebook|ultrabook)/i,
    category: "Electronics:Laptops",
  },
  {
    pattern: /(headphone|earbud|speaker|bluetooth)/i,
    category: "Electronics:Audio",
  },
  {
    pattern: /(usb\s*c?|charger|power\s*bank|cable|adapter)/i,
    category: "Electronics:Accessories",
  },

  // Food sub-categories
  {
    pattern: /(butter|milk|cheese|yogurt|cream|dairy|egg|eggs)/i,
    category: "Food:Dairy",
  },
  {
    pattern: /(chicken|beef|pork|meat)/i,
    category: "Food:Meat",
  },
  {
    pattern: /(oat|grain|rice|bread|cereal|pasta|noodle)/i,
    category: "Food:Grains",
  },
  {
    pattern: /(olive|oil|vinegar|sauce|ketchup|condiment|mayonnaise)/i,
    category: "Food:Condiments",
  },
  {
    pattern:
      /(bean|onion|garlic|veg|vegetable|lettuce|tomato|pepper|carrot|broccoli)/i,
    category: "Food:Vegetables",
  },
  {
    pattern: /(lemon|apple|banana|grape|fruit|mango|orange|berry)/i,
    category: "Food:Fruit",
  },
  {
    pattern: /(peanut\s*butter|jam|jelly)/i,
    category: "Food:Pantry",
  },
  {
    pattern: /(coffee|latte|espresso|americano)/i,
    category: "Food:Coffee",
  },
  {
    pattern: /(tea|matcha|oolong|earl\s*grey)/i,
    category: "Food:Tea",
  },
  {
    pattern: /(restaurant|dine|meal|lunch|dinner|snack|takeaway|take\s*out)/i,
    category: "Food:Dining",
  },
  {
    pattern: /(pastr(y|ies)|cake|donut|croissant|muffin|bagel|scone)/i,
    category: "Food:Bakery",
  },
  {
    pattern: /(groceries|grocery)/i,
    category: "Food:Groceries",
  },

  // Transport & fuel
  {
    pattern: /(gas|fuel|petrol|diesel)/i,
    category: "Transport:Fuel",
  },
  {
    pattern: /(grab|uber|taxi|ride|fare|bts|mrt|metro|bus|train)/i,
    category: "Transport:Transit",
  },

  // Business-specific categories
  {
    pattern: /(subscription|saas|software|hosting|domain)/i,
    category: "Subscription:Software",
  },
  {
    pattern: /(supabase|vercel|netlify|aws|digital\s*ocean)/i,
    category: "Subscription:Infrastructure",
  },
  {
    pattern: /(supplies|inventory|stock|materials)/i,
    category: "Supplies:General",
  },
  {
    pattern: /(napkin|paper|cup|bag|packaging)/i,
    category: "Supplies:Packaging",
  },
  {
    pattern: /(marketing|advertising|ads|promotion)/i,
    category: "Marketing:Advertising",
  },

  // Household
  {
    pattern: /(towel|linen|sheet|blanket|pillow)/i,
    category: "Household:HomeGoods",
  },
  {
    pattern: /(detergent|cleaner|soap|shampoo|toothpaste|toilet\s*paper)/i,
    category: "Household:Supplies",
  },

  // Personal categories
  {
    pattern: /(shirt|pants|jeans|dress|skirt|jacket|shoe|sneaker|sock)/i,
    category: "Clothing",
  },
  {
    pattern: /(vitamin|supplement|medicine|pharmacy|clinic)/i,
    category: "Health",
  },
  {
    pattern:
      /(toothpaste|toothbrush|floss|mouthwash|shampoo|conditioner|soap|lotion|deodorant)/i,
    category: "Toiletries",
  },
  {
    pattern: /(movie|cinema|netflix|spotify|game|concert)/i,
    category: "Entertainment",
  },

  // Taxes (special case - goes to Expenses:Taxes, not business-specific)
  { pattern: /^tax$/i, category: "Taxes:Sales" },
];

// Vendor-specific mappings (without business prefix)
const VENDOR_EXACT: Array<{ name: string; category: string }> = [
  // Add vendor-specific mappings here
];

const VENDOR_CONTAINS: Array<{ pattern: RegExp; category: string }> = [
  { pattern: /7\s*eleven|7-?11/i, category: "Groceries" },
  { pattern: /amazon\s*coffee|cafe amazon/i, category: "Food:Coffee" },
  { pattern: /walmart/i, category: "Groceries" },
  { pattern: /costco/i, category: "Groceries" },
];

function buildAccountFromCategory(category: string, business: string): string {
  // Special case: Taxes don't use business prefix
  if (category.startsWith("Taxes:")) {
    return `Expenses:${category}`;
  }

  return `Expenses:${business}:${category}`;
}

function findVendorCategory(vendor?: string): string | undefined {
  if (!vendor) return undefined;
  const v = vendor.toLowerCase().trim();

  const exact = VENDOR_EXACT.find((r) => r.name === v);
  if (exact) return exact.category;

  const contains = VENDOR_CONTAINS.find((r) => r.pattern.test(v));
  return contains?.category;
}

function findDescriptionCategory(desc: string): string | undefined {
  for (const r of DESC_CATEGORY_RULES) {
    if (r.pattern.test(desc)) return r.category;
  }
  return undefined;
}

export function mapAccount(
  description: string,
  opts: MapAccountOptions = {}
): string {
  const desc = description.toLowerCase().trim();
  const business = opts.business || "Personal";

  // Prefer vendor-based mapping if strong signal
  const vendorCategory = findVendorCategory(opts.vendor);
  if (vendorCategory) {
    return buildAccountFromCategory(vendorCategory, business);
  }

  // Description-based mapping
  const descCategory = findDescriptionCategory(desc);
  if (descCategory) {
    return buildAccountFromCategory(descCategory, business);
  }

  // Fallback to Misc
  return `Expenses:${business}:Misc`;
}

// Helper function to get available business names (for future business management)
export function getDefaultBusiness(): string {
  return "Personal";
}

// Minimal smoke tests (dev-time)
if (process.env.NODE_ENV === "development") {
  const _a = mapAccount("iPhone 15 Pro"); // Should be Expenses:Personal:Electronics:Apple
  const _b = mapAccount("butter", { business: "MyBrickAndMortar" }); // Should be Expenses:MyBrickAndMortar:Food:Dairy
  const _c = mapAccount("supabase subscription", {
    business: "MyOnlineBusiness",
  }); // Should be Expenses:MyOnlineBusiness:Subscription:Infrastructure
  void [_a, _b, _c];
}
