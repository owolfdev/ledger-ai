// app/api/image-analyze/route.ts
import { NextRequest } from "next/server";

const prompt = `
You are a receipt understanding AI. Analyze the attached image of a purchase receipt. 
Extract and clearly list the following information, even if not all details are present. 
Respond ONLY in the following structured format (use the provided labels):

**Store Information:**
- Store name:
- Address:
- Phone number:
- Manager (if available):

**Transaction Details:**
- Date:
- Time:
- Payment method:
- Transaction/Order number:

**Purchased Items and Prices:**
- [Item 1]: [quantity] at $[unit price] each
- [Item 2]: ...
- (repeat for all items)

**Financial Details:**
- Subtotal:
- Tax (specify % if shown):
- Total amount paid:
- Last 4 digits of payment card (if available):

**Miscellaneous:**
- Any other notable info or announcements:

If a field is missing on the receipt, write "Not shown".

Respond in Markdown, using bold section headers as above.`;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("image") as File;

  if (!file) {
    return new Response(JSON.stringify({ error: "No file uploaded." }), {
      status: 400,
    });
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  // Send to OpenAI
  const messages = [
    { type: "text", text: prompt },
    {
      type: "image_url",
      image_url: { url: `data:${file.type};base64,${base64}` },
    },
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "user", content: messages }],
      max_tokens: 512,
    }),
  });

  const openaiData = await response.json();
  return new Response(JSON.stringify(openaiData), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
