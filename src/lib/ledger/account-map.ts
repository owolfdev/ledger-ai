// /lib/ledger/account-map.ts
// Deterministic description→account mapper. Keep rules ordered by priority. No AI.

export type MapAccountOptions = {
  vendor?: string;
  price?: number; // for future threshold-based routing
};

const FALLBACK_ACCOUNT = "Expenses:Personal:Misc";

// Vendor equals rules (highest confidence)
const VENDOR_EXACT: Array<{ name: string; account: string }> = [
  // { name: "apple store", account: "Expenses:Personal:Electronics:Apple" },
  // { name: "samsung", account: "Expenses:Personal:Electronics:Mobile" },
  // { name: "starbucks", account: "Expenses:Personal:Food:Coffee" },
  // { name: "shell", account: "Expenses:Personal:Transport:Fuel" },
  // { name: "tesco", account: "Expenses:Personal:Groceries" },
  // { name: "safeway", account: "Expenses:Personal:Groceries" },
];

// Vendor contains rules (high confidence)
const VENDOR_CONTAINS: Array<{ pattern: RegExp; account: string }> = [
  { pattern: /7\s*eleven|7-?11/i, account: "Expenses:Personal:Groceries" },
  {
    pattern: /amazon\s*coffee|cafe amazon/i,
    account: "Expenses:Personal:Food:Coffee",
  },
  { pattern: /walmart/i, account: "Expenses:Personal:Groceries" },
  { pattern: /costco/i, account: "Expenses:Personal:Groceries" },
];

// Description rules (ordered by specificity)
const DESC_RULES: Array<{ pattern: RegExp; account: string }> = [
  // Electronics
  {
    pattern: /(iphone|ipad|macbook|apple\s*watch|airpods)/i,
    account: "Expenses:Personal:Electronics:Apple",
  },
  {
    pattern: /(pixel\s*(phone|buds|tablet)|google\s*(nest|home))/i,
    account: "Expenses:Personal:Electronics:Google",
  },
  {
    pattern: /(samsung\s*(galaxy|buds|tablet)|android\s*phone)/i,
    account: "Expenses:Personal:Electronics:Mobile",
  },
  {
    pattern: /(laptop|notebook|ultrabook)/i,
    account: "Expenses:Personal:Electronics:Laptops",
  },
  {
    pattern: /(headphone|earbud|speaker|bluetooth)/i,
    account: "Expenses:Personal:Electronics:Audio",
  },
  {
    pattern: /(usb\s*c?|charger|power\s*bank|cable|adapter)/i,
    account: "Expenses:Personal:Electronics:Accessories",
  },

  // Food sub-categories
  {
    pattern: /(butter|milk|cheese|yogurt|cream|dairy|egg|eggs)/i,
    account: "Expenses:Personal:Food:Dairy",
  },
  {
    pattern: /(chicken|beef|pork|meat)/i,
    account: "Expenses:Personal:Food:Meat",
  },
  {
    pattern: /(oat|grain|rice|bread|cereal|pasta|noodle)/i,
    account: "Expenses:Personal:Food:Grains",
  },
  {
    pattern: /(olive|oil|vinegar|sauce|ketchup|condiment|mayonnaise)/i,
    account: "Expenses:Personal:Food:Condiments",
  },
  {
    pattern:
      /(bean|onion|garlic|veg|vegetable|lettuce|tomato|pepper|carrot|broccoli)/i,
    account: "Expenses:Personal:Food:Vegetables",
  },
  {
    pattern: /(lemon|apple|banana|grape|fruit|mango|orange|berry)/i,
    account: "Expenses:Personal:Food:Fruit",
  },
  {
    pattern: /(peanut\s*butter|jam|jelly)/i,
    account: "Expenses:Personal:Food:Pantry",
  },
  {
    pattern: /(coffee|latte|espresso|americano)/i,
    account: "Expenses:Personal:Food:Coffee",
  },
  {
    pattern: /(tea|matcha|oolong|earl\s*grey)/i,
    account: "Expenses:Personal:Food:Tea",
  },
  {
    pattern: /(restaurant|dine|meal|lunch|dinner|snack|takeaway|take\s*out)/i,
    account: "Expenses:Personal:Food:Dining",
  },
  {
    pattern: /(pastr(y|ies)|cake|donut|croissant|muffin|bagel|scone)/i,
    account: "Expenses:Personal:Food:Bakery",
  },

  // Transport & fuel
  {
    pattern: /(gas|fuel|petrol|diesel)/i,
    account: "Expenses:Personal:Transport:Fuel",
  },
  {
    pattern: /(grab|uber|taxi|ride|fare|bts|mrt|metro|bus|train)/i,
    account: "Expenses:Personal:Transport:Transit",
  },

  // Household
  // {
  //   pattern: /(detergent|cleaner|soap|shampoo|toothpaste|toilet\s*paper)/i,
  //   account: "Expenses:Personal:Household:Supplies",
  // },
  {
    pattern: /(towel|linen|sheet|blanket|pillow)/i,
    account: "Expenses:Personal:Household:HomeGoods",
  },

  // Clothing
  {
    pattern: /(shirt|pants|jeans|dress|skirt|jacket|shoe|sneaker|sock)/i,
    account: "Expenses:Personal:Clothing",
  },

  // Health
  {
    pattern: /(vitamin|supplement|medicine|pharmacy|clinic)/i,
    account: "Expenses:Personal:Health",
  },

  // Toiletries
  {
    pattern:
      /(toothpaste|toothbrush|floss|mouthwash|shampoo|conditioner|soap|lotion|deodorant)/i,
    account: "Expenses:Personal:Toiletries",
  },
  {
    pattern: /(detergent|cleaner|soap|shampoo|toothpaste|toilet\s*paper)/i,
    account: "Expenses:Personal:Household:Supplies",
  },

  // Entertainment
  {
    pattern: /(movie|cinema|netflix|spotify|game|concert)/i,
    account: "Expenses:Personal:Entertainment",
  },

  // Taxes (usually handled earlier, but keep as safety net)
  { pattern: /^tax$/i, account: "Expenses:Taxes:Sales" },
];

function findVendorAccount(vendor?: string): string | undefined {
  if (!vendor) return undefined;
  const v = vendor.toLowerCase().trim();
  const exact = VENDOR_EXACT.find((r) => r.name === v);
  if (exact) return exact.account;
  const contains = VENDOR_CONTAINS.find((r) => r.pattern.test(v));
  return contains?.account;
}

function findDescriptionAccount(desc: string): string | undefined {
  for (const r of DESC_RULES) {
    if (r.pattern.test(desc)) return r.account;
  }
  return undefined;
}

export function mapAccount(
  description: string,
  opts: MapAccountOptions = {}
): string {
  const desc = description.toLowerCase().trim();

  // Prefer vendor-based mapping if strong signal.
  const vendorAccount = findVendorAccount(opts.vendor);
  if (vendorAccount) return vendorAccount;

  // Description-based mapping.
  const descAccount = findDescriptionAccount(desc);
  if (descAccount) return descAccount;

  // Optional: price-based routing could be added here (e.g., capitalizeAbove threshold).

  return FALLBACK_ACCOUNT;
}

// Minimal smoke tests (dev-time). Guarded to avoid side effects in prod bundles.
if (process.env.NODE_ENV === "development") {
  // Why: quick sanity check during local builds
  const _a = mapAccount("iPhone 15 Pro");
  const _b = mapAccount("butter");
  const _c = mapAccount("regular gas 91", { vendor: "Shell" });
  void [_a, _b, _c];
}
