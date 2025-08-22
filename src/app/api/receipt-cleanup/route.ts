// src/app/api/receipt-cleanup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Bucket name for receipts
const BUCKET = "receipts";

export async function POST(req: NextRequest) {
  try {
    const { filePath } = await req.json();

    if (!filePath || typeof filePath !== "string") {
      return NextResponse.json(
        { error: "Invalid filePath parameter" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check authentication
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify the file path belongs to the authenticated user
    if (!filePath.startsWith(auth.user.id + "/")) {
      return NextResponse.json(
        { error: "Unauthorized file access" },
        { status: 403 }
      );
    }

    // Delete the file from Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from(BUCKET)
      .remove([filePath]);

    if (deleteError) {
      console.error("Failed to delete image from storage:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete image from storage" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Image cleaned up successfully",
    });
  } catch (error) {
    console.error("Receipt cleanup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
