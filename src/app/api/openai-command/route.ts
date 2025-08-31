// src/app/api/openai-command/route.ts

import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { rateLimitByIpOrUser } from "@/utils/openai/rate-limit";
import { getClientIp } from "@/utils/openai/get-client-ip";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIp = getClientIp(request);

    // Apply rate limiting using your existing utility
    const rateLimit = await rateLimitByIpOrUser(clientIp, 30, 15 * 60); // 30 requests per 15 minutes

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please try again later.",
        },
        { status: 429 }
      );
    }

    // Parse request body
    const { input, context, potentialCommands } = await request.json();

    if (!input || typeof input !== "string") {
      return NextResponse.json(
        { error: "Invalid input provided" },
        { status: 400 }
      );
    }

    // Build the system prompt with updated examples using new flag-based syntax
    const systemPrompt = `${context}

INPUT: "${input}"

Generate the appropriate terminal command based on the natural language input above. Follow these rules:

1. Use ONLY commands from the registry provided above
2. Match the exact syntax shown in the usage examples
3. For expenses/purchases, use the "new" command with flag-based syntax
4. For queries/searches, use the "entries" command  
5. For modifications, use the "edit-entry" command
6. Include proper flags and arguments
7. Preserve amounts, dates, and vendor information
8. Use business context when mentioned

Return ONLY the command string, nothing else. If you cannot generate a valid command, return "ERROR: [explanation]".

IMPORTANT: Use the NEW flag-based syntax for all commands:

NEW COMMAND EXAMPLES (Flag-based syntax):
- "I bought coffee for 150 baht" → "new -i coffee 150"
- "I spent $20 at Starbucks" → "new -i coffee 20 --vendor Starbucks"  
- "I had lunch yesterday for 200 baht" → "new -i lunch 200 --date yesterday"
- "MyBrick: office supplies for $100" → "new -i supplies 100 --business MyBrick"
- "Bought gas $50 with credit card" → "new -i gas 50 --payment credit card"
- "Coffee and pastry at Starbucks" → "new -i coffee 6 pastry 4 --vendor Starbucks"

ENTRIES COMMAND EXAMPLES:
- "Show my expenses from today" → "entries today"
- "How much did I spend on coffee this month" → "entries -v coffee -s -m august"
- "List my Starbucks transactions" → "entries -v Starbucks"
- "What did I spend on Personal business last month" → "entries -b Personal -s -m july"

EDIT-ENTRY COMMAND EXAMPLES:
- "Change entry 323 business to MyBrick" → "edit-entry 323 --business MyBrick"
- "Fix the vendor name for entry 330 to Starbucks" → "edit-entry 330 --vendor Starbucks"
- "Update entry 340 memo to client meeting" → "edit-entry 340 --memo client meeting"

FLAG SYNTAX RULES:
- Use -i flag for items and prices: "new -i item1 price1 item2 price2"
- Use --vendor for vendor names: "--vendor Starbucks"
- Use --business for business context: "--business MyBrick"
- Use --date for dates: "--date 2025-01-15"
- Use --memo for notes: "--memo meeting with client"
- Use --payment for payment methods: "--payment credit card"
- Quote multi-word values: "--vendor \"Starbucks Coffee\""
- Quote multi-word items: "new -i \"coffee mug\" 200"`;

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
      ],
      temperature: 0.1, // Low temperature for consistent command generation
      max_tokens: 150, // Commands should be short
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    const generatedCommand = completion.choices[0]?.message?.content?.trim();

    if (!generatedCommand) {
      return NextResponse.json({
        success: false,
        error: "Failed to generate command",
      });
    }

    // Calculate confidence based on various factors
    let confidence = 0.7; // Base confidence

    // Higher confidence for commands that use potential commands
    if (potentialCommands && potentialCommands.length > 0) {
      const commandStart = generatedCommand.split(" ")[0];
      if (potentialCommands.includes(commandStart)) {
        confidence += 0.2;
      }
    }

    // Higher confidence for commands that look structurally correct
    if (
      generatedCommand.includes(" ") &&
      !generatedCommand.startsWith("ERROR")
    ) {
      confidence += 0.1;
    }

    // Cap confidence at 1.0
    confidence = Math.min(confidence, 1.0);

    return NextResponse.json({
      success: !generatedCommand.startsWith("ERROR"),
      command: generatedCommand.startsWith("ERROR") ? "" : generatedCommand,
      confidence: generatedCommand.startsWith("ERROR") ? 0 : confidence,
      reasoning: generatedCommand.startsWith("ERROR")
        ? generatedCommand.replace(/^ERROR:\s*/, "")
        : "Generated using AI analysis of natural language input",
      error: generatedCommand.startsWith("ERROR")
        ? generatedCommand.replace(/^ERROR:\s*/, "")
        : undefined,
    });
  } catch (error) {
    console.error("OpenAI Command Generation Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during command generation",
        command: "",
        confidence: 0,
      },
      { status: 500 }
    );
  }
}
