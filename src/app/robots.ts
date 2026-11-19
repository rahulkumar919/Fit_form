import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

/**
 * robots.txt — served at /robots.txt by Next.js App Router.
 *
 * Policy:
 *  - Public product, category and combo pages are crawlable by all bots.
 *  - Admin, API, checkout, account and tracking paths are blocked.
 *  - AI search crawlers (OAI-SearchBot) are explicitly allowed so product
 *    information can appear in ChatGPT Search results.
 *  - GPTBot (OpenAI training crawler) is NOT blocked — this is a business
 *    decision. Add a "GPTBot" disallow rule here if you wish to opt out.
 *  - CCBot, anthropic-ai etc. are allowed by the wildcard rule.
 */
export default function robots(): MetadataRoute.Robots {
  const privateRoutes = [
    "/admin",
    "/api/",
    "/account",
    "/checkout",
    "/orders",
    "/wishlist",
    "/login",
    "/l/",
  ];

  return {
    rules: [
      // ── Standard search crawlers ───────────────────────────────────────
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: privateRoutes,
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: privateRoutes,
      },
      // ── AI search crawlers (ChatGPT Search, Perplexity, etc.) ──────────
      // OAI-SearchBot: ChatGPT's search indexer — allow full public content
      {
        userAgent: "OAI-SearchBot",
        allow: "/",
        disallow: privateRoutes,
      },
      // ── Everything else (default) ──────────────────────────────────────
      {
        userAgent: "*",
        allow: "/",
        disallow: privateRoutes,
      },
    ],
    sitemap: siteUrl("/sitemap.xml"),
  };
}
