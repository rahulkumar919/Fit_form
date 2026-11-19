/**
 * MongoDB connection singleton via Mongoose.
 *
 * Next.js creates multiple module evaluations during development HMR,
 * so we cache the connection on the Node.js global object to prevent
 * opening a new connection on every hot-reload.
 *
 * DNS / network issues (ENOTFOUND) on the hosting server:
 *  → MongoDB Atlas → Network Access → add 0.0.0.0/0 (all IPs), OR add your
 *    hosting server's IP address. The cluster must not be paused (free tier
 *    pauses after 60 days of no writes — resume it from the Atlas dashboard).
 */

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.warn("[db] MONGODB_URI is not set. Running in mock-data mode.");
}

/** Cache shape stored on global to survive HMR. */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var __mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.__mongooseCache ?? { conn: null, promise: null };
global.__mongooseCache = cached;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined. Set it in .env.local to use the database.");
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      dbName: process.env.MONGODB_DB ?? "melamart",
      // Keep timeouts reasonable: 8s for initial selection, 10s for connect.
      // 20s was too long — Atlas cold-starts under M0/M2 are ≤5s normally.
      serverSelectionTimeoutMS: 8_000,
      connectTimeoutMS: 10_000,
      socketTimeoutMS: 30_000,
      retryReads: true,
      retryWrites: true,
    };
    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

/** True when a real MONGODB_URI is configured and USE_REAL_DB=true. */
export const hasDB = (): boolean => !!process.env.MONGODB_URI && process.env.USE_REAL_DB === "true";
