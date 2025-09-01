#!/usr/bin/env tsx

/**
 * Test script for the new database-driven account mapping system
 * Run with: npx tsx scripts/test-database-mapping.ts
 */

import { config } from "dotenv";

// Load environment variables BEFORE importing the mapper
config({ path: ".env.local" });

import { hybridDatabaseMapper } from "@/lib/ledger/hybrid-database-mapper";

async function testDatabaseMapping() {
  console.log("🧪 Testing database-driven account mapping...\n");

  const testCases = [
    { description: "coffee", vendor: "Starbucks", business: "Personal" },
    { description: "lunch", vendor: "McDonald's", business: "Personal" },
    {
      description: "office supplies",
      vendor: "Office Depot",
      business: "MyBrick",
    },
    { description: "legal fee", vendor: "Law Firm", business: "Personal" },
    { description: "rent", vendor: "Landlord", business: "Personal" },
    { description: "iphone", vendor: "Apple Store", business: "Personal" },
    { description: "grab ride", vendor: "Grab", business: "Personal" },
    {
      description: "netflix subscription",
      vendor: "Netflix",
      business: "Personal",
    },
    {
      description: "unknown item",
      vendor: "Unknown Vendor",
      business: "Personal",
    },
  ];

  for (const testCase of testCases) {
    console.log(
      `📝 Testing: "${testCase.description}" from ${testCase.vendor} (${testCase.business})`
    );

    try {
      const result = await hybridDatabaseMapper.mapAccount(
        testCase.description,
        testCase.vendor,
        testCase.business
      );

      console.log(`   ✅ Account: ${result.account}`);
      console.log(`   📊 Type: ${result.account_type}`);
      console.log(`   🎯 Confidence: ${Math.round(result.confidence * 100)}%`);
      console.log(`   🔍 Source: ${result.source}`);
      console.log("");
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
      console.log("");
    }
  }

  // Test account type detection
  console.log("🔍 Testing account type detection...\n");

  const typeTestCases = [
    "loan payment",
    "deposit",
    "salary",
    "investment",
    "coffee",
    "rent payment",
  ];

  for (const description of typeTestCases) {
    console.log(`📝 Testing type detection: "${description}"`);

    try {
      const result = await hybridDatabaseMapper.detectAccountType(description);
      console.log(`   ✅ Type: ${result.account_type}`);
      console.log(`   🎯 Confidence: ${Math.round(result.confidence * 100)}%`);
      console.log("");
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
      console.log("");
    }
  }

  console.log("🎉 Database mapping test completed!");
}

if (require.main === module) {
  testDatabaseMapping().catch(console.error);
}
