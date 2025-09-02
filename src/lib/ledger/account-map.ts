// /lib/ledger/account-map.ts
// Deterministic description→account mapper with business context support

export type MapAccountOptions = {
  vendor?: string;
  price?: number; // for future threshold-based routing
  business?: string; // NEW: business context for account hierarchy
  type?: string; // NEW: transaction type (expense, income, asset, liability, transfer)
};

// Business rules - maps description patterns to account categories (without business prefix)
const DESC_CATEGORY_RULES: Array<{ pattern: RegExp; category: string }> = [
  // Income patterns (NEW)
  {
    pattern: /(salary|wage|payroll|employment|job)/i,
    category: "Employment:Salary",
  },
  {
    pattern: /(freelance|freelancing|contract|contracting|design|designing)/i,
    category: "Freelance:Services",
  },
  {
    pattern: /(consulting|consultant|professional\s*service)/i,
    category: "Professional:Consulting",
  },
  {
    pattern: /(investment|dividend|interest|capital\s*gains)/i,
    category: "Investment:Returns",
  },
  {
    pattern: /(rental|rent\s*income|property\s*income)/i,
    category: "Rental:Income",
  },
  {
    pattern: /(business\s*income|revenue|sales)/i,
    category: "Business:Revenue",
  },

  // Asset patterns (NEW)
  {
    pattern: /(laptop|computer|desktop|macbook|pc)/i,
    category: "Electronics:Computer",
  },
  {
    pattern: /(phone|iphone|android|mobile)/i,
    category: "Electronics:Phone",
  },
  {
    pattern: /(car|vehicle|automobile|truck)/i,
    category: "Transportation:Vehicle",
  },
  {
    pattern: /(furniture|desk|chair|table)/i,
    category: "Office:Furniture",
  },
  {
    pattern: /(equipment|machinery|tools)/i,
    category: "Business:Equipment",
  },

  // Liability patterns (NEW)
  {
    pattern: /(credit\s*card|debt|loan|mortgage)/i,
    category: "Debt:CreditCard",
  },
  {
    pattern: /(student\s*loan|education\s*loan)/i,
    category: "Debt:Education",
  },
  {
    pattern: /(car\s*loan|auto\s*loan|vehicle\s*loan)/i,
    category: "Debt:Vehicle",
  },
  {
    pattern: /(home\s*loan|house\s*loan|mortgage)/i,
    category: "Debt:Mortgage",
  },

  // Professional Services (NEW - fixes legal fee issue)
  {
    pattern: /(legal|lawyer|attorney|legal\s*fee|legal\s*service|law\s*firm)/i,
    category: "Professional:Legal",
  },
  {
    pattern: /(architect|architectural|design\s*service)/i,
    category: "Professional:Architecture",
  },
  {
    pattern: /(accountant|accounting|bookkeeping)/i,
    category: "Professional:Accounting",
  },

  // Utilities & Housing (NEW)
  {
    pattern: /(rent|rental)/i,
    category: "Housing:Rent",
  },
  {
    pattern: /(electricity|electric|power)/i,
    category: "Utilities:Electricity",
  },
  {
    pattern: /(water|water\s*bill)/i,
    category: "Utilities:Water",
  },
  {
    pattern: /(internet\s*home|wifi|broadband)/i,
    category: "Utilities:Internet",
  },
  {
    pattern: /(phone\s*bill|mobile\s*bill)/i,
    category: "Utilities:Phone",
  },
  {
    pattern: /(condo\s*fee|management\s*fee|maintenance\s*fee)/i,
    category: "Housing:Fees",
  },
  {
    pattern: /(cleaning\s*supplies|appliances)/i,
    category: "Home:Supplies",
  },

  // Financial Services (NEW)
  {
    pattern: /(bank\s*fee|banking\s*fee|atm\s*fee|transfer\s*fee)/i,
    category: "Financial:Fees",
  },
  {
    pattern: /(cash\s*withdrawal|money\s*transfer)/i,
    category: "Financial:Transfer",
  },
  {
    pattern: /(insurance|health\s*insurance)/i,
    category: "Financial:Insurance",
  },

  // Electronics & Shopping (NEW - more granular)
  {
    pattern: /(iphone|ipad|macbook|apple\s*watch|airpods)/i,
    category: "Electronics:Apple",
  },
  {
    pattern: /(itunes|app\s*store)/i,
    category: "Subscription:Apple",
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
  {
    pattern: /(phone\s*accessories|phone\s*case)/i,
    category: "Electronics:Phone",
  },
  {
    pattern: /(lazada|online\s*shopping)/i,
    category: "Shopping:Online",
  },
  {
    pattern: /(jewelry|accessories|bag|purse)/i,
    category: "Shopping:Accessories",
  },
  {
    pattern: /(furniture|home\s*decor)/i,
    category: "Shopping:Home",
  },

  // Thai-Specific Foods (NEW)
  {
    pattern: /(pad\s*thai|som\s*tam|tom\s*yum|mango\s*sticky\s*rice)/i,
    category: "Food:Thai",
  },
  {
    pattern: /(instant\s*noodles|mama\s*noodles|mama)/i,
    category: "Food:Noodles:Instant",
  },
  {
    pattern: /(street\s*food|food\s*court)/i,
    category: "Food:Dining:StreetFood",
  },
  {
    pattern: /(japanese|sushi|ramen|sashimi)/i,
    category: "Food:Japanese",
  },
  {
    pattern: /(korean|kimchi|bulgogi)/i,
    category: "Food:Korean",
  },
  {
    pattern: /(chinese|dim\s*sum|fried\s*rice)/i,
    category: "Food:Chinese",
  },
  {
    pattern: /(indian|curry|biryani)/i,
    category: "Food:Indian",
  },
  {
    pattern: /(western|international)/i,
    category: "Food:Western",
  },

  // Beverages (NEW - enhanced)
  {
    pattern: /(bubble\s*tea|boba|thai\s*tea|milk\s*tea)/i,
    category: "Food:Beverages:BubbleTea",
  },
  {
    pattern: /(smoothie|juice|fresh\s*juice)/i,
    category: "Food:Beverages:Smoothie",
  },
  {
    pattern: /(coconut\s*water)/i,
    category: "Food:Beverages:CoconutWater",
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

  // Healthcare (NEW)
  {
    pattern: /(doctor|clinic|hospital|medical)/i,
    category: "Health:Medical",
  },
  {
    pattern: /(dentist|dental)/i,
    category: "Health:Dental",
  },
  {
    pattern: /(pharmacy|medicine|vitamins|supplements)/i,
    category: "Health:Pharmacy",
  },
  {
    pattern: /(massage|spa|salon|haircut|nails)/i,
    category: "Personal:Care",
  },
  {
    pattern: /(shampoo|skincare|cosmetics|makeup)/i,
    category: "Personal:Toiletries",
  },
  {
    pattern: /(gym|fitness|personal\s*training)/i,
    category: "Health:Fitness",
  },
  {
    pattern: /(dry\s*cleaning|laundry\s*service)/i,
    category: "Personal:Services",
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

  // Education & Schooling (NEW)
  {
    pattern:
      /(school|tuition|education|enrol?l?ment|registration\s*fee|ค่าเทอม|学费)/i,
    category: "Education:Tuition",
  },
  {
    pattern: /(uniform|school\s*uniform)/i,
    category: "Education:Uniforms",
  },
  {
    pattern: /(textbook|school\s*book|workbook|stationer(y|ies))/i,
    category: "Education:BooksSupplies",
  },
  {
    pattern: /(field\s*trip|excursion|outing)/i,
    category: "Education:Activities",
  },
  {
    pattern: /(after[-\s]?school|extracurricular|club\s*fee)/i,
    category: "Education:AfterSchool",
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

  // Snacks and Sweets (NEW)
  {
    pattern: /(ice\s*cream|chocolate|candy)/i,
    category: "Food:Snacks:Sweet",
  },
  {
    pattern: /(chips|crackers|cookies|biscuit)/i,
    category: "Food:Snacks:Savory",
  },
  {
    pattern: /(seaweed|nuts|dried\s*fruit)/i,
    category: "Food:Snacks:Healthy",
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
  // Household & Kitchenware (moved up for better precedence)
  {
    pattern: /(mug|cup|glass|plate|bowl|utensil|fork|spoon|knife)/i,
    category: "Household:Kitchenware",
  },
  // Coffee (moved down and made more specific to avoid "coffee mug")
  {
    pattern: /^(coffee|latte|espresso|americano|cappuccino)$/i,
    category: "Food:Coffee",
  },

  // Transportation (NEW - enhanced)
  {
    pattern: /(grab|uber|taxi|ride\s*hailing)/i,
    category: "Transport:RideHailing",
  },
  {
    pattern: /(bts|mrt|skytrain|subway|metro)/i,
    category: "Transport:PublicTransit",
  },
  {
    pattern: /(bus|public\s*bus)/i,
    category: "Transport:Bus",
  },
  {
    pattern: /(motorbike\s*taxi|motorcycle\s*taxi)/i,
    category: "Transport:MotorbikeTaxi",
  },
  {
    pattern: /(motorbike|motorcycle)(?!\s*taxi)/i,
    category: "Transport:PersonalVehicle",
  },
  {
    pattern: /(car(?!\s*wash)|automobile)/i,
    category: "Transport:PersonalVehicle",
  },
  {
    pattern: /(tuk\s*tuk|boat|ferry|airport\s*link)/i,
    category: "Transport:Specialty",
  },
  {
    pattern: /(flight|airline|plane)/i,
    category: "Transport:Air",
  },
  {
    pattern: /(hotel|accommodation)/i,
    category: "Transport:Accommodation",
  },
  {
    pattern: /(gas|fuel|petrol|diesel|gasoline)/i,
    category: "Transport:Fuel",
  },
  {
    pattern: /(parking|toll|tollway|easypass)/i,
    category: "Transport:Fees",
  },
  {
    pattern: /(car\s*wash|maintenance|repair|tires)/i,
    category: "Transport:Maintenance",
  },

  // Streaming Services (NEW)
  {
    pattern: /(netflix|spotify|youtube\s*premium|disney\s*plus|apple\s*music)/i,
    category: "Subscription:Entertainment",
  },
  {
    pattern: /(subscription|saas|software|hosting|domain)/i,
    category: "Subscription:Software",
  },
  {
    pattern: /(supabase|vercel|netlify|aws|digital\s*ocean)/i,
    category: "Subscription:Infrastructure",
  },

  // Business-specific categories
  {
    pattern: /(supplies|inventory|stock|materials)/i,
    category: "Supplies:General",
  },
  {
    pattern: /(napkin|paper|bag|packaging|disposable)/i,
    category: "Supplies:Packaging",
  },
  {
    pattern: /(marketing|advertising|ads|promotion)/i,
    category: "Marketing:Advertising",
  },

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
  // Thai-specific vendors
  { name: "grab", category: "Transport:RideHailing" },
  { name: "bts", category: "Transport:PublicTransit" },
  { name: "mrt", category: "Transport:PublicTransit" },
  { name: "starbucks", category: "Food:Coffee" },
  { name: "7-eleven", category: "Food:Groceries" },
];

const VENDOR_CONTAINS: Array<{ pattern: RegExp; category: string }> = [
  // Thai-specific vendors
  { pattern: /7\s*eleven|7-?11/i, category: "Food:Groceries" },
  { pattern: /villa\s*market/i, category: "Food:Groceries" },
  { pattern: /big\s*c/i, category: "Food:Groceries" },
  { pattern: /lotus/i, category: "Food:Groceries" },
  // Coffee shops
  { pattern: /amazon\s*coffee|cafe amazon/i, category: "Food:Coffee" },
  { pattern: /starbucks/i, category: "Food:Coffee" },
  { pattern: /blue\s*bottle/i, category: "Food:Coffee" },
  // Transportation
  { pattern: /grab/i, category: "Transport:RideHailing" },
  { pattern: /uber/i, category: "Transport:RideHailing" },
  // Banks
  { pattern: /kasikorn|k\s*bank/i, category: "Financial:Banking" },
  { pattern: /bangkok\s*bank/i, category: "Financial:Banking" },
  // International
  { pattern: /walmart/i, category: "Food:Groceries" },
  { pattern: /costco/i, category: "Food:Groceries" },
  { pattern: /lazada/i, category: "Shopping:Online" },

  // Education vendors (NEW)
  { pattern: /elc\s*school/i, category: "Education:Tuition" },
];

function buildAccountFromCategory(
  category: string,
  business: string,
  type: string = "expense"
): string {
  // Special case: Taxes don't use business prefix
  if (category.startsWith("Taxes:")) {
    return `Expenses:${category}`;
  }

  // Build account based on transaction type
  switch (type) {
    case "income":
      return `Income:${business}:${category}`;
    case "asset":
      return `Assets:${business}:${category}`;
    case "liability":
      return `Liabilities:${business}:${category}`;
    case "transfer":
      // Transfers might need special handling, but for now treat as expense
      return `Expenses:${business}:${category}`;
    default: // expense
      return `Expenses:${business}:${category}`;
  }
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
    if (r.pattern.test(desc)) {
      return r.category;
    }
  }
  return undefined;
}

export function mapAccount(
  description: string,
  opts: MapAccountOptions = {}
): string {
  const desc = description.toLowerCase().trim();
  const business = opts.business || "Personal";
  const type = opts.type || "expense";

  // Description-based mapping (PRIORITY 1)
  const descCategory = findDescriptionCategory(desc);
  if (descCategory) {
    return buildAccountFromCategory(descCategory, business, type);
  }

  // Vendor-based mapping (PRIORITY 2 - fallback only)
  const vendorCategory = findVendorCategory(opts.vendor);
  if (vendorCategory) {
    return buildAccountFromCategory(vendorCategory, business, type);
  }

  // Fallback based on type
  return buildAccountFromCategory("Misc", business, type);
}

// Helper function to get available business names (for future business management)
export function getDefaultBusiness(): string {
  return "Personal";
}

// Minimal smoke tests (dev-time)
if (process.env.NODE_ENV === "development") {
  const _a = mapAccount("iPhone 15 Pro"); // Should be Expenses:Personal:Electronics:Apple
  const _b = mapAccount("butter", { business: "MyBrickAndMortar" }); // Should be Expenses:MyBrickAndMortar:Food:Dairy:Butter
  const _c = mapAccount("supabase subscription", {
    business: "MyOnlineBusiness",
  }); // Should be Expenses:MyOnlineBusiness:Subscription:Infrastructure
  const _d = mapAccount("legal fee", { vendor: "Lawyer" }); // Should be Expenses:Personal:Professional:Legal
  void [_a, _b, _c, _d];
}
