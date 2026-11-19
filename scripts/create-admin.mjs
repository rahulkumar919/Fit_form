/**
 * Create or update an admin account (email + password).
 *
 *   npm run create-admin -- you@example.com 'A-strong-passphrase' "Your Name"
 *
 * The password is hashed with bcrypt (cost 12) and never stored in plain text.
 * Re-running with the same email resets the password and unlocks the account.
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const [email, password, name = "Admin"] = process.argv.slice(2);

if (!email || !password) {
  console.error("Usage: npm run create-admin -- <email> <password> [name]");
  process.exit(1);
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("Invalid email address.");
  process.exit(1);
}
if (password.length < 12) {
  console.error("Password must be at least 12 characters.");
  process.exit(1);
}
if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not set. Run via: npm run create-admin -- ...");
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB ?? "melamart" });

const col = mongoose.connection.db.collection("adminusers");
await col.createIndex({ email: 1 }, { unique: true });

const passwordHash = await bcrypt.hash(password, 12);
const now = new Date();

await col.updateOne(
  { email: email.toLowerCase().trim() },
  {
    $set: {
      name,
      passwordHash,
      isActive: true,
      failedAttempts: 0,
      lockUntil: null,
      updatedAt: now,
    },
    $setOnInsert: { createdAt: now, lastLoginAt: null },
  },
  { upsert: true },
);

console.log(`✓ Admin ready: ${email.toLowerCase().trim()}`);
await mongoose.disconnect();
