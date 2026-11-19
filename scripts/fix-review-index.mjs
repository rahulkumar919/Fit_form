/**
 * Run once to drop the broken review unique index and recreate it correctly.
 *
 *   node scripts/fix-review-index.mjs
 *
 * The old index  { productId: 1, userId: 1 }  was created without
 * partialFilterExpression, so it treated userId: null as a real value
 * and blocked a second admin-created review for the same product.
 *
 * The correct index only applies when userId is NOT null — one customer
 * review per product per customer — but admin reviews (userId: null)
 * are unrestricted.
 */

import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? "melamart";

if (!uri) {
  console.error("MONGODB_URI is not set in .env.local");
  process.exit(1);
}

await mongoose.connect(uri, { dbName });
const db = mongoose.connection.db;
const col = db.collection("reviews");

// List current indexes
const indexes = await col.indexes();
console.log("Current indexes on reviews collection:");
indexes.forEach((idx) => console.log(" ", JSON.stringify(idx)));

// Drop the bad compound index (may be named productId_1_userId_1)
const badName = "productId_1_userId_1";
const exists = indexes.some((i) => i.name === badName);

if (exists) {
  await col.dropIndex(badName);
  console.log(`\n✓ Dropped bad index: ${badName}`);
} else {
  console.log(`\n— Index "${badName}" not found (may already be fixed).`);
}

// Recreate with partialFilterExpression so null userId is excluded
await col.createIndex(
  { productId: 1, userId: 1 },
  {
    unique: true,
    sparse: false,
    partialFilterExpression: { userId: { $type: "objectId" } },
    name: "productId_1_userId_1_customers_only",
  },
);
console.log("✓ Created correct index: productId_1_userId_1_customers_only");

await mongoose.disconnect();
console.log("\nDone. Admin can now add multiple reviews per product.");
