/**
 * Next.js 16 Proxy (formerly middleware). Runs before every matched request.
 * Uses the DB-free authConfig; its `authorized` callback guards /admin
 * (admin role only) and customer routes (/account, /orders, /checkout).
 */

import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";

const { auth } = NextAuth(authConfig);

export const proxy = auth;

export const config = {
  // API routes enforce auth themselves (requireAuth / requireAdmin). Keeping them out of the proxy
  // also avoids its 10 MB body buffer limit, which would truncate video uploads.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/|media/|.*\\.(?:png|jpg|jpeg|svg|webp|avif|ico|mp4|webm)$).*)"],
};
