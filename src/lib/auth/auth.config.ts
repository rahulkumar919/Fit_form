/**
 * Edge-safe Auth.js config (no DB / bcrypt imports).
 * Providers that need the database are added in auth.ts.
 *
 * Roles:
 *  - "customer": anyone signed in with Google
 *  - "admin":    only accounts that passed the email + password check
 *                against the AdminUser collection (see auth.ts)
 */

import type { NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { isGoogleConfigured } from "./google";

export const authConfig: NextAuthConfig = {
  // Google is registered only when real credentials exist, so a placeholder
  // .env never produces a half-working "Continue with Google" button.
  providers: isGoogleConfigured()
    ? [
        GoogleProvider({
          clientId: process.env.AUTH_GOOGLE_ID!,
          clientSecret: process.env.AUTH_GOOGLE_SECRET!,
        }),
      ]
    : [],

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  trustHost: true,

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // `role` is only ever set by the admin credentials provider.
        const role = user.role === "admin" ? "admin" : "customer";
        token.role = role;
        token.userId = user.id ?? token.sub;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role === "admin" ? "admin" : "customer";
        session.user.userId = token.userId ?? token.sub ?? "";
      }
      return session;
    },

    authorized({ auth, request }) {
      const { pathname, search } = request.nextUrl;
      // Use AUTH_URL / NEXT_PUBLIC_APP_URL as the canonical origin so redirects
      // never use the internal bind address (e.g. 0.0.0.0:3000 on Hostinger).
      const siteOrigin =
        process.env.AUTH_URL?.replace(/\/$/, "") ||
        process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
        request.nextUrl.origin;

      if (pathname === "/admin/login") return true;

      if (pathname.startsWith("/admin")) {
        const role = auth?.user?.role;
        if (role === "admin") return true;
        const url = new URL("/admin/login", siteOrigin);
        url.searchParams.set("callbackUrl", pathname + search);
        return Response.redirect(url);
      }

      const customerRoutes = ["/account", "/orders", "/checkout"];
      if (customerRoutes.some((r) => pathname.startsWith(r))) {
        return !!auth?.user;
      }

      return true;
    },
  },
};
