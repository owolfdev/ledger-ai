// Add streaming service vendor mappings to the database
import { createClient } from "@supabase/supabase-js";

interface InsertVendorMapping {
  vendor_name: string;
  vendor_pattern: string | null;
  account_path: string;
  account_type: string;
  business_context: string | null;
  is_active: boolean;
}

async function addStreamingVendorMappings() {
  console.log("🔄 Adding streaming service vendor mappings...");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  );

  const streamingMappings: InsertVendorMapping[] = [
    // Netflix
    {
      vendor_name: "netflix",
      vendor_pattern: "netflix",
      account_path: "Expenses:Personal:Subscription:Entertainment",
      account_type: "expense",
      business_context: "Personal",
      is_active: true,
    },

    // Spotify
    {
      vendor_name: "spotify",
      vendor_pattern: "spotify",
      account_path: "Expenses:Personal:Subscription:Entertainment",
      account_type: "expense",
      business_context: "Personal",
      is_active: true,
    },

    // YouTube Premium
    {
      vendor_name: "youtube premium",
      vendor_pattern: "youtube\\s*premium|youtube\\s*red",
      account_path: "Expenses:Personal:Subscription:Entertainment",
      account_type: "expense",
      business_context: "Personal",
      is_active: true,
    },

    // Disney+
    {
      vendor_name: "disney plus",
      vendor_pattern: "disney\\s*plus|disney\\+",
      account_path: "Expenses:Personal:Subscription:Entertainment",
      account_type: "expense",
      business_context: "Personal",
      is_active: true,
    },

    // Apple Music
    {
      vendor_name: "apple music",
      vendor_pattern: "apple\\s*music",
      account_path: "Expenses:Personal:Subscription:Entertainment",
      account_type: "expense",
      business_context: "Personal",
      is_active: true,
    },

    // Amazon Prime Video
    {
      vendor_name: "amazon prime",
      vendor_pattern: "amazon\\s*prime|prime\\s*video",
      account_path: "Expenses:Personal:Subscription:Entertainment",
      account_type: "expense",
      business_context: "Personal",
      is_active: true,
    },

    // HBO Max
    {
      vendor_name: "hbo max",
      vendor_pattern: "hbo\\s*max|hbo\\+",
      account_path: "Expenses:Personal:Subscription:Entertainment",
      account_type: "expense",
      business_context: "Personal",
      is_active: true,
    },

    // Hulu
    {
      vendor_name: "hulu",
      vendor_pattern: "hulu",
      account_path: "Expenses:Personal:Subscription:Entertainment",
      account_type: "expense",
      business_context: "Personal",
      is_active: true,
    },

    // Twitch
    {
      vendor_name: "twitch",
      vendor_pattern: "twitch",
      account_path: "Expenses:Personal:Subscription:Entertainment",
      account_type: "expense",
      business_context: "Personal",
      is_active: true,
    },

    // Patreon
    {
      vendor_name: "patreon",
      vendor_pattern: "patreon",
      account_path: "Expenses:Personal:Subscription:Entertainment",
      account_type: "expense",
      business_context: "Personal",
      is_active: true,
    },
  ];

  const { data, error } = await supabase
    .from("vendor_mappings")
    .insert(streamingMappings)
    .select();

  if (error) {
    console.error("❌ Error adding streaming vendor mappings:", error);
    return;
  }

  console.log(
    `✅ Added ${data?.length || 0} streaming service vendor mappings`
  );

  // Verify the insertions
  const { data: verifyData, error: verifyError } = await supabase
    .from("vendor_mappings")
    .select("vendor_name, account_path, account_type, is_active")
    .in(
      "vendor_name",
      streamingMappings.map((m) => m.vendor_name)
    )
    .order("vendor_name");

  if (verifyError) {
    console.error("❌ Error verifying insertions:", verifyError);
    return;
  }

  console.log("📋 Verification - Added streaming services:");
  verifyData?.forEach((mapping) => {
    console.log(`  • ${mapping.vendor_name} → ${mapping.account_path}`);
  });
}

// Run the migration
addStreamingVendorMappings()
  .then(() => {
    console.log("🎉 Streaming vendor mappings migration completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  });
