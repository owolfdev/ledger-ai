//src/app/api/ledger/append/route.ts
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Path to the ledger file (adjust for your env)
const LEDGER_FILE = path.resolve(
  process.cwd(),
  "src/data/Ledger/general.ledger"
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  if (!body.trim()) {
    return NextResponse.json({ error: "Empty entry" }, { status: 400 });
  }
  await fs.appendFile(LEDGER_FILE, "\n\n" + body.trim());
  return NextResponse.json({ ok: true });
}
