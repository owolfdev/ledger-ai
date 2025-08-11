import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { createClient } from "@/utils/supabase/server";

// Bucket name you created in Supabase Storage
const BUCKET = "receipts";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const inputBuf = Buffer.from(await file.arrayBuffer());

    // Preprocess for OCR: 1500px wide, grayscale, normalize, compress
    const processed = await sharp(inputBuf)
      .rotate() // auto-orient based on EXIF
      .resize({ width: 1500, withoutEnlargement: false })
      .grayscale()
      .normalize() // histogram equalization-ish
      // optional mild contrast bump:
      // .linear(1.15, -10)
      .toFormat("jpeg", { quality: 90, mozjpeg: true })
      .toBuffer();

    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const stamp = Date.now();
    const path = `${user.id}/${stamp}-${file.name.replace(/\s+/g, "_")}.jpg`;

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, processed, { contentType: "image/jpeg", upsert: false });

    if (upErr)
      return NextResponse.json({ error: upErr.message }, { status: 500 });

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const url = pub?.publicUrl ?? null;

    // Return URL (to save) + processed bytes (for client-side OCR)
    const base64 = processed.toString("base64");
    return NextResponse.json({
      url,
      base64,
      mime: "image/jpeg",
      bytes: processed.length,
    });
  } catch (e: unknown) {
    if (e instanceof Error) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
