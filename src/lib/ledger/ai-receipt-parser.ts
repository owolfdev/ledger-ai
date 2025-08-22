// src/lib/ledger/ai-receipt-parser.ts
// IMPROVED: Better Thai handling, currency detection, validation, and command cleanup

export interface AiReceiptParser {
  parseReceiptText(ocrText: string): Promise<string>;
}

interface ParsedCommand {
  command: string;
  currency: string;
  total: number;
  items: Array<{ name: string; price: number }>;
}

// Enhanced currency detection
function detectCurrency(text: string): string {
  const textLower = text.toLowerCase();

  // Strong indicators for Thai Baht
  if (
    text.includes("฿") ||
    text.includes("บาท") ||
    textLower.includes("thailand") ||
    textLower.includes("thai") ||
    /\b(vat|tax)\s*\d+\s*%/.test(textLower)
  ) {
    return "฿";
  }

  // Other currencies
  if (text.includes("$") || textLower.includes("usd")) return "$";
  if (text.includes("€") || textLower.includes("eur")) return "€";
  if (text.includes("£") || textLower.includes("gbp")) return "£";

  // Default to Thai Baht for ambiguous cases
  return "฿";
}

// Clean up AI-generated commands
function cleanCommand(command: string): string {
  // Remove code block markers
  command = command.replace(/```[a-z]*\n?/gi, "").replace(/```$/g, "");

  // Remove leading/trailing whitespace
  command = command.trim();

  // Fix duplicate "new" commands
  command = command.replace(/^new\s+new\s+/i, "new\n");

  // Ensure command starts with "new" (but not duplicate)
  if (!command.toLowerCase().startsWith("new")) {
    command = `new\n${command}`;
  }

  return command;
}

// Validate command makes mathematical sense
function validateCommand(parsed: ParsedCommand): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check if items total approximately matches stated total
  const itemsTotal = parsed.items.reduce((sum, item) => sum + item.price, 0);
  const tolerance = Math.max(parsed.total * 0.15, 50); // 15% tolerance or 50 units

  if (Math.abs(itemsTotal - parsed.total) > tolerance) {
    issues.push(
      `Items total ${itemsTotal} doesn't match receipt total ${parsed.total}`
    );
  }

  // Check for reasonable prices and tax handling
  const unreasonablePrices = parsed.items.filter(
    (item) =>
      item.price <= 0 ||
      (item.price > 10000 && !item.name.toLowerCase().includes("tax"))
  );
  if (unreasonablePrices.length > 0) {
    issues.push(
      `Unreasonable prices detected: ${unreasonablePrices
        .map((i) => i.name)
        .join(", ")}`
    );
  }

  // Validate tax makes sense (should be reasonable percentage of subtotal)
  const taxItems = parsed.items.filter(
    (item) =>
      item.name.toLowerCase().includes("tax") ||
      item.name.toLowerCase().includes("vat")
  );
  if (taxItems.length > 0) {
    const nonTaxTotal = parsed.items
      .filter(
        (item) =>
          !item.name.toLowerCase().includes("tax") &&
          !item.name.toLowerCase().includes("vat")
      )
      .reduce((sum, item) => sum + item.price, 0);
    const totalTax = taxItems.reduce((sum, item) => sum + item.price, 0);
    const taxRate = nonTaxTotal > 0 ? totalTax / nonTaxTotal : 0;

    if (taxRate > 0.25) {
      // Tax seems too high (>25%)
      issues.push(
        `Tax rate seems unusually high: ${(taxRate * 100).toFixed(1)}%`
      );
    }
  }

  // Check for duplicate identical items (might indicate parsing error)
  const itemCounts = new Map<string, number>();
  parsed.items.forEach((item) => {
    const key = `${item.name}-${item.price}`;
    itemCounts.set(key, (itemCounts.get(key) || 0) + 1);
  });

  const suspiciousDupes = Array.from(itemCounts.entries())
    .filter(([_, count]) => count > 3)
    .map(([key, count]) => `${key.split("-")[0]} (${count} times)`);

  if (suspiciousDupes.length > 0) {
    issues.push(`Suspicious duplicates: ${suspiciousDupes.join(", ")}`);
  }

  return { valid: issues.length === 0, issues };
}

// Parse command to extract structured data for validation
function parseCommandStructure(command: string): ParsedCommand | null {
  try {
    // Extract currency from the command
    const currencyMatch = command.match(/[฿$€£]/);
    const currency = currencyMatch ? currencyMatch[0] : "฿";

    // Extract items (between "new" and "@" or "--")
    const itemsMatch = command.match(/new\s+([\s\S]+?)(?:\s+@|\s+--|\s*$)/);
    if (!itemsMatch) return null;

    const itemsText = itemsMatch[1];
    const items: Array<{ name: string; price: number }> = [];

    // Split by commas and parse each item
    const itemParts = itemsText.split(",");
    for (const part of itemParts) {
      const trimmed = part.trim();
      // Look for price at the end: "item name 123.45" or "item name ฿123.45"
      const priceMatch = trimmed.match(
        /(.+?)\s+[฿$€£]?(\d+(?:\.\d{1,2})?)\s*$/
      );
      if (priceMatch) {
        const name = priceMatch[1].trim();
        const price = parseFloat(priceMatch[2]);
        if (name && !isNaN(price)) {
          items.push({ name, price });
        }
      }
    }

    // Extract total from memo
    const memoMatch = command.match(
      /--memo\s+"[^"]*total[^"]*?(\d+(?:\.\d{1,2})?)[^"]*"/i
    );
    const total = memoMatch ? parseFloat(memoMatch[1]) : 0;

    return { command, currency, total, items };
  } catch {
    return null;
  }
}

export function createOpenAiReceiptParser(apiKey: string): AiReceiptParser {
  return {
    async parseReceiptText(ocrText: string): Promise<string> {
      const currency = detectCurrency(ocrText);

      const systemPrompt = `You are an expert receipt parser for Thai and international receipts. Convert raw OCR text into clean ledger commands.

TASK: Create a "new" command using this EXACT multi-line syntax:
new
item1 price1,
item2 price2
@ vendor
--date YYYY-MM-DD
--memo "total amount"

CRITICAL RULES:
1. Use ${currency} for ALL prices consistently
2. Item prices should NOT include currency symbol (just numbers)
3. Include currency symbol only in memo
4. Use simple, readable English item names (no product codes)
5. Extract actual vendor name, not addresses/tax info
6. Date format: YYYY-MM-DD only
7. INCLUDE TAX as a separate line item if present
8. Calculate subtotal from items, show in memo if different from total
9. FORMAT AS MULTI-LINE for readability

TAX HANDLING:
- If receipt shows tax/VAT, add it as: "tax [amount]"
- If service charge exists, add it as: "service charge [amount]"  
- Memo should show subtotal if tax was added separately

MULTI-LINE FORMAT EXAMPLES:

Thai Restaurant with VAT:
new
tom yum kung 265,
pad thai 180,
thai iced tea 80,
tax 36.75
@ Nara Restaurant
--date 2002-01-11
--memo "subtotal 525, total 561.75"

Grocery Store with Tax:
new
beef sirloin 60.00,
duck leg 52.00,
gouda cheese 167.00,
tax 22.11
@ FoodLand
--date 2016-09-08
--memo "subtotal 279.00, total 301.11"

Restaurant with Service Charge:
new
green curry 180,
rice 60,
service charge 24,
tax 18.48
@ Thai Restaurant
--memo "subtotal 240, total 282.48"

FORMATTING RULES:
- Start with "new" on its own line
- Each item on its own line with comma (except last item)
- Vendor line starts with "@ "
- Each flag on its own line starting with "--"
- Maintain proper indentation for readability

THAI RECEIPT GUIDANCE:
- Common Thai dishes: tom yum, pad thai, som tam, massaman, etc.
- Thai vendors: translate to English or use common names
- Thai currency: always use ฿ symbol
- Dates: Thai format DD/MM/YYYY → convert to YYYY-MM-DD
- VAT/Tax: common in Thai receipts, always include as separate item

VALIDATION:
- Ensure items add up approximately to stated total
- Use reasonable prices (not 0.01 or 50000)
- Avoid identical item names unless actually repeated

IMPORTANT: Return ONLY the raw multi-line command text. Do NOT wrap it in code blocks, backticks, or any markdown formatting. Do NOT repeat the word "new" twice.

Return ONLY the multi-line command, no explanation.`;

      const userPrompt = `Convert this receipt OCR text to a command (use ${currency} currency):

${ocrText}`;

      let attempts = 0;
      const maxAttempts = 2;

      while (attempts < maxAttempts) {
        try {
          const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model: "gpt-4o", // Use more capable model
                temperature: 0.1, // Low but not zero for some creativity
                max_tokens: 300,
                messages: [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: userPrompt },
                ],
              }),
            }
          );

          if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
          }

          const data = await response.json();
          let command = data.choices?.[0]?.message?.content?.trim();

          if (!command) {
            throw new Error("AI failed to generate command");
          }

          // Clean up the command (remove backticks, fix duplicates)
          command = cleanCommand(command);

          // Validate the command
          const parsed = parseCommandStructure(command);
          if (parsed) {
            const validation = validateCommand(parsed);
            if (!validation.valid && attempts < maxAttempts - 1) {
              // console.log(
              //   `Validation failed (attempt ${attempts + 1}):`,
              //   validation.issues
              // );
              attempts++;
              continue; // Try again with same prompt
            }

            if (!validation.valid) {
              console.warn("Final validation issues:", validation.issues);
              // Still return the command but log the issues
            }
          }

          return command;
        } catch (error) {
          attempts++;
          if (attempts >= maxAttempts) {
            throw error;
          }
          // console.log(`Attempt ${attempts} failed, retrying...`);
        }
      }

      throw new Error(
        "Failed to generate valid command after multiple attempts"
      );
    },
  };
}

// Enhanced fallback parser with better Thai handling
export function createFallbackParser(): AiReceiptParser {
  return {
    async parseReceiptText(ocrText: string): Promise<string> {
      const currency = detectCurrency(ocrText);
      const lines = ocrText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      const items: string[] = [];
      let vendor = "";
      let total = "";
      let date = "";

      // Look for vendor (avoid tax/address lines)
      for (let i = 0; i < Math.min(8, lines.length); i++) {
        const line = lines[i];
        if (
          line.length > 3 &&
          line.length < 40 &&
          /[A-Za-z]/.test(line) &&
          !/(TAX|ID|POS|TEL|ADDRESS|RECEIPT)/i.test(line)
        ) {
          vendor = line
            .replace(/[^\w\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
          break;
        }
      }

      // Look for date
      const datePatterns = [
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
        /(\d{4})-(\d{1,2})-(\d{1,2})/,
        /(\d{1,2})\.(\d{1,2})\.(\d{4})/,
      ];

      for (const line of lines) {
        for (const pattern of datePatterns) {
          const match = line.match(pattern);
          if (match) {
            const [, a, b, c] = match;
            // Assume DD/MM/YYYY for Thai receipts
            if (c.length === 4) {
              const year = c;
              const month = b.padStart(2, "0");
              const day = a.padStart(2, "0");
              date = `${year}-${month}-${day}`;
            }
            break;
          }
        }
        if (date) break;
      }

      // Extract items with prices (more robust)
      const pricePattern = new RegExp(
        `(.+?)\\s+(?:${currency})?\\s*(\\d+(?:\\.\\d{1,2})?)(?:\\s*${currency})?\\s*$`
      );

      for (const line of lines) {
        if (/(total|subtotal|tax|service|vat|change|payment)/i.test(line)) {
          // Check for total
          const totalMatch = line.match(/(\d+(?:\.\d{1,2})?)/);
          if (totalMatch && /total/i.test(line)) {
            total = totalMatch[1];
          }
          continue;
        }

        const match = line.match(pricePattern);
        if (match) {
          const [, description, price] = match;
          const cleanDesc = description
            .replace(/^\d+\s*/, "") // Remove leading numbers
            .replace(/[^\w\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();

          const priceNum = parseFloat(price);
          if (cleanDesc.length > 2 && priceNum > 0 && priceNum < 10000) {
            items.push(`${cleanDesc} ${priceNum}`);
          }
        }
      }

      if (items.length === 0) {
        return `new\nitem 0\n@ Unknown\n--memo "OCR parsing failed"`;
      }

      // Build multi-line command
      const commandParts = ["new"];

      // Add items (each on its own line with comma except the last)
      items.forEach((item, index) => {
        if (index === items.length - 1) {
          commandParts.push(item); // Last item without comma
        } else {
          commandParts.push(item + ","); // Other items with comma
        }
      });

      // Add vendor
      if (vendor) {
        commandParts.push(`@ ${vendor}`);
      }

      // Add date flag
      if (date) {
        commandParts.push(`--date ${date}`);
      }

      // Add memo flag
      if (total) {
        commandParts.push(`--memo "total ${currency}${total}"`);
      }

      return commandParts.join("\n");
    },
  };
}
