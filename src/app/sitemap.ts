import type { MetadataRoute } from "next";
import { getAllCombos, getAllProducts, getCategories } from "@/services/catalog";
import { siteUrl } from "@/lib/seo";

export const revalidate = 3600;

/**
 * Dynamic XML sitemap.
 * Covers homepage, /combos, all categories with products, every combo and
 * product detail page, and static policy pages.
 * Excludes noindex pages (admin, account, checkout, orders, wishlist, login)
 * and empty categories.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, combos, categories] = await Promise.all([
    getAllProducts(),
    getAllCombos(),
    getCategories(),
  ]);

  const now = new Date();

  return [
    // Core pages
    { url: siteUrl("/"),       lastModified: now, changeFrequency: "daily",  priority: 1.0 },
    { url: siteUrl("/combos"), lastModified: now, changeFrequency: "daily",  priority: 0.9 },

    // Active categories that have at least one product
    ...categories
      .filter((c) => c.slug !== "combos" && c.productCount > 0)
      .map((c) => ({
        url: siteUrl(`/shop/${c.slug}`),
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.8,
        ...(c.image ? { images: [c.image] } : {}),
      })),

    // Combo detail pages
    ...combos.map((c) => ({
      url: siteUrl(`/combo/${c.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      ...(c.images[0] ? { images: [c.images[0]] } : {}),
    })),

    // Product detail pages — createdAt is the best available timestamp
    ...products.map((p) => ({
      url: siteUrl(`/product/${p.slug}`),
      lastModified: new Date(p.createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
      ...(p.images[0] ? { images: [p.images[0]] } : {}),
    })),

    // Static policy / info pages
    { url: siteUrl("/contact-us"),      lastModified: now, changeFrequency: "yearly" as const, priority: 0.5 },
    { url: siteUrl("/privacy"),         lastModified: now, changeFrequency: "yearly" as const, priority: 0.3 },
    { url: siteUrl("/terms"),           lastModified: now, changeFrequency: "yearly" as const, priority: 0.3 },
    { url: siteUrl("/shipping-policy"), lastModified: now, changeFrequency: "yearly" as const, priority: 0.3 },
    { url: siteUrl("/refund-policy"),   lastModified: now, changeFrequency: "yearly" as const, priority: 0.3 },
  ];
}
