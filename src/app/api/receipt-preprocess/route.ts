// ================================================
// FILE: src/app/api/receipt-preprocess/route.ts
// PURPOSE: Stronger, deterministic OCR pre-process; upload two variants
// ================================================
import { NextResponse } from "next/server";
import sharp from "sharp";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "receipts";

// Small helper for unique, versioned file names (cache-safe)
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

    // ---- Pipeline A: general clean (good for layout + text) ----
    const base = sharp(inputBuf, { failOn: "none" })
      .rotate()
      .resize({ width: 1500, withoutEnlargement: false })
      .grayscale()
      .gamma() // improves mid-tones
      .median(1) // denoise salt/pepper
      .sharpen({ sigma: 0.75 }) // mild sharpen
      .normalize();

    const baseBuf = await base.jpeg({ quality: 82, mozjpeg: true }).toBuffer();

    // ---- Pipeline B: binarized (often better for totals/monospace) ----
    const binBuf = await sharp(baseBuf)
      .threshold(180) // adaptive-ish single threshold; tune if needed
      .jpeg({ quality: 90, mozjpeg: true })
      .toBuffer();

    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const baseName = stampName("receipt.jpg");
    const binName = baseName.replace(/\.jpg$/, "-bin.jpg");
    const basePath = `${user.id}/${new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "/")}/${baseName}`;
    const binPath = `${user.id}/${new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "/")}/${binName}`;

    const commonOpts = {
      contentType: "image/jpeg",
      upsert: false as const,
      cacheControl: "31536000",
    };

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(basePath, baseBuf, commonOpts);

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(basePath);
    const cb = Date.now();

    return NextResponse.json({
      ok: true,
      url: `${publicData.publicUrl}?cb=${cb}`,
      mime: "image/jpeg",
      width: 1500,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `Server error: ${msg}` },
      { status: 500 }
    );
  }
}
