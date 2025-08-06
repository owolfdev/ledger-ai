// app/api/contact-messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getContactMessages } from "@/app/actions/contact/get-contact-messages";

export async function GET(req: NextRequest) {
  console.log("running contact messages route");
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") || 20);
  try {
    const messages = await getContactMessages(limit);
    console.log("messages from contact messages route:", messages);
    return NextResponse.json(messages);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
