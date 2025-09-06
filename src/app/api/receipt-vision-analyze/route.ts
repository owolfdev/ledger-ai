// ================================================
// FILE: src/app/api/receipt-vision-analyze/route.ts
// PURPOSE: Direct OpenAI Vision analysis for receipts (bypasses OCR)
// ================================================

import { NextRequest } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is required");
}

const systemPrompt = `You are an expert receipt analyzer for Thai and international receipts. Analyze the receipt image and generate a clean ledger command.

TASK: Create a "new" command using this EXACT flag-based syntax:
new -i item1 price1 item2 price2 --vendor vendor --date YYYY-MM-DD --memo "total amount"

CRITICAL RULES:
1. Use ฿ for Thai receipts, $ for USD receipts consistently
2. Item prices should NOT include currency symbol (just numbers)
3. Include currency symbol only in memo
4. Use simple, readable English item names (no product codes)
5. Extract actual vendor name, not addresses/tax info
6. Date format: YYYY-MM-DD only
7. INCLUDE TAX as a separate line item if present
8. Calculate subtotal from items, show in memo if different from total
9. Use -i flag for items, --vendor for vendor, --date for date, --memo for memo

THAI RECEIPT PATTERNS:
- Thai dishes: tom yum, pad thai, som tam, massaman, etc.
- Thai vendors: translate to English or use common names
- Thai currency: always use ฿ symbol
- Dates: Thai format DD/MM/YYYY → convert to YYYY-MM-DD
- VAT/Tax: common in Thai receipts, often included in total

VAT HANDLING (CRITICAL):
- If receipt shows "Total: 411.00" and "VAT 7%: 26.89", the 411.00 ALREADY includes VAT
- Do NOT add VAT to the total - use the total as shown
- Add VAT as separate item: "tax 26.89"
- Memo should show: "subtotal 384.11, total 411.00"

SERVICE CHARGE HANDLING:
- If service charge is shown separately, add as: "service charge [amount]"
- If service charge is included in total, don't add separately

FLAG-BASED FORMAT EXAMPLES:

Thai Restaurant with VAT (VAT included in total):
new -i "tom yum kung" 265 "pad thai" 180 "thai iced tea" 80 tax 36.75 --vendor "Nara Restaurant" --date 2025-01-11 --memo "subtotal 525, total 561.75"

Thai Restaurant with VAT (VAT already in total):
new -i "vegan noodles" 145 "wrap" 175 "oolong tea" 70 tax 26.89 --vendor "SEE FAH" --date 2025-09-03 --memo "subtotal 384.11, total 411.00"

Grocery Store with Tax:
new -i "beef sirloin" 60.00 "duck leg" 52.00 "gouda cheese" 167.00 tax 22.11 --vendor "FoodLand" --date 2025-09-08 --memo "subtotal 279.00, total 301.11"

Restaurant with Service Charge:
new -i "green curry" 180 rice 60 "service charge" 24 tax 18.48 --vendor "Thai Restaurant" --memo "subtotal 240, total 282.48"

FLAG SYNTAX RULES:
- Use -i flag for all items and prices
- Use --vendor for vendor name
- Use --date for transaction date
- Use --memo for notes and totals
- Quote multi-word items: "coffee mug" 200
- Quote vendor names with spaces: --vendor "Starbucks Coffee"

VALIDATION:
- Ensure items add up approximately to stated total
- Use reasonable prices (not 0.01 or 50000)
- Avoid identical item names unless actually repeated
- For Thai receipts, recognize that "Total" often includes VAT

IMPORTANT: Return ONLY the raw command text. Do NOT wrap it in code blocks, backticks, or any markdown formatting. Do NOT repeat the word "new" twice.

Return ONLY the command, no explanation.`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    // Send to OpenAI Vision
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o", // Use vision model
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this receipt image and generate a ledger command:",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${file.type};base64,${base64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 512,
        temperature: 0.1, // Low temperature for consistent output
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI Vision API error:", errorData);
      return new Response(
        JSON.stringify({
          error: "OpenAI Vision API failed",
          details: errorData,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const openaiData = await response.json();
    const command = openaiData.choices?.[0]?.message?.content?.trim();

    if (!command) {
      return new Response(JSON.stringify({ error: "No command generated" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        command: command,
        confidence: 0.9, // High confidence for vision analysis
        method: "openai-vision",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Receipt vision analysis error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
