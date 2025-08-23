// /app/api/account-mapping/route.ts
// Dedicated API endpoint for account categorization

import { NextRequest } from "next/server";
import { getClientIp } from "@/utils/openai/get-client-ip";
import { rateLimitByIp } from "@/utils/rate-limit-redis";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const {
      description,
      currentCategory,
      vendor,
      business,
    }: {
      description: string;
      currentCategory: string;
      vendor?: string;
      business?: string;
    } = await req.json();

    // Rate limiting (per IP, 100/hour for account mapping)
    const ip = getClientIp(req);
    const limitKey = `account-mapping:${ip}`;
    const { allowed } = await rateLimitByIp(limitKey, 100, 60 * 60);

    if (!allowed) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded for account mapping" }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    const prompt = `You are enhancing account categorization to be more specific.

Current category: "${currentCategory}"
Item description: "${description}"
Vendor: ${vendor || "Unknown"}
Business context: ${business || "Personal"}

Make the category more specific by adding exactly ONE more level of detail.

Examples of good enhancements:
- "Food:Fruit" → "Food:Fruit:Apples" (for apples)
- "Food:Vegetables" → "Food:Vegetables:Leafy" (for spinach, lettuce)
- "Food:Vegetables" → "Food:Vegetables:Root" (for carrots, potatoes)  
- "Food:Meat" → "Food:Meat:Poultry" (for chicken)
- "Food:Meat" → "Food:Meat:Beef" (for beef, steak)
- "Electronics:Audio" → "Electronics:Audio:Headphones" (for headphones)
- "Electronics:Mobile" → "Electronics:Mobile:Accessories" (for phone cases)
- "Clothing" → "Clothing:Footwear" (for shoes, boots)
- "Clothing" → "Clothing:Tops" (for shirts, t-shirts)

Guidelines:
- Add only ONE more level (don't go from 2 to 4 levels)
- Use PascalCase with no spaces
- Be specific but not overly narrow
- Consider common subcategories within the current category

Respond with JSON: {"enhanced_category": "Food:Fruit:Apples", "confidence": 0.95}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("No AI response received");
    }

    // Parse the JSON response, handling markdown code blocks
    let parsed;
    try {
      // First try direct JSON parsing
      parsed = JSON.parse(aiResponse);
    } catch {
      // If that fails, try extracting JSON from markdown code blocks
      const jsonMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        // Try finding JSON object without code blocks
        const cleanResponse = aiResponse.replace(/```[^`]*```/g, "").trim();
        parsed = JSON.parse(cleanResponse);
      }
    }

    if (
      !parsed.enhanced_category ||
      typeof parsed.enhanced_category !== "string"
    ) {
      throw new Error("Invalid AI response format");
    }

    return new Response(
      JSON.stringify({
        enhanced_category: parsed.enhanced_category,
        confidence: parsed.confidence || 0.5,
        original_category: currentCategory,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Account mapping API error:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
