// src/app/api/receipt-preprocess/route.ts
// SIMPLIFIED: Single optimized image pipeline for OCR
import { NextResponse } from "next/server";
import sharp from "sharp";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "receipts";

function stampName(base: string) {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `${ts}-${rand}-${base.replace(/\s+/g, "_")}`;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const inputBuf = Buffer.from(await file.arrayBuffer());

    // BALANCED: OCR-optimized but not destructive
    const optimizedBuf = await sharp(inputBuf, { failOn: "none" })
      .rotate() // Auto-rotate based on EXIF
      .resize({
        width: 1600, // Moderate increase for better detail
        withoutEnlargement: false,
      })
      .grayscale()
      .normalize({ lower: 10, upper: 90 }) // Gentle contrast boost
      .median(1) // Light denoising
      .sharpen({
        sigma: 0.8, // Moderate sharpening
        m1: 0.5, // Gentle mask
        m2: 2, // Conservative multiplier
      })
      .jpeg({ quality: 92, mozjpeg: true })
      .toBuffer();

    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const fileName = stampName("receipt.jpg");
    const filePath = `${user.id}/${new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "/")}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, optimizedBuf, {
        contentType: "image/jpeg",
        upsert: false,
        cacheControl: "31536000",
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    const cacheBuster = Date.now();

    return NextResponse.json({
      ok: true,
      url: `${publicData.publicUrl}?cb=${cacheBuster}`,
      mime: "image/jpeg",
      width: 1200,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `Server error: ${msg}` },
      { status: 500 }
    );
  }
}
