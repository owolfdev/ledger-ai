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

  // Food sub-categories - Granular mapping for precise tracking
  // Dairy products
  {
    pattern: /(butter|margarine|ghee)/i,
    category: "Food:Dairy:Butter",
  },
  {
    pattern: /(egg|eggs|egg\s*white|egg\s*yolk)/i,
    category: "Food:Dairy:Eggs",
  },
  {
    pattern: /(milk|dairy\s*beverage|almond\s*milk|soy\s*milk)/i,
    category: "Food:Dairy:Milk",
  },
  {
    pattern: /(cheese|cheddar|mozzarella|parmesan|brie|gouda)/i,
    category: "Food:Dairy:Cheese",
  },
  {
    pattern: /(yogurt|yoghurt|greek\s*yogurt)/i,
    category: "Food:Dairy:Yogurt",
  },
  {
    pattern: /(cream|heavy\s*cream|whipping\s*cream|sour\s*cream)/i,
    category: "Food:Dairy:Cream",
  },
  {
    pattern: /(dairy|dairy\s*product)/i,
    category: "Food:Dairy",
  },

  // Meat products
  {
    pattern: /(beef|steak|burger|ground\s*beef|beef\s*mince)/i,
    category: "Food:Meat:Beef",
  },
  {
    pattern: /(chicken|poultry|chicken\s*breast|chicken\s*thigh)/i,
    category: "Food:Meat:Chicken",
  },
  {
    pattern: /(pork|bacon|ham|pork\s*chop)/i,
    category: "Food:Meat:Pork",
  },
  {
    pattern: /(fish|salmon|tuna|shrimp|prawn|seafood)/i,
    category: "Food:Meat:Seafood",
  },
  {
    pattern: /(meat|protein)/i,
    category: "Food:Meat",
  },

  // Grain products
  {
    pattern: /(bread|toast|bun|roll|sandwich\s*bread)/i,
    category: "Food:Grains:Bread",
  },
  {
    pattern: /(rice|basmati|jasmine|brown\s*rice|white\s*rice)/i,
    category: "Food:Grains:Rice",
  },
  {
    pattern: /(pasta|spaghetti|penne|macaroni|noodle)/i,
    category: "Food:Grains:Pasta",
  },
  {
    pattern: /(oat|oatmeal|porridge)/i,
    category: "Food:Grains:Oats",
  },
  {
    pattern: /(cereal|breakfast\s*cereal)/i,
    category: "Food:Grains:Cereal",
  },
  {
    pattern: /(grain|grain\s*product)/i,
    category: "Food:Grains",
  },

  // Pantry staples
  {
    pattern: /(jam|jelly|preserve|marmalade)/i,
    category: "Food:Pantry:Jam",
  },
  {
    pattern: /(peanut\s*butter|nut\s*butter|almond\s*butter)/i,
    category: "Food:Pantry:NutButter",
  },
  {
    pattern: /(honey|syrup|maple\s*syrup)/i,
    category: "Food:Pantry:Sweeteners",
  },
  {
    pattern: /(olive\s*oil|vegetable\s*oil|cooking\s*oil)/i,
    category: "Food:Pantry:Oils",
  },
  {
    pattern: /(vinegar|balsamic|apple\s*cider\s*vinegar)/i,
    category: "Food:Pantry:Vinegars",
  },
  {
    pattern: /(sauce|ketchup|mustard|mayonnaise|condiment)/i,
    category: "Food:Pantry:Condiments",
  },
  {
    pattern: /(pantry|pantry\s*staple)/i,
    category: "Food:Pantry",
  },

  // Vegetables
  {
    pattern: /(lettuce|salad|greens|spinach|kale)/i,
    category: "Food:Vegetables:Leafy",
  },
  {
    pattern: /(tomato|tomatoes|cherry\s*tomato)/i,
    category: "Food:Vegetables:Tomatoes",
  },
  {
    pattern: /(onion|garlic|shallot|leek)/i,
    category: "Food:Vegetables:Alliums",
  },
  {
    pattern: /(carrot|carrots|carrot\s*stick)/i,
    category: "Food:Vegetables:Carrots",
  },
  {
    pattern: /(pepper|bell\s*pepper|chili|jalapeno)/i,
    category: "Food:Vegetables:Peppers",
  },
  {
    pattern: /(broccoli|cauliflower|cabbage)/i,
    category: "Food:Vegetables:Cruciferous",
  },
  {
    pattern: /(bean|beans|legume|lentil|chickpea)/i,
    category: "Food:Vegetables:Legumes",
  },
  {
    pattern: /(veg|vegetable|vegetables)/i,
    category: "Food:Vegetables",
  },

  // Fruits
  {
    pattern: /(apple|apples|red\s*apple|green\s*apple)/i,
    category: "Food:Fruit:Apples",
  },
  {
    pattern: /(banana|bananas|banana\s*bunch)/i,
    category: "Food:Fruit:Bananas",
  },
  {
    pattern: /(orange|oranges|mandarin|tangerine)/i,
    category: "Food:Fruit:Citrus",
  },
  {
    pattern: /(grape|grapes|grape\s*bunch)/i,
    category: "Food:Fruit:Grapes",
  },
  {
    pattern: /(mango|mangoes|mango\s*fruit)/i,
    category: "Food:Fruit:Mangoes",
  },
  {
    pattern: /(berry|berries|strawberry|blueberry|raspberry)/i,
    category: "Food:Fruit:Berries",
  },
  {
    pattern: /(lemon|lemons|lime|limes)/i,
    category: "Food:Fruit:Citrus",
  },
  {
    pattern: /(fruit|fruits)/i,
    category: "Food:Fruit",
  },

  // Beverages
  {
    pattern: /(coffee|latte|espresso|americano|cappuccino)/i,
    category: "Food:Coffee",
  },
  {
    pattern: /(tea|matcha|oolong|earl\s*grey|green\s*tea)/i,
    category: "Food:Tea",
  },
  {
    pattern: /(beer|ale|lager|stout|pilsner|craft\s*beer)/i,
    category: "Food:Beer",
  },
  {
    pattern: /(wine|red\s*wine|white\s*wine|champagne|sparkling)/i,
    category: "Food:Wine",
  },

  // Dining
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
