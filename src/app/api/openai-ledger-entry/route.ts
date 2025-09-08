// src/app/api/openai-ledger-entry/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { input, userId } = await request.json();

    if (!input || !userId) {
      return NextResponse.json(
        { error: "Input and userId are required" },
        { status: 400 }
      );
    }

    // Verify user authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate ledger entry using AI
    const systemPrompt = `You are an AI assistant that converts natural language descriptions of financial transactions into Ledger CLI format.

Your task is to generate a properly formatted Ledger entry that the user can edit and save.

## Ledger Format
The entry should follow this format:
YYYY/MM/DD Payee
    Account1  Amount
    Account2 -Amount

## Examples

Input: "I bought coffee at Starbucks for 100 baht"
Output:
2025/09/09 Starbucks
    Expenses:Personal:Food:Coffee  100.00฿
    Assets:Bank:Kasikorn:Personal -100.00฿

Input: "add coffee 100 --vendor Starbucks"
Output:
2025/09/09 Starbucks
    Expenses:Personal:Food:Coffee  100.00฿
    Assets:Bank:Kasikorn:Personal -100.00฿

Input: "office supplies 500 baht for MyBrick business"
Output:
2025/09/09 Office Supplies
    Expenses:MyBrick:Office:Supplies  500.00฿
    Assets:Bank:Kasikorn:Personal -500.00฿

## Rules
1. Use today's date (2025/09/09)
2. Use Thai Baht (฿) as default currency
3. Use appropriate account structure (Expenses:Personal:Category, Assets:Bank:Kasikorn:Personal)
4. Always balance the entry (positive and negative amounts)
5. Use clear, descriptive payee names
6. Format amounts with 2 decimal places
7. Use proper indentation (4 spaces for account lines)

Generate ONLY the ledger entry in plain text format, without any markdown code blocks or formatting. Just the raw ledger entry text.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: input,
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error("OpenAI API request failed");
    }

    const data = await response.json();
    const ledgerEntry = data.choices[0]?.message?.content?.trim();

    if (!ledgerEntry) {
      throw new Error("No ledger entry generated");
    }

    return NextResponse.json({ ledgerEntry });
  } catch (error) {
    console.error("Error generating ledger entry:", error);
    return NextResponse.json(
      { error: "Failed to generate ledger entry" },
      { status: 500 }
    );
  }
}
