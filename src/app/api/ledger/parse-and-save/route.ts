// src/app/api/ledger/parse-and-save/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { ledgerEntry, userId } = await request.json();
    console.log("API: Received request", { ledgerEntry, userId });

    if (!ledgerEntry || !userId) {
      console.log("API: Missing required fields");
      return NextResponse.json(
        { error: "Ledger entry and userId are required" },
        { status: 400 }
      );
    }

    // Verify user authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log("API: Auth check", { authError, user: user?.id, userId });

    if (authError || !user || user.id !== userId) {
      console.log("API: Auth failed", { authError, user: user?.id, userId });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the ledger entry
    const parsedEntry = parseLedgerEntry(ledgerEntry);
    console.log("API: Parsed entry", parsedEntry);
    if (!parsedEntry) {
      console.log("API: Invalid ledger entry format");
      return NextResponse.json(
        { error: "Invalid ledger entry format" },
        { status: 400 }
      );
    }

    // Save to database
    const { data, error } = await supabase
      .from("ledger_entries")
      .insert({
        user_id: user.id,
        entry_date: parsedEntry.date,
        description: parsedEntry.payee,
        entry_text: ledgerEntry,
        amount: parsedEntry.postings[0]?.amount || 0,
        currency: parsedEntry.postings[0]?.currency || "฿",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to save ledger entry" },
        { status: 500 }
      );
    }

    const entryId = data.id;

    // Save postings to ledger_postings table
    const postings = parsedEntry.postings.map((p, i) => ({
      entry_id: entryId,
      account: p.account,
      amount: p.amount,
      currency: p.currency || "฿",
      sort_order: i,
    }));

    const { error: postError } = await supabase
      .from("ledger_postings")
      .insert(postings);

    if (postError) {
      console.error("Postings error:", postError);
      // Clean up the main entry if postings fail
      await supabase.from("ledger_entries").delete().eq("id", entryId);
      return NextResponse.json(
        { error: "Failed to save ledger postings" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      entryId: entryId,
      message: "Ledger entry saved successfully",
    });
  } catch (error) {
    console.error("Error parsing and saving ledger entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function parseLedgerEntry(ledgerEntry: string) {
  const lines = ledgerEntry.trim().split("\n");
  if (lines.length < 2) return null;

  // Parse date and payee from first line
  const firstLine = lines[0].trim();
  const dateMatch = firstLine.match(/^(\d{4}\/\d{2}\/\d{2})/);
  if (!dateMatch) return null;

  const date = dateMatch[1];
  const payee = firstLine.substring(dateMatch[0].length).trim();

  // Parse postings from remaining lines
  const postings = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse account and amount
    const parts = line.split(/\s+/);
    if (parts.length < 2) continue;

    const account = parts[0];
    const amountStr = parts[parts.length - 1];

    // Parse amount (remove currency symbols)
    const amountMatch = amountStr.match(/(-?\d+\.?\d*)/);
    if (!amountMatch) continue;

    const amount = parseFloat(amountMatch[1]);
    if (isNaN(amount)) continue;

    postings.push({
      account,
      amount,
      currency: amountStr.replace(/[0-9.-]/g, "") || "฿", // Extract currency symbol
    });
  }

  if (postings.length === 0) return null;

  return {
    date,
    payee,
    postings,
  };
}
