import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import sharp from "sharp";
import { createClient } from "@/utils/supabase/server";

// Sharp needs Node runtime (NOT edge)
export const runtime = "nodejs";
// If the file might be big, you can lift the body size limit:
export const dynamic = "force-dynamic";

const BUCKET = "receipts"; // make sure this bucket exists in Supabase

export async function POST(req: Request) {
  try {
    // 1) Parse multipart form
    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    // 2) Read as ArrayBuffer → Buffer
    const inputBuf = Buffer.from(await file.arrayBuffer());

    // 3) Preprocess with Sharp:
    //    - resize to 1500 px width (keep aspect)
    //    - grayscale
    //    - slight contrast via linear adjustment
    //    - normalize to reduce noise
    //    - output as JPEG 85
    const processed = await sharp(inputBuf, { failOn: "none" })
      .rotate() // auto-orient from EXIF
      .resize({ width: 1500, withoutEnlargement: false })
      .grayscale()
      .linear(1.15, -10) // boost contrast slightly
      .normalize() // normalize shadows/highlights
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();

    // 4) Authenticated Supabase client (uses user cookies)
    const cookieStore = cookies();
    const supabase = await createClient();

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // 5) Build storage path: userId/yyyy/mm/dd/ts-rand.jpg
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const ts = now.getTime();
    const rand = Math.random().toString(36).slice(2, 8);
    const path = `${user.id}/${yyyy}/${mm}/${dd}/${ts}-${rand}.jpg`;

    // 6) Upload
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, processed, {
        contentType: "image/jpeg",
        upsert: false,
      });
    if (upErr) {
      return NextResponse.json(
        { error: `Upload error: ${upErr.message}` },
        { status: 500 }
      );
    }

    // 7) Get URL (public or signed)
    //    If your bucket is PUBLIC, this returns a public URL.
    //    If PRIVATE, swap for createSignedUrl below.
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const url = pub.publicUrl;

    // If your bucket is PRIVATE, comment the two lines above and use:
    // const { data: signed, error: signErr } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
    // if (signErr) return NextResponse.json({ error: `Sign URL error: ${signErr.message}` }, { status: 500 });
    // url = signed.signedUrl;

    return NextResponse.json({
      ok: true,
      url,
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
