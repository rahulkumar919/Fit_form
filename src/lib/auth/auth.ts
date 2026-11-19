/**
 * Full Auth.js setup (Node runtime): Google for customers,
 * email + password for admins.
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { MongoClient } from "mongodb";
import { authConfig } from "./auth.config";
import { verifyAdminCredentials } from "./admin-credentials";

declare global {
  var __mongoClientPromise: Promise<MongoClient> | undefined;
}

function getMongoClient(): Promise<MongoClient> | null {
  if (!process.env.MONGODB_URI) return null;
  if (!global.__mongoClientPromise) {
    global.__mongoClientPromise = new MongoClient(process.env.MONGODB_URI).connect();
  }
  return global.__mongoClientPromise;
}

const clientPromise = getMongoClient();

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: clientPromise
    ? MongoDBAdapter(clientPromise, { databaseName: process.env.MONGODB_DB ?? "melamart" })
    : undefined,
  providers: [
    ...authConfig.providers,
    Credentials({
      id: "admin-credentials",
      name: "Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const admin = await verifyAdminCredentials(credentials);
        if (!admin) return null;
        return { id: admin.id, name: admin.name, email: admin.email, role: "admin" } as never;
      },
    }),
  ],
});
